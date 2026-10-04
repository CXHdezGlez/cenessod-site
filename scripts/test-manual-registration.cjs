const { readFileSync } = require('node:fs');
// Ejecutar con: node --experimental-vm-modules scripts/test-manual-registration.cjs
const { Script, SyntheticModule, createContext } = require('node:vm');
const assert = require('node:assert/strict');
const { resolve } = require('node:path');
const source = readFileSync(resolve(__dirname, '../assets/manual-registration-v1.js'), 'utf8');

async function check({ valid = true, checked = true, mode = 'success', honeypot = '', elapsed = 5000, appCheck = 'ok' } = {}) {
  let headers, imports = [];
  let submit, release, downloads = 0, requests = 0, payload, registered = 0;
  const button = { disabled: true, innerHTML: 'Descargar' };
  const form = { style: {}, querySelector: () => button,
    addEventListener: (type, callback) => { if (type === 'submit') submit = callback; },
    checkValidity: () => valid, reportValidity() {}, setAttribute() {}, removeAttribute() {} };
  const nodes = { 'form-lead-magnet': form, 'lm-email': { value: ' qa@example.invalid ' },
    'lm-consent': { checked }, 'lm-error': { hidden: true, focus() {} },
    'lm-success': { hidden: true, focus() {} }, 'lm-website': { value: honeypot }, 'lm-download': { click() { downloads++; } } };
  let now = 1000;
  const FakeDate = { now: () => now };
  // Módulos falsos del SDK de Firebase: 'ok' entrega un token, 'fail' simula que reCAPTCHA no carga.
  const sdk = {
    'firebase-app.js': { initializeApp: (config, name) => ({ config, name }) },
    'firebase-app-check.js': {
      ReCaptchaV3Provider: function (key) { this.key = key; },
      initializeAppCheck: (app, options) => ({ app, options }),
      getToken: async () => { if (appCheck === 'fail') throw new Error('recaptcha'); return { token: 'tok-123' }; }
    }
  };
  const context = createContext({ Date: FakeDate, document: { getElementById: id => nodes[id], dispatchEvent(event) { assert.equal(event.type, 'cenessod:manual-registered'); registered++; } },
    AbortController, setTimeout, clearTimeout,
    crypto: { randomUUID: () => 'a12a1234-1234-4234-8234-123456789012' },
    fetch: async (_, options) => {
      requests++;
      headers = options.headers;
      payload = JSON.parse(options.body);
      if (mode === 'double') await new Promise(resolve => { release = resolve; });
      if (mode === 'offline') throw new Error('offline');
      if (mode === 'timeout') {
        return new Promise((_, reject) => {
          options.signal.addEventListener('abort', () => reject(new Error('aborted')));
          // Simulate the browser reaching the deadline without waiting 15 seconds.
          options.signal.dispatchEvent(new Event('abort'));
        });
      }
      return { ok: mode !== 'rejected', json: async () => mode === 'incomplete' ? {} :
        { writeResults: [{ updateTime: '2026-09-13T00:00:00Z' }] } };
    }, Event });
  new Script(source, { importModuleDynamically: async url => {
    imports.push(url);
    const exports = sdk[url.split('/').pop()];
    const mod = new SyntheticModule(Object.keys(exports), function () {
      for (const [key, value] of Object.entries(exports)) this.setExport(key, value);
    }, { context });
    await mod.link(() => {});
    await mod.evaluate();
    return mod;
  } }).runInContext(context);
  assert.equal(button.disabled, false);
  now += elapsed;
  const first = submit({ preventDefault() {} });
  if (mode === 'double') {
    assert.equal(button.disabled, true);
    while (requests === 0) await new Promise(r => setTimeout(r, 0));
    await submit({ preventDefault() {} });
    assert.equal(requests, 1);
    assert.equal(downloads, 0);
    release();
  }
  await first;
  assert.equal(button.disabled, false);
  if (honeypot || elapsed < 3000) {
    assert.equal(requests, 0);
    assert.equal(registered, 0);
    assert.equal(downloads, 1);
    assert.equal(nodes['lm-success'].hidden, false);
  } else if (!valid || !checked) {
    assert.equal(requests, 0);
    assert.equal(downloads, 0);
    assert.equal(registered, 0);
  } else if (['offline', 'timeout', 'rejected', 'incomplete'].includes(mode)) {
    assert.equal(downloads, 0);
    assert.equal(nodes['lm-error'].hidden, false);
    assert.notEqual(form.hidden, true);
    assert.equal(nodes['lm-email'].value, 'qa@example.invalid');
    assert.equal(registered, 0);
  } else {
    assert.equal(downloads, 1);
    assert.equal(registered, 1);
    assert.equal(form.hidden, true);
    assert.equal(nodes['lm-success'].hidden, false);
    assert.equal(payload.writes[0].update.fields.consentimiento.booleanValue, true);
    assert.equal(payload.writes[0].updateTransforms[0].setToServerValue, 'REQUEST_TIME');
    assert.equal(imports.length, 2);
    assert.ok(imports.every(url => url.startsWith('https://www.gstatic.com/firebasejs/')));
    if (appCheck === 'ok') assert.equal(headers['X-Firebase-AppCheck'], 'tok-123');
    else assert.equal('X-Firebase-AppCheck' in headers, false);
  }
}

(async () => {
  await check();
  await check({ valid: false });
  await check({ checked: false });
  await check({ appCheck: 'fail' });
  await check({ honeypot: 'https://spam.example' });
  await check({ elapsed: 800 });
  for (const mode of ['double', 'offline', 'timeout', 'rejected', 'incomplete']) await check({ mode });
  console.log('PASS: App Check token header, App Check fallback, honeypot, fast-submit trap, save confirmation, validation, consent, double submit, network failure, timeout, rejected and incomplete responses');
})().catch(error => { console.error(error); process.exitCode = 1; });
