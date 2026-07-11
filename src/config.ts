import type { Env } from "./types";

// ============================================================
// x402 路由定价配置
// 所有价格单位为 USD，接受 USDC 稳定币
// ============================================================

export interface RoutePrice {
  scheme: "exact";
  price: string;       // e.g. "$0.50"
  network: string;     // e.g. "eip155:8453" = Base mainnet
  payTo: string;       // merchant wallet, resolved from secret
}

export interface BazaarExtension {
  /** 在 x402 Bazaar 发现目录中展示的服务名称 */
  name?: string;
  /** 标签，用于分类搜索 */
  tags?: string[];
  /** 端点级描述覆盖 */
  endpointDescriptions?: Record<string, string>;
}

export interface RouteDef {
  accepts: RoutePrice;
  description: string;
  /** x402 Bazaar 发现层扩展 */
  extensions?: {
    bazaar?: BazaarExtension;
  };
}

/** 同一网络下所有路由的通用配置 */
export const NETWORK = {
  /** Base 主网 (chain ID 8453) */
  mainnet: "eip155:8453" as const,
  /** Base Sepolia 测试网 (chain ID 84532) */
  testnet: "eip155:84532" as const,
};

/** 主网模式：Base mainnet */
export const ACTIVE_NETWORK = NETWORK.mainnet;

// ── Bazaar 扩展：让服务在 x402 发现层中可见 ──
const BAZAAR_EXT = {
  bazaar: {
    name: "Data Market — Curated Datasets",
    tags: ["data", "datasets", "structured-data", "ai", "reference"],
  },
};

/** Bazaar 端点级描述（覆盖默认 description） */
const BAZAAR_ENDPOINTS: Record<string, string> = {
  "GET /data/:file": "Download curated data files — country codes, weather, forex, crypto, unit conversions, MIME types, and more",
  "GET /datasets/:file": "Download curated datasets via x402 micropayment",
  "POST /query": "Query structured data with filters — daily weather, forex, stock indices",
};

/**
 * 路由 → 定价映射
 * 每个受 x402 保护的端点在这里定义价格和描述
 */
export function getRoutes(payTo: string): Record<string, RouteDef> {
  return {
    // ── 静态文件下载 ──
    "GET /data/:file": {
      accepts: {
        scheme: "exact",
        price: "$0.50",
        network: ACTIVE_NETWORK,
        payTo,
      },
      description: "Download data file (CSV/JSON/PDF)",
      extensions: {
        ...BAZAAR_EXT,
        bazaar: {
          ...BAZAAR_EXT.bazaar,
          endpointDescriptions: BAZAAR_ENDPOINTS,
        },
      },
    },
    "GET /datasets/:file": {
      accepts: {
        scheme: "exact",
        price: "$0.50",
        network: ACTIVE_NETWORK,
        payTo,
      },
      description: "Download curated dataset",
      extensions: BAZAAR_EXT,
    },

    // ── 动态数据查询 ──
    "POST /query": {
      accepts: {
        scheme: "exact",
        price: "$0.01",        // 每次查询 $0.01
        network: ACTIVE_NETWORK,
        payTo,
      },
      description: "Query data API per request",
      extensions: BAZAAR_EXT,
    },
  };
}
