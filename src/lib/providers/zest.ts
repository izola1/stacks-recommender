import type { Pool } from "@/lib/mockPools";

// Zest Protocol is a lending/borrowing protocol on Stacks.
// As of Oct 2025, there is NO public API for live pool data.
// See https://docs.zestprotocol.com/ for protocol info.
// TODO: If Zest releases a public API, fetch and parse it here for live data.
export async function fetchZestPools(): Promise<Pool[]> {
    // Fallback to static/mock data
    return [
        {
            id: "zest-btc-lending",
            name: "Zest BTC Lending Pool",
            platform: "Zest Protocol",
            apy: 6.5, // Estimated
            risk: "medium",
            url: "https://app.zestprotocol.com/",
            liquidityUsd: 250000,
            volume24hUsd: 20000,
        },
        {
            id: "zest-btc-borrowing",
            name: "Zest BTC Borrowing Pool",
            platform: "Zest Protocol",
            apy: 9.2, // Estimated
            risk: "high",
            url: "https://app.zestprotocol.com/",
            liquidityUsd: 120000,
            volume24hUsd: 18000,
        },
    ];
}
