import path from 'node:path';
import { prepareAssets } from '../lib/assets.mjs';
import { put } from '../lib/files.mjs';
import { header, activation, renderer } from '../lib/plugin.mjs';
export async function embeddedPage({ projectRoot, pluginDir, config, inventory }) {
  const assets = await prepareAssets(path.join(projectRoot, 'dist'), pluginDir, inventory, config, { scoped: true });
  const classes = (assets.scope + ' ' + assets.classes).replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;');
  await put(pluginDir, 'generated/' + config.embedded.id + '/fragment.php',
    '<?php defined( \'ABSPATH\' ) || exit; ?>\n<div class="' + classes + '">' + assets.fragment + '</div>');
  const code = header(config) + renderer(config, assets) +
    "\nadd_shortcode( '" + config.slug.replaceAll('-', '_') + "_page', '" + config.fnPrefix + "_render' );\n" + activation(config);
  await put(pluginDir, config.slug + '.php', code);
}
