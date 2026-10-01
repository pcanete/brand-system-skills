import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, cp, readFile, writeFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { inflateRawSync } from 'node:zlib';
import { exportPlugin, resolveConfig } from '../skills/wordpress-publisher/scripts/export-plugin.mjs';
import { validatePlugin } from '../skills/wordpress-publisher/scripts/validate-plugin.mjs';
import { packagePlugin } from '../skills/wordpress-publisher/scripts/package-plugin.mjs';
import { scopeCss } from '../skills/wordpress-publisher/scripts/lib/css.mjs';

test('browser: scoped CSS leaves host styles unchanged',async()=>{
  const { chromium } = await import('../skills/reference-to-astro/node_modules/playwright/index.mjs');
  const browser=await chromium.launch({headless:true});
  try {
    const page=await browser.newPage();
    await page.setContent('<style>body{color:rgb(1, 2, 3)}h1{color:rgb(4, 5, 6)}</style><h1 id="host">Host</h1><div class="bs-demo"><h1 id="inside">Embedded</h1><button>Action</button></div>');
    const before=await page.locator('#host').evaluate(e=>getComputedStyle(e).color);
    await page.addStyleTag({content:scopeCss('body{color:red}h1,button{color:blue}@media(min-width:1px){h1{margin:13px}}','bs-demo')});
    assert.equal(await page.locator('#host').evaluate(e=>getComputedStyle(e).color),before);
    assert.equal(await page.locator('#inside').evaluate(e=>getComputedStyle(e).color),'rgb(0, 0, 255)');
    assert.equal(await page.locator('#inside').evaluate(e=>getComputedStyle(e).marginTop),'13px');
    assert.equal(await page.locator('body').evaluate(e=>getComputedStyle(e).color),'rgb(1, 2, 3)');
  } finally { await browser.close(); }
});
test('cross-file fonts/keyframes are scoped consistently; shortcode does not accept paths',async t=>{
  const root=await project(t);
  await writeFile(path.join(root,'dist/_astro/definitions.css'),'@font-face{font-family:"Demo Font";src:url(../assets/hero.svg)}@keyframes fade{to{opacity:1}}');
  await writeFile(path.join(root,'dist/_astro/site.css'),'h1{font-family:"Demo Font";animation:fade 1s}');
  const {pluginDir}=await exportPlugin({projectRoot:root,config:{slug:'demo',mode:'embedded-page'}});
  const css=await readFile(path.join(pluginDir,'dist/_astro/site.css'),'utf8');
  assert(css.includes('bs-demo-Demo Font')); assert(css.includes('bs-demo-fade'));
});
test('PHP header strings stay data and legacy report fields survive',async t=>{
  const root=await project(t);
  const index=path.join(root,'dist/index.html');
  await writeFile(index,(await readFile(index,'utf8')).replace('</head>','<link rel="icon" href="/favicon.svg"></head>'));
  const {pluginDir,report}=await exportPlugin({projectRoot:root,config:{slug:'demo',name:"Client O'Reilly \\ Design"}});
  assert.deepEqual(await validatePlugin(pluginDir),[]);
  assert(!(await readFile(path.join(pluginDir,'templates/front-page.php'),'utf8')).includes('/favicon.svg'));
  assert.equal(report.source,'dist/index.html');
  assert.deepEqual(report.wordpressHooks,['wp_head','wp_body_open','wp_footer']);
});

const here=path.dirname(fileURLToPath(import.meta.url));

test('widgets publish without Astro/dist and standalone ZIP validation cannot be bypassed',async t=>{
  const { publish }=await import('../skills/wordpress-publisher/scripts/publish.mjs');
  const root=await project(t);
  await rm(path.join(root,'dist'),{recursive:true});
  const configPath=path.join(root,'wordpress.config.json');
  await writeFile(configPath,JSON.stringify({slug:'widgets-only',mode:'elementor-widgets',elementor:{widgets:['faq']}}));
  const result=await publish({projectRoot:root,configPath});
  assert.equal(result.report.mode,'elementor-widgets');
  assert((await readFile(result.zipPath)).length>0);
});
test('all static modes reject missing CSS dependencies before producing ZIPs',async t=>{
  const root=await project(t);
  await writeFile(path.join(root,'dist/_astro/site.css'),'p {background:url(../assets/missing.svg)}');
  for(const mode of ['front-page','page-template','embedded-page'])
    await assert.rejects(()=>exportPlugin({projectRoot:root,config:{slug:'demo',mode}}),/Asset inexistente/);
});

