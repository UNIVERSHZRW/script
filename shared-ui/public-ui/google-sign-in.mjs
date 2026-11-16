export function createGoogleSignIn({origin, apiOrigin, supabaseFetch, checkedUser, sessionCookies, limited, trustedWrite, jsonBody, apiResponse}) {
  const prefix = '/_uhz/portal/google';
  const flowCookie = '__Host-uhz-google-flow';
  const callbackUrl = origin + prefix + '/callback';
  const allowedReturns = new Set(['/mi-cuenta', '/criptomoneda/panel', '/coins', '/perfil', '/comunichat', '/comunidad', '/creadores', '/planes']);

  function safeReturn(value) {
    if (typeof value !== 'string' || value.length > 400 || !value.startsWith('/') ||
        value.startsWith('//') || /[\\\r\n]/.test(value)) return '/mi-cuenta';
    const target = new URL(value, origin);
    return target.origin === origin && allowedReturns.has(target.pathname) ? target.pathname + target.search : '/mi-cuenta';
  }

  function cookie(value, age) {
    return flowCookie + '=' + encodeURIComponent(value) + '; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=' + age;
  }

  function readFlow(request) {
    const entry = (request.headers.get('cookie') || '').split(';').map(s => s.trim()).find(s => s.startsWith(flowCookie + '='));
    if (!entry) return null;
    try {
      const [verifier, destination] = JSON.parse(decodeURIComponent(entry.slice(flowCookie.length + 1)));
      if (/^[a-zA-Z0-9_-]{43}$/.test(verifier)) return {verifier, destination: safeReturn(destination)};
    } catch {}
    return null;
  }

  function redirect(destination, cookies = []) {
    const headers = new Headers({
      Location: new URL(destination, origin).href,
      'Cache-Control': 'private, no-store',
      'Referrer-Policy': 'no-referrer',
      'X-Content-Type-Options': 'nosniff',
    });
    for (const value of cookies) headers.append('Set-Cookie', value);
    return new Response(null, {status: 303, headers});
  }

  function errorRedirect(flow) {
    const location = new URL('/iniciar-sesion', origin);
    location.searchParams.set('google', 'retry');
    if (flow) location.searchParams.set('return_to', flow.destination);
    return redirect(location.pathname + location.search, [cookie('', 0)]);
  }

  async function googleEnabled() {
    const response = await supabaseFetch('/auth/v1/settings');
    if (!response.ok) return false;
    return (await response.json()).external?.google === true;
  }

  function base64url(bytes) {
    return btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }

  async function start(request) {
    if (!(await googleEnabled())) return apiResponse({enabled: false}, 503);
    const data = await jsonBody(request, 4096);
    const destination = safeReturn(data.return_to);
    const verifier = base64url(crypto.getRandomValues(new Uint8Array(32)));
    const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier));
    const authorize = new URL('/auth/v1/authorize', apiOrigin);
    authorize.search = new URLSearchParams({
      provider: 'google',
      redirect_to: callbackUrl,
      scopes: 'openid email profile',
      prompt: 'select_account',
      code_challenge: base64url(new Uint8Array(digest)),
      code_challenge_method: 's256',
    });
    return apiResponse({url: authorize.href}, 200, [cookie(JSON.stringify([verifier, destination]), 600)]);
  }

  async function callback(requestUrl, flow) {
    const code = requestUrl.searchParams.get('code');
    if (!flow || requestUrl.searchParams.has('error') || !/^[a-zA-Z0-9._~-]{16,256}$/.test(code || '')) {
      return errorRedirect(flow);
    }
    const response = await supabaseFetch('/auth/v1/token?grant_type=pkce', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({auth_code: code, code_verifier: flow.verifier}),
    });
    if (!response.ok) return errorRedirect(flow);
    const session = await response.json();
    if (typeof session?.access_token !== 'string' || !session.access_token ||
        typeof session.refresh_token !== 'string' || !session.refresh_token) return errorRedirect(flow);
    const user = await checkedUser(session.access_token);
    if (!user) {
      await supabaseFetch('/auth/v1/logout?scope=local', {method: 'POST', headers: {Authorization: 'Bearer ' + session.access_token}}).catch(() => null);
      return errorRedirect(flow);
    }
    const destination = user.uhz_status.must_change_password ? '/mi-cuenta' : flow.destination;
    return redirect(destination, [cookie('', 0), ...sessionCookies(session)]);
  }

  function browserClient(portalPrefix, authOrigin) {
    const forms = ['loginForm', 'registerForm'].map(id => document.getElementById(id)).filter(Boolean);
    if (!forms.length) return;
    const language = () => document.documentElement.lang.toLowerCase().startsWith('en');
    const labels = () => language() ? {
      button: 'Continue with Google', busy: 'Opening Google…', retry: 'Google sign-in did not finish. Try again.',
    } : {
      button: 'Continuar con Google', busy: 'Abriendo Google…', retry: 'El acceso con Google no se completó. Intenta de nuevo.',
    };
    const params = new URL(location.href).searchParams;
    const destination = params.get('return_to') || (params.get('inft') === '1' ? '/criptomoneda/panel' : '/mi-cuenta');
    const controls = forms.map(form => {
      const group = document.createElement('div');
      group.style.marginTop = '12px';
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'button ghost';
      const feedback = document.createElement('p');
      feedback.setAttribute('role', 'status');
      feedback.hidden = true;
      group.append(feedback);
      return {button, feedback, group, form};
    });
    function updateLabels() {
      for (const {button} of controls) button.textContent = button.disabled ? labels().busy : labels().button;
    }
    function showRetry(feedback) {
      feedback.textContent = labels().retry;
      feedback.hidden = false;
    }
    updateLabels();
    window.addEventListener('uhz:language-change', updateLabels);
    if (params.get('google') === 'retry') {
      const control = controls[0];
      control.form.after(control.group);
      showRetry(control.feedback);
    }

    fetch(portalPrefix + '/status', {credentials: 'same-origin', cache: 'no-store'})
      .then(response => response.ok ? response.json() : null)
      .then(data => {
        if (data?.enabled !== true) return;
        for (const {button, feedback, group, form} of controls) {
          group.prepend(button);
          if (!group.isConnected) form.after(group);
          button.onclick = async () => {
            button.disabled = true;
            feedback.hidden = true;
            updateLabels();
            try {
              const response = await fetch(portalPrefix + '/start', {
                method: 'POST', credentials: 'same-origin', headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({return_to: destination}),
              });
              const data = await response.json();
              if (!response.ok || typeof data.url !== 'string') throw Error();
              const url = new URL(data.url);
              if (url.origin !== authOrigin || url.pathname !== '/auth/v1/authorize') throw Error();
              location.assign(url.href);
            } catch {
              button.disabled = false;
              updateLabels();
              showRetry(feedback);
            }
          };
        }
      })
      .catch(() => {});
  }

  const clientSource = '(' + browserClient.toString() + ')(' + JSON.stringify(prefix) + ',' + JSON.stringify(apiOrigin) + ');';

  async function route(request, env) {
    const url = new URL(request.url);
    if (url.origin !== origin || !url.pathname.startsWith('/google/')) return null;
    const path = url.pathname;
    const allowedMethod = path === '/google/start' ? 'POST' : 'GET';
    if (request.method !== allowedMethod) return apiResponse({message: 'Método no permitido.'}, 405);
    if (path === '/google/client.js') {
      return new Response(clientSource, {headers: {
        'Content-Type': 'text/javascript; charset=utf-8',
        'Cache-Control': 'no-cache',
        'X-Content-Type-Options': 'nosniff',
      }});
    }
    const flow = path === '/google/callback' ? readFlow(request) : null;
    try {
      const ip = request.headers.get('cf-connecting-ip') || 'unknown';
      if (path === '/google/start') {
        if (!trustedWrite(request)) return apiResponse({message: 'Origen no permitido.'}, 403);
        await limited(env.AUTH_LIMIT, 'google-start:' + ip);
        return await start(request);
      }
      if (path === '/google/callback') {
        if (!flow) return errorRedirect(null);
        await limited(env.AUTH_LIMIT, 'google-callback:' + ip);
        return await callback(url, flow);
      }
      if (path === '/google/status') {
        await limited(env.API_LIMIT, 'google-status:' + ip);
        return apiResponse({enabled: await googleEnabled()});
      }
      return null;
    } catch (error) {
      if (path === '/google/callback') return errorRedirect(flow);
      const status = [400, 413, 429].includes(error.status) ? error.status : 503;
      return apiResponse({enabled: false}, status);
    }
  }

  function addClient(request, response) {
    const url = new URL(request.url);
    if (url.origin !== origin || url.pathname !== '/' || request.method !== 'GET' ||
        !response.ok || !response.headers.get('content-type')?.startsWith('text/html')) return response;
    const result = new HTMLRewriter().on('head', {
      element(head) { head.append('<script src="' + prefix + '/client.js" defer></script>', {html: true}); },
    }).transform(response);
    const headers = new Headers(result.headers);
    headers.delete('content-length');
    headers.delete('etag');
    return new Response(result.body, {status: result.status, statusText: result.statusText, headers});
  }

  return {route, addClient};
}

export const portalExport = /export\s*\{\s*community_entry_default as default\s*\};\s*$/;

export function googleSignInRuntime() {
  return 'const googleSignIn = (' + createGoogleSignIn.toString() + ')({\n'
    + '  origin: OFFICIAL_ORIGIN, apiOrigin: API_ORIGIN, supabaseFetch, checkedUser, sessionCookies, limited, trustedWrite, jsonBody, apiResponse,\n'
    + '});\n'
    + 'const googlePortal = { ...community_entry_default, async fetch(req, env, ctx) {\n'
    + '  const auth = await googleSignIn.route(req, env);\n'
    + '  if (auth) return auth;\n'
    + '  return googleSignIn.addClient(req, await community_entry_default.fetch(req, env, ctx));\n'
    + '} };\nexport { googlePortal as default };\n';
}

export function prepareGoogleSignIn(source) {
  if (!portalExport.test(source)) throw Error('The account Worker source differs from the expected export.');
  return source.replace(portalExport, () => googleSignInRuntime());
}
