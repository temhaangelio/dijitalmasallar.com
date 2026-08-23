import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { isUuid } from "../src/lib/utils.ts";
import { isOptimizableImage } from "../src/lib/images.ts";

describe("isUuid", () => {
  test("accepts real UUIDs in either case", () => {
    assert.equal(isUuid("3f2504e0-4f89-41d3-9a0c-0305e82c3301"), true);
    assert.equal(isUuid("3F2504E0-4F89-41D3-9A0C-0305E82C3301"), true);
  });

  test("rejects the shapes the old [0-9a-f-]{36} pattern allowed", () => {
    assert.equal(isUuid("------------------------------------"), false);
    assert.equal(isUuid("3f2504e04f8941d39a0c0305e82c3301----"), false);
  });

  test("rejects wrong lengths, non-hex characters and non-strings", () => {
    assert.equal(isUuid("3f2504e0-4f89-41d3-9a0c-0305e82c330"), false);
    assert.equal(isUuid("3f2504e0-4f89-41d3-9a0c-0305e82c3301x"), false);
    assert.equal(isUuid("zzzzzzzz-4f89-41d3-9a0c-0305e82c3301"), false);
    assert.equal(isUuid(null), false);
    assert.equal(isUuid(42), false);
  });
});

describe("isOptimizableImage", () => {
  const projectUrl = "https://project.supabase.co";

  function withProject<T>(run: () => T) {
    const previous = process.env.NEXT_PUBLIC_SUPABASE_URL;
    process.env.NEXT_PUBLIC_SUPABASE_URL = projectUrl;
    try { return run(); } finally {
      if (previous) process.env.NEXT_PUBLIC_SUPABASE_URL = previous;
      else delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    }
  }

  test("accepts public storage URLs on the configured project", () => {
    withProject(() => {
      assert.equal(isOptimizableImage(`${projectUrl}/storage/v1/object/public/diji-post-media/a/b.webp`), true);
      assert.equal(isOptimizableImage(`${projectUrl}/storage/v1/object/public/ad-images/a/b.png`), true);
    });
  });

  test("rejects other hosts, other paths and plain http", () => {
    withProject(() => {
      assert.equal(isOptimizableImage("https://evil.com/storage/v1/object/public/x.png"), false);
      assert.equal(isOptimizableImage(`${projectUrl}/storage/v1/object/sign/private/x.png`), false);
      assert.equal(isOptimizableImage(`http://project.supabase.co/storage/v1/object/public/x.png`), false);
      assert.equal(isOptimizableImage("not a url"), false);
      assert.equal(isOptimizableImage(null), false);
    });
  });
});
