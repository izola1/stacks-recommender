import axios from "axios";

export interface Pool {
  id: string;
  platform: string;
  name: string;
  apy: number;
  url: string;
  risk: "low" | "medium" | "high";
}

// Helper to estimate risk based on APY (you can refine later)
function estimateRisk(apy: number): "low" | "medium" | "high" {
  if (apy < 5) return "low";
  if (apy < 15) return "medium";
  return "high";
}

/* --------------------------- ALEX PROVIDER --------------------------- */
async function fetchAlex(): Promise<Pool[]> {
  try {
    const { data } = await axios.get("https://api.alexgo.io/v1/tickers");
    if (!Array.isArray(data)) return [];

    return data.map((t: any, i: number) => ({
      id: `alex-${t.symbol ?? i}`,
      platform: "ALEX",
      name: t.symbol ?? "Unknown",
      apy: Number(t.apy ?? t.apy_7d ?? 0),
      url: "https://app.alexgo.io/",
      risk: estimateRisk(Number(t.apy ?? 0)),
    }));
  } catch (err) {
    console.error("ALEX fetch failed:", err.message);
    return [];
  }
}

/* --------------------------- ARKADIKO PROVIDER --------------------------- */
async function fetchArkadiko(): Promise<Pool[]> {
  try {
    const { data } = await axios.get("https://arkadiko-api.herokuapp.com/api/v1/tickers");
    if (!Array.isArray(data)) return [];

    return data.map((t: any, i: number) => ({
      id: `arkadiko-${t.asset ?? i}`,
      platform: "Arkadiko",
      name: t.asset ?? "Unknown",
      apy: Number(t.apy ?? 0),
      url: "https://app.arkadiko.finance/",
      risk: estimateRisk(Number(t.apy ?? 0)),
    }));
  } catch (err) {
    console.error("Arkadiko fetch failed:", err.message);
    return [];
  }
}

/* --------------------------- BITFLOW PROVIDER --------------------------- */
async function fetchBitflow(): Promise<Pool[]> {
  try {
    const { data } = await axios.get(
      "https://bitflow-sdk-api-gateway-7owjsmt8.uc.gateway.dev/ticker"
    );
    if (!Array.isArray(data)) return [];

    return data.map((t: any, i: number) => ({
      id: `bitflow-${t.symbol ?? i}`,
      platform: "Bitflow",
      name: t.symbol ?? "Unknown",
      apy: Number(t.apy ?? t.apr ?? 0),
      url: "https://www.bitflow.finance/",
      risk: estimateRisk(Number(t.apy ?? t.apr ?? 0)),
    }));
  } catch (err) {
    console.error("Bitflow fetch failed:", err.message);
    return [];
  }
}

/* --------------------------- VELAR PROVIDER --------------------------- */
async function fetchVelar(): Promise<Pool[]> {
  try {
    const { data } = await axios.get("https://api.velar.co/pools");
    if (!Array.isArray(data)) return [];

    return data.map((t: any, i: number) => ({
      id: `velar-${t.symbol ?? i}`,
      platform: "Velar",
      name: t.name ?? t.symbol ?? "Unknown",
      apy: Number(t.apy ?? t.apr ?? 0),
      url: "https://app.velar.com/",
      risk: estimateRisk(Number(t.apy ?? t.apr ?? 0)),
    }));
  } catch (err) {
    console.error("Velar fetch failed:", err.message);
    return [];
  }
}

/* --------------------------- AGGREGATOR --------------------------- */
export async function fetchAllPools(): Promise<Pool[]> {
  const results = await Promise.allSettled([
    fetchAlex(),
    fetchArkadiko(),
    fetchBitflow(),
    fetchVelar(),
  ]);

  const pools = results
    .filter((r): r is PromiseFulfilledResult<Pool[]> => r.status === "fulfilled")
    .flatMap((r) => r.value);

  // Filter out invalid or missing APY data
  return pools.filter((p) => !isNaN(p.apy) && p.apy >= 0);
}
