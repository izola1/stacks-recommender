import type { Pool } from "@/lib/mockPools";

// StackingDAO is a liquid staking protocol for STX.
// As of Oct 2025, there is NO public API for live pool data.
// See https://stackingdao.com/ for protocol info.
// TODO: If StackingDAO releases a public API, fetch and parse it here for live data.
export async function fetchStackingDaoPools(): Promise<Pool[]> {
    // Fallback to static/mock data
    return [
        {
            id: "stackingdao-stx-ststx",
            name: "StackingDAO STX/stSTX Pool",
            platform: "StackingDAO",
            apy: 5.8, // Estimated
            risk: "low",
            url: "https://stackingdao.com/",
            liquidityUsd: 300000,
            volume24hUsd: 5000,
        },
    ];
}
