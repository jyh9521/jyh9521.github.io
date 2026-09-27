export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const steamMatch = url.pathname.match(/^\/ns\/api\/steam\/app\/(\d{1,12})$/);
    if (steamMatch) {
      if (request.method !== "GET") {
        return new Response("Method not allowed", { status: 405, headers: { "Allow": "GET", "Cache-Control": "no-store" } });
      }
      const appid = steamMatch[1];
      const cacheKey = new Request(`https://steam-cache.invalid/ns/api/steam/app/${appid}`);
      const cache = caches.default;
      const cached = await cache.match(cacheKey);
      if (cached) return cached;
      const upstream = await fetch(`https://store.steampowered.com/api/appdetails?appids=${appid}&cc=cn&l=schinese`, {
        headers: { "Accept": "application/json" },
      });
      if (!upstream.ok) return Response.json({ error: "Steam 商品信息暂不可用" }, { status: 502, headers: { "Cache-Control": "no-store" } });
      const payload = await upstream.json();
      const data = payload?.[appid]?.data;
      if (!payload?.[appid]?.success || !data) return Response.json({ error: "未找到该 Steam 商品" }, { status: 404, headers: { "Cache-Control": "no-store" } });
      const result = {
        appid: Number(appid),
        name: String(data.name || ""),
        shortDescription: String(data.short_description || "").replace(/<[^>]*>/g, ""),
        headerImage: typeof data.header_image === "string" && data.header_image.startsWith("https://") ? data.header_image : "",
        developers: Array.isArray(data.developers) ? data.developers.slice(0, 5).map(String) : [],
        genres: Array.isArray(data.genres) ? data.genres.slice(0, 4).map(item => String(item.description || "")) : [],
        releaseDate: String(data.release_date?.date || ""),
        platforms: Object.entries(data.platforms || {}).filter(([, supported]) => supported).map(([platform]) => platform),
      };
      const response = Response.json(result, { headers: { "Cache-Control": "public, max-age=300, s-maxage=3600" } });
      ctx.waitUntil(cache.put(cacheKey, response.clone()));
      return response;
    }
    if (url.pathname !== "/ns/api/counter") {
      return new Response("Not found", { status: 404 });
    }
    if (request.method !== "GET") {
      return new Response("Method not allowed", {
        status: 405,
        headers: { "Allow": "GET", "Cache-Control": "no-store" },
      });
    }
    const row = await env.DB.prepare(
      "INSERT INTO visit_counter (id, count) VALUES ('ns', 1) " +
      "ON CONFLICT(id) DO UPDATE SET count = count + 1 RETURNING count"
    ).first();
    return Response.json({ count: Number(row.count) }, {
      headers: { "Cache-Control": "no-store" },
    });
  },
};
