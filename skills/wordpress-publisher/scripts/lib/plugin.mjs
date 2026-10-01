import { php } from './config.mjs';
export function header(c) {
  return `<?php
/**
 * Plugin Name: ${c.name}
 * Description: ${c.description}
 * Version: ${c.version}
 * Requires at least: 6.2
 * Requires PHP: 7.4
 * Author: ${c.author}
 * Text Domain: ${c.slug}
 */
defined( 'ABSPATH' ) || exit;
define( '${c.constPrefix}_VERSION', '${c.version}' );
define( '${c.constPrefix}_PATH', plugin_dir_path( __FILE__ ) );
define( '${c.constPrefix}_URL', plugin_dir_url( __FILE__ ) );
`;
}
export function activation(c) {
  return `
function ${c.fnPrefix}_activate() {
  if ( ! is_file( ${c.constPrefix}_PATH . 'required-assets.php' ) ) {
    wp_die( esc_html__( 'Falta el inventario del paquete. Volvé a exportar.', '${c.slug}' ) );
  }
  $files = require ${c.constPrefix}_PATH . 'required-assets.php';
  foreach ( $files as $file ) {
    if ( ! is_file( ${c.constPrefix}_PATH . $file ) ) {
      deactivate_plugins( plugin_basename( __FILE__ ) );
      wp_die( esc_html__( 'Paquete incompleto. Volvé a exportar.', '${c.slug}' ) );
    }
  }
}
register_activation_hook( __FILE__, '${c.fnPrefix}_activate' );
`;
}
export function renderer(c, assets) {
  const f = c.fnPrefix, k = c.constPrefix;
  return `
function ${f}_render( $attributes = array() ) {
  $attributes = shortcode_atts( array( 'id' => ${php(c.embedded.id)} ), $attributes );
  if ( ! is_string( $attributes['id'] ) || $attributes['id'] !== ${php(c.embedded.id)} ) return '';
  if ( ! is_readable( ${k}_PATH . 'generated/${c.embedded.id}/fragment.php' ) ) return '';
  ob_start();
${assets.styles.map((s,i) => `  wp_enqueue_style( '${c.slug}-${i}', ${k}_URL . ${php('dist/' + s.path)}, array(), ${k}_VERSION, ${php(s.media)} );
  // Also handles shortcodes rendered after wp_head (Elementor content/widgets).
  wp_print_styles( array( '${c.slug}-${i}' ) );`).join('\n')}
${assets.scripts.map((s,i) => `  wp_enqueue_script( '${c.slug}-script-${i}', ${k}_URL . ${php('dist/' + s.path)}, array(), ${k}_VERSION, true );`).join('\n')}
  require ${k}_PATH . 'generated/${c.embedded.id}/fragment.php';
  return ob_get_clean();
}
${assets.scripts.some(s=>s.module) ? `add_filter( 'script_loader_tag', function( $tag, $handle ) {
  if ( in_array( $handle, array( ${assets.scripts.flatMap((s,i)=>s.module?[php(c.slug+'-script-'+i)]:[]).join(', ')} ), true ) ) {
    $tag = preg_replace( '/\\s+type=(["\\\']).*?\\1/i', '', $tag );
    return str_replace( '<script ', '<script type="module" ', $tag );
  }
  return $tag;
}, 10, 2 );` : ''}
`;
}
