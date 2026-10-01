<?php
defined( 'ABSPATH' ) || exit;
class {{CLASS}}_FAQ extends \Elementor\Widget_Base {
  public function get_name() { return '{{slug}}-faq'; }
  public function get_title() { return 'FAQ'; }
  public function get_icon() { return 'eicon-accordion'; }
  public function get_categories() { return array( '{{slug}}' ); }
  public function get_style_depends() { return array( '{{slug}}-widgets' ); }
  protected function register_controls() {
    $this->start_controls_section( 'content', array( 'label' => 'FAQ' ) );
    $items = new \Elementor\Repeater();
    $items->add_control( 'question', array( 'label' => 'Pregunta', 'type' => \Elementor\Controls_Manager::TEXT, 'default' => 'Pregunta' ) );
    $items->add_control( 'answer', array( 'label' => 'Respuesta', 'type' => \Elementor\Controls_Manager::WYSIWYG, 'default' => '' ) );
    $this->add_control( 'items', array( 'label' => 'Preguntas', 'type' => \Elementor\Controls_Manager::REPEATER,
      'fields' => $items->get_controls(), 'title_field' => '{{{ question }}}',
      'default' => array( array( 'question' => '¿Cómo funciona?', 'answer' => 'Editá esta respuesta.' ) ) ) );
    $this->end_controls_section();
  }
  protected function render() {
    $settings = $this->get_settings_for_display();
    $items = isset( $settings['items'] ) && is_array( $settings['items'] ) ? $settings['items'] : array();
    echo '<section class="bs-{{slug}} bs-faq">';
    foreach ( array_slice( $items, 0, 100 ) as $item ) {
      if ( ! is_array( $item ) ) continue;
      $question = isset( $item['question'] ) && is_scalar( $item['question'] ) ? sanitize_text_field( (string) $item['question'] ) : '';
      $answer = isset( $item['answer'] ) && is_scalar( $item['answer'] ) ? (string) $item['answer'] : '';
      echo '<details><summary>' . esc_html( $question ) . '</summary><div>' . wp_kses_post( $answer ) . '</div></details>';
    }
    echo '</section>';
  }
}
