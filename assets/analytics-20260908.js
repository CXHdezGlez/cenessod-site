(() => {
  'use strict';
  const ID = 'G-CQW2FCB8H5', KEY = 'cenessod-consent-v2';
  const production = location.hostname === 'cenessod.com' || location.hostname === 'www.cenessod.com';
  let enabled = false, loaded = false, advertising = false, opener;
  function readChoice() {
    try { const v = JSON.parse((localStorage.getItem(KEY) || localStorage.getItem('cenessod-analytics-v1'))); return v && ['denied', 'granted', 'measurement'].includes(v.choice) && Date.now() - v.at < 180 * 86400000 ? v.choice : null; } catch { return null; }
  }
  function cleanURL(raw, includeAds = false) {
    try { const u = new URL(raw); const clean = new URL(u.origin + u.pathname); if (includeAds) ['gclid', 'wbraid', 'gbraid'].forEach(k => { const value = u.searchParams.get(k); if (value && /^[A-Za-z0-9_-]{1,512}$/.test(value)) clean.searchParams.set(k, value); }); return clean.href; } catch { return ''; }
  }
  function start(choice) {
    advertising = choice === 'measurement';
    enabled = true;
    window['ga-disable-' + ID] = false;
    if (!production) return;
    const firstLoad = !loaded;
    loaded = true;
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    if (firstLoad) gtag('consent', 'default', { analytics_storage: 'denied', ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied' });
    gtag('set', 'ads_data_redaction', !advertising);
    gtag('consent', 'update', { analytics_storage: 'granted', ad_storage: advertising ? 'granted' : 'denied', ad_user_data: advertising ? 'granted' : 'denied', ad_personalization: 'denied' });
    if (!advertising) clearCookies(true);
    if (firstLoad) gtag('js', new Date());
    const config = { allow_google_signals: false, allow_ad_personalization_signals: false, cookie_expires: 15552000, send_page_view: firstLoad, page_location: cleanURL(location.href, advertising), page_referrer: cleanURL(document.referrer) };
    const params = new URLSearchParams(location.search);
    ['source', 'medium', 'campaign', 'term', 'content'].forEach(k => {
      const value = params.get('utm_' + k);
      if (value && value.length < 120 && !value.includes('@')) config[k === 'campaign' ? 'campaign_name' : 'campaign_' + k] = value;
    });
    gtag('config', ID, config);
    if (!firstLoad) return;
    const tag = document.createElement('script'); tag.async = true;
    tag.src = 'https://www.googletagmanager.com/gtag/js?id=' + ID;
    document.head.append(tag);
  }
  function stop() {
    enabled = false;
    window['ga-disable-' + ID] = true;
    advertising = false;
    if (loaded && window.gtag) {
      gtag('set', 'ads_data_redaction', true);
      gtag('consent', 'update', { analytics_storage: 'denied', ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied' });
    }
    clearCookies(false);
  }
  function clearCookies(adsOnly) {
    document.cookie.split(';').forEach(item => {
      const name = item.trim().split('=')[0];
      if (!name.startsWith('_gcl_') && (adsOnly || (name !== '_ga' && !name.startsWith('_ga_')))) return;
      ['', location.hostname, '.' + location.hostname, '.cenessod.com'].forEach(domain => {
        document.cookie = name + '=; Max-Age=0; path=/' + (domain ? '; domain=' + domain : '') + '; SameSite=Lax';
      });
    });
  }
  const panel = document.createElement('section');
  panel.className = 'analytics-choice'; panel.hidden = true;
  panel.setAttribute('aria-label', 'Preferencias de medición');
  panel.innerHTML = '<div><strong>¿Nos ayudas a mejorar el sitio?</strong><p>Con tu permiso, usamos Google Analytics para medir visitas, clics y envíos del formulario. Puedes permitir solo analítica o añadir medición publicitaria para saber qué anuncios generan solicitudes. Esta última opción permite a Google usar cookies e identificadores publicitarios para atribuir resultados, sin personalizar anuncios. Puedes rechazar ambas opciones y seguir navegando. <a href="/aviso-de-privacidad/#cookies">Más información</a>.</p></div><div class="analytics-actions"><button type="button" data-choice="denied">Rechazar todo</button><button type="button" data-choice="granted">Solo analítica</button><button type="button" data-choice="measurement">Analítica y medición publicitaria</button></div>';
  document.body.append(panel);
  const settings = document.createElement('button'); settings.type = 'button'; settings.className = 'analytics-settings'; settings.textContent = 'Preferencias de medición';
  (document.querySelector('footer') || document.body).append(settings);
  settings.addEventListener('click', () => { opener = settings; panel.hidden = false; panel.querySelector('button').focus(); });
  panel.addEventListener('click', e => {
    const button = e.target.closest('[data-choice]'); if (!button) return;
    const choice = button.dataset.choice;
    try { localStorage.setItem(KEY, JSON.stringify({ choice, at: Date.now() })); } catch { /* Consent still applies to this page. */ }
    panel.hidden = true;
    if (choice === 'granted' || choice === 'measurement') start(choice); else stop();
    (opener || settings).focus();
  });
  window.addEventListener('storage', e => {
    if (e.key !== KEY) return;
    const choice = readChoice();
    if (choice === 'granted' || choice === 'measurement') start(choice); else stop();
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
  // Only the official Typeform successful-submit callback invokes this hook.
  const submitted = new Set();
  window.cenessodTypeformSubmitted = payload => {
    if (!payload || payload.formId !== 'ArixNAIn' || typeof payload.responseId !== 'string' || !payload.responseId) return;
    const id = payload.responseId;
    if (submitted.has(id)) return;
    submitted.add(id);
    // Never replay a submission made without analytics consent.
    if (!enabled || !production || !window.gtag) return;
    gtag('event', 'generate_lead', { send_to: ID, form_id: 'ArixNAIn', lead_source: 'website_typeform' });
  };
  const choice = readChoice();
  if (choice === 'granted' || choice === 'measurement') start(choice); else { stop(); panel.hidden = choice === 'denied'; }
})();
