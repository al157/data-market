import { Hono } from "hono";
import type { Env } from "../types";

/**
 * R2 静态数据文件路由
 *
 * 受 x402 保护，用户付费后下载文件
 * 文件存于 R2 bucket "data-market-files"
 *
 * 文件命名规则：
 *   datasets/<category>/<filename>.csv
 *   datasets/<category>/<filename>.json
 */
const staticRoutes = new Hono<{ Bindings: Env }>();

// 内容类型映射
const MIME_MAP: Record<string, string> = {
  csv: "text/csv",
  json: "application/json",
  jsonl: "application/jsonl",
  pdf: "application/pdf",
  txt: "text/plain",
  md: "text/markdown",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
  gif: "image/gif",
  parquet: "application/octet-stream",
  arrow: "application/octet-stream",
};

function getMimeType(filepath: string): string {
  const ext = filepath.split(".").pop()?.toLowerCase() ?? "";
  return MIME_MAP[ext] ?? "application/octet-stream";
}

/**
 * GET /data/:file
 *
 * 注意：此路由本身由 index.ts 中的 paymentMiddleware 保护
 * 如果请求到达这里，说明 x402 支付已验证通过
 */
staticRoutes.get("/:file", async (c) => {
  const filename = c.req.param("file");
  const env = c.env;

  // 安全检查：防止路径遍历
  if (filename.includes("..") || filename.includes("~")) {
    return c.json({ error: "Invalid file path" }, 400);
  }

  const object = await env.DATA_BUCKET.get(filename);

  if (!object) {
    return c.json({ error: "File not found", file: filename }, 404);
  }

  const mimeType = getMimeType(filename);
  const headers = new Headers({
    "Content-Type": mimeType,
    "Content-Disposition": `attachment; filename="${filename.split("/").pop()}"`,
    "Cache-Control": "public, max-age=86400",
  });

  if (object.httpEtag) {
    headers.set("ETag", object.httpEtag);
  }
  if (object.size) {
    headers.set("Content-Length", String(object.size));
  }

  return c.body(object.body, { headers });
});

export default staticRoutes;
