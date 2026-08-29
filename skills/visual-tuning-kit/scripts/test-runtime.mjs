#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import visualTunerDev, { validNavigation } from "./visual-tuner-dev.mjs";
import { applyContent, assertApproved } from "./apply-content.mjs";
import { deriveRange, findAdjustables, RANGE_UNITS } from "./derive-schema.mjs";
import { collectTexts, summarizeMappings } from "./map-content.mjs";
import { tunedOrder, tunedText, tunedValue } from "../assets/tuning-runtime.mjs";

assert.deepEqual(deriveRange({ number: 0, unit: "px" }), { min: -64, max: 64, step: 1 });
assert.deepEqual(deriveRange({ number: 0, unit: "ms" }), { min: 0, max: 1000, step: 10 });
assert.equal(deriveRange({ number: 240, unit: "ms" }).min >= 0, true);
assert.equal(RANGE_UNITS.includes("svh") && RANGE_UNITS.includes("s"), true);
const discovered = findAdjustables([
  { file: "a.css", content: ":root { --hero-offset-y: 0px; --hero-duration: 240ms; }" },
  { file: "b.astro", content: ".hero { transform: translateY(var(--hero-offset-y, 0px)); }" }
]);
assert.equal(discovered.length, 2);
assert.equal(discovered.find((item) => item.name === "--hero-offset-y").conflicts.length, 0);
const manifestCoverage = collectTexts({ pages: { home: {
  route: "/",
  seo: { title: "No cuenta como contenido visible" },
  featured_story: { title: "Historia destacada" },
  sections: [{ id: "preguntas", type: "faq", title: "Preguntas", items: [{ question: "¿Una?", answer: ["Respuesta."] }] }]
} } }, "home");
assert.deepEqual(manifestCoverage.texts.map((item) => item.content_path), [
  "pages.home.featured_story.title",
  "pages.home.sections.preguntas.title",
  "pages.home.sections.preguntas.items.0.question",
  "pages.home.sections.preguntas.items.0.answer.0"
]);
assert.equal(manifestCoverage.texts[2].rta_id, "home.preguntas.items.0.question");
assert.deepEqual(summarizeMappings([{ matches: 1 }, { matches: 0 }, { matches: 2 }]), {
  declared: 3, linked: 1, missing: 1, ambiguous: 1, coverage: 33
});
const navigationControl = { min_items: 1, max_items: 6, max_length: 40, allowed_hosts: ["example.com"], allow_hash: true, allow_relative: true };
assert.equal(validNavigation(navigationControl, [{ id: "about", label: "About", href: "/about", target: "_self", visible: true }]), true);
assert.equal(validNavigation(navigationControl, [{ id: "bad", label: "Bad", href: "javascript:alert(1)", target: "_self", visible: true }]), false);
assert.equal(validNavigation(navigationControl, [{ id: "external", label: "External", href: "https://evil.example/", target: "_blank", visible: true }]), false);