async function project(t) {
  const root=await mkdtemp(path.join(os.tmpdir(),'wp-modes-'));
  t.after(()=>rm(root,{recursive:true,force:true}));
  await cp(path.join(here,'wordpress-fixture'),root,{recursive:true});
  return root;
}
function runtime(pluginDir, scenario, config) {
  const result=spawnSync(process.env.PHP_BINARY||'php',['-n',path.join(here,'wordpress-runtime.php'),path.join(pluginDir,path.basename(pluginDir)+'.php'),scenario,config.slug,config.mode,config.fnPrefix],{encoding:'utf8'});
  assert.equal(result.status,0,result.stdout+result.stderr);
}
test('config keeps legacy defaults and rejects invalid mode/version/paths/header injection',()=>{
  assert.equal(resolveConfig({slug:'demo'}).mode,'front-page');
  for(const raw of [{mode:'bad'},{version:'next'},{slug:'../bad'},{name:"Bad */ code"},{embedded:{id:'../x'}},{template:{layout:'bad'}},{elementor:{widgets:['heading']}}])
    assert.throws(()=>resolveConfig({slug:'demo',...raw}));
  const c=resolveConfig({slug:'demo',isolateWooStyles:true,additionalStyleSources:['/custom/']});
  assert.deepEqual(resolveConfig(c).blockedStyleSources,c.blockedStyleSources);
});
for(const [mode,layout] of [['front-page'],['page-template','canvas'],['page-template','theme'],['embedded-page'],['elementor-widgets']]) {
  test('export, validate, runtime and installable ZIP: '+mode+' '+(layout||''),async t=>{
    const root=await project(t);
    const config=resolveConfig({slug:'demo-'+mode,...(mode==='front-page'?{}:{mode}),template:{layout:layout||'canvas',name:"Landing d'ejemplo"}});
    const {pluginDir}=await exportPlugin({projectRoot:root,config});
    assert.deepEqual(await validatePlugin(pluginDir),[]);
    runtime(pluginDir,mode==='elementor-widgets'?'elementor-absent':mode==='embedded-page'?'embedded':'routes',config);
    if(mode==='elementor-widgets') runtime(pluginDir,'elementor-present',config);
    const zip=path.join(root,'result.zip');
    await packagePlugin({pluginDir,outPath:zip});
    const data=await readFile(zip);
    let offset=0, found=false;
    while(data.readUInt32LE(offset)===0x04034b50) {
      const method=data.readUInt16LE(offset+8), size=data.readUInt32LE(offset+18), n=data.readUInt16LE(offset+26), extra=data.readUInt16LE(offset+28);
      const name=data.subarray(offset+30,offset+30+n).toString();
      assert(!name.includes('\\')); assert(name.startsWith(config.slug+'/')); assert(!name.includes('../'));
      const payload=data.subarray(offset+30+n+extra,offset+30+n+extra+size);
      const content=method===8?inflateRawSync(payload):payload;
      assert.equal(content.length,data.readUInt32LE(offset+22));
      if(name===config.slug+'/'+config.slug+'.php') found=true;
      offset+=30+n+extra+size;
    }
    assert(found); assert.equal(data.readUInt32LE(offset),0x02014b50);
    const manifest=JSON.parse(await readFile(path.join(pluginDir,'integration.json')));
    const asset=Object.keys(manifest.files).find(f=>f.endsWith('.css'));
    await rm(path.join(pluginDir,asset));
    assert((await validatePlugin(pluginDir)).length>0);
    await assert.rejects(()=>packagePlugin({pluginDir,outPath:path.join(root,'bad.zip')}));
  });
}
test('scopes globals, media, pseudo lists, animations; refuses escaping/global rules',()=>{
  const css=scopeCss('html body {color:red} *, h1, button:hover {color:blue}@media(x){p{margin:0}}@keyframes spin {to{opacity:1}}p{animation:spin 1s}', 'bs-demo');
  assert.match(css,/\.bs-demo\s+\*/); assert.match(css,/\.bs-demo\s+h1/); assert.match(css,/\.bs-demo\s+button:hover/); assert.match(css,/\.bs-demo\s+p/);
  assert(css.includes('@keyframes bs-demo-spin')); assert(css.includes('animation:bs-demo-spin'));
  for(const bad of ['@import "remote.css";','body + .outside{color:red}','@page {margin:0}',':is(body,.x){color:red}','.a { & .b {color:red} }'])
    assert.throws(()=>scopeCss(bad,'bs-demo'),bad);
});
test('rejects missing assets, traversal and PHP before packaging',async t=>{
  const root=await project(t);
  const index=path.join(root,'dist/index.html'),original=await readFile(index,'utf8');
  for(const src of ['/assets/missing.svg','/assets/../../secret.svg','/assets/%2e%2e/secret.svg']) {
    await writeFile(index,original.replace('/assets/hero.svg',src));
    await assert.rejects(()=>exportPlugin({projectRoot:root,config:{slug:'demo'}}));
  }
  await writeFile(index,original+'<?php die(); ?>');
  await assert.rejects(()=>exportPlugin({projectRoot:root,config:{slug:'demo'}}),/PHP/);
});
test('embedded rejects missing CSS assets and unsafe imports',async t=>{
  const root=await project(t);
  const css=path.join(root,'dist/_astro/site.css');
  await writeFile(css,'button {background:url("../assets/missing.svg")}');
  await assert.rejects(()=>exportPlugin({projectRoot:root,config:{slug:'demo',mode:'embedded-page'}}),/Asset/);
  await writeFile(css,'@import "x.css";');
  await writeFile(path.join(root,'dist/_astro/x.css'),'p{color:red}');
  await assert.rejects(()=>exportPlugin({projectRoot:root,config:{slug:'demo',mode:'embedded-page'}}),/@import/);
});
test('PHP lint detects syntax errors and artifact checks detect changes',async t=>{
  const root=await project(t);
  const {pluginDir}=await exportPlugin({projectRoot:root,config:{slug:'demo'}});
  await writeFile(path.join(pluginDir,'demo.php'),'<?php function ( invalid');
  const issues=await validatePlugin(pluginDir);
  assert(issues.some(s=>/modificado/.test(s))); assert(issues.some(s=>/syntax|parse/i.test(s)));
});
