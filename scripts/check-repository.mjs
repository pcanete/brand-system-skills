#!/usr/bin/env node

import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import process from "node:process";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const excluded = new Set([".git", "node_modules"]);
const failures = [];

function fail(message) {
  failures.push(message);
}

function walk(directory) {
  const files = [];
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (excluded.has(entry.name)) continue;
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...walk(target));
    else files.push(target);
  }
  return files;
}

function copyTree(from, to) {
  fs.mkdirSync(to, { recursive: true });
  for (const entry of fs.readdirSync(from, { withFileTypes: true })) {
    const source = path.join(from, entry.name);
    const target = path.join(to, entry.name);
    if (entry.isDirectory()) copyTree(source, target);
    else if (entry.isFile()) fs.copyFileSync(source, target);
    else fail(`Unsupported fixture entry: ${source}`);
  }
}

function relative(file) {
  return path.relative(root, file).replaceAll("\\", "/");
}

function read(file) {
  return fs.readFileSync(file, "utf8");
}

function runNode(label, args, { expect = "pass", cwd = root } = {}) {
  const result = spawnSync(process.execPath, args, {
    cwd,
    encoding: "utf8",
    stdio: "pipe"
  });

  const passed = result.status === 0;

  if (expect === "pass" && !passed) {
    fail(`${label}\n${result.stdout || ""}${result.stderr || ""}`);
    return;
  }

  if (expect === "fail" && passed) {
    fail(`${label}\n${result.stdout || ""}`);
    return;
  }

  if (expect === "pass" && result.stdout.trim()) {
    console.log(result.stdout.trim());
  }
}

const files = walk(root);
runNode("Evidence handoff and PHP syntax regression tests failed", [
  path.join(root, "scripts", "test-evidence-integrity.mjs")
]);

for (const file of files.filter((item) => item.endsWith(".json"))) {
  try {
    JSON.parse(read(file));
  } catch (error) {
    fail(`Invalid JSON: ${relative(file)}: ${error.message}`);
  }
}

for (const file of files.filter((item) => item.endsWith(".mjs"))) {
  runNode(`Invalid JavaScript: ${relative(file)}`, ["--check", file]);
}

const skillNames = [
  "brand-dna-scanner",
  "brand-manual-builder",
  "reference-scanner",
  "reference-lab-builder",
  "reference-to-astro",
  "visual-tuning-kit",
  "wordpress-publisher"
];

const declaredVersions = new Map();

