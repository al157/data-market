import { Hono } from "hono";
import type { Env } from "../types";
import { DATASET_CATALOG } from "../datasets/catalog";

/**
 * Agent 发现机制路由
 *
 * AI Agent 通过这些端点发现你的数据市场：
 *   /.well-known/ai.json     → AI Agent 资源描述
 *   /llms.txt                → LLM 可读的目录索引
 *   /mcp.json                → MCP Server Manifest
 *   /openapi.json            → OpenAPI 规范
 */
const discoveryRoutes = new Hono<{ Bindings: Env }>();

// ── LLMs.txt — AI Agent 的站点地图 ──
// 标准参考：https://llmstxt.org/
discoveryRoutes.get("/llms.txt", (c) => {
  const lines = [
    "# Curated Datasets Marketplace",
    "",
    "> AI-purchasable structured datasets via x402 (HTTP 402 Payment Required).",
    "> AI agents discover, pay, and download data programmatically.",
    "",
    "## Available Datasets",
    "",
    ...DATASET_CATALOG.map((d) =>
      [
        `### ${d.name}`,
        `ID: ${d.id}`,
        `Category: ${d.category}`,
        `Description: ${d.description}`,
        `Records: ${d.recordCount.toLocaleString()}`,
        `Size: ${d.size}`,
        `Price: \$${d.priceDownload} per download, \$${d.priceQuery} per query`,
        `API: GET /datasets/${d.id}.json`,
        `Payment: x402 protocol (HTTP 402)`,
        "",
      ].join("\n")
    ),
    "",
    "## How to Purchase",
    "",
    "1. Send GET request to a dataset endpoint",
    "2. Server returns 402 Payment Required with payment details",
    "3. Pay with USDC via x402 protocol",
    "4. Retry with payment proof → receive data",
    "",
    "## Protocol",
    "- Payment: x402 (HTTP 402) over USDC/Base",
    "- Format: JSON, CSV",
    "- Facilitator: https://x402.org/facilitator",
    "- SDK: @x402/fetch, @x402/hono",
    "",
    "## Contact",
    "- Endpoint: https://data-market.example.workers.dev",
    "- Health: GET /health",
    "",
  ].join("\n");

  return c.text(lines, 200, {
    "Content-Type": "text/plain; charset=utf-8",
    "Cache-Control": "public, max-age=3600",
  });
});

// ── AI Agent 资源描述 (JSON-LD) ──
// AI 爬虫用 jsonld 格式发现付费数据资源
discoveryRoutes.get("/.well-known/ai.json", (c) => {
  const manifest = {
    "@context": "https://schema.org",
    "@type": "DataCatalog",
    name: "Curated Datasets Marketplace",
    description: "AI-purchasable structured datasets via x402 payment protocol",
    provider: {
      "@type": "Organization",
      name: "Data Market",
    },
    paymentAccepted: "x402/USDC",
    network: "base",
    dataset: DATASET_CATALOG.map((d) => ({
      "@type": "Dataset",
      name: d.name,
      identifier: d.id,
      description: d.description,
      category: d.category,
      distribution: d.formats.map((fmt) => ({
        "@type": "DataDownload",
        encodingFormat: fmt,
        contentUrl: `/datasets/${d.id}.${fmt.toLowerCase()}`,
        // 价格以 x402 402 Payment Required 响应返回
      })),
      variableMeasured: d.recordCount,
      size: d.size,
      dateModified: d.lastUpdated,
      isAccessibleForFree: false,
    })),
  };

  return c.json(manifest, 200, {
    "Cache-Control": "public, max-age=3600",
  });
});

// ── MCP Server Manifest ──
// AI Agent 通过 MCP 协议发现可用工具
discoveryRoutes.get("/mcp.json", (c) => {
  const manifest = {
    schemaVersion: 1,
    server: {
      name: "Curated Datasets Marketplace",
      version: "0.1.0",
      description: "AI-purchasable structured datasets via x402",
    },
    tools: [
      {
        name: "list_datasets",
        description: "Browse all available datasets",
        inputSchema: {
          type: "object",
          properties: {
            category: {
              type: "string",
              enum: ["weather", "finance", "reference", "code", "knowledge"],
              description: "Filter by category",
            },
          },
        },
        free: true,
      },
      {
        name: "search_datasets",
        description: "Search datasets by keyword",
        inputSchema: {
          type: "object",
          properties: {
            query: { type: "string", description: "Search query" },
          },
          required: ["query"],
        },
        free: true,
      },
      {
        name: "get_dataset",
        description: "Get full metadata of a dataset ($0.01)",
        inputSchema: {
          type: "object",
          properties: {
            dataset_id: { type: "string", description: "Dataset ID" },
          },
          required: ["dataset_id"],
        },
        paid: true,
        price: 0.01,
      },
      {
        name: "download_dataset",
        description: "Purchase and download a dataset ($0.01+)",
        inputSchema: {
          type: "object",
          properties: {
            dataset_id: { type: "string", description: "Dataset ID" },
            format: { type: "string", enum: ["json", "csv"] },
          },
          required: ["dataset_id"],
        },
        paid: true,
        price: 0.01,
      },
    ],
    payment: {
      protocol: "x402",
      network: "base",
      facilitator: "https://x402.org/facilitator",
    },
  };

  return c.json(manifest, 200, {
    "Cache-Control": "public, max-age=3600",
  });
});

// ── OpenAPI 规范（精简版） ──
discoveryRoutes.get("/openapi.json", (c) => {
  const spec: Record<string, unknown> = {
    openapi: "3.1.0",
    info: {
      title: "Curated Datasets Marketplace API",
      version: "0.1.0",
      description: "x402-paywalled data API for AI agents",
    },
    servers: [{ url: "https://data-market.example.workers.dev" }],
    paths: {
      "/health": {
        get: {
          summary: "Health check",
          description: "Public endpoint, no payment required",
          responses: { "200": { description: "OK" } },
          "x-free": true,
        },
      },
      "/.well-known/ai.json": {
        get: {
          summary: "AI agent resource manifest",
          responses: { "200": { description: "JSON-LD manifest" } },
          "x-free": true,
        },
      },
      "/datasets/{id}.json": {
        get: {
          summary: "Download a dataset",
          description: "x402 paywalled — returns 402 with payment instructions if unpaid",
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              schema: { type: "string" },
            },
          ],
          responses: {
            "200": { description: "Dataset content" },
            "402": { description: "Payment Required — see PAYMENT-REQUIRED header" },
          },
          "x-payment": { protocol: "x402", price: "$0.10-$2.00" },
        },
      },
    },
  };

  return c.json(spec, 200, {
    "Cache-Control": "public, max-age=3600",
  });
});

export default discoveryRoutes;
