const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const file = require('node:path').join(__dirname, '../src/info-service.cjs');
const { handleInfo = () => undefined } = fs.existsSync(file) ? require(file) : {};
function fixture() {
  const frame = { url: 'app://local/index.html' };
  const contents = { mainFrame: frame };
  return { event: { sender: contents, senderFrame: frame }, context: { contents, entry: frame.url, info: () => ({ version: '0.1.0', platform: 'win32' }) } };
}
test('合法名稱取得受限系統資訊', () => {
  const {event, context} = fixture();
  assert.deepEqual(handleInfo(event, {label:'我的工具'}, context), {ok:true,data:{label:'我的工具',version:'0.1.0',platform:'win32'}});
});
test('拒絕錯誤型別、超長、HTML 及多餘欄位', () => {
  const {event, context} = fixture();
  for (const payload of [{}, null, [], 'x', {label:''}, {label:' '.repeat(3)}, {label:'a'.repeat(21)}, {label:'<script>'}, {label:'工具',path:'C:/secret'}]) {
    const result = handleInfo(event, payload, context);
    assert.equal(result?.error?.code, 'INVALID_INPUT');
  }
  assert.equal(handleInfo(event, {label:'a'.repeat(20)}, context).ok, true);
});
test('拒絕其他視窗、子框架、錯誤網址與已消失的來源', () => {
  const {event, context} = fixture();
  for (const bad of [{...event,sender:{}}, {...event,senderFrame:{url:context.entry}}, {...event,senderFrame:null}, {}]) {
    assert.equal(handleInfo(bad, {label:'工具'}, context)?.error?.code, 'FORBIDDEN');
  }
  event.senderFrame.url = 'app://local/index.html?untrusted=1';
  assert.equal(handleInfo(event, {label:'工具'}, context)?.error?.code, 'FORBIDDEN');
});
test('系統例外不包含本機路徑', () => {
  const {event, context} = fixture();
  context.info = () => { throw new Error('secret C:/Users/private'); };
  assert.deepEqual(handleInfo(event, {label:'工具'}, context), {ok:false,error:{code:'INTERNAL',message:'目前無法讀取應用資訊，請稍後重試。'}});
});
