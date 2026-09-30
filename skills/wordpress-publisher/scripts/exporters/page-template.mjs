import { readFile, rename } from 'node:fs/promises';
import path from 'node:path';
import { exportPlugin as frontPage } from './front-page.mjs';
import { embeddedPage } from './embedded-page.mjs';
import { put } from '../lib/files.mjs';
import { php } from '../lib/config.mjs';
export async function pageTemplate(context) {
  const { config: c, pluginDir } = context;
  const f = c.fnPrefix, key = c.slug + '/generated-page.php';
  const selected = "is_page() && get_page_template_slug( get_queried_object_id() ) === " + php(key);
  const eligible = "! is_admin() && ! wp_doing_ajax() && ! is_feed() && ! is_embed() && ! is_search() && ! post_password_required() && (" + selected + ")";
  if (c.template.layout === 'canvas') {
    await frontPage(context);
    let main = await readFile(path.join(pluginDir, c.slug + '.php'), 'utf8');
    main = main.replaceAll('is_front_page()', f + '_selected()').replaceAll('templates/front-page.php', 'templates/page.php');
    await rename(path.join(pluginDir, 'templates/front-page.php'), path.join(pluginDir, 'templates/page.php'));
    await put(pluginDir, c.slug + '.php', main + '\nfunction ' + f + '_selected() { return ' + eligible + '; }\n');
  } else {
    await embeddedPage(context);
    let main = await readFile(path.join(pluginDir, c.slug + '.php'), 'utf8');
    main = main.replace(/add_shortcode\([^\n]+\n/, '');
    main += `
function ${f}_selected() { return ${eligible}; }
add_filter( 'template_include', function( $template ) {
  $generated = ${c.constPrefix}_PATH . 'templates/page.php';
  return ${f}_selected() && is_readable( $generated ) ? $generated : $template;
}, PHP_INT_MAX );
`;
    await put(pluginDir, c.slug + '.php', main);
    await put(pluginDir, 'templates/page.php', `<?php
defined( 'ABSPATH' ) || exit;
get_header();
echo ${f}_render();
get_footer();
`);
  }
  let main = await readFile(path.join(pluginDir, c.slug + '.php'), 'utf8');
  main += `
add_filter( 'theme_page_templates', function( $templates ) {
  $templates[ ${php(key)} ] = ${php(c.template.name)};
  return $templates;
} );
`;
  await put(pluginDir, c.slug + '.php', main);
}
