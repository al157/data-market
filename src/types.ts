/// <reference types="@cloudflare/workers-types" />

export interface Env {
  /** R2 bucket for static data files */
  DATA_BUCKET: R2Bucket;

  /** Merchant wallet address (set via wrangler secret) */
  MERCHANT_ADDRESS?: string;

  /** x402 facilitator URL (default: https://x402.org/facilitator) */
  FACILITATOR_URL?: string;
}

export type Bindings = Env;
