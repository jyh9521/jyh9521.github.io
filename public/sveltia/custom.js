(() => {
  const register = () => {
    if (!window.CMS?.registerEditorComponent) return false;
    if (!window.h || !window.createClass || !window.CMS.getFieldType?.('select')?.control) return false;
    const h = window.h;
    const createClass = window.createClass;
    const SelectControl = window.CMS.getFieldType('select').control;
    const platformOptions = {
      pc: ['PC', 'Windows', 'macOS', 'Linux'],
      playstation: ['PS5 Pro', 'PS5', 'PS4 Pro', 'PS4', 'PS3', 'PS Vita', 'PSP', 'PS2', 'PS1'],
      xbox: ['Xbox Series X|S', 'Xbox One X', 'Xbox One', 'Xbox 360', '初代 Xbox'],
      nintendo: ['Switch 2', 'Switch', '3DS', 'DS', 'Wii U', 'Wii', 'GameCube', 'Game Boy Advance', 'Game Boy'],
    };
    const PlatformChoice = createClass({
      render: function () {
        const value = this.props.value || {};
        const family = ['pc', 'playstation', 'xbox', 'nintendo'].includes(value.family) ? value.family : 'pc';
        const options = platformOptions[family].map(platform => ({ label: platform, value: platform }));
        const platform = options.some(option => option.value === value.platform) ? value.platform : options[0].value;
        const choices = [
          ['平台家族', 'family', [{ label: 'PC', value: 'pc' }, { label: '索尼 PlayStation', value: 'playstation' }, { label: '微软 Xbox', value: 'xbox' }, { label: '任天堂', value: 'nintendo' }]],
          ['具体平台', 'platform', options],
        ];
        return h('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: '12px' } }, choices.map(([label, key, choices]) => h('label', { key, style: { display: 'grid', gap: '6px' } },
          h('span', null, label),
          h(SelectControl, {
            field: { name: `${this.props.forID}-${key}`, options: choices, dropdown_threshold: 1 },
            value: key === 'family' ? family : platform,
            forID: `${this.props.forID}-${key}`,
            onChange: next => this.props.onChange(key === 'family' ? { family: next, platform: platformOptions[next][0] } : { ...value, family, platform: next }),
          }),
        )));
      },
    });
    window.CMS.registerFieldType('game-platform-choice', PlatformChoice);

    const IgdbGameMetadata = createClass({
      getInitialState: function () { return { loading: false, searching: false, message: '', results: [], query: '' }; },
      update: function (key, value) {
        const current = this.props.value || {};
        const manualFields = new Set(current.manualFields || []);
        const isEmpty = Array.isArray(value) ? value.length === 0 : !String(value || '').trim();
        if (isEmpty) manualFields.delete(key); else manualFields.add(key);
        this.props.onChange({ ...current, [key]: value, manualFields: [...manualFields] });
      },
      searchGames: async function () {
        const query = String(this.state.query || '').trim();
        if (!query) { this.setState({ message: '请输入游戏名称。' }); return; }
        this.setState({ searching: true, message: '正在搜索 IGDB…', results: [] });
        try {
          const response = await fetch(`https://blog.blfy.cc/ns/api/igdb/search?q=${encodeURIComponent(query)}`);
          const result = await response.json();
          if (!response.ok) throw new Error(result.error || `搜索失败（${response.status}）`);
          this.setState({ results: result.results || [], message: result.results?.length ? '请选择正确游戏；已有字段不会被覆盖。' : '没有找到结果，请尝试其他语言或关键词。' });
        } catch (error) {
          this.setState({ message: error instanceof Error ? error.message : 'IGDB 搜索失败，请稍后重试。' });
        } finally { this.setState({ searching: false }); }
      },
      selectGame: async function (id) {
        this.setState({ loading: true, message: '正在读取 IGDB 资料…' });
        try {
          const response = await fetch(`https://blog.blfy.cc/ns/api/igdb/game?id=${encodeURIComponent(id)}`);
          const game = await response.json();
          if (!response.ok) throw new Error(game.error || `读取失败（${response.status}）`);
          const current = this.props.value || {};
          const importedBefore = Boolean(current.igdbId || current.sourceGameId);
          const manualFields = new Set(current.manualFields || []);
          if (!importedBefore) for (const key of ['title', 'cover', 'description', 'releaseDate', 'developer', 'platforms']) {
            const hasValue = Array.isArray(current[key]) ? current[key].length > 0 : Boolean(String(current[key] || '').trim());
            if (hasValue) manualFields.add(key);
          }
          const next = { ...current, igdbId: String(game.id), slug: game.slug || '', manualFields: [...manualFields] };
          for (const key of ['title', 'cover', 'description', 'releaseDate', 'developer', 'platforms']) {
            if (manualFields.has(key)) continue;
            const hasValue = Array.isArray(current[key]) ? current[key].length > 0 : Boolean(String(current[key] || '').trim());
            if (importedBefore || !hasValue) next[key] = game[key] || (key === 'platforms' ? [] : '');
          }
          this.props.onChange(next);
          this.setState({ results: [], message: 'IGDB 资料已填入；非空字段已保留，你仍可手动编辑。' });
        } catch (error) {
          this.setState({ message: error instanceof Error ? error.message : 'IGDB 资料读取失败，请稍后重试。' });
        } finally { this.setState({ loading: false }); }
      },
      render: function () {
        const value = this.props.value || {};
        const input = (key, label, type = 'text') => h('label', { key, style: { display: 'grid', gap: '5px' } }, h('span', null, label), h('input', { type, value: value[key] || '', onChange: event => this.update(key, event.target.value), style: { width: '100%', minHeight: '38px', padding: '7px 10px', border: '1px solid #68707a', borderRadius: '6px', background: 'transparent', color: 'inherit' } }));
        const text = (key, label) => h('label', { key, style: { display: 'grid', gap: '5px' } }, h('span', null, label), h('textarea', { value: value[key] || '', onChange: event => this.update(key, event.target.value), rows: 3, style: { width: '100%', padding: '8px 10px', border: '1px solid #68707a', borderRadius: '6px', background: 'transparent', color: 'inherit' } }));
        return h('div', { style: { display: 'grid', gap: '10px' } },
          h('div', { style: { display: 'grid', gridTemplateColumns: 'minmax(0,1fr) auto', gap: '8px', alignItems: 'end' } },
            h('label', { style: { display: 'grid', gap: '5px' } }, h('span', null, '按任意语言搜索 IGDB'), h('input', { type: 'search', value: this.state.query, placeholder: '游戏名称', onChange: event => this.setState({ query: event.target.value }), onKeyDown: event => { if (event.key === 'Enter') { event.preventDefault(); this.searchGames(); } }, style: { width: '100%', minHeight: '38px', padding: '7px 10px', border: '1px solid #68707a', borderRadius: '6px', background: 'transparent', color: 'inherit' } })),
            h('button', { id: this.props.forID, type: 'button', disabled: this.state.loading || this.state.searching, onClick: () => this.searchGames(), style: { minHeight: '38px', padding: '7px 14px', cursor: this.state.searching ? 'wait' : 'pointer' } }, this.state.searching ? '搜索中…' : '搜索 IGDB'),
          ),
          this.state.results.length > 0 && h('div', { style: { display: 'grid', gap: '6px' } }, this.state.results.map(item => h('button', {
            key: item.id, type: 'button', disabled: this.state.loading, onClick: () => this.selectGame(item.id),
            style: { display: 'grid', gridTemplateColumns: '52px minmax(0,1fr)', gap: '10px', textAlign: 'left', padding: '8px', cursor: 'pointer', color: 'inherit', background: 'transparent', border: '1px solid #68707a', borderRadius: '6px' },
          }, item.cover && h('img', { src: item.cover, alt: '', style: { width: '52px', height: '68px', objectFit: 'cover' } }), h('span', null, h('strong', null, item.title), h('br'), `${item.year || '年份未知'} · ${(item.platforms || []).join('、') || '平台未知'} · IGDB ${item.id}`)))),
          h('div', { style: { display: 'grid', gridTemplateColumns: 'minmax(0,1fr) auto', gap: '8px', alignItems: 'end' } },
            h('label', { style: { display: 'grid', gap: '5px' } }, h('span', null, '永久关联标识 · IGDB Game ID（可手动粘贴）'), h('input', { type: 'text', inputMode: 'numeric', value: value.igdbId || '', placeholder: '在 IGDB 页面复制 Game ID', onChange: event => this.props.onChange({ ...(this.props.value || {}), igdbId: event.target.value.trim() }), onKeyDown: event => { if (event.key === 'Enter') { event.preventDefault(); this.selectGame(String(value.igdbId || '').trim()); } }, style: { width: '100%', minHeight: '38px', padding: '7px 10px', border: '1px solid #68707a', borderRadius: '6px', background: 'transparent', color: 'inherit' } })),
            h('button', { type: 'button', disabled: this.state.loading || this.state.searching || !/^\d{1,12}$/.test(String(value.igdbId || '').trim()), onClick: () => this.selectGame(String(value.igdbId || '').trim()), style: { minHeight: '38px', padding: '7px 14px', cursor: this.state.loading ? 'wait' : 'pointer' } }, this.state.loading ? '获取中…' : '按 ID 获取资料'),
          ),
          input('title', '游戏名称'),
          input('cover', '封面图片 URL'),
          h('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: '10px' } }, input('releaseDate', '首次发售日期', 'date'), input('developer', '开发商')),
          h('label', { style: { display: 'grid', gap: '5px' } }, h('span', null, 'IGDB 平台（可手动编辑）'), h('input', { type: 'text', value: Array.isArray(value.platforms) ? value.platforms.join(', ') : '', onChange: event => this.update('platforms', event.target.value.split(/[,，]/).map(item => item.trim()).filter(Boolean)), style: { width: '100%', minHeight: '38px', padding: '7px 10px', border: '1px solid #68707a', borderRadius: '6px', background: 'transparent', color: 'inherit' } })),
          text('description', '游戏简介'),
          this.state.message && h('div', {
            role: this.state.message.startsWith('IGDB 资料已填入') ? 'status' : 'alert',
            'aria-live': 'polite',
            style: { padding: '9px 12px', borderRadius: '6px', border: `1px solid ${this.state.message.startsWith('IGDB 资料已填入') ? '#2e7d32' : '#b7791f'}`, background: this.state.message.startsWith('IGDB 资料已填入') ? 'rgba(46,125,50,.12)' : 'rgba(183,121,31,.12)' },
          }, this.state.message),
        );
      },
    });
    window.CMS.registerFieldType('igdb-game-metadata', IgdbGameMetadata);
    [['p', 'PlayStation'], ['n', 'Nintendo'], ['x', 'Xbox'], ['s', 'PC']].forEach(([frame, label]) => {
      const tag = `${frame}frame`;
      window.CMS.registerEditorComponent({
        id: `${tag}-card`, label: `${label} IGDB 卡片`, icon: 'sports_esports', trigger: 'button',
        fields: [
          { name: 'igdbId', label: 'IGDB Game ID', widget: 'string', required: true },
          { name: 'title', label: '标题覆盖（可选）', widget: 'string', required: false },
          { name: 'status', label: '游玩状态（可选）', widget: 'string', required: false },
        ],
        pattern: new RegExp(`^\\[${tag}\\]\\s*(\\d{1,12})(?:\\|([^|\\]]*))?(?:\\|([^|\\]]*))?\\s*\\[\\/${tag}\\]$`),
        fromBlock: match => ({ igdbId: match[1], title: match[2] || '', status: match[3] || '' }),
        toBlock: ({ igdbId = '', title = '', status = '' }) => {
          const id = String(igdbId).trim();
          return /^\d{1,12}$/.test(id) ? `[${tag}]${id}|${String(title).replace(/[|\]]/g, '')}|${String(status).replace(/[|\]]/g, '')}[/${tag}]` : '';
        },
        toPreview: ({ igdbId = '', title = '', status = '' }) => `${label} IGDB 卡片（${String(title) || String(igdbId).replace(/[^0-9]/g, '') || '待填写'}${status ? ` · ${status}` : ''}）`,
      });
    });
    window.CMS.registerEditorComponent({
      id: 'image-compare', label: '截图前后对比', icon: 'compare', trigger: 'button',
      fields: [
        { name: 'before', label: '之前的图片', widget: 'image', required: true },
        { name: 'after', label: '之后的图片', widget: 'image', required: true },
        { name: 'beforeLabel', label: '左侧说明', widget: 'string', required: false },
        { name: 'afterLabel', label: '右侧说明', widget: 'string', required: false },
      ],
      pattern: /^\[compare\]\s*([^|\]]+)\|([^|\]]+)(?:\|([^|\]]*))?(?:\|([^|\]]*))?\s*\[\/compare\]$/,
      fromBlock: match => ({ before: match[1], after: match[2], beforeLabel: match[3] || '之前', afterLabel: match[4] || '之后' }),
      toBlock: ({ before = '', after = '', beforeLabel = '之前', afterLabel = '之后' }) => before && after ? `[compare]${String(before).replace(/[|\]]/g, '')}|${String(after).replace(/[|\]]/g, '')}|${String(beforeLabel).replace(/[|\]]/g, '')}|${String(afterLabel).replace(/[|\]]/g, '')}[/compare]` : '',
      toPreview: ({ beforeLabel = '之前', afterLabel = '之后' }) => `截图对比：${beforeLabel} ↔ ${afterLabel}`,
    });
    return true;
  };
  if (!register()) {
    let attempts = 0;
    const timer = window.setInterval(() => {
      attempts += 1;
      if (register() || attempts >= 50) window.clearInterval(timer);
    }, 100);
  }
})();