const contentSchema = {
  id: "content-test",
  groups: [{ controls: [
    { id: "hero-title", kind: "text", max_length: 80, target: { content_path: "pages.home.sections.hero.title" } },
    { id: "faq-answer", kind: "text-lines", max_length: 120, target: { content_path: "pages.home.sections.faq.items.0.answer" } },
    { id: "hero-image", kind: "image", target: { content_path: "pages.home.sections.hero.image", public_base: "/assets/editable" } },
    { id: "section-order", kind: "section-order", options: [{ value: "hero" }, { value: "faq" }], target: { content_path: "pages.home.section_order" } },
    { id: "main-navigation", kind: "navigation", min_items: 1, max_items: 4, max_length: 40, allowed_hosts: ["example.com"], allow_hash: true, allow_relative: true, target: { content_path: "navigation.primary" } }
  ] }]
};
const originalContent = {
  pages: { home: {
    section_order: ["hero", "legacy", "faq"],
    sections: {
      hero: { title: "Old title", image: "/assets/editable/old.webp" },
      faq: { items: [{ id: "first", answer: ["Old answer"] }] }
    }
  } },
  navigation: { primary: [{ id: "home", label: "Home", href: "/", target: "_self", visible: true }] }
};
const approvedContentValues = {
  schema: "content-test",
  status: "approved",
  approved_by: "reviewer",
  approved_at: "2026-08-29T12:00:00Z",
  values: {
    "hero-title": "New title",
    "faq-answer": ["First line", "Second line"],
    "hero-image": "/assets/editable/new.webp",
    "section-order": ["faq", "hero"],
    "main-navigation": [
      { id: "home", label: "Home", href: "/", target: "_self", visible: true },
      { id: "about", label: "About", href: "#about", target: "_self", visible: true }
    ]
  }
};
assert.doesNotThrow(() => assertApproved(contentSchema, approvedContentValues));
assert.throws(() => assertApproved(contentSchema, { ...approvedContentValues, status: "draft" }), /human-approved/);
const appliedContent = applyContent(contentSchema, approvedContentValues, originalContent);
assert.deepEqual(appliedContent.issues, []);
assert.equal(appliedContent.applied.length, 5);
assert.equal(appliedContent.content.pages.home.sections.hero.title, "New title");
assert.deepEqual(appliedContent.content.pages.home.sections.faq.items[0].answer, ["First line", "Second line"]);
assert.deepEqual(appliedContent.content.pages.home.section_order, ["faq", "hero", "legacy"]);
assert.equal(originalContent.pages.home.sections.hero.title, "Old title");
const idempotentContent = applyContent(contentSchema, approvedContentValues, appliedContent.content);
assert.deepEqual(idempotentContent.issues, []);
assert.deepEqual(idempotentContent.applied, []);
assert.deepEqual(idempotentContent.content, appliedContent.content);
const invalidContentValues = structuredClone(approvedContentValues);
invalidContentValues.values["main-navigation"][1].href = "javascript:alert(1)";
const rolledBackContent = applyContent(contentSchema, invalidContentValues, originalContent);
assert.equal(rolledBackContent.issues.length, 1);
assert.deepEqual(rolledBackContent.applied, []);
assert.deepEqual(rolledBackContent.content, originalContent);

const temp = await fs.mkdtemp(path.join(os.tmpdir(), "visual-tuning-kit-"));
await fs.mkdir(path.join(temp, "src", "tuning"), { recursive: true });
await fs.mkdir(path.join(temp, "public", "assets", "editable"), { recursive: true });
await fs.copyFile(new URL("../assets/TUNING_SCHEMA.example.json", import.meta.url), path.join(temp, "src", "tuning", "tuning.schema.json"));
await fs.copyFile(new URL("../assets/TUNING_VALUES.example.json", import.meta.url), path.join(temp, "src", "tuning", "tuning.values.json"));
await fs.writeFile(path.join(temp, "public", "assets", "editable", "hero-default.webp"), "test");

const plugin = visualTunerDev({ root: temp });
assert.equal(plugin.apply, "serve");
assert.equal(tunedValue({ values: { spacing: 12 } }, "spacing", 4), 12);
assert.equal(tunedText({ values: { title: ["Uno", "Dos"] } }, "title"), "Uno\nDos");
assert.deepEqual(tunedOrder({ values: { order: ["b", "a"] } }, "order", ["a", "b"]), ["b", "a"]);
assert.deepEqual(tunedOrder({ values: { order: ["a", "a"] } }, "order", ["a", "b"]), ["a", "b"]);

const middleware = [];
plugin.configureServer({ middlewares: { use(prefix, handler) { middleware.push(typeof prefix === "function" ? { prefix: null, handler: prefix } : { prefix, handler }); } } });
assert.equal(middleware.length, 1);
const request = { method: "GET", url: "/__visual-tuner/client.js" };
const chunks = [];
const response = { headers: {}, setHeader(key, value) { this.headers[key] = value; }, end(value) { chunks.push(value); } };
await middleware[0].handler(request, response, () => {});
const clientSource = chunks.join("");
assert.match(clientSource, /customElements|visual-tuner/);
assert.match(clientSource, /schema\.groups\.entries/);
assert.match(clientSource, /related\.push\(control\)/);
assert.match(clientSource, /renderNavigation/);
assert.match(clientSource, /positionStorageKey/);
assert.match(clientSource, /setPointerCapture/);
assert.match(clientSource, /data-dragging/);

const configChunks = [];
const configResponse = { headers: {}, setHeader(key, value) { this.headers[key] = value; }, end(value) { configChunks.push(value); } };
await middleware[0].handler({ method: "GET", url: "/__visual-tuner/config" }, configResponse, () => {});
const config = JSON.parse(configChunks.join(""));
const imageControl = config.schema.groups.flatMap((group) => group.controls).find((control) => control.id === "hero-image");
assert.deepEqual(imageControl.asset_options, [{ value: "/assets/editable/hero-default.webp", label: "hero-default.webp", src: "/assets/editable/hero-default.webp" }]);
console.log("✓ Development-only tuner and production helpers verified");
