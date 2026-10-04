(() => {
  'use strict';
  const form = document.getElementById('form-lead-magnet');
  if (!form) return;
  const email = document.getElementById('lm-email');
  const consent = document.getElementById('lm-consent');
  const button = form.querySelector('button[type="submit"]');
  const error = document.getElementById('lm-error');
  const success = document.getElementById('lm-success');
  const download = document.getElementById('lm-download');
  const trap = document.getElementById('lm-website');
  // Igual que en firestore.rules: dominios de correo personal o desechable que no se aceptan.
  const PERSONAL_EMAIL = /^[^@]+@(gmail\.com|googlemail\.com|hotmail\.[a-z.]+|outlook\.[a-z.]+|live\.[a-z.]+|msn\.com|windowslive\.com|yahoo\.[a-z.]+|ymail\.com|rocketmail\.com|icloud\.com|me\.com|mac\.com|aol\.com|aim\.com|protonmail\.(com|ch)|proton\.me|pm\.me|gmx\.[a-z.]+|mail\.com|email\.com|zoho\.com|zohomail\.com|yandex\.[a-z.]+|ya\.ru|mail\.ru|tutanota\.com|tutamail\.com|tuta\.io|hey\.com|fastmail\.com|prodigy\.net\.mx|qq\.com|163\.com|126\.com|mailinator\.com|guerrillamail\.[a-z.]+|sharklasers\.com|10minutemail\.[a-z.]+|temp-mail\.[a-z.]+|tempmail\.[a-z.]+|yopmail\.[a-z.]+)$/i;
  const PERSONAL_MSG = 'Usa tu correo institucional o corporativo. No aceptamos correos personales como Gmail, Outlook, Hotmail, Yahoo o iCloud.';
  // Igual que en firestore.rules: solo caracteres habituales de un correo, sin punto final ni símbolos al inicio.
  const VALID_EMAIL = /^[A-Za-z0-9][A-Za-z0-9._%+-]*@[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)+$/;
  const INVALID_MSG = 'Escribe un correo válido, por ejemplo nombre@institucion.gob.mx.';
  const checkDomain = () => {
    const value = email.value.trim();
    email.setCustomValidity(!VALID_EMAIL.test(value) ? INVALID_MSG : PERSONAL_EMAIL.test(value) ? PERSONAL_MSG : '');
  };
  if (email.addEventListener) email.addEventListener('input', checkDomain);
  const buttonLabel = button.innerHTML;
  // Antibots: un humano tarda más de unos segundos en escribir su correo y marcar el consentimiento.
  const MIN_FILL_MS = 3000;
  const startedAt = Date.now();
  const apiKey = 'AIzaSyBwu6T3ILFnk1ZfqehoGOjg0yp7Tw4tE_8';
  const database = 'projects/cenessod-9fa05/databases/(default)';
  const endpoint = `https://firestore.googleapis.com/v1/${database}/documents:commit?key=${apiKey}`;
  // Firebase App Check con Fraud Defense (reCAPTCHA Enterprise): Firestore solo acepta escrituras que traen un token válido
  // (cuando App Check está en modo "Aplicar"). La clave de sitio es pública.
  const APP_CHECK = {
    sdk: 'https://www.gstatic.com/firebasejs/12.19.0',
    siteKey: '6Ld2y90tAAAAAP_ZjgM49yvqVLDgQ7on_VdIDRxd',
    appId: '1:102125314463:web:a10a03f91dbae374131daa'
  };
  const TOKEN_TIMEOUT_MS = 8000;
  let appCheckReady = null;
  let submitting = false;

  // Carga el SDK y reCAPTCHA solo cuando la persona interactúa con el formulario.
  function initAppCheck() {
    if (!appCheckReady) {
      appCheckReady = Promise.all([
        import(`${APP_CHECK.sdk}/firebase-app.js`),
        import(`${APP_CHECK.sdk}/firebase-app-check.js`)
      ]).then(([{ initializeApp }, { initializeAppCheck, ReCaptchaEnterpriseProvider, getToken }]) => {
        const app = initializeApp({ apiKey, projectId: 'cenessod-9fa05', appId: APP_CHECK.appId }, 'manual-registro');
        const appCheck = initializeAppCheck(app, {
          provider: new ReCaptchaEnterpriseProvider(APP_CHECK.siteKey),
          // Sin renovación automática: el token se pide solo al enviar el formulario.
          isTokenAutoRefreshEnabled: false
        });
        return () => getToken(appCheck, false).then(result => result.token);
      }).catch(err => {
        // Si el SDK no cargó, el siguiente intento vuelve a cargarlo sin recargar la página.
        appCheckReady = null;
        throw err;
      });
      appCheckReady.catch(() => {});
    }
    return appCheckReady;
  }

  // Si no se obtiene el token se envía sin él: antes de "Aplicar" el registro se guarda igual;
  // después, Firestore lo rechaza y se muestra el mensaje de error.
  // Con un tiempo máximo, para que el botón no se quede bloqueado si el SDK o reCAPTCHA no responden.
  async function appCheckToken() {
    let timer;
    const timeLimit = new Promise(resolve => { timer = setTimeout(() => resolve(null), TOKEN_TIMEOUT_MS); });
    const attempt = (async () => {
      try {
        const fetchToken = await initAppCheck();
        return await fetchToken();
      } catch {
        return null;
      }
    })();
    try {
      return await Promise.race([attempt, timeLimit]);
    } finally {
      clearTimeout(timer);
    }
  }

  form.addEventListener('focusin', initAppCheck, { once: true });

  function showSuccess() {
    form.hidden = true;
    form.style.display = 'none';
    success.hidden = false;
    success.focus();
    download.href = 'assets/manual-metodologico-cenessod-2026.pdf?v=20260913';
    download.click();
  }

  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (submitting) return;
    email.value = email.value.trim();
    checkDomain();
    if (!form.checkValidity() || !consent.checked) {
      form.reportValidity();
      return;
    }
    error.hidden = true;
    // Honeypot o envío demasiado rápido: se muestra el éxito sin guardar el registro.
    if ((trap && trap.value) || Date.now() - startedAt < MIN_FILL_MS) {
      showSuccess();
      return;
    }
    submitting = true;
    button.disabled = true;
    button.textContent = 'Guardando registro…';
    form.setAttribute('aria-busy', 'true');
    const controller = new AbortController();
    let timeout;
    try {
      const name = `${database}/documents/manual_registros/${crypto.randomUUID()}`;
      const headers = { 'Content-Type': 'application/json' };
      const token = await appCheckToken();
      if (token) headers['X-Firebase-AppCheck'] = token;
      timeout = setTimeout(() => controller.abort(), 15000);
      const response = await fetch(endpoint, {
        method: 'POST',
        headers,
        credentials: 'omit',
        signal: controller.signal,
        body: JSON.stringify({ writes: [{
          update: { name, fields: {
            email: { stringValue: email.value },
            consentimiento: { booleanValue: true },
            consentimientoVersion: { stringValue: 'manual-publicaciones-v1' },
            recurso: { stringValue: 'manual-metodologico-2026' },
            origen: { stringValue: 'cenessod.com' }
          } },
          updateTransforms: [{ fieldPath: 'createdAt', setToServerValue: 'REQUEST_TIME' }],
          currentDocument: { exists: false }
        }] })
      });
      if (!response.ok) throw new Error('Registration was not confirmed');
      const result = await response.json();
      if (!result.writeResults?.[0]?.updateTime) throw new Error('Missing write confirmation');
      showSuccess();
      document.dispatchEvent(new Event('cenessod:manual-registered'));
    } catch {
      error.textContent = 'No pudimos confirmar tu registro. Revisa tu conexión e inténtalo de nuevo. Tu correo permanece en el formulario.';
      error.hidden = false;
      error.focus();
    } finally {
      clearTimeout(timeout);
      submitting = false;
      button.disabled = false;
      button.innerHTML = buttonLabel;
      form.removeAttribute('aria-busy');
    }
  });
  button.disabled = false;
})();
