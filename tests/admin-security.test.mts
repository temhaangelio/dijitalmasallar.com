import assert from 'node:assert/strict';
import { test } from 'node:test';
import sharp from 'sharp';
import { publicStoragePath } from '../src/lib/storage-path.ts';
import { createAttemptStore } from '../src/lib/rate-limit-store.ts';
import { inspectRasterUpload } from '../src/lib/validate-image-upload.ts';
import { postSchema } from '../src/lib/validations/post.ts';

const project = 'https://project.supabase.co';
const prefix = '/storage/v1/object/public/ad-images/';
test('storage deletion only accepts an object in the configured origin and bucket', () => {
  assert.equal(publicStoragePath(project + prefix + 'owner/image.png', 'ad-images', project), 'owner/image.png');
  for (const url of [null, '', 'https://attacker.example' + prefix + 'owner/image.png', project + '/other' + prefix + 'owner/image.png', project + prefix + '../secret.png', project + prefix + 'owner/%2e%2e/file.png', project + prefix + '%00bad', project + prefix + 'owner/%zz', project + prefix + 'owner/file.png?extra=1', project + prefix + 'owner/%5cfile.png']) {
    assert.equal(publicStoragePath(url, 'ad-images', project), null, String(url));
  }
  assert.equal(publicStoragePath(project + prefix + 'owner/file.png', 'other-bucket', project), null);
});
test('rate limiter enforces the window and stays bounded on many unique clients', () => {
  const limiter = createAttemptStore({ windowMs: 1000, maxAttempts: 2, maxEntries: 3 });
  assert.equal(limiter.consume('a', 0), false);
  assert.equal(limiter.consume('a', 1), false);
  assert.equal(limiter.consume('a', 2), true);
  assert.equal(limiter.consume('a', 1000), false);
  for (let i = 0; i < 50; i++) limiter.consume(String(i), 1001);
  assert.equal(limiter.size, 3);
});
test('image uploads inspect bytes, reject spoofed types and ignore unsafe filename extensions', async () => {
  const png = await sharp({ create: { width: 2, height: 2, channels: 3, background: '#fff' } }).png().toBuffer();
  const valid = await inspectRasterUpload(new File([png], 'payload.html', { type: 'image/png' }));
  assert.equal(valid.extension, 'png');
  await assert.rejects(() => inspectRasterUpload(new File([png], 'photo.jpg', { type: 'image/jpeg' })));
  await assert.rejects(() => inspectRasterUpload(new File(['<svg onload="alert(1)"/>'], 'photo.png', { type: 'image/png' })));
  await assert.rejects(() => inspectRasterUpload(new File([new Uint8Array(5 * 1024 * 1024 + 1)], 'big.png', { type: 'image/png' })));
});
test('post validation rejects executable sources and unbounded content', () => {
  const valid = { tr: { body: 'Türkçe içerik. '.repeat(8) }, en: { body: 'English content. '.repeat(8) }, sourceUrl: 'https://example.com/story', featured: false, status: 'published' };
  assert.equal(postSchema.safeParse(valid).success, true);
  for (const sourceUrl of ['javascript:alert(1)', 'data:text/html,test', 'ftp://example.com/file']) assert.equal(postSchema.safeParse({ ...valid, sourceUrl }).success, false);
  assert.equal(postSchema.safeParse({ ...valid, tr: { body: 'x'.repeat(30_001) } }).success, false);
});
