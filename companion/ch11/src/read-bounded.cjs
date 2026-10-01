const MAX_BYTES = 1024 * 1024;

// The caller owns the handle and must close it, including on read failure.
async function readBounded(handle) {
  const buffer = Buffer.alloc(MAX_BYTES + 1);
  let total = 0;
  while (total < buffer.length) {
    const { bytesRead } = await handle.read(buffer, total, buffer.length - total, total);
    if (bytesRead === 0) break;
    total += bytesRead;
  }
  return total > MAX_BYTES ? null : buffer.subarray(0, total);
}

module.exports = { MAX_BYTES, readBounded };
