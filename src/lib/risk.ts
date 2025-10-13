import type { Pool } from "@/lib/mockPools";

export function riskNote(pool: Pool): string {
  switch (pool.risk) {
    case "low":
      return "Lower volatility and higher liquidity expected; yields may be moderate.";
    case "medium":
      return "Moderate risk: price swings and changing fees can impact returns.";
    case "high":
      return "High risk: thin liquidity or volatile assets; returns can vary widely.";
  }
}

export function scorePool(
  pool: Pool,
  goal: "yield" | "low-risk" | "hands-off"
): number {
  const apyScore = Math.min(100, Math.max(0, pool.apy));
  const baseRisk = pool.risk === "low" ? 1 : pool.risk === "medium" ? 0.6 : 0.3;
  // Liquidity score: >100k = 1.0, 20k-100k = 0.6..0.9, <20k = 0.3
  const liq = pool.liquidityUsd ?? 0;
  const liquidityScore = liq >= 100000 ? 1 : liq >= 20000 ? 0.6 + (Math.min(liq, 100000) - 20000) / 80000 * 0.3 : 0.3;
  // Volume score: normalize modestly
  const vol = pool.volume24hUsd ?? 0;
  const volumeScore = vol >= 50000 ? 1 : vol >= 5000 ? 0.6 + (Math.min(vol, 50000) - 5000) / 45000 * 0.4 : 0.4;
  // Platform trust factor
  const platform = (pool.platform || "").toLowerCase();
  const trust = platform.includes("alex") || platform.includes("arkadiko") ? 1 : platform.includes("velar") || platform.includes("stackswap") ? 0.8 : 0.7;

  const safetyScore = (baseRisk * 0.5 + liquidityScore * 0.3 + volumeScore * 0.2) * trust; // 0..1
  const safetyPct = safetyScore * 100;

  if (goal === "yield") {
    return apyScore * 0.75 + safetyPct * 0.25;
  }
  if (goal === "low-risk") {
    return apyScore * 0.35 + safetyPct * 0.65;
  }
  // hands-off: prefer stability and reasonable APY
  return apyScore * 0.45 + safetyPct * 0.55;
}


