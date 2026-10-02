const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const matter = require('gray-matter');
const yaml = require('js-yaml');

const code = ts.transpileModule(fs.readFileSync('lib/game-status.ts', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS },
}).outputText;
const context = { exports: {} };
vm.runInNewContext(code, context);
const { gameStatuses, normalizeGameStatus } = context.exports;

test('CMS and runtime use the same seven single-select states', () => {
  const config = yaml.load(fs.readFileSync('public/sveltia/config.yml', 'utf8'));
  const field = config.collections.flatMap(collection => collection.fields || []).find(field => field.name === 'status');
  assert.equal(field.widget, 'select');
  assert.equal(field.default, '想玩');
  assert.deepEqual(field.options, Array.from(gameStatuses));
  assert.deepEqual(Array.from(gameStatuses), ['想玩', '正在玩', '已通关', '暂时搁置', 'AFK', '考虑制作补丁', '已制作补丁']);
  for (const state of gameStatuses) assert.equal(normalizeGameStatus(state), state);
});

test('legacy composite statuses normalize without inventing dated events', () => {
  assert.equal(normalizeGameStatus('已通关、已发布汉化补丁'), '已通关');
  assert.equal(normalizeGameStatus('已弃玩'), 'AFK');
  assert.equal(normalizeGameStatus('已弃坑'), 'AFK');
  assert.equal(normalizeGameStatus('afk'), 'AFK');
  assert.equal(normalizeGameStatus('已制作补丁'), '已制作补丁');
  assert.equal(normalizeGameStatus('搁置'), '暂时搁置');
  assert.equal(normalizeGameStatus(undefined), '想玩');
});

test('saved dossiers use allowed states and retain patch-release timeline entries', () => {
  for (const file of fs.readdirSync('content/games').filter(file => file.endsWith('.md'))) {
    const { data } = matter(fs.readFileSync(`content/games/${file}`, 'utf8'));
    assert.ok(gameStatuses.includes(data.status), `${file}: ${data.status}`);
    if (file.startsWith('bloodrayne')) assert.ok(data.events.some(event => event.title === '发布汉化补丁'));
  }
});
