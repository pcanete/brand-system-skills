#!/usr/bin/env node

// Compara una copia compilada con la exportación de un editor HTML externo.
// El resultado es evidencia de revisión por data-rta-id, nunca código fuente.

import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

function arg(name, fallback = null) {
  const index = process.argv.indexOf(`--${name}`);
  return index === -1 ? fallback : process.argv[index + 1];
}

const RUNTIME_SPREAD = 3;
const STATE_LIKE = /^(is|has|was|being)-[a-z0-9-]+$/;

const declaredList = (name) =>
  new Set((arg(name, "") || "").split(",").map((item) => item.trim()).filter(Boolean));

export async function inspectHtml(browser, html, extraCss = "") {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.setContent(html, { waitUntil: "domcontentloaded" });

  const data = await page.evaluate(() => {
    const anchors = {};
    const duplicateAnchors = [];
    for (const element of document.querySelectorAll("[data-rta-id]")) {
      const id = element.dataset.rtaId;
      if (Object.hasOwn(anchors, id)) duplicateAnchors.push(id);
      anchors[id] = {
        tag: element.tagName.toLowerCase(),
        text: element.textContent.replace(/\s+/g, " ").trim(),
        attributes: Object.fromEntries(
          [...element.attributes].map((attribute) => [attribute.name, attribute.value])
        ),
        classes: [...element.classList].sort(),
      };
    }

    const attributeUse = {};
    const classUse = {};
    for (const element of document.querySelectorAll("*")) {
      for (const attribute of element.attributes) {
        attributeUse[attribute.name] = (attributeUse[attribute.name] || 0) + 1;
      }
      for (const name of element.classList) classUse[name] = (classUse[name] || 0) + 1;
    }

    const styleBlocks = [...document.querySelectorAll("style")].map((element) => ({
      id: element.id || null,
      css: element.textContent || "",
    }));

    return {
      anchors,
      duplicateAnchors: [...new Set(duplicateAnchors)].sort(),
      attributeUse,
      classUse,
      styleBlocks,
      elements: document.querySelectorAll("*").length,
    };
  });

  if (extraCss.trim()) {
    data.styleBlocks.push({ id: "external-editor-css", css: extraCss });
  }
  await context.close();
  return data;
}

export function parseRules(css) {
  const rules = [];
  for (const match of css.matchAll(/([^{}]+)\{([^}]*)\}/g)) {
    const selector = match[1].trim().replace(/\s+/g, " ");
    if (!selector || selector.startsWith("@")) continue;

    const declarations = {};
    for (const piece of match[2].split(";")) {
      const at = piece.indexOf(":");
      if (at === -1) continue;
      const property = piece.slice(0, at).trim();
      const value = piece.slice(at + 1).trim();
      if (property && value) declarations[property] = value;
    }
    if (Object.keys(declarations).length) rules.push({ selector, declarations });
  }
  return rules;
}

