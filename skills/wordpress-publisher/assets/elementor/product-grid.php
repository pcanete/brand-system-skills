<?php
defined( 'ABSPATH' ) || exit;
class {{CLASS}}_Product_Grid extends \Elementor\Widget_Base {
  public function get_name() { return '{{slug}}-product-grid'; }
  public function get_title() { return 'Product Grid + Filters'; }
  public function get_icon() { return 'eicon-products'; }
  public function get_categories() { return array( '{{slug}}' ); }
  public function get_style_depends() { return array( '{{slug}}-widgets' ); }
  protected function is_dynamic_content(): bool { return true; }
  protected function register_controls() {
    $this->start_controls_section( 'catalog', array( 'label' => 'Catálogo WooCommerce' ) );
    foreach ( array( 'category' => 'Categoría inicial (slug)', 'tag' => 'Tag inicial (slug)', 'attribute' => 'Atributo global (ej. pa_color)', 'term' => 'Valor inicial del atributo (slug)' ) as $key => $label ) {
      $this->add_control( $key, array( 'label' => $label, 'type' => \Elementor\Controls_Manager::TEXT, 'default' => '' ) );
    }
    $this->add_control( 'limit', array( 'label' => 'Productos por página', 'type' => \Elementor\Controls_Manager::NUMBER, 'default' => 12, 'min' => 1, 'max' => 48 ) );
    $this->add_control( 'filters', array( 'label' => 'Mostrar filtros', 'type' => \Elementor\Controls_Manager::SWITCHER, 'default' => 'yes' ) );
    $this->end_controls_section();
  }
  protected function render() {
    if ( ! function_exists( 'wc_get_products' ) ) {
      if ( current_user_can( 'edit_posts' ) ) echo '<p>' . esc_html__( 'Este widget requiere WooCommerce.', '{{slug}}' ) . '</p>';
      return;
    }
    $settings = $this->get_settings_for_display();
    $key = '{{slug}}-' . sanitize_key( $this->get_id() );
    $filters = {{fn_prefix}}_product_filters( $settings, $key );
    $result = {{fn_prefix}}_products( $settings, $filters );
    if ( is_wp_error( $result ) ) {
      if ( current_user_can( 'edit_posts' ) ) echo '<p>' . esc_html( $result->get_error_message() ) . '</p>';
      return;
    }
    echo '<section class="bs-{{slug}} bs-catalog">';
    if ( ( $settings['filters'] ?? '' ) === 'yes' ) {{fn_prefix}}_filter_form( $filters, $key );
    echo '<p role="status">' . esc_html( (string) $result->total ) . ' productos</p><div class="bs-products">';
    foreach ( $result->products as $product ) {
      if ( ! $product->is_visible() ) continue;
      echo '<article><a href="' . esc_url( $product->get_permalink() ) . '">';
      echo wp_kses_post( $product->get_image( 'woocommerce_thumbnail' ) );
      echo '<h3>' . esc_html( $product->get_name() ) . '</h3></a>';
      echo '<div class="bs-price">' . wp_kses_post( $product->get_price_html() ) . '</div>';
      // Product page handles variable/grouped/external products and purchasing.
      echo '<a href="' . esc_url( $product->get_permalink() ) . '">' . esc_html__( 'Ver producto', '{{slug}}' ) . '</a></article>';
    }
    echo '</div><nav aria-label="Paginación de productos">';
    if ( $filters['page'] > 1 ) echo '<a href="' . esc_url( add_query_arg( $key . '-page', $filters['page'] - 1 ) ) . '">Anterior</a> ';
    if ( $filters['page'] < $result->max_num_pages ) echo '<a href="' . esc_url( add_query_arg( $key . '-page', $filters['page'] + 1 ) ) . '">Siguiente</a>';
    echo '</nav></section>';
  }
}
