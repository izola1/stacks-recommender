
import axios from "axios";
import type { Pool } from "@/lib/mockPools";

type ArkadikoTicker = {
  ticker_id: string;
  base_currency: string;
  target_currency: string;
  pool_id: string;
  last_price: number;
  base_volume: number;
  target_volume: number;
  liquidity_in_usd?: number;
};

// Estimate APY from 24h volume and liquidity, using a typical AMM fee (0.3%)
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

// Fetch live Arkadiko AMM pool data
export async function fetchArkadikoPools(): Promise<Pool[]> {
  try {
    const url = "https://arkadiko-api.herokuapp.com/api/v1/tickers";
    const res = await axios.get(url, { timeout: 10000 });
    const tickers: ArkadikoTicker[] = res.data || [];
    return tickers.slice(0, 50).map((t): Pool => {
      const apy = estimateApyFromFees(t.base_volume, t.last_price, t.target_volume, t.liquidity_in_usd) ?? 0;
      return {
        id: `arkadiko-${t.ticker_id}`,
        name: `Arkadiko ${t.base_currency}/${t.target_currency}`,
        platform: "Arkadiko",
        apy,
        risk: riskFromLiquidity(t.liquidity_in_usd),
        url: "https://app.arkadiko.finance/swap",
        liquidityUsd: t.liquidity_in_usd,
        volume24hUsd: Math.max(0, (t.base_volume * t.last_price) + t.target_volume),
      };
    });
  } catch {
    return [];
  }
}
