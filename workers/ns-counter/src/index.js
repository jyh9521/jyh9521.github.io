export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const metadataHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "public, max-age=300, s-maxage=3600",
      "Content-Type": "application/json; charset=utf-8",
    };
    if (url.pathname === "/ns/api/game-metadata") {
      if (request.method !== "GET") return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405, headers: { ...metadataHeaders, "Allow": "GET" } });
      try {
        const requested = new URL(url.searchParams.get("url") || "");
        const hostAllowed = (host) => ["store.steampowered.com", "playstation.com", "xbox.com", "store-jp.nintendo.com", "store.nintendo.com", "store.epicgames.com", "gog.com", "store.ubisoft.com", "ea.com", "battle.net", "itch.io", "apps.microsoft.com", "igdb.com"].some(domain => host === domain || host.endsWith(`.${domain}`));
        if (requested.protocol !== "https:" || requested.port && requested.port !== "443" || requested.username || requested.password || !hostAllowed(requested.hostname)) {
          return new Response(JSON.stringify({ error: "请使用支持的 PC/主机官方商店链接或 IGDB 游戏页面。" }), { status: 400, headers: { ...metadataHeaders, "Cache-Control": "no-store" } });
        }

        const steamMatch = requested.hostname === "store.steampowered.com" && requested.pathname.match(/^\/app\/(\d{1,12})(?:\/|$)/);
        if (steamMatch) {
          const appid = steamMatch[1];
          const response = await fetch(`https://store.steampowered.com/api/appdetails?appids=${appid}&cc=cn&l=schinese`, { headers: { "Accept": "application/json" } });
          if (!response.ok) throw new Error("Steam 暂时没有返回商品资料。");
          const payload = await response.json();
          const entry = Object.values(payload || {}).find(item => item?.success && Number(item.data?.steam_appid) === Number(appid));
          const data = entry?.data;
          if (!data) return new Response(JSON.stringify({ error: "没有找到对应的 Steam 商品。" }), { status: 404, headers: { ...metadataHeaders, "Cache-Control": "no-store" } });
          const metadata = {
            storeId: String(appid),
            storeUrl: requested.href,
            cover: typeof data.header_image === "string" && data.header_image.startsWith("https://") ? data.header_image : "",
            description: String(data.short_description || "").replace(/<[^>]*>/g, ""),
            releaseDate: String(data.release_date?.date || "").match(/\d{4}-\d{2}-\d{2}/)?.[0] || "",
            developer: Array.isArray(data.developers) ? data.developers.join(", ") : "",
            publisher: Array.isArray(data.publishers) ? data.publishers.join(", ") : "",
            genres: Array.isArray(data.genres) ? data.genres.map(item => String(item.description || "")).filter(Boolean) : [],
            catalogSource: "Steam Store",
            catalogId: String(appid),
          };
          return Response.json(metadata, { headers: metadataHeaders });
        }

        const response = await fetch(requested.href, { headers: { "Accept": "text/html,application/xhtml+xml", "User-Agent": "Mozilla/5.0 (compatible; BlogGameMetadata/1.0)" }, redirect: "follow" });
        const finalUrl = new URL(response.url || requested.href);
        if (!response.ok || !hostAllowed(finalUrl.hostname)) throw new Error("官方商店页面暂时无法读取，请检查链接或稍后重试。");
        const html = await response.text();
        // Nintendo's store currently responds to non-browser requests with a
        // JavaScript/cookie challenge and a 200 status, not product metadata.
        // Detect it explicitly so the CMS never reports a blank successful fetch.
        if (requested.hostname === "store-jp.nintendo.com" && /navigator\.cookieEnabled|\?c=ncl|cookietest=/.test(html)) {
          throw new Error("任天堂商店返回了浏览器验证页，暂时没有可抓取的商品资料。请稍后重试，或先手动填写资料。");
        }
        const decode = (value) => String(value || "").replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">" ).replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code))).replace(/&#x([\da-f]+);/gi, (_, code) => String.fromCodePoint(parseInt(code, 16))).trim();
        const metas = {};
        for (const tag of html.matchAll(/<meta\b[^>]*>/gi)) {
          const attrs = Object.fromEntries([...tag[0].matchAll(/([\w:-]+)\s*=\s*(["'])(.*?)\2/gs)].map(match => [match[1].toLowerCase(), decode(match[3])]));
          const key = (attrs.property || attrs.name || "").toLowerCase();
          if (key && attrs.content) metas[key] = attrs.content;
        }
        const structured = [];
        for (const match of html.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
          try { structured.push(JSON.parse(match[1].replace(/<!--|-->/g, "").trim())); } catch { /* Ignore malformed structured metadata. */ }
        }
        const objects = [];
        const collect = (value) => { if (Array.isArray(value)) value.forEach(collect); else if (value && typeof value === "object") { objects.push(value); Object.values(value).forEach(item => { if (item && typeof item === "object") collect(item); }); } };
        structured.forEach(collect);
        const first = (...values) => values.flatMap(value => Array.isArray(value) ? value : [value]).map(value => typeof value === "string" ? decode(value) : value?.name ? decode(value.name) : "").find(Boolean) || "";
        const game = objects.find(item => /VideoGame|Product/i.test(String(item["@type"] || ""))) || {};
        const pageTitle = metas["og:title"] || metas["twitter:title"] || game.name || (html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] || "");
        const description = metas["og:description"] || metas.description || game.description || "";
        const image = first(metas["og:image"], metas["twitter:image"], game.image);
        const releaseValue = first(metas.releasedate, metas.release_date, game.datePublished, game.releaseDate, game.release_date);
        const locale = finalUrl.pathname.match(/(?:^|\/)([a-z]{2,3}-[a-z]{2,3}-[a-z]{2})(?:\/|$)/i)?.[1] || "";
        const region = locale.slice(-2).toLowerCase();
        const timezone = ({ hk: "Asia/Hong_Kong", tw: "Asia/Taipei", jp: "Asia/Tokyo", cn: "Asia/Shanghai", us: "America/Los_Angeles", gb: "Europe/London" })[region] || "UTC";
        const date = /^\d{4}-\d{2}-\d{2}$/.test(releaseValue) ? releaseValue : Number.isFinite(Date.parse(releaseValue))
          ? new Intl.DateTimeFormat("en-CA", { timeZone: timezone, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(releaseValue))
          : "";
        const isIgdb = finalUrl.hostname === "igdb.com" || finalUrl.hostname.endsWith(".igdb.com");
        const metadata = {
          storeUrl: requested.href,
          cover: /^https:\/\//i.test(image) ? image : "",
          description: decode(description).replace(/<[^>]*>/g, "").slice(0, 4000),
          releaseDate: date,
          developer: first(game.developer, game.author, metas.developer),
          publisher: first(game.publisher, metas.publisher),
          genres: Array.isArray(game.genre) ? game.genre.map(decode) : game.genre ? [decode(game.genre)] : metas.genre ? [decode(metas.genre)] : [],
          catalogSource: isIgdb ? "IGDB" : finalUrl.hostname,
          catalogId: isIgdb ? (finalUrl.pathname.match(/^\/games\/([^/]+)/)?.[1] || "") : "",
          title: decode(pageTitle).replace(/\s*[|｜–—-]\s*(PlayStation|Xbox|Nintendo)(?:\s+Store)?\s*$/i, "").trim(),
        };
        const cacheHeaders = { ...metadataHeaders, "Cache-Control": "public, max-age=1800, s-maxage=86400" };
        return Response.json(metadata, { headers: cacheHeaders });
      } catch (error) {
        const status = error instanceof TypeError ? 400 : 502;
        return Response.json({ error: error instanceof TypeError ? "请粘贴有效的官方商品链接。" : error instanceof Error ? error.message : "商店资料暂时不可用。" }, { status, headers: { ...metadataHeaders, "Cache-Control": "no-store" } });
      }
    }
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
      // Steam may return redirected app details under a different response key.
      const entry = Object.values(payload || {}).find(item => item?.success && Number(item.data?.steam_appid) === Number(appid));
      const data = entry?.data;
      if (!data) return Response.json({ error: "未找到该 Steam 商品" }, { status: 404, headers: { "Cache-Control": "no-store" } });
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
