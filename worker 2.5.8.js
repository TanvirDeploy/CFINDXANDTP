// Software: GDI-JS
// Version: 2.5.8
// Author: Parveen Bhadoo
// Website: https://gdi.js.org

// add multiple serviceaccounts as {}, {}, {}, random account will be selected by each time app is opened.

const environment = 'development'; // This Variable Decides the environment of the app. 'production' or 'development' or 'local'

const serviceaccounts = [];
const randomserviceaccount = serviceaccounts[Math.floor(Math.random() * serviceaccounts.length)]; // DO NOT TOUCH THIS
const domains_for_dl = ['']; // add multiple cloudflare addresses to balance the load on download/stream servers, eg. ['https://testing.fetchgoogleapi.workers.dev', 'https://testing2.fetchgoogleapi2.workers.dev']
const domain_for_dl = domains_for_dl[Math.floor(Math.random() * domains_for_dl.length)]; // DO NOT TOUCH THIS
const blocked_region = ['']; // add regional codes seperated by comma, eg. ['IN', 'US', 'PK']
const blocked_asn = []; // add ASN numbers from http://www.bgplookingglass.com/list-of-autonomous-system-numbers, eg. [16509, 12345]
const CDN_VERSION = '2.5.8'; // auto-updated by npm run build
const authConfig = {
  "siteName": "GDI Test", // Website name
  "client_id": "", // Client id from Google Cloud Console
  "client_secret": "", // Client Secret from Google Cloud Console
  "refresh_token": "", // Authorize token
  "service_account": false, // true if you're using Service Account instead of user account
  "service_account_json": randomserviceaccount, // don't touch this one
  "files_list_page_size": 100,
  "search_result_list_page_size": 100,
  "enable_cors_file_down": false,
  "enable_password_file_verify": false, // support for .password file not working right now
  "direct_link_protection": false, // protects direct links with Display UI
  "disable_anonymous_download": false, // disables direct links without session
  "file_link_expiry": 7, // expire file link in set number of days
  "search_all_drives": true, // search all of your drives instead of current drive if set to true
  "enable_login": false, // set to true if you want to add login system
  "enable_signup": false, // set to true if you want to add signup system
  "enable_social_login": false, // set to true if you want to add social login system
  "google_client_id_for_login": "", // Google Client ID for Login
  "google_client_secret_for_login": "", // Google Client Secret for Login
  "redirect_domain": "http://localhost:8787", // Domain for login redirect eg. https://example.com
  "login_database": "Local", // "Local" | "KV" | "D1" | "Hyperdrive"
  "login_days": 7, // days to keep logged in
  "enable_ip_lock": false, // set to true if you want to lock user downloads to user IP
  "single_session": false, // set to true if you want to allow only one session per user
  "ip_changed_action": false, // set to true if you want to logout user if IP changed
  "cors_domain": "*", // CORS domain for API requests, use * for all domains or specify your domain
  "users_list": [
    {
      "username": "admin",
      "password": "admin123",
    }
  ],
  "roots": [
    {
      "id": "root",
      "type": "root", // "root" | "folder" | "shared_drive"
      "name": "My Drive",
      "protect_file_link": false
    },
    {
      "id": "1a8tF3p6l4wenfEQV5TpGKPT9otfze5em",
      "type": "folder", // folder inside My Drive
      "name": "Drive Folder",
      "protect_file_link": false
    },
    {
      "id": "1SPeBCBNFU3s0m2NPuIJzgyAQTUWU3wMx",
      "type": "folder", // folder from shared drive context
      "name": "Shared Folder",
      "protect_file_link": false
    },
    {
      "id": "0AI96FDDLWPh5Uk9PVA",
      "type": "shared_drive", // Shared Drive (Team Drive)
      "name": "Shared Drive",
      "protect_file_link": false
    },
  ]
};
const crypto_base_key = "3225f86e99e205347b4310e437253bfd"; // Example 256 bit key used, generate your own.
const hmac_base_key = "4d1fbf294186b82d74fff2494c04012364200263d6a36123db0bd08d6be1423c"; // Example 256 bit key used, generate your own.

