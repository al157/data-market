import { Hono } from "hono";
import type { Env } from "../types";

/**
 * 动态数据查询路由
 *
 * 受 x402 保护，按次付费查询数据
 * 根据你的数据源实现下面的 queryData 函数
 *
 * 当前示例：返回模拟数据 + 元数据
 * 你可以替换为真实的 D1 查询、R2 数据集搜索、或外源 API
 */

const queryRoutes = new Hono<{ Bindings: Env }>();

/** 查询请求体 */
interface QueryRequest {
  /** 查询内容（SQL / 关键词 / 自然语言） */
  q?: string;
  /** 数据集标识 */
  dataset?: string;
  /** 分页 */
  limit?: number;
  offset?: number;
  /** 过滤参数 */
  filters?: Record<string, string>;
}

/** 数据元信息 */
interface DataCatalog {
  name: string;
  description: string;
  recordCount: number;
  size: string;
  updated: string;
}

/**
 * 数据目录索引
 * TODO: 替换为真实数据源的元数据
 */
const CATALOG: DataCatalog[] = [
  { name: "market-data", description: "Market pricing data by region", recordCount: 100_000, size: "45 MB", updated: "2026-07-10" },
  { name: "user-behavior", description: "Anonymized user behavior analytics", recordCount: 500_000, size: "120 MB", updated: "2026-07-09" },
  { name: "ai-training", description: "Curated training dataset for fine-tuning", recordCount: 50_000, size: "2.1 GB", updated: "2026-07-08" },
];

/**
 * POST /query
 *
 * 支付验证通过后，执行数据查询并返回结果
 */
queryRoutes.post("/", async (c) => {
  const body: QueryRequest = await c.req.json().catch(() => ({}));
  const { q, dataset, limit = 10, offset = 0 } = body;

  // ── 返回数据目录 ──
  if (!q && !dataset) {
    return c.json({
      catalog: CATALOG,
      message: "Specify a dataset or query (q) to get data",
    });
  }

  // ── 执行查询 ──
  // TODO: 替换为真实数据查询逻辑
  // 例如查 D1: await env.DATA_DB.prepare("SELECT * FROM ...").all();
  // 例如搜 R2: 列举 dataset 目录下的文件
  // 例如调外源 API

  const results = await queryData(q, dataset, limit, offset);

  return c.json({
    dataset,
    query: q,
    count: results.length,
    offset,
    results,
    meta: {
      billed: true,
      scheme: "x402/exact",
    },
  });
});

/**
 * 模拟数据查询 — 替换为你的真实数据源
 */
async function queryData(
  q?: string,
  dataset?: string,
  limit = 10,
  offset = 0,
): Promise<Record<string, unknown>[]> {
  // 示例：从数据集名匹配数据目录
  const matched = dataset
    ? CATALOG.find((d) => d.name === dataset)
    : CATALOG[0];

  if (!matched) {
    return [{ error: `Dataset '${dataset}' not found` }];
  }

  // 返回模拟记录
  const rows: Record<string, unknown>[] = [];
  for (let i = offset; i < Math.min(offset + limit, 10); i++) {
    rows.push({
      id: `${matched.name}-${i}`,
      dataset: matched.name,
      value: `sample-${i}`,
      timestamp: new Date().toISOString(),
    });
  }

  return rows;
}

export default queryRoutes;
