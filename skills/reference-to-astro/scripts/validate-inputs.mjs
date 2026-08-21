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
  if (index === -1) return fallback;
  return process.argv[index + 1];
}

const files = {
  style: arg("style", "STYLE_DNA.json"),
  evidence: arg("evidence", "REFERENCE_EVIDENCE.json"),
  content: arg("content", "CONTENT_MANIFEST.json")
};

const schemaDir = arg(
  "schemas",
  path.resolve(scriptDir, "../schemas")
);

async function readJson(filePath) {
  const absolute = path.resolve(cwd, filePath);

  try {
    return JSON.parse(
      await fs.readFile(absolute, "utf8")
    );
  } catch (error) {
    throw new Error(
      `Unable to read JSON: ${absolute}\n${error.message}`
    );
  }
}

async function loadSchema(name) {
  return readJson(path.join(schemaDir, name));
}

function formatErrors(errors = []) {
  return errors
    .map((error) => {
      const location = error.instancePath || "/";
      return `  - ${location}: ${error.message}`;
    })
    .join("\n");
}

function unique(values) {
  return new Set(values).size === values.length;
}

function collectEvidenceIds(evidence) {
  const ids = new Set();

  const groups = [
    evidence.captures,
    evidence.interactions,
    evidence.motion_samples,
    evidence.responsive_samples,
    evidence.runtime_observations,
    evidence.technology_hypotheses,
    evidence.accessibility_observations,
    evidence.content_sources
  ];

  for (const group of groups) {
    for (const item of group || []) {
      if (item?.id) ids.add(item.id);
    }
  }

  return ids;
}

function validateEvidenceReferences(style, evidence) {
  const known = collectEvidenceIds(evidence);
  const missing = [];

  for (const observation of style.observations || []) {
    for (const ref of observation.evidence_refs || []) {
      if (!known.has(ref)) {
        missing.push({
          path: observation.path,
          ref
        });
      }
    }
  }

  return missing;
}

function validateAssetIds(content) {
  const ids = (content.assets || []).map(
    (asset) => asset.id
  );

  if (unique(ids)) return [];

  const seen = new Set();
  const duplicates = new Set();

  for (const id of ids) {
    if (seen.has(id)) duplicates.add(id);
    seen.add(id);
  }

  return [...duplicates];
}

function validateSectionAssetReferences(content) {
  const known = new Set(
    (content.assets || []).map(
      (asset) => asset.id
    )
  );

  const missing = [];

  for (const [pageId, page] of Object.entries(
    content.pages || {}
  )) {
    for (const section of page.sections || []) {
      for (const assetId of section.media || []) {
        if (!known.has(assetId)) {
          missing.push({
            page: pageId,
            section: section.id,
            asset: assetId
          });
        }
      }
    }
  }

  return missing;
}

async function main() {
  const [
    style,
    evidence,
    content,
    styleSchema,
    evidenceSchema,
    contentSchema
  ] = await Promise.all([
    readJson(files.style),
    readJson(files.evidence),
    readJson(files.content),

    loadSchema("style-dna.schema.json"),
    loadSchema("reference-evidence.schema.json"),
    loadSchema("content-manifest.schema.json")
  ]);

  const ajv = new Ajv2020({
    allErrors: true,
    strict: false
  });

  addFormats(ajv);

  const validators = {
    STYLE_DNA: ajv.compile(styleSchema),
    REFERENCE_EVIDENCE:
      ajv.compile(evidenceSchema),
    CONTENT_MANIFEST:
      ajv.compile(contentSchema)
  };

  const documents = {
    STYLE_DNA: style,
    REFERENCE_EVIDENCE: evidence,
    CONTENT_MANIFEST: content
  };

  let failed = false;

  for (const [name, validator] of Object.entries(
    validators
  )) {
    const valid = validator(documents[name]);

    if (!valid) {
      failed = true;

      console.error(
        `\n✗ ${name} schema validation failed`
      );

      console.error(
        formatErrors(validator.errors)
      );
    } else {
      console.log(`✓ ${name} schema valid`);
    }
  }

  const missingEvidence =
    validateEvidenceReferences(style, evidence);

  if (missingEvidence.length) {
    failed = true;

    console.error(
      "\n✗ STYLE_DNA contains unknown evidence_refs"
    );

    for (const issue of missingEvidence) {
      console.error(
        `  - ${issue.path}: ${issue.ref}`
      );
    }
  } else {
    console.log(
      "✓ STYLE_DNA evidence references valid"
    );
  }

  const duplicateAssets =
    validateAssetIds(content);

  if (duplicateAssets.length) {
    failed = true;

    console.error(
      "\n✗ Duplicate CONTENT_MANIFEST asset IDs"
    );

    for (const id of duplicateAssets) {
      console.error(`  - ${id}`);
    }
  } else {
    console.log("✓ Asset IDs unique");
  }

  const missingAssets =
    validateSectionAssetReferences(content);

  if (missingAssets.length) {
    failed = true;

    console.error(
      "\n✗ Sections reference unknown assets"
    );

    for (const issue of missingAssets) {
      console.error(
        `  - ${issue.page}/${issue.section}: ${issue.asset}`
      );
    }
  } else {
    console.log(
      "✓ Section asset references valid"
    );
  }

  if (failed) {
    process.exitCode = 1;
    return;
  }

  console.log(
    "\nReference Web System input validation passed."
  );
}

main().catch((error) => {
  console.error(error.stack || error.message);
  process.exitCode = 1;
});
