(() => {
  const register = () => {
    if (!window.CMS?.registerEditorComponent) return false;
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
