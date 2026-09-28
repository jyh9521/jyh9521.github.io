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

The metadata editor preserves non-empty existing fields on the first import. It records fields manually edited in the CMS and leaves those overrides intact if another IGDB Game ID is selected. Clear an override explicitly before allowing IGDB data to fill that field.

The D1 visit counter continues to use binding `DB` and `GET /ns/api/counter`.