for (const name of skillNames) {
  const skillRoot = path.join(root, "skills", name);
  const skillFile = path.join(skillRoot, "SKILL.md");
  const agentFile = path.join(skillRoot, "agents", "openai.yaml");

  if (!fs.existsSync(skillFile)) {
    fail(`Missing skills/${name}/SKILL.md`);
    continue;
  }

  if (!fs.existsSync(agentFile)) fail(`Missing skills/${name}/agents/openai.yaml`);

  const markdown = read(skillFile);
  const frontmatter = markdown.match(/^---[\s\S]*?^---/m)?.[0] || "";
  const declared = frontmatter.match(/^name:\s*([^\r\n]+)/m)?.[1]?.trim();

  if (declared !== name) {
    fail(`Skill name mismatch: directory ${name}, frontmatter ${declared || "missing"}`);
  }

  const description = frontmatter.match(/^description:\s*([^\r\n]+)/m)?.[1]?.trim();

  if (!description) {
    fail(`skills/${name}/SKILL.md has no description`);
  } else if (description.length > 1024) {
    fail(`skills/${name}/SKILL.md description exceeds 1024 characters`);
  }

  const version = frontmatter.match(/version:\s*"?([0-9]+\.[0-9]+\.[0-9]+)"?/)?.[1];

  if (!version) {
    fail(`skills/${name}/SKILL.md declares no metadata.version`);
  } else {
    declaredVersions.set(name, version);
  }

  // Every companion file the skill ships must be reachable from its own
  // instructions, or it is dead weight the agent will never open.
  const bundled = ["references", "assets", "schemas", "scripts"];
  const prose = [
    markdown,
    ...(fs.existsSync(path.join(skillRoot, "references"))
      ? fs
          .readdirSync(path.join(skillRoot, "references"))
          .filter((entry) => entry.endsWith(".md"))
          .map((entry) => read(path.join(skillRoot, "references", entry)))
      : [])
  ].join("\n");

  for (const folder of bundled) {
    const directory = path.join(skillRoot, folder);
    if (!fs.existsSync(directory)) continue;

    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      if (entry.isDirectory()) continue;
      if (!prose.includes(entry.name)) {
        fail(
          `Unreferenced bundled file: skills/${name}/${folder}/${entry.name} ` +
            `is never mentioned by the skill`
        );
      }
    }
  }

  const linkPattern = /`((?:references|assets|schemas|scripts)\/[^`]+)`/g;

  for (const match of markdown.matchAll(linkPattern)) {
    const linked = path.join(skillRoot, ...match[1].split("/"));
    if (!fs.existsSync(linked)) {
      fail(`Broken local skill reference: skills/${name}/${match[1]}`);
    }
  }

  const packageFile = path.join(skillRoot, "package.json");

  if (fs.existsSync(packageFile) && version) {
    const pkg = JSON.parse(read(packageFile));
    if (pkg.version !== version) {
      fail(
        `Version drift: skills/${name}/SKILL.md says ${version}, package.json says ${pkg.version}`
      );
    }
  }
}

// Published version tables must agree with the skills themselves.
for (const document of ["README.md", "docs/versioning.md"]) {
  const file = path.join(root, document);
  if (!fs.existsSync(file)) continue;

  const rows = read(file)
    .split(/\r?\n/)
    .filter(
      (line) =>
        line.trimStart().startsWith("|") && /\d+\.\d+\.\d+/.test(line)
    );

  for (const [name, version] of declaredVersions) {
    for (const row of rows) {
      if (!row.includes(name)) continue;
      if (!row.includes(version)) {
        fail(`Version drift in ${document}: ${name} should read ${version}\n  ${row.trim()}`);
      }
    }
  }
}

function digest(file) {
  return crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
}

// Duplicated on purpose so each skill installs alone. CI keeps the copies honest.
const duplicated = [
  ["schemas", "style-dna.schema.json"],
  ["schemas", "reference-evidence.schema.json"],
  ["scripts/lib", "web-contracts.mjs"],
  ["scripts/lib", "behavior-gates.mjs"]
];

for (const [folder, filename] of duplicated) {
  const scanner = path.join(root, "skills", "reference-scanner", folder, filename);
  const builder = path.join(root, "skills", "reference-to-astro", folder, filename);

  if (!fs.existsSync(scanner) || !fs.existsSync(builder)) {
    fail(`Missing shared web contract copy: ${folder}/${filename}`);
    continue;
  }

  if (digest(scanner) !== digest(builder)) {
    fail(`Shared web contract drift: ${folder}/${filename}`);
  }
}

// Public fixtures and examples must stay synthetic.
const publicFixtures = files.filter((file) => {
  const name = relative(file);
  return (
    name.startsWith("tests/") ||
    /^skills\/[^/]+\/(examples|assets)\//.test(name)
  );
});

const publicFixtureText = publicFixtures.map(read).join("\n");

if (/benchmark-/i.test(publicFixtureText)) {
  fail("Benchmark identifier leaked into public fixtures");
}

for (const match of publicFixtureText.matchAll(/https?:\/\/[^\s"'`)]+/gi)) {
  const url = match[0];
  const synthetic =
    /^https?:\/\/www\.w3\.org\//i.test(url) ||
    /^https?:\/\/([a-z0-9-]+\.)*example\.invalid(\/|$)/i.test(url) ||
    /^http:\/\/localhost(:\d+)?(\/|$)/i.test(url) ||
    /^http:\/\/127\.0\.0\.1(:\d+)?(\/|$)/i.test(url);

  if (!synthetic) {
    fail(`Non-synthetic URL leaked into public fixtures: ${url}`);
  }
}

const brandValidator = path.join(
  root,
  "skills",
  "brand-dna-scanner",
  "scripts",
  "validate-brand-dna.mjs"
);

