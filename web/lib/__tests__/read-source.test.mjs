import test from "node:test";
import assert from "node:assert/strict";
import { DEFAULT_READ_SOURCE, config, resolveReadSource } from "../config.ts";

test("read source keeps the legacy address as its default", () => {
  assert.equal(resolveReadSource(undefined), DEFAULT_READ_SOURCE);
  assert.equal(resolveReadSource(""), DEFAULT_READ_SOURCE);
  assert.equal(resolveReadSource("   "), DEFAULT_READ_SOURCE);
});

test("read source accepts a configured account", () => {
  const source = "GCUSTOMREADSOURCEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA";
  assert.equal(resolveReadSource(` ${source} `), source);
  assert.equal(
    config.readSource,
    resolveReadSource(process.env.NEXT_PUBLIC_READ_SOURCE),
  );
});
