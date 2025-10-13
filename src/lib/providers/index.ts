import type { Pool } from "@/lib/mockPools";
import { fetchAlexPools } from "./alex";
import { fetchArkadikoPools } from "./arkadiko";
import { fetchStackswapPools } from "./stackswap";
import { fetchBitflowPools } from "./bitflow";
import { fetchZestPools } from "./zest";
import { fetchVelarPools } from "./velar";
import { fetchStackingDaoPools } from "./stackingdao";
import { mockPools } from "@/lib/mockPools";

export async function fetchAllPools(): Promise<Pool[]> {
  const results = await Promise.allSettled([
    fetchAlexPools(),
    fetchArkadikoPools(),
    fetchStackswapPools(),
    fetchBitflowPools(),
    fetchZestPools(),
    fetchVelarPools(),
    fetchStackingDaoPools(),
  ]);

  const allPools: Pool[] = [];
  results.forEach((result) => {
    if (result.status === "fulfilled" && result.value.length > 0) {
      allPools.push(...result.value);
    }
  });

  // If no pools were fetched successfully, return mock data
  if (allPools.length === 0) {
    return mockPools;
  }

  return allPools;
}
