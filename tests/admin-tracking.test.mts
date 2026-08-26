import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

const gitignore = readFileSync(new URL("../.gitignore", import.meta.url), "utf8");

describe("admin source tracking", () => {
  const applicationRules = gitignore
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#"));

  it("does not exclude admin application source from Git", () => {
    assert.equal(applicationRules.some((rule) => rule.startsWith("src/app/(auth)")), false);
    assert.equal(applicationRules.some((rule) => rule.startsWith("src/app/(dashboard)")), false);
    assert.equal(applicationRules.some((rule) => rule.startsWith("src/components/")), false);
    assert.equal(applicationRules.some((rule) => rule.startsWith("src/services/")), false);
  });

  it("continues to exclude the local RSS database", () => {
    assert.match(gitignore, /^data\/$/m);
  });
});
