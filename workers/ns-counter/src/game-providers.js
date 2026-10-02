const clean = value => String(value ?? '').trim();
const list = value => (Array.isArray(value) ? value : value ? [value] : []).map(item => clean(item?.name ?? item)).filter(Boolean);
const yearOf = value => {
  const match = clean(value).match(/(?:19|20)\d{2}/);
  return match ? Number(match[0]) : null;
};
const normalizeTitle = value => clean(value).normalize('NFKC').toLocaleLowerCase()
  .replace(/\([^)]*\)|（[^）]*）|\[[^\]]*\]/g, ' ')
  .replace(/\b(remake|remaster|definitive edition|goty edition)\b/g, ' ')
  .replace(/バイオハザード/g, 'resident evil').replace(/biohazard/g, 'resident evil')
  .replace(/[^\p{L}\p{N}]+/gu, '');
const hasJapaneseScript = value => /[\u3040-\u30ff]/.test(clean(value));
const sourceFields = (source, fields) => Object.fromEntries(fields.filter(([key, value]) => Array.isArray(value) ? value.length > 0 : Boolean(clean(value))).map(([key]) => [key, source]));
const unwrapGames = value => {
  if (Array.isArray(value)) return value.flatMap(unwrapGames);
  if (!value || typeof value !== 'object') return [];
  if (Array.isArray(value.jeu)) return value.jeu.flatMap(unwrapGames);
  if (value.jeu && typeof value.jeu === 'object') return [value.jeu];
  return [value];
};

function preferredTitle({ defaultName, originalName, aliases = [], localizedNames = {} }) {
  return clean(localizedNames.zhHans) || clean(localizedNames.zhHant)
    || (hasJapaneseScript(originalName) ? clean(originalName) : '')
    || clean(originalName) || clean(defaultName);
}

export function normalizeRawgGame(game) {
  const aliases = list(game.alternative_names);
  const originalName = clean(game.name_original) || clean(game.name);
  const title = preferredTitle({ defaultName: game.name, originalName, aliases });
  const platforms = (game.platforms || []).map(item => clean(item.platform?.name || item.name)).filter(Boolean);
  const developers = list(game.developers);
  const publishers = list(game.publishers);
  const normalized = {
    id: `rawg:${game.id}`, title, localizedName: '', originalName, alternativeNames: aliases,
    description: clean(game.description_raw || game.description), releaseDate: clean(game.released),
    developers, publishers, platforms, genres: list(game.genres),
    cover: clean(game.background_image || game.background_image_additional),
    screenshots: (Array.isArray(game.short_screenshots) ? game.short_screenshots : [])
      .map(item => clean(item?.image)).filter(Boolean),
    website: clean(game.website), sources: { rawg: { id: String(game.id) } },
    fieldSources: {}, updatedAt: new Date().toISOString(),
  };
  normalized.fieldSources = sourceFields('rawg', ['title', 'localizedName', 'originalName', 'alternativeNames', 'description', 'releaseDate', 'developers', 'publishers', 'platforms', 'genres', 'cover', 'screenshots', 'website'].map(key => [key, normalized[key]]));
  return normalized;
}

function screenNames(game) {
  const namesValue = game.noms || game.names || {};
  const names = Array.isArray(namesValue)
    ? Object.fromEntries(namesValue.map(item => [clean(item?.region || item?.lang || item?.id), item?.text || item?.nom || item?.name || '']))
    : namesValue;
  const localizedNames = {
    zhHans: clean(names.nom_cn || names.nom_zh_cn || names.nom_zh),
    zhHant: clean(names.nom_tw || names.nom_hk || names.nom_zh_tw),
  };
  const aliases = [...new Set(Object.entries(names).filter(([key]) => /^nom_/.test(key) || /^(cn|zh|tw|hk|jp|ja|en|us|eu|fr|de)$/i.test(key)).map(([, value]) => clean(value?.text || value?.nom || value?.name || value)).filter(Boolean))];
  const originalName = clean(game.nom || game.nom_ss || game.name || game.nom_jp);
  const defaultName = clean(game.nom || game.nom_ss || game.name);
  return { localizedNames, aliases, originalName, title: preferredTitle({ defaultName, originalName, aliases, localizedNames }) };
}

