import type { PatchInfo } from '../../lib/patch-info';

export default function PatchInformation({ patch }: { patch: PatchInfo | null }) {
  if (!patch) return null;
  const details = [['支持的游戏版本', patch.gameVersions], ['安装方法', patch.installation], ['兼容性', patch.compatibility], ['已知问题', patch.issues]];
  return <section className="patch-information" aria-labelledby="patch-information-title">
    <div className="patch-information-heading"><h2 id="patch-information-title">汉化补丁信息</h2><span>{patch.version && `版本 ${patch.version}`}{patch.releaseDate && ` · ${patch.releaseDate}`}</span></div>
    <dl>{details.filter(([, value]) => value).map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>
    {patch.downloads.length > 0 && <div className="patch-downloads"><h3>下载补丁</h3>{patch.downloads.map((item, index) => <div key={`${item.url}-${index}`}><a href={item.url} target={item.url.startsWith('http') ? '_blank' : undefined} rel="noopener noreferrer">{item.label} ↗</a>{item.sha256 && <details><summary>SHA256 校验值</summary><code>{item.sha256}</code></details>}</div>)}</div>}
    {patch.changelog.length > 0 && <details className="patch-changelog"><summary>更新记录（{patch.changelog.length}）</summary><ol>{patch.changelog.map((item, index) => <li key={index}><strong>{[item.version, item.date].filter(Boolean).join(' · ') || '更新'}</strong><p>{item.note}</p></li>)}</ol></details>}
  </section>;
}
