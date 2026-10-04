const { readFileSync } = require('node:fs');
// Ejecutar con: node --experimental-vm-modules scripts/test-manual-registration.cjs
const { Script, SyntheticModule, createContext } = require('node:vm');
const assert = require('node:assert/strict');
const { resolve } = require('node:path');
const source = readFileSync(resolve(__dirname, '../assets/manual-registration-v1.js'), 'utf8');

async function check({ valid = true, checked = true, mode = 'success', honeypot = '', elapsed = 5000, appCheck = 'ok', address = ' qa@example.invalid ' } = {}) {
  let headers, imports = [], importCalls = 0;
  let submit, release, downloads = 0, requests = 0, payload, registered = 0;
  const button = { disabled: true, innerHTML: 'Descargar' };
  const emailNode = { value: address, message: '', setCustomValidity(m) { this.message = m; }, addEventListener() {} };
  const form = { style: {}, querySelector: () => button,
    addEventListener: (type, callback) => { if (type === 'submit') submit = callback; },
    checkValidity: () => valid && !emailNode.message, reportValidity() {}, setAttribute() {}, removeAttribute() {} };
  const nodes = { 'form-lead-magnet': form, 'lm-email': emailNode,
    'lm-consent': { checked }, 'lm-error': { hidden: true, focus() {} },
    'lm-success': { hidden: true, focus() {} }, 'lm-website': { value: honeypot }, 'lm-download': { click() { downloads++; } } };
  let now = 1000;
  const FakeDate = { now: () => now };
  // Módulos falsos del SDK de Firebase: 'ok' entrega un token, 'fail' simula que reCAPTCHA falla,
  // 'hang' simula que nunca responde e 'importFailOnce' que el SDK no carga la primera vez.
  const sdk = {
    'firebase-app.js': { initializeApp: (config, name) => ({ config, name }) },
    'firebase-app-check.js': {
      ReCaptchaEnterpriseProvider: function (key) { this.key = key; },
      initializeAppCheck: (app, options) => ({ app, options }),
      getToken: async () => {
        if (appCheck === 'fail') throw new Error('recaptcha');
        if (appCheck === 'hang') return new Promise(() => {});
        return { token: 'tok-123' };
      }
    }
  };
  const context = createContext({ Date: FakeDate, document: { getElementById: id => nodes[id], dispatchEvent(event) { assert.equal(event.type, 'cenessod:manual-registered'); registered++; } },
    AbortController, clearTimeout,
    // En 'hang' los temporizadores se aceleran para no esperar los 8 s reales.
    setTimeout: appCheck === 'hang' ? (fn, ms) => setTimeout(fn, Math.min(ms, 5)) : setTimeout,
    crypto: { randomUUID: () => 'a12a1234-1234-4234-8234-123456789012' },
    fetch: async (_, options) => {
      requests++;
      headers = options.headers;
      payload = JSON.parse(options.body);
      if (mode === 'double') await new Promise(resolve => { release = resolve; });
      if (mode === 'offline') throw new Error('offline');
      // 'enforced' imita App Check en modo Aplicar: sin token, Firestore rechaza la escritura.
      if (mode === 'enforced' && !options.headers['X-Firebase-AppCheck']) return { ok: false, json: async () => ({}) };
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
    importCalls++;
    if (appCheck === 'importFailOnce' && importCalls <= 2) throw new Error('network');
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
  if (appCheck === 'importFailOnce') {
    // Primer intento: el SDK no cargó, no hubo token y Firestore (en modo Aplicar) rechazó.
    assert.equal(nodes['lm-error'].hidden, false);
    assert.equal(downloads, 0);
    // Segundo intento sin recargar: el SDK se vuelve a cargar y el registro se guarda con token.
    await submit({ preventDefault() {} });
    assert.equal(importCalls, 4);
    assert.equal(headers['X-Firebase-AppCheck'], 'tok-123');
    assert.equal(downloads, 1);
    assert.equal(registered, 1);
  } else if (!/^[A-Za-z0-9][A-Za-z0-9._%+-]*@[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)+$/.test(address.trim())) {
    assert.equal(requests, 0);
    assert.equal(downloads, 0);
    assert.match(emailNode.message, /válido/);
  } else if (/@gmail\.com|@hotmail\./i.test(address)) {
    assert.equal(requests, 0);
    assert.equal(downloads, 0);
    assert.match(emailNode.message, /institucional/);
  } else if (honeypot || elapsed < 3000) {
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
  await check({ address: 'p.ik.uba.c0.96@gmail.com' });
  await check({ address: 'Alguien@Hotmail.com.mx' });
  await check({ address: 'ana@jalisco.gob.mx' });
  await check({ address: 'alguien@gmail.com.' });
  await check({ address: '=1+1@a.bc' });
  await check({ address: '<img/src=x>@a.bc' });
  await check({ appCheck: 'hang' });
  await check({ appCheck: 'importFailOnce', mode: 'enforced' });
  await check({ honeypot: 'https://spam.example' });
  await check({ elapsed: 800 });
  for (const mode of ['double', 'offline', 'timeout', 'rejected', 'incomplete']) await check({ mode });
  console.log('PASS: email charset and trailing dot, personal-email block, token time limit, SDK retry after failure, App Check token header, App Check fallback, honeypot, fast-submit trap, save confirmation, validation, consent, double submit, network failure, timeout, rejected and incomplete responses');
})().catch(error => { console.error(error); process.exitCode = 1; });
