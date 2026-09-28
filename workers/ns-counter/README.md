# Blog Worker setup

The Nintendo metadata lookup uses the Nintendo NSUID in the product URL and the NTPrices catalog. The API key stays in a Worker secret; do not put it in `wrangler.toml`, source files, or blog content.

## Configure the catalog key

1. Request an NTPrices API key from [the developer page](https://ntprices.com/developers). Their current legacy v1 response includes product name, cover art, description, release date, developer, publisher, and genres by NSUID. The provider documents v1 retirement for 2026-12-01; migrate this adapter to an equivalent v2 dataset before that date.
2. From this directory, run `wrangler secret put NTPRICES_API_KEY` and enter the key at the prompt.
3. Deploy this Worker with `wrangler deploy`.

NTPrices Free/Indie plans require a source link wherever their data is shown. The game card therefore displays a “资料由 NTPrices 提供” link when this source is used. The Worker caches successful lookups for one day to reduce repeat requests.

Without the secret, Nintendo lookup returns an explicit configuration error; it does not return blank metadata as though the fetch succeeded.
