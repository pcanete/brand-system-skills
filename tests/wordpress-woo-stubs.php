<?php
// Small fake Woo store to prove runtime API use, not database integration.
class WC_Product_Data_Store_CPT {}
class WC_Data_Store { static function load($type) { return new self(); } function get_current_class_name() { return 'WC_Product_Data_Store_CPT'; } }
class WP_Error { private $message; function __construct($code,$message) { $this->message=$message; } function get_error_message() { return $this->message; } }
class Fake_Product {
  function is_visible() { return true; }
  function get_permalink() { return 'https://fixture.example.invalid/product/live'; }
  function get_image($size) { return '<p>Product image</p>'; }
  function get_name() { return $GLOBALS['live_product_name']; }
  function get_price_html() { return '<strong>42</strong>'; }
}
function wc_get_products($args) { $GLOBALS['last_query']=$args; return (object)array('products'=>array(new Fake_Product()),'total'=>1,'max_num_pages'=>1); }
function is_wp_error($value) { return $value instanceof WP_Error; }
function get_option($name) { return ''; }
function taxonomy_exists($name) { return true; }
