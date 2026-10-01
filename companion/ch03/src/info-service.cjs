function failure(code, message) { return { ok: false, error: { code, message } }; }
function handleInfo(event, payload, context) {
  // 先驗證誰提出請求，再檢查請求內容。
  if (!context.contents || event.sender !== context.contents ||
      !event.senderFrame || event.senderFrame !== context.contents.mainFrame ||
      event.senderFrame.url !== context.entry) {
    return failure('FORBIDDEN', '此來源不可使用這個功能。');
  }
  if (!payload || Array.isArray(payload) || typeof payload !== 'object' ||
      Object.keys(payload).length !== 1 || typeof payload.label !== 'string' ||
      !/^[\p{Script=Han}A-Za-z0-9 ]{1,20}$/u.test(payload.label) || !payload.label.trim()) {
    return failure('INVALID_INPUT', '名稱須為 1 至 20 個中文字、英文字、數字或空格。');
  }
  try {
    const info = context.info();
    return { ok: true, data: { label: payload.label.trim(), version: info.version, platform: info.platform } };
  } catch {
    return failure('INTERNAL', '目前無法讀取應用資訊，請稍後重試。');
  }
}
module.exports = { handleInfo };
