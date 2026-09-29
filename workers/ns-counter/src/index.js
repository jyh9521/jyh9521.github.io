import { DurableObject } from "cloudflare:workers";

const jsonHeaders = { "Access-Control-Allow-Origin": "*", "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" };
class IgdbError extends Error {
  constructor(message, status = 502) { super(message); this.status = status; }
}
async function igdbQuery(env, body) {
  const id = env.IGDB_API.idFromName("global-igdb-api");
  const stub = env.IGDB_API.get(id);
  const response = await stub.fetch("https://igdb-api.internal/query", { method: "POST", body });
  const data = await response.json();
  if (!response.ok) throw new IgdbError(data.error || "IGDB 查询失败，请稍后重试。", response.status === 429 ? 429 : 502);
  return data;
}

const coverUrl = id => id ? `https://images.igdb.com/igdb/image/upload/t_cover_big_2x/${encodeURIComponent(id)}.jpg` : "";
const dateString = value => value ? new Date(Number(value) * 1000).toISOString().slice(0, 10) : "";
async function cachedJson(key, ttl, producer) {
  const request = new Request(`https://igdb-result-cache.invalid/${key}`);
  const cached = await caches.default.match(request);
  if (cached) return cached;
  const response = Response.json(await producer(), { headers: { ...jsonHeaders, "Cache-Control": `public, max-age=${ttl}` } });
  await caches.default.put(request, response.clone());
  return response;
}

function preferredName(game) {
  const alternatives = Array.isArray(game.alternative_names) ? game.alternative_names : [];
  const localizations = Array.isArray(game.game_localizations) ? game.game_localizations : [];
  const alt = pattern => alternatives.find(item => pattern.test(String(item.comment || "")) && item.name)?.name || "";
  const localized = pattern => localizations.find(item => pattern.test(String(item.region?.name || "")) && item.name)?.name || "";
  return alt(/simplified\s*chinese|chinese\s*simplified|简体中文/i) || localized(/china|mainland/i)
    || alt(/traditional\s*chinese|chinese\s*traditional|繁體中文/i) || localized(/taiwan|hong\s*kong|macau/i)
    || alt(/japanese\s*(?:title|name)|日本語|日文/i) || alt(/korean\s*(?:title|name)|한국어|韩文/i)
    || alt(/original\s*(?:title|name)|original name/i) || game.name || "";
}

function publicGame(game) {
  const developers = (game.involved_companies || []).filter(item => item.developer && item.company?.name).map(item => item.company.name);
  return {
    id: String(game.id),
    slug: String(game.slug || ""),
    title: preferredName(game),
    cover: coverUrl(game.cover?.image_id),
    releaseDate: dateString(game.first_release_date),
    developer: [...new Set(developers)].join(", "),
    platforms: [...new Set((game.platforms || []).map(item => item.name).filter(Boolean))],
    description: String(game.summary || "").slice(0, 5000),
  };
}

const SEARCH_FIELDS = "id,name,slug,first_release_date,cover.image_id,platforms.name,game_localizations.name,game_localizations.region.name,alternative_names.name,alternative_names.comment";
const DETAIL_FIELDS = `${SEARCH_FIELDS},summary,involved_companies.developer,involved_companies.company.name`;

export class IgdbApi extends DurableObject {
  constructor(ctx, env) {
    super(ctx, env);
    this.queue = Promise.resolve();
    this.token = "";
    this.tokenExpiresAt = 0;
    this.tokenPromise = undefined;
  }

  fetch(request) {
    if (request.method !== "POST" || new URL(request.url).pathname !== "/query") return Response.json({ error: "Not found" }, { status: 404 });
    const task = this.queue.then(() => this.runQuery(request));
    this.queue = task.catch(() => undefined);
    return task;
  }