const manualValidator = path.join(
  root,
  "skills",
  "brand-manual-builder",
  "scripts",
  "validate-manual.mjs"
);

const manualBuilder = path.join(
  root,
  "skills",
  "brand-manual-builder",
  "scripts",
  "build-manual.mjs"
);

const scannerValidator = path.join(
  root,
  "skills",
  "reference-scanner",
  "scripts",
  "validate-style-dna.mjs"
);

const scannerBehaviorTests = path.join(
  root,
  "skills",
  "reference-scanner",
  "scripts",
  "test-behavior-gates.mjs"
);

const labValidator = path.join(
  root,
  "skills",
  "reference-lab-builder",
  "scripts",
  "validate-lab.mjs"
);

const labBuilder = path.join(
  root,
  "skills",
  "reference-lab-builder",
  "scripts",
  "build-lab.mjs"
);

const labRuntimeTests = path.join(
  root,
  "skills",
  "reference-lab-builder",
  "scripts",
  "test-runtime.mjs"
);

const builderValidator = path.join(
  root,
  "skills",
  "reference-to-astro",
  "scripts",
  "validate-inputs.mjs"
);

const brandExamples = [
  "--dna",
  path.join(root, "skills", "brand-dna-scanner", "examples", "BRAND_DNA.example.json"),
  "--evidence",
  path.join(root, "skills", "brand-dna-scanner", "examples", "BRAND_EVIDENCE.example.json")
];

const webFixtures = (directory) => [
  "--style",
  path.join(root, "tests", directory, "STYLE_DNA.json"),
  "--evidence",
  path.join(root, "tests", directory, "REFERENCE_EVIDENCE.json")
];

const approvedBlueprint = path.join(
  root,
  "skills",
  "reference-to-astro",
  "assets",
  "SITE_BLUEPRINT.example.json"
);

runNode("Brand DNA example rejected by its own validator", [
  brandValidator,
  ...brandExamples
]);

const manualExample = [
  "--dna",
  path.join(root, "skills", "brand-dna-scanner", "examples", "BRAND_DNA.example.json"),
  "--evidence",
  path.join(root, "skills", "brand-dna-scanner", "examples", "BRAND_EVIDENCE.example.json"),
  "--spec",
  path.join(root, "skills", "brand-manual-builder", "assets", "BRAND_MANUAL_SPEC.example.json")
];

runNode("Draft brand manual rejected in review mode", [
  manualValidator,
  ...manualExample
], { expect: "fail" });

runNode("Draft brand manual rejected in preparation mode", [
  manualValidator,
  ...manualExample,
  "--allow-draft"
]);

const manualBuildRoot = fs.mkdtempSync(path.join(os.tmpdir(), "brand-manual-build-"));
runNode("Brand manual example failed to render", [
  manualBuilder,
  ...manualExample,
  "--out",
  manualBuildRoot
]);

if (!fs.existsSync(path.join(manualBuildRoot, "index.html"))) {
  fail("Brand manual builder produced no index.html");
}

if (!fs.existsSync(path.join(manualBuildRoot, "BRAND_MANUAL.json"))) {
  fail("Brand manual builder produced no BRAND_MANUAL.json");
}

fs.rmSync(manualBuildRoot, { recursive: true, force: true });

runNode("Scan artifacts fixture rejected by reference-scanner", [
  scannerValidator,
  ...webFixtures("reference-system")
]);

runNode("Reference scanner behavior gate tests failed", [scannerBehaviorTests]);

const labExample = [
  "--style",
  path.join(root, "tests", "reference-system", "STYLE_DNA.json"),
  "--evidence",
  path.join(root, "tests", "reference-system", "REFERENCE_EVIDENCE.json"),
  "--spec",
  path.join(root, "skills", "reference-lab-builder", "assets", "REFERENCE_LAB_SPEC.example.json")
];

runNode("Draft reference lab was accepted in approval mode", [
  labValidator,
  ...labExample
], { expect: "fail" });

runNode("Draft reference lab failed preparation validation", [
  labValidator,
  ...labExample,
  "--allow-draft"
]);

const labBuildRoot = fs.mkdtempSync(path.join(os.tmpdir(), "reference-lab-build-"));
runNode("Reference lab example failed to render", [
  labBuilder,
  ...labExample,
  "--out",
  labBuildRoot
]);

