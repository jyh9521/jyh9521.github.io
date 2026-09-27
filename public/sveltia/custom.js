(() => {
  const register = () => {
    if (!window.CMS?.registerEditorComponent) return false;
    window.CMS.registerEditorComponent({
      id: 'steam-card',
      label: 'Steam 商品卡片',
      icon: 'sports_esports',
      trigger: 'button',
      fields: [{ name: 'appid', label: 'Steam AppID', widget: 'string', required: true, hint: '填写 Steam 商店链接 /app/ 后面的数字。' }],
      pattern: /^\[sframe\]\s*(\d{1,12})\s*\[\/sframe\]$/,
      fromBlock: match => ({ appid: match[1] }),
      toBlock: ({ appid = '' }) => {
        const id = String(appid).trim();
        return /^\d{1,12}$/.test(id) ? `[sframe]${id}[/sframe]` : '';
      },
      toPreview: ({ appid = '' }) => `Steam 商品卡片（AppID：${String(appid).replace(/[^0-9]/g, '') || '待填写'}）`,
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
