function parseMinutes(value) {
  if (typeof value !== 'string' || !/^[0-9]+$/.test(value)) {
    throw new Error('分鐘數必須是整數');
  }
  const minutes = Number(value);
  if (!Number.isSafeInteger(minutes) || minutes < 1 || minutes > 180) {
    throw new Error('分鐘數必須介於 1 與 180');
  }
  return minutes;
}

module.exports = { parseMinutes };
