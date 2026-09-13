import test from 'node:test';
import assert from 'node:assert/strict';
import { fetchSpeech } from '../src/lib/speech/connection.ts';

test('retries a pre-connection failure once', async () => {
  let calls = 0;
  const result = await fetchSpeech(async () => {
    if (++calls === 1) throw new TypeError('fetch failed', { cause: { code: 'UND_ERR_CONNECT_TIMEOUT' } });
    return new Response('ok');
  }, 'https://example.invalid', {});
  assert.equal(await result.text(), 'ok');
  assert.equal(calls, 2);
});

test('never retries uncertain failures or HTTP errors', async () => {
  for (const code of ['ECONNRESET', 'UND_ERR_SOCKET', 'UND_ERR_HEADERS_TIMEOUT']) {
    let calls = 0;
    await assert.rejects(fetchSpeech(async () => { calls++; throw new TypeError('fetch failed', { cause: { code } }); }, 'https://example.invalid', {}), /bağlantı kesildi/);
    assert.equal(calls, 1);
  }
  let calls = 0;
  assert.equal((await fetchSpeech(async () => { calls++; return new Response(null, { status: 503 }); }, 'https://example.invalid', {})).status, 503);
  assert.equal(calls, 1);
});

test('DNS retries are bounded and abort is respected', async () => {
  let calls = 0;
  await assert.rejects(fetchSpeech(async () => { calls++; throw new TypeError('fetch failed', { cause: { code: 'ENOTFOUND' } }); }, 'https://example.invalid', {}), /DNS/);
  assert.equal(calls, 2);
  const controller = new AbortController();
  controller.abort();
  calls = 0;
  await assert.rejects(fetchSpeech(async () => { calls++; throw controller.signal.reason; }, 'https://example.invalid', { signal: controller.signal }));
  assert.equal(calls, 1);
});
