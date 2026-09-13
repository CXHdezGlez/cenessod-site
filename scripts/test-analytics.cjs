const fs = require('node:fs'), vm = require('node:vm'), assert = require('node:assert/strict');
const source = fs.readFileSync('assets/analytics-20260908.js', 'utf8');
function check(choice, hostname = 'cenessod.com') {
  const handlers = {}, scripts = [];
  const node = () => ({hidden:true, setAttribute(){}, append(){}, addEventListener(){}, querySelector(){return {focus(){}}}, focus(){}});
  const document = {cookie:'',referrer:'https://example.org/?email=private@example.com',body:node(),head:{append(s){scripts.push(s)}},createElement:node,querySelector:()=>node(),addEventListener:(name,fn)=>{handlers[name]=fn}};
  const window = {addEventListener(){}};
  const sandbox = {document,window,location:{hostname,href:'https://'+hostname+'/?email=private@example.com',search:'?email=private@example.com',pathname:'/'},localStorage:{getItem:()=>choice?JSON.stringify({choice,at:Date.now()}):null},URL,URLSearchParams,Date,Set};
  Object.defineProperty(sandbox,'gtag',{get:()=>window.gtag});
  vm.runInNewContext(source,sandbox);
  handlers['cenessod:manual-registered']();
  const calls=(window.dataLayer||[]).map(args=>Array.from(args));
  const leads=calls.filter(c=>c[0]==='event'&&c[1]==='generate_lead');
  assert.equal(leads.length, ['granted','measurement'].includes(choice)&&hostname==='cenessod.com'?1:0);
  assert.ok(!JSON.stringify(calls).includes('private@example.com'));
  if(!choice||choice==='denied')assert.equal(scripts.length,0);
  if(leads.length)assert.equal(leads[0][2].lead_source,'manual_registration');
}
for(const choice of [null,'denied','granted','measurement'])check(choice);
check('granted','localhost');
console.log('PASS: manual conversion requires analytics consent and production; no email or URL query leaks; no Google tag loaded before consent');
