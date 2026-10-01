const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const LIMIT = 1024 * 1024;

// Inject legal short reads at the filesystem boundary, not at the search algorithm.
async function search(content, { chunk = 2, size = content.length, failRead = false, regular = true } = {}) {
  let closed = 0, readBytes = 0, calls = 0;
  const handle = {
    stat: async () => ({ isFile: () => regular, size }),
    read: async (buffer, offset, length, position) => {
      calls++;
      if (failRead) throw new Error('injected read failure');
      const bytesRead = Math.min(chunk, length, Math.max(0, content.length - position));
      content.copy(buffer, offset, position, position + bytesRead);
      readBytes += bytesRead;
      return { bytesRead, buffer };
    },
    close: async () => { closed++; }
  };
  const fakeFs = {
    realpath: async name => name,
    open: async () => handle,
    opendir: async () => (async function* () { yield { name: 'note.md', isFile: () => true }; })()
  };
  const state = await new Promise((resolve, reject) => {
    const localRequire = id => {
      if (id === 'node:fs/promises') return fakeFs;
      if (id === 'node:worker_threads') return {
        workerData: { root: '/notes', query: 'needle' },
        parentPort: { postMessage: value => { if (value.phase !== 'running') resolve(value); } }
      };
      return id.startsWith('.') ? require(path.resolve(__dirname, '../src', id)) : require(id);
    };
    try {
      vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../src/search-worker.cjs'), 'utf8'), {
        require: localRequire, Buffer, Date
      });
    } catch (error) { reject(error); }
  });
  return { state, closed, readBytes, calls };
}

test('short reads continue to EOF so a later match is not lost', async () => {
  const result = await search(Buffer.from('prefix needle'));
  assert.deepEqual(Array.from(result.state.results, item => item.name), ['note.md']);
  assert.equal(result.state.scanned, 1);
  assert.equal(result.closed, 1);
});

test('EOF stops empty and shortened files and releases handles', async () => {
  for (const content of [Buffer.alloc(0), Buffer.from('needle')]) {
    const result = await search(content, { size: LIMIT });
    assert.equal(result.state.scanned, 1);
    assert.equal(result.readBytes, content.length);
    assert.equal(result.calls, Math.ceil(content.length / 2) + 1);
    assert.equal(result.closed, 1);
  }
});

test('exactly 1 MiB is accepted including a match at the end', async () => {
  const content = Buffer.alloc(LIMIT, 120);
  content.write('needle', LIMIT - 6);
  const result = await search(content, { chunk: 65535 });
  assert.equal(result.state.results.length, 1);
  assert.equal(result.readBytes, LIMIT);
  assert.equal(result.closed, 1);
});

test('growth after stat is rejected with at most 1 MiB plus one byte read', async () => {
  const result = await search(Buffer.alloc(LIMIT + 100, 120), { size: 1, chunk: 65535 });
  assert.equal(result.state.scanned, 0);
  assert.equal(result.state.skipped, 1);
  assert.equal(result.readBytes, LIMIT + 1);
  assert.equal(result.closed, 1);
});

test('read error and stat rejection still release the handle', async () => {
  for (const options of [{ failRead: true }, { size: LIMIT + 1 }, { regular: false }]) {
    const result = await search(Buffer.from('needle'), options);
    assert.equal(result.state.skipped, 1);
    assert.equal(result.state.scanned, 0);
    assert.equal(result.closed, 1);
  }
});
