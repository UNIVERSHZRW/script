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

  const buttonStyles = `
#authArea .uhz-google-sign-in {
  margin-block-start: 14px;
}
#authArea .uhz-google-button {
  appearance: none;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  width: 100%;
  min-height: 48px;
  margin: 0;
  padding: 10px 16px;
  border: 0;
  border-radius: 10px;
  box-shadow: none;
  background: var(--panel2, #edf4f7);
  background: color-mix(in srgb, var(--ink, #184c72) 7%, var(--panel, #fff));
  color: var(--ink, #184c72);
  font: inherit;
  font-weight: 600;
  line-height: 1.25;
  text-align: center;
  cursor: pointer;
}
#authArea .uhz-google-button:hover:not(:disabled) {
  background: color-mix(in srgb, var(--ink, #184c72) 11%, var(--panel, #fff));
}
#authArea .uhz-google-button:focus-visible {
  outline: 2px solid currentColor;
  outline-offset: 2px;
}
#authArea .uhz-google-button:disabled {
  cursor: wait;
  opacity: .72;
}
#authArea .uhz-google-mark {
  display: block;
  flex: none;
}
`;

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
    const googleMark = `<svg class="uhz-google-mark" viewBox="0 0 256 262" width="22" height="22" aria-hidden="true" focusable="false">
      <path d="M255.878,133.451 C255.878,122.717 255.007,114.884 253.122,106.761 L130.55,106.761 L130.55,155.209 L202.497,155.209 C201.047,167.249 193.214,185.381 175.807,197.565 L175.563,199.187 L214.318,229.21 L217.003,229.478 C241.662,206.704 255.878,173.196 255.878,133.451" fill="#4285F4" />
      <path d="M130.55,261.1 C165.798,261.1 195.389,249.495 217.003,229.478 L175.807,197.565 C164.783,205.253 149.987,210.62 130.55,210.62 C96.027,210.62 66.726,187.847 56.281,156.37 L54.75,156.5 L14.452,187.687 L13.925,189.152 C35.393,231.798 79.49,261.1 130.55,261.1" fill="#34A853" />
      <path d="M56.281,156.37 C53.525,148.247 51.93,139.543 51.93,130.55 C51.93,121.556 53.525,112.853 56.136,104.73 L56.063,103 L15.26,71.312 L13.925,71.947 C5.077,89.644 0,109.517 0,130.55 C0,151.583 5.077,171.455 13.925,189.152 L56.281,156.37" fill="#FBBC05" />
      <path d="M130.55,50.479 C155.064,50.479 171.6,61.068 181.029,69.917 L217.873,33.943 C195.245,12.91 165.798,0 130.55,0 C79.49,0 35.393,29.301 13.925,71.947 L56.136,104.73 C66.726,73.253 96.027,50.479 130.55,50.479" fill="#EB4335" />
    </svg>`;
    const controls = forms.map(form => {
      const group = document.createElement('div');
      group.className = 'uhz-google-sign-in';
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'uhz-google-button';
      button.innerHTML = googleMark;
      const label = document.createElement('span');
      button.append(label);
      const feedback = document.createElement('p');
      feedback.setAttribute('role', 'status');
      feedback.hidden = true;
      group.append(feedback);
      return {button, label, feedback, group, form};
    });
    function updateLabels() {
      const text = labels();
      for (const {button, label} of controls) label.textContent = button.disabled ? text.busy : text.button;
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

  async function addButtonAssets(request, response) {
    const url = new URL(request.url);
    if (url.origin !== origin || request.method !== 'GET' || !response.ok) return response;

    const contentType = response.headers.get('content-type') || '';
    let body;
    if (url.pathname === '/upgrade.css' && contentType.startsWith('text/css')) {
      body = (await response.text()) + buttonStyles;
    } else if (url.pathname === '/' && contentType.startsWith('text/html')) {
      body = new HTMLRewriter()
        .on('link[rel="stylesheet"][href^="/upgrade.css?"]', {
          element(link) {
            link.setAttribute('href', link.getAttribute('href') + '&google-button=2');
          },
        })
        .on('head', {
          element(head) { head.append('<script src="' + prefix + '/client.js" defer></script>', {html: true}); },
        }).transform(response).body;
    } else {
      return response;
    }

    const headers = new Headers(response.headers);
    headers.delete('content-length');
    headers.delete('etag');
    return new Response(body, {status: response.status, statusText: response.statusText, headers});
  }

  return {route, addButtonAssets};
}

export const portalExport = /export\s*\{\s*community_entry_default as default\s*\};\s*$/;

export function googleSignInRuntime() {
  return 'const googleSignIn = (' + createGoogleSignIn.toString() + ')({\n'
    + '  origin: OFFICIAL_ORIGIN, apiOrigin: API_ORIGIN, supabaseFetch, checkedUser, sessionCookies, limited, trustedWrite, jsonBody, apiResponse,\n'
    + '});\n'
    + 'const googlePortal = { ...community_entry_default, async fetch(req, env, ctx) {\n'
    + '  const auth = await googleSignIn.route(req, env);\n'
    + '  if (auth) return auth;\n'
    + '  return googleSignIn.addButtonAssets(req, await community_entry_default.fetch(req, env, ctx));\n'
    + '} };\nexport { googlePortal as default };\n';
}

export function prepareGoogleSignIn(source) {
  if (!portalExport.test(source)) throw Error('The account Worker source differs from the expected export.');
  return source.replace(portalExport, () => googleSignInRuntime());
}
