(() => {
  const register = () => {
    if (!window.CMS?.registerEditorComponent) return false;
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
