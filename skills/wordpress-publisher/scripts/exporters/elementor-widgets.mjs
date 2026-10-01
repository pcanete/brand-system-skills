import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { put } from '../lib/files.mjs';
import { header, activation } from '../lib/plugin.mjs';
import { php } from '../lib/config.mjs';
export async function elementorWidgets({ pluginDir, config: c }) {
  const f = c.fnPrefix, k = c.constPrefix, cls = 'BS_' + k;
  const template = async name => (await readFile(fileURLToPath(new URL('../../assets/elementor/' + name, import.meta.url)), 'utf8'))
    .replaceAll('{{slug}}', c.slug).replaceAll('{{fn_prefix}}', f).replaceAll('{{CLASS}}', cls);
  for (const widget of c.elementor.widgets) await put(pluginDir, 'widgets/' + widget + '.php', await template(widget + '.php'));
  if (c.elementor.widgets.includes('product-grid')) await put(pluginDir, 'includes/products.php', await template('products.php'));
  await put(pluginDir, 'assets/widgets.css', await template('widgets.css'));
  await put(pluginDir, c.slug + '.php', header(c) + `
add_action( 'plugins_loaded', function() {
  if ( ! did_action( 'elementor/loaded' ) || ! class_exists( '\\Elementor\\Widget_Base' ) ) {
    add_action( 'admin_notices', function() {
      if ( current_user_can( 'activate_plugins' ) ) echo '<div class="notice notice-warning"><p>' . esc_html__( 'Este plugin necesita Elementor activo. El resto del sitio sigue disponible.', '${c.slug}' ) . '</p></div>';
    } );
    return;
  }
  ${c.elementor.widgets.includes('product-grid') ? "require_once " + k + "_PATH . 'includes/products.php';" : ''}
  add_action( 'elementor/elements/categories_registered', function( $manager ) {
    $manager->add_category( '${c.slug}', array( 'title' => ${php(c.elementor.category)}, 'icon' => 'fa fa-puzzle-piece' ) );
  } );
  add_action( 'elementor/frontend/after_register_styles', function() {
    wp_register_style( '${c.slug}-widgets', ${k}_URL . 'assets/widgets.css', array(), ${k}_VERSION );
  } );
  add_action( 'elementor/widgets/register', function( $manager ) {
${c.elementor.widgets.map(w => `    require_once ${k}_PATH . 'widgets/${w}.php';
    $manager->register( new ${cls}_${w === 'faq' ? 'FAQ' : 'Product_Grid'}() );`).join('\n')}
  } );
}, 20 );
` + activation(c));
}
