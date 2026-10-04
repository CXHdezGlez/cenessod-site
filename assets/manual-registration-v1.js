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
  const buttonLabel = button.innerHTML;
  // Antibots: un humano tarda más de unos segundos en escribir su correo y marcar el consentimiento.
  const MIN_FILL_MS = 3000;
  const startedAt = Date.now();
  const apiKey = 'AIzaSyBwu6T3ILFnk1ZfqehoGOjg0yp7Tw4tE_8';
  const database = 'projects/cenessod-9fa05/databases/(default)';
  const endpoint = `https://firestore.googleapis.com/v1/${database}/documents:commit?key=${apiKey}`;
  // Firebase App Check con reCAPTCHA v3: Firestore solo acepta escrituras que traen un token válido
  // (cuando App Check está en modo "Aplicar"). La clave de sitio es pública.
  const APP_CHECK = {
    sdk: 'https://www.gstatic.com/firebasejs/12.19.0',
    siteKey: '6LdQ090tAAAAAMxdIq-TxqaCKQV4c36JH5sxEDqK',
    appId: '1:102125314463:web:a10a03f91dbae374131daa'
  };
  let appCheckReady = null;
  let submitting = false;

  // Carga el SDK y reCAPTCHA solo cuando la persona interactúa con el formulario.
  function initAppCheck() {
    if (!appCheckReady) {
      appCheckReady = Promise.all([
        import(`${APP_CHECK.sdk}/firebase-app.js`),
        import(`${APP_CHECK.sdk}/firebase-app-check.js`)
      ]).then(([{ initializeApp }, { initializeAppCheck, ReCaptchaV3Provider, getToken }]) => {
        const app = initializeApp({ apiKey, projectId: 'cenessod-9fa05', appId: APP_CHECK.appId }, 'manual-registro');
        const appCheck = initializeAppCheck(app, {
          provider: new ReCaptchaV3Provider(APP_CHECK.siteKey),
          isTokenAutoRefreshEnabled: true
        });
        return () => getToken(appCheck, false).then(result => result.token);
      });
      appCheckReady.catch(() => {});
    }
    return appCheckReady;
  }

  // Si no se obtiene el token se envía sin él: antes de "Aplicar" el registro se guarda igual;
  // después, Firestore lo rechaza y se muestra el mensaje de error.
  async function appCheckToken() {
    try {
      const fetchToken = await initAppCheck();
      return await fetchToken();
    } catch {
      return null;
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
    const timeout = setTimeout(() => controller.abort(), 15000);
    try {
      const name = `${database}/documents/manual_registros/${crypto.randomUUID()}`;
      const headers = { 'Content-Type': 'application/json' };
      const token = await appCheckToken();
      if (token) headers['X-Firebase-AppCheck'] = token;
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
