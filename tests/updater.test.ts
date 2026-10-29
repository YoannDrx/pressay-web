import { afterEach, test } from 'node:test';
import assert from 'node:assert/strict';
import { channelForVersion, compareVersions, getUpdateManifest, parseManifest } from '../lib/updater.ts';

const originalFetch = globalThis.fetch;
afterEach(() => { globalThis.fetch = originalFetch; });

const download = (tag: string, name: string) => `https://github.com/YoannDrx/pressay/releases/download/${tag}/${name}`;
const manifest = (tag: string) => ({
  version: tag.replace(/^v/, ''),
  notes: 'notes',
  pub_date: '2026-10-29T00:00:00Z',
  platforms: { 'darwin-aarch64': { url: download(tag, 'Pressay_aarch64.app.tar.gz'), signature: 'c2ln' } },
});
const release = (tag: string, prerelease: boolean, withManifest = true) => ({
  tag_name: tag,
  prerelease,
  assets: withManifest ? [{ name: 'latest.json', browser_download_url: download(tag, 'latest.json') }] : [],
});
function serve(releases: unknown[]) {
  globalThis.fetch = async (input) => {
    const url = String(input);
    if (url.startsWith('https://api.github.com/')) return Response.json(releases);
    const tag = url.match(/download\/(v[^/]+)\/latest\.json$/)?.[1];
    return tag ? Response.json(manifest(tag)) : new Response('', { status: 404 });
  };
}

test('orders versions by semantic precedence', () => {
  assert.equal(compareVersions('2.0.0', '2.0.0-beta.4'), 1);
  assert.equal(compareVersions('2.0.0-beta.10', '2.0.0-beta.4'), 1);
  assert.equal(compareVersions('2.0.0-beta.4', '2.0.0-rc.1'), -1);
  assert.equal(compareVersions('2.0.1', '2.0.1'), 0);
  assert.equal(compareVersions('2.1.0', '2.0.9'), 1);
});

test('betas follow prereleases, stable clients stay on stable', () => {
  assert.equal(channelForVersion('2.0.0-beta.4'), 'beta');
  assert.equal(channelForVersion('2.0.0'), 'stable');
});

test('beta channel serves the newest release that ships a manifest', async () => {
  serve([release('v2.0.0-beta.6', true, false), release('v2.0.0-beta.5', true), release('v2.0.0-beta.4', true, false)]);
  assert.equal((await getUpdateManifest('beta'))?.version, '2.0.0-beta.5');
});

test('stable channel ignores prereleases', async () => {
  serve([release('v2.1.0-beta.1', true), release('v2.0.0', false)]);
  assert.equal((await getUpdateManifest('stable'))?.version, '2.0.0');
  serve([release('v2.1.0-beta.1', true)]);
  assert.equal(await getUpdateManifest('stable'), null);
});

test('skips drafts and returns null when GitHub fails', async () => {
  serve([{ ...release('v2.0.0-beta.5', true), draft: true }]);
  assert.equal(await getUpdateManifest('beta'), null);
  globalThis.fetch = async () => new Response('', { status: 429 });
  assert.equal(await getUpdateManifest('beta'), null);
  globalThis.fetch = async () => { throw new TypeError('offline'); };
  assert.equal(await getUpdateManifest('beta'), null);
});

test('rejects archives outside the release and mismatched versions', () => {
  const tag = 'v2.0.0-beta.5';
  assert.equal(parseManifest({ ...manifest(tag), version: '2.0.0-beta.6' }, tag), null);
  const foreign = { ...manifest(tag), platforms: { 'darwin-aarch64': { url: 'https://evil.example/Pressay.app.tar.gz', signature: 'c2ln' } } };
  assert.equal(parseManifest(foreign, tag), null);
  const otherTag = { ...manifest(tag), platforms: { 'darwin-aarch64': { url: download('v2.0.0-beta.4', 'a.tar.gz'), signature: 'c2ln' } } };
  assert.equal(parseManifest(otherTag, tag), null);
  const unsigned = { ...manifest(tag), platforms: { 'darwin-aarch64': { url: download(tag, 'a.tar.gz'), signature: ' ' } } };
  assert.equal(parseManifest(unsigned, tag), null);
  assert.deepEqual(Object.keys(parseManifest(manifest(tag), tag)?.platforms ?? {}), ['darwin-aarch64']);
});
