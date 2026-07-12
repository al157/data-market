import { Hono } from "hono";
import { cors } from "hono/cors";
import { x402ResourceServer, x402HTTPResourceServer } from "@x402/hono";
import { ExactEvmScheme } from "@x402/evm/exact/server";
import { HTTPFacilitatorClient } from "@x402/core/server";

import type { Env } from "./types";
import { getRoutes, NETWORK } from "./config";
import staticRoutes from "./routes/static";
import queryRoutes from "./routes/query";
import discoveryRoutes from "./routes/discovery";

const app = new Hono<{ Bindings: Env }>();

app.use("*", cors());

// ══════════════════════════════════════
// TEST: Global payment guard
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

// ── 手动 x402 中间件 ──
const PROTECTED_PREFIXES = ["/data/", "/datasets/", "/query/"];

let x402Ready = false;
let x402Config: {
  payTo: string;
  facilitatorUrl: string;
  network: string;
  server: x402ResourceServer;
  routes: any;
} | null = null;

function initX402(env: Env) {
  if (x402Ready) return;
  x402Ready = true;

  const payTo = env.MERCHANT_ADDRESS ?? "";
  if (!payTo) {
    console.error("[data-market] MERCHANT_ADDRESS not configured");
    return;
  }

  const facilitatorUrl = env.FACILITATOR_URL ?? "https://x402.org/facilitator";
  const client = new HTTPFacilitatorClient({ url: facilitatorUrl });
  const server = new x402ResourceServer(client)
    .register(NETWORK.mainnet, new ExactEvmScheme());
  const routes = getRoutes(payTo);

  x402Config = { payTo, facilitatorUrl, network: NETWORK.mainnet, server, routes };
  console.log(`[data-market] x402 ready for ${payTo.substring(0, 10)}... routes: ${Object.keys(routes).join(", ")}`);
}

app.use(async (c, next) => {
  const path = c.req.path;
  const isProtected = PROTECTED_PREFIXES.some((p) => path.startsWith(p));

  if (!isProtected) {
    return next();
  }

  // 首次请求初始化 x402
  initX402(c.env);

  if (!x402Config) {
    // 开发模式 — 无地址，直接放行
    console.log(`[data-market] ⚠️  No MERCHANT_ADDRESS, allowing ${path} (dev mode)`);
    return next();
  }

  // 检查 payment 头
  const paymentSignature = c.req.header("payment-signature") || c.req.header("x-payment");
  const price = path.startsWith("/query") ? "$0.01" : "$0.50";

  if (!paymentSignature) {
    // 返回 402 Payment Required
    const paymentReq = {
      accepts: [
        {
          scheme: "exact",
          price,
          network: x402Config.network,
          payTo: x402Config.payTo,
          maxTimeoutSeconds: 300,
        },
      ],
      resource: { url: c.req.url, description: "Data market dataset" },
    };

    c.res = new Response(
      JSON.stringify(paymentReq),
      {
        status: 402,
        headers: {
          "Content-Type": "application/json",
          "Payment-Required": JSON.stringify(paymentReq),
          "X-Payment-Scheme": "exact",
          "X-Payment-Network": x402Config.network,
          "X-Payment-Price": price,
          "X-PayTo": x402Config.payTo,
        },
      },
    );
    return;
  }

  // 有 payment signature — 转到 x402 SDK 验证
  try {
    const httpServer = new x402HTTPResourceServer(
      x402Config.server,
      x402Config.routes,
    );
    const adapter = {
      getHeader: (name: string) => c.req.header(name),
      getMethod: () => c.req.method,
      getPath: () => path,
      getUrl: () => c.req.url,
      getAcceptHeader: () => c.req.header("Accept") || "",
      getUserAgent: () => c.req.header("User-Agent") || "",
    };
    const context = { adapter, path, method: c.req.method, paymentHeader: paymentSignature };

    const result = await httpServer.processHTTPRequest(context);

    switch (result.type) {
      case "no-payment-required":
        await next();
        return;
      case "payment-error":
        c.res = new Response(
          JSON.stringify(result.response.body ?? {}),
          {
            status: result.response.status ?? 402,
            headers: new Headers(result.response.headers ?? {}),
          },
        );
        return;
      case "payment-verified":
        await next();
        return;
    }
  } catch (err) {
    console.error("[data-market] x402 verify error:", err);
    await next();
  }
});

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
