const $ = id => document.getElementById(id);
function message(text) { $('status').textContent = text; }
let busy = false, revision = 0, synced = false, halted = false, queue = Promise.resolve();
const unknownResult = '操作結果不明，已停止文件操作；畫面原文仍保留。請複製到另一個編輯器保存，再結束程式並重新開啟磁碟檔案核對。';
async function call(name, value) {
  let result;
  try { result = await window.tool[name](value); }
  catch (error) {
    // An edit can safely be retried with the latest draft. A lost file-operation
    // reply may mean main already switched documents: never overwrite it blindly.
    if (name !== 'edit') { halted = true; unsynchronized(); message(unknownResult); }
    throw error;
  }
  if (!result.ok) throw Error(result.error.message);
  return result.data;
}
function unsynchronized() {
  synced = false;
  $('bytes').textContent = new TextEncoder().encode($('text').value).length + ' / 1048576 bytes';
  $('name').textContent = '● 未同步／未儲存';
  $('preview').replaceChildren();
}
function paintPreview(data) {
  $('name').textContent = data.name + (data.dirty ? ' ● 未儲存' : ' — 無未儲存變更');
  if (data.blocks) {
    $('preview').replaceChildren();
    for (const block of data.blocks) {
      const allowed = ['h1', 'h2', 'h3', 'p', 'li'];
      const el = document.createElement(allowed.includes(block.tag) ? block.tag : 'p');
      el.textContent = block.text;
      $('preview').append(el);
    }
  }
}
function sync() {
  const text = $('text').value, version = revision;
  const next = queue.then(async () => {
    try {
      const data = await call('edit', text);
      if (version === revision) {
        synced = true;
        paintPreview(data);
        message(data.dirty ? '尚未儲存' : '無未儲存變更');
      }
      return data;
    } catch (error) {
      if (version === revision) {
        unsynchronized();
        message('未同步，尚未儲存；原文保留。請複製備份，縮小至一 MiB 內或待通訊恢復後重試。' + error.message);
      }
      throw error;
    }
  });
  queue = next.catch(() => {});
  return next;
}
async function run(job) {
  if (halted) { message(unknownResult); return; }
  if (busy) return;
  busy = true;
  const controls = [...document.querySelectorAll('button,input,textarea')];
  const before = controls.map(x => x.disabled);
  controls.forEach(x => x.disabled = true);
  try { await job(); }
  catch (error) { if (halted) message(unknownResult); else if (synced) message(error.message); }
  finally { controls.forEach((x, i) => x.disabled = before[i]); busy = false; }
}
async function show(data) {
  if (data.canceled) { message('已取消，原筆記保留'); return; }
  $('text').value = data.text;
  revision++;
  unsynchronized();
  await sync();
}
$('text').addEventListener('input', () => {
  revision++;
  unsynchronized();
  if (halted) { message(unknownResult); return; }
  sync().catch(() => {});
});
for (const name of ['newNote', 'open', 'save']) {
  $(name).addEventListener('click', () => run(async () => {
    await sync();
    const data = await call(name);
    await show(data);
    if (!data.canceled) message(name === 'save' ? '已儲存' : '筆記已就緒');
  }));
}
// Native close must use the same synchronization barrier as save/open.
window.tool.onClose(() => run(async () => {
  await sync();
  const data = await call('close');
  if (data.canceled) message('已取消，原筆記保留');
}));
run(async () => show(await call('state')));
