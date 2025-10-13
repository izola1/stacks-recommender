import axios from "axios";
import type { Pool } from "@/lib/mockPools";

type VelarPool = {
    id: string;
    token0: string;
    token1: string;
    liquidity_usd: number;
    volume_24h_usd: number;
    apy?: number;
};

function estimateApyFromFees(volume_24h_usd: number, liquidity_usd: number): number | null {
    const feeRate = 0.003; // 0.3% typical AMM fee
    if (!liquidity_usd || liquidity_usd <= 0) return null;
    const feePerDayUsd = volume_24h_usd * feeRate;
    const apr = (feePerDayUsd * 365) / liquidity_usd;
    const apyPct = Math.max(0, Math.min(100, apr * 100));
    return Number.isFinite(apyPct) ? apyPct : null;
}

function riskFromLiquidity(liq?: number): "low" | "medium" | "high" {
    if (!liq || liq < 20000) return "high";
    if (liq < 100000) return "medium";
    return "low";
}

// Fetch live Velar pool data from public API
export async function fetchVelarPools(): Promise<Pool[]> {
    try {
        const url = "https://api.velar.co/pools";
        const res = await axios.get(url, { timeout: 10000 });
        const pools: VelarPool[] = res.data || [];
        return pools.slice(0, 50).map((p): Pool => {
            const apy = estimateApyFromFees(p.volume_24h_usd, p.liquidity_usd) ?? 0;
            return {
                id: `velar-${p.id}`,
                name: `Velar ${p.token0}/${p.token1}`,
                platform: "Velar",
                apy,
                risk: riskFromLiquidity(p.liquidity_usd),
                url: "https://velar.co/",
                liquidityUsd: p.liquidity_usd,
                volume24hUsd: p.volume_24h_usd,
            };
        });
    } catch {
        // fallback to static/mock data if API fails
        return [
            {
                id: "velar-stx-btc",
                name: "Velar STX/BTC Pool",
                platform: "Velar",
                apy: 10.2, // Estimated
                risk: "medium",
                url: "https://velar.co/",
            },
            {
                id: "velar-stx-usda",
                name: "Velar STX/USDA Pool",
                platform: "Velar",
                apy: 8.1, // Estimated
                risk: "medium",
                url: "https://velar.co/",
            },
        ];
    }
}