runNode("Reference lab runtime tests failed", [labRuntimeTests]);

if (!fs.existsSync(path.join(labBuildRoot, "index.html"))) {
  fail("Reference lab builder produced no index.html");
}

if (!fs.existsSync(path.join(labBuildRoot, "REFERENCE_LAB.json"))) {
  fail("Reference lab builder produced no REFERENCE_LAB.json");
}

fs.rmSync(labBuildRoot, { recursive: true, force: true });

runNode("Reference-system fixture rejected by reference-to-astro", [
  builderValidator,
  ...webFixtures("reference-system"),
  "--content",
  path.join(root, "tests", "reference-system", "CONTENT_MANIFEST.json"),
  "--blueprint",
  approvedBlueprint
]);

const architectureRoot = fs.mkdtempSync(path.join(os.tmpdir(), "content-architecture-"));
runNode("Content architecture checkpoint failed to render", [
  path.join(root, "skills", "reference-to-astro", "scripts", "build-content-architecture.mjs"),
  "--content",
  path.join(root, "tests", "reference-system", "CONTENT_MANIFEST.json"),
  "--blueprint",
  approvedBlueprint,
  "--out",
  path.join(architectureRoot, "index.html")
]);
if (!fs.existsSync(path.join(architectureRoot, "index.html"))) {
  fail("Content architecture checkpoint produced no index.html");
}
fs.rmSync(architectureRoot, { recursive: true, force: true });

runNode("External visual editor changeset checks failed", [
  path.join(root, "skills", "reference-to-astro", "scripts", "test-review-changeset.mjs")
]);

const tuningRoot = path.join(root, "skills", "visual-tuning-kit");
const tuningValidator = path.join(tuningRoot, "scripts", "validate-tuning.mjs");
const tuningDeriver = path.join(tuningRoot, "scripts", "derive-schema.mjs");
const tuningSchema = path.join(tuningRoot, "assets", "TUNING_SCHEMA.example.json");
const tuningValues = path.join(tuningRoot, "assets", "TUNING_VALUES.example.json");

const derivedTuningRoot = fs.mkdtempSync(path.join(os.tmpdir(), "visual-tuning-derived-"));
const derivedSchema = path.join(derivedTuningRoot, "TUNING_SCHEMA.json");
const derivedValues = path.join(derivedTuningRoot, "TUNING_VALUES.json");
runNode("Visual tuning schema derivation failed", [
  tuningDeriver,
  "--project",
  path.join(root, "tests", "visual-tuning-derive"),
  "--id",
  "fixture-home",
  "--out",
  derivedSchema,
  "--values-out",
  derivedValues
]);

runNode("Derived visual tuning contracts failed draft validation", [
  tuningValidator,
  "--schema",
  derivedSchema,
  "--values",
  derivedValues,
  "--allow-draft"
]);

runNode("Derived draft values were accepted as production values", [
  tuningValidator,
  "--schema",
  derivedSchema,
  "--values",
  derivedValues
], { expect: "fail" });

const derivedDocument = JSON.parse(read(derivedSchema));
const derivedControls = derivedDocument.groups.flatMap((group) => group.controls);
const zeroControl = derivedControls.find((control) => control.id === "hero-offset-y");
if (!zeroControl || zeroControl.min === zeroControl.max || zeroControl.default !== 0) {
  fail("Derived zero-valued control has no usable range");
}

const durationControl = derivedControls.find((control) => control.id === "hero-transition");
if (!durationControl || durationControl.unit !== "ms" || durationControl.min < 0) {
  fail("Derived duration control is missing its non-negative ms contract");
}

const conflictRoot = path.join(derivedTuningRoot, "conflict-project");
fs.mkdirSync(path.join(conflictRoot, "src"), { recursive: true });
fs.writeFileSync(path.join(conflictRoot, "src", "a.css"), ":root{--space-gap:10px;}\n");
fs.writeFileSync(path.join(conflictRoot, "src", "b.css"), ".x{gap:var(--space-gap,20px);}\n");
runNode("Contradictory defaults produced an authoritative tuning draft", [
  tuningDeriver,
  "--project",
  conflictRoot,
  "--out",
  path.join(conflictRoot, "TUNING_SCHEMA.json")
], { expect: "fail" });

