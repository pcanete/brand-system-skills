#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { pathToFileURL } from 'node:url';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';

const schema = JSON.parse(await fs.readFile(new URL('../schemas/elementor-component-spec.schema.json', import.meta.url), 'utf8'));
const ajv = new Ajv2020({ allErrors: true, strict: false });
addFormats(ajv);
const shape = ajv.compile(schema);
function canonical(value) {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === 'object') return Object.fromEntries(Object.keys(value).sort().map(k => [k, canonical(value[k])]));
  return value;
}
export function specDigest(spec) {
  const { approval, ...design } = spec;
  return createHash('sha256').update(JSON.stringify(canonical(design))).digest('hex');
}
export function recommendMode(decision) {
  if (!decision.granularEditing && !decision.dynamicContent) return 'COMPILED';
  const n = decision.nativeAssessment;
  if (n.feasible === true && n.preservesFidelity === true && n.fragmentation === 'low' && n.editingComplexity === 'low') return 'ELEMENTOR_NATIVE';
  if (n.feasible === false || n.preservesFidelity === false || n.fragmentation === 'high' || n.editingComplexity === 'high') return 'ELEMENTOR_CUSTOM_WIDGET';
  return null;
}
function unique(items, label, issues) {
  const map = new Map();
  for (const item of items) {
    if (map.has(item.id)) issues.push(label + ': duplicate id ' + item.id);
    map.set(item.id, item);
  }
  return map;
}
function nonblank(value) { return typeof value === 'string' && !!value.trim(); }
async function verifyArtifacts(spec, evidenceRoot, issues) {
  const root = await fs.realpath(evidenceRoot);
  for (const source of spec.sourceReference) {
    try {
      const candidate = path.resolve(root, source.artifact);
      const relative = path.relative(root, candidate);
      if (!relative || relative.startsWith('..') || path.isAbsolute(relative)) throw new Error('artifact outside evidence root');
      let current = root;
      for (const part of relative.split(path.sep)) {
        current = path.join(current, part);
        if ((await fs.lstat(current)).isSymbolicLink()) throw new Error('symlink not allowed');
      }
      let content = await fs.readFile(candidate);
      if (source.digestMode === 'utf8-lf') content = Buffer.from(content.toString('utf8').replaceAll('\r\n', '\n'));
      if (createHash('sha256').update(content).digest('hex') !== source.sha256) throw new Error('artifact digest mismatch');
    } catch (e) { issues.push('source ' + source.id + ': ' + e.message); }
  }
}
export async function validateSpec(spec, { evidenceRoot, allowDraft = false } = {}) {
  if (!shape(spec)) throw new Error('ELEMENTOR_COMPONENT_SPEC schema invalid\n' + ajv.errorsText(shape.errors, { separator: '\n' }));
  const issues = [];
  const sources = unique(spec.sourceReference, 'sourceReference', issues);
  const dependencies = unique(spec.dependencies, 'dependencies', issues);
  const controls = unique(spec.editableControls, 'editableControls', issues);
  const dataSources = unique(spec.dataSources, 'dataSources', issues);
  const bindings = unique(spec.dynamicData, 'dynamicData', issues);
  const criteria = unique(spec.acceptanceCriteria, 'acceptanceCriteria', issues);
  unique(spec.validationChecklist, 'validationChecklist', issues);
  const requirements = [
    ...spec.visualRequirements, ...spec.layoutStructure, ...spec.responsiveBehavior.flatMap(v => v.requirements),
    ...spec.states, ...spec.interactions, ...spec.accessibilityRequirements, ...spec.fallbackBehavior
  ];
  const reqs = unique([...requirements, ...spec.editableControls, ...spec.dynamicData], 'requirements/controls/bindings', issues);
  const refs = (values, label) => {
    for (const ref of values) if (!sources.has(ref)) issues.push(label + ': unknown evidence ' + ref);
  };
  for (const req of requirements) {
    refs(req.evidenceRefs, req.id);
    if (req.basis === 'observed' && !req.evidenceRefs.length) issues.push(req.id + ': observed claim without evidence');
  }
  refs(spec.decision.nativeAssessment.evidenceRefs, 'native assessment');
  if (spec.publicationMode !== 'COMPILED' && !spec.decision.nativeAssessment.evidenceRefs.length) issues.push('native assessment requires evidence');
  const recommended = recommendMode(spec.decision);
  if (!recommended) issues.push('publication decision unresolved: inspect native feasibility');
  else if (spec.publicationMode !== recommended) issues.push('publicationMode contradicts decision; recommended ' + recommended);
  if (spec.decision.decorativeOnly && (spec.decision.granularEditing || spec.decision.dynamicContent || spec.editableControls.length)) issues.push('decorative-only component cannot require editorial/data controls');
  if (spec.decision.dynamicContent !== !!spec.dynamicData.length) issues.push('dynamicContent must agree with dynamicData');
  if (!spec.decision.granularEditing && spec.editableControls.length) issues.push('editable controls without granular editing need');
  const scope = spec.decision.scope;
  if (new Set(scope.keepCompiledRegions).size !== scope.keepCompiledRegions.length || new Set(scope.editableRegions).size !== scope.editableRegions.length) issues.push('duplicate region ids');
  if (scope.keepCompiledRegions.some(id => scope.editableRegions.includes(id))) issues.push('region cannot be both compiled and editable');
  if (spec.publicationMode !== 'COMPILED' && !scope.editableRegions.includes(scope.regionId)) issues.push('editable component outside declared scope');
  if (spec.publicationMode === 'COMPILED') {
    if (!scope.keepCompiledRegions.includes(scope.regionId)) issues.push('compiled component outside declared scope');
    if (!spec.decision.compiledIntegration || spec.executionPolicy.preferredContainer !== 'compiled-build' || spec.cssIsolation.strategy !== 'compiled') issues.push('COMPILED must route to compiled build/publisher');
    if (spec.decision.nativeMapping.length || spec.editableControls.length) issues.push('COMPILED must not generate Elementor controls/widgets');
  } else {
    if (spec.decision.compiledIntegration !== null) issues.push('editable component cannot also select a compiled exporter');
    if (![...dependencies.values()].some(d => d.kind === 'elementor' && d.required)) issues.push('Elementor dependency required');
    if (spec.cssIsolation.rootSelector !== '.bs-' + spec.componentSlug || spec.cssIsolation.assetLoading !== 'on-render') issues.push('editable component requires unique root and conditional assets');
    if (spec.publicationMode === 'ELEMENTOR_NATIVE') {
      if (!spec.decision.nativeMapping.length || spec.executionPolicy.preferredContainer !== 'existing-native-document' || spec.cssIsolation.strategy !== 'native-scoped') issues.push('native mapping/container required');
    } else if (spec.executionPolicy.preferredContainer !== 'project-plugin' || spec.cssIsolation.strategy !== 'root-class' || spec.decision.nativeMapping.length) issues.push('custom widget requires project plugin/root-class, not native fragments');
  }
  if (![...dependencies.values()].some(d => d.kind === 'wordpress' && d.required)) issues.push('WordPress dependency required');
  for (const mapping of spec.decision.nativeMapping) if (!dependencies.has(mapping.dependencyId)) issues.push('native mapping dependency missing');
  const providers = { 'wordpress-post':'wordpress', 'woocommerce-product':'woocommerce', acf:'acf', jetengine:'jetengine', 'custom-field':'wordpress', taxonomy:'wordpress', 'meta-field':'wordpress', 'site-setting':'wordpress' };
  for (const source of dataSources.values()) {
    if (dependencies.get(source.dependencyId)?.kind !== providers[source.provider]) issues.push(source.id + ': provider dependency missing or mismatched');
  }
  for (const binding of bindings.values()) {
    if (!dataSources.has(binding.sourceId)) issues.push(binding.id + ': unknown data source');
    if (['string','url','html'].includes(binding.valueType) && binding.escape === 'typed') issues.push(binding.id + ': textual output needs escaping');
    if (binding.valueType === 'url' && binding.escape !== 'esc_url') issues.push(binding.id + ': URL requires esc_url');
    if (binding.valueType === 'html' && binding.escape !== 'wp_kses_post') issues.push(binding.id + ': HTML requires wp_kses_post');
  }
  for (const control of controls.values()) {
    if (control.dynamic !== (control.source.kind === 'data-binding')) issues.push(control.id + ': dynamic/source mismatch');
    if (control.dynamic && !bindings.has(control.source.ref)) issues.push(control.id + ': dynamic control needs known binding');
    if (!control.dynamic && control.source.ref !== null) issues.push(control.id + ': editor source ref must be null');
    const v = control.default, c = control.constraints;
    const type = {number:'number',switcher:'boolean',repeater:'object',media:'object'}[control.type] || 'string';
    if ((control.type === 'select' ? !['string','number','boolean'].includes(typeof v) : typeof v !== type) || v === null || (control.type === 'repeater' && !Array.isArray(v)) || (control.type === 'media' && Array.isArray(v))) issues.push(control.id + ': invalid default type');
    if (control.required && !control.dynamic && (v === '' || (Array.isArray(v) && !v.length))) issues.push(control.id + ': empty required default');
    if (c.min !== undefined && c.max !== undefined && c.min > c.max) issues.push(control.id + ': inverted bounds');
    if ((c.min !== undefined && typeof v === 'number' && v < c.min) || (c.max !== undefined && typeof v === 'number' && v > c.max)) issues.push(control.id + ': default outside bounds');
    if (c.maxLength && typeof v === 'string' && v.length > c.maxLength) issues.push(control.id + ': default too long');
    if (c.maxItems && Array.isArray(v) && v.length > c.maxItems) issues.push(control.id + ': too many items');
    if (control.type === 'select' && (!c.options || !c.options.includes(v))) issues.push(control.id + ': select default missing from options');
    if (control.type === 'url' && v && (!/^(?:https?:\/\/|\/(?!\/)|#)/i.test(v) || /[\\\s]/.test(v))) issues.push(control.id + ': unsafe URL default');
    if (control.type === 'url' && typeof v === 'string' && /^https?:/i.test(v)) {
      try {
        const url = new URL(v);
        if (url.username || url.password || (c.allowedHosts && !c.allowedHosts.includes(url.hostname))) issues.push(control.id + ': URL host/credentials forbidden');
      } catch { issues.push(control.id + ': malformed URL'); }
    }
  }
  const viewports = spec.responsiveBehavior.map(v=>v.viewport);
  if (viewports.length !== 3 || new Set(viewports).size !== 3 || !['desktop','tablet','mobile'].every(v=>viewports.includes(v))) issues.push('desktop/tablet/mobile coverage required exactly once');
  const stateIds = new Set(spec.states.map(s=>s.id));
  for (const interaction of spec.interactions) if (!stateIds.has(interaction.from) || !stateIds.has(interaction.to)) issues.push(interaction.id + ': unknown interaction state');
  const covered = new Set();
  for (const criterion of criteria.values()) for (const ref of criterion.requirementRefs) {
    if (!reqs.has(ref)) issues.push(criterion.id + ': unknown requirement ' + ref);
    covered.add(ref);
  }
  for (const id of reqs.keys()) if (!covered.has(id)) issues.push(id + ': missing acceptance criterion');
  const checklistCoverage = new Set();
  for (const item of spec.validationChecklist) {
    refs(item.evidenceRefs, item.id);
    for (const ref of item.criterionRefs) {
      if (!criteria.has(ref)) issues.push(item.id + ': unknown acceptance criterion');
      checklistCoverage.add(ref);
    }
    if (item.status === 'passed' && (!item.evidenceRefs.length || !nonblank(item.reviewer))) issues.push(item.id + ': passed without evidence/reviewer');
    if (item.status === 'failed' && spec.approval.status === 'approved') issues.push(item.id + ': failed check blocks approval');
  }
  for (const id of criteria.keys()) if (!checklistCoverage.has(id)) issues.push(id + ': not in validationChecklist');
  const approval = spec.approval;
  if (approval.status === 'approved') {
    if (![approval.approvedBy,approval.approvedAt,approval.record].every(nonblank)) issues.push('approval requires human, timestamp and record');
    if (approval.specDigest !== specDigest(spec)) issues.push('approval digest missing or stale');
  } else if (!allowDraft) issues.push('human design approval required; --allow-draft cannot authorize execution');
  else if ([approval.approvedBy,approval.approvedAt,approval.record,approval.specDigest].some(v=>v!==null)) issues.push('draft cannot carry an approval receipt');
  if (!evidenceRoot) issues.push('evidenceRoot required; evidence cannot be verified from IDs alone');
  else await verifyArtifacts(spec, evidenceRoot, issues);
  if (issues.length) throw new Error('ELEMENTOR_COMPONENT_SPEC gates failed\n' + issues.map(i=>' - '+i).join('\n'));
  return { publicationMode:spec.publicationMode, specDigest:specDigest(spec), approval:approval.status,
    artifactEvidence:'verified', executionAuthorized:false, note:'Contract integrity is not visual fidelity or remote-write authorization.' };
}
async function main() {
  const args = process.argv.slice(2);
  const arg = name => { const i=args.indexOf(name); return i < 0 ? null : args[i+1]; };
  const file = arg('--spec');
  if (!file) throw new Error('Usage: validate-component-spec.mjs --spec FILE [--evidence-root DIR] [--allow-draft]');
  const spec = JSON.parse(await fs.readFile(path.resolve(file),'utf8'));
  const result = await validateSpec(spec, { evidenceRoot:arg('--evidence-root') || path.dirname(path.resolve(file)), allowDraft:args.includes('--allow-draft') });
  console.log(JSON.stringify(result,null,2));
}
if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href)
  main().catch(e=>{console.error(e.message);process.exitCode=1;});
