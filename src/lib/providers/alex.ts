import axios from "axios";
import type { Pool } from "@/lib/mockPools";

type AlexTicker = {
  ticker_id: string;
  pool_id: string;
  base_currency: string;
  target_currency: string;
  base: string; // e.g., sLUNR
  target: string; // e.g., STX
  last_price: number;
  base_volume: number;
  target_volume: number;
  liquidity_in_usd?: number;
};

function estimateApyFromFees(t: AlexTicker): number | null {
  const feeRate = 0.003; // 0.3% typical AMM fee
  const liquidity = t.liquidity_in_usd ?? 0;
  if (!liquidity || liquidity <= 0) return null;
  const estVolumeUsd = Math.max(0, (t.base_volume * t.last_price) + t.target_volume);
  const feePerDayUsd = estVolumeUsd * feeRate;
  const apr = (feePerDayUsd * 365) / liquidity;
  const apyPct = Math.max(0, Math.min(100, apr * 100));
  return Number.isFinite(apyPct) ? apyPct : null;
}

function riskFromLiquidity(liq?: number): "low" | "medium" | "high" {
  if (!liq || liq < 20000) return "high";
  if (liq < 100000) return "medium";
  return "low";
}

// Simple in-memory cache to reduce load and smooth over transient failures
let lastAlexPools: Pool[] | null = null;
let lastAlexAt = 0;
const ALEX_CACHE_MS = 60 * 1000; // 60s

export async function fetchAlexPools(): Promise<Pool[]> {
  const now = Date.now();
  if (lastAlexPools && now - lastAlexAt < ALEX_CACHE_MS) {
    return lastAlexPools;
  }
  const url = "https://api.alexgo.io/v1/tickers";
  try {
    const res = await axios.get<AlexTicker[]>(url, { timeout: 10000 });
    const tickers = Array.isArray(res.data) ? res.data : [];
    const pools = tickers.slice(0, 50).map((t): Pool => {
      const apy = estimateApyFromFees(t) ?? 0;
      const name = `ALEX ${t.base}/${t.target}`;
      return {
        id: t.ticker_id,
        name,
        platform: "ALEX",
        apy: Number(apy.toFixed(2)),
        risk: riskFromLiquidity(t.liquidity_in_usd),
        url: "https://app.alexlab.co/pools",
        liquidityUsd: t.liquidity_in_usd,
        volume24hUsd: Math.max(0, (t.base_volume * t.last_price) + t.target_volume),
      };
    });
    lastAlexPools = pools;
    lastAlexAt = now;
    return pools;
  } catch {
    // On failure, serve cached data if fresh
    if (lastAlexPools && now - lastAlexAt < ALEX_CACHE_MS * 5) {
      return lastAlexPools;
    }
    return [];
  }
}


