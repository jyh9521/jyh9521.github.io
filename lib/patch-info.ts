export type PatchInfo = {
  version: string; releaseDate: string; gameVersions: string; installation: string; compatibility: string; issues: string;
  downloads: { label: string; url: string; sha256: string }[];
  changelog: { version: string; date: string; note: string }[];
};
const text = (value: unknown) => String(value ?? '').trim();
export function patchDownloadUrl(value: unknown): string {
  const url = text(value);
  if (url.startsWith('/') && !url.startsWith('//') && !/[\\\s]/.test(url) && !url.split('/').includes('..')) return url;
  try { const parsed = new URL(url); return ['https:', 'http:'].includes(parsed.protocol) ? parsed.href : ''; } catch { return ''; }
}
export function normalizePatchInfo(value: any): PatchInfo | null {
  if (!value || value.enabled !== true) return null;
  return {
    version: text(value.version), releaseDate: text(value.releaseDate instanceof Date ? value.releaseDate.toISOString().slice(0, 10) : value.releaseDate).slice(0, 10),
    gameVersions: text(value.gameVersions), installation: text(value.installation), compatibility: text(value.compatibility), issues: text(value.issues),
    downloads: (Array.isArray(value.downloads) ? value.downloads : []).flatMap((item: any) => {
      const url = patchDownloadUrl(item?.url);
      return url ? [{ label: text(item.label) || '下载补丁', url, sha256: /^[a-f\d]{64}$/i.test(text(item.sha256)) ? text(item.sha256) : '' }] : [];
    }),
    changelog: (Array.isArray(value.changelog) ? value.changelog : []).filter((item: any) => text(item?.note)).map((item: any) => ({
      version: text(item.version), date: text(item.date instanceof Date ? item.date.toISOString().slice(0, 10) : item.date).slice(0, 10), note: text(item.note),
    })),
  };
}
