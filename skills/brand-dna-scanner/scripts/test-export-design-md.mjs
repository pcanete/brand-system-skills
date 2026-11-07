#!/usr/bin/env node

// Checks the DESIGN.md export against the property that matters: nothing
// without evidence reaches the front matter, which consumers quote exactly.
// Exit code 0 is not enough; a writer that emits an empty or unfiltered file
// would also exit 0.

import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const skillRoot = path.dirname(scriptDir);
const repoRoot = path.resolve(skillRoot, "..", "..");
const exporter = path.join(scriptDir, "export-design-md.mjs");
const work = fs.mkdtempSync(path.join(os.tmpdir(), "design-md-"));
const failures = [];

function run(dna, evidence, out, extra = []) {
  return spawnSync(
    process.execPath,
    [exporter, "--dna", dna, "--evidence", evidence, "--out", out, ...extra],
    { encoding: "utf8" }
  );
}

function frontMatter(markdown) {
  return markdown.match(/^---\n([\s\S]*?)\n---/)?.[1] ?? "";
}

// 1. The worked example exports, and only its evidenced tokens are normative.
const exampleOut = path.join(work, "example.md");
const example = run(
  path.join(skillRoot, "examples", "BRAND_DNA.example.json"),
  path.join(skillRoot, "examples", "BRAND_EVIDENCE.example.json"),
  exampleOut
);

if (example.status !== 0) {
  failures.push(`example did not export:\n${example.stderr}`);
} else {
  const markdown = fs.readFileSync(exampleOut, "utf8");
  const head = frontMatter(markdown);

  if (!head) failures.push("example export has no front matter");
  if (!/^ {2}primary: "#111111"$/m.test(head)) {
    failures.push("colors.primary missing or wrong in the front matter");
  }
  if (!/fontFamily: "Example Grotesk"/.test(head)) {
    failures.push("evidenced typography token missing from the front matter");
  }
  if (/#C68A2E/i.test(head)) {
    failures.push("an inferred colour reached the front matter");
  }
  if (!/Inferred, not normative[\s\S]*#C68A2E/.test(markdown)) {
    failures.push("the inferred colour is not disclosed in the prose");
  }
  if (!/^ {2}- "components"$/m.test(head)) {
    failures.push("components are not declared as omitted");
  }
}

// 2. A DNA with an unsupported exact token is refused, and no file is left.
const rejectedOut = path.join(work, "rejected.md");
const rejected = run(
  path.join(repoRoot, "tests", "rejected-tokens", "BRAND_DNA.json"),
  path.join(repoRoot, "tests", "rejected-tokens", "BRAND_EVIDENCE.json"),
  rejectedOut
);

if (rejected.status === 0) failures.push("unsupported token DNA was exported");
if (fs.existsSync(rejectedOut)) failures.push("refused export still wrote a file");
if (!/visual\.tokens\.colors\.accent/.test(rejected.stderr)) {
  failures.push(`refusal does not name the unsupported token:\n${rejected.stderr}`);
}

// 3. A DNA with no tokens is refused instead of guessing from prose.
const bare = JSON.parse(
  fs.readFileSync(path.join(skillRoot, "examples", "BRAND_DNA.example.json"), "utf8")
);
delete bare.visual.tokens;
const bareFile = path.join(work, "bare.json");
fs.writeFileSync(bareFile, JSON.stringify(bare));
const bareRun = run(
  bareFile,
  path.join(skillRoot, "examples", "BRAND_EVIDENCE.example.json"),
  path.join(work, "bare.md")
);
if (bareRun.status === 0) failures.push("a DNA without tokens was exported");

fs.rmSync(work, { recursive: true, force: true });

if (failures.length) {
  console.error("✗ DESIGN.md export");
  for (const failure of failures) console.error(`  - ${failure}`);
  process.exit(1);
}

console.log("✓ DESIGN.md export keeps unsupported tokens out of the front matter");
