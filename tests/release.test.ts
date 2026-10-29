import { afterEach, test } from 'node:test';
import assert from 'node:assert/strict';
import { getPublicRelease, getWindowsRelease } from '../lib/release.ts';
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
const asset = (tag: string) => [
  { name: 'Pressay.dmg', browser_download_url: `https://github.com/YoannDrx/pressay/releases/download/${tag}/Pressay.dmg` },
  { name: 'Pressay.dmg.sha256', browser_download_url: `https://github.com/YoannDrx/pressay/releases/download/${tag}/Pressay.dmg.sha256` },
];
test('prefers the latest stable release over a newer prerelease', async () => {
  globalThis.fetch = async () => Response.json([
    { tag_name: 'v2.1.0-beta.1', prerelease: true, assets: asset('v2.1.0-beta.1') },
    { tag_name: 'v2.0.1', prerelease: false, assets: [{ name: 'Pressay.dmg', browser_download_url: 'x' }] },
    { tag_name: 'v2.0.0', prerelease: false, assets: asset('v2.0.0') },
  ]);
  const release = await getPublicRelease();
  assert.equal(release.tag, 'v2.0.0');
  assert.equal(release.prerelease, false);
});
test('serves the latest prerelease, flagged as beta, when no stable exists', async () => {
  globalThis.fetch = async () => Response.json([
    { tag_name: 'v2.0.0-rc.2', draft: true, prerelease: true, assets: asset('v2.0.0-rc.2') },
    { tag_name: 'v2.0.0-rc.1', prerelease: true, assets: asset('v2.0.0-rc.1') },
    { tag_name: 'v2.0.0-beta.3', prerelease: true, assets: asset('v2.0.0-beta.3') },
  ]);
  const release = await getPublicRelease();
  assert.equal(release.tag, 'v2.0.0-rc.1');
  assert.equal(release.prerelease, true);
});
const windowsAssets = (tag: string) => ['x64', 'arm64'].flatMap((arch) => [
  { name: `Pressay-windows-${arch}.exe`, browser_download_url: `https://github.com/YoannDrx/pressay/releases/download/${tag}/Pressay-windows-${arch}.exe` },
  { name: `Pressay-windows-${arch}.exe.sha256`, browser_download_url: `https://github.com/YoannDrx/pressay/releases/download/${tag}/Pressay-windows-${arch}.exe.sha256` },
]);
test('reports no Windows release while no release ships the installers', async () => {
  globalThis.fetch = async () => Response.json([
    { tag_name: 'v2.0.0', prerelease: false, assets: asset('v2.0.0') },
    { tag_name: 'v1.9.0', prerelease: false, assets: [...asset('v1.9.0'), windowsAssets('v1.9.0')[0]] },
  ]);
  assert.equal(await getWindowsRelease(), null);
});
test('reports no Windows release when GitHub is unavailable', async () => {
  globalThis.fetch = async () => new Response('', { status: 503 });
  assert.equal(await getWindowsRelease(), null);
});
test('returns the x64 and ARM64 installers of a complete Windows release', async () => {
  globalThis.fetch = async () => Response.json([
    { tag_name: 'v2.1.0', prerelease: false, assets: [...asset('v2.1.0'), ...windowsAssets('v2.1.0')] },
  ]);
  const release = await getWindowsRelease();
  assert.equal(release?.tag, 'v2.1.0');
  assert.equal(release?.prerelease, false);
  assert.ok(release?.x64.exeURL.endsWith('/v2.1.0/Pressay-windows-x64.exe'));
  assert.ok(release?.x64.checksumURL.endsWith('/v2.1.0/Pressay-windows-x64.exe.sha256'));
  assert.ok(release?.arm64.exeURL.endsWith('/v2.1.0/Pressay-windows-arm64.exe'));
  assert.ok(release?.arm64.checksumURL.endsWith('/v2.1.0/Pressay-windows-arm64.exe.sha256'));
});
test('ignores draft Windows releases', async () => {
  globalThis.fetch = async () => Response.json([
    { tag_name: 'v2.2.0', draft: true, prerelease: false, assets: windowsAssets('v2.2.0') },
    { tag_name: 'v2.1.0-beta.1', prerelease: true, assets: windowsAssets('v2.1.0-beta.1') },
  ]);
  const release = await getWindowsRelease();
  assert.equal(release?.tag, 'v2.1.0-beta.1');
  assert.equal(release?.prerelease, true);
});
test('prefers the latest stable Windows release over a newer prerelease', async () => {
  globalThis.fetch = async () => Response.json([
    { tag_name: 'v2.2.0-beta.1', prerelease: true, assets: windowsAssets('v2.2.0-beta.1') },
    { tag_name: 'v2.1.0', prerelease: false, assets: windowsAssets('v2.1.0') },
  ]);
  const release = await getWindowsRelease();
  assert.equal(release?.tag, 'v2.1.0');
  assert.equal(release?.prerelease, false);
});
