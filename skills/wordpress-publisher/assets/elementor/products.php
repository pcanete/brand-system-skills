<?php
defined( 'ABSPATH' ) || exit;

/** Read-only GET filters. No mutation, hence no action nonce is required. */
function {{fn_prefix}}_product_filters( $settings, $key ) {
  $read = function( $name, $default = '' ) use ( $key ) {
    $value = $_GET[ $key . '-' . $name ] ?? $default;
    return is_scalar( $value ) ? sanitize_text_field( wp_unslash( (string) $value ) ) : '';
  };
  $enabled = ( $settings['filters'] ?? '' ) === 'yes';
  $out = array();
  foreach ( array( 'category', 'tag', 'term' ) as $name ) {
    $default = isset( $settings[$name] ) && is_scalar( $settings[$name] ) ? (string) $settings[$name] : '';
    $out[$name] = sanitize_title( $enabled ? $read( $name, $default ) : $default );
  }
  $out['attribute'] = isset( $settings['attribute'] ) && is_string( $settings['attribute'] ) ? sanitize_key( $settings['attribute'] ) : '';
  $out['search'] = $enabled ? substr( $read( 'search' ), 0, 200 ) : '';
  foreach ( array( 'min', 'max' ) as $name ) {
    $value = $enabled ? $read( $name ) : '';
    $out[$name] = $value !== '' && is_numeric( $value ) ? min( 1000000000, max( 0, (float) $value ) ) : '';
  }
  if ( $out['min'] !== '' && $out['max'] !== '' && $out['min'] > $out['max'] ) {
    $value = $out['min']; $out['min'] = $out['max']; $out['max'] = $value;
  }
  $order = $enabled ? $read( 'order', 'date' ) : 'date';
  $out['order'] = in_array( $order, array( 'date', 'title', 'price', 'price-desc' ), true ) ? $order : 'date';
  $out['page'] = min( 10000, max( 1, absint( $read( 'page', 1 ) ) ) );
  return $out;
}

/** Official WC query API plus an explicitly scoped CPT adapter for filters. */
function {{fn_prefix}}_products( $settings, $filters ) {
  // Do not silently ignore filters if a future/custom product store replaces CPT.
  $store = WC_Data_Store::load( 'product' );
  if ( ! is_a( $store->get_current_class_name(), 'WC_Product_Data_Store_CPT', true ) ) {
    return new WP_Error( 'unsupported_store', 'El catálogo requiere adaptar los filtros al almacén de productos activo.' );
  }
  $limit = isset( $settings['limit'] ) && is_scalar( $settings['limit'] ) ? absint( $settings['limit'] ) : 12;
  return wc_get_products( array(
    'status' => 'publish', 'visibility' => 'catalog', 'paginate' => true,
    'limit' => min( 48, max( 1, $limit ) ), 'page' => $filters['page'],
    'category' => $filters['category'] ? array( $filters['category'] ) : array(),
    'tag' => $filters['tag'] ? array( $filters['tag'] ) : array(),
    'stock_status' => get_option( 'woocommerce_hide_out_of_stock_items' ) === 'yes' ? 'instock' : '',
    '{{fn_prefix}}_filters' => $filters,
  ) );
}

add_filter( 'woocommerce_product_data_store_cpt_get_products_query', function( $query, $vars ) {
  if ( ! isset( $vars['{{fn_prefix}}_filters'] ) ) return $query;
  $filters = $vars['{{fn_prefix}}_filters'];
  $query['has_password'] = false;
  if ( $filters['search'] !== '' ) $query['s'] = $filters['search'];
  if ( strpos( $filters['attribute'], 'pa_' ) === 0 && taxonomy_exists( $filters['attribute'] ) && $filters['term'] ) {
    $query['tax_query'][] = array( 'taxonomy' => $filters['attribute'], 'field' => 'slug', 'terms' => array( $filters['term'] ) );
  }
  foreach ( array( 'min' => '>=', 'max' => '<=' ) as $name => $compare ) {
    if ( $filters[$name] !== '' ) $query['meta_query'][] = array( 'key' => '_price', 'value' => $filters[$name], 'compare' => $compare, 'type' => 'DECIMAL(20,6)' );
  }
  $query['order'] = in_array( $filters['order'], array( 'title', 'price' ), true ) ? 'ASC' : 'DESC';
  $query['orderby'] = $filters['order'] === 'title' ? 'title' : 'date';
  if ( strpos( $filters['order'], 'price' ) === 0 ) {
    $query['meta_key'] = '_price'; $query['orderby'] = 'meta_value_num';
  }
  return $query;
}, 10, 2 );

function {{fn_prefix}}_filter_form( $filters, $key ) {
  echo '<form method="get" action="' . esc_url( get_permalink() ) . '">';
  // Browsers replace action query strings on GET; preserve plain permalink routing.
  if ( ! get_option( 'permalink_structure' ) ) echo '<input type="hidden" name="page_id" value="' . esc_attr( get_queried_object_id() ) . '">';
  foreach ( array( 'search' => 'Buscar', 'min' => 'Precio mínimo', 'max' => 'Precio máximo' ) as $name => $label ) {
    $type = $name === 'search' ? 'search' : 'number';
    echo '<label>' . esc_html( $label ) . '<input type="' . esc_attr( $type ) . '" name="' . esc_attr( $key . '-' . $name ) . '" value="' . esc_attr( $filters[$name] ) . '"' . ( $type === 'number' ? ' min="0" step="0.01"' : '' ) . '></label>';
  }
  $taxonomies = array( 'category' => 'product_cat', 'tag' => 'product_tag' );
  if ( strpos( $filters['attribute'], 'pa_' ) === 0 && taxonomy_exists( $filters['attribute'] ) ) $taxonomies['term'] = $filters['attribute'];
  foreach ( $taxonomies as $name => $taxonomy ) {
    $terms = get_terms( array( 'taxonomy' => $taxonomy, 'hide_empty' => true, 'number' => 200 ) );
    if ( is_wp_error( $terms ) ) continue;
    echo '<label>' . esc_html( $taxonomy ) . '<select name="' . esc_attr( $key . '-' . $name ) . '"><option value="">Todos</option>';
    foreach ( $terms as $term ) echo '<option value="' . esc_attr( $term->slug ) . '"' . selected( $filters[$name], $term->slug, false ) . '>' . esc_html( $term->name ) . '</option>';
    echo '</select></label>';
  }
  echo '<label>Orden<select name="' . esc_attr( $key . '-order' ) . '">';
  foreach ( array( 'date' => 'Recientes', 'title' => 'Nombre', 'price' => 'Menor precio', 'price-desc' => 'Mayor precio' ) as $value => $label ) echo '<option value="' . esc_attr( $value ) . '"' . selected( $filters['order'], $value, false ) . '>' . esc_html( $label ) . '</option>';
  echo '</select></label><button type="submit">Filtrar</button></form>';
}
