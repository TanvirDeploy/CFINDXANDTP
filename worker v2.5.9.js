// GDI Generator Worker v2.5.9
// Generates a configured worker.js for Google Drive Index

const WORKER_JS_URL = 'https://gitlab.com/GoogleDriveIndex/Google-Drive-Index/-/raw/master/src/worker.js?ref_type=heads';
const TOKEN_URL = 'https://www.googleapis.com/oauth2/v4/token';

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  const url = new URL(request.url);
  if (request.method === 'OPTIONS') return new Response(null, { headers: corsHeaders() });
  if (request.method === 'POST' && url.pathname === '/generate') return handleGenerate(request);
  return servePage(request);
}

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders() },
  });
}

// ── SA JWT generation (mirrors main worker.js JSONWebToken logic) ──
async function generateSAJWT(saJson) {
  const iat = Math.floor(Date.now() / 1000);
  const header = { alg: 'RS256', typ: 'JWT' };
  const payload = {
    iss: saJson.client_email,
    scope: 'https://www.googleapis.com/auth/drive',
    aud: 'https://oauth2.googleapis.com/token',
    exp: iat + 3600,
    iat,
  };
  const toB64Url = s => s.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  const encH = toB64Url(btoa(JSON.stringify(header)));
  const encP = toB64Url(btoa(JSON.stringify(payload)));
  const pemLines = saJson.private_key.split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('---')).join('');
  const der = Uint8Array.from(atob(pemLines), c => c.charCodeAt(0)).buffer;
  const key = await crypto.subtle.importKey('pkcs8', der, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, new TextEncoder().encode(encH + '.' + encP));
  return encH + '.' + encP + '.' + toB64Url(btoa(String.fromCharCode(...new Uint8Array(sig))));
}

async function getAccessTokenForDetection(authMethod, clientId, clientSecret, refreshToken, saParsed) {
  if (authMethod === 'service_account') {
    const jwt = await generateSAJWT(saParsed);
    const r = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: jwt }),
    });
    const d = await r.json();
    return d.access_token || null;
  }
  const r = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ client_id: clientId, client_secret: clientSecret, refresh_token: refreshToken, grant_type: 'refresh_token' }),
  });
  const d = await r.json();
  return d.access_token || null;
}

// Returns { id, type } where type is "root" | "folder" | "shared_drive"
// If id is "root", resolves it to the real root folder ID.
async function detectRootEntry(id, accessToken) {
  const h = { Authorization: 'Bearer ' + accessToken };
  if (id === 'root') {
    const r = await fetch('https://www.googleapis.com/drive/v3/files/root?fields=id', { headers: h });
    if (r.ok) {
      const d = await r.json();
      return { id: d.id, type: 'root' };
    }
    return { id, type: 'root' };
  }
  // Check if it's a Shared Drive
  const r = await fetch(`https://www.googleapis.com/drive/v3/drives/${id}`, { headers: h });
  if (r.ok) return { id, type: 'shared_drive' };
  // Otherwise it's a user-drive folder
  return { id, type: 'folder' };
}

async function handleGenerate(request) {
  try {
    const body = await request.json();
    const { client_id, client_secret, auth_code, refresh_token: directToken, auth_method, service_account_json } = body;

    const isSA = auth_method === 'service_account';
    let refresh_token = '';
    let sa_parsed = null;

    if (isSA) {
      // Service Account — no token exchange needed
      if (!service_account_json) return json({ error: 'Service Account JSON is required.' }, 400);
      try {
        sa_parsed = typeof service_account_json === 'string' ? JSON.parse(service_account_json) : service_account_json;
      } catch (e) {
        return json({ error: 'Invalid Service Account JSON. Make sure you pasted the full contents of the key file.' }, 400);
      }
    } else {
      // OAuth — exchange auth code or use direct refresh token
      if (!client_id || !client_secret) return json({ error: 'Client ID and Client Secret are required.' }, 400);
      refresh_token = directToken || '';
      if (!refresh_token) {
        if (!auth_code) return json({ error: 'Auth code or refresh token is required.' }, 400);
        const tokenResp = await fetch(TOKEN_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            code: auth_code,
            client_id,
            client_secret,
            redirect_uri: 'http://localhost',
            grant_type: 'authorization_code',
          }),
        });
        const tokenData = await tokenResp.json();
        if (tokenData.error) return json({ error: tokenData.error_description || tokenData.error }, 400);
        if (!tokenData.refresh_token) return json({ error: 'No refresh_token received. Make sure you use a fresh auth code — each code can only be used once.' }, 400);
        refresh_token = tokenData.refresh_token;
      }
    }

    // Fetch worker template
    const templateResp = await fetch(WORKER_JS_URL + '&ts=' + Date.now());
    if (!templateResp.ok) return json({ error: 'Failed to fetch worker template. Try again in a moment.' }, 500);
    let code = await templateResp.text();

    // Build roots and users
    let roots = (body.roots || []).length > 0 ? body.roots : [{ id: 'root', name: 'My Drive', protect_file_link: false }];
    const users = (body.users || []).filter(u => u.username).length > 0
      ? body.users.filter(u => u.username)
      : [{ username: 'admin', password: 'change-this' }];

    // Auto-detect and embed type for each root using the user's credentials
    try {
      const accessToken = await getAccessTokenForDetection(
        isSA ? 'service_account' : 'oauth',
        body.client_id, body.client_secret, refresh_token, sa_parsed
      );
      if (accessToken) {
        roots = await Promise.all(roots.map(async (root) => {
          try {
            const detected = await detectRootEntry(root.id, accessToken);
            return { ...root, id: detected.id, type: detected.type };
          } catch (_) {
            return root;
          }
        }));
      }
    } catch (_) {}

    // Normalize per-drive credentials: strip empty strings so they don't override global creds
    roots = roots.map(r => {
      const out = { id: r.id, name: r.name, protect_file_link: !!r.protect_file_link };
      if (r.type) out.type = r.type;
      // Per-drive OAuth
      if (r.client_id && r.client_secret && r.refresh_token) {
        out.client_id = r.client_id;
        out.client_secret = r.client_secret;
        out.refresh_token = r.refresh_token;
      }
      // Per-drive Service Account
      if (r.service_account_json) {
        try {
          const saParsedDrive = typeof r.service_account_json === 'string' ? JSON.parse(r.service_account_json) : r.service_account_json;
          out.service_account = true;
          out.service_account_json = saParsedDrive;
        } catch (_) {}
      }
      return out;
    });

    // Build authConfig object
    const authConfig = {
      siteName: body.site_name || 'Google Drive Index',
      client_id: isSA ? '' : (client_id || ''),
      client_secret: isSA ? '' : (client_secret || ''),
      refresh_token: isSA ? '' : refresh_token,
      service_account: isSA,
      service_account_json: '__RANDOMSA__',
      files_list_page_size: 100,
      search_result_list_page_size: 100,
      enable_cors_file_down: false,
      enable_password_file_verify: false,
      direct_link_protection: body.direct_link_protection || false,
      disable_anonymous_download: false,
      file_link_expiry: 7,
      search_all_drives: body.search_all_drives !== false,
      enable_login: body.enable_login || false,
      enable_signup: false,
      enable_social_login: body.enable_social_login || false,
      google_client_id_for_login: body.google_client_id_for_login || '',
      google_client_secret_for_login: body.google_client_secret_for_login || '',
      redirect_domain: body.redirect_domain || '',
      login_database: 'Local',
      login_days: parseInt(body.login_days) || 7,
      enable_ip_lock: false,
      single_session: false,
      ip_changed_action: false,
      cors_domain: '*',
      users_list: body.enable_login ? users : [{ username: 'admin', password: 'change-this' }],
      roots,
    };

    const GDI_VERSION = '2.5.9'; // auto-updated by build script
    const cdnBase = 'https://cdn.jsdelivr.net/npm/@googledrive/index@' + GDI_VERSION;

    // Build uiConfig object from form fields
    const uiConfig = {
      theme: body.theme || 'darkly',
      version: GDI_VERSION,
      debug_mode: body.debug_mode || false,
      logo_image: true,
      logo_height: '',
      logo_width: '100px',
      favicon: cdnBase + '/images/favicon.ico',
      logo_link_name: cdnBase + '/images/bhadoo-cloud-logo-white.svg',
      fixed_header: true,
      header_padding: '80',
      nav_link_1: 'Home',
      nav_link_3: 'Current Path',
      nav_link_4: 'Contact',
      fixed_footer: false,
      hide_footer: body.hide_footer !== false,
      header_style_class: 'navbar-dark bg-primary',
      footer_style_class: 'bg-primary',
      css_a_tag_color: 'white',
      css_p_tag_color: 'white',
      folder_text_color: 'white',
      loading_spinner_class: 'text-light',
      search_button_class: 'btn btn-danger',
      path_nav_alert_class: 'alert alert-primary',
      file_view_alert_class: 'alert alert-danger',
      file_count_alert_class: 'alert alert-secondary',
      contact_link: body.contact_link || 'https://telegram.dog/Telegram',
      copyright_year: '__CURRENT_YEAR__',
      company_name: body.company_name || 'Google Drive Index',
      company_link: body.company_link || 'https://gdi.js.org',
      credit: body.credit !== false,
      display_size: body.display_size !== false,
      display_time: body.display_time || false,
      display_download: true,
      disable_player: false,
      disable_video_download: body.disable_video_download || false,
      allow_selecting_files: true,
      second_domain_for_dl: body.second_domain_for_dl || false,
      poster: cdnBase + '/images/poster.jpg',
      audioposter: cdnBase + '/images/music.jpg',
      disable_audio_download: body.disable_audio_download || false,
      render_head_md: true,
      render_readme_md: body.render_readme_md !== false,
      unauthorized_owner_link: body.contact_link || 'https://telegram.dog/Telegram',
      unauthorized_owner_email: body.unauthorized_owner_email || 'abuse@telegram.org',
      downloaddomain: '__DOMAIN_FOR_DL__',
      show_logout_button: body.enable_login ? true : false,
      show_quota: body.show_quota || false,
    };

    let configStr = JSON.stringify(authConfig, null, 2)
      .replace('"__RANDOMSA__"', 'randomserviceaccount');

    let uiConfigStr = JSON.stringify(uiConfig, null, 2)
      .replace('"__CURRENT_YEAR__"', 'new Date().getFullYear()')
      .replace('"__DOMAIN_FOR_DL__"', 'domain_for_dl');

    // Replace entire authConfig block
    code = code.replace(/const authConfig = \{[\s\S]*?\n\};/, `const authConfig = ${configStr};`);

    // Replace entire uiConfig block
    code = code.replace(/const uiConfig = \{[\s\S]*?\n\};/, `const uiConfig = ${uiConfigStr};`);

    // Inject service account JSON into serviceaccounts array
    if (isSA && sa_parsed) {
      code = code.replace(
        /const serviceaccounts = \[\];/,
        `const serviceaccounts = [${JSON.stringify(sa_parsed, null, 2)}];`
      );
    }

    // Replace encryption keys
    if (body.crypto_key) code = code.replace(/const crypto_base_key = ".*?";/, `const crypto_base_key = "${body.crypto_key}";`);
    if (body.hmac_key) code = code.replace(/const hmac_base_key = ".*?";/, `const hmac_base_key = "${body.hmac_key}";`);

    // Ensure production mode
    code = code.replace(/const environment = '.*?';/, "const environment = 'production';");

    return json({ success: true, code, refresh_token: isSA ? null : refresh_token });
  } catch (err) {
    return json({ error: 'Server error: ' + err.message }, 500);
  }
}

