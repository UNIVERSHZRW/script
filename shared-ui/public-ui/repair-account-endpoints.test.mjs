import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { repairAccountEndpoints } from './repair-account-endpoints.mjs';

const bundledSource = new URL('../../connectors/dist/univershzrw-comunidad.mjs', import.meta.url);
const origin = 'https://univershzrw.com';
const rpcPath = '/rest/v1/rpc/';
const privateEndpoints = ['uhz_economy_my_dashboard', 'uhz_header_account_summary'];
const userId = '00000000-0000-4000-8000-000000000001';
const contentId = '00000000-0000-4000-8000-000000000002';

test('community gateway serves the new public status and protects account summaries', async t => {
  const source = await readFile(process.env.UHZ_COMMUNITY_WORKER_SOURCE || bundledSource, 'utf8');
  const patched = repairAccountEndpoints(source);
  assert.notEqual(patched, source);
  assert.equal(repairAccountEndpoints(patched), patched);

  const moduleUrl = `data:text/javascript;base64,${Buffer.from(patched).toString('base64')}`;
  const { default: worker } = await import(moduleUrl);
  const env = { API_LIMIT: { limit: async () => ({ success: true }) } };
  const upstream = [];
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    const path = new URL(url).pathname;
    upstream.push({ path, authorization: new Headers(options.headers).get('Authorization'), body: options.body });
    if (path === '/auth/v1/user') return Response.json({ id: userId, email_confirmed_at: '2026-01-01' });
    if (path === `${rpcPath}uhz_account_status`) return Response.json({ role: 'member', must_change_password: false });
    return Response.json({ ok: true });
  });

  function request(name, { body = {}, requestOrigin = origin, authenticated = false } = {}) {
    const headers = { 'content-type': 'application/json', origin: requestOrigin };
    if (authenticated) headers.cookie = '__Host-uhz-access=test-session';
    return worker.fetch(new Request(`${origin}/backend${rpcPath}${name}`, {
      method: 'POST', headers, body: JSON.stringify(body)
    }), env);
  }

  for (const name of privateEndpoints) {
    assert.equal((await request(name)).status, 401);
  }
  assert.equal((await request('uhz_inft_coin_status', { requestOrigin: 'https://example.test' })).status, 403);
  assert.equal((await request('uhz_eco_public_free', { body: { p_content_id: 'invalid' } })).status, 400);
  assert.deepEqual(upstream, []);

  for (const name of ['uhz_inft_coin_status', 'uhz_eco_catalog']) {
    const response = await request(name, { body: { ignored: true } });
    assert.equal(response.status, 200);
    assert.equal(response.headers.get('cache-control'), 'no-store');
    assert.deepEqual(upstream.at(-1), { path: `${rpcPath}${name}`, authorization: null, body: '{}' });
  }
  const free = await request('uhz_eco_public_free', { body: { p_content_id: contentId, ignored: true } });
  assert.equal(free.status, 200);
  assert.deepEqual(JSON.parse(upstream.at(-1).body), { p_content_id: contentId });

  for (const name of privateEndpoints) {
    assert.equal((await request(name, { authenticated: true })).status, 200);
    assert.deepEqual(upstream.slice(-3).map(call => call.path), ['/auth/v1/user', `${rpcPath}uhz_account_status`, `${rpcPath}${name}`]);
    assert.equal(upstream.at(-1).authorization, 'Bearer test-session');
  }
});