// Google Workspace mimeType → export format table
const GDOC_EXPORT_FORMATS = {
  'application/vnd.google-apps.document':     { name: 'Google Doc',    formats: [{ label: 'PDF',  mime: 'application/pdf', ext: 'pdf' }, { label: 'DOCX', mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', ext: 'docx' }, { label: 'TXT', mime: 'text/plain', ext: 'txt' }] },
  'application/vnd.google-apps.spreadsheet':  { name: 'Google Sheet',  formats: [{ label: 'PDF',  mime: 'application/pdf', ext: 'pdf' }, { label: 'XLSX', mime: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',           ext: 'xlsx' }, { label: 'CSV', mime: 'text/csv', ext: 'csv' }] },
  'application/vnd.google-apps.presentation': { name: 'Google Slides', formats: [{ label: 'PDF',  mime: 'application/pdf', ext: 'pdf' }, { label: 'PPTX', mime: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',   ext: 'pptx' }] },
};
const uiConfig = {
  "theme": "darkly", // switch between themes, default set to slate, select from https://gitlab.com/GoogleDriveIndex/Google-Drive-Index
  "version": CDN_VERSION, // auto-updated by build script — get latest code using generator at https://bdi-generator.hashhackers.com
  "debug_mode": true, // set to true to show a debug panel in the footer with API requests, errors, and page info
  // If you're using Image then set to true, If you want text then set it to false
  "logo_image": true, // true if you're using image link in next option.
  "logo_height": "", // only if logo_image is true
  "logo_width": "100px", // only if logo_image is true
  "favicon": 'https://cdn.jsdelivr.net/npm/@googledrive/index@' + CDN_VERSION + '/images/favicon.ico',
  // if logo is true then link otherwise just text for name
  "logo_link_name": 'https://cdn.jsdelivr.net/npm/@googledrive/index@' + CDN_VERSION + '/images/bhadoo-cloud-logo-white.svg',
  "fixed_header": true, // If you want the footer to be flexible or fixed.
  "header_padding": "80", // Value 80 for fixed header, Value 20 for flexible header. Required to be changed accordingly in some themes.
  "nav_link_1": "Home", // change navigation link name
  "nav_link_3": "Current Path", // change navigation link name
  "nav_link_4": "Contact", // change navigation link name
  "fixed_footer": false, // If you want the footer to be flexible or fixed.
  "hide_footer": true, // hides the footer from site entirely.
  "header_style_class": "navbar-dark bg-primary", // navbar-dark bg-primary || navbar-dark bg-dark || navbar-light bg-light
  "footer_style_class": "bg-primary", // bg-primary || bg-dark || bg-light
  "css_a_tag_color": "white", // Color Name or Hex Code eg. #ffffff
  "css_p_tag_color": "white", // Color Name or Hex Code eg. #ffffff
  "folder_text_color": "white", // Color Name or Hex Code eg. #ffffff
  "loading_spinner_class": "text-light", // https://getbootstrap.com/docs/5.0/components/spinners/#colors
  "search_button_class": "btn btn-danger", // https://getbootstrap.com/docs/5.0/components/buttons/#examples
  "path_nav_alert_class": "alert alert-primary", // https://getbootstrap.com/docs/4.0/components/alerts/#examples
  "file_view_alert_class": "alert alert-danger", // https://getbootstrap.com/docs/4.0/components/alerts/#examples
  "file_count_alert_class": "alert alert-secondary", // https://getbootstrap.com/docs/4.0/components/alerts/#examples
  "contact_link": "https://telegram.dog/Telegram", // Link to Contact Button on Menu
  "copyright_year": new Date().getFullYear(), // auto-detected current year
  "company_name": "The Bay Index", // Name next to copyright
  "company_link": "https://telegram.dog/Telegram", // link of copyright name
  "credit": true, // Set this to true to give us credit
  "display_size": true, // Set this to false to hide display file size
  "display_time": false, // Set this to false to hide display modified time for folder and files
  "display_download": true, // Set this to false to hide download icon for folder and files on main index
  "disable_player": false, // Set this to true to hide audio and video players
  "disable_video_download": false, // Remove Download, Copy Button on Videos
  "allow_selecting_files": true, // Disable Selecting Files to Download in Bulk
  "second_domain_for_dl": false, // If you want to display other URL for Downloading to protect your main domain.
  "poster": 'https://cdn.jsdelivr.net/npm/@googledrive/index@' + CDN_VERSION + '/images/poster.jpg', // Video poster URL or see Readme to how to load from Drive
  "audioposter": 'https://cdn.jsdelivr.net/npm/@googledrive/index@' + CDN_VERSION + '/images/music.jpg', // Video poster URL or see Readme to how to load from Drive
  "disable_audio_download": false, // Set this to true to hide download button on audio player
  "render_head_md": true, // Render Head.md
  "render_readme_md": true, // Render Readme.md
  "unauthorized_owner_link": "https://telegram.dog/Telegram", // Unauthorized Error Page Link to Owner
  "unauthorized_owner_email": "abuse@telegram.org", // Unauthorized Error Page Owner Email
  "downloaddomain": domain_for_dl, // Ignore this and set domains at top of this page after service accounts.
  "show_logout_button": authConfig.enable_login ? true : false, // set to true if you want to add logout button
  "show_quota": false, // Set to true to display storage quota usage bar (requires Drive API about.get scope)
};

const player_config = {
  "player": "videojs", // videojs || plyr || dplayer || jwplayer
  "videojs_version": "8.12.0", // Change videojs version in future when needed.
  "plyr_io_version": "3.7.8",
  "jwplayer_version": "8.16.2"
};

// DON'T TOUCH BELOW THIS UNLESS YOU KNOW WHAT YOU'RE DOING
const gds = [];
const drive_list = authConfig.roots.map(it => it.id);
const cdn_base = 'https://cdn.jsdelivr.net/npm/@googledrive/index@' + CDN_VERSION;
const dev_mode = environment !== 'production';
let app_js_file;
if (environment === 'local') {
  app_js_file = 'http://127.0.0.1:5500/src/app.js';
} else {
  app_js_file = cdn_base + '/src/app.min.js';
}
const css_file = environment === 'local' ? 'http://127.0.0.1:5500/assets/gdi.css' : cdn_base + '/assets/gdi.min.css';
const homepage_js_file = environment === 'local' ? 'http://127.0.0.1:5500/assets/homepage.js' : cdn_base + '/assets/homepage.min.js';

// Safely embed any object as JSON inside a <script> tag.
// JSON.stringify alone does not escape "</script>", which allows an attacker
// to break out of the script block by including it in a user-controlled value.
function htmlSafeJSON(obj) {
  return JSON.stringify(obj).replace(/<\//g, '<\\/');
}

function html(current_drive_order = 0, model = {}) {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0"/>
  <title>${authConfig.siteName}</title>
  <meta name="robots" content="noindex" />
  <link rel="icon" href="${uiConfig.favicon}">
  <script>try{document.documentElement.setAttribute('data-bs-theme',localStorage.getItem('gdi-theme')||'dark')}catch(_){}</script>
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet" crossorigin="anonymous">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.css">
  <link rel="stylesheet" href="${css_file}">
  <script>
  window.drive_names = JSON.parse('${htmlSafeJSON(authConfig.roots.map(it => it.name))}');
  window.MODEL = JSON.parse('${htmlSafeJSON(model)}');
  window.current_drive_order = ${current_drive_order};
  window.UI = JSON.parse('${htmlSafeJSON(uiConfig)}');
  window.player_config = JSON.parse('${htmlSafeJSON(player_config)}');
  </script>
  <script src="https://cdn.jsdelivr.net/npm/jquery@3.7.1/dist/jquery.min.js"></script>
  <script src="${app_js_file}"></script>
  <script src="https://cdn.jsdelivr.net/npm/marked@13.0.3/marked.min.js"></script>
</head>
<body>
</body>
  <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js" crossorigin="anonymous"></script>
  <script>
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').catch(function(){});
  }
  </script>
  </html>`;
}

const homepage = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0">
  <title>${authConfig.siteName}</title>
  <meta name="robots" content="noindex">
  <link rel="icon" href="${uiConfig.favicon}">
  <script>try{document.documentElement.setAttribute('data-bs-theme',localStorage.getItem('gdi-theme')||'dark')}catch(_){}</script>
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet" crossorigin="anonymous">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.css">
  <link rel="stylesheet" href="${css_file}">
  <script>
    window.drive_names = JSON.parse('${htmlSafeJSON(authConfig.roots.map(it => it.name))}');
    window.UI = JSON.parse('${htmlSafeJSON(uiConfig)}');
  </script>
  <script src="https://cdn.jsdelivr.net/npm/jquery@3.7.1/dist/jquery.min.js"></script>
</head>
<body>
  <nav class="gdi-nav">
    <div class="gdi-nav-inner">
      <a class="gdi-logo" href="/">
        ${uiConfig.logo_image ? `<img src="${uiConfig.logo_link_name}" alt="${uiConfig.company_name}" height="30">` : `<i class="bi bi-cloud-fill"></i> ${uiConfig.logo_link_name}`}
      </a>
      <div class="gdi-nav-sep"></div>
      <div class="gdi-nav-search">
        <form class="gdi-search-form" method="get" action="/0:search">
          <input class="gdi-search-input" name="q" type="search" placeholder="Search files..." required>
          <button class="gdi-search-btn" type="submit"><i class="bi bi-search"></i></button>
        </form>
      </div>
      <div class="gdi-nav-actions">
        <button id="theme-toggle" class="gdi-nav-btn" onclick="toggleThemeHP()" title="Toggle theme">
          <i class="bi bi-moon-stars" id="theme-icon"></i>
        </button>
        ${uiConfig.show_logout_button ? `<a class="gdi-nav-btn" href="/logout"><i class="bi bi-box-arrow-right"></i> Logout</a>` : ''}
      </div>
    </div>
  </nav>

  <div id="content" style="padding-top:54px;">
    <div class="gdi-wrap">
      <div class="gdi-drives-header">${authConfig.siteName}</div>
      <div id="list" class="gdi-drives-grid"></div>
      <div id="count" style="display:none;"></div>
    </div>
  </div>

  <footer class="gdi-footer"${uiConfig.hide_footer ? ' style="display:none;"' : ''}>
    ${uiConfig.credit ? `<span>Redesigned by <a href="https://www.npmjs.com/package/@googledrive/index" target="_blank">TheFirstSpeedster</a></span> &middot; ` : ''}
    <span>&copy; ${uiConfig.copyright_year} <a href="${uiConfig.company_link}" target="_blank">${uiConfig.company_name}</a></span>
  </footer>

  <script src="${homepage_js_file}"></script>
  <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js" crossorigin="anonymous"></script>
  <script>
    function toggleThemeHP() {
      const cur = document.documentElement.getAttribute('data-bs-theme') || 'dark';
      const next = cur === 'dark' ? 'light' : 'dark';
      localStorage.setItem('gdi-theme', next);
      document.documentElement.setAttribute('data-bs-theme', next);
      const icon = document.getElementById('theme-icon');
      if (icon) icon.className = next === 'dark' ? 'bi bi-moon-stars' : 'bi bi-sun';
    }
    // Apply icon on load
    (function(){ const t=localStorage.getItem('gdi-theme')||'dark'; const i=document.getElementById('theme-icon'); if(i) i.className = t==='dark'?'bi bi-moon-stars':'bi bi-sun'; })();
  </script>
</body>
</html>`;

const login_html = `<!DOCTYPE html>
<html><head>
  <meta charset="UTF-8">
  <title>Sign in \u2014 ${authConfig.siteName}</title>
  <meta name="robots" content="noindex, nofollow">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0">
  <link rel="icon" href="${uiConfig.favicon}">
  <script>try{document.documentElement.setAttribute('data-bs-theme',localStorage.getItem('gdi-theme')||'dark')}catch(_){}</script>
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet" crossorigin="anonymous">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.css">
  <link rel="stylesheet" href="${css_file}">
</head>
<body>
  <div class="gdi-auth-wrap">
    <div class="gdi-login-card">
      <div class="gdi-login-header">
        ${uiConfig.logo_image ? `<img src="${uiConfig.logo_link_name}" alt="${uiConfig.company_name}" class="gdi-login-logo">` : ''}
        <h1 class="gdi-login-title">${authConfig.siteName}</h1>
        <p class="gdi-login-subtitle">Sign in to continue</p>
      </div>
      <div id="error-msg" class="gdi-alert gdi-alert-error" style="display:none;"></div>
      <form id="login-form" autocomplete="on">
        <div class="gdi-field">
          <label class="gdi-field-label" for="username">Username</label>
          <input id="username" name="username" type="text" class="gdi-field-input"
            placeholder="Enter username" autocomplete="username" autofocus required>
        </div>
        <div class="gdi-field">
          <label class="gdi-field-label" for="password">Password</label>
          <div class="gdi-field-row">
            <input id="password" name="password" type="password" class="gdi-field-input"
              placeholder="Enter password" autocomplete="current-password" required>
            <button type="button" class="gdi-field-eye" id="toggle-pw" tabindex="-1">
              <i class="bi bi-eye" id="eye-icon"></i>
            </button>
          </div>
        </div>
        <button id="btn-login" type="submit" class="gdi-btn gdi-btn-primary gdi-btn-full">
          <i class="bi bi-box-arrow-in-right"></i> Sign in
        </button>
      </form>
      ${authConfig.enable_social_login && authConfig.google_client_id_for_login ? `
      <div class="gdi-login-divider"><span>or</span></div>
      <a href="https://accounts.google.com/o/oauth2/v2/auth?client_id=${authConfig.google_client_id_for_login}&redirect_uri=${encodeURIComponent(authConfig.redirect_domain + '/google_callback')}&response_type=code&scope=email%20profile&access_type=offline"
         class="gdi-btn gdi-btn-google">
        <svg viewBox="0 0 24 24" width="18" height="18" style="flex-shrink:0">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
        </svg>
        Sign in with Google
      </a>` : ''}
      <p class="gdi-login-footer">&copy; ${uiConfig.copyright_year} ${authConfig.siteName}</p>
    </div>
  </div>
  <script>
    document.getElementById('login-form').addEventListener('submit', function(e) {
      e.preventDefault();
      const btn = document.getElementById('btn-login');
      btn.disabled = true;
      btn.innerHTML = '<i class="bi bi-hourglass-split"></i> Signing in...';
      const body = new URLSearchParams({
        username: document.getElementById('username').value.trim(),
        password: document.getElementById('password').value
      });
      fetch('/login', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: body.toString() })
        .then(function(r) { return r.json(); })
        .then(function(data) {
          if (!data.ok) {
            const el = document.getElementById('error-msg');
            el.style.display = '';
            el.textContent = data.message || 'Invalid username or password.';
            btn.disabled = false;
            btn.innerHTML = '<i class="bi bi-box-arrow-in-right"></i> Sign in';
          } else {
            btn.innerHTML = '<i class="bi bi-check-circle"></i> Signed in!';
            setTimeout(function() { window.location.href = data.redirect || '/'; }, 300);
          }
        })
        .catch(function() {
          const el = document.getElementById('error-msg');
          el.style.display = '';
          el.textContent = 'Network error. Please try again.';
          btn.disabled = false;
          btn.innerHTML = '<i class="bi bi-box-arrow-in-right"></i> Sign in';
        });
    });
    document.getElementById('toggle-pw').addEventListener('click', function() {
      const pw = document.getElementById('password');
      const icon = document.getElementById('eye-icon');
      if (pw.type === 'password') { pw.type = 'text'; icon.className = 'bi bi-eye-slash'; }
      else { pw.type = 'password'; icon.className = 'bi bi-eye'; }
    });
    const qp = new URLSearchParams(window.location.search);
    if (qp.get('error')) {
      const el = document.getElementById('error-msg');
      el.style.display = '';
      el.textContent = qp.get('error');
    }
  </script>
</body></html>`;


const not_found = `<!DOCTYPE html>
<html lang=en>
  <meta charset=utf-8>
  <meta name=viewport content="initial-scale=1, minimum-scale=1, width=device-width">
  <title>Error 404 (Not Found)!!1</title>
  <style>
  *{margin:0;padding:0}html,code{font:15px/22px arial,sans-serif}html{background:#fff;color:#222;padding:15px}body{margin:7% auto 0;max-width:390px;min-height:180px;padding:30px 0 15px}* > body{background:url(//www.google.com/images/errors/robot.png) 100% 5px no-repeat;padding-right:205px}p{margin:11px 0 22px;overflow:hidden}ins{color:#777;text-decoration:none}a img{border:0}@media screen and (max-width:772px){body{background:none;margin-top:0;max-width:none;padding-right:0}}#logo{background:url(//www.google.com/images/branding/googlelogo/1x/googlelogo_color_150x54dp.png) no-repeat;margin-left:-5px}@media only screen and (min-resolution:192dpi){#logo{background:url(//www.google.com/images/branding/googlelogo/2x/googlelogo_color_150x54dp.png) no-repeat 0% 0%/100% 100%;-moz-border-image:url(//www.google.com/images/branding/googlelogo/2x/googlelogo_color_150x54dp.png) 0}}@media only screen and (-webkit-min-device-pixel-ratio:2){#logo{background:url(//www.google.com/images/branding/googlelogo/2x/googlelogo_color_150x54dp.png) no-repeat;-webkit-background-size:100% 100%}}#logo{display:inline-block;height:54px;width:150px}
  </style>
  <a href=//www.google.com/><span id=logo aria-label=Google></span></a>
  <p><b>404.</b> <ins>That’s an error.</ins>
  <p id="status"></p>

  <script>
  (function() {
    var el = document.getElementById("status");
    var code = document.createElement(‘code’);
    code.textContent = window.location.pathname;
    el.appendChild(document.createTextNode(‘The requested URL ‘));
    el.appendChild(code);
    el.appendChild(document.createTextNode(‘ was not found on this server.  ‘));
    var ins = document.createElement(‘ins’);
    ins.textContent = "That’s all we know.";
    el.appendChild(ins);
  })();
  </script>`;

const asn_blocked = `<html>
  <head>
  <title>Access Denied</title>
  <link href='https://fonts.googleapis.com/css?family=Lato:100' rel='stylesheet' type='text/css'>
  <style>
  body{
    margin:0;
    padding:0;
    width:100%;
    height:100%;
    color:#b0bec5;
    display:table;
    font-weight:100;
    font-family:Lato
  }
  .container{
    text-align:center;
    display:table-cell;
    vertical-align:middle
  }
  .content{
    text-align:center;
    display:inline-block
  }
  .message{
    font-size:80px;
    margin-bottom:40px
  }
  a{
    text-decoration:none;
    color:#3498db
  }

  </style>
  </head>
  <body>
  <div class="container">
  <div class="content">
  <div class="message">Access Denied</div>
  </div>
  </div>
  </body>
  </html>`;

const directlink = `
  <html>
  <head>
  <title>Direct Link - Access Denied</title>
  <link href='https://fonts.googleapis.com/css?family=Lato:100' rel='stylesheet' type='text/css'>
  <style>
  body{
    margin:0;
    padding:0;
    width:100%;
    height:100%;
    color:#b0bec5;
    display:table;
    font-weight:100;
    font-family:Lato
  }
  .container{
    text-align:center;
    display:table-cell;
    vertical-align:middle
  }
  .content{
    text-align:center;
    display:inline-block
  }
  .message{
    font-size:80px;
    margin-bottom:40px
  }
  a{
    text-decoration:none;
    color:#3498db
  }

  </style>
  </head>
  <body>
  <div class="container">
  <div class="content">
  <div class="message">Access Denied</div>
  <center><a href="/" id="goto-link"><button id="goto">Click Here to Proceed!</button></a></center>
  <script>document.getElementById('goto-link').href=window.location.href;</script>
  </div>
  </div>
  </body>
  </html>
  `;

const SearchFunction = {
  formatSearchKeyword: function(keyword) {
    const nothing = "";
    const space = " ";
    if (!keyword) return nothing;
    return keyword.replace(/(!=)|['"=<>/\\:]/g, nothing)
      .replace(/[,，|(){}]/g, space)
      .trim();
  }

};

const DriveFixedTerms = new(class {
  default_file_fields = 'parents,id,name,mimeType,modifiedTime,createdTime,fileExtension,size';
  gd_root_type = {
    user_drive: 0,
    share_drive: 1
  };
  folder_mime_type = 'application/vnd.google-apps.folder';
})();

// Token Generation for Service Accounts
const JSONWebToken = {
  header: {
    alg: 'RS256',
    typ: 'JWT'
  },
  importKey: async function(pemKey) {
    const pemDER = this.textUtils.base64ToArrayBuffer(pemKey.split('\n').map(s => s.trim()).filter(l => l.length && !l.startsWith('---')).join(''));
    return crypto.subtle.importKey('pkcs8', pemDER, {
      name: 'RSASSA-PKCS1-v1_5',
      hash: 'SHA-256'
    }, false, ['sign']);
  },
  createSignature: async function(text, key) {
    const textBuffer = this.textUtils.stringToArrayBuffer(text);
    return crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, textBuffer);
  },
  generateGCPToken: async function(serviceAccount) {
    const iat = parseInt(Date.now() / 1000);
    const payload = {
      "iss": serviceAccount.client_email,
      "scope": "https://www.googleapis.com/auth/drive",
      "aud": "https://oauth2.googleapis.com/token",
      "exp": iat + 3600,
      "iat": iat
    };
    const toBase64Url = s => s.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
    const encPayload = toBase64Url(btoa(JSON.stringify(payload)));
    const encHeader  = toBase64Url(btoa(JSON.stringify(this.header)));
    const key = await this.importKey(serviceAccount.private_key);
    const signed = await this.createSignature(encHeader + "." + encPayload, key);
    return encHeader + "." + encPayload + "." + toBase64Url(this.textUtils.arrayBufferToBase64(signed));
  },
  textUtils: {
    base64ToArrayBuffer: function(base64) {
      const binary_string = atob(base64);
      const len = binary_string.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binary_string.charCodeAt(i);
      }
      return bytes.buffer;
    },
    stringToArrayBuffer: function(str) {
      const len = str.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = str.charCodeAt(i);
      }
      return bytes.buffer;
    },
    arrayBufferToBase64: function(buffer) {
      let binary = '';
      const bytes = new Uint8Array(buffer);
      const len = bytes.byteLength;
      for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      return btoa(binary);
    }
  }
};

// web crypto functions
// v2.4.0+: random IV prepended to ciphertext (16 bytes IV || ciphertext → base64)
async function encryptString(string) {
  const iv = crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(crypto_base_key),
    "AES-CBC",
    false,
    ["encrypt"]
  );
  const encryptedData = await crypto.subtle.encrypt(
    { name: "AES-CBC", iv },
    key,
    new TextEncoder().encode(string)
  );
  const encryptedBytes = new Uint8Array(encryptedData);
  const combined = new Uint8Array(iv.length + encryptedBytes.length);
  combined.set(iv);
  combined.set(encryptedBytes, iv.length);
  return btoa(Array.from(combined, b => String.fromCharCode(b)).join(""));
}

async function decryptString(encryptedString) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(crypto_base_key),
    "AES-CBC",
    false,
    ["decrypt"]
  );
  const combined = Uint8Array.from(atob(encryptedString), c => c.charCodeAt(0));

  const iv = combined.slice(0, 16);
  const ciphertext = combined.slice(16);
  const decryptedData = await crypto.subtle.decrypt({ name: "AES-CBC", iv }, key, ciphertext);
  return new TextDecoder().decode(decryptedData);
}

// Web Crypto Integrity Generate API
async function genIntegrity(data, key = hmac_base_key) {
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  const hmacKey = await crypto.subtle.importKey(
      'raw',
      encoder.encode(key), {
          name: 'HMAC',
          hash: 'SHA-256'
      },
      false,
      ['sign']
  );
  const hmacBuffer = await crypto.subtle.sign('HMAC', hmacKey, dataBuffer);

  // Convert the HMAC buffer to hexadecimal string
  const hmacArray = Array.from(new Uint8Array(hmacBuffer));
  const hmacHex = hmacArray.map(byte => byte.toString(16).padStart(2, '0')).join('');

  return hmacHex;
}

async function checkintegrity(expectedHex, actualHex) {
  // Constant-time comparison via HMAC verify to prevent timing attacks
  if (typeof expectedHex !== 'string' || typeof actualHex !== 'string') return false;
  if (expectedHex.length !== actualHex.length) return false;
  const enc = new TextEncoder();
  // Re-sign actualHex and compare against expectedHex using crypto.subtle
  // as a constant-time equal-length byte comparison
  const keyMaterial = await crypto.subtle.importKey(
    'raw', enc.encode(hmac_base_key),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  );
  const sig1 = await crypto.subtle.sign('HMAC', keyMaterial, enc.encode(expectedHex));
  const sig2 = await crypto.subtle.sign('HMAC', keyMaterial, enc.encode(actualHex));
  const a = new Uint8Array(sig1);
  const b = new Uint8Array(sig2);
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

function login() {
  return new Response(login_html, {
    status: 401,
    headers: {
      'Content-Type': 'text/html; charset=utf-8'
    }
  });
}


// start handlerequest
async function handleRequest(request, event) {
  const region = request.headers.get('cf-ipcountry');
  const asn_servers = request.cf?.asn;
  const referer = request.headers.get("Referer");
  const user_ip = request.headers.get("CF-Connecting-IP");
  const url = new URL(request.url);
  const path = url.pathname;
  const hostname = url.hostname;
  if (path == '/sw.js') {
    let swResp = await fetch(cdn_base + '/sw.js');
    if (!swResp.ok) {
      return new Response('// service worker unavailable', {
        status: 200,
        headers: { 'Content-Type': 'application/javascript; charset=utf-8' }
      });
    }
    const swData = await swResp.text();
    return new Response(swData, {
      status: 200,
      headers: {
        'Content-Type': 'application/javascript; charset=utf-8',
        'Cache-Control': 'no-cache',
        'Service-Worker-Allowed': '/',
      }
    });
  }
  if (path == '/app.js') {
    // Debug endpoint — only available outside production to avoid login bypass
    if (environment === 'production') {
      return new Response('Not found.', { status: 404 });
    }
    const js = await fetch('https://gitlab.com/GoogleDriveIndex/Google-Drive-Index/-/raw/dev/src/app.js', {
      method: 'GET',
    });
    if (!js.ok) {
      return new Response('// app.js fetch failed', {
        status: 200,
        headers: { 'Content-Type': 'application/javascript; charset=utf-8' }
      });
    }
    const data = await js.text();
    return new Response(data, {
      status: 200,
      headers: {
        'Content-Type': 'application/javascript; charset=utf-8',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': 'true',
      }
    });
  }
  if (path == '/logout') {
    const response = new Response("", {});
    response.headers.set('Set-Cookie', `session=; path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`);
    const logoutRedirect = authConfig.enable_login ? '/login' : '/';
    response.headers.set("Refresh", `0; url=${logoutRedirect}`);
    return response;
  }
  // /findpath is handled after gds init below
  if (authConfig.enable_login) {
    const login_database = authConfig.login_database.toLowerCase();
    //console.log("Login Enabled")
    if (path == '/download.aspx' && !authConfig.disable_anonymous_download) {
      console.log("Anonymous Download");
    } else if (path == '/google_callback') {
      // Extract the authorization code from the query parameters
      const code = url.searchParams.get('code');
      if (!code) {
        return new Response('Missing authorization code.', {
          status: 400
        });
      }

      // Use the authorization code to obtain access token and ID token		
      const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          code,
          client_id: authConfig.google_client_id_for_login,
          client_secret: authConfig.google_client_secret_for_login,
          redirect_uri: authConfig.redirect_domain + '/google_callback',
          grant_type: 'authorization_code',
        }),
      });

      const data = await response.json();
      if (response.ok) {
        const idToken = data.id_token;
        const decodedIdToken = await decodeJwtToken(idToken);
        const username = decodedIdToken.email;
        let kv_key;
        let user_found = false;
        // Check if user email exist in the list
        if (login_database == 'kv') {
          kv_key = await ENV.get(username);
          user_found = kv_key !== null;
        } else if (login_database == 'd1') {
          // Requires D1 binding named DB in wrangler.toml (Workers Paid plan)
          const row = await DB.prepare('SELECT username FROM users WHERE username = ?').bind(username).first();
          user_found = row !== null;
        } else if (login_database == 'hyperdrive') {
          // Hyperdrive requires ES Module format worker (export default { fetch }).
          // This service-worker format does not support it. See README for migration guide.
          return new Response('', {
            status: 302,
            headers: { 'Location': '/login?error=Hyperdrive+login_database+not+supported+in+service-worker+format.+See+README.' }
          });
        } else if (login_database == 'mongodb') {
          // to be implemented later
        } else { // local database
          for (let i = 0; i < authConfig.users_list.length; i++) {
            if (authConfig.users_list[i].username == username) {
              user_found = true;
              console.log("User Found");
              break;
            }
          }
        }
        if (!user_found) {
          const response = new Response('', {});
          response.headers.set('Set-Cookie', `session=; path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`);
          response.headers.set('Refresh', '0; url=/login?error=Account+not+authorised');
          return response;
        }
        const current_time = Date.now(); // this results in a timestamp of the number of milliseconds since epoch.
        const session_time = current_time + 86400000 * authConfig.login_days;
        // kv_key is only defined when using KV database; use empty string for local/other DB modes
        const encryptedSession = `${await encryptString(username)}|${await encryptString(kv_key || '')}|${await encryptString(session_time.toString())}`;
        if (authConfig.single_session) {
          await ENV.put(username + '_session', encryptedSession);
        }
        if (authConfig.ip_changed_action && user_ip) {
          await ENV.put(username + '_ip', user_ip);
        }
        const response = new Response('', {
          status: 302,
          headers: {
            'Location': '/',
            'Set-Cookie': `session=${encryptedSession}; path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${86400 * authConfig.login_days}`,
          }
        });
        return response;
      } else {
        const response = new Response('', { status: 302 });
        response.headers.set('Set-Cookie', `session=; path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`);
        response.headers.set('Location', '/login?error=Invalid+Token');
        return response;
      }
    } else if (authConfig.enable_login && request.method === 'POST' && path === '/login') {
      console.log("POST Request for Login");
      const formdata = await request.formData();
      const username = formdata.get('username');
      const password = formdata.get('password');
      let user_found = false;
      if (login_database == 'kv') {
        const kv_key = await ENV.get(username);
        if (kv_key !== null) {
          user_found = kv_key == password;
        }
      } else if (login_database == 'd1') {
        // Requires D1 binding named DB in wrangler.toml (Workers Paid plan)
        const row = await DB.prepare('SELECT password FROM users WHERE username = ?').bind(username).first();
        if (row) user_found = row.password === password;
      } else if (login_database == 'hyperdrive') {
        // Hyperdrive requires ES Module format worker (export default { fetch }).
        // This service-worker format does not support it. See README for migration guide.
        return new Response(JSON.stringify({ ok: false, message: 'Hyperdrive login_database is not supported in service-worker format. See README for migration guide.' }), {
          status: 501, headers: { 'Content-Type': 'application/json; charset=utf-8' }
        });
      } else if (login_database == 'mongodb') {
        // to be implemented later
      } else { // local database
        for (let i = 0; i < authConfig.users_list.length; i++) {
          if (authConfig.users_list[i].username == username && authConfig.users_list[i].password == password) {
            user_found = true;
            break;
          }
        }
      }

      if (!user_found) {
        return new Response(JSON.stringify({ ok: false, message: 'Invalid username or password.' }), {
          status: 200,
          headers: { 'Content-Type': 'application/json; charset=utf-8' }
        });
      }
      const current_time = Date.now();
      const session_time = current_time + 86400000 * authConfig.login_days;
      const encryptedSession = `${await encryptString(username)}|${await encryptString(password)}|${await encryptString(session_time.toString())}`;
      if (authConfig.single_session) {
        await ENV.put(username + '_session', encryptedSession);
      }
      if (authConfig.ip_changed_action && user_ip) {
        await ENV.put(username + '_ip', user_ip);
      }
      return new Response(JSON.stringify({ ok: true, redirect: '/' }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Set-Cookie': `session=${encryptedSession}; path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${86400 * authConfig.login_days}`,
        }
      });
    } else {
      // Validate session for all other requests (GET, POST API calls, etc.)
      const cookie = request.headers.get('cookie');
      if (cookie && cookie.includes('session=')) {
        const sessionMatch = cookie.match(/(?:^|;\s*)session=([^;]*)/);
        const session = sessionMatch ? sessionMatch[1].trim() : null;
        if (session == 'null' || session == '' || session == null) {
          if (request.method === 'POST') {
            return new Response(JSON.stringify({ ok: false, message: 'Session expired. Please log in again.' }), {
              status: 401,
              headers: { 'Content-Type': 'application/json; charset=utf-8' }
            });
          }
          return login();
        }
        let username;
        try {
          username = await decryptString(session.split('|')[0]);
        } catch (_) {
          if (request.method === 'POST') {
            return new Response(JSON.stringify({ ok: false, message: 'Invalid session. Please log in again.' }), {
              status: 401,
              headers: { 'Content-Type': 'application/json; charset=utf-8' }
            });
          }
          return login();
        }
        if (authConfig.single_session) {
          const kv_session = await ENV.get(username + '_session');
          if (kv_session != session) {
            const response = new Response('User Logged in Someplace Else!', {
              headers: { 'Set-Cookie': `session=; path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0` }
            });
            response.headers.set("Refresh", "1; url=/login?error=User+Logged+in+Someplace+Else");
            return response;
          }
        }
        if (authConfig.ip_changed_action && user_ip) {
          const kv_ip = await ENV.get(username + '_ip');
          if (kv_ip != user_ip) {
            const response = new Response('IP Changed! Login Required', {
              headers: { 'Set-Cookie': `session=; path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0` }
            });
            response.headers.set("Refresh", "1; url=/login?error=IP+Changed+Login+Required");
            return response;
          }
        }
        let session_time;
        try {
          session_time = await decryptString(session.split('|')[2]);
        } catch (_) {
          if (request.method === 'POST') {
            return new Response(JSON.stringify({ ok: false, message: 'Invalid session. Please log in again.' }), {
              status: 401,
              headers: { 'Content-Type': 'application/json; charset=utf-8' }
            });
          }
          return login();
        }
        const current_time = Date.now();
        if (Number(session_time) < current_time) {
          const response = new Response('Session Expired!', {
            headers: { 'Set-Cookie': `session=; path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0` }
          });
          response.headers.set("Refresh", "1; url=/login?error=Session+Expired");
          return response;
        }
        let user_found = false;
        if (login_database == 'kv') {
          const kv_key = await ENV.get(username);
          user_found = kv_key !== null && kv_key !== undefined;
        } else if (login_database == 'd1') {
          // Requires D1 binding named DB in wrangler.toml (Workers Paid plan)
          const row = await DB.prepare('SELECT username FROM users WHERE username = ?').bind(username).first();
          user_found = row !== null;
        } else if (login_database == 'hyperdrive') {
          // Hyperdrive requires ES Module format worker (export default { fetch }).
          // This service-worker format does not support it. See README for migration guide.
          return new Response('', {
            status: 302,
            headers: { 'Location': '/login?error=Hyperdrive+login_database+not+supported+in+service-worker+format.+See+README.' }
          });
        } else if (login_database == 'mongodb') {
          // to be implemented later
        } else { // local database
          for (let i = 0; i < authConfig.users_list.length; i++) {
            if (authConfig.users_list[i].username == username) {
              user_found = true;
              break;
            }
          }
        }
        if (!user_found) {
          const response = new Response('Invalid User! Something Wrong', {});
          response.headers.set('Set-Cookie', `session=; path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`);
          response.headers.set("Refresh", "1; url=/login?error=Invalid+User");
          return response;
        }
      } else {
        if (request.method === 'POST') {
          return new Response(JSON.stringify({ ok: false, message: 'Authentication required. Please log in.' }), {
            status: 401,
            headers: { 'Content-Type': 'application/json; charset=utf-8' }
          });
        }
        return login();
      }
    }
  }

  if (gds.length === 0) {
    for (let i = 0; i < authConfig.roots.length; i++) {
      const gd = new googleDrive(authConfig, i);
      await gd.init();
      gds.push(gd);
    }
    const tasks = [];
    gds.forEach(gd => {
      tasks.push(gd.initRootType());
    });
    for (const task of tasks) {
      await task;
    }
  }

  let gd;

  function redirectToIndexPage() {
    return new Response('', {
      status: 302,
      headers: {
        'Location': `${url.origin}/0:/`
      }
    });
  }

  if (region && blocked_region.includes(region.toUpperCase())) {
    return new Response(asn_blocked, {
      status: 403,
      headers: {
        "content-type": "text/html;charset=UTF-8",
      },
    });
  } else if (asn_servers && blocked_asn.includes(asn_servers)) {
    return new Response(asn_blocked, {
      headers: {
        'content-type': 'text/html;charset=UTF-8'
      },
      status: 403
    });
  } else if (path == '/' && url.searchParams.has('driveid')) {
    // Cross-drive ID lookup: /?driveid=GOOGLE_DRIVE_ID[&view=true]
    const raw_id = url.searchParams.get('driveid');
    const view_param = url.searchParams.get('view') || 'false';
    if (raw_id) {
      let found_path = null;
      let found_drive = 0;
      for (let i = 0; i < gds.length; i++) {
        try {
          const result = await gds[i].findPathById(raw_id);
          if (result && result[0]) {
            found_path = result[0];
            found_drive = (result[1] !== undefined) ? result[1] : i;
            break;
          }
        } catch (_) {}
      }
      if (found_path) {
        const suffix = view_param === 'true' ? '?a=view' : '';
        return Response.redirect(url.origin + '/' + found_drive + ':' + found_path + suffix, 302);
      }
      // Not in any drive hierarchy — check if accessible via credentials (fallback)
      try {
        const file = await gds[0].findItemById(raw_id);
        if (file && file.id) {
          const encrypted_id = await encryptString(raw_id);
          return Response.redirect(url.origin + '/fallback?id=' + encodeURIComponent(encrypted_id), 302);
        }
      } catch (_) {}
      return new Response(JSON.stringify({ error: 'File not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' }
      });
    }
    return new Response(homepage, {
      status: 200,
      headers: { "content-type": "text/html;charset=UTF-8" },
    });
  } else if (path == '/findpath') {
    const id = url.searchParams.get('id');
    const view = url.searchParams.get('view') || 'false';
    if (!id) {
      return new Response(JSON.stringify({ error: 'Missing id parameter' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' }
      });
    }
    // Try all drives to find the file/folder path
    let found_path = null;
    let found_drive_idx = 0;
    for (let i = 0; i < gds.length; i++) {
      try {
        const result = await gds[i].findPathById(id);
        if (result && result[0]) {
          found_path = result[0];
          found_drive_idx = (result[1] !== undefined) ? result[1] : i;
          break;
        }
      } catch (_) {}
    }
    if (found_path) {
      const suffix = view === 'true' ? '?a=view' : '';
      return Response.redirect(url.origin + '/' + found_drive_idx + ':' + found_path + suffix, 302);
    }
    // Not in any configured drive hierarchy — check if accessible via credentials (fallback)
    try {
      const file = await gds[0].findItemById(id);
      if (file && file.id) {
        const encrypted_id = await encryptString(id);
        return Response.redirect(url.origin + '/fallback?id=' + encodeURIComponent(encrypted_id), 302);
      }
    } catch (_) {}
    return new Response(JSON.stringify({ error: 'File not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json;charset=UTF-8' }
    });
  } else if (path == '/') {
    return new Response(homepage, {
      status: 200,
      headers: {
        "content-type": "text/html;charset=UTF-8",
      },
    });
  } else if (path == '/fallback') {
    return new Response(html(0, {
      is_search_page: false,
      root_type: 1
    }), {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8'
      }
    });
  } else if (path == '/download.aspx') {
    console.log("Download.aspx started");
    let file, expiry;
    try {
      file = await decryptString(url.searchParams.get('file'));
      expiry = await decryptString(url.searchParams.get('expiry'));
    } catch (_) {
      return new Response('Invalid Request!', {
        status: 400,
        headers: { "content-type": "text/html;charset=UTF-8" }
      });
    }
    if (Number(expiry) < Date.now()) {
      return new Response('Link Expired!', {
        status: 401,
        headers: { "content-type": "text/html;charset=UTF-8" }
      });
    }
    let integrity_result = false;
    if (authConfig['enable_ip_lock'] && user_ip) {
      const integrity = await genIntegrity(`${file}|${expiry}|${user_ip}`);
      const mac = url.searchParams.get('mac');
      integrity_result = await checkintegrity(mac, integrity);
    } else {
      const integrity = await genIntegrity(`${file}|${expiry}`);
      const mac = url.searchParams.get('mac');
      integrity_result = await checkintegrity(mac, integrity);
    }
    if (integrity_result) {
      const range = request.headers.get('Range');
      const inline = 'true' === url.searchParams.get('inline');
      const fmt = url.searchParams.get('fmt') || null;
      return download(file, range, inline, fmt);
    } else {
      return new Response('Invalid Request!', {
        status: 401,
        headers: {
          "content-type": "text/html;charset=UTF-8",
        },
      });
    }
  }

  if (path == '/copy' && request.method === 'POST') {
    // Copy a file to the user's own Google Drive folder
    // Requires: service account added to source folder, or shared file access
    const formText = await request.text();
    const formdata = new URLSearchParams(formText);
    const encrypted_id = formdata.get('id');
    const root_id = formdata.get('root_id');
    if (!encrypted_id || !root_id) {
      return new Response(JSON.stringify({ error: { message: 'Missing id or root_id' } }), {
        status: 400, headers: { 'Content-Type': 'application/json;charset=UTF-8' }
      });
    }
    let file_id;
    try {
      file_id = await decryptString(encrypted_id);
    } catch (_) {
      return new Response(JSON.stringify({ error: { message: 'Invalid file ID' } }), {
        status: 400, headers: { 'Content-Type': 'application/json;charset=UTF-8' }
      });
    }
    const copyUrl = `https://www.googleapis.com/drive/v3/files/${file_id}/copy?supportsAllDrives=true`;
    const gd0 = gds[0];
    const reqOpts = await gd0.requestOptions({ 'Content-Type': 'application/json' }, 'POST');
    reqOpts.body = JSON.stringify({ parents: [root_id] });
    const copyResp = await fetch(copyUrl, reqOpts);
    const copyData = await copyResp.json();
    return new Response(JSON.stringify(copyData), {
      status: copyResp.ok ? 200 : copyResp.status,
      headers: { 'Content-Type': 'application/json;charset=UTF-8', 'Access-Control-Allow-Origin': authConfig.cors_domain }
    });
  }

  if (authConfig['direct_link_protection']) {
    if (referer == null) {
      return new Response(directlink, {
        headers: {
          'content-type': 'text/html;charset=UTF-8'
        },
        status: 401
      });
    } else if (referer.includes(hostname)) {
      console.log("Refer Detected");
    } else {
      return new Response(directlink, {
        headers: {
          'content-type': 'text/html;charset=UTF-8'
        },
        status: 401
      });
    }
  }


  const command_reg = /^\/(?<num>\d+):(?<command>[a-zA-Z0-9]+)(\/.*)?$/g;
  const match = command_reg.exec(path);
  if (match) {
    const num = match.groups.num;
    const order = Number(num);
    if (order >= 0 && order < gds.length) {
      gd = gds[order];
    } else {
      return redirectToIndexPage();
    }
    //for (const r = gd.basicAuthResponse(request); r;) return r;
    const command = match.groups.command;
    if (command === 'search') {
      if (request.method === 'POST') {
        return handleSearch(request, gd, user_ip);
      } else {
        const params = url.searchParams;
        return new Response(html(gd.order, {
          q: (params.get("q") || '').replace(/'/g, "").replace(/"/g, ""),
          is_search_page: true,
          root_type: gd.root_type
        }), {
          status: 200,
          headers: {
            'Content-Type': 'text/html; charset=utf-8'
          }
        });
      }
    } else if (command === 'id2path' && request.method === 'POST') {
      return handleId2Path(request, gd);
    } else if (command === 'fallback' && request.method === 'POST') {
      const formdata = await request.json();
      let id;
      try {
        id = await decryptString(formdata.id);
      } catch (_) {
        return new Response(JSON.stringify({ error: { message: 'Invalid ID' } }), {
          status: 400, headers: { 'Content-Type': 'application/json;charset=UTF-8' }
        });
      }
      const type = formdata.type;
      if (type && type == 'folder') {
        const page_token = formdata.page_token || null;
        const page_index = formdata.page_index || 0;
        const details = await gd._list_gdrive_files(id, page_token, page_index);
        if (!details || !details.data || !Array.isArray(details.data.files)) {
          return new Response(JSON.stringify({ nextPageToken: null, curPageIndex: 0, data: { files: [] } }), {
            headers: { 'Content-Type': 'application/json;charset=UTF-8' }
          });
        }
        for (const file of details.data.files) {
          if (file.mimeType != 'application/vnd.google-apps.folder') {
            file.link = await generateLink(file.id, user_ip);
          }
          file.driveId = await encryptString(file.driveId || '');
          file.id = await encryptString(file.id);
        }
        return new Response(JSON.stringify(details), {
          headers: { 'Content-Type': 'application/json;charset=UTF-8' }
        });
      }
      const details = await gd.findItemById(id);
      if (!details || !details.id) {
        return new Response(JSON.stringify({ error: { message: 'File not found' } }), {
          status: 404, headers: { 'Content-Type': 'application/json;charset=UTF-8' }
        });
      }
      details.link = await generateLink(details.id, user_ip);
      details.id = formdata.id;
      if (Array.isArray(details.parents) && details.parents.length > 0) {
        details.parents[0] = null;
      }
      return new Response(JSON.stringify(details), {
        headers: { 'Content-Type': 'application/json;charset=UTF-8' }
      });
    } else if (command === 'findpath' && request.method === 'GET') {
      return findId2Path(gd, url);
    } else if (command === 'quota' && request.method === 'GET') {
      const requestOption = await gd.requestOptions();
      const res = await fetch('https://www.googleapis.com/drive/v3/about?fields=storageQuota,user', requestOption);
      if (!res.ok) {
        return new Response(JSON.stringify({ error: 'Failed to fetch quota' }), {
          status: res.status,
          headers: { 'Content-Type': 'application/json;charset=UTF-8' }
        });
      }
      const data = await res.json();
      return new Response(JSON.stringify(data), {
        headers: { 'Content-Type': 'application/json;charset=UTF-8' }
      });
    }
  }



  const common_reg = /^\/\d+:\/.*$/g;
  try {
    if (!path.match(common_reg)) {
      return redirectToIndexPage();
    }
    const split = path.split("/");
    const order = Number(split[1].slice(0, -1));
    if (order >= 0 && order < gds.length) {
      gd = gds[order];
    } else {
      return redirectToIndexPage();
    }
  } catch (e) {
    return redirectToIndexPage();
  }

  //path = path.replace(gd.url_path_prefix, '') || '/';
  if (request.method == 'POST') {
    return apiRequest(request, gd, user_ip);
  }

  const action = url.searchParams.get('a');
  if (path.slice(-1) == '/' || action != null) {
    return new Response(html(gd.order, {
      root_type: gd.root_type
    }), {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8'
      }
    });
  } else {
    /*if (path.split('/').pop().toLowerCase() == ".password") {
      return  new Response("", {
        status: 404
      });
    }*/
    console.log(path);
    const file = await gd.get_single_file(path.replace(gd.url_path_prefix, ''));
    console.log(file);
    const range = request.headers.get('Range');
    const inline = 'true' === url.searchParams.get('inline');
    if (gd.root.protect_file_link && authConfig.enable_login) return login();
    if (!file || !file.id) {
      return new Response(not_found, { status: 404, headers: { 'content-type': 'text/html;charset=UTF-8' } });
    }
    return download(file.id, range, inline);

  }



}
// end handlerequest

function enQuery(data) {
  const ret = [];
  for (const d in data) {
    ret.push(encodeURIComponent(d) + '=' + encodeURIComponent(data[d]));
  }
  return ret.join('&');
}

async function getAccessToken() {
  if (authConfig.expires == undefined || authConfig.expires < Date.now()) {
    const obj = await fetchAccessToken();
    if (obj.access_token != undefined) {
      authConfig.accessToken = obj.access_token;
      authConfig.expires = Date.now() + 3500 * 1000;
    }
  }
  return authConfig.accessToken;
}

async function fetchAccessToken() {
  const url = "https://www.googleapis.com/oauth2/v4/token";
  const headers = {
    'Content-Type': 'application/x-www-form-urlencoded'
  };
  let post_data;
  if (authConfig.service_account && typeof authConfig.service_account_json != "undefined") {
    const jwttoken = await JSONWebToken.generateGCPToken(authConfig.service_account_json);
    post_data = {
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwttoken,
    };
  } else {
    post_data = {
      client_id: authConfig.client_id,
      client_secret: authConfig.client_secret,
      refresh_token: authConfig.refresh_token,
      grant_type: "refresh_token",
    };
  }

  const requestOption = {
    'method': 'POST',
    'headers': headers,
    'body': enQuery(post_data)
  };

  let response;
  for (let i = 0; i < 3; i++) {
    response = await fetch(url, requestOption);
    if (response.ok) {
      break;
    }
    await sleep(800 * (i + 1));
  }
  if (!response.ok) {
    throw new Error(`fetchAccessToken failed with status ${response.status}`);
  }
  return await response.json();
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
async function generateLink(file_id, user_ip) {
  const encrypted_id = await encryptString(file_id);
  const expiry = Date.now() + 1000 * 60 * 60 * 24 * authConfig.file_link_expiry;
  const encrypted_expiry = await encryptString(expiry.toString());
  let url;
  if (authConfig['enable_ip_lock'] && user_ip) {
    const encrypted_ip = await encryptString(user_ip);
    const integrity = await genIntegrity(`${file_id}|${expiry}|${user_ip}`);
    url = `/download.aspx?file=${encodeURIComponent(encrypted_id)}&expiry=${encodeURIComponent(encrypted_expiry)}&ip=${encodeURIComponent(encrypted_ip)}&mac=${encodeURIComponent(integrity)}`;
  } else {
    const integrity = await genIntegrity(`${file_id}|${expiry}`);
    url = `/download.aspx?file=${encodeURIComponent(encrypted_id)}&expiry=${encodeURIComponent(encrypted_expiry)}&mac=${encodeURIComponent(integrity)}`;
  }
  return url;
}

async function apiRequest(request, gd, user_ip) {
  const url = new URL(request.url);
  let path = url.pathname;
  path = path.replace(gd.url_path_prefix, '') || '/';
  console.log("handling apirequest: " + path);
  const option = {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*'
    }
  };

  if (path.slice(-1) == '/') {
    const requestData = await request.json();
    const list_result = await gd.request_list_of_files(
      path,
      requestData.page_token || null,
      Number(requestData.page_index) || 0
    );

    if (authConfig['enable_password_file_verify']) {
      const password = await gd.password(path);
      // console.log("dir password", password);
      if (password && password.replace("\n", "") !== requestData.password) {
        const html = `Y29kZWlzcHJvdGVjdGVk=0Xfi4icvJnclBCZy92dzNXYwJCI6ISZnF2czVWbiwSMwQDI6ISZk92YisHI6IicvJnclJyeYmFzZTY0aXNleGNsdWRlZA==`;
        return new Response(html, option);
      }
    }

    list_result.data.files = await Promise.all(list_result.data.files.map(async (file) => {
      const {
        driveId,
        id,
        mimeType,
        ...fileWithoutId
      } = file;

      const encryptedId = await encryptString(id);
      const encryptedDriveId = await encryptString(driveId);

      let link = null;
      if (mimeType !== 'application/vnd.google-apps.folder') {
        link = await generateLink(id, user_ip);
      }

      return {
        ...fileWithoutId,
        id: encryptedId,
        driveId: encryptedDriveId,
        mimeType: mimeType,
        link: link,
      };
    }));


    const encryptedFiles = list_result;
	const data = JSON.stringify(encryptedFiles);
    return new Response(data, {
		status: 200,
		headers: {
			'Access-Control-Allow-Origin': '*',
			'Content-Type': 'application/json;charset=UTF-8'

		}
	});
  } else {
    const file_json = await gd.get_single_file(path);
    if (!file_json) {
      return new Response(JSON.stringify({ error: 'File not found' }), {
        status: 404,
        headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json;charset=UTF-8' }
      });
    }
    const {
      driveId,
      id,
      ...fileWithoutId
    } = file_json;

    const encryptedId = await encryptString(id);
    const encryptedDriveId = await encryptString(driveId);
    const link = await generateLink(id, user_ip);
    const encryptedFile = {
      ...fileWithoutId,
      id: encryptedId,
      driveId: encryptedDriveId,
      link: link,
    };

    const encryptedFiles = encryptedFile;

	const data = JSON.stringify(encryptedFiles);
    return new Response(data, {
		status: 200,
		headers: {
			'Access-Control-Allow-Origin': '*',
			'Content-Type': 'application/json;charset=UTF-8'

		}
	});
  }
}

// deal with search
async function handleSearch(request, gd, user_ip = '') {
  const option = {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Content-Type': 'application/json;charset=UTF-8'
    }
  };
  const requestData = await request.json();
  const q = requestData.q || '';
  const pageToken = requestData.page_token || null;
  const pageIndex = Number(requestData.page_index) || 0;
  if (q == '') return new Response(JSON.stringify({
    "nextPageToken": null,
    "curPageIndex": 0,
    "data": {
      "files": []
    }
  }), option);
  const searchResult = await gd.searchFilesinDrive(q, pageToken, pageIndex);
  if (!searchResult.data || !searchResult.data.files) {
    return new Response(JSON.stringify({ nextPageToken: null, curPageIndex: 0, data: { files: [] } }), option);
  }
  searchResult.data.files = await Promise.all(searchResult.data.files.map(async (file) => {
    const {
      driveId,
      id,
      ...fileWithoutId
    } = file;

    const encryptedId = await encryptString(id);
    const encryptedDriveId = await encryptString(driveId);
    const link = await generateLink(id, user_ip);
    // rootIdx encoding:
    //  >= 0  file's driveId matches authConfig.roots[rootIdx] — navigate to that root
    //  -1    no driveId (My Drive file) — need parent-chain walk to find folder roots
    //  -2    has driveId but it's NOT in roots — skip id2path, go straight to fallback
    const driveIdx = driveId ? drive_list.indexOf(driveId) : -1;
    const rootIdx = driveId ? (driveIdx >= 0 ? driveIdx : -2) : -1;
    return {
      ...fileWithoutId,
      id: encryptedId,
      driveId: encryptedDriveId,
      rootIdx,
      link: link,
    };
  }));
  return new Response(JSON.stringify(searchResult), option);
}

async function handleId2Path(request, gd) {
  const url = new URL(request.url);
  const option = {
    status: 200,
    headers: {
      "content-type": "application/json",
      "Access-Control-Allow-Origin": authConfig.cors_domain,
      "Access-Control-Allow-Methods": "GET,HEAD,POST,OPTIONS",
    }
  };
  try {
    const data = await request.json();
    const id = await decryptString(data.id);
    const result = await gd.findPathById(id);
    if (!result || !result[0]) {
      return new Response(JSON.stringify({ path: null }), { status: 404, headers: option.headers });
    }
    const [path, prefix] = result;
    const jsonpath = JSON.stringify({ path: '/' + prefix + ':' + path });
    console.log(jsonpath);
    return new Response(jsonpath, option);
  } catch (error) {
    console.log(error);
    const isBadInput = error.name === 'InvalidCharacterError' || error.message?.includes('atob') || error.message?.includes('base64');
    return new Response(JSON.stringify({ message: isBadInput ? 'Invalid encrypted ID' : 'Request Failed or Path Not Found', error: String(error) }), {
      status: isBadInput ? 400 : 500,
      headers: {
        "content-type": "application/json",
        "Access-Control-Allow-Origin": authConfig.cors_domain,
        "Access-Control-Allow-Methods": "GET,HEAD,POST,OPTIONS",
      }
    });
  }
}

async function findId2Path(gd, url) {
  const id = url.searchParams.get('id');
  const view = url.searchParams.get('view') || 'false';
  if (!id) {
    return new Response(JSON.stringify({ error: 'Missing id parameter' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json;charset=UTF-8' }
    });
  }
  // Try the specified drive first
  let found_path = null;
  let found_drive_idx = gd.order;
  try {
    const result = await gd.findPathById(id);
    if (result && result[0]) {
      found_path = result[0];
      found_drive_idx = (result[1] !== undefined) ? result[1] : gd.order;
    }
  } catch (_) {}
  // If not found, try all other configured drives
  if (!found_path) {
    for (let i = 0; i < gds.length; i++) {
      if (gds[i] === gd) continue;
      try {
        const result = await gds[i].findPathById(id);
        if (result && result[0]) {
          found_path = result[0];
          found_drive_idx = (result[1] !== undefined) ? result[1] : i;
          break;
        }
      } catch (_) {}
    }
  }
  if (found_path) {
    const suffix = view === 'true' ? '?a=view' : '';
    return Response.redirect(url.origin + '/' + found_drive_idx + ':' + found_path + suffix, 302);
  }
  // Not in any drive hierarchy — check if accessible via credentials (fallback)
  try {
    const file = await gd.findItemById(id);
    if (file && file.id) {
      const encrypted_id = await encryptString(id);
      return Response.redirect(url.origin + '/fallback?id=' + encodeURIComponent(encrypted_id), 302);
    }
  } catch (_) {}
  return new Response(JSON.stringify({ error: 'File not found' }), {
    status: 404,
    headers: { 'Content-Type': 'application/json;charset=UTF-8' }
  });
}

/*async function findItemById(gd, id) {
  console.log(id)
  const is_user_drive = this.root_type === DriveFixedTerms.gd_root_type.user_drive;
  let url = `https://www.googleapis.com/drive/v3/files/${id}?fields=${DriveFixedTerms.default_file_fields}${is_user_drive ? '' : '&supportsAllDrives=true'}`;
  let requestOption = await gd.requestOptions();
  let res = await fetch(url, requestOption);
  return await res.json();
}*/

// start of class googleDrive
class googleDrive {
  constructor(authConfig, order) {
    this.order = order;
    this.root = authConfig.roots[order];
    this.root.protect_file_link = this.root.protect_file_link || false;
    this.url_path_prefix = `/${order}:`;
    this.authConfig = authConfig;
    this.paths = [];
    this.files = [];
    this.passwords = [];
    this.paths["/"] = this.root['id'];
  }
  async init() {
    await getAccessToken();
    if (authConfig.user_drive_real_root_id) return;
    const root_obj = await (gds[0] || this).findItemById('root');
    if (root_obj && root_obj.id) {
      authConfig.user_drive_real_root_id = root_obj.id;
    }
  }

  async initRootType() {
    const root_id = this.root['id'];
    const types = DriveFixedTerms.gd_root_type;
    const explicit_type = this.root.type;
    if (explicit_type === 'shared_drive') {
      this.root_type = types.share_drive;
      return;
    }
    if (explicit_type === 'root' || explicit_type === 'folder') {
      this.root_type = types.user_drive;
      return;
    }
    // fallback: auto-detect (legacy configs without explicit type)
    if (root_id === 'root' || root_id === authConfig.user_drive_real_root_id) {
      this.root_type = types.user_drive;
    } else {
      this.root_type = types.share_drive;
    }
  }


  async get_single_file(path) {
    if (typeof this.files[path] == 'undefined') {
      this.files[path] = await this.get_single_file_api(path);
    }
    return this.files[path];
  }

  async get_single_file_api(path) {
    const arr = path.split('/');
    let name = arr.pop();
    name = decodeURIComponent(name).replace(/\'/g, "\\'");
    const dir = arr.join('/') + '/';
    console.log("try " + name, dir);
    const parent = await this.findPathId(dir);
    console.log("try " + parent);
    let url = 'https://www.googleapis.com/drive/v3/files';
    const params = {
      'includeItemsFromAllDrives': true,
      'supportsAllDrives': true
    };
    params.q = `'${parent}' in parents and name = '${name}' and trashed = false and mimeType != 'application/vnd.google-apps.shortcut'`;
    params.fields = "files(id, name, mimeType, size ,createdTime, modifiedTime, iconLink, thumbnailLink, driveId, fileExtension)";
    url += '?' + enQuery(params);
    const requestOption = await this.requestOptions();
    let response;
    for (let i = 0; i < 3; i++) {
      response = await fetch(url, requestOption);
      if (response.ok) {
        break;
      }
      await sleep(800 * (i + 1));
    }
    if (!response.ok) return undefined;
    const obj = await response.json();
    // console.log(obj);
    return obj.files && obj.files[0];
  }

  async request_list_of_files(path, page_token = null, page_index = 0) {
    if (this.path_children_cache == undefined) {
      // { <path> :[ {nextPageToken:'',data:{}}, {nextPageToken:'',data:{}} ...], ...}
      this.path_children_cache = {};
    }

    if (this.path_children_cache[path] &&
      this.path_children_cache[path][page_index] &&
      this.path_children_cache[path][page_index].data
    ) {
      const child_obj = this.path_children_cache[path][page_index];
      return {
        nextPageToken: child_obj.nextPageToken || null,
        curPageIndex: page_index,
        data: child_obj.data
      };
    }

    const id = await this.findPathId(path);
    const result = await this._list_gdrive_files(id, page_token, page_index);
    const data = result.data;
    if (result.nextPageToken && data.files) {
      if (!Array.isArray(this.path_children_cache[path])) {
        this.path_children_cache[path] = [];
      }
      this.path_children_cache[path][Number(result.curPageIndex)] = {
        nextPageToken: result.nextPageToken,
        data: data
      };
    }

    return result;
  }

  // listing files usign google drive api
  async _list_gdrive_files(parent, page_token = null, page_index = 0) {

    if (parent == undefined || parent == null) {
      return { nextPageToken: null, curPageIndex: page_index, data: { files: [] } };
    }
    let obj;
    const params = {
      'includeItemsFromAllDrives': true,
      'supportsAllDrives': true
    };
    params.q = `'${parent}' in parents and trashed = false AND name !='.password' and mimeType != 'application/vnd.google-apps.shortcut' and mimeType != 'application/vnd.google-apps.form' and mimeType != 'application/vnd.google-apps.site'`;
    params.orderBy = 'folder, name, modifiedTime desc';
    params.fields = "nextPageToken, files(id, name, mimeType, size, modifiedTime, driveId, kind, fileExtension)";
    params.pageSize = this.authConfig.files_list_page_size;

    if (page_token) {
      params.pageToken = page_token;
    }
    let url = 'https://www.googleapis.com/drive/v3/files';
    url += '?' + enQuery(params);
    const requestOption = await this.requestOptions();
    let response;
    for (let i = 0; i < 3; i++) {
      response = await fetch(url, requestOption);
      if (response.ok) {
        break;
      }
      await sleep(800 * (i + 1));
    }
    obj = await response.json();
    if (!obj.files) obj.files = [];

    return {
      nextPageToken: obj.nextPageToken || null,
      curPageIndex: page_index,
      data: obj
    };
  }

  async password(path) {
    if (this.passwords[path] !== undefined) {
      return this.passwords[path];
    }

    const file = await this.get_single_file(path + '.password');
    if (file == undefined) {
      this.passwords[path] = null;
    } else {
      const url = `https://www.googleapis.com/drive/v3/files/${file.id}?alt=media`;
      const requestOption = await this.requestOptions();
      const response = await this.fetch200(url, requestOption);
      this.passwords[path] = await response.text();
    }

    return this.passwords[path];
  }

  async searchFilesinDrive(origin_keyword, page_token = null, page_index = 0) {
    const types = DriveFixedTerms.gd_root_type;
    const is_user_drive = this.root_type === types.user_drive;
    const is_share_drive = this.root_type === types.share_drive;
    const empty_result = {
      nextPageToken: null,
      curPageIndex: page_index,
      data: null
    };

    if (!is_user_drive && !is_share_drive) {
      return empty_result;
    }
    const keyword = SearchFunction.formatSearchKeyword(origin_keyword);
    if (!keyword) {
      return empty_result;
    }
    const words = keyword.split(/\s+/);
    const name_search_str = `name contains '${words.join("' AND name contains '")}'`;
    const params = {};
    if (is_user_drive) {
      if (authConfig.search_all_drives) {
        params.corpora = 'allDrives';
        params.includeItemsFromAllDrives = true;
        params.supportsAllDrives = true;
      } else {
        params.corpora = 'user';
      }
    }
    if (is_share_drive) {
      if (authConfig.search_all_drives) {
        params.corpora = 'allDrives';
      } else {
        params.corpora = 'drive';
        params.driveId = this.root.id;
      }
      params.includeItemsFromAllDrives = true;
      params.supportsAllDrives = true;
    }
    if (page_token) {
      params.pageToken = page_token;
    }
    params.q = `trashed = false AND mimeType != 'application/vnd.google-apps.shortcut' and mimeType != 'application/vnd.google-apps.form' and mimeType != 'application/vnd.google-apps.site' AND name !='.password' AND (${name_search_str})`;
    params.fields = "nextPageToken, files(id, driveId, name, mimeType, size , modifiedTime)";
    params.pageSize = this.authConfig.search_result_list_page_size;
    params.orderBy = 'folder, name, modifiedTime desc';

    let url = 'https://www.googleapis.com/drive/v3/files';
    url += '?' + enQuery(params);
    const requestOption = await this.requestOptions();
    let response;
    for (let i = 0; i < 3; i++) {
      response = await fetch(url, requestOption);
      if (response.ok) {
        break;
      }
      await sleep(800 * (i + 1));
    }
    if (!response.ok) {
      return { nextPageToken: null, curPageIndex: page_index, data: { files: [] } };
    }
    const res_obj = await response.json();

    return {
      nextPageToken: res_obj.nextPageToken || null,
      curPageIndex: page_index,
      data: res_obj
    };
  }

  async findParentFilesRecursion(child_id, drive_index_no, contain_myself = true) {
    const gd = this;
    const gd_root_id = gd.root.id;
    const user_drive_real_root_id = authConfig.user_drive_real_root_id;
    const is_user_drive = gd.root_type === DriveFixedTerms.gd_root_type.user_drive;
    const target_top_id = is_user_drive ? user_drive_real_root_id : gd_root_id;
    const fields = DriveFixedTerms.default_file_fields;
    const parent_files = [];
    let meet_top = false;
    async function addItsFirstParent(file_obj) {
      if (!file_obj) return;
      if (!file_obj.parents) return null;
      if (file_obj.parents.length < 1) return;
      const p_ids = file_obj.parents;
      if (p_ids && p_ids.length > 0) {
        const first_p_id = p_ids[0];
        console.log(first_p_id);
        if (drive_list.includes(first_p_id) || first_p_id === target_top_id) {
          meet_top = true;
          drive_index_no = first_p_id === target_top_id ? gd.order : drive_list.indexOf(first_p_id);
          return drive_index_no;
        }
        const p_file_obj = await gd.findItemById(first_p_id);
        if (p_file_obj && p_file_obj.id) {
          parent_files.push(p_file_obj);
          await addItsFirstParent(p_file_obj);
        }
      }
      return drive_index_no;
    }

    const child_obj = await gd.findItemById(child_id);
    if (contain_myself) {
      parent_files.push(child_obj);
    }
    const drive_id = await addItsFirstParent(child_obj);
    console.log("parents -- " + JSON.stringify(parent_files));
    return meet_top ? [parent_files, drive_index_no] : null;
  }

  async findPathById(child_id) {
    let p_files;
    let drive_index_no = 0;
    try {
      [p_files, drive_index_no] = await this.findParentFilesRecursion(child_id);
    } catch (error) {
      return null;
    }

    if (!p_files || p_files.length < 1) return '';

    const cache = [];
    // Cache the path and id of each level found
    p_files.forEach((value, idx) => {
      const is_folder = idx === 0 ? (p_files[idx].mimeType === DriveFixedTerms.folder_mime_type) : true;
      let path = '/' + p_files.slice(idx).map(it => encodeURIComponent(it.name)).reverse().join('/');
      if (is_folder) path += '/';
      cache.push({
        id: p_files[idx].id,
        path: path
      });
    });
    return [cache[0].path, drive_index_no];
  }

  async findItemById(id) {
    const url = `https://www.googleapis.com/drive/v3/files/${id}?fields=${DriveFixedTerms.default_file_fields}&supportsAllDrives=true`;
    const requestOption = await this.requestOptions();
    const res = await fetch(url, requestOption);
    if (!res.ok) return null;
    return await res.json();
  }

  async findPathId(path) {
    let c_path = '/';
    let c_id = this.paths[c_path];

    const arr = path.replace(/^\/+|\/+$/g, '').split('/');
    for (const name of arr) {
      c_path += name + '/';

      if (typeof this.paths[c_path] == 'undefined') {
        const id = await this._findDirId(c_id, name);
        this.paths[c_path] = id;
      }

      c_id = this.paths[c_path];
      if (c_id == undefined || c_id == null) {
        break;
      }
    }
    console.log('findPathId: ', path, c_id);
    return this.paths[path];
  }

  async _findDirId(parent, name) {
    name = decodeURIComponent(name).replace(/\'/g, "\\'");
    if (parent == undefined) {
      return null;
    }

    let url = 'https://www.googleapis.com/drive/v3/files';
    const params = {
      'includeItemsFromAllDrives': true,
      'supportsAllDrives': true
    };
    params.q = `'${parent}' in parents and mimeType = 'application/vnd.google-apps.folder' and name = '${name}'  and trashed = false`;
    params.fields = "nextPageToken, files(id, name, mimeType)";
    url += '?' + enQuery(params);
    const requestOption = await this.requestOptions();
    let response;
    for (let i = 0; i < 3; i++) {
      response = await fetch(url, requestOption);
      if (response.ok) {
        break;
      }
      await sleep(800 * (i + 1));
    }
    if (!response.ok) return null;
    const obj = await response.json();
    if (!obj.files || obj.files[0] == undefined) {
      return null;
    }
    return obj.files[0].id;
  }

  /*async getAccessToken() {
    console.log("accessToken");
    if (this.authConfig.expires == undefined || this.authConfig.expires < Date.now()) {
      const obj = await fetchAccessToken();
      if (obj.access_token != undefined) {
        this.authConfig.accessToken = obj.access_token;
        this.authConfig.expires = Date.now() + 3500 * 1000;
      }
    }
    return this.authConfig.accessToken;
  }*/

  /*async fetchAccessToken() {
    console.log("fetchAccessToken");
    const url = "https://www.googleapis.com/oauth2/v4/token";
    const headers = {
      'Content-Type': 'application/x-www-form-urlencoded'
    };
    var post_data;
    if (this.authConfig.service_account && typeof this.authConfig.service_account_json != "undefined") {
      const jwttoken = await JSONWebToken.generateGCPToken(this.authConfig.service_account_json);
      post_data = {
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion: jwttoken,
      };
    } else {
      post_data = {
        client_id: this.authConfig.client_id,
        client_secret: this.authConfig.client_secret,
        refresh_token: this.authConfig.refresh_token,
        grant_type: "refresh_token",
      };
    }

    let requestOption = {
      'method': 'POST',
      'headers': headers,
      'body': enQuery(post_data)
    };

    let response;
    for (let i = 0; i < 3; i++) {
      response = await fetch(url, requestOption);
      if (response.ok) {
        break;
      }
      await sleep(800 * (i + 1));
    }
    return await response.json();
  }*/

  async fetch200(url, requestOption) {
    let response;
    for (let i = 0; i < 3; i++) {
      response = await fetch(url, requestOption);
      if (response.ok) {
        break;
      }
      await sleep(800 * (i + 1));
    }
    return response;
  }

  async requestOptions(headers = {}, method = 'GET') {
    const Token = await this._getAccessToken();
    headers['authorization'] = 'Bearer ' + Token;
    return {
      'method': method,
      'headers': headers
    };
  }

  // Returns an access token: per-drive creds if configured, else global
  async _getAccessToken() {
    const c = this.root.client_id && this.root.client_secret && this.root.refresh_token
      ? this.root
      : (this.root.service_account && this.root.service_account_json ? this.root : null);
    if (!c) return getAccessToken();
    // Per-drive token cache stored on the instance
    if (this._token_expiry && this._token_expiry > Date.now()) return this._access_token;
    const url = 'https://www.googleapis.com/oauth2/v4/token';
    const headers = { 'Content-Type': 'application/x-www-form-urlencoded' };
    let post_data;
    if (c.service_account && c.service_account_json) {
      const jwttoken = await JSONWebToken.generateGCPToken(c.service_account_json);
      post_data = { grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: jwttoken };
    } else {
      post_data = { client_id: c.client_id, client_secret: c.client_secret, refresh_token: c.refresh_token, grant_type: 'refresh_token' };
    }
    let response;
    for (let i = 0; i < 3; i++) {
      response = await fetch(url, { method: 'POST', headers, body: enQuery(post_data) });
      if (response.ok) break;
      await sleep(800 * (i + 1));
    }
    if (!response.ok) {
      throw new Error(`Per-drive token fetch failed with status ${response.status}`);
    }
    const obj = await response.json();
    if (!obj.access_token) {
      throw new Error('Per-drive token response missing access_token');
    }
    this._access_token = obj.access_token;
    this._token_expiry = Date.now() + 3500 * 1000;
    return this._access_token;
  }


  /*sleep(ms) {
    return new Promise(function(resolve, reject) {
      let i = 0;
      setTimeout(function() {
        console.log('sleep' + ms);
        i++;
        if (i >= 2) reject(new Error('i>=2'));
        else resolve(i);
      }, ms);
    })
  }*/
}
// end of class googleDrive
const drive = new googleDrive(authConfig, 0);
async function download(id, range = '', inline, exportFmt = null) {
  // Short-circuit: if this is the primary domain and downloads go through a secondary domain,
  // serve the "downloads disabled" page immediately — no Google API call needed.
  if (uiConfig.second_domain_for_dl === true) {
    let res = await fetch(cdn_base + '/assets/disable_download.html');
    return new Response(await res.text(), {
      headers: { "content-type": "text/html;charset=UTF-8" },
    });
  }
  const requestOption = await drive.requestOptions();
  const file = await drive.findItemById(id);
  if (!file || !file.name) {
    return new Response(`{"error":"Unable to Find this File, Try Again."}`, {
      status: 404,
      headers: {
        "content-type": "application/json",
        "Access-Control-Allow-Origin": authConfig.cors_domain,
      }
    });
  }
  // Handle Google Workspace files via the export API
  const exportEntry = GDOC_EXPORT_FORMATS[file.mimeType];
  if (exportEntry) {
    const targetFmt = exportFmt
      ? exportEntry.formats.find(f => f.ext === exportFmt) || exportEntry.formats[0]
      : exportEntry.formats[0];
    const exportUrl = `https://www.googleapis.com/drive/v3/files/${id}/export?mimeType=${encodeURIComponent(targetFmt.mime)}`;
    const res = await fetch(exportUrl, requestOption);
    if (!res.ok) {
      const details = await res.text();
      return new Response(details, { status: res.status, headers: { "content-type": "text/plain;charset=UTF-8" } });
    }
    const exportRes = new Response(res.body, res);
    const exportName = `${file.name}.${targetFmt.ext}`;
    exportRes.headers.set("Content-Disposition", inline ? 'inline' : `attachment; filename*=UTF-8''${encodeURIComponent(exportName)}`);
    exportRes.headers.set("Content-Type", targetFmt.mime);
    authConfig.enable_cors_file_down && exportRes.headers.append('Access-Control-Allow-Origin', '*');
    return exportRes;
  }
  const url = `https://www.googleapis.com/drive/v3/files/${id}?alt=media`;
  if (range) requestOption.headers['Range'] = range;
  let res;
  for (let i = 0; i < 3; i++) {
    res = await fetch(url, requestOption);
    if (res.ok) {
      break;
    }
    await sleep(800 * (i + 1));
  }
  if (res.ok) {
    const {
      headers
    } = res = new Response(res.body, res);
    headers.set("Content-Disposition", `attachment; filename*=UTF-8''${encodeURIComponent(file.name)}`);
    headers.set("Content-Length", file.size);
    authConfig.enable_cors_file_down && headers.append('Access-Control-Allow-Origin', '*');
    inline === true && headers.set('Content-Disposition', 'inline');
    return res;
  } else if (res.status == 404) {
    return new Response(not_found, {
      status: 404,
      headers: {
        "content-type": "text/html;charset=UTF-8",
      },
    });
  } else if (res.status == 403) {
    const details = await res.text();
    return new Response(details, {
      status: 403,
      headers: {
        "content-type": "text/html;charset=UTF-8",
      },
    });
  } else {
    const details = await res.text();
    return new Response(details, {
      status: res.status,
      headers: { "content-type": "text/plain;charset=UTF-8" }
    });
  }
}


function trimChar(str, char) {
  if (char) {
    return str.replace(new RegExp('^\\' + char + '+|\\' + char + '+$', 'g'), '');
  }
  return str.trim();
}


function decodeJwtToken(token) {
  const base64Url = token.split('.')[1];
  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
    return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
  }).join(''));

  return JSON.parse(jsonPayload);
}

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request, event).catch(
    (err) => { console.error(err.stack); return new Response('Internal Server Error', { status: 500 }); }
  )
  );
});