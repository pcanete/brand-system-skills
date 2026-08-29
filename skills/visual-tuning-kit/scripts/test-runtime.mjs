#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import visualTunerDev from "./visual-tuner-dev.mjs";
import { tunedOrder, tunedText, tunedValue } from "../assets/tuning-runtime.mjs";

const temp = await fs.mkdtemp(path.join(os.tmpdir(), "visual-tuning-kit-"));
await fs.mkdir(path.join(temp, "src", "tuning"), { recursive: true });
await fs.copyFile(new URL("../assets/TUNING_SCHEMA.example.json", import.meta.url), path.join(temp, "src", "tuning", "tuning.schema.json"));
await fs.copyFile(new URL("../assets/TUNING_VALUES.example.json", import.meta.url), path.join(temp, "src", "tuning", "tuning.values.json"));

const plugin = visualTunerDev({ root: temp });
assert.equal(plugin.apply, "serve");
assert.match(plugin.transformIndexHtml("<body></body>"), /__visual-tuner\/client\.js/);
assert.equal(plugin.transformIndexHtml("<main></main>"), "<main></main>");
assert.equal(tunedValue({ values: { spacing: 12 } }, "spacing", 4), 12);
assert.equal(tunedText({ values: { title: ["Uno", "Dos"] } }, "title"), "Uno\nDos");
assert.deepEqual(tunedOrder({ values: { order: ["b", "a"] } }, "order", ["a", "b"]), ["b", "a"]);
assert.deepEqual(tunedOrder({ values: { order: ["a", "a"] } }, "order", ["a", "b"]), ["a", "b"]);

const middleware = [];
plugin.configureServer({ middlewares: { use(prefix, handler) { middleware.push({ prefix, handler }); } } });
assert.equal(middleware.length, 1);
const request = { method: "GET", url: "/__visual-tuner/client.js" };
const chunks = [];
const response = { headers: {}, setHeader(key, value) { this.headers[key] = value; }, end(value) { chunks.push(value); } };
await middleware[0].handler(request, response, () => {});
assert.match(chunks.join(""), /customElements|visual-tuner/);
console.log("✓ Development-only tuner and production helpers verified");