async function servePage(request) {
  const origin = new URL(request.url).origin;

  const html = `<!DOCTYPE html>
<html lang="en" data-bs-theme="dark">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>GDI Generator — Google Drive Index v2.5.9</title>
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet" crossorigin="anonymous">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.css">
  <style>
    :root {
      --bg: #0d1117; --surface: #161b22; --surface2: #1e2736;
      --border: #2d3748; --accent: #4d9fec; --accent-soft: rgba(77,159,236,.10);
      --green: #34d399; --green-soft: rgba(52,211,153,.08);
      --yellow: #fbbf24; --red: #f87171;
      --text: #e2e8f0; --muted: #8b9ab0; --xmuted: #526070;
      --radius: 8px; --radius-sm: 5px;
    }
    body { background: var(--bg); color: var(--text); font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; font-size: 14px; }
    .card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); }
    .card-accent { border-left: 3px solid var(--accent); }
    .card-green { border-left: 3px solid var(--green); }
    .sec-title { font-size: 14px; font-weight: 600; display: flex; align-items: center; gap: 8px; }
    .sec-sub { font-size: 12px; color: var(--muted); margin-top: 2px; }
    .form-control, .form-select, textarea.form-control {
      background: var(--bg) !important; border-color: var(--border) !important;
      color: var(--text) !important; font-size: 13px; border-radius: var(--radius-sm);
    }
    .form-control:focus, .form-select:focus { border-color: var(--accent) !important; box-shadow: 0 0 0 3px var(--accent-soft) !important; }
    .form-control::placeholder { color: var(--xmuted) !important; }
    .form-label { font-size: 12px; font-weight: 500; color: #c9d5e8; margin-bottom: 4px; }
    .form-text { font-size: 11px; color: var(--muted) !important; margin-top: 3px; }
    .step-dot { display: inline-flex; align-items: center; justify-content: center; width: 24px; height: 24px; border-radius: 50%; background: var(--accent); color: #fff; font-size: 12px; font-weight: 700; flex-shrink: 0; }
    .step-dot.green { background: var(--green); }
    .badge-req { font-size: 10px; background: var(--accent-soft); color: var(--accent); border: 1px solid rgba(77,159,236,.25); border-radius: 3px; padding: 1px 6px; }
    .badge-opt { font-size: 10px; background: rgba(139,154,176,.1); color: var(--muted); border: 1px solid rgba(139,154,176,.2); border-radius: 3px; padding: 1px 6px; }
    .badge-auto { font-size: 10px; background: var(--green-soft); color: var(--green); border: 1px solid rgba(52,211,153,.25); border-radius: 3px; padding: 1px 6px; }
    .info-box { background: rgba(77,159,236,.05); border-left: 3px solid var(--accent); border-radius: 0 var(--radius-sm) var(--radius-sm) 0; padding: 10px 14px; font-size: 12px; color: #c9d5e8; line-height: 1.7; }
    .info-box code { background: var(--bg); color: var(--accent); padding: 1px 5px; border-radius: 3px; font-size: 11px; }
    .info-box ol, .info-box ul { margin: 0; padding-left: 18px; }
    .info-box li { margin-bottom: 3px; }
    .warn-box { background: rgba(251,191,36,.06); border: 1px solid rgba(251,191,36,.2); border-radius: var(--radius-sm); padding: 9px 13px; font-size: 12px; color: var(--yellow); }
    .success-box { background: var(--green-soft); border: 1px solid rgba(52,211,153,.25); border-radius: var(--radius-sm); padding: 10px 14px; }
    .method-card { background: var(--surface); border: 2px solid var(--border); border-radius: var(--radius); padding: 16px; cursor: pointer; transition: border-color .15s, background .15s; }
    .method-card:hover { border-color: var(--accent); background: var(--surface2); }
    .method-card.selected { border-color: var(--accent); background: var(--accent-soft); }
    .method-card.selected-green { border-color: var(--green); background: var(--green-soft); }
    .method-icon { font-size: 28px; margin-bottom: 8px; }
    .method-title { font-weight: 600; font-size: 14px; }
    .method-desc { font-size: 12px; color: var(--muted); margin-top: 3px; }
    .drive-row, .user-row { background: rgba(255,255,255,.025); border: 1px solid var(--border); border-radius: var(--radius-sm); padding: 10px 12px; margin-bottom: 8px; position: relative; }
    .del-btn { position: absolute; top: 8px; right: 8px; background: none; border: none; color: var(--xmuted); cursor: pointer; padding: 2px 5px; border-radius: 3px; font-size: 14px; }
    .del-btn:hover { color: var(--red); background: rgba(248,113,113,.1); }
    .key-wrap { display: flex; gap: 6px; }
    .key-wrap .form-control { font-family: 'Cascadia Code', 'SF Mono', Consolas, monospace; font-size: 11px; color: var(--green) !important; }
    .key-regen { flex-shrink: 0; background: var(--green-soft); border: 1px solid rgba(52,211,153,.25); color: var(--green); border-radius: var(--radius-sm); padding: 0 10px; cursor: pointer; font-size: 12px; }
    .key-regen:hover { background: rgba(52,211,153,.15); }
    .collapsible-trig { cursor: pointer; font-size: 12px; color: var(--accent); display: flex; align-items: center; gap: 5px; user-select: none; }
    .collapsible-trig:hover { color: #6cb4f5; }
    .caret { transition: transform .2s; display: inline-block; }
    .caret.closed { transform: rotate(-90deg); }
    .output-pre { background: #000; border-radius: var(--radius-sm); padding: 16px; max-height: 440px; overflow: auto; position: relative; }
    .output-pre code { color: #c9d5e8; font-size: 12px; line-height: 1.6; white-space: pre-wrap; word-break: break-all; font-family: 'Cascadia Code','SF Mono',Consolas,monospace; }
    .copy-abs { position: absolute; top: 8px; right: 8px; }
    .token-box { font-family: 'Cascadia Code','SF Mono',Consolas,monospace; font-size: 11px; color: var(--green); background: var(--green-soft); border: 1px solid rgba(52,211,153,.2); border-radius: var(--radius-sm); padding: 8px 10px; word-break: break-all; }
    .sa-highlight { background: rgba(52,211,153,.04); border: 1px solid rgba(52,211,153,.15); border-radius: var(--radius-sm); padding: 14px; }
    hr { border-color: var(--border); }
    a { color: var(--accent); }
    .btn-primary-gen { background: var(--accent); border-color: var(--accent); color: #fff; font-weight: 600; font-size: 14px; }
    .btn-primary-gen:hover { background: #6cb4f5; border-color: #6cb4f5; color: #fff; }
    .btn-ghost { border-color: var(--border); color: var(--muted); font-size: 12px; }
    .btn-ghost:hover { border-color: var(--accent); color: var(--accent); background: var(--accent-soft); }
    .spinner-sm { width: 14px; height: 14px; border-width: 2px; }
  </style>
</head>
<body>
<div class="container py-4" style="max-width:780px;">

  <!-- Header -->
  <div class="text-center mb-4">
    <h4 class="fw-bold mb-1"><i class="bi bi-gear-fill me-2" style="color:var(--accent)"></i>Google Drive Index — Generator</h4>
    <p style="font-size:13px;color:var(--muted);">Fill in the form below to generate your ready-to-deploy <code>worker.js</code>.</p>
    <span style="font-size:11px;color:var(--muted);background:var(--surface2);border:1px solid var(--border);border-radius:4px;padding:2px 8px;">v2.5.9</span>
  </div>

  <!-- ═══════════════════════════════════════════════════════
       STEP 1 — Choose authentication method
  ════════════════════════════════════════════════════════ -->
  <div class="card p-3 mb-3">
    <div class="d-flex align-items-center gap-2 mb-3">
      <span class="step-dot">1</span>
      <div>
        <div class="sec-title">Choose Authentication Method</div>
        <div class="sec-sub">How will your index access Google Drive?</div>
      </div>
    </div>

    <div class="row g-3" id="method-cards">
      <div class="col-md-6">
        <div class="method-card selected" id="card-oauth" onclick="setMethod('oauth')">
          <div class="method-icon">👤</div>
          <div class="method-title">Personal Account (OAuth)</div>
          <div class="method-desc">Access your own Google Drive using your Google account. Most common setup — requires a Client ID, Client Secret and a one-time authorization.</div>
        </div>
      </div>
      <div class="col-md-6">
        <div class="method-card" id="card-sa" onclick="setMethod('service_account')">
          <div class="method-icon">🤖</div>
          <div class="method-title">Service Account</div>
          <div class="method-desc">Best for Shared Drives. Uses a JSON key file — no browser sign-in needed. Share the drive with the service account email and paste the JSON below.</div>
        </div>
      </div>
    </div>
  </div>

  <!-- ═══════════════════════════════════════════════════════
       STEP 2 — Credentials
  ════════════════════════════════════════════════════════ -->
  <div class="card p-3 mb-3 card-accent">
    <div class="d-flex align-items-center gap-2 mb-3">
      <span class="step-dot">2</span>
      <div>
        <div class="sec-title">Google Credentials</div>
        <div class="sec-sub" id="creds-subtitle">Enter your OAuth credentials and authorize access to your drive.</div>
      </div>
    </div>

    <!-- OAuth path -->
    <div id="oauth-section">
      <div class="info-box mb-3">
        <strong>First time? Quick setup:</strong>
        <ol class="mt-1">
          <li>Go to <a href="https://console.cloud.google.com/apis/credentials" target="_blank">Google Cloud Console → Credentials</a>. Create a project if needed.</li>
          <li>Click <strong>+ CREATE CREDENTIALS → OAuth client ID</strong>. Set up consent screen if prompted (External, add <code>https://www.googleapis.com/auth/drive</code> scope, add your email as test user).</li>
          <li>Application type: <strong>Web application</strong>. Add redirect URI: <code>http://localhost</code></li>
          <li>Copy the <strong>Client ID</strong> and <strong>Client Secret</strong> below, then click <strong>Authorize</strong>.</li>
          <li>After authorizing, your browser shows an error page — that's normal. Copy the <strong>full URL</strong> from the address bar and paste it below.</li>
        </ol>
      </div>

      <div class="row g-2 mb-3">
        <div class="col-md-6">
          <label class="form-label">Client ID <span class="text-danger">*</span></label>
          <input type="text" class="form-control" id="f-client-id" placeholder="xxxxxxxxxx.apps.googleusercontent.com">
        </div>
        <div class="col-md-6">
          <label class="form-label">Client Secret <span class="text-danger">*</span></label>
          <input type="text" class="form-control" id="f-client-secret" placeholder="GOCSPX-XXXXXXXX">
        </div>
      </div>

      <button class="btn btn-ghost btn-sm mb-3" onclick="openAuthWindow()">
        <i class="bi bi-google me-1"></i> Open Google Authorization
      </button>
      <div id="auth-err" class="text-danger mb-2" style="display:none;font-size:12px;"></div>

      <div class="row g-2">
        <div class="col-12">
          <label class="form-label">Redirect URL from browser <span class="text-danger">*</span></label>
          <input type="text" class="form-control" id="f-auth-code" placeholder="http://localhost/?code=4/0AXXXXor paste just the code">
          <div class="form-text">Paste the full URL from your browser address bar after Google redirects, or just the <code>code=</code> value.</div>
          <div class="mt-2 d-flex align-items-center gap-2 flex-wrap">
            <button class="btn btn-ghost btn-sm" onclick="fetchRefreshToken()" id="fetch-rt-btn">
              <i class="bi bi-key me-1"></i> Get Refresh Token
            </button>
            <span id="fetch-rt-spinner" style="display:none;">
              <span class="spinner-border spinner-sm text-info" role="status"></span>
              <span style="font-size:12px;color:var(--muted);margin-left:4px;">Exchanging code\u2026</span>
            </span>
          </div>
          <div id="fetch-rt-err" style="display:none;font-size:12px;color:var(--red);margin-top:6px;"></div>
          <div id="fetch-rt-ok" style="display:none;margin-top:8px;" class="success-box">
            <div style="font-size:12px;font-weight:600;margin-bottom:4px;"><i class="bi bi-check-circle-fill text-success me-1"></i>Refresh token saved to the field below.</div>
          </div>
        </div>
      </div>

      <div class="mt-3">
        <span class="collapsible-trig" onclick="toggleSec('already-have-token', this)">
          <i class="bi bi-chevron-down caret"></i> Already have a refresh token?
        </span>
        <div id="already-have-token" style="display:none;" class="mt-2">
          <label class="form-label">Refresh Token (skips auth code flow)</label>
          <input type="text" class="form-control" id="f-refresh-token" placeholder="1//0gXXXXXXXX">
          <div class="form-text">If you enter a refresh token here, the redirect URL above is ignored.</div>
        </div>
      </div>
    </div>

    <!-- Service Account path -->
    <div id="sa-section" style="display:none;">
      <div class="info-box mb-3">
        <strong>How to set up a Service Account:</strong>
        <ol class="mt-1">
          <li>Go to <a href="https://console.cloud.google.com/iam-admin/serviceaccounts" target="_blank">Google Cloud Console → Service Accounts</a>.</li>
          <li>Click <strong>Create Service Account</strong>. Give it any name. Click <strong>Done</strong>.</li>
          <li>Click on the new service account → <strong>Keys</strong> tab → <strong>Add Key → Create new key → JSON</strong>. Download the file.</li>
          <li>Open the downloaded <code>.json</code> file in a text editor, select all, and paste it below.</li>
          <li><strong>Important:</strong> Share your Google Drive (or Shared Drive) with the service account email address shown in that JSON (<code>client_email</code>).</li>
        </ol>
      </div>
      <div class="sa-highlight">
        <label class="form-label">Service Account JSON Key <span class="text-danger">*</span></label>
        <textarea class="form-control" id="f-sa-json" rows="8"
          placeholder='Paste the full contents of your service account .json key file here:&#10;&#10;{&#10;  "type": "service_account",&#10;  "project_id": "...",&#10;  "private_key_id": "...",&#10;  "private_key": "-----BEGIN RSA PRIVATE KEY-----\\n...",&#10;  "client_email": "xxx@your-project.iam.gserviceaccount.com",&#10;  ...&#10;}'
          style="font-family:monospace;font-size:11px;min-height:160px;"></textarea>
        <div class="form-text mt-1">
          <i class="bi bi-shield-check text-success me-1"></i> Your JSON is processed in the worker to generate the code — it is never logged or stored.
        </div>
      </div>
    </div>
  </div>

  <!-- ═══════════════════════════════════════════════════════
       STEP 3 — Configure
  ════════════════════════════════════════════════════════ -->
  <div class="card p-3 mb-3">
    <div class="d-flex align-items-center gap-2 mb-3">
      <span class="step-dot">3</span>
      <div>
        <div class="sec-title">Configure Your Index</div>
        <div class="sec-sub">Set up your site name, drives, and optional features.</div>
      </div>
    </div>

    <!-- Site Name -->
    <div class="mb-4">
      <div class="d-flex align-items-center justify-content-between mb-2">
        <span style="font-size:13px;font-weight:600;">🌐 Site Settings</span>
        <span class="badge-req">Required</span>
      </div>
      <label class="form-label">Site Name</label>
      <input type="text" class="form-control" id="f-site-name" value="Google Drive Index" placeholder="My Drive Index">
    </div>

    <!-- Drives -->
    <div class="mb-4">
      <div class="d-flex align-items-center justify-content-between mb-2">
        <span style="font-size:13px;font-weight:600;">💾 Drives</span>
        <span class="badge-req">At least one</span>
      </div>
      <div id="drives-list"></div>
      <div class="d-flex gap-2 mt-1 flex-wrap">
        <button class="btn btn-ghost btn-sm" onclick="addDrive()">
          <i class="bi bi-plus-lg me-1"></i> Add Drive Manually
        </button>
        <button class="btn btn-ghost btn-sm" onclick="toggleDiscoverSection()">
          <i class="bi bi-search me-1"></i> Auto-Discover Shared Drives
        </button>
      </div>
      <div id="discover-section" style="display:none;margin-top:12px;padding:12px;background:rgba(255,255,255,0.04);border-radius:8px;border:1px solid rgba(255,255,255,0.1);">
        <div style="font-size:12px;color:var(--muted);margin-bottom:10px;">
          Uses the credentials you entered in Step 2 to list all Shared Drives your account can access.
        </div>
        <button class="btn btn-ghost btn-sm" onclick="discoverDrives()">
          <i class="bi bi-arrow-clockwise me-1"></i> Fetch Drives
        </button>
        <div id="discover-results" style="margin-top:10px;"></div>
      </div>
      <div class="form-text mt-1">Use <code>root</code> for your personal Google Drive. For Shared Drives, paste the ID from the drive URL (e.g. <code>0AOM2i7Mi3uWIUk9PVA</code>).</div>
    </div>

    <!-- Security Keys -->
    <div class="mb-4">
      <div class="d-flex align-items-center justify-content-between mb-2">
        <span style="font-size:13px;font-weight:600;">🔐 Encryption Keys</span>
        <span class="badge-auto">Auto-generated</span>
      </div>
      <div class="form-text mb-2">These keys encrypt your session cookies. Generated randomly each time — you can click <strong>New</strong> to regenerate. Keep them secret.</div>
      <div class="mb-2">
        <label class="form-label">AES-256 Session Key</label>
        <div class="key-wrap">
          <input type="text" class="form-control" id="f-crypto-key" readonly>
          <button class="key-regen" onclick="regenKey('f-crypto-key',16)"><i class="bi bi-arrow-clockwise"></i> New</button>
        </div>
      </div>
      <div>
        <label class="form-label">HMAC-512 Signing Key</label>
        <div class="key-wrap">
          <input type="text" class="form-control" id="f-hmac-key" readonly>
          <button class="key-regen" onclick="regenKey('f-hmac-key',64)"><i class="bi bi-arrow-clockwise"></i> New</button>
        </div>
      </div>
    </div>

    <!-- Login System -->
    <div class="mb-4">
      <div class="d-flex align-items-center justify-content-between mb-2">
        <span style="font-size:13px;font-weight:600;">🔒 Login / Password Protection</span>
        <div class="d-flex align-items-center gap-2">
          <span class="badge-opt">Optional</span>
          <div class="form-check form-switch mb-0">
            <input class="form-check-input" type="checkbox" id="f-enable-login" onchange="toggleLogin(this.checked)">
          </div>
        </div>
      </div>
      <div class="form-text">Require visitors to sign in before accessing the index.</div>
      <div id="login-section" style="display:none;" class="mt-3">
        <div class="row g-2 mb-3">
          <div class="col-md-4">
            <label class="form-label">Session Duration (days)</label>
            <input type="number" class="form-control" id="f-login-days" value="7" min="1" max="365">
          </div>
          <div class="col-md-8">
            <label class="form-label">Your Worker URL <small class="text-muted">(for Google login redirect)</small></label>
            <input type="text" class="form-control" id="f-redirect-domain" placeholder="https://your-worker.workers.dev">
          </div>
        </div>
        <label class="form-label">Users <span class="text-danger">*</span></label>
        <div id="users-list"></div>
        <button class="btn btn-ghost btn-sm mt-1 mb-3" onclick="addUser()">
          <i class="bi bi-person-plus me-1"></i> Add User
        </button>

        <div class="border-top pt-3" style="border-color:var(--border)!important;">
          <div class="d-flex align-items-center justify-content-between mb-1">
            <span style="font-size:12px;font-weight:600;"><i class="bi bi-google me-1"></i>Google Sign-In Button</span>
            <div class="form-check form-switch mb-0">
              <input class="form-check-input" type="checkbox" id="f-enable-social" onchange="toggleGoogleLogin(this.checked)">
              <label class="form-check-label" style="font-size:11px;color:var(--muted);">Enable</label>
            </div>
          </div>
          <div class="form-text mb-2">Adds a "Sign in with Google" button to the login page.</div>
          <div id="google-login-fields" style="display:none;">
            <div class="form-text mb-2">Add <code>https://your-worker.workers.dev/google_callback</code> as an authorized redirect URI in your Google Cloud OAuth app (same app as above).</div>
            <div class="row g-2">
              <div class="col-md-6">
                <label class="form-label">Client ID for Login</label>
                <input type="text" class="form-control" id="f-glogin-id" placeholder="xxxxxxxxxx.apps.googleusercontent.com">
              </div>
              <div class="col-md-6">
                <label class="form-label">Client Secret for Login</label>
                <input type="text" class="form-control" id="f-glogin-secret" placeholder="GOCSPX-XXXXXXXX">
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Advanced Options -->
    <div class="mb-4">
      <span class="collapsible-trig" onclick="toggleSec('advanced-opts', this)">
        <i class="bi bi-chevron-down caret closed"></i>
        ⚙️ Advanced Options <span class="badge-opt ms-1">Optional</span>
      </span>
      <div id="advanced-opts" style="display:none;" class="mt-3">
        <div class="row g-3 mb-3">
          <div class="col-md-6">
            <div class="form-check form-switch">
              <input class="form-check-input" type="checkbox" id="f-search-all" checked>
              <label class="form-check-label form-label mb-0">Search All Drives</label>
            </div>
            <div class="form-text">Search across all drives your account has access to.</div>
          </div>
          <div class="col-md-6">
            <div class="form-check form-switch">
              <input class="form-check-input" type="checkbox" id="f-direct-protect">
              <label class="form-check-label form-label mb-0">Direct Link Protection</label>
            </div>
            <div class="form-text">Require login to use direct download URLs.</div>
          </div>
        </div>
        <div class="mb-3">
          <label class="form-label">Second Domain for Downloads <small class="text-muted">(optional)</small></label>
          <input type="text" class="form-control" id="f-second-domain" placeholder="https://dl.yourname.workers.dev">
          <div class="form-text">Route downloads through a separate Cloudflare Worker to protect your main domain bandwidth.</div>
        </div>
        <div class="row g-2">
          <div class="col-md-6">
            <label class="form-label">Company / Site Name in Footer</label>
            <input type="text" class="form-control" id="f-company-name" placeholder="Google Drive Index">
          </div>
          <div class="col-md-6">
            <label class="form-label">Company Link</label>
            <input type="text" class="form-control" id="f-company-link" placeholder="https://gdi.js.org">
          </div>
          <div class="col-12">
            <label class="form-label">Contact / Unauthorized Page Link</label>
            <input type="text" class="form-control" id="f-contact-link" placeholder="https://t.me/yourusername">
          </div>
        </div>
      </div>
    </div>

    <!-- UI Options -->
    <div>
      <span class="collapsible-trig" onclick="toggleSec('ui-opts', this)">
        <i class="bi bi-chevron-down caret closed"></i>
        🎨 UI Options <span class="badge-opt ms-1">Optional</span>
      </span>
      <div id="ui-opts" style="display:none;" class="mt-3">
        <div class="row g-2 mb-3">
          <div class="col-md-6">
            <label class="form-label">Theme</label>
            <select class="form-select" id="f-theme">
              <option value="darkly" selected>Darkly (default)</option>
              <option value="slate">Slate</option>
              <option value="cyborg">Cyborg</option>
              <option value="superhero">Superhero</option>
              <option value="solar">Solar</option>
              <option value="lumen">Lumen (light)</option>
              <option value="flatly">Flatly (light)</option>
              <option value="cosmo">Cosmo (light)</option>
            </select>
          </div>
        </div>
        <div class="row g-2">
          <div class="col-md-6">
            <div class="form-check form-switch">
              <input class="form-check-input" type="checkbox" id="f-display-size" checked>
              <label class="form-check-label form-label mb-0">Show File Sizes</label>
            </div>
          </div>
          <div class="col-md-6">
            <div class="form-check form-switch">
              <input class="form-check-input" type="checkbox" id="f-display-time">
              <label class="form-check-label form-label mb-0">Show Modified Time</label>
            </div>
          </div>
          <div class="col-md-6">
            <div class="form-check form-switch">
              <input class="form-check-input" type="checkbox" id="f-hide-footer" checked>
              <label class="form-check-label form-label mb-0">Hide Footer</label>
            </div>
          </div>
          <div class="col-md-6">
            <div class="form-check form-switch">
              <input class="form-check-input" type="checkbox" id="f-render-readme" checked>
              <label class="form-check-label form-label mb-0">Render README.md</label>
            </div>
          </div>
          <div class="col-md-6">
            <div class="form-check form-switch">
              <input class="form-check-input" type="checkbox" id="f-disable-video-dl">
              <label class="form-check-label form-label mb-0">Disable Video Download Button</label>
            </div>
          </div>
          <div class="col-md-6">
            <div class="form-check form-switch">
              <input class="form-check-input" type="checkbox" id="f-disable-audio-dl">
              <label class="form-check-label form-label mb-0">Disable Audio Download Button</label>
            </div>
          </div>
          <div class="col-md-6">
            <div class="form-check form-switch">
              <input class="form-check-input" type="checkbox" id="f-credit" checked>
              <label class="form-check-label form-label mb-0">Show GDI Credit in Footer</label>
            </div>
          </div>
          <div class="col-md-6">
            <div class="form-check form-switch">
              <input class="form-check-input" type="checkbox" id="f-debug-mode">
              <label class="form-check-label form-label mb-0">Debug Mode</label>
            </div>
            <div class="form-text">Shows a debug panel in the footer with API logs, errors, and page info.</div>
          </div>
          <div class="col-md-6">
            <div class="form-check form-switch">
              <input class="form-check-input" type="checkbox" id="f-show-quota">
              <label class="form-check-label form-label mb-0">Show Storage Quota</label>
            </div>
            <div class="form-text">Display a storage usage bar below the nav. Disabled by default.</div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- ═══════════════════════════════════════════════════════
       Generate Button
  ════════════════════════════════════════════════════════ -->
  <button class="btn btn-primary-gen w-100 py-2 mb-2" id="gen-btn" onclick="handleGenerate()">
    <i class="bi bi-code-slash me-2"></i>Generate Worker Code
  </button>
  <div id="gen-err" class="text-danger" style="display:none;font-size:12px;padding:4px 0;"></div>
  <div id="gen-loading" style="display:none;" class="text-center py-3">
    <div class="spinner-border spinner-sm text-info me-2" role="status"></div>
    <span style="font-size:13px;color:var(--muted);">
      <span id="loading-msg">Generating your worker code…</span>
    </span>
  </div>

  <!-- ═══════════════════════════════════════════════════════
       STEP 4 — Output
  ════════════════════════════════════════════════════════ -->
  <div class="card p-3 mt-2 card-green" id="output-card" style="display:none;">
    <div class="d-flex align-items-center gap-2 mb-3">
      <span class="step-dot green">4</span>
      <div class="sec-title">Your Worker Code — Ready to Deploy</div>
    </div>

    <div class="success-box mb-3">
      <i class="bi bi-check-circle-fill text-success me-1"></i>
      <strong>Done!</strong> Copy the code below and paste it into
      <a href="https://dash.cloudflare.com" target="_blank">Cloudflare Workers</a> → Your Worker → Edit Code.
      Save and deploy — you're live!
    </div>

    <div id="token-section" style="display:none;" class="mb-3">
      <div style="font-size:12px;color:var(--muted);margin-bottom:4px;">
        <i class="bi bi-key me-1"></i><strong>Save your Refresh Token</strong> — needed if you regenerate later:
      </div>
      <div class="token-box" id="token-val"></div>
    </div>

    <div class="output-pre">
      <button class="btn btn-sm btn-ghost copy-abs" id="copy-btn">
        <i class="bi bi-clipboard me-1"></i>Copy
      </button>
      <code id="code-out"></code>
    </div>

    <div class="d-flex gap-2 mt-3">
      <button class="btn btn-ghost btn-sm" onclick="downloadCode()">
        <i class="bi bi-download me-1"></i>Download worker.js
      </button>
      <button class="btn btn-ghost btn-sm ms-auto" onclick="resetOutput()">
        <i class="bi bi-arrow-counterclockwise me-1"></i>Generate Another
      </button>
    </div>
  </div>

  <!-- Footer -->
  <div class="text-center mt-4 mb-4" style="font-size:11px;color:var(--muted);">
    &copy; <span id="yr"></span> <a href="https://gdi.js.org" target="_blank">gdi.js.org</a>
    &nbsp;·&nbsp; <a href="https://gdi.js.org/privacy/" target="_blank">Privacy</a>
    &nbsp;·&nbsp; Your credentials are <strong>never stored</strong> on our servers.
    <br>
    <button class="btn btn-sm btn-outline-danger mt-2" onclick="clearSaved()" style="font-size:11px;padding:2px 10px;">
      <i class="bi bi-trash me-1"></i>Clear Saved Data
    </button>
  </div>
</div>

<script>
const ORIGIN = '${origin}';
const LS_KEY = 'gdi_gen_v4';
let authMethod = 'oauth';

// ── Auth method toggle ────────────────────────────────────────────
function setMethod(m) {
  authMethod = m;
  document.getElementById('card-oauth').className = 'method-card' + (m === 'oauth' ? ' selected' : '');
  document.getElementById('card-sa').className = 'method-card' + (m === 'service_account' ? ' selected-green' : '');
  document.getElementById('oauth-section').style.display = m === 'oauth' ? 'block' : 'none';
  document.getElementById('sa-section').style.display = m === 'service_account' ? 'block' : 'none';
  document.getElementById('creds-subtitle').textContent = m === 'oauth'
    ? 'Enter your OAuth credentials and authorize access to your drive.'
    : 'Paste your Service Account JSON key file contents below.';
}

// ── Key generation ────────────────────────────────────────────────
function genHex(bytes) {
  const arr = new Uint8Array(bytes);
  crypto.getRandomValues(arr);
  return Array.from(arr, b => b.toString(16).padStart(2, '0')).join('');
}
function regenKey(id, bytes) {
  document.getElementById(id).value = genHex(bytes);
  saveData();
}

// ── Auto-discover Shared Drives ────────────────────────────────────
function toggleDiscoverSection() {
  const sec = document.getElementById('discover-section');
  sec.style.display = sec.style.display === 'none' ? 'block' : 'none';
}
async function getDiscoverAccessToken() {
  if (authMethod === 'service_account') {
    const saJson = v('f-sa-json');
    if (!saJson) throw new Error('Paste your Service Account JSON first (Step 2).');
    let sa;
    try { sa = JSON.parse(saJson); } catch(_) { throw new Error('Invalid Service Account JSON.'); }
    const iat = Math.floor(Date.now() / 1000);
    const toB64 = s => s.split('+').join('-').split('/').join('_').split('=').join('');
    const encH = toB64(btoa(JSON.stringify({ alg:'RS256', typ:'JWT' })));
    const encP = toB64(btoa(JSON.stringify({ iss:sa.client_email, scope:'https://www.googleapis.com/auth/drive', aud:'https://oauth2.googleapis.com/token', exp:iat+3600, iat })));
    const pemLines = sa.private_key.split('\\n').map(function(l){return l.trim();}).filter(function(l){return l && !l.startsWith('---');}).join('');
    const der = Uint8Array.from(atob(pemLines), function(c){return c.charCodeAt(0);}).buffer;
    const key = await crypto.subtle.importKey('pkcs8', der, { name:'RSASSA-PKCS1-v1_5', hash:'SHA-256' }, false, ['sign']);
    const sig = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, new TextEncoder().encode(encH+'.'+encP));
    const jwt = encH+'.'+encP+'.'+toB64(btoa(String.fromCharCode.apply(null, new Uint8Array(sig))));
    const r = await fetch('https://oauth2.googleapis.com/token', {
      method:'POST', headers:{'Content-Type':'application/x-www-form-urlencoded'},
      body: new URLSearchParams({ grant_type:'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion:jwt })
    });
    const d = await r.json();
    if (!d.access_token) throw new Error(d.error_description || d.error || 'SA token exchange failed');
    return d.access_token;
  }
  // OAuth: try refresh_token first, then auth_code
  const cid = v('f-client-id'), cs = v('f-client-secret');
  if (!cid || !cs) throw new Error('Enter your Client ID and Client Secret first (Step 2).');
  let rt = v('f-refresh-token');
  if (!rt) {
    // Try exchanging the auth code — also populates the refresh token field as a bonus
    const code = v('f-auth-code');
    if (!code) throw new Error('Enter your refresh token or paste the redirect URL from Google (Step 2).');
    let authCode = code;
    if (authCode.startsWith('http')) { try { authCode = new URL(authCode).searchParams.get('code') || authCode; } catch(_){} }
    const r = await fetch('https://oauth2.googleapis.com/token', {
      method:'POST', headers:{'Content-Type':'application/x-www-form-urlencoded'},
      body: new URLSearchParams({ code:authCode, client_id:cid, client_secret:cs, redirect_uri:'http://localhost', grant_type:'authorization_code' })
    });
    const d = await r.json();
    if (d.error) throw new Error(d.error_description || d.error);
    if (d.refresh_token) {
      document.getElementById('f-refresh-token').value = d.refresh_token;
      const rt_section = document.getElementById('already-have-token');
      if (rt_section) rt_section.style.display = 'block';
    }
    return d.access_token;
  }
  const r = await fetch('https://oauth2.googleapis.com/token', {
    method:'POST', headers:{'Content-Type':'application/x-www-form-urlencoded'},
    body: new URLSearchParams({ client_id:cid, client_secret:cs, refresh_token:rt, grant_type:'refresh_token' })
  });
  const d = await r.json();
  if (d.error) throw new Error(d.error_description || d.error);
  return d.access_token;
}
async function discoverDrives() {
  const resultsEl = document.getElementById('discover-results');
  resultsEl.innerHTML = '<span style="font-size:12px;color:var(--muted);">Getting access token\u2026</span>';
  try {
    const token = await getDiscoverAccessToken();
    resultsEl.innerHTML = '<span style="font-size:12px;color:var(--muted);">Fetching drives\u2026</span>';
    const r = await fetch('https://www.googleapis.com/drive/v3/drives?pageSize=100', {
      headers: { Authorization: 'Bearer ' + token }
    });
    if (!r.ok) throw new Error('API error ' + r.status);
    const data = await r.json();
    const drives = data.drives || [];
    if (!drives.length) { resultsEl.innerHTML = '<span style="font-size:12px;color:var(--muted);">No Shared Drives found for this account.</span>'; return; }
    let html = '<div style="font-size:12px;color:var(--muted);margin-bottom:6px;">Found ' + drives.length + ' Shared Drive(s). Check the ones you want to add:</div>';
    html += '<div id="discover-checks">';
    drives.forEach(function(d) {
      html += '<div class="form-check" style="font-size:12px;">'
        + '<input class="form-check-input discover-cb" type="checkbox" id="dc-' + esc(d.id) + '" value="' + esc(d.id) + '" data-name="' + esc(d.name) + '">'
        + '<label class="form-check-label" for="dc-' + esc(d.id) + '">' + esc(d.name) + ' <span style="color:var(--muted);font-family:monospace;">' + esc(d.id) + '</span></label>'
        + '</div>';
    });
    html += '</div>';
    html += '<div class="d-flex gap-2 mt-2">'
      + '<button class="btn btn-ghost btn-sm" onclick="addDiscoveredDrives()"><i class="bi bi-plus-lg me-1"></i> Add Selected</button>'
      + '<button class="btn btn-ghost btn-sm" onclick="selectAllDiscovered()">Select All</button>'
      + '</div>';
    resultsEl.innerHTML = html;
  } catch(e) {
    resultsEl.innerHTML = '<span style="color:#f44336;font-size:12px;">Error: ' + esc(e.message) + '</span>';
  }
}
function selectAllDiscovered() {
  document.querySelectorAll('.discover-cb').forEach(cb => cb.checked = true);
}
function addDiscoveredDrives() {
  const checked = [...document.querySelectorAll('.discover-cb:checked')];
  if (!checked.length) return;
  checked.forEach(cb => addDrive(cb.value, cb.dataset.name));
  document.getElementById('discover-section').style.display = 'none';
  document.getElementById('discover-results').innerHTML = '';
}

// ── Drive rows ────────────────────────────────────────────────────
let driveN = 0;
function addDrive(id = 'root', name = 'My Drive', protect = false, perCreds = {}) {
  const n = driveN++;
  const el = document.createElement('div');
  el.className = 'drive-row';
  el.id = 'dr-' + n;
  el.innerHTML = \`
    <button class="del-btn" onclick="document.getElementById('dr-\${n}').remove()" title="Remove"><i class="bi bi-x"></i></button>
    <div class="row g-2">
      <div class="col-md-5">
        <label class="form-label">Drive Name</label>
        <input class="form-control drive-name" value="\${esc(name)}" placeholder="My Drive">
      </div>
      <div class="col-md-5">
        <label class="form-label">Drive ID</label>
        <input class="form-control drive-id" value="\${esc(id)}" placeholder="root or shared drive ID">
      </div>
      <div class="col-md-2 d-flex align-items-end pb-1">
        <div>
          <div class="form-check form-switch mb-0">
            <input class="form-check-input drive-protect" type="checkbox" \${protect?'checked':''}>
          </div>
          <div style="font-size:10px;color:var(--muted);">Protect links</div>
        </div>
      </div>
    </div>
    <div class="mt-2">
      <span class="collapsible-trig" style="font-size:11px;" onclick="toggleSec('dr-creds-\${n}', this)">
        <i class="bi bi-chevron-down caret closed"></i> Per-Drive Credentials <span style="font-size:10px;color:var(--muted);">(optional — overrides global creds for this drive)</span>
      </span>
      <div id="dr-creds-\${n}" style="display:none;margin-top:8px;">
        <div style="font-size:11px;color:var(--muted);margin-bottom:8px;">Leave blank to use global credentials. Fill in only if this drive needs its own Google account or Service Account.</div>
        <div class="row g-2 mb-2">
          <div class="col-md-4">
            <label class="form-label" style="font-size:11px;">Client ID</label>
            <input class="form-control drive-per-cid" value="\${esc(perCreds.client_id||'')}" placeholder="optional" style="font-size:11px;">
          </div>
          <div class="col-md-4">
            <label class="form-label" style="font-size:11px;">Client Secret</label>
            <input class="form-control drive-per-cs" value="\${esc(perCreds.client_secret||'')}" placeholder="optional" style="font-size:11px;">
          </div>
          <div class="col-md-4">
            <label class="form-label" style="font-size:11px;">Refresh Token</label>
            <input class="form-control drive-per-rt" value="\${esc(perCreds.refresh_token||'')}" placeholder="optional" style="font-size:11px;">
          </div>
        </div>
        <div>
          <label class="form-label" style="font-size:11px;">Service Account JSON <span style="color:var(--muted);">(alternative to OAuth above)</span></label>
          <textarea class="form-control drive-per-sa" rows="3" placeholder='Paste service account JSON key — only if this drive uses its own SA' style="font-size:10px;font-family:monospace;">\${esc(perCreds.service_account_json||'')}</textarea>
        </div>
      </div>
    </div>
  \`;
  document.getElementById('drives-list').appendChild(el);
}
function getDrives() {
  return [...document.querySelectorAll('.drive-row')].map(r => {
    const obj = {
      id: r.querySelector('.drive-id').value.trim() || 'root',
      name: r.querySelector('.drive-name').value.trim() || 'Drive',
      protect_file_link: r.querySelector('.drive-protect').checked,
    };
    const cid = r.querySelector('.drive-per-cid')?.value.trim();
    const cs = r.querySelector('.drive-per-cs')?.value.trim();
    const rt = r.querySelector('.drive-per-rt')?.value.trim();
    const sa = r.querySelector('.drive-per-sa')?.value.trim();
    if (cid && cs && rt) { obj.client_id = cid; obj.client_secret = cs; obj.refresh_token = rt; }
    if (sa) obj.service_account_json = sa;
    return obj;
  });
}

// ── User rows ─────────────────────────────────────────────────────
let userN = 0;
function addUser(u = '', p = '') {
  const n = userN++;
  const el = document.createElement('div');
  el.className = 'user-row';
  el.id = 'ur-' + n;
  el.innerHTML = \`
    <button class="del-btn" onclick="document.getElementById('ur-\${n}').remove()" title="Remove"><i class="bi bi-x"></i></button>
    <div class="row g-2">
      <div class="col-md-6">
        <label class="form-label">Username</label>
        <input class="form-control user-name" value="\${esc(u)}" placeholder="admin">
      </div>
      <div class="col-md-6">
        <label class="form-label">Password</label>
        <input class="form-control user-pass" value="\${esc(p)}" placeholder="secure-password" type="text">
      </div>
    </div>
  \`;
  document.getElementById('users-list').appendChild(el);
}
function getUsers() {
  return [...document.querySelectorAll('.user-row')].map(r => ({
    username: r.querySelector('.user-name').value.trim(),
    password: r.querySelector('.user-pass').value.trim(),
  })).filter(u => u.username);
}

// ── Collapsible sections ──────────────────────────────────────────
function toggleSec(id, trig) {
  const el = document.getElementById(id);
  const c = trig.querySelector('.caret');
  const open = el.style.display === 'none';
  el.style.display = open ? 'block' : 'none';
  if (c) c.className = 'caret' + (open ? '' : ' closed');
}
function toggleLogin(on) {
  document.getElementById('login-section').style.display = on ? 'block' : 'none';
  if (on && document.querySelectorAll('.user-row').length === 0) addUser('admin', '');
}
function toggleGoogleLogin(on) {
  document.getElementById('google-login-fields').style.display = on ? 'block' : 'none';
}

// ── Get Refresh Token ─────────────────────────────────────────────
async function fetchRefreshToken() {
  const errEl = document.getElementById('fetch-rt-err');
  const okEl = document.getElementById('fetch-rt-ok');
  const spinner = document.getElementById('fetch-rt-spinner');
  const btn = document.getElementById('fetch-rt-btn');
  errEl.style.display = 'none';
  okEl.style.display = 'none';

  const cid = v('f-client-id'), cs = v('f-client-secret');
  if (!cid) { errEl.textContent = 'Enter your Client ID first (Step 2).'; errEl.style.display = 'block'; return; }
  if (!cs) { errEl.textContent = 'Enter your Client Secret first (Step 2).'; errEl.style.display = 'block'; return; }
  const raw = v('f-auth-code');
  if (!raw) { errEl.textContent = 'Paste the redirect URL from Google (or the auth code) first.'; errEl.style.display = 'block'; return; }

  let authCode = raw;
  if (authCode.startsWith('http')) {
    try { authCode = new URL(authCode).searchParams.get('code') || authCode; } catch(_){}
  }

  btn.disabled = true;
  spinner.style.display = 'inline-flex';
  try {
    const r = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ code: authCode, client_id: cid, client_secret: cs, redirect_uri: 'http://localhost', grant_type: 'authorization_code' })
    });
    const d = await r.json();
    if (d.error) throw new Error(d.error_description || d.error);
    if (!d.refresh_token) throw new Error('No refresh_token returned. Use a fresh auth code — each code can only be used once.');
    document.getElementById('f-refresh-token').value = d.refresh_token;
    const rtSec = document.getElementById('already-have-token');
    if (rtSec) rtSec.style.display = 'block';
    okEl.style.display = 'block';
    saveData();
  } catch(e) {
    errEl.textContent = 'Error: ' + e.message;
    errEl.style.display = 'block';
  } finally {
    btn.disabled = false;
    spinner.style.display = 'none';
  }
}

// ── Google auth window ────────────────────────────────────────────
function openAuthWindow() {
  const cid = document.getElementById('f-client-id').value.trim();
  if (!cid) {
    const e = document.getElementById('auth-err');
    e.textContent = 'Enter your Client ID first.';
    e.style.display = 'block';
    return;
  }
  document.getElementById('auth-err').style.display = 'none';
  const url = 'https://accounts.google.com/o/oauth2/auth'
    + '?client_id=' + encodeURIComponent(cid)
    + '&redirect_uri=' + encodeURIComponent('http://localhost')
    + '&response_type=code&access_type=offline'
    + '&scope=' + encodeURIComponent('https://www.googleapis.com/auth/drive')
    + '&prompt=consent';
  window.open(url, '_blank');
}

// ── Generate ──────────────────────────────────────────────────────
async function handleGenerate() {
  const errEl = document.getElementById('gen-err');
  errEl.style.display = 'none';

  const drives = getDrives();
  if (!drives.length) { showErr('Add at least one drive.'); return; }

  let payload = {
    auth_method: authMethod,
    site_name: v('f-site-name') || 'Google Drive Index',
    roots: drives,
    crypto_key: v('f-crypto-key'),
    hmac_key: v('f-hmac-key'),
    enable_login: document.getElementById('f-enable-login').checked,
    users: getUsers(),
    login_days: v('f-login-days') || '7',
    redirect_domain: v('f-redirect-domain'),
    enable_social_login: document.getElementById('f-enable-social').checked,
    google_client_id_for_login: v('f-glogin-id'),
    google_client_secret_for_login: v('f-glogin-secret'),
    direct_link_protection: document.getElementById('f-direct-protect').checked,
    search_all_drives: document.getElementById('f-search-all').checked,
    // Advanced / contact
    company_name: v('f-company-name'),
    company_link: v('f-company-link'),
    contact_link: v('f-contact-link'),
    // UI options
    theme: v('f-theme') || 'darkly',
    display_size: document.getElementById('f-display-size').checked,
    display_time: document.getElementById('f-display-time').checked,
    hide_footer: document.getElementById('f-hide-footer').checked,
    render_readme_md: document.getElementById('f-render-readme').checked,
    disable_video_download: document.getElementById('f-disable-video-dl').checked,
    disable_audio_download: document.getElementById('f-disable-audio-dl').checked,
    credit: document.getElementById('f-credit').checked,
    debug_mode: document.getElementById('f-debug-mode').checked,
    show_quota: document.getElementById('f-show-quota').checked,
  };

  if (authMethod === 'service_account') {
    const saJson = v('f-sa-json');
    if (!saJson) { showErr('Paste your Service Account JSON key file.'); return; }
    try { JSON.parse(saJson); } catch(e) { showErr('Invalid JSON. Make sure you pasted the full contents of the key file.'); return; }
    payload.service_account_json = saJson;
  } else {
    const cid = v('f-client-id'), cs = v('f-client-secret');
    if (!cid) { showErr('Client ID is required.'); return; }
    if (!cs) { showErr('Client Secret is required.'); return; }
    const directToken = v('f-refresh-token');
    const authRaw = v('f-auth-code');
    if (!directToken && !authRaw) { showErr('Paste the redirect URL from Google (or a refresh token).'); return; }
    let authCode = authRaw;
    if (authCode.startsWith('http')) {
      try { authCode = new URL(authCode).searchParams.get('code') || authCode; } catch(_){}
    }
    payload = { ...payload, client_id: cid, client_secret: cs, auth_code: directToken ? null : authCode, refresh_token: directToken || null };
  }

  document.getElementById('gen-btn').disabled = true;
  document.getElementById('gen-loading').style.display = 'block';
  document.getElementById('loading-msg').textContent = authMethod === 'service_account'
    ? 'Generating your worker code…'
    : 'Exchanging token & generating code…';

  try {
    const r = await fetch(ORIGIN + '/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await r.json();
    if (data.error) throw new Error(data.error);

    document.getElementById('code-out').textContent = data.code;
    document.getElementById('output-card').style.display = 'block';
    document.getElementById('output-card').scrollIntoView({ behavior: 'smooth' });

    if (data.refresh_token && !payload.refresh_token) {
      document.getElementById('token-val').textContent = data.refresh_token;
      document.getElementById('token-section').style.display = 'block';
    }
    saveData();
  } catch(e) {
    showErr(e.message);
  } finally {
    document.getElementById('gen-btn').disabled = false;
    document.getElementById('gen-loading').style.display = 'none';
  }
}

function showErr(msg) {
  const e = document.getElementById('gen-err');
  e.textContent = '⚠ ' + msg;
  e.style.display = 'block';
}
function v(id) { const el = document.getElementById(id); return el ? el.value.trim() : ''; }
function esc(s) { return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

function resetOutput() {
  document.getElementById('output-card').style.display = 'none';
  document.getElementById('token-section').style.display = 'none';
  document.getElementById('f-auth-code').value = '';
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
function downloadCode() {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([document.getElementById('code-out').textContent], { type: 'text/javascript' }));
  a.download = 'worker.js';
  a.click();
}

// ── Copy ──────────────────────────────────────────────────────────
document.getElementById('copy-btn').addEventListener('click', function() {
  navigator.clipboard.writeText(document.getElementById('code-out').textContent).then(() => {
    this.innerHTML = '<i class="bi bi-check-lg me-1"></i>Copied!';
    setTimeout(() => { this.innerHTML = '<i class="bi bi-clipboard me-1"></i>Copy'; }, 2000);
  });
});

// ── Persistence ───────────────────────────────────────────────────
const PERSIST = ['f-client-id','f-client-secret','f-site-name','f-redirect-domain',
  'f-login-days','f-glogin-id','f-second-domain','f-company-name','f-company-link','f-contact-link'];

function saveData() {
  try {
    const d = { method: authMethod };
    PERSIST.forEach(id => { d[id] = v(id); });
    d.cryptoKey = v('f-crypto-key');
    d.hmacKey = v('f-hmac-key');
    localStorage.setItem(LS_KEY, JSON.stringify(d));
  } catch(_) {}
}
function loadData() {
  try {
    const d = JSON.parse(localStorage.getItem(LS_KEY));
    if (!d) return;
    PERSIST.forEach(id => { const el = document.getElementById(id); if (el && d[id]) el.value = d[id]; });
    if (d.cryptoKey) document.getElementById('f-crypto-key').value = d.cryptoKey;
    if (d.hmacKey) document.getElementById('f-hmac-key').value = d.hmacKey;
    if (d.method) setMethod(d.method);
  } catch(_) {}
}
function clearSaved() {
  localStorage.removeItem(LS_KEY);
  PERSIST.forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
  document.getElementById('f-site-name').value = 'Google Drive Index';
  document.getElementById('f-login-days').value = '7';
  regenKey('f-crypto-key', 16);
  regenKey('f-hmac-key', 64);
  alert('Saved data cleared.');
}
PERSIST.forEach(id => { const el = document.getElementById(id); if (el) el.addEventListener('input', saveData); });

// ── Init ──────────────────────────────────────────────────────────
document.getElementById('yr').textContent = new Date().getFullYear();
loadData();
if (!v('f-crypto-key')) regenKey('f-crypto-key', 16);
if (!v('f-hmac-key')) regenKey('f-hmac-key', 64);
if (!document.querySelectorAll('.drive-row').length) addDrive('root', 'My Drive');
<\/script>
<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js" crossorigin="anonymous"><\/script>
</body>
</html>`;

  return new Response(html, {
    headers: { 'Content-Type': 'text/html;charset=UTF-8' },
  });
}