export function normalizeScreenScraperGame(game, system = {}) {
  const { localizedNames, aliases, originalName, title } = screenNames(game);
  const dates = game.dates || {};
  const dateValues = Object.values(dates).map(value => clean(value?.text || value?.date || value)).filter(value => /^\d{4}-\d{2}-\d{2}$/.test(value));
  const synopsis = game.synopsis || {};
  const synopsisObject = Array.isArray(synopsis)
    ? Object.fromEntries(synopsis.map(item => [clean(item?.langue || item?.lang || item?.id), item?.text || item?.synopsis || '']))
    : synopsis;
  const localizedSynopsis = Object.entries(synopsisObject).find(([key, value]) => /synopsis_(?:zh|cn)/i.test(key) && clean(value));
  const englishSynopsis = Object.entries(synopsisObject).find(([key, value]) => /synopsis_(?:en|us)/i.test(key) && clean(value));
  const synopsisText = clean(localizedSynopsis?.[1] || englishSynopsis?.[1] || game.synopsis_en || (typeof synopsis === 'string' ? synopsis : ''));
  const genres = game.genres || {};
  const genreValues = Object.values(genres).flatMap(value => Array.isArray(value) ? value : [value])
    .map(item => clean(item?.text || item?.nom || item?.genre || item)).filter(Boolean);
  const media = game.medias || {};
  const mediaEntries = Array.isArray(media) ? media.map(item => [clean(item?.type || item?.typeMedia || item?.id), item]) : Object.entries(media);
  const screenshots = mediaEntries.filter(([key]) => /screenshot|screen/i.test(key)).flatMap(([, value]) => {
    const entries = Array.isArray(value) ? value : [value];
    return entries.map(item => clean(item?.url || item?.text || item)).filter(value => /^https?:\/\//i.test(value));
  });
  const cover = mediaEntries.filter(([key]) => /boitier.*2d|box.*2d|media.*wheel|media.*marquee|mix.?vignette/i.test(key))
    .flatMap(([, value]) => (Array.isArray(value) ? value : [value]).map(item => clean(item?.url || item?.text || item)))
    .find(value => /^https?:\/\//i.test(value)) || '';
  const systemId = clean(game.systeme?.id || system.id);
  const normalized = {
    id: `screenscraper:${clean(game.id)}`, title, localizedName: localizedNames.zhHans || localizedNames.zhHant,
    originalName, alternativeNames: aliases, description: synopsisText, releaseDate: dateValues.sort()[0] || '',
    developers: list(game.developpeur?.text || game.developpeur), publishers: list(game.editeur?.text || game.editeur),
    platforms: [clean(game.systeme?.nom || system.name)].filter(Boolean), genres: [...new Set(genreValues)],
    cover, screenshots: [...new Set(screenshots)], website: '',
    sources: { screenscraper: { id: clean(game.id), systemId } }, fieldSources: {}, updatedAt: new Date().toISOString(),
  };
  normalized.fieldSources = sourceFields('screenscraper', ['title', 'localizedName', 'originalName', 'alternativeNames', 'description', 'releaseDate', 'developers', 'publishers', 'platforms', 'genres', 'cover', 'screenshots', 'website'].map(key => [key, normalized[key]]));
  return normalized;
}

export function mergeMetadata(primary, secondary) {
  if (!primary) return secondary;
  if (!secondary) return primary;
  const merged = { ...primary, sources: { ...primary.sources, ...secondary.sources }, fieldSources: { ...primary.fieldSources } };
  for (const key of ['localizedName', 'originalName', 'description', 'releaseDate', 'cover', 'website']) {
    if (!merged[key] && secondary[key]) { merged[key] = secondary[key]; merged.fieldSources[key] = Object.keys(secondary.sources || {})[0] || 'manual'; }
  }
  for (const key of ['alternativeNames', 'developers', 'publishers', 'platforms', 'genres', 'screenshots']) {
    merged[key] = [...new Set([...(primary[key] || []), ...(secondary[key] || [])])];
  }
  merged.title = primary.localizedName || secondary.localizedName || primary.title || secondary.title;
  merged.updatedAt = new Date().toISOString();
  return merged;
}

export function areSameGame(a, b) {
  const aTitles = new Set([a.title, a.originalName, ...(a.alternativeNames || [])].map(normalizeTitle).filter(Boolean));
  const bTitles = [b.title, b.originalName, ...(b.alternativeNames || [])].map(normalizeTitle).filter(Boolean);
  if (!bTitles.some(title => aTitles.has(title))) return false;
  const ay = yearOf(a.releaseDate), by = yearOf(b.releaseDate);
  if (ay && by && Math.abs(ay - by) > 1) return false;
  const ap = new Set((a.platforms || []).map(normalizeTitle));
  const bp = (b.platforms || []).map(normalizeTitle);
  if (ap.size && bp.length && !bp.some(platform => ap.has(platform))) {
    // Region/provider platform catalogs use different labels; let developer/year evidence still link them.
    const ad = new Set((a.developers || []).map(normalizeTitle));
    if (!(ay && by && Math.abs(ay - by) <= 1 && (b.developers || []).some(name => ad.has(normalizeTitle(name))))) return false;
  }
  return true;
}

export function combineCandidates(rawg, screenscraper) {
  const results = rawg.map(game => ({ ...game, sources: { ...game.sources } }));
  for (const secondary of screenscraper) {
    const match = results.find(candidate => areSameGame(candidate, secondary));
    if (match) Object.assign(match, mergeMetadata(match, secondary));
    else results.push(secondary);
  }
  return results.map(game => ({ ...game, year: yearOf(game.releaseDate) || '' }));
}

export class GameMetadataProvider {
  async search() { throw new Error('search() must be implemented by a metadata provider'); }
  async getById() { throw new Error('getById() must be implemented by a metadata provider'); }
}

export class RAWGProvider extends GameMetadataProvider {
  constructor(env) { super(); this.env = env; }
  async request(path, params = {}) {
    if (!this.env.RAWG_API_KEY) throw new Error('RAWG_API_KEY 未配置');
    const url = new URL(`https://api.rawg.io/api/${path}`);
    url.searchParams.set('key', this.env.RAWG_API_KEY);
    for (const [key, value] of Object.entries(params)) url.searchParams.set(key, String(value));
    const response = await fetch(url, { signal: AbortSignal.timeout(10000) });
    if (!response.ok) throw new Error(`RAWG 请求失败（${response.status}）`);
    return response.json();
  }
  async search(query) {
    const response = await this.request('games', { search: query, page_size: 12 });
    return (response.results || []).map(normalizeRawgGame);
  }
  async getById(id) {
    const game = await this.request(`games/${encodeURIComponent(id)}`);
    let normalized = normalizeRawgGame(game);
    try {
      const shots = await this.request(`games/${encodeURIComponent(id)}/screenshots`, { page_size: 8 });
      normalized.screenshots = [...new Set([...normalized.screenshots, ...(shots.results || []).map(item => clean(item.image)).filter(Boolean)])];
    } catch { /* Screenshots are optional enrichment. */ }
    return normalized;
  }
}

export class ScreenScraperProvider extends GameMetadataProvider {
  constructor(env) { super(); this.env = env; }
  async request(endpoint, params = {}) {
    if (!this.env.SCREENSCRAPER_DEV_ID || !this.env.SCREENSCRAPER_DEV_PASSWORD) throw new Error('ScreenScraper 开发者凭据未配置');
    const url = new URL(`https://api.screenscraper.fr/api2/${endpoint}.php`);
    const values = {
      devid: this.env.SCREENSCRAPER_DEV_ID,
      devpassword: this.env.SCREENSCRAPER_DEV_PASSWORD,
      softname: this.env.SCREENSCRAPER_SOFTNAME || 'blfy-blog', output: 'json',
      ...(this.env.SCREENSCRAPER_USER_ID ? { ssid: this.env.SCREENSCRAPER_USER_ID } : {}),
      ...(this.env.SCREENSCRAPER_USER_PASSWORD ? { sspassword: this.env.SCREENSCRAPER_USER_PASSWORD } : {}),
      ...params,
    };
    for (const [key, value] of Object.entries(values)) if (value !== undefined && value !== '') url.searchParams.set(key, String(value));
    const response = await fetch(url, { signal: AbortSignal.timeout(12000) });
    if (!response.ok) throw new Error(`ScreenScraper 请求失败（${response.status}）`);
    return response.json();
  }
  async search(query) {
    const data = await this.request('jeuRecherche', { recherche: query });
    const systemData = data?.response?.systemes?.systeme || data?.response?.systemes || [];
    const systemList = Array.isArray(systemData) ? systemData : [systemData];
    const systems = new Map(systemList.filter(Boolean).map(item => [String(item.systeme?.id || item.id), item.systeme || item]));
    const games = unwrapGames(data?.response?.jeux || data?.jeux || [])
      .filter(game => game?.id && game.notgame !== true && game.notgame !== 'true')
      .map(game => normalizeScreenScraperGame(game, systems.get(String(game.systeme?.id)) || {}));
    return games;
  }
  async getById(id, systemId) {
    if (!systemId) throw new Error('ScreenScraper 结果缺少 systemId，无法读取详情');
    const data = await this.request('jeuInfos', { gameid: id, systemeid: systemId });
    const game = data?.response?.jeu || data?.jeu;
    if (!game?.id) throw new Error('ScreenScraper 没有找到该游戏');
    return normalizeScreenScraperGame(game, game.systeme || { id: systemId });
  }
}

// Reserved provider contract. Add IGDB here when credentials become available;
// routes and CMS consume only normalized GameMetadata.
export class IGDBProvider extends GameMetadataProvider {
  async search() { throw new Error('IGDB provider is not configured'); }
  async getById() { throw new Error('IGDB provider is not configured'); }
}
