#!/usr/bin/env node

// Exports a verified Brand DNA as DESIGN.md, the open format for handing a
// visual system to other tools and agents (google-labs-code/design.md).
// HyperFrames, Stitch and any agent that reads DESIGN.md can then use the
// brand without knowing this skill's schema.
//
// The front matter of a DESIGN.md is normative: whoever reads it quotes the
// values exactly. So only tokens recorded as exact or derived, with evidence
// that resolves, reach it. Inferred tokens are written into the prose and
// labelled as inferences. A Brand DNA that fails its own gates is not
// exported at all: exporting it would launder unsupported claims into a file
// that carries no trace of their weakness.
//
// Usage:
//   node scripts/export-design-md.mjs \
//     --dna BRAND_DNA.json --evidence BRAND_EVIDENCE.json --out DESIGN.md
//
//   --json      print a report of what was exported and what was held back

import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

import {
  TOKEN_GROUPS,
  createValidator,
  formatSchemaErrors,
  readJson,
  verifyBrandContracts
} from "./lib/brand-contracts.mjs";

const cwd = process.cwd();
const scriptDir = path.dirname(fileURLToPath(import.meta.url));

function arg(name, fallback) {
  const index = process.argv.indexOf(`--${name}`);
  if (index === -1) return fallback;
  return process.argv[index + 1];
}

const asJson = process.argv.includes("--json");
const dnaFile = arg("dna", "BRAND_DNA.json");
const evidenceFile = arg("evidence", "BRAND_EVIDENCE.json");
const outFile = arg("out", "DESIGN.md");
const schemaDir = arg("schemas", path.resolve(scriptDir, "../schemas"));

const TYPOGRAPHY_FIELDS = [
  "fontFamily",
  "fontSize",
  "fontWeight",
  "lineHeight",
  "letterSpacing"
];

function normative(token) {
  return (
    (token.mode === "exact" || token.mode === "derived") &&
    (token.evidence_refs || []).length > 0
  );
}

// Every string is written double-quoted: JSON string syntax is valid YAML, so
// no value can break the front matter.
function scalar(value) {
  return typeof value === "number" ? String(value) : JSON.stringify(String(value));
}

function frontMatter(dna, groups) {
  const lines = ["---", 'version: "alpha"', `name: ${scalar(dna.brand.name)}`];

  lines.push(
    `description: ${scalar(
      `Exported from BRAND_DNA ${dna.version} by brand-dna-scanner. ` +
        "Tokens are evidence-backed observations; the prose is intent."
    )}`
  );

  const omitted = [];

  for (const group of TOKEN_GROUPS) {
    const tokens = groups[group].exported;

    if (!tokens.length) {
      omitted.push(group);
      continue;
    }

    lines.push(`${group}:`);

    // DESIGN.md requires colors.primary. It is published under that key and
    // under its own id, so references to either keep resolving.
    const primary = group === "colors" && tokens.find((token) => token.primary);
    if (primary) lines.push(`  primary: ${scalar(primary.value)}`);

    for (const token of tokens) {
      if (group === "typography") {
        lines.push(`  ${token.id}:`);
        for (const field of TYPOGRAPHY_FIELDS) {
          if (token[field] !== undefined && token[field] !== null) {
            lines.push(`    ${field}: ${scalar(token[field])}`);
          }
        }
      } else {
        lines.push(`  ${token.id}: ${scalar(token.value)}`);
      }
    }
  }

  // Components are compositions of tokens for one channel; a Brand DNA does
  // not own them, so they are always declared as left out.
  omitted.push("components");
  lines.push("omitted:");
  for (const group of omitted) lines.push(`  - ${scalar(group)}`);

  lines.push("---");
  return lines.join("\n");
}

