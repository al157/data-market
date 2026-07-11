import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { withX402, type X402Config } from "agents/x402";
import { z } from "zod";

import type { Env } from "./types";
import { DATASET_CATALOG, getDatasetById, searchDatasets } from "./datasets/catalog";

/**
 * 构建一个 x402 付费 MCP Server，让 AI Agent 发现并购买数据集
 */
export function createPaidDatasetServer(env: Env): McpServer {
  const payTo = (env.MERCHANT_ADDRESS ?? "") as `0x${string}`;

  const x402Config: X402Config = {
    network: "base",
    recipient: payTo,
    facilitator: { url: env.FACILITATOR_URL ?? "https://x402.org/facilitator" },
  };

  const server = withX402(
    new McpServer({
      name: "Curated Datasets Marketplace",
      version: "0.1.0",
    }),
    x402Config,
  );

  // 免费：浏览目录
  server.tool(
    "list_datasets",
    "Browse all available datasets in the catalog",
    {
      category: z
        .enum(["weather", "finance", "reference", "code", "knowledge"])
        .optional()
        .describe("Filter by category"),
    },
    async ({ category }) => {
      const items = category
        ? DATASET_CATALOG.filter((d) => d.category === category)
        : DATASET_CATALOG;

      return {
        content: [{
          type: "text",
          text: [
            `# Available Datasets (${items.length})`,
            "",
            ...items.map((d) =>
              `- **${d.id}**: ${d.name} — $${d.priceDownload} download / $${d.priceQuery} query (${d.recordCount.toLocaleString()} records)`
            ),
            "",
            `_Use get_dataset for details, download_dataset to purchase_`,
          ].join("\n"),
        }],
      };
    },
  );

  // 免费：搜索
  server.tool(
    "search_datasets",
    "Search datasets by keyword",
    {
      query: z.string().describe("Search query (e.g. 'weather', 'crypto')"),
    },
    async ({ query }) => {
      const results = searchDatasets(query);
      return {
        content: [{
          type: "text",
          text: results.length
            ? `# Search results for "${query}" (${results.length})\n\n${
                results.map((d) => `- **[${d.id}]** ${d.name} — ${d.description}`).join("\n")
              }`
            : `No datasets found for "${query}".`,
        }],
      };
    },
  );

  // $0.01：数据集详情
  server.paidTool(
    "get_dataset",
    "Get full metadata of a specific dataset",
    0.01,
    { dataset_id: z.string().describe("Dataset ID from list_datasets") },
    {},
    async ({ dataset_id }) => {
      const d = getDatasetById(dataset_id);
      if (!d) return { content: [{ type: "text", text: `Dataset "${dataset_id}" not found.` }] };

      return {
        content: [{
          type: "text",
          text: [
            `# ${d.name}`,
            `**ID:** ${d.id} | **Category:** ${d.category}`,
            `**Records:** ${d.recordCount.toLocaleString()} | **Size:** ${d.size}`,
            `**Updated:** ${d.lastUpdated} | **Format:** ${d.formats.join(", ")}`,
            `**Price:** \$${d.priceDownload} download / \$${d.priceQuery} per query`,
            d.sourceUrl ? `**Source:** ${d.sourceUrl}` : "",
            `_Use download_dataset to purchase_`,
          ].filter(Boolean).join("\n"),
        }],
      };
    },
  );

  // 付费：下载数据集
  server.paidTool(
    "download_dataset",
    "Purchase a full dataset (delivered via HTTPS)",
    0.01,
    {
      dataset_id: z.string().describe("Dataset ID"),
      format: z.enum(["json", "csv"]).optional().describe("Format (default: json)"),
    },
    {},
    async ({ dataset_id, format = "json" }) => {
      const d = getDatasetById(dataset_id);
      if (!d) return { content: [{ type: "text", text: `Dataset "${dataset_id}" not found.` }] };

      return {
        content: [{
          type: "text",
          text: [
            `✅ Payment received for **${d.name}**`,
            `Download: \`GET /datasets/${d.id}.${format}\``,
            `Size: ${d.size} | Records: ${d.recordCount.toLocaleString()}`,
            `_Token valid for 24h_`,
          ].join("\n"),
        }],
      };
    },
  );

  return server;
}
