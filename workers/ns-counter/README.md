# Blog API Worker

This Worker serves the visit counter and the IGDB proxy used by the static blog and Sveltia CMS. IGDB/Twitch credentials stay in Cloudflare Worker Secrets; the browser only calls the blog's Worker endpoints.

## IGDB credentials

1. Create a Twitch Developer application with **Client Type: Confidential**, then copy its Client ID and generate a Client Secret. IGDB v4 authenticates through Twitch application credentials.
2. From this directory, store both values as encrypted Worker secrets:

   ```powershell
   wrangler secret put TWITCH_CLIENT_ID
   wrangler secret put TWITCH_CLIENT_SECRET
   ```

3. Deploy the Worker and its SQLite-backed global IGDB request coordinator:

   ```powershell
   wrangler deploy
   ```

The IGDB proxy offers `GET /ns/api/igdb/search?q=...` and `GET /ns/api/igdb/game?id=...`. Search results are cached for one hour and selected-game details for one day. A single global Durable Object serializes upstream requests with at least 275 ms between IGDB calls, below IGDB's documented four-requests-per-second limit. Twitch access tokens stay in Durable Object memory and are refreshed before expiry.

In the CMS game editor, you can either search by name or paste a numeric IGDB Game ID copied from IGDB and select **按 ID 获取资料**. Manual-ID import skips the proxy's name-search request but still needs valid Twitch app credentials in Worker Secrets, because the Worker must authenticate to IGDB to retrieve game details.

The selected IGDB Game ID is stored with each game as its permanent external identity; display names and translated title overrides do not participate in lookup. The metadata editor preserves non-empty existing fields on the first import. It records fields manually edited in the CMS and leaves those overrides intact if another IGDB Game ID is selected. Clear an override explicitly before allowing IGDB data to fill that field.

The D1 visit counter uses `POST /ns/api/counter` to atomically increment page views and register a random browser-local visitor ID for unique-visitor counts. `GET /ns/api/counter` is read-only and returns the current page-view total. The blog footer and NS page share one page-view request during client-side navigation.

Before deploying this counter update, apply the new D1 table migration from this directory, then deploy the Worker:

```powershell
npx wrangler d1 migrations apply ns-counter --remote
npx wrangler deploy
```

The browser uses the same-origin Worker route, so it does not depend on the third-party Busuanzi script host.