fs.rmSync(derivedTuningRoot, { recursive: true, force: true });

runNode("Draft tuning values were accepted as production values", [
  tuningValidator,
  "--schema",
  tuningSchema,
  "--values",
  tuningValues
], { expect: "fail" });

runNode("Draft tuning values failed preparation validation", [
  tuningValidator,
  "--schema",
  tuningSchema,
  "--values",
  tuningValues,
  "--allow-draft"
]);

runNode("Visual tuning runtime checks failed", [
  path.join(tuningRoot, "scripts", "test-runtime.mjs")
]);

const wordpressRoot = path.join(root, "skills", "wordpress-publisher");
const wordpressTemp = fs.mkdtempSync(path.join(os.tmpdir(), "wordpress-publisher-"));
const wordpressProject = path.join(wordpressTemp, "project");
copyTree(path.join(root, "tests", "wordpress-fixture"), wordpressProject);
const wordpressValidate = path.join(wordpressRoot, "scripts", "validate-plugin.mjs");
const wordpressPublish = path.join(wordpressRoot, "scripts", "publish.mjs");
const wordpressPlugin = path.join(wordpressProject, "wordpress", "build", "portada-fixture");
const wordpressZip = path.join(wordpressTemp, "portada-fixture.zip");

runNode("One-step WordPress publication failed", [
  wordpressPublish,
  "--project",
  wordpressProject,
  "--config",
  "wordpress.config.json",
  "--skip-build",
  "--out",
  wordpressZip
]);
if (!fs.existsSync(wordpressZip)) fail("One-step WordPress publication did not create its ZIP");

const brokenProject = path.join(wordpressTemp, "broken-project");
copyTree(path.join(root, "tests", "wordpress-fixture"), brokenProject);
const brokenIndex = path.join(brokenProject, "dist", "index.html");
fs.writeFileSync(
  brokenIndex,
  read(brokenIndex).replace("</body>", '<img src="/assets/missing.webp" alt="">\n</body>')
);
const brokenZip = path.join(wordpressTemp, "broken.zip");
runNode("One-step WordPress publication accepted a missing build asset", [
  wordpressPublish,
  "--project",
  brokenProject,
  "--config",
  "wordpress.config.json",
  "--skip-build",
  "--out",
  brokenZip
], { expect: "fail" });
if (fs.existsSync(brokenZip)) fail("Failed WordPress publication still created a ZIP");

fs.rmSync(path.join(wordpressPlugin, "dist", "assets", "hero.svg"), { force: true });
runNode("WordPress validator accepted a package with a missing declared asset", [
  wordpressValidate,
  "--plugin",
  wordpressPlugin
], { expect: "fail" });
fs.rmSync(wordpressTemp, { recursive: true, force: true });

const blueprintGateRoot = fs.mkdtempSync(
  path.join(os.tmpdir(), "site-blueprint-gate-")
);
const draftBlueprint = path.join(blueprintGateRoot, "SITE_BLUEPRINT.json");
const draftBlueprintDocument = JSON.parse(read(approvedBlueprint));
draftBlueprintDocument.approval = {
  status: "draft",
  approved_by: null,
  approved_at: null,
  notes: "Awaiting human review."
};
draftBlueprintDocument.checkpoints.find(
  (checkpoint) => checkpoint.id === "reference-lab"
).status = "pending";
fs.writeFileSync(
  draftBlueprint,
  `${JSON.stringify(draftBlueprintDocument, null, 2)}\n`
);

const blueprintGateArgs = [
  builderValidator,
  ...webFixtures("reference-system"),
  "--content",
  path.join(root, "tests", "reference-system", "CONTENT_MANIFEST.json"),
  "--blueprint",
  draftBlueprint
];

runNode(
  "Draft SITE_BLUEPRINT was accepted for construction",
  blueprintGateArgs,
  { expect: "fail" }
);

runNode("Draft SITE_BLUEPRINT cannot be validated as work in progress", [
  ...blueprintGateArgs,
  "--lenient"
]);

