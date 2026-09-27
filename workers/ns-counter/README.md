# NS visitor counter Worker

The static page is deployed at `/ns/` from the repository's `public/ns/` directory. This Worker serves `GET /ns/api/counter` and increments the `ns` row in D1.

1. Create a Cloudflare D1 database named `ns-counter` and execute `schema.sql`.
2. Set the returned database ID as `database_id` in `wrangler.toml` and ensure binding `DB` points to it.
3. From this directory run `npx wrangler deploy`.
4. Configure Worker route `blog.blfy.cc/ns/api/*`; the hostname must route through Cloudflare.

The first visitor count starts at 1. Import a previous total before launch only if you have the old `data/count.txt` value.
