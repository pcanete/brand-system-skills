#!/usr/bin/env node

import crypto from "node:crypto";
import fs from "node:fs";
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

function relative(file) {
  return path.relative(root, file).replaceAll("\\", "/");
}

function runNode(label, args, cwd = root) {
  const result = spawnSync(process.execPath, args, {
    cwd,
    encoding: "utf8",
    stdio: "pipe"
  });
  if (result.status !== 0) {
    fail(`${label}\n${result.stdout || ""}${result.stderr || ""}`);
  } else if (result.stdout.trim()) {
    console.log(result.stdout.trim());
  }
}

const files = walk(root);

for (const file of files.filter((item) => item.endsWith(".json"))) {
  try {
    JSON.parse(fs.readFileSync(file, "utf8"));
  } catch (error) {
    fail(`Invalid JSON: ${relative(file)}: ${error.message}`);
  }
}

for (const file of files.filter((item) => item.endsWith(".mjs"))) {
  runNode(`Invalid JavaScript: ${relative(file)}`, ["--check", file]);
}

const skillNames = [
  "brand-dna-scanner",
  "reference-scanner",
  "reference-to-astro"
];

for (const name of skillNames) {
  const skillRoot = path.join(root, "skills", name);
  const skillFile = path.join(skillRoot, "SKILL.md");
  const agentFile = path.join(skillRoot, "agents", "openai.yaml");
  if (!fs.existsSync(skillFile)) fail(`Missing skills/${name}/SKILL.md`);
  if (!fs.existsSync(agentFile)) fail(`Missing skills/${name}/agents/openai.yaml`);
  if (!fs.existsSync(skillFile)) continue;

  const markdown = fs.readFileSync(skillFile, "utf8");
  const declared = markdown.match(/^---[\s\S]*?^name:\s*([^\r\n]+)[\s\S]*?^---/m)?.[1]?.trim();
  if (declared !== name) {
    fail(`Skill name mismatch: directory ${name}, frontmatter ${declared || "missing"}`);
  }

  const linkPattern = /`((?:references|assets|schemas)\/[^`]+)`/g;
  for (const match of markdown.matchAll(linkPattern)) {
    const linked = path.join(skillRoot, ...match[1].split("/"));
    if (!fs.existsSync(linked)) {
      fail(`Broken local skill reference: skills/${name}/${match[1]}`);
    }
  }
}

function digest(file) {
  return crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
}

for (const schema of ["style-dna.schema.json", "reference-evidence.schema.json"]) {
  const scanner = path.join(root, "skills", "reference-scanner", "schemas", schema);
  const builder = path.join(root, "skills", "reference-to-astro", "schemas", schema);
  if (!fs.existsSync(scanner) || !fs.existsSync(builder) || digest(scanner) !== digest(builder)) {
    fail(`Shared web schema drift: ${schema}`);
  }
}

const publicFixtureText = files
  .filter((file) => relative(file).startsWith("tests/"))
  .map((file) => fs.readFileSync(file, "utf8"))
  .join("\n");
if (/benchmark-/i.test(publicFixtureText)) {
  fail("Benchmark identifier leaked into public fixtures");
}
for (const match of publicFixtureText.matchAll(/https?:\/\/[^\s"']+/gi)) {
  if (!match[0].startsWith("https://example.invalid")) {
    fail(`Non-synthetic URL leaked into public fixtures: ${match[0]}`);
  }
}

runNode("Brand DNA fixture validation failed", [
  path.join(root, "skills", "brand-dna-scanner", "scripts", "validate-brand-dna.mjs"),
  "--dna",
  path.join(root, "skills", "brand-dna-scanner", "examples", "BRAND_DNA.example.json"),
  "--evidence",
  path.join(root, "skills", "brand-dna-scanner", "examples", "BRAND_EVIDENCE.example.json")
]);

runNode("Reference-system fixture validation failed", [
  path.join(root, "skills", "reference-to-astro", "scripts", "validate-inputs.mjs"),
  "--style",
  path.join(root, "tests", "reference-system", "STYLE_DNA.json"),
  "--evidence",
  path.join(root, "tests", "reference-system", "REFERENCE_EVIDENCE.json"),
  "--content",
  path.join(root, "tests", "reference-system", "CONTENT_MANIFEST.json")
]);

if (failures.length) {
  console.error("\nRepository validation failed:\n");
  for (const issue of failures) console.error(`- ${issue}`);
  process.exit(1);
}

console.log(`\nRepository validation passed (${files.length} files checked).`);