const directionalBlueprint = path.join(blueprintGateRoot, "SITE_BLUEPRINT.directional.json");
const directionalDocument = JSON.parse(read(approvedBlueprint));
directionalDocument.project.fidelity_target = "directional";
directionalDocument.checkpoints.find(
  (checkpoint) => checkpoint.id === "reference-lab"
).status = "pending";
directionalDocument.decisions[0].status = "open";
fs.writeFileSync(
  directionalBlueprint,
  `${JSON.stringify(directionalDocument, null, 2)}\n`
);
runNode("Directional blueprint incorrectly required high-fidelity ceremony", [
  builderValidator,
  ...webFixtures("reference-system"),
  "--content",
  path.join(root, "tests", "reference-system", "CONTENT_MANIFEST.json"),
  "--blueprint",
  directionalBlueprint
]);

const forensicBlueprint = path.join(blueprintGateRoot, "SITE_BLUEPRINT.forensic.json");
const forensicDocument = JSON.parse(read(approvedBlueprint));
forensicDocument.project.fidelity_target = "forensic";
forensicDocument.pages.home.sections[0].reference_patterns[0].mode = "inferred";
fs.writeFileSync(
  forensicBlueprint,
  `${JSON.stringify(forensicDocument, null, 2)}\n`
);
runNode("Forensic blueprint accepted an inferred pattern", [
  builderValidator,
  ...webFixtures("reference-system"),
  "--content",
  path.join(root, "tests", "reference-system", "CONTENT_MANIFEST.json"),
  "--blueprint",
  forensicBlueprint
], { expect: "fail" });

fs.rmSync(blueprintGateRoot, { recursive: true, force: true });

// The gates are the product. These fixtures must fail, and must fail only
// because of the gates: in lenient mode they are well-formed.
const rejectedBrand = [
  "--dna",
  path.join(root, "tests", "rejected", "BRAND_DNA.json"),
  "--evidence",
  path.join(root, "tests", "rejected", "BRAND_EVIDENCE.json")
];

runNode(
  "Unsupported Brand DNA fixture was accepted: the brand gates are not working",
  [brandValidator, ...rejectedBrand],
  { expect: "fail" }
);

runNode("Rejected Brand DNA fixture is malformed beyond the gates", [
  brandValidator,
  ...rejectedBrand,
  "--lenient"
]);

runNode(
  "Unsupported STYLE_DNA fixture was accepted: the web gates are not working",
  [scannerValidator, ...webFixtures("rejected")],
  { expect: "fail" }
);

runNode("Rejected STYLE_DNA fixture is malformed beyond the gates", [
  scannerValidator,
  ...webFixtures("rejected"),
  "--lenient"
]);

// The evasive fixture makes no false statement and breaks no schema. Every
// claim in it is concrete, every self-reported score is modest, and no
// evidence exists anywhere. It passed every gate until the gates stopped
// reading the author own scores.
runNode(
  "Evasive STYLE_DNA fixture was accepted: the gates are reading self-reported scores again",
  [scannerValidator, ...webFixtures("rejected-evasive")],
  { expect: "fail" }
);

runNode("Evasive STYLE_DNA fixture is malformed beyond the gates", [
  scannerValidator,
  ...webFixtures("rejected-evasive"),
  "--lenient"
]);

const evasiveBrand = [
  "--dna",
  path.join(root, "tests", "rejected-evasive", "BRAND_DNA.json"),
  "--evidence",
  path.join(root, "tests", "rejected-evasive", "BRAND_EVIDENCE.json")
];

runNode(
  "Evasive Brand DNA fixture was accepted: the gates are reading self-reported scores again",
  [brandValidator, ...evasiveBrand],
  { expect: "fail" }
);

runNode("Evasive Brand DNA fixture is malformed beyond the gates", [
  brandValidator,
  ...evasiveBrand,
  "--lenient"
]);

if (failures.length) {
  console.error("\nRepository validation failed:\n");
  for (const issue of failures) console.error(`- ${issue}`);
  process.exit(1);
}

console.log(`\nRepository validation passed (${files.length} files checked).`);
