import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { parse, serialize } from 'parse5';
import postcss from 'postcss';
import valueParser from 'postcss-value-parser';
import { assetPath, put } from './files.mjs';
import { scopeCss, collectCssNames } from './css.mjs';
import { php } from './config.mjs';

const remote = url => /^(?:[a-z][a-z\d+.-]*:|\/\/|#)/i.test(url);
export async function prepareAssets(dist, destination, inventory, config, { scoped = false } = {}) {
  const available = new Set(inventory);
  function resolve(url, from = 'index.html') {
    if (remote(url)) return null;
    const suffix = url.match(/[?#].*$/)?.[0] || '';
    const raw = url.split(/[?#]/)[0];
    const decoded = decodeURIComponent(raw);
    if (decoded.includes('\\') || decoded.includes('\0')) throw new Error('Ruta insegura: ' + url);
    const relative = decoded.startsWith('/') ? decoded.slice(1) : path.posix.join(path.posix.dirname(from), decoded);
    const name = assetPath(relative);
    if (!available.has(name) || /\.html?$/i.test(name)) throw new Error('Asset ausente o no estático: ' + url + ' en ' + from);
    return { name, suffix };
  }
  function relativeUrl(url, from) {
    const asset = resolve(url, from);
    if (!asset) return url;
    return './' + path.posix.relative(path.posix.dirname(from), asset.name) + asset.suffix;
  }
  const scope = 'bs-' + config.slug;
  const document = parse(await readFile(path.join(dist, 'index.html'), 'utf8'));
  const html = document.childNodes.find(n => n.tagName === 'html');
  const head = html.childNodes.find(n => n.tagName === 'head');
  const body = html.childNodes.find(n => n.tagName === 'body');
  const sources = await Promise.all(inventory.filter(f => f.endsWith('.css')).map(f => readFile(path.join(dist, f), 'utf8')));
  function inlineSources(node) {
    if (node.tagName === 'style') sources.push(serialize(node));
    for (const child of node.childNodes || []) inlineSources(child);
  }
  inlineSources(document);
  const names = scoped ? collectCssNames(sources, scope) : undefined;
  async function css(source, from, inline = false) {
    const ast = postcss.parse(source, { from: undefined, map: { prev: false } });
    ast.walkAtRules('import', rule => {
      if (scoped) throw new Error('Resolver @import en el build antes de embeber');
      const parsed = valueParser(rule.params);
      const node = parsed.nodes[0];
      if (node?.type === 'string') node.value = relativeUrl(node.value, from);
      else if (node?.type === 'function' && node.value === 'url') node.nodes[0].value = relativeUrl(node.nodes[0].value, from);
      rule.params = parsed.toString();
    });
    ast.walkDecls(d => {
      const value = valueParser(d.value);
      value.walk(node => {
        if (node.type === 'function' && node.value.toLowerCase() === 'url') {
          const token = node.nodes[0];
          if (token && !remote(token.value)) {
            if (inline) throw new Error('Mover URLs de CSS inline a una hoja compilada');
            token.value = relativeUrl(token.value, from);
          }
        }
      });
      d.value = value.toString();
    });
    ast.walkComments(c => { if (/sourceMappingURL/.test(c.text)) c.remove(); });
    const output = ast.toString();
    return scoped ? scopeCss(output, scope, names) : output;
  }
  for (const file of inventory) {
    if (/\.html?$/i.test(file)) continue;
    let content = await readFile(path.join(dist, file));
    if (file.endsWith('.css')) content = await css(content.toString(), file);
    if (/\.(m?js)$/.test(file)) {
      // Root-bound JS URLs cannot be safely rebased in arbitrary expressions.
      // Require Astro's relative build output; never silently ship broken imports.
      if (/['"`]\/(?:_astro|assets)\//.test(content.toString()))
        throw new Error('JS con URLs raíz en ' + file + ': compilar con base relativa o adaptar imports');
    }
    await put(destination, 'dist/' + file, content);
  }
  const tokens = new Map();
  function assetUrl(url) {
    const asset = resolve(url);
    if (!asset) return url;
    const token = 'BSASSET' + tokens.size + 'TOKEN';
    tokens.set(token, '<?php echo esc_url( ' + config.constPrefix + '_URL . ' + php('dist/' + asset.name + asset.suffix) + ' ); ?>');
    return token;
  }
  const styles = [];
  const scripts = [];
  async function walk(node) {
    for (const child of [...(node.childNodes || [])]) {
      if (child.tagName === 'base') throw new Error('Build no admite <base>');
      const attr = name => child.attrs?.find(a => a.name === name)?.value;
      if (child.tagName === 'link') {
        const rel = attr('rel') || '';
        if (rel === 'stylesheet') {
          const href = attr('href');
          if (!href || remote(href)) throw new Error('Empaquetar CSS externo antes de exportar fragmentos');
          if (attr('integrity')) throw new Error('Quitar/recalcular SRI del CSS reescrito');
          styles.push({ path: resolve(href).name, media: attr('media') || 'all' });
          node.childNodes.splice(node.childNodes.indexOf(child), 1);
          continue;
        }
        if (rel === 'modulepreload') { node.childNodes.splice(node.childNodes.indexOf(child), 1); continue; }
      }
      if (child.tagName === 'style') {
        const name = 'assets/inline-' + styles.length + '.css';
        if (available.has(name)) throw new Error('Colisión de asset generado: ' + name);
        await put(destination, 'dist/' + name, await css(serialize(child), 'index.html', true));
        styles.push({ path: name, media: attr('media') || 'all' });
        node.childNodes.splice(node.childNodes.indexOf(child), 1); continue;
      }
      if (child.tagName === 'script' && attr('src')) {
        const src = attr('src');
        if (remote(src)) throw new Error('Empaquetar JS externo antes de exportar fragmentos');
        if (attr('integrity')) throw new Error('SRI de JS requiere revisión');
        const type = attr('type') || 'text/javascript';
        if (!['module', 'text/javascript', 'application/javascript'].includes(type)) throw new Error('Tipo de script no soportado');
        scripts.push({ path: resolve(src).name, module: type === 'module' });
        node.childNodes.splice(node.childNodes.indexOf(child), 1); continue;
      }
      if (child.tagName === 'script' && /['"`]\/(?:_astro|assets)\//.test(serialize(child))) {
        throw new Error('Script inline con URL raíz: adaptar assets/imports en Astro antes de embeber');
      }
      for (const a of child.attrs || []) {
        if (['src','poster','component-url','renderer-url','before-hydration-url'].includes(a.name) || (a.name === 'href' && child.tagName === 'link')) a.value = assetUrl(a.value);
        else if (/^\/(?:assets|_astro)\//.test(a.value)) a.value = assetUrl(a.value);
        if (a.name === 'srcset') {
          if (a.value.includes('data:')) throw new Error('srcset data: debe moverse a archivos');
          a.value = a.value.split(',').map(part => {
            const [url, ...descriptor] = part.trim().split(/\s+/);
            return [assetUrl(url), ...descriptor].join(' ');
          }).join(', ');
        }
        if (a.name === 'style' && /url\(/i.test(a.value)) throw new Error('Mover style=url inline a CSS compilado');
      }
      await walk(child);
    }
  }
  await walk(head); await walk(body);
  // Do not transplant document metadata into another page.
  const headScript = (head.childNodes || []).filter(n => n.tagName === 'script').map(n => serialize({ childNodes: [n] })).join('');
  let fragment = headScript + serialize(body);
  for (const [token, value] of tokens) fragment = fragment.replaceAll(token, value);
  const classes = [...(html.attrs || []), ...(body.attrs || [])].filter(a => a.name === 'class').map(a => a.value).join(' ');
  return { fragment, styles, scripts, scope, classes };
}
