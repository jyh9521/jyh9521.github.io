export default {
  async fetch(request, env) {
    const url = new URL(request.url);
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
