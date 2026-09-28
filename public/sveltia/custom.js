(() => {
  const register = () => {
    if (!window.CMS?.registerEditorComponent) return false;
    if (!window.h || !window.createClass || !window.CMS.getFieldType?.('select')?.control) return false;
    const h = window.h;
    const createClass = window.createClass;
    const SelectControl = window.CMS.getFieldType('select').control;
    const platformOptions = {
      pc: ['Steam', 'Epic Games Store', 'GOG', 'Ubisoft Connect', 'EA app', 'Battle.net', 'itch.io', 'Microsoft Store', '其他 PC 商店'],
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
          ['具体商店/主机', 'platform', options],
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

    const GameStoreMetadata = createClass({
      getInitialState: function () { return { loading: false, message: '' }; },
      update: function (key, value) { this.props.onChange({ ...(this.props.value || {}), [key]: value }); },
      fetchMetadata: async function () {
        const url = String((this.props.value || {}).storeUrl || '').trim();
        if (!url) { this.setState({ message: '先粘贴商店商品链接。' }); return; }
        this.setState({ loading: true, message: '正在读取官方商店资料…' });
        try {
          const endpoint = `https://blog.blfy.cc/ns/api/game-metadata?url=${encodeURIComponent(url)}`;
          const response = await fetch(endpoint);
          const result = await response.json();
          if (!response.ok) throw new Error(result.error || `抓取失败（${response.status}）`);
          this.props.onChange({ ...(this.props.value || {}), ...result });
          this.setState({ message: '资料已填入，可检查后保存。' });
        } catch (error) {
          this.setState({ message: error instanceof Error ? error.message : '抓取失败，请检查链接后重试。' });
        } finally { this.setState({ loading: false }); }
      },
      render: function () {
        const value = this.props.value || {};
        const input = (key, label, type = 'text') => h('label', { key, style: { display: 'grid', gap: '5px' } }, h('span', null, label), h('input', { type, value: value[key] || '', onChange: event => this.update(key, event.target.value), style: { width: '100%', minHeight: '38px', padding: '7px 10px', border: '1px solid #68707a', borderRadius: '6px', background: 'transparent', color: 'inherit' } }));
        const text = (key, label) => h('label', { key, style: { display: 'grid', gap: '5px' } }, h('span', null, label), h('textarea', { value: value[key] || '', onChange: event => this.update(key, event.target.value), rows: 3, style: { width: '100%', padding: '8px 10px', border: '1px solid #68707a', borderRadius: '6px', background: 'transparent', color: 'inherit' } }));
        return h('div', { style: { display: 'grid', gap: '10px' } },
          h('div', { style: { display: 'grid', gridTemplateColumns: 'minmax(0,1fr) auto', gap: '8px', alignItems: 'end' } },
        input('storeUrl', '官方商店或 IGDB 游戏页链接'),
            h('button', { id: this.props.forID, type: 'button', disabled: this.state.loading, onClick: () => this.fetchMetadata(), style: { minHeight: '38px', padding: '7px 14px', cursor: this.state.loading ? 'wait' : 'pointer' } }, this.state.loading ? '抓取中…' : '抓取商店资料'),
          ),
          input('cover', '封面图片 URL'),
          text('description', '游戏简介'),
          h('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: '10px' } }, input('releaseDate', '发售日期', 'date'), input('developer', '开发商'), input('publisher', '发行商')),
          h('label', { style: { display: 'grid', gap: '5px' } }, h('span', null, '游戏类型（可用逗号分隔）'), h('input', { type: 'text', value: Array.isArray(value.genres) ? value.genres.join(', ') : '', onChange: event => this.update('genres', event.target.value.split(/[,，/]/).map(item => item.trim()).filter(Boolean)), style: { width: '100%', minHeight: '38px', padding: '7px 10px', border: '1px solid #68707a', borderRadius: '6px', background: 'transparent', color: 'inherit' } })),
          this.state.message && h('small', { role: 'status' }, this.state.message),
        );
      },
    });
    window.CMS.registerFieldType('game-store-metadata', GameStoreMetadata);
    window.CMS.registerEditorComponent({
      id: 'game-card', label: '游戏卡片', icon: 'sports_esports', trigger: 'button',
      fields: [
        { name: 'store', label: '商店/平台家族', widget: 'select', options: [{ label: 'Steam', value: 'steam' }, { label: '索尼 PlayStation', value: 'playstation' }, { label: '微软 Xbox', value: 'xbox' }, { label: '任天堂', value: 'nintendo' }], required: true },
        { name: 'storeId', label: '商店商品 ID（可选）', widget: 'string', required: false },
        { name: 'title', label: '游戏标题', widget: 'string', required: true },
        { name: 'platform', label: '具体平台', widget: 'string', required: true, hint: '例如 PS Vita、Xbox 360、3DS、Wii U。' },
        { name: 'region', label: '地区', widget: 'string', required: false },
        { name: 'storeUrl', label: '商店链接（可选）', widget: 'string', required: false },
        { name: 'cover', label: '封面图片（可选）', widget: 'image', required: false },
        { name: 'description', label: '简介（可选）', widget: 'text', required: false },
        { name: 'releaseDate', label: '发售日期（可选）', widget: 'string', required: false },
        { name: 'developer', label: '开发商（可选）', widget: 'string', required: false },
        { name: 'publisher', label: '发行商（可选）', widget: 'string', required: false },
        { name: 'genres', label: '类型（用 / 分隔）', widget: 'string', required: false },
      ],
      pattern: /^\[gframe\]([^\]]*)\[\/gframe\]$/,
      fromBlock: match => {
        const [store = '', storeId = '', title = '', platform = '', region = '', storeUrl = '', cover = '', description = '', releaseDate = '', developer = '', publisher = '', genres = ''] = match[1].split('|');
        return { store, storeId, title, platform, region, storeUrl, cover, description, releaseDate, developer, publisher, genres };
      },
      toBlock: fields => {
        const values = ['store', 'storeId', 'title', 'platform', 'region', 'storeUrl', 'cover', 'description', 'releaseDate', 'developer', 'publisher', 'genres'].map(key => String(fields[key] || '').replace(/[|\]]/g, ' ').replace(/\s+/g, ' ').trim());
        return ['steam', 'playstation', 'xbox', 'nintendo'].includes(values[0]) && values[2] && values[3] ? `[gframe]${values.join('|')}[/gframe]` : '';
      },
      toPreview: ({ store = '', title = '', platform = '' }) => `游戏卡片：${title || '待填写'} · ${platform || store}`,
    });
    window.CMS.registerEditorComponent({
      id: 'steam-card',
      label: 'Steam 商品卡片',
      icon: 'sports_esports',
      trigger: 'button',
      fields: [{ name: 'appid', label: 'Steam AppID', widget: 'string', required: true, hint: '填写 Steam 商店链接 /app/ 后面的数字。' }, { name: 'name', label: '标题覆盖（可选）', widget: 'string', required: false }, { name: 'status', label: '游玩状态（可选）', widget: 'string', required: false, hint: '例如：已通关、正在玩、想玩、已评测。' }],
      pattern: /^\[sframe\]\s*(\d{1,12})(?:\|([^|\]]*))?(?:\|([^|\]]*))?\s*\[\/sframe\]$/,
      fromBlock: match => ({ appid: match[1], name: match[2] || '', status: match[3] || '' }),
      toBlock: ({ appid = '', name = '', status = '' }) => {
        const id = String(appid).trim();
        return /^\d{1,12}$/.test(id) ? `[sframe]${id}|${String(name).replace(/[|\]]/g, '')}|${String(status).replace(/[|\]]/g, '')}[/sframe]` : '';
      },
      toPreview: ({ appid = '', name = '', status = '' }) => `Steam 商品卡片（${String(name) || String(appid).replace(/[^0-9]/g, '') || '待填写'}${status ? ` · ${status}` : ''}）`,
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
