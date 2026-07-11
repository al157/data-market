# Data Market — AI Agent 结构化数据集市场

通过 x402 协议向 AI Agent 按次售卖结构化公开数据集。

## 产品定位

**结构化公开数据集汇总 (Curated Public Datasets)**

| 类别 | 数量 | 示例 | 定价 |
|------|------|------|------|
| 天气/气候 | 2 | 全球天气日报、10年历史天气 | $0.50-$2.00 |
| 金融/市场 | 3 | 汇率、加密货币、股指 | $0.30-$0.50 |
| 参考数据 | 3 | 国家代码、单位换算、时区 | $0.05-$0.20 |
| 代码/开发 | 2 | HTTP 状态码、MIME 类型 | $0.05-$0.10 |
| 知识库 | 1 | 科技缩写解释 | $0.20 |

### AI Agent Reach (Agent 发现机制)

AI Agent 通过以下方式发现和购买数据：

| 端点 | 类型 | 说明 |
|------|------|------|
| GET `/llms.txt` | 文本 | LLM 可读的数据目录索引 |
| GET `/.well-known/ai.json` | JSON-LD | Schema.org DataCatalog 描述 |
| GET `/mcp.json` | JSON | MCP Server Manifest (modelcontextprotocol) |
| GET `/openapi.json` | JSON | OpenAPI 3.1 规范 |
| MCP paidTool | 协议 | via agents SDK `withX402` |

## 部署

### 前置条件
- Cloudflare 账号
- 加密钱包 (接收 USDC)
- 测试网 USDC (base-sepolia) — [Circle Faucet](https://faucet.circle.com/)

### 快速开始

```bash
# 1. 安装依赖
npm install

# 2. 创建 R2 存储桶
npx wrangler r2 bucket create data-market-files

# 3. 上传数据文件
npx wrangler r2 object put data-market-files/datasets/weather-daily.json --file ./data.json

# 4. 配置 secrets
npx wrangler secret put MERCHANT_ADDRESS   # 0x你的钱包地址
npx wrangler secret put FACILITATOR_URL    # https://x402.org/facilitator

# 5. 本地测试
npx wrangler dev

# 6. 部署
npm run deploy
```

### 测试支付流程

```bash
# Agent 发现目录
curl https://your-worker.workers.dev/llms.txt

# AI Manifest (JSON-LD)
curl https://your-worker.workers.dev/.well-known/ai.json

# MCP Manifest
curl https://your-worker.workers.dev/mcp.json

# 首次请求→返回 402
curl -v https://your-worker.workers.dev/datasets/weather-global-daily.json
# → 402 Payment Required + PAYMENT-REQUIRED header
```

## 项目结构

```
src/
├── datasets/
│   └── catalog.ts          ← 13 个数据条目定义及定价
├── routes/
│   ├── static.ts           ← R2 文件下载 (x402 保护)
│   ├── query.ts            ← 动态数据查询 (x402 保护)
│   └── discovery.ts        ← Agent Reach 端点 (公开免费)
├── config.ts               ← 网络/定价配置
├── types.ts                ← Env 类型定义
├── index.ts                ← 主入口 + x402 中间件
└── mcp-server.ts           ← MCP paidTool (agents SDK)
```

## 切换主网

1. `src/config.ts`: `ACTIVE_NETWORK` 改为 `NETWORK.mainnet`
2. `src/mcp-server.ts`: `network: "base-sepolia"` 改为 `"base"`
3. 确保钱包地址在 Base 主网有 USDC
4. 重新部署