function describeToken(group, token) {
  const value =
    group === "typography"
      ? [token.fontFamily, token.fontWeight, token.fontSize]
          .filter((part) => part !== undefined && part !== null)
          .join(" ")
      : token.value;

  const label = token.name ? `${token.name} — ` : "";
  const role = `${token.primary ? " (primary)" : ""}${token.role ? `: ${token.role}` : ""}`;
  const refs = (token.evidence_refs || []).length
    ? ` (evidence: ${token.evidence_refs.join(", ")})`
    : "";

  return `- \`${token.id}\` ${label}${value}${role}${refs}`;
}

function heldBack(group, tokens) {
  if (!tokens.length) return [];

  return [
    "",
    "Inferred, not normative — do not quote these as brand values:",
    "",
    ...tokens.map((token) => `${describeToken(group, token)} — ${token.mode}`)
  ];
}

// Free-form visual blocks are descriptive; they go into the prose as written,
// one level deep, with the path they came from.
function prose(block, sourcePath) {
  if (!block || typeof block !== "object") return [];

  const lines = [];

  for (const [key, value] of Object.entries(block)) {
    if (typeof value === "string" && value.trim()) {
      lines.push(`- **${key.replaceAll("_", " ")}**: ${value.trim()}`);
    }
  }

  return lines.length ? ["", `From \`${sourcePath}\`:`, "", ...lines] : [];
}

function list(items) {
  return (items || [])
    .filter((item) => typeof item === "string" && item.trim())
    .map((item) => `- ${item.trim()}`);
}

function body(dna, groups) {
  const sections = [];
  const visual = dna.visual || {};

  sections.push(
    [
      "## Overview",
      "",
      `Visual system of ${dna.brand.name}, exported from an evidence-backed Brand DNA.`,
      "Values in the front matter were observed in the brand's own material and",
      "trace to BRAND_EVIDENCE; anything inferred is marked as such below.",
      "Hex values and font families are strict. Sizes, spacing and border weights",
      "may be rescaled for the medium (a frame, a slide, a print run)."
    ].join("\n")
  );

  const colors = groups.colors;
  if (colors.exported.length || colors.held.length) {
    sections.push(
      [
        "## Colors",
        "",
        ...colors.exported.map((token) => describeToken("colors", token)),
        ...heldBack("colors", colors.held)
      ].join("\n")
    );
  }

  const typography = groups.typography;
  if (typography.exported.length || typography.held.length) {
    sections.push(
      [
        "## Typography",
        "",
        ...typography.exported.map((token) => describeToken("typography", token)),
        ...heldBack("typography", typography.held)
      ].join("\n")
    );
  }

  const layout = [
    ...groups.spacing.exported.map((token) => describeToken("spacing", token)),
    ...heldBack("spacing", groups.spacing.held),
    ...prose(visual.layout, "visual.layout")
  ];
  if (layout.length) sections.push(["## Layout", "", ...layout].join("\n"));

  const shapes = [
    ...groups.rounded.exported.map((token) => describeToken("rounded", token)),
    ...heldBack("rounded", groups.rounded.held),
    ...prose(visual.shape_language, "visual.shape_language")
  ];
  if (shapes.length) sections.push(["## Shapes", "", ...shapes].join("\n"));

  const rules = dna.rules || {};
  const preserve = list(rules.must_preserve);
  const avoid = list(rules.must_not_introduce);
  const channel = list(rules.channel_specific);

  if (preserve.length || avoid.length) {
    const block = ["## Do's and Don'ts"];
    if (preserve.length) block.push("", "Do:", "", ...preserve);
    if (avoid.length) block.push("", "Don't:", "", ...avoid);
    if (channel.length) {
      block.push("", "Channel-specific, not brand core:", "", ...channel);
    }
    sections.push(block.join("\n"));
  }

  return sections.join("\n\n");
}

