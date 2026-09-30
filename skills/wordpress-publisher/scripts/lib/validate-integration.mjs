import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { files, assetPath } from './files.mjs';
import { resolveConfig, php } from './config.mjs';
import { assertScopedCss } from './css.mjs';
export async function validateIntegration(root, manifest) {
  const issues = [];
  let c;
  try { c = resolveConfig(manifest.config); } catch (e) { return [e.message]; }
  if (manifest.schema !== 1 || manifest.mode !== c.mode || c.slug !== path.basename(root)) return ['Manifiesto de integración inválido'];
  const packaged = await files(root);
  if (!manifest.files || typeof manifest.files !== 'object') return ['Inventario inválido'];
  for (const [name, hash] of Object.entries(manifest.files)) {
    try {
      if (assetPath(name) !== name || !packaged.includes(name)) { issues.push('Archivo ausente/inseguro: ' + name); continue; }
      const content = await readFile(path.join(root, name));
      if (createHash('sha256').update(content).digest('hex') !== hash) issues.push('Artefacto modificado: ' + name + '; regenerar desde la fuente');
    } catch (e) { issues.push(e.message); }
  }
  for (const name of packaged) if (name !== 'integration.json' && !Object.hasOwn(manifest.files, name)) issues.push('Archivo no declarado: ' + name);
  const main = await readFile(path.join(root, c.slug + '.php'), 'utf8').catch(() => '');
  if (c.mode === 'embedded-page' || c.mode === 'elementor-widgets' || (c.mode === 'page-template' && c.template.layout === 'theme')) {
    for (const file of packaged.filter(f => f.endsWith('.css'))) {
      try { assertScopedCss(await readFile(path.join(root, file), 'utf8'), 'bs-' + c.slug); }
      catch (e) { issues.push(file + ': ' + e.message); }
    }
  }
  const required = (text, marker, label = marker) => { if (!text.includes(marker)) issues.push('Falta ' + label); };
  required(main, 'Version: ' + c.version);
  required(main, "defined( 'ABSPATH' ) || exit");
  required(main, 'register_activation_hook');
  for (const file of packaged.filter(f => f.endsWith('.php'))) {
    const source = await readFile(path.join(root,file), 'utf8');
    required(source, "defined( 'ABSPATH' ) || exit", file + ': ABSPATH');
    if (/\{\{(?:slug|CLASS|fn_prefix|CONST_PREFIX|PLUGIN_\w+)\}\}/.test(source)) issues.push('Marcadores sin renderizar: ' + file);
    if (/(?:src|href)=["']\/(?:_astro|assets)\//.test(source)) issues.push('URL raíz sin resolver: ' + file);
  }
  if (c.mode === 'page-template') {
    required(main, 'theme_page_templates'); required(main, 'get_page_template_slug'); required(main, 'is_page()');
    required(main, 'is_admin()'); required(main, 'wp_doing_ajax()'); required(main, 'post_password_required()');
    required(main, php(c.template.name));
    const template = await readFile(path.join(root, 'templates/page.php'), 'utf8').catch(() => '');
    for (const hook of c.template.layout === 'canvas' ? ['wp_head()', 'wp_body_open()', 'wp_footer()'] : ['get_header()', 'get_footer()']) required(template, hook);
  }
  if (c.mode === 'embedded-page' || (c.mode === 'page-template' && c.template.layout === 'theme')) {
    required(main, c.fnPrefix + '_render'); required(main, 'shortcode_atts');
    if (c.mode === 'embedded-page') required(main, 'add_shortcode');
    if (/wp_dequeue_style|template_include/.test(main) && c.mode === 'embedded-page') issues.push('Embedded no debe interceptar templates ni desencolar CSS');
    const fragment = await readFile(path.join(root, 'generated', c.embedded.id, 'fragment.php'), 'utf8').catch(() => '');
    required(fragment, 'bs-' + c.slug);
    if (/<(?:html|head|body)\b/i.test(fragment)) issues.push('Embedded contiene documento completo');
  }
  if (c.mode === 'elementor-widgets') {
    for (const marker of ['elementor/loaded', 'class_exists', 'elementor/widgets/register', 'elementor/elements/categories_registered', 'wp_register_style']) required(main, marker);
    for (const w of c.elementor.widgets) {
      const widget = await readFile(path.join(root, 'widgets', w + '.php'), 'utf8').catch(() => '');
      for (const marker of ['Widget_Base', 'register_controls', 'get_style_depends', 'esc_html', 'bs-' + c.slug]) required(widget, marker, w + ': ' + marker);
      if (w === 'product-grid') required(widget, "function_exists( 'wc_get_products' )");
    }
  }
  return issues;
}