  async getToken() {
    if (this.token && this.tokenExpiresAt > Date.now() + 300000) return this.token;
    if (!this.tokenPromise) this.tokenPromise = (async () => {
      const body = new URLSearchParams({ client_id: this.env.TWITCH_CLIENT_ID, client_secret: this.env.TWITCH_CLIENT_SECRET, grant_type: "client_credentials" });
      const response = await fetch("https://id.twitch.tv/oauth2/token", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body, signal: AbortSignal.timeout(10000) });
      const data = await response.json();
      if (!response.ok || !data.access_token) throw new Error("Twitch 身份验证失败，请检查 Worker Secrets 配置。");
      this.token = data.access_token;
      this.tokenExpiresAt = Date.now() + Number(data.expires_in || 3600) * 1000;
      return this.token;
    })().finally(() => { this.tokenPromise = undefined; });
    return this.tokenPromise;
  }

  async runQuery(request) {
    try {
      const body = await request.text();
      if (!body || body.length > 4096) return Response.json({ error: "IGDB 查询内容无效。" }, { status: 400, headers: jsonHeaders });
      const token = await this.getToken();
      const lastAt = Number(await this.ctx.storage.get("lastRequestAt") || 0);
      const wait = Math.max(0, 275 - (Date.now() - lastAt));
      if (wait) await new Promise(resolve => setTimeout(resolve, wait));
      await this.ctx.storage.put("lastRequestAt", Date.now());
      const response = await fetch("https://api.igdb.com/v4/games", {
        method: "POST",
        headers: { "Client-ID": this.env.TWITCH_CLIENT_ID, Authorization: `Bearer ${token}`, Accept: "application/json", "Content-Type": "text/plain" },
        body,
        signal: AbortSignal.timeout(12000),
      });
      const text = await response.text();
      if (!response.ok) return Response.json({ error: response.status === 429 ? "IGDB 请求较多，请稍等片刻再试。" : `IGDB 查询失败（${response.status}）：${text.slice(0, 160)}` }, { status: response.status === 429 ? 429 : 502, headers: jsonHeaders });
      return new Response(text, { headers: jsonHeaders });
    } catch (error) {
      return Response.json({ error: error instanceof Error ? error.message : "IGDB 服务暂时不可用。" }, { status: 502, headers: jsonHeaders });
    }
  }
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (url.pathname === "/ns/api/igdb/search" || url.pathname === "/ns/api/igdb/game") {
      if (request.method !== "GET") return Response.json({ error: "只支持 GET 请求。" }, { status: 405, headers: { ...jsonHeaders, Allow: "GET" } });
      if (!env.TWITCH_CLIENT_ID || !env.TWITCH_CLIENT_SECRET) return Response.json({ error: "IGDB 服务尚未配置。请先设置 TWITCH_CLIENT_ID 和 TWITCH_CLIENT_SECRET。" }, { status: 503, headers: jsonHeaders });
      try {
        if (url.pathname.endsWith("/search")) {
          const query = (url.searchParams.get("q") || "").trim().slice(0, 100);
          if (query.length < 2) return Response.json({ error: "请输入至少两个字符。" }, { status: 400, headers: jsonHeaders });
          return await cachedJson(`search/${encodeURIComponent(query.toLocaleLowerCase())}`, 3600, async () => {
            const safe = query.replace(/\\/g, "\\\\").replace(/"/g, "\\\"");
            const games = await igdbQuery(env, `search "${safe}"; fields ${SEARCH_FIELDS}; limit 12;`);
            const results = games.map(game => ({ id: String(game.id), title: preferredName(game), cover: coverUrl(game.cover?.image_id), year: game.first_release_date ? new Date(game.first_release_date * 1000).getUTCFullYear() : "", platforms: [...new Set((game.platforms || []).map(item => item.name).filter(Boolean))] }));
            return { results };
          });
        }
        const id = url.searchParams.get("id") || "";
        if (!/^\d{1,12}$/.test(id)) return Response.json({ error: "请选择有效的 IGDB Game ID。" }, { status: 400, headers: jsonHeaders });
        return await cachedJson(`game/${id}`, 86400, async () => {
          const games = await igdbQuery(env, `fields ${DETAIL_FIELDS}; where id = ${id}; limit 1;`);
          if (!games.length) throw new Error("IGDB 中没有找到该游戏。");
          return publicGame(games[0]);
        });
      } catch (error) {
        const status = /没有找到/.test(String(error?.message)) ? 404 : error instanceof IgdbError ? error.status : 502;
        return Response.json({ error: error instanceof Error ? error.message : "IGDB 服务暂时不可用，请稍后重试。" }, { status, headers: jsonHeaders });
      }
    }
    if (url.pathname !== "/ns/api/counter") return new Response("Not found", { status: 404 });
    if (request.method === "GET") {
      const row = await env.DB.prepare("SELECT count FROM visit_counter WHERE id = 'ns'").first();
      return Response.json({ pageViews: Number(row?.count || 0) }, { headers: { "Cache-Control": "no-store" } });
    }
    if (request.method !== "POST") return new Response("Method not allowed", { status: 405, headers: { Allow: "GET, POST", "Cache-Control": "no-store" } });

    let visitorId = "";
    try {
      const body = await request.json();
      if (typeof body?.visitorId === "string" && /^[\w-]{16,128}$/.test(body.visitorId)) visitorId = body.visitorId;
    } catch { /* A malformed visitor ID still counts as a page view. */ }

    const row = await env.DB.prepare(
      "INSERT INTO visit_counter (id, count) VALUES ('ns', 1) " +
      "ON CONFLICT(id) DO UPDATE SET count = count + 1 RETURNING count"
    ).first();
    if (visitorId) await env.DB.prepare("INSERT INTO visit_visitors (visitor_id) VALUES (?) ON CONFLICT(visitor_id) DO NOTHING").bind(visitorId).run();
    const unique = await env.DB.prepare("SELECT COUNT(*) AS count FROM visit_visitors").first();
    return Response.json({ pageViews: Number(row.count), uniqueVisitors: Number(unique?.count || 0) }, { headers: { "Cache-Control": "no-store" } });
  },
};