export function buildChangeset(before, after, declared = { attributes: new Set(), classes: new Set() }) {
  const runtimeAttributes = new Set(declared.attributes);
  for (const [name, count] of Object.entries(after.attributeUse)) {
    if (!before.attributeUse[name] && count >= RUNTIME_SPREAD) runtimeAttributes.add(name);
  }

  const runtimeClasses = new Set(declared.classes);
  for (const [name, count] of Object.entries(after.classUse)) {
    if (!before.classUse[name] && count >= RUNTIME_SPREAD) runtimeClasses.add(name);
  }

  const text = [];
  const attributes = [];
  const missing = [];

  for (const [id, was] of Object.entries(before.anchors)) {
    const now = after.anchors[id];
    if (!now) {
      missing.push(id);
      continue;
    }
    if (was.text !== now.text) text.push({ anchor: id, before: was.text, after: now.text });

    const names = new Set([...Object.keys(was.attributes), ...Object.keys(now.attributes)]);
    for (const name of names) {
      if (name === "class" || runtimeAttributes.has(name)) continue;
      if (was.attributes[name] === now.attributes[name]) continue;
      attributes.push({
        anchor: id,
        attribute: name,
        before: was.attributes[name] ?? null,
        after: now.attributes[name] ?? null,
      });
    }

    const classesBefore = was.classes.filter((name) => !runtimeClasses.has(name));
    const classesAfter = now.classes.filter((name) => !runtimeClasses.has(name));
    if (classesBefore.join(" ") !== classesAfter.join(" ")) {
      const added = classesAfter.filter((name) => !classesBefore.includes(name));
      const removed = classesBefore.filter((name) => !classesAfter.includes(name));
      const suspected = [...added, ...removed].filter((name) => STATE_LIKE.test(name));
      attributes.push({
        anchor: id,
        attribute: "class",
        before: classesBefore.join(" "),
        after: classesAfter.join(" "),
        ...(suspected.length ? { suspected_runtime: suspected } : {}),
      });
    }
  }

  const existing = new Map();
  for (const block of before.styleBlocks) {
    for (const rule of parseRules(block.css)) existing.set(rule.selector, rule.declarations);
  }

  const css = [];
  for (const block of after.styleBlocks) {
    for (const rule of parseRules(block.css)) {
      const had = existing.get(rule.selector);
      const changed = {};
      for (const [property, value] of Object.entries(rule.declarations)) {
        if (!had || had[property] !== value) changed[property] = value;
      }
      if (Object.keys(changed).length) {
        css.push({ selector: rule.selector, declarations: changed, from_block: block.id });
      }
    }
  }

  const added = Object.keys(after.anchors).filter((id) => !before.anchors[id]);
  return {
    version: "0.1",
    text,
    attributes,
    css,
    missing_anchors: missing,
    added_anchors: added,
    duplicate_anchors: {
      original: before.duplicateAnchors || [],
      edited: after.duplicateAnchors || [],
    },
    ignored_runtime_state: {
      attributes: [...runtimeAttributes].sort(),
      classes: [...runtimeClasses].sort(),
    },
    coverage: {
      anchors: Object.keys(before.anchors).length,
      elements_before: before.elements,
      elements_after: after.elements,
      anchored_share: before.elements ? Object.keys(before.anchors).length / before.elements : 0,
    },
  };
}

const optionalText = async (file) => file ? readFile(path.resolve(file), "utf8") : "";

async function main() {
  const originalFile = arg("original");
  const editedFile = arg("edited");
  if (!originalFile || !editedFile) {
    throw new Error(
      "Usage: review-changeset.mjs --original original/index.html --edited edited/index.html " +
      "[--edited-css edited/editor.css] [--out REVISION_CHANGESET.json]"
    );
  }

  const [originalHtml, editedHtml, originalCss, editedCss] = await Promise.all([
    readFile(path.resolve(originalFile), "utf8"),
    readFile(path.resolve(editedFile), "utf8"),
    optionalText(arg("original-css")),
    optionalText(arg("edited-css")),
  ]);

  const browser = await chromium.launch();
  let changeset;
  try {
    const [before, after] = await Promise.all([
      inspectHtml(browser, originalHtml, originalCss),
      inspectHtml(browser, editedHtml, editedCss),
    ]);
    changeset = buildChangeset(before, after, {
      attributes: declaredList("ignore-attributes"),
      classes: declaredList("ignore-classes"),
    });
  } finally {
    await browser.close();
  }

  console.log(`Text changes: ${changeset.text.length}`);
  console.log(`Attribute changes: ${changeset.attributes.length}`);
  console.log(`New or changed CSS rules: ${changeset.css.length}`);
  if (changeset.ignored_runtime_state.attributes.length || changeset.ignored_runtime_state.classes.length) {
    console.log("Runtime state ignored and recorded in the changeset.");
  }
  if (changeset.missing_anchors.length || changeset.added_anchors.length) {
    console.log(`Anchor changes: -${changeset.missing_anchors.length} +${changeset.added_anchors.length}`);
  }
  const duplicates = [
    ...changeset.duplicate_anchors.original,
    ...changeset.duplicate_anchors.edited,
  ];
  if (duplicates.length) {
    console.log(`WARNING: duplicate data-rta-id values: ${[...new Set(duplicates)].join(", ")}`);
  }
  console.log(
    `${changeset.coverage.anchors} anchors across ${changeset.coverage.elements_before} original elements ` +
    `(${(changeset.coverage.anchored_share * 100).toFixed(1)}%).`
  );

  const out = arg("out");
  if (out) {
    await writeFile(path.resolve(out), `${JSON.stringify(changeset, null, 2)}\n`, "utf8");
    console.log(`Changeset written: ${out}`);
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
