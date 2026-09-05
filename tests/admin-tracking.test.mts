import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

const gitignore = readFileSync(new URL("../.gitignore", import.meta.url), "utf8");

describe("admin source tracking", () => {
  const applicationRules = gitignore
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#"));

  it("keeps shared admin application source in Git", () => {
    assert.equal(applicationRules.some((rule) => rule.startsWith("src/app/(auth)")), false);
    assert.equal(applicationRules.includes("src/app/(dashboard)/dashboard/"), false);
    assert.equal(applicationRules.includes("src/components/layout/"), false);
    assert.equal(applicationRules.includes("src/services/posts.ts"), false);
  });

  it("excludes local RSS tools from Git", () => {
    assert.equal(applicationRules.includes("src/app/(dashboard)/rss/"), true);
    assert.equal(applicationRules.includes("src/components/features/rss/"), true);
    assert.equal(applicationRules.includes("src/lib/rss/"), true);
    assert.equal(applicationRules.includes("src/services/rss.ts"), true);
  });

  it("continues to exclude the local RSS database", () => {
    assert.match(gitignore, /^data\/$/m);
  });
});
