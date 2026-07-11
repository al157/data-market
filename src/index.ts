import { Hono } from "hono";
import { cors } from "hono/cors";
import { paymentMiddleware, x402ResourceServer } from "@x402/hono";
import { ExactEvmScheme } from "@x402/evm/exact/server";
import { HTTPFacilitatorClient } from "@x402/core/server";

import type { Env } from "./types";
import { getRoutes, NETWORK } from "./config";
import staticRoutes from "./routes/static";
import queryRoutes from "./routes/query";
import discoveryRoutes from "./routes/discovery";

const app = new Hono<{ Bindings: Env }>();

app.use("*", cors());

// ── Agent 发现机制 (公开，免费) ──
app.route("/", discoveryRoutes);

// ── 健康检查 ──
app.get("/health", (c) =>
  c.json({ status: "ok", service: "data-market", payment: "x402" }),
);

// ── x402 支付中间件（惰性单例） ──
let serverSingleton: x402ResourceServer | null = null;

function getServer(env: Env): x402ResourceServer {
  if (serverSingleton) return serverSingleton;
  const facilitatorUrl = env.FACILITATOR_URL ?? "https://x402.org/facilitator";
  const client = new HTTPFacilitatorClient({ url: facilitatorUrl });
  serverSingleton = new x402ResourceServer(client)
    .register(NETWORK.mainnet, new ExactEvmScheme());
  return serverSingleton;
}

// ── x402 保护的数据路由 ──
for (const path of ["/data/*", "/query/*", "/datasets/*"] as const) {
  app.use(path, async (c, next) => {
    const payTo = c.env.MERCHANT_ADDRESS ?? "";
    if (!payTo) {
      return c.text("MERCHANT_ADDRESS not configured", 500);
    }
    const server = getServer(c.env);
    const routes = getRoutes(payTo);
    return paymentMiddleware(routes, server)(c, next);
  });
}

// ── 子路由 ──
app.route("/data", staticRoutes);
app.route("/datasets", staticRoutes);
app.route("/query", queryRoutes);

// ── 404 ──
app.notFound((c) => c.json({ error: "Not found" }, 404));
app.onError((err, c) => {
  console.error("Unhandled error:", err);
  return c.json({ error: "Internal error" }, 500);
});

export default app;
