import test from 'node:test';
import assert from 'node:assert/strict';
import {createGoogleSignIn, prepareGoogleSignIn} from './google-sign-in.mjs';

const origin = 'https://univershzrw.com';
const apiOrigin = 'https://project.supabase.co';
const callbackUrl = origin + '/_uhz/portal/google/callback';
const fakeCode = 'test-auth-code-0123456';

function setup(options = {}) {
  const calls = [];
  const session = {access_token: 'test-access', refresh_token: 'test-refresh'};
  const oauth = createGoogleSignIn({
    origin, apiOrigin,
    async supabaseFetch(path, init) {
      calls.push({path, init});
      if (path === '/auth/v1/settings') return Response.json({external: {google: options.enabled !== false}});
      if (path === '/auth/v1/token?grant_type=pkce') return Response.json(session, {status: options.exchangeStatus || 200});
      if (path === '/auth/v1/logout?scope=local') return Response.json({});
      throw Error('Unexpected upstream request');
    },
    async checkedUser() {
      return options.blocked ? null : {id: 'fixture', uhz_status: {must_change_password: Boolean(options.reset)}};
    },
    sessionCookies: () => ['access=test; HttpOnly; Secure', 'refresh=test; HttpOnly; Secure'],
    async limited() {},
    trustedWrite: request => request.headers.get('Origin') === origin,
    async jsonBody(request) { return request.json(); },
    apiResponse(data, status = 200, cookies = []) {
      const headers = new Headers({'Cache-Control': 'no-store'});
      for (const cookie of cookies) headers.append('Set-Cookie', cookie);
      return Response.json(data, {status, headers});
    },
  });
  return {oauth, calls};
}

const start = (oauth, destination, initiator = origin) => oauth.route(new Request(origin + '/google/start', {
  method: 'POST', headers: {Origin: initiator, 'Content-Type': 'application/json'},
  body: JSON.stringify({return_to: destination}),
}), {});
const cookiePart = response => response.headers.getSetCookie()[0].split(';')[0];
const finish = (oauth, cookie, query = '?code=' + fakeCode) => oauth.route(new Request(origin + '/google/callback' + query, {
  headers: cookie ? {Cookie: cookie} : {},
}), {});

test('the status and start reject a disabled provider without issuing a flow cookie', async () => {
  const {oauth} = setup({enabled: false});
  const status = await oauth.route(new Request(origin + '/google/status'), {});
  assert.deepEqual(await status.json(), {enabled: false});
  const response = await start(oauth, '/mi-cuenta');
  assert.equal(response.status, 503);
  assert.deepEqual(response.headers.getSetCookie(), []);
});

test('OAuth starts only from a same-origin POST and uses PKCE S256', async () => {
  const {oauth, calls} = setup();
  const wrongOrigin = await start(oauth, '/mi-cuenta', 'https://external.example');
  assert.equal(wrongOrigin.status, 403);
  assert.equal(calls.length, 0);
  const wrongMethod = await oauth.route(new Request(origin + '/google/start'), {});
  assert.equal(wrongMethod.status, 405);
  const response = await start(oauth, '/criptomoneda/panel?view=history');
  const provider = new URL((await response.json()).url);
  assert.equal(provider.origin, apiOrigin);
  assert.equal(provider.pathname, '/auth/v1/authorize');
  assert.equal(provider.searchParams.get('provider'), 'google');
  assert.equal(provider.searchParams.get('redirect_to'), callbackUrl);
  assert.equal(provider.searchParams.get('code_challenge_method'), 's256');
  const flow = cookiePart(response);
  const [verifier, target] = JSON.parse(decodeURIComponent(flow.slice(flow.indexOf('=') + 1)));
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier));
  assert.equal(provider.searchParams.get('code_challenge'), Buffer.from(digest).toString('base64url'));
  assert.equal(target, '/criptomoneda/panel?view=history');
  assert.match(response.headers.getSetCookie()[0], /Path=\/; HttpOnly; Secure; SameSite=Lax/);
  assert.ok(!provider.href.includes(verifier));
});

test('a completed callback uses the existing account cookies and returns to INFT', async () => {
  const {oauth, calls} = setup();
  const response = await start(oauth, '/criptomoneda/panel');
  const result = await finish(oauth, cookiePart(response));
  assert.equal(result.status, 303);
  assert.equal(result.headers.get('location'), origin + '/criptomoneda/panel');
  assert.equal(result.headers.get('cache-control'), 'private, no-store');
  assert.equal(result.headers.get('referrer-policy'), 'no-referrer');
  assert.equal(result.headers.getSetCookie().length, 3);
  assert.match(result.headers.getSetCookie()[0], /Max-Age=0/);
  const exchange = calls.find(call => call.path === '/auth/v1/token?grant_type=pkce');
  const {auth_code, code_verifier} = JSON.parse(exchange.init.body);
  assert.equal(auth_code, fakeCode);
  assert.match(code_verifier, /^[a-zA-Z0-9_-]{43}$/);
});

test('invalid flows and restricted accounts never receive session cookies', async () => {
  const {oauth, calls} = setup({blocked: true});
  const missing = await finish(oauth);
  assert.equal(missing.headers.getSetCookie().length, 1);
  assert.match(missing.headers.get('location'), /\/iniciar-sesion\?google=retry/);
  assert.equal(calls.length, 0);
  const response = await start(oauth, '/criptomoneda/panel');
  const restricted = await finish(oauth, cookiePart(response));
  assert.equal(restricted.headers.getSetCookie().length, 1);
  assert.ok(calls.some(call => call.path === '/auth/v1/logout?scope=local'));
  const denied = await finish(oauth, cookiePart(response), '?error=access_denied');
  assert.equal(denied.headers.getSetCookie().length, 1);
});

test('external destinations and routes outside the account portal are disallowed', async () => {
  const {oauth} = setup();
  for (const destination of ['https://external.example/', '//external.example/', '/\\external.example/', '/api/outside']) {
    const flow = await start(oauth, destination);
    const result = await finish(oauth, cookiePart(flow));
    assert.equal(result.headers.get('location'), origin + '/mi-cuenta');
  }
  assert.equal(await oauth.route(new Request('https://admin.univershzrw.com/google/status'), {}), null);
  const reset = setup({reset: true});
  const flow = await start(reset.oauth, '/criptomoneda/panel');
  assert.equal((await finish(reset.oauth, cookiePart(flow))).headers.get('location'), origin + '/mi-cuenta');
});

test('deployment only replaces the expected Worker export', () => {
  assert.throws(() => prepareGoogleSignIn('export default {}'), /expected export/);
  const source = 'var community_entry_default = {};\nexport { community_entry_default as default };\n';
  const patched = prepareGoogleSignIn(source);
  assert.ok(patched.startsWith('var community_entry_default = {};'));
  assert.match(patched, /export \{ googlePortal as default \}/);
  assert.throws(() => prepareGoogleSignIn(patched), /expected export/);
});
