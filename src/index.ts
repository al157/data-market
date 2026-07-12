import { Hono } from "hono";
import { cors } from "hono/cors";

import type { Env } from "./types";
import staticRoutes from "./routes/static";
import queryRoutes from "./routes/query";
import discoveryRoutes from "./routes/discovery";

const app = new Hono<{ Bindings: Env }>();

app.use("*", cors());

// ══════════════════════════════════════
// Global payment guard
// ══════════════════════════════════════
app.use("*", async (c, next) => {
  const path = c.req.path;
  // Log every request
  console.log(`[dm] req: ${c.req.method} ${path}`);

  // Health check & discovery: allow
  if (path === "/health" || path.startsWith("/.well-known/") || path === "/llms.txt" || path === "/mcp.json" || path === "/openapi.json") {
    return next();
  }

  // Protected paths: require payment
  const isProtected = path.startsWith("/data/") || path.startsWith("/datasets/") || path.startsWith("/query/");
  console.log(`[dm] path=${path} protected=${isProtected}`);

  if (!isProtected) {
    return next();
  }

  const paymentSig = c.req.header("payment-signature") || c.req.header("x-payment");
  console.log(`[dm] paymentSig=${!!paymentSig}`);

  if (!paymentSig) {
    // Return 402
    c.res = new Response(
      JSON.stringify({
        error: "Payment Required",
        scheme: "exact",
        price: path.startsWith("/query/") ? "$0.01" : "$0.50",
        network: "eip155:8453",
        payTo: c.env.MERCHANT_ADDRESS || "not_configured",
      }),
      {
        status: 402,
        headers: {
          "Content-Type": "application/json",
          "X-Payment-Required": "true",
          "X-Payment-Network": "eip155:8453",
        },
      },
    );
    return;
  }

  // Has payment — proceed
  await next();
});

// ── Agent 发现 (公开免费) ──
app.route("/", discoveryRoutes);
app.get("/health", (c) =>
  c.json({ status: "ok", service: "data-market", payment: "x402" }),
);

// ── 数据路由 ──
app.route("/data", staticRoutes);
app.route("/datasets", staticRoutes);
app.route("/query", queryRoutes);

app.notFound((c) => c.json({ error: "Not found" }, 404));
app.onError((err, c) => {
  console.error("Unhandled error:", err);
  return c.json({ error: "Internal error" }, 500);
});

export default app;
