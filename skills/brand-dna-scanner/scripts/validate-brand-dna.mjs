#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";

const cwd = process.cwd();
const scriptDir = path.dirname(
  fileURLToPath(import.meta.url)
);

function arg(name, fallback) {
  const index = process.argv.indexOf(`--${name}`);

  return index === -1
    ? fallback
    : process.argv[index + 1];
}

async function readJson(file) {
  return JSON.parse(
    await fs.readFile(
      path.resolve(cwd, file),
      "utf8"
    )
  );
}

const dnaFile =
  arg("dna", "BRAND_DNA.json");

const evidenceFile =
  arg("evidence", "BRAND_EVIDENCE.json");

const schemaDir = path.resolve(
  cwd,
  arg("schemas", path.resolve(scriptDir, "../schemas"))
);

function evidenceIds(evidence) {
  return new Set(
    (evidence.evidence || [])
      .map((item) => item.id)
      .filter(Boolean)
  );
}

function validateRefs(dna, evidence) {
  const known = evidenceIds(evidence);
  const missing = [];

  const inspect = (item, label) => {
    for (const ref of item?.evidence_refs || []) {
      if (!known.has(ref)) {
        missing.push({
          label,
          ref
        });
      }
    }
  };

  for (const observation of dna.observations || []) {
    inspect(
      observation,
      `observation:${observation.path}`
    );
  }

  for (const asset of dna.distinctive_assets || []) {
    inspect(
      asset,
      `asset:${asset.id}`
    );
  }

  return missing;
}

async function main() {
  const [
    dna,
    evidence,
    dnaSchema,
    evidenceSchema
  ] = await Promise.all([
    readJson(dnaFile),
    readJson(evidenceFile),
    readJson(
      path.join(
        schemaDir,
        "brand-dna.schema.json"
      )
    ),
    readJson(
      path.join(
        schemaDir,
        "brand-evidence.schema.json"
      )
    )
  ]);

  const ajv = new Ajv2020({
    strict: false,
    allErrors: true
  });

  addFormats(ajv);

  const validateDna =
    ajv.compile(dnaSchema);

  const validateEvidence =
    ajv.compile(evidenceSchema);

  let failed = false;

  if (!validateDna(dna)) {
    failed = true;
    console.error(
      "\n✗ BRAND_DNA schema validation failed"
    );

    for (const error of validateDna.errors || []) {
      console.error(
        `  - ${error.instancePath || "/"}: ${error.message}`
      );
    }
  } else {
    console.log(
      "✓ BRAND_DNA schema valid"
    );
  }

  if (!validateEvidence(evidence)) {
    failed = true;

    console.error(
      "\n✗ BRAND_EVIDENCE schema validation failed"
    );

    for (
      const error
      of validateEvidence.errors || []
    ) {
      console.error(
        `  - ${error.instancePath || "/"}: ${error.message}`
      );
    }
  } else {
    console.log(
      "✓ BRAND_EVIDENCE schema valid"
    );
  }

  const missing =
    validateRefs(dna, evidence);

  if (missing.length) {
    failed = true;

    console.error(
      "\n✗ Unknown evidence references"
    );

    for (const issue of missing) {
      console.error(
        `  - ${issue.label}: ${issue.ref}`
      );
    }
  } else {
    console.log(
      "✓ Evidence references valid"
    );
  }

  if (failed) {
    process.exitCode = 1;
    return;
  }

  console.log(
    "\nBrand DNA validation passed."
  );
}

main().catch((error) => {
  console.error(
    error.stack || error.message
  );

  process.exitCode = 1;
});
