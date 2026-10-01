import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { parse } from 'parse5';
import postcss from 'postcss';
import valueParser from 'postcss-value-parser';
import { assetPath } from './files.mjs';

// Validate transitive local references, including CSS imports and relative URLs.
// Full-page keeps its legacy URL mapper; reject forms it cannot rebase instead
// of shipping a plugin that depends on the installation path of WordPress.
export async function auditAssetReferences(dist, inventory, { fullPage = false, headOwnership = 'wordpress' } = {}) {
  const available = new Set(inventory);
  function check(url, from, html = false) {
    if (!url || /^(?:[a-z][a-z\d+.-]*:|\/\/|#)/i.test(url)) return;
    const decoded = decodeURIComponent(url.split(/[?#]/)[0]);
    if (decoded.includes('\\')) throw new Error('Ruta insegura: ' + url);
    const name = assetPath(decoded.startsWith('/') ? decoded.slice(1) : path.posix.join(path.posix.dirname(from), decoded));
    if (!available.has(name)) throw new Error('Asset inexistente: ' + url + ' en ' + from);
    if (fullPage && (html || decoded.startsWith('/')) && !/^\/(assets|_astro)\//.test(url))
      throw new Error('El exportador de documento requiere assets HTML/raíz bajo /assets o /_astro: ' + url);
  }
  for (const file of inventory) {
    if (file.endsWith('.css')) {
      const root=postcss.parse(await readFile(path.join(dist,file),'utf8'),{from:undefined,map:{prev:false}});
      root.walkDecls(d=>valueParser(d.value).walk(n=>{
        if(n.type==='function' && n.value.toLowerCase()==='url') check(n.nodes[0]?.value,file);
      }));
      root.walkAtRules('import',r=>{
        const n=valueParser(r.params).nodes[0];
        if(n?.type==='string') check(n.value,file);
        else if(n?.value==='url') check(n.nodes[0]?.value,file);
      });
    }
    if (file === 'index.html') {
      function walk(n) {
        const attrs=Object.fromEntries((n.attrs||[]).map(a=>[a.name,a.value]));
        for (const key of ['src','poster','component-url','renderer-url','before-hydration-url']) if(attrs[key]) check(attrs[key],file,true);
        const ownedIcon = fullPage && headOwnership === 'wordpress' && /^(icon|shortcut icon)$/.test(attrs.rel||'');
        if(n.tagName==='link' && !ownedIcon && /^(stylesheet|icon|shortcut icon|modulepreload|preload)$/.test(attrs.rel||'')) check(attrs.href,file,true);
        if(attrs.srcset && !attrs.srcset.includes('data:')) for(const item of attrs.srcset.split(',')) check(item.trim().split(/\s+/)[0],file,true);
        for(const child of n.childNodes||[]) walk(child);
      }
      walk(parse(await readFile(path.join(dist,file),'utf8')));
    }
  }
}
