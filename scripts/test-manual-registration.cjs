const { readFileSync } = require('node:fs');
const { runInNewContext } = require('node:vm');
const assert = require('node:assert/strict');
const { resolve } = require('node:path');
const source = readFileSync(resolve(__dirname, '../assets/manual-registration-v1.js'), 'utf8');

async function check({ valid = true, checked = true, mode = 'success' } = {}) {
  let submit, release, downloads = 0, requests = 0, payload, registered = 0;
  const button = { disabled: true, innerHTML: 'Descargar' };
  const form = { style: {}, querySelector: () => button,
    addEventListener: (_, callback) => { submit = callback; },
    checkValidity: () => valid, reportValidity() {}, setAttribute() {}, removeAttribute() {} };
  const nodes = { 'form-lead-magnet': form, 'lm-email': { value: ' qa@example.invalid ' },
    'lm-consent': { checked }, 'lm-error': { hidden: true, focus() {} },
    'lm-success': { hidden: true, focus() {} }, 'lm-download': { click() { downloads++; } } };
  runInNewContext(source, { document: { getElementById: id => nodes[id], dispatchEvent(event) { assert.equal(event.type, 'cenessod:manual-registered'); registered++; } },
    AbortController, setTimeout, clearTimeout,
    crypto: { randomUUID: () => 'a12a1234-1234-4234-8234-123456789012' },
    fetch: async (_, options) => {
      requests++;
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
  assert.equal(button.disabled, false);
  const first = submit({ preventDefault() {} });
  if (mode === 'double') {
    assert.equal(button.disabled, true);
    await submit({ preventDefault() {} });
    assert.equal(requests, 1);
    assert.equal(downloads, 0);
    release();
  }
  await first;
  assert.equal(button.disabled, false);
  if (!valid || !checked) {
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
  }
}

(async () => {
  await check();
  await check({ valid: false });
  await check({ checked: false });
  for (const mode of ['double', 'offline', 'timeout', 'rejected', 'incomplete']) await check({ mode });
  console.log('PASS: save confirmation, validation, consent, double submit, network failure, timeout, rejected and incomplete responses');
})().catch(error => { console.error(error); process.exitCode = 1; });
