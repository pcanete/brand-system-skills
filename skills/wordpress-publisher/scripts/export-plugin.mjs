#!/usr/bin/env node
import { readFile, rm, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { createHash } from 'node:crypto';
import { resolveConfig, php } from './lib/config.mjs';
import { auditDist, files, put, safeDestination, assetPath } from './lib/files.mjs';
import { exportPlugin as frontPage } from './exporters/front-page.mjs';
import { pageTemplate } from './exporters/page-template.mjs';
import { embeddedPage } from './exporters/embedded-page.mjs';
import { elementorWidgets } from './exporters/elementor-widgets.mjs';
import { auditAssetReferences } from './lib/audit-assets.mjs';
export { resolveConfig };
const exporters = { 'front-page': frontPage, 'page-template': pageTemplate, 'embedded-page': embeddedPage, 'elementor-widgets': elementorWidgets };
export async function exportPlugin({ projectRoot, config: raw }) {
  const config = resolveConfig(raw);
  projectRoot = path.resolve(projectRoot);
  const pluginDir = path.join(projectRoot, 'wordpress/build', config.slug);
  await safeDestination(projectRoot, config.slug);
  let inventory = [];
  if (config.mode !== 'elementor-widgets') {
    inventory = await auditDist(path.join(projectRoot, 'dist'));
    await auditAssetReferences(path.join(projectRoot, 'dist'), inventory, {
      fullPage: config.mode === 'front-page' || (config.mode === 'page-template' && config.template.layout === 'canvas'),
      headOwnership: config.headOwnership,
    });
    // Legacy keeps its layout and URL rules. Close traversal and missing CSS
    // asset gaps before its existing writer touches the generated directory.
    for (const file of inventory.filter(f => /\.(html|css)$/.test(f))) {
      const source = await readFile(path.join(projectRoot, 'dist', file), 'utf8');
      for (const match of source.matchAll(/(?:["'(\s])\/(?:assets|_astro)\/[^\s"'<>)]*/g)) {
        const url = match[0].slice(1);
        const target = assetPath(url);
        if (!inventory.includes(target)) throw new Error('Asset inexistente: ' + url);
      }
    }
  }
  if (await files(pluginDir).catch(e => { if (e.code === 'ENOENT') return null; throw e; })) {
    // Exact validated generated target only; never a source or workspace root.
    await rm(pluginDir, { recursive: true });
  }
  await mkdir(pluginDir, { recursive: true });
  const exported = await exporters[config.mode]({ projectRoot, pluginDir, config, inventory });
  const legacy = config.mode === 'front-page' || (config.mode === 'page-template' && config.template.layout === 'canvas');
  if (!legacy) {
    const required = await files(pluginDir);
    await put(pluginDir, 'required-assets.php', "<?php\ndefined( 'ABSPATH' ) || exit;\nreturn array(\n" + required.map(f => '  ' + php(f) + ',').join('\n') + "\n);\n");
  }
  if (config.mode !== 'front-page') await put(pluginDir, 'readme.txt',
    config.name + '\nMode: ' + config.mode + '\nVersion: ' + config.version +
    '\nProbar en staging antes de activar. Asignar la plantilla, insertar el shortcode o agregar widgets según el modo. Desactivar no elimina contenido.\n');
  const packaged = await files(pluginDir);
  const hashes = {};
  let bytes = 0;
  for (const file of packaged) {
    const content = await readFile(path.join(pluginDir, file));
    hashes[file] = createHash('sha256').update(content).digest('hex');
    bytes += content.length;
  }
  const manifest = { schema: 1, mode: config.mode, config, files: hashes };
  const manifestText = JSON.stringify(manifest, null, 2) + '\n';
  await put(pluginDir, 'integration.json', manifestText);
  bytes += Buffer.byteLength(manifestText);
  const report = { ...exported?.report, plugin: config.slug, version: config.version, mode: config.mode, packagedFiles: packaged.length + 1,
    packagedBytes: bytes, referencedAssets: exported?.report?.referencedAssets ?? inventory.length, generatedAt: new Date().toISOString(),
    limitations: config.mode === 'elementor-widgets' ? ['Domain widgets; no automatic design conversion', 'Product filters: WooCommerce CPT store adapter'] : ['Visual and live WordPress QA required'] };
  await put(path.dirname(pluginDir), 'wordpress-export-report.json', JSON.stringify(report, null, 2) + '\n');
  return { pluginDir, report };
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const arg = (name, fallback) => { const i = process.argv.indexOf('--' + name); return i < 0 ? fallback : process.argv[i + 1]; };
  const projectRoot = path.resolve(arg('project', '.'));
  exportPlugin({ projectRoot, config: JSON.parse(await readFile(path.resolve(projectRoot, arg('config', 'wordpress.config.json')), 'utf8')) })
    .then(r => console.log('Plugin exportado: ' + r.pluginDir)).catch(e => { console.error(e.message); process.exitCode = 1; });
}
