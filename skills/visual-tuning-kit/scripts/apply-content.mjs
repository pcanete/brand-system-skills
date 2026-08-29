#!/usr/bin/env node

import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

import { validNavigation } from "./visual-tuner-dev.mjs";

function arg(name, fallback = null) {
  const index = process.argv.indexOf(`--${name}`);
  return index === -1 ? fallback : process.argv[index + 1];
}

const readJson = async (file) => JSON.parse(await readFile(path.resolve(file), "utf8"));

function resolveTarget(root, dottedPath) {
  const segments = String(dottedPath).split(".");
  let node = root;

  for (const segment of segments.slice(0, -1)) {
    if (node && typeof node === "object" && !Array.isArray(node) && segment in node) {
      node = node[segment];
      continue;
    }
    if (Array.isArray(node)) {
      const numericIndex = /^\d+$/.test(segment) ? Number(segment) : -1;
      const matchIndex = numericIndex >= 0
        ? numericIndex
        : node.findIndex((item) => item && typeof item === "object" && item.id === segment);
      if (matchIndex >= 0 && matchIndex < node.length) {
        node = node[matchIndex];
        continue;
      }
    }
    return { found: false, stoppedAt: segment };
  }

  const leaf = segments.at(-1);
  if (Array.isArray(node)) {
    const numericIndex = /^\d+$/.test(leaf) ? Number(leaf) : -1;
    const index = numericIndex >= 0
      ? numericIndex
      : node.findIndex((item) => item && typeof item === "object" && item.id === leaf);
    return index < 0
      || index >= node.length
      ? { found: false, stoppedAt: leaf }
      : { found: true, container: node, key: index };
  }
  if (!node || typeof node !== "object" || !(leaf in node)) {
    return { found: false, stoppedAt: leaf };
  }
  return { found: true, container: node, key: leaf };
}

function validText(control, value) {
  return typeof value === "string"
    && value.length >= (control.min_length || 0)
    && value.length <= (control.max_length || 1000);
}

export function coerceContent(control, value, current) {
  if (control.kind === "text") {
    if (!validText(control, value)) throw new Error("text value violates min_length or max_length");
    return value;
  }

  if (control.kind === "text-lines") {
    const lines = Array.isArray(value) ? value : null;
    if (!lines || !lines.length || !lines.every((line) => typeof line === "string" && line.trim())) {
      throw new Error("text-lines value must be a non-empty string list");
    }
    if (lines.join("\n").length > (control.max_length || 2000)) {
      throw new Error("text-lines value exceeds max_length");
    }
    return [...lines];
  }

  if (control.kind === "image") {
    const publicBase = String(control.target?.public_base || "").replace(/\/$/, "");
    if (typeof value !== "string" || !value.startsWith("/") || !publicBase || !value.startsWith(`${publicBase}/`)) {
      throw new Error("image value must stay inside the declared public_base");
    }
    return value;
  }

  if (control.kind === "section-order") {
    if (!Array.isArray(current)) throw new Error("section-order target is not an array");
    const allowed = (control.options || []).map((option) => option.value);
    if (!Array.isArray(value)
      || value.length !== allowed.length
      || new Set(value).size !== allowed.length
      || !value.every((id) => allowed.includes(id))) {
      throw new Error("section-order value does not match the declared options");
    }
    const byId = new Map(current.map((item) => [typeof item === "string" ? item : item?.id, item]));
    const missing = value.filter((id) => !byId.has(id));
    if (missing.length) throw new Error(`section-order references missing sections: ${missing.join(", ")}`);
    const rest = current.filter((item) => !value.includes(typeof item === "string" ? item : item?.id));
    return [...value.map((id) => byId.get(id)), ...rest];
  }

  if (control.kind === "navigation") {
    if (!validNavigation(control, value)) {
      throw new Error("navigation value violates ids, labels, targets, limits or allowed destinations");
    }
    return value.map((item) => ({
      id: item.id,
      label: item.label,
      href: item.href,
      target: item.target,
      visible: item.visible
    }));
  }

  throw new Error(`kind '${control.kind}' cannot write content`);
}

export function applyContent(schema, values, content) {
  const candidate = structuredClone(content);
  const pending = [];
  const issues = [];
  const controls = schema.groups
    .flatMap((group) => group.controls)
    .filter((control) => control.target?.content_path);

  for (const control of controls) {
    const value = values.values?.[control.id];
    if (value === undefined) {
      issues.push(`${control.id}: missing approved value`);
      continue;
    }
    const target = resolveTarget(candidate, control.target.content_path);
    if (!target.found) {
      issues.push(`${control.id}: content path '${control.target.content_path}' stops at '${target.stoppedAt}'`);
      continue;
    }
    const before = target.container[target.key];
    try {
      const after = coerceContent(control, value, before);
      if (JSON.stringify(before) === JSON.stringify(after)) continue;
      target.container[target.key] = after;
      pending.push({ id: control.id, path: control.target.content_path, before, after });
    } catch (error) {
      issues.push(`${control.id}: ${error.message}`);
    }
  }

  if (issues.length) {
    return { content: structuredClone(content), applied: [], issues, controls: controls.length };
  }
  return { content: candidate, applied: pending, issues: [], controls: controls.length };
}

export function assertApproved(schema, values) {
  if (values.schema !== schema.id) throw new Error("TUNING_VALUES schema id does not match TUNING_SCHEMA");
  if (values.status !== "approved" || !values.approved_by || !values.approved_at) {
    throw new Error("Only human-approved tuning values can modify CONTENT_MANIFEST");
  }
}

async function main() {
  const schemaFile = arg("schema");
  const valuesFile = arg("values");
  const contentFile = arg("content");
  if (!schemaFile || !valuesFile || !contentFile) {
    throw new Error(
      "Usage: apply-content.mjs --schema TUNING_SCHEMA.json --values TUNING_VALUES.json " +
      "--content CONTENT_MANIFEST.json [--out CONTENT_MANIFEST.json] [--dry-run]"
    );
  }

  const [schema, values, content] = await Promise.all([
    readJson(schemaFile),
    readJson(valuesFile),
    readJson(contentFile)
  ]);
  assertApproved(schema, values);
  const result = applyContent(schema, values, content);
  if (result.issues.length) {
    throw new Error(`No content was applied:\n${result.issues.map((issue) => `  - ${issue}`).join("\n")}`);
  }
  if (!result.applied.length) {
    console.log(`No changes: ${result.controls} content controls already match the manifest.`);
    return;
  }
  if (process.argv.includes("--dry-run")) {
    console.log(`${result.applied.length} content changes validated. Nothing written (--dry-run).`);
    return;
  }
  const output = path.resolve(arg("out", contentFile));
  await writeFile(output, `${JSON.stringify(result.content, null, 2)}\n`, "utf8");
  console.log(`✓ ${result.applied.length} approved content changes applied to ${output}`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
