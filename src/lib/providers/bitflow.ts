import axios from "axios";
import type { Pool } from "@/lib/mockPools";

type BitflowTicker = {
  ticker_id: string;
  base_currency: string;
  target_currency: string;
  last_price: number;
  base_volume: number;
  target_volume: number;
  liquidity_in_usd?: number;
  ask?: number;
  bid?: number;
  high?: number;
  low?: number;
};

function estimateApyFromFees(base_volume: number, last_price: number, target_volume: number, liquidity_in_usd?: number): number | null {
  const feeRate = 0.003; // 0.3% typical AMM fee
  const liquidity = liquidity_in_usd ?? 0;
  if (!liquidity || liquidity <= 0) return null;
  // Estimate total USD volume in 24h
  const estVolumeUsd = Math.max(0, (base_volume * last_price) + target_volume);
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

// Fetch live Bitflow pool data from public API
export async function fetchBitflowPools(): Promise<Pool[]> {
  try {
    const url = "https://bitflow-sdk-api-gateway-7owjsmt8.uc.gateway.dev/ticker";
    const res = await axios.get(url, { timeout: 10000 });
    const tickers: BitflowTicker[] = Array.isArray(res.data) ? res.data : [res.data];
    return tickers.slice(0, 50).map((t): Pool => {
      const apy = estimateApyFromFees(t.base_volume, t.last_price, t.target_volume, t.liquidity_in_usd) ?? 0;
      return {
        id: `bitflow-${t.ticker_id}`,
        name: `Bitflow ${t.base_currency}/${t.target_currency}`,
        platform: "Bitflow",
        apy,
        risk: riskFromLiquidity(t.liquidity_in_usd),
        url: "https://www.bitflow.finance/",
        liquidityUsd: t.liquidity_in_usd,
        volume24hUsd: Math.max(0, (t.base_volume * t.last_price) + t.target_volume),
      };
    });
  } catch {
    // fallback to static/mock data if API fails
    return [
      {
        id: "bitflow-stx-sbtc",
        name: "Bitflow STX/sBTC",
        platform: "Bitflow",
        apy: 18.7,
        risk: "high",
        url: "https://www.bitflow.finance/",
      },
      {
        id: "bitflow-sbtc-usda",
        name: "Bitflow sBTC/USDA",
        platform: "Bitflow",
        apy: 11.3,
        risk: "medium",
        url: "https://www.bitflow.finance/",
      },
      {
        id: "bitflow-stx-wmno",
        name: "Bitflow STX/WMNO",
        platform: "Bitflow",
        apy: 22.1,
        risk: "high",
        url: "https://www.bitflow.finance/",
      },
    ];
  }
}
