<?php
// Isolated API-contract harness; not a WordPress/Elementor installation.
define( 'ABSPATH', __DIR__ );
$plugin = $argv[1]; $scenario = $argv[2]; $hooks = array(); $styles = array(); $scripts = array();
function add_action($name,$callback,$priority=10,$args=1) { $GLOBALS['hooks'][$name][] = $callback; }
function add_filter($name,$callback,$priority=10,$args=1) { add_action($name,$callback,$priority,$args); }
function fire($name,...$args) { foreach($GLOBALS['hooks'][$name]??array() as $fn) $fn(...$args); }
function filtered($name,$value,...$args) { foreach($GLOBALS['hooks'][$name]??array() as $fn) $value=$fn($value,...$args); return $value; }
function register_activation_hook($file,$fn) { $GLOBALS['activation']=$fn; }
function plugin_dir_path($file) { return dirname($file).'/'; }
function plugin_dir_url($file) { return 'https://fixture.example.invalid/plugins/'.basename(dirname($file)).'/'; }
function is_admin() { return !empty($GLOBALS['admin']); }
function wp_doing_ajax() { return !empty($GLOBALS['ajax']); }
function is_feed() { return !empty($GLOBALS['feed']); }
function is_embed() { return !empty($GLOBALS['embed']); }
function is_search() { return !empty($GLOBALS['search']); }
function post_password_required() { return !empty($GLOBALS['password']); }
function is_front_page() { return !empty($GLOBALS['front']); }
function is_page() { return !empty($GLOBALS['page']); }
function get_queried_object_id() { return 4; }
function get_page_template_slug($id) { return $GLOBALS['template']??''; }
function esc_html($s) { return htmlspecialchars((string)$s,ENT_QUOTES); }
function esc_html__($s,$d='') { return esc_html($s); }
function esc_attr($s) { return esc_html($s); }
function esc_url($s) { return esc_html($s); }
function wp_kses_post($s) { return strip_tags($s,'<p><strong>'); }
function sanitize_text_field($s) { return strip_tags($s); }
function sanitize_key($s) { return preg_replace('/[^a-z0-9_-]/','',strtolower($s)); }
function sanitize_title($s) { return sanitize_key($s); }
function wp_unslash($s) { return stripslashes($s); }
function absint($s) { return abs((int)$s); }
function current_user_can($cap) { return true; }
function did_action($name) { return $GLOBALS['scenario'] !== 'elementor-absent'; }
function shortcode_atts($default,$atts) { return array_merge($default,$atts); }
function add_shortcode($name,$fn) { $GLOBALS['shortcodes'][$name]=$fn; }
function wp_enqueue_style($name,$url,$deps=array(),$version='',$media='all') { $GLOBALS['styles'][$name]=$url; }
function wp_register_style(...$args) { $GLOBALS['registered'][]=$args; }
function wp_print_styles($names) { foreach($names as $name) if(empty($GLOBALS['printed'][$name])) { echo '<link href="'.esc_url($GLOBALS['styles'][$name]).'">'; $GLOBALS['printed'][$name]=true; } }
function wp_enqueue_script($name,$url,...$args) { $GLOBALS['scripts'][$name]=$url; }
function check($condition,$message) { if(!$condition) throw new Exception($message); }
class Manager { public $widgets=array(); public $category; function register($w) { $this->widgets[]=$w; } function add_category($k,$v) { $this->category=$k; } }
if (strpos($scenario,'elementor')===0 && $scenario!=='elementor-absent') require __DIR__.'/wordpress-elementor-stubs.php';
require $plugin;
// PHP 7.4 may build JSON as a shared extension disabled by -n. Keep this
// isolated harness extension-free; the Node caller supplies these known fields.
$c=array('slug'=>$argv[3], 'mode'=>$argv[4], 'fnPrefix'=>$argv[5]);
($GLOBALS['activation'])();
if ($scenario==='routes') {
  check(filtered('template_include','host.php')==='host.php','Unrelated route intercepted');
  $GLOBALS['front']=true; $GLOBALS['page']=true; $GLOBALS['template']=$c['slug'].'/generated-page.php';
  check(filtered('template_include','host.php')!=='host.php','Target not intercepted');
  foreach(array('admin','ajax','feed','embed') as $guard) {
    $GLOBALS[$guard]=true;
    check(filtered('template_include','host.php')==='host.php','Guard failed: '.$guard);
    $GLOBALS[$guard]=false;
  }
  if($c['mode']==='page-template') {
    $GLOBALS['template']='other/page.php';
    check(filtered('template_include','host.php')==='host.php','Other template intercepted');
    $templates=filtered('theme_page_templates',array('existing.php'=>'Existing'));
    check(count($templates)===2,'Template registration dropped existing templates');
  }
} elseif ($scenario==='embedded') {
  check(count($styles)===0 && count($scripts)===0,'Assets loaded globally');
  $fn=$GLOBALS['shortcodes'][str_replace('-','_',$c['slug']).'_page'];
  check($fn(array('id'=>'../../bad'))==='','Unknown ID accepted');
  $html=$fn(array());
  check(strpos($html,'bs-'.$c['slug'])!==false,'Missing isolated root');
  check(count($styles)>0 && count($scripts)>0,'Assets not requested on render');
  $again=$fn(array());
  check(strpos($again,'<link')===false,'Styles emitted twice');
  $tag=filtered('script_loader_tag','<script type="text/javascript" src="asset.js"></script>',$c['slug'].'-script-0');
  check(strpos($tag,'type="module"')!==false && strpos($tag,'text/javascript')===false,'Module type lost');
} elseif (strpos($scenario,'elementor')===0) {
  fire('plugins_loaded');
  if($scenario==='elementor-absent') {
    check(empty($hooks['elementor/widgets/register']),'Widgets registered without Elementor');
    ob_start(); fire('admin_notices'); $notice=ob_get_clean();
    check(strpos($notice,'Elementor')!==false,'Missing dependency notice');
  } else {
    $manager=new Manager();
    fire('elementor/elements/categories_registered',$manager);
    fire('elementor/frontend/after_register_styles');
    fire('elementor/widgets/register',$manager);
    check(count($manager->widgets)===2,'Widgets missing');
    check($manager->category===$c['slug'],'Category missing');
    foreach($manager->widgets as $w) {
      $w->controls(); ob_start(); $w->output(); $out=ob_get_clean();
      if(strpos($w->get_name(),'product-grid')!==false) check(strpos($out,'requiere WooCommerce')!==false,'Woo absence not graceful');
      else check(strpos($out,'<script>')===false && strpos($out,'FAQ question')!==false,'FAQ not escaped/rendered');
    }
    $fn=$c['fnPrefix'].'_product_filters';
    $_GET=array('grid-min'=>'100','grid-max'=>'2','grid-order'=>'DROP','grid-page'=>'-4','grid-search'=>array('bad'));
    $filters=$fn(array('filters'=>'yes'),'grid');
    check($filters['min']===2.0 && $filters['max']===100.0 && $filters['search']==='' && $filters['order']==='date','Filter sanitation failed');
    $q=filtered('woocommerce_product_data_store_cpt_get_products_query',array('keep'=>true),array());
    check($q===array('keep'=>true),'Affected unrelated Woo queries');
    $q=filtered('woocommerce_product_data_store_cpt_get_products_query',array(),array($c['fnPrefix'].'_filters'=>$filters));
    check($q['has_password']===false && count($q['meta_query'])===2,'Query adapter failed');
    require __DIR__.'/wordpress-woo-stubs.php';
    $catalog=$manager->widgets[1];
    $GLOBALS['live_product_name']='Live product A';
    ob_start(); $catalog->output(); $first=ob_get_clean();
    $GLOBALS['live_product_name']='Live product B';
    ob_start(); $catalog->output(); $second=ob_get_clean();
    check(strpos($first,'Live product A')!==false && strpos($second,'Live product B')!==false,'Product content is not dynamic');
    check($GLOBALS['last_query']['status']==='publish' && $GLOBALS['last_query']['limit']===12,'Product query not bounded/public');
  }
}
echo "runtime OK: ".$scenario."\n";
