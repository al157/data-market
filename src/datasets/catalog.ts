// ============================================================
// 结构化数据集目录 (Curated Public Datasets)
// Agent 可通过 x402 购买的数据资产索引
// ============================================================

export type DatasetCategory = "weather" | "finance" | "reference" | "code" | "knowledge";

export interface DatasetEntry {
  /** 数据集唯一 ID */
  id: string;
  /** 显示名称 */
  name: string;
  /** 类别 */
  category: DatasetCategory;
  /** 简短描述（Agent 发现用） */
  description: string;
  /** 记录数 */
  recordCount: number;
  /** 文件大小 */
  size: string;
  /** 更新频率 */
  updateFrequency: "static" | "daily" | "weekly" | "monthly";
  /** 最后更新 */
  lastUpdated: string;
  /** 单次下载价 (USD) */
  priceDownload: number;
  /** 查询价 (USD/次) */
  priceQuery: number;
  /** 数据格式 */
  formats: string[];
  /** 数据源 URL（公开来源） */
  sourceUrl?: string;
}

/**
 * 完整数据目录
 * 每个条目 = Agent 可以购买的一个数据产品
 */
export const DATASET_CATALOG: DatasetEntry[] = [
  // ── 天气/气候 ──
  {
    id: "weather-global-daily",
    name: "Global Daily Weather Summary",
    category: "weather",
    description: "全球主要城市每日天气汇总：温度、湿度、风速、气压",
    recordCount: 500_000,
    size: "12 MB",
    updateFrequency: "daily",
    lastUpdated: "2026-07-11",
    priceDownload: 0.50,
    priceQuery: 0.01,
    formats: ["JSON", "CSV"],
    sourceUrl: "https://openweathermap.org",
  },
  {
    id: "weather-historical-10yr",
    name: "10-Year Historical Weather (Major Cities)",
    category: "weather",
    description: "全球200+城市近10年历史天气数据，适合时间序列分析",
    recordCount: 7_300_000,
    size: "280 MB",
    updateFrequency: "static",
    lastUpdated: "2026-06-01",
    priceDownload: 2.00,
    priceQuery: 0.05,
    formats: ["JSON", "CSV", "Parquet"],
  },

  // ── 金融/市场 ──
  {
    id: "forex-daily",
    name: "Daily Forex Rates (USD Base)",
    category: "finance",
    description: "美元兑主要货币每日汇率，含历史走势",
    recordCount: 200_000,
    size: "5 MB",
    updateFrequency: "daily",
    lastUpdated: "2026-07-11",
    priceDownload: 0.30,
    priceQuery: 0.01,
    formats: ["JSON", "CSV"],
    sourceUrl: "https://exchangerate.host",
  },
  {
    id: "crypto-prices",
    name: "Crypto Market Prices (Top 100)",
    category: "finance",
    description: "Top 100 加密货币实时价格、市值、24h 成交量",
    recordCount: 100_000,
    size: "3 MB",
    updateFrequency: "daily",
    lastUpdated: "2026-07-11",
    priceDownload: 0.50,
    priceQuery: 0.02,
    formats: ["JSON", "CSV"],
    sourceUrl: "https://coingecko.com",
  },
  {
    id: "stock-indices",
    name: "Global Stock Indices Snapshot",
    category: "finance",
    description: "全球主要股票指数（S&P500, FTSE, Nikkei, HSI, etc.）",
    recordCount: 50_000,
    size: "1.5 MB",
    updateFrequency: "daily",
    lastUpdated: "2026-07-11",
    priceDownload: 0.30,
    priceQuery: 0.01,
    formats: ["JSON"],
    sourceUrl: "https://finance.yahoo.com",
  },

  // ── 参考数据 ──
  {
    id: "country-codes",
    name: "ISO Country Codes + Metadata",
    category: "reference",
    description: "完整 ISO 3166 国家代码、首都、货币、电话区号、时区",
    recordCount: 249,
    size: "50 KB",
    updateFrequency: "static",
    lastUpdated: "2026-01-01",
    priceDownload: 0.10,
    priceQuery: 0.005,
    formats: ["JSON", "CSV"],
  },
  {
    id: "unit-conversion",
    name: "Universal Unit Conversion Table",
    category: "reference",
    description: "长度/重量/温度/体积/面积等单位的精确换算系数表",
    recordCount: 500,
    size: "100 KB",
    updateFrequency: "static",
    lastUpdated: "2026-01-01",
    priceDownload: 0.10,
    priceQuery: 0.005,
    formats: ["JSON"],
  },
  {
    id: "timezone-db",
    name: "Timezone Database (IANA)",
    category: "reference",
    description: "IANA 时区数据库结构化版本，含 UTC 偏移、DST 规则",
    recordCount: 600,
    size: "200 KB",
    updateFrequency: "monthly",
    lastUpdated: "2026-07-01",
    priceDownload: 0.20,
    priceQuery: 0.01,
    formats: ["JSON"],
    sourceUrl: "https://www.iana.org/time-zones",
  },

  // ── 代码/开发 ──
  {
    id: "http-status-codes",
    name: "HTTP Status Code Reference",
    category: "code",
    description: "完整 HTTP 状态码列表含说明、RFC 引用、浏览器处理行为",
    recordCount: 120,
    size: "30 KB",
    updateFrequency: "static",
    lastUpdated: "2026-06-01",
    priceDownload: 0.05,
    priceQuery: 0.005,
    formats: ["JSON"],
  },
  {
    id: "mime-types",
    name: "MIME Type Registry",
    category: "code",
    description: "完整 MIME 类型映射表（类型→扩展名→说明）",
    recordCount: 2_000,
    size: "100 KB",
    updateFrequency: "monthly",
    lastUpdated: "2026-07-01",
    priceDownload: 0.10,
    priceQuery: 0.005,
    formats: ["JSON"],
  },

  // ── 知识库 ──
  {
    id: "tech-acronyms",
    name: "Tech Acronyms & Abbreviations",
    category: "knowledge",
    description: "AI/ML/Infra/Web 领域常见缩写及全称解释",
    recordCount: 3_000,
    size: "200 KB",
    updateFrequency: "monthly",
    lastUpdated: "2026-07-01",
    priceDownload: 0.20,
    priceQuery: 0.01,
    formats: ["JSON", "CSV"],
  },

  // ── AI 模型定价 ──
  {
    id: "ai-model-pricing",
    name: "AI Model Pricing & Latency Tracker",
    category: "knowledge",
    description: "主流 AI 模型的 API 定价、上下文窗口、延迟估算——覆盖 15 个 provider、39 个模型",
    recordCount: 39,
    size: "20 KB",
    updateFrequency: "weekly",
    lastUpdated: "2026-07-11",
    priceDownload: 0.50,
    priceQuery: 0.02,
    formats: ["JSON", "CSV"],
    sourceUrl: "https://openai.com/pricing, https://anthropic.com/pricing, https://cloud.google.com/vertex-ai/pricing",
  },
];

/**
 * 按类别获取数据集
 */
export function getDatasetsByCategory(category?: DatasetCategory): DatasetEntry[] {
  if (category) {
    return DATASET_CATALOG.filter((d) => d.category === category);
  }
  return DATASET_CATALOG;
}

/**
 * 通过 ID 查找数据集
 */
export function getDatasetById(id: string): DatasetEntry | undefined {
  return DATASET_CATALOG.find((d) => d.id === id);
}

/**
 * 搜索数据集
 */
export function searchDatasets(query: string): DatasetEntry[] {
  const q = query.toLowerCase();
  return DATASET_CATALOG.filter(
    (d) =>
      d.name.toLowerCase().includes(q) ||
      d.description.toLowerCase().includes(q) ||
      d.category.toLowerCase().includes(q),
  );
}
