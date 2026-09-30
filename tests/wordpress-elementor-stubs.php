<?php
namespace Elementor;
class Controls_Manager { const TEXT='text'; const WYSIWYG='wysiwyg'; const REPEATER='repeater'; const NUMBER='number'; const SWITCHER='switcher'; }
class Repeater { function add_control(...$args) {} function get_controls() { return array(); } }
class Widget_Base {
  function start_controls_section(...$args) {} function end_controls_section() {} function add_control(...$args) {}
  function get_settings_for_display() { return array('items'=>array(array('question'=>'<script>FAQ question</script>','answer'=>'<script>bad</script><p>answer</p>'))); }
  function get_id() { return 'test'; }
  function output() { $this->render(); } function controls() { $this->register_controls(); }
}
