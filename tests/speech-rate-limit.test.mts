import test from "node:test";
import assert from "node:assert/strict";
import { fetchSpeechWithRateLimit, speechRateLimit } from "../src/lib/speech/rate-limit.ts";

const limited = (quotaId = "GenerateRequestsPerMinute", seconds = "2s", quotaValue = "10") => Response.json({ error: { details: [
  { "@type": "type.googleapis.com/google.rpc.QuotaFailure", violations: [{ quotaId, quotaValue }] },
  { "@type": "type.googleapis.com/google.rpc.RetryInfo", retryDelay: seconds },
] } }, { status: 429 });

test("temporary rejection waits as instructed and retries the same request once", async () => {
  const waits: number[] = [];
  let calls = 0;
  const result = await fetchSpeechWithRateLimit(async () => ++calls === 1 ? limited() : new Response("ok"), "https://example.com", {}, async ms => { waits.push(ms); });
  assert.equal(await result.text(), "ok");
  assert.equal(calls, 2);
  assert.deepEqual(waits, [2000]);
});

test("persistent rate limits stop after one retry", async () => {
  let calls = 0;
  await assert.rejects(fetchSpeechWithRateLimit(async () => { calls++; return limited(); }, "https://example.com", {}, async () => {}), /2 saniye/);
  assert.equal(calls, 2);
});

test("daily, zero and long limits never wait or retry", async () => {
  for (const [id, seconds, value, message] of [
    ["GenerateRequestsPerDay", "2s", "10", /günlük/],
    ["GenerateRequestsPerMinute", "2s", "0", /sıfır/],
    ["GenerateRequestsPerMinute", "120s", "10", /120 saniye/],
  ] as const) {
    let calls = 0;
    await assert.rejects(fetchSpeechWithRateLimit(async () => { calls++; return limited(id, seconds, value); }, "https://example.com", {}, async () => { assert.fail("should not wait"); }), message);
    assert.equal(calls, 1);
  }
});

test("missing error details stay an unspecified quota error", async () => {
  assert.equal((await speechRateLimit(new Response("invalid", { status: 429 }))).seconds, 0);
  assert.equal((await speechRateLimit(Response.json(null, { status: 429 }))).seconds, 0);
});
