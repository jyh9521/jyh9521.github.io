const fs = require('node:fs');
async function auditLinks(urls, fetcher = fetch) {
  const results = [];
  const queue = [...new Set(urls)];
  const worker = async () => {
    while (queue.length) {
      const url = queue.shift();
      if (new URL(url).pathname === '/ns/api/games/media') { results.push({ url, state: 'dynamic-media', note: '受上游速率限制的动态图片，不在发布时批量抓取' }); continue; }
      try {
        const response = await fetcher(url, { method: 'HEAD', redirect: 'follow', signal: AbortSignal.timeout(8000) });
        results.push({ url, status: response.status, state: [404, 410].includes(response.status) ? 'broken' : response.ok ? 'ok' : 'unknown' });
        await response.body?.cancel();
      } catch { results.push({ url, state: 'unknown', note: '超时或网络不可达，不等同于文件已删除' }); }
    }
  };
  await Promise.all(Array.from({ length: Math.min(5, queue.length) }, worker));
  return results;
}
module.exports = { auditLinks };
if (require.main === module) {
  const report = JSON.parse(fs.readFileSync('reports/content-check.json', 'utf8'));
  auditLinks(report.remote).then(results => {
    fs.writeFileSync('reports/link-audit.json', JSON.stringify(results, null, 2));
    for (const item of results) if (item.state === 'broken') console.log(`::warning::External link returned ${item.status}: ${item.url}`);
    console.log(`Online audit: ${results.filter(x => x.state === 'ok').length} OK, ${results.filter(x => x.state === 'broken').length} broken, ${results.filter(x => x.state === 'unknown').length} unconfirmed, ${results.filter(x => x.state === 'dynamic-media').length} dynamic media.`);
  }).catch(e => { console.error(`Online audit error: ${e.message}`); process.exitCode = 1; });
}
