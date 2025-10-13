import type { Pool } from "@/lib/mockPools";

// StackSwap is another AMM on Stacks
// As of Oct 2025, there is NO public API for live pool data.
// See https://app.stackswap.org/ for protocol info.
// TODO: If StackSwap releases a public API, fetch and parse it here for live data.
export async function fetchStackswapPools(): Promise<Pool[]> {
  // Fallback to static/mock data
  return [
    {
      id: "stackswap-stx-usda",
      name: "StackSwap STX/USDA",
      platform: "StackSwap",
      apy: 9.8,
      risk: "medium",
      url: "https://app.stackswap.org/",
      liquidityUsd: 50000,
      volume24hUsd: 12000,
    },
    {
      id: "stackswap-stx-xbtc",
      name: "StackSwap STX/xBTC",
      platform: "StackSwap",
      apy: 15.2,
      risk: "high",
      url: "https://app.stackswap.org/",
      liquidityUsd: 15000,
      volume24hUsd: 8000,
    },
    {
      id: "stackswap-usda-xbtc",
      name: "StackSwap USDA/xBTC",
      platform: "StackSwap",
      apy: 7.4,
      risk: "medium",
      url: "https://app.stackswap.org/",
      liquidityUsd: 70000,
      volume24hUsd: 9000,
    },
  ];
}
