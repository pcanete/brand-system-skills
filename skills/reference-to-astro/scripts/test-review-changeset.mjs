#!/usr/bin/env node

import assert from "node:assert/strict";
import { chromium } from "playwright";
import { buildChangeset, inspectHtml, parseRules } from "./review-changeset.mjs";

assert.deepEqual(parseRules(".a { color: red; margin-top: 2px; }"), [
  { selector: ".a", declarations: { color: "red", "margin-top": "2px" } },
]);

const original = `<!doctype html><html><head><style>.title{font-size:12px}</style></head><body>
  <h1 class="title" data-rta-id="home.hero.title">Original</h1>
  <p data-rta-id="home.hero.copy">Copy</p>
  <a data-rta-id="home.hero.cta" href="/old">Go</a>
  <script>document.querySelector('h1').textContent='SCRIPT RAN'</script>
</body></html>`;

const edited = `<!doctype html><html data-ready><head><style>.title{font-size:12px}</style></head><body data-ready>
  <h1 class="title is-leaving" data-ready data-rta-id="home.hero.title">Edited</h1>
  <p class="is-leaving" data-rta-id="home.hero.copy">Copy</p>
  <a class="is-leaving is-compact" data-rta-id="home.hero.cta" href="/new">Go</a>
</body></html>`;

const browser = await chromium.launch();
let before;
let after;
try {
  before = await inspectHtml(browser, original);
  after = await inspectHtml(browser, edited, ".title { font-size: 14px; font-weight: 700; }");
} finally {
  await browser.close();
}

assert.equal(before.anchors["home.hero.title"].text, "Original", "page scripts must stay disabled");
const changeset = buildChangeset(before, after, { attributes: new Set(), classes: new Set() });
assert.deepEqual(changeset.text, [{ anchor: "home.hero.title", before: "Original", after: "Edited" }]);
assert.deepEqual(changeset.ignored_runtime_state.attributes, ["data-ready"]);
assert.deepEqual(changeset.ignored_runtime_state.classes, ["is-leaving"]);
const href = changeset.attributes.find((item) => item.attribute === "href");
assert.deepEqual(href, { anchor: "home.hero.cta", attribute: "href", before: "/old", after: "/new" });
const compact = changeset.attributes.find((item) => item.attribute === "class");
assert.deepEqual(compact.suspected_runtime, ["is-compact"]);
assert.deepEqual(changeset.css, [{
  selector: ".title",
  declarations: { "font-size": "14px", "font-weight": "700" },
  from_block: "external-editor-css",
}]);
assert.deepEqual(changeset.missing_anchors, []);
assert.deepEqual(changeset.added_anchors, []);
console.log("✓ External editor changeset filters runtime state and preserves authored changes");
