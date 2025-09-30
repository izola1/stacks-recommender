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
  const riskWeight = pool.risk === "low" ? 1 : pool.risk === "medium" ? 0.6 : 0.3;
  if (goal === "yield") {
    return apyScore * 0.8 + riskWeight * 100 * 0.2;
  }
  if (goal === "low-risk") {
    return apyScore * 0.4 + riskWeight * 100 * 0.6;
  }
  // hands-off: prefer stable, reasonable APY
  return apyScore * 0.5 + riskWeight * 100 * 0.5;
}


