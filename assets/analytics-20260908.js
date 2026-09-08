(() => {
  'use strict';
  const ID = 'G-CQW2FCB8H5', KEY = 'cenessod-analytics-v1';
  const production = location.hostname === 'cenessod.com' || location.hostname === 'www.cenessod.com';
  let enabled = false, loaded = false, opener;
  function readChoice() {
    try { const v = JSON.parse(localStorage.getItem(KEY)); return v && Date.now() - v.at < 180 * 86400000 ? v.choice : null; } catch { return null; }
  }
  function cleanURL(raw) {
    try { const u = new URL(raw); return u.origin + u.pathname; } catch { return ''; }
  }
  function start() {
    enabled = true;
    window['ga-disable-' + ID] = false;
    if (loaded || !production) return;
    loaded = true;
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    gtag('consent', 'default', { analytics_storage: 'denied', ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied' });
    gtag('consent', 'update', { analytics_storage: 'granted' });
    gtag('js', new Date());
    const config = { allow_google_signals: false, allow_ad_personalization_signals: false, cookie_expires: 15552000, page_location: cleanURL(location.href), page_referrer: cleanURL(document.referrer) };
    const params = new URLSearchParams(location.search);
    ['source', 'medium', 'campaign', 'term', 'content'].forEach(k => {
      const value = params.get('utm_' + k);
      if (value && value.length < 120 && !value.includes('@')) config[k === 'campaign' ? 'campaign_name' : 'campaign_' + k] = value;
    });
    gtag('config', ID, config);
    const tag = document.createElement('script'); tag.async = true;
    tag.src = 'https://www.googletagmanager.com/gtag/js?id=' + ID;
    document.head.append(tag);
  }
  function stop() {
    enabled = false;
    window['ga-disable-' + ID] = true;
    document.cookie.split(';').forEach(item => {
      const name = item.trim().split('=')[0];
      if (name !== '_ga' && !name.startsWith('_ga_')) return;
      ['', location.hostname, '.' + location.hostname, '.cenessod.com'].forEach(domain => {
        document.cookie = name + '=; Max-Age=0; path=/' + (domain ? '; domain=' + domain : '') + '; SameSite=Lax';
      });
    });
  }
  const panel = document.createElement('section');
  panel.className = 'analytics-choice'; panel.hidden = true;
  panel.setAttribute('aria-label', 'Preferencias de analítica');
  panel.innerHTML = '<div><strong>¿Nos ayudas a mejorar el sitio?</strong><p>Con tu permiso, usamos Google Analytics para medir visitas y clics. Puedes rechazarlo y seguir navegando. <a href="/aviso-de-privacidad/#cookies">Más información</a>.</p></div><div class="analytics-actions"><button type="button" data-choice="denied">Rechazar analítica</button><button type="button" data-choice="granted">Aceptar analítica</button></div>';
  document.body.append(panel);
  const settings = document.createElement('button'); settings.type = 'button'; settings.className = 'analytics-settings'; settings.textContent = 'Preferencias de analítica';
  (document.querySelector('footer') || document.body).append(settings);
  settings.addEventListener('click', () => { opener = settings; panel.hidden = false; panel.querySelector('button').focus(); });
  panel.addEventListener('click', e => {
    const button = e.target.closest('[data-choice]'); if (!button) return;
    const choice = button.dataset.choice;
    try { localStorage.setItem(KEY, JSON.stringify({ choice, at: Date.now() })); } catch { /* Consent still applies to this page. */ }
    panel.hidden = true;
    if (choice === 'granted') start(); else stop();
    (opener || settings).focus();
  });
  window.addEventListener('storage', e => {
    if (e.key !== KEY) return;
    const choice = readChoice();
    if (choice === 'granted') start(); else stop();
    panel.hidden = choice !== null;
  });
  document.addEventListener('click', e => {
    if (!enabled || !production || !window.gtag) return;
    const a = e.target.closest('a[href]'); if (!a) return;
    const href = a.getAttribute('href');
    let method = href.startsWith('mailto:') ? 'email' : href.startsWith('tel:') ? 'phone' : null;
    if (method) gtag('event', 'contact_click', { contact_method: method });
    else if (new URL(href, location.href).hash === '#contacto') gtag('event', 'request_form_click', { page_path: location.pathname });
  });
  const choice = readChoice();
  if (choice === 'granted') start(); else { stop(); panel.hidden = choice === 'denied'; }
})();