async function main() {
  const [dna, evidence, dnaSchema, evidenceSchema] = await Promise.all([
    readJson(dnaFile, cwd),
    readJson(evidenceFile, cwd),
    readJson(path.join(schemaDir, "brand-dna.schema.json"), cwd),
    readJson(path.join(schemaDir, "brand-evidence.schema.json"), cwd)
  ]);

  const validators = createValidator({
    BRAND_DNA: dnaSchema,
    BRAND_EVIDENCE: evidenceSchema
  });

  const problems = [];

  for (const [name, document] of [
    ["BRAND_DNA", dna],
    ["BRAND_EVIDENCE", evidence]
  ]) {
    if (!validators[name](document)) {
      problems.push(`${name} schema:\n${formatSchemaErrors(validators[name].errors)}`);
    }
  }

  for (const group of verifyBrandContracts(dna, evidence, { strict: true })) {
    if (group.issues.length) {
      problems.push(`${group.label}:\n${group.issues.map((i) => `  - ${i}`).join("\n")}`);
    }
  }

  if (problems.length) {
    console.error("✗ Brand DNA does not pass its own gates; nothing exported.\n");
    console.error(problems.join("\n\n"));
    console.error("\nRun validate-brand-dna.mjs, fix the DNA, then export.");
    process.exitCode = 1;
    return;
  }

  const tokens = dna.visual?.tokens || {};
  const groups = Object.fromEntries(
    TOKEN_GROUPS.map((group) => {
      const all = tokens[group] || [];
      return [
        group,
        { exported: all.filter(normative), held: all.filter((t) => !normative(t)) }
      ];
    })
  );

  const exportedCount = TOKEN_GROUPS.reduce(
    (sum, group) => sum + groups[group].exported.length,
    0
  );

  if (!groups.colors.exported.length && !groups.typography.exported.length) {
    console.error(
      "✗ No evidence-backed colour or typography token in visual.tokens; nothing exported.\n" +
        "Record the values you observed (a hex from computed styles or a manual, a\n" +
        "family from a font file or the CSS) as visual.tokens with evidence_refs.\n" +
        "Prose in visual.color or visual.typography is not read: it cannot be\n" +
        "quoted exactly, and DESIGN.md front matter is quoted exactly."
    );
    process.exitCode = 1;
    return;
  }

  const primaries = (tokens.colors || []).filter((token) => token.primary);
  const warnings = [];

  if (primaries.length > 1) {
    console.error(
      `✗ ${primaries.length} colour tokens are marked primary (${primaries
        .map((t) => t.id)
        .join(", ")}); DESIGN.md has one colors.primary. Keep the one the evidence shows dominating.`
    );
    process.exitCode = 1;
    return;
  }

  if (primaries.length === 1 && !normative(primaries[0])) {
    console.error(
      `✗ '${primaries[0].id}' is marked primary but is ${primaries[0].mode} without evidence: ` +
        "the brand's primary colour cannot be a guess."
    );
    process.exitCode = 1;
    return;
  }

  if (!primaries.length && groups.colors.exported.length) {
    warnings.push(
      "No colour token is marked primary. DESIGN.md linters require colors.primary; " +
        "mark the one the evidence shows dominating, or leave it out on purpose."
    );
  }

  const markdown = `${frontMatter(dna, groups)}\n\n${body(dna, groups)}\n`.replace(
    /\n{3,}/g,
    "\n\n"
  );
  const target = path.resolve(cwd, outFile);
  await fs.writeFile(target, markdown, "utf8");

  const report = {
    ok: true,
    out: target,
    warnings,
    exported: Object.fromEntries(
      TOKEN_GROUPS.map((group) => [group, groups[group].exported.map((t) => t.id)])
    ),
    held_back: Object.fromEntries(
      TOKEN_GROUPS.map((group) => [
        group,
        groups[group].held.map((t) => ({ id: t.id, mode: t.mode }))
      ])
    )
  };

  if (asJson) {
    console.log(JSON.stringify(report, null, 2));
    return;
  }

  const heldCount = TOKEN_GROUPS.reduce(
    (sum, group) => sum + groups[group].held.length,
    0
  );

  console.log(`✓ DESIGN.md written: ${target}`);
  console.log(`  ${exportedCount} normative token(s), ${heldCount} held back as inferred.`);
  for (const warning of warnings) console.log(`  ! ${warning}`);
}

main().catch((error) => {
  console.error(error.stack || error.message);
  process.exitCode = 1;
});
