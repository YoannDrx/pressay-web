import { afterEach, test } from 'node:test';
import assert from 'node:assert/strict';
import { getPublicRelease } from '../lib/release.ts';
const originalFetch = globalThis.fetch;
afterEach(() => { globalThis.fetch = originalFetch; });
for (const [name, replacement] of [
  ['network failure', async () => { throw new TypeError('offline'); }],
  ['invalid JSON', async () => new Response('not json')],
  ['wrong response shape', async () => Response.json({ message: 'unavailable' })],
  ['rate limit', async () => new Response('', { status: 429 })],
] as const) {
  test(`download keeps the verified fallback after ${name}`, async () => {
    globalThis.fetch = replacement;
    const release = await getPublicRelease();
    assert.equal(release.tag, 'v2.0.0-beta.3');
    assert.ok(release.dmgURL.endsWith('/v2.0.0-beta.3/Pressay.dmg'));
    assert.ok(release.checksumURL.endsWith('/Pressay.dmg.sha256'));
  });
}
test('selects a complete published release and bounds network waiting', async () => {
  globalThis.fetch = async (_input, options) => {
    assert.ok(options?.signal instanceof AbortSignal);
    return Response.json([{ tag_name: 'v2.0.0', prerelease: false, assets: [
      { name: 'Pressay.dmg', browser_download_url: 'https://github.com/YoannDrx/pressay/releases/download/v2.0.0/Pressay.dmg' },
      { name: 'Pressay.dmg.sha256', browser_download_url: 'https://github.com/YoannDrx/pressay/releases/download/v2.0.0/Pressay.dmg.sha256' },
    ] }]);
  };
  assert.equal((await getPublicRelease()).prerelease, false);
});
