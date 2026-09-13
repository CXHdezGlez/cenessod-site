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
  const buttonLabel = button.innerHTML;
  const database = 'projects/cenessod-9fa05/databases/(default)';
  const endpoint = `https://firestore.googleapis.com/v1/${database}/documents:commit?key=AIzaSyBwu6T3ILFnk1ZfqehoGOjg0yp7Tw4tE_8`;
  let submitting = false;

  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (submitting) return;
    email.value = email.value.trim();
    if (!form.checkValidity() || !consent.checked) {
      form.reportValidity();
      return;
    }
    error.hidden = true;
    submitting = true;
    button.disabled = true;
    button.textContent = 'Guardando registro…';
    form.setAttribute('aria-busy', 'true');
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    try {
      const name = `${database}/documents/manual_registros/${crypto.randomUUID()}`;
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
      form.hidden = true;
      form.style.display = 'none';
      success.hidden = false;
      success.focus();
      download.click();
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
