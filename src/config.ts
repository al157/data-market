import type { Env } from "./types";
import type { RoutesConfig } from "@x402/core/server";
import type { PaymentOption } from "@x402/core/http";

// ============================================================
// x402 路由定价配置
// 所有价格单位为 USD，接受 USDC 稳定币
// ============================================================

/** 同一网络下所有路由的通用配置 */
export const NETWORK = {
  /** Base 主网 (chain ID 8453) */
  mainnet: "eip155:8453" as const,
  /** Base Sepolia 测试网 (chain ID 84532) */
  testnet: "eip155:84532" as const,
};

/** 主网模式：Base mainnet */
export const ACTIVE_NETWORK = NETWORK.mainnet;

/** 通用支付选项：exact scheme, USDC/Base */
function defaultPayment(payTo: string, price: string): PaymentOption {
  return {
    scheme: "exact",
    price,
    network: ACTIVE_NETWORK,
    payTo,
  };
}

/**
 * 路由 → 定价映射
 * 每个受 x402 保护的端点在这里定义价格和描述
 */
export function getRoutes(payTo: string): RoutesConfig {
  return {
    // ── 静态文件下载 ──
    "GET /data/:file": {
      accepts: defaultPayment(payTo, "$0.50"),
      description: "Download data file (CSV/JSON/PDF)",
      extensions: {
        bazaar: {
          name: "Data Market — Curated Datasets",
          tags: ["data", "datasets", "structured-data", "ai", "reference"],
          endpointDescriptions: {
            "GET /data/:file": "Download curated data files — country codes, weather, forex, crypto, unit conversions, MIME types, and more",
            "GET /datasets/:file": "Download curated datasets via x402 micropayment",
            "POST /query": "Query structured data with filters — daily weather, forex, stock indices",
          },
        },
      },
    },
    "GET /datasets/:file": {
      accepts: defaultPayment(payTo, "$0.50"),
      description: "Download curated dataset",
      extensions: {
        bazaar: {
          name: "Data Market — Curated Datasets",
          tags: ["data", "datasets", "structured-data", "ai", "reference"],
        },
      },
    },

    // ── 动态数据查询 ──
    "POST /query": {
      accepts: defaultPayment(payTo, "$0.01"),
      description: "Query data API per request",
      extensions: {
        bazaar: {
          name: "Data Market — Curated Datasets",
          tags: ["data", "datasets", "structured-data", "ai", "reference"],
        },
      },
    },
  };
}
