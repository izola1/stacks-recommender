// src/lib/pools.ts
export async function fetchAllPools() {
  const results = await Promise.allSettled([
    fetchAlexPools(),
    fetchArkadikoPools(),
    fetchVelarPools(),
    fetchBitflowPools(),
  ]);

  return results
    .filter((r) => r.status === "fulfilled")
    .flatMap((r) => (r as PromiseFulfilledResult<any>).value || []);
}

/* 🔹 ALEX: Yield farms and pools */
async function fetchAlexPools() {
  const res = await fetch("https://api.alexgo.io/v1/tickers");
  const data = await res.json();

  return data.map((p: any) => ({
    id: `alex-${p.pool_address}`,
    platform: "ALEX",
    name: `${p.token_x.symbol}-${p.token_y.symbol}`,
    apy: Number(p.apy ?? p.farming_apr ?? p.apr ?? 0),
    tvl: Number(p.tvl_usd ?? 0),
    risk: "medium",
    url: "https://app.alexgo.io/",
  }));
}

/* 🔹 Arkadiko: Vaults and stability pools */
async function fetchArkadikoPools() {
  const res = await fetch("https://arkadiko-api.herokuapp.com/api/v1/tickers");
  const data = await res.json();

  return data.map((v: any) => ({
    id: `arkadiko-${v.id}`,
    platform: "Arkadiko",
    name: `${v.token} Vault`,
    apy: Number(v.apy ?? v.estimated_apy ?? 0),
    tvl: Number(v.tvl ?? v.total_deposits ?? 0),
    risk: "low",
    url: "https://app.arkadiko.finance/",
  }));
}

/* 🔹 Velar: Pools API */
async function fetchVelarPools() {
  const res = await fetch("https://api.velar.co/pools");
  const data = await res.json();

  return data.map((p: any) => ({
    id: `velar-${p.pool_id ?? p.id}`,
    platform: "Velar",
    name: `${p.asset_1?.symbol}-${p.asset_2?.symbol}`,
    apy: Number(p.apy ?? p.apr ?? 0),
    tvl: Number(p.tvl_usd ?? 0),
    risk: "medium",
    url: "https://app.velar.com/",
  }));
}

/* 🔹 Bitflow: Stacks liquidity pools */
async function fetchBitflowPools() {
  const res = await fetch("https://bitflow-sdk-api-gateway-7owjsmt8.uc.gateway.dev/ticker");
  const data = await res.json();

  return data.map((p: any) => ({
    id: `bitflow-${p.id}`,
    platform: "Bitflow",
    name: `${p.token0.symbol}-${p.token1.symbol}`,
    apy: Number(p.apy ?? p.apr ?? 0),
    tvl: Number(p.tvl ?? 0),
    risk: "medium",
    url: "https://app.bitflow.finance/",
  }));
}
