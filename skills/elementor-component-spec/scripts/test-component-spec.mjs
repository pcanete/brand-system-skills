#!/usr/bin/env node
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { validateSpec, recommendMode, specDigest } from './validate-component-spec.mjs';

const root = fileURLToPath(new URL('../examples/', import.meta.url));
const read = async name => JSON.parse(await fs.readFile(path.join(root, name + '.json'), 'utf8'));
const custom = await read('ELEMENTOR_COMPONENT_SPEC');
const native = await read('ELEMENTOR_NATIVE');
const compiled = await read('COMPILED');
const clone = x => JSON.parse(JSON.stringify(x));
const validate = (s, opts = {}) => validateSpec(s, { evidenceRoot:root, allowDraft:true, ...opts });
const reject = async (mutate, pattern, source = custom) => {
  const s=clone(source); mutate(s); await assert.rejects(validate(s),pattern);
};
for (const name of ['ELEMENTOR_COMPONENT_SPEC','ELEMENTOR_NATIVE','COMPILED']) {
  test(name + ' is coherent draft, never execution authorization', async () => {
    const result=await validate(await read(name));
    assert.equal(result.executionAuthorized,false);
    assert.equal(result.artifactEvidence,'verified');
    assert.equal(result.approval,'draft');
  });
}
test('published negative fixture fails semantic gate',async()=>{
  await assert.rejects(validate(await read('REJECTED_DECORATIVE_WIDGET')),/publicationMode contradicts decision/);
});
test('strict mode rejects all draft examples',async()=>{
  for (const s of [custom,native,compiled]) await assert.rejects(validate(s,{allowDraft:false}),/human design approval required/);
});
test('synthetic approval receipt binds exact content but grants no permissions',async()=>{
  const s=clone(custom);
  // Test-only synthetic receipt, not an actual human approval or signature.
  s.approval={status:'approved',approvedBy:'SYNTHETIC TEST',approvedAt:'2026-10-01T12:00:00Z',record:'unit-test-only',specDigest:specDigest(s)};
  assert.equal((await validate(s,{allowDraft:false})).executionAuthorized,false);
  s.visualRequirements[0].statement+=' changed';
  await assert.rejects(validate(s),/stale/);
});
test('approval metadata cannot be fabricated incompletely or attached to draft',async()=>{
  await reject(s=>s.approval.status='approved',/approval requires human/);
  await reject(s=>s.approval.record='not-approved',/draft cannot carry/);
});
test('five decision cases and unresolved inspection',()=>{
  assert.equal(recommendMode(compiled.decision),'COMPILED');
  assert.equal(recommendMode(native.decision),'ELEMENTOR_NATIVE');
  assert.equal(recommendMode(custom.decision),'ELEMENTOR_CUSTOM_WIDGET');
  const jet=clone(custom.decision);
  jet.nativeAssessment={feasible:null,preservesFidelity:null,fragmentation:'unknown',editingComplexity:'unknown'};
  assert.equal(recommendMode(jet),null);
  jet.nativeAssessment.fragmentation='high';
  assert.equal(recommendMode(jet),'ELEMENTOR_CUSTOM_WIDGET');
  assert.deepEqual(custom.decision.scope.keepCompiledRegions,['hero','footer']);
  assert.deepEqual(custom.decision.scope.editableRegions,['product-card','faq']);
});
test('unknown native feasibility cannot silently become custom',async()=>{
  await reject(s=>Object.assign(s.decision.nativeAssessment,{feasible:null,preservesFidelity:null,fragmentation:'unknown',editingComplexity:'unknown'}),/decision unresolved/);
});
test('draft still enforces shape, decision and evidence',async()=>{
  await reject(s=>s.undeclared='anything',/schema invalid/);
  await reject(s=>s.publicationMode='ELEMENTOR_NATIVE',/contradicts decision/);
  await reject(s=>{s.visualRequirements[0].basis='observed';s.visualRequirements[0].evidenceRefs=[];},/without evidence/);
  await reject(s=>s.visualRequirements[0].evidenceRefs=['missing'],/unknown evidence/);
});
test('source evidence must exist and match bytes; paths cannot escape',async()=>{
  await reject(s=>s.sourceReference[0].artifact='absent.md',/source brief/);
  await reject(s=>s.sourceReference[0].sha256='0'.repeat(64),/digest mismatch/);
  for (const artifact of ['../reference.md','/tmp/reference.md','C:/reference.md','folder/../../reference.md']) {
    await reject(s=>s.sourceReference[0].artifact=artifact,/schema invalid|outside evidence root/);
  }
});
test('UTF8 LF evidence survives Windows CRLF checkout',async()=>{
  const temp=await fs.mkdtemp(path.join(os.tmpdir(),'elementor-spec-test-'));
  try {
    const content=await fs.readFile(path.join(root,'reference.md'),'utf8');
    await fs.writeFile(path.join(temp,'reference.md'),content.replaceAll('\r\n','\n').replaceAll('\n','\r\n'));
    await validate(custom,{evidenceRoot:temp});
    const s=clone(custom);s.sourceReference[0].digestMode='bytes';
    await assert.rejects(validate(s,{evidenceRoot:temp}),/digest mismatch/);
  } finally { await fs.rm(temp,{recursive:true,force:true}); }
});
test('symlink evidence is refused',async(t)=>{
  const temp=await fs.mkdtemp(path.join(os.tmpdir(),'elementor-spec-symlink-'));
  try {
    try { await fs.symlink(path.join(root,'reference.md'),path.join(temp,'reference.md')); }
    catch(e) { if (e.code==='EPERM') { t.skip('Windows symlink privilege unavailable');return; } throw e; }
    await assert.rejects(validate(custom,{evidenceRoot:temp}),/symlink not allowed/);
  } finally { await fs.rm(temp,{recursive:true,force:true}); }
});
test('dynamic bindings, providers and escaping must resolve',async()=>{
  await reject(s=>s.dynamicData[0].sourceId='missing',/unknown data source/);
  await reject(s=>s.dataSources[0].dependencyId='elementor',/provider dependency/);
  await reject(s=>s.dynamicData[0].escape='typed',/needs escaping/);
  await reject(s=>s.dynamicData.find(b=>b.valueType==='url').escape='esc_html',/requires esc_url/);
  await reject(s=>s.decision.dynamicContent=false,/must agree with dynamicData/);
  await reject(s=>s.editableControls[0].dynamic=true,/dynamic\/source mismatch/);
});
test('supported provider families have explicit dependency association',async()=>{
  for(const [provider,kind] of Object.entries({'wordpress-post':'wordpress',acf:'acf',jetengine:'jetengine','custom-field':'wordpress',taxonomy:'wordpress','meta-field':'wordpress','site-setting':'wordpress'})){
    const s=clone(custom);
    s.dataSources[0].provider=provider;
    s.dataSources[0].dependencyId=kind;
    if (!s.dependencies.some(d=>d.id===kind)) s.dependencies.push({id:kind,kind,versionConstraint:'Test only',required:true,fallback:'Stop dependent component'});
    await validate(s);
  }
});
test('controls enforce bounded defaults and source consistency',async()=>{
  await reject(s=>s.editableControls[0].default='1',/invalid default type/);
  await reject(s=>s.editableControls[0].default=0,/outside bounds/);
  await reject(s=>s.editableControls[1].default='x'.repeat(61),/too long/);
  await reject(s=>s.editableControls[1].default='',/empty required default/);
  await reject(s=>s.editableControls[0].source.ref='product-title',/editor source ref/);
  const s=clone(custom);s.editableControls[0].type='select';s.editableControls[0].constraints={options:[1,2]};
  await validate(s);
});
test('URL defaults reject script schemes, foreign hosts and credentials',async()=>{
  const base=clone(custom);
  Object.assign(base.editableControls[1],{type:'url',default:'https://shop.example.invalid/product'});
  base.editableControls[1].constraints={allowedHosts:['shop.example.invalid']};
  await validate(base);
  for (const url of ['javascript:alert(1)','//evil.example.invalid','/\\evil.example.invalid','https://other.example.invalid/','https://user:password@shop.example.invalid/']) {
    await reject(s=>s.editableControls[1].default=url,/unsafe URL|host\/credentials/,base);
  }
});
test('scope, dependencies, CSS and responsive invariants',async()=>{
  await reject(s=>s.decision.scope.keepCompiledRegions.push('product-card'),/both compiled and editable/);
  await reject(s=>s.decision.scope.editableRegions=[],/outside declared scope/);
  await reject(s=>s.cssIsolation.rootSelector='body',/unique root/);
  await reject(s=>s.dependencies=s.dependencies.filter(d=>d.kind!=='elementor'),/Elementor dependency/);
  await reject(s=>s.responsiveBehavior.push(clone(s.responsiveBehavior[0])),/exactly once/);
  await reject(s=>s.interactions[0].to='missing',/unknown interaction state/);
  await reject(s=>s.decision.scope.keepCompiledRegions=[],/compiled component outside declared scope/,compiled);
});
test('acceptance coverage and passed evidence cannot be omitted',async()=>{
  await reject(s=>s.acceptanceCriteria.pop(),/missing acceptance criterion|unknown acceptance criterion/);
  await reject(s=>s.validationChecklist.pop(),/not in validationChecklist/);
  await reject(s=>s.validationChecklist[0].status='passed',/without evidence\/reviewer/);
  await reject(s=>s.editableControls.push(clone(s.editableControls[0])),/duplicate id/);
});
test('contract cannot grant writes or remove production approval',async()=>{
  await reject(s=>s.executionPolicy.remoteWritesAuthorized=true,/schema invalid/);
  await reject(s=>s.executionPolicy.productionRequiresExplicitApproval=false,/schema invalid/);
});
test('CLI works from unrelated cwd and rejects draft without flag',()=>{
  const script=fileURLToPath(new URL('validate-component-spec.mjs',import.meta.url));
  const args=[script,'--spec',path.join(root,'ELEMENTOR_COMPONENT_SPEC.json')];
  const result=spawnSync(process.execPath,[...args,'--allow-draft'],{cwd:os.tmpdir(),encoding:'utf8'});
  assert.equal(result.status,0,result.stderr);
  assert.equal(JSON.parse(result.stdout).executionAuthorized,false);
  assert.equal(spawnSync(process.execPath,args,{cwd:os.tmpdir(),encoding:'utf8'}).status,1);
});
