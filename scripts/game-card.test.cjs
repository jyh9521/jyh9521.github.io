const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const yaml = require('js-yaml');

function loadCms() {
  const components = [];
  const window = {
    h: () => null, createClass: value => value,
    CMS: { getFieldType: () => ({ control: () => null }), registerFieldType() {}, registerEditorComponent: component => components.push(component) },
  };
  vm.runInNewContext(fs.readFileSync('public/sveltia/custom.js', 'utf8'), { window });
  return components;
}

function loadTs(file, dependencies = {}) {
  const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  const context = { exports: {}, URLSearchParams, require: name => dependencies[name] || require(name) };
  vm.runInNewContext(code, context);
  return context.exports;
}

test('toolbar has one searchable local-game picker and uses manual title labels', () => {
  const components = loadCms();
  const gameButtons = components.filter(component => component.icon === 'sports_esports');
  assert.equal(gameButtons.length, 1);
  const [component] = gameButtons;
  assert.equal(component.id, 'game-card');
  assert.equal(component.label, '添加游戏');
  assert.equal(component.tooltip, '添加游戏');
  const field = component.fields.find(field => field.name === 'gameSlug');
  assert.equal(field.widget, 'relation');
  assert.equal(field.collection, 'games');
  assert.equal(field.value_field, '{{slug}}');
  assert.deepEqual(Array.from(field.display_fields), ['title']);
  assert.ok(field.search_fields.includes('title'));
  assert.deepEqual(Array.from(field.search_fields), ['title', '{{slug}}']);
  assert.equal(field.dropdown_threshold, 0);
  assert.equal(field.multiple, false);
  const config = yaml.load(fs.readFileSync('public/sveltia/config.yml', 'utf8'));
  const declaredFields = config.collections.find(collection => collection.name === field.collection).fields.map(field => field.name);
  for (const name of field.search_fields) assert.ok(name === '{{slug}}' || declaredFields.includes(name), 'relation search field must be declared in CMS schema: ' + name);
  const body = config.collections.find(collection => collection.name === 'post').fields.find(field => field.name === 'body');
  assert.ok(body.editor_components.includes(component.id));
  assert.ok(!body.editor_components.some(id => /^[pnxs]frame-card$/.test(id)));
});

test('new cards store stable slugs and legacy cards round-trip with platform and overrides intact', () => {
  const component = loadCms().find(component => component.id === 'game-card');
  assert.equal(component.toBlock({ gameSlug: 'onimusha-way-of-the-sword' }), '[gframe]onimusha-way-of-the-sword||[/gframe]');
  assert.equal(component.toBlock({ gameSlug: '../bad' }), '');
  for (const frame of ['g', 'p', 'n', 'x', 's']) {
    const block = `[${frame}frame]onimusha-way-of-the-sword|标题覆盖|已通关[/${frame}frame]`;
    const data = component.fromBlock(block.match(component.pattern));
    assert.equal(component.toBlock(data), block);
  }
});

test('Markdown recognizes generic and all legacy frames without mismatched closing tags', () => {
  const { remarkGameFrames } = loadTs('app/posts/game-frames.ts');
  for (const frame of ['g', 'p', 'n', 'x', 's']) {
    const tree = { children: [{ type: 'text', value: `前文[${frame}frame]onimusha-way-of-the-sword||[/${frame}frame]后文` }] };
    remarkGameFrames()(tree);
    assert.equal(tree.children[1].type, 'link');
    const link = new URL(tree.children[1].url);
    assert.equal(link.pathname, `/${frame}`);
    assert.equal(link.searchParams.get('slug'), 'onimusha-way-of-the-sword');
    assert.equal(tree.children[0].value, '前文');
    assert.equal(tree.children[2].value, '后文');
  }
  const tree = { children: [{ type: 'text', value: '[gframe]game[/pframe]' }] };
  remarkGameFrames()(tree);
  assert.equal(tree.children[0].type, 'text');
});

test('generic card takes the selected local platform and current manual title, not all provider platforms', () => {
  const { default: Card } = loadTs('app/games/game-frame-card.tsx', { './game-platform-card': { default: () => null } });
  const ps = { store: 'playstation', platform: 'PS5' };
  const pc = { store: 'pc', platform: 'PC' };
  const game = { title: '鬼武者：剑之道', status: '正在玩', slug: 'onimusha-way-of-the-sword', platforms: [ps, pc], metadata: { platforms: ['PC', 'PlayStation 5', 'Xbox Series X|S'] } };
  const card = Card({ frame: 'g', game });
  assert.equal(card.props.gameTitle, game.title);
  assert.equal(card.props.platform, ps);
  assert.equal(card.props.status, '正在玩');
  game.title = '手动修改后的名称';
  assert.equal(Card({ frame: 'g', game }).props.gameTitle, game.title);
  assert.equal(Card({ frame: 's', game }).props.platform, pc);
  assert.equal(Card({ frame: 'g', game, title: '本文覆盖' }).props.gameTitle, '本文覆盖');
});
