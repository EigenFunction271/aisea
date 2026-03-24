import test from "node:test";
import assert from "node:assert/strict";

import {
  dedupeLeadingLocalePath,
  stripLeadingLocalePath,
} from "./dedupe-locale-path";

test("dedupeLeadingLocalePath collapses duplicated locale prefix", () => {
  assert.equal(dedupeLeadingLocalePath("/vi/vi/dashboard"), "/vi/dashboard");
  assert.equal(dedupeLeadingLocalePath("/en/en"), "/en");
});

test("dedupeLeadingLocalePath leaves valid/unknown paths untouched", () => {
  assert.equal(dedupeLeadingLocalePath("/vi/dashboard"), "/vi/dashboard");
  assert.equal(dedupeLeadingLocalePath("/foo/foo/dashboard"), "/foo/foo/dashboard");
  assert.equal(dedupeLeadingLocalePath("/dashboard"), "/dashboard");
});

test("stripLeadingLocalePath removes one leading locale only", () => {
  assert.equal(stripLeadingLocalePath("/vi/dashboard"), "/dashboard");
  assert.equal(stripLeadingLocalePath("/en"), "/");
  assert.equal(stripLeadingLocalePath("/dashboard"), "/dashboard");
});

test("stripLeadingLocalePath composes with dedupe guard", () => {
  const next = dedupeLeadingLocalePath("/vi/vi/dashboard");
  assert.equal(next, "/vi/dashboard");
  assert.equal(stripLeadingLocalePath(next), "/dashboard");
});

