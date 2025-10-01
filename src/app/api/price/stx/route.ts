import { NextResponse } from "next/server";

export const revalidate = 60; // cache for 60s

export async function GET() {
  async function fetchPrice(url: string) {
    const res = await fetch(url, { next: { revalidate: 60 } });
    if (!res.ok) throw new Error(`price fetch failed ${res.status}`);
    return res.json();
  }

  try {
    let usd: number | null = null;
    // 1) CoinGecko primary
    try {
      const primary = await fetchPrice("https://api.coingecko.com/api/v3/simple/price?ids=stacks&vs_currencies=usd");
      usd = primary?.stacks?.usd ?? null;
    } catch {}
    // 2) CoinGecko fallback key name
    if (usd === null) {
      try {
        const fb = await fetchPrice("https://api.coingecko.com/api/v3/simple/price?ids=blockstack&vs_currencies=usd");
        usd = fb?.blockstack?.usd ?? null;
      } catch {}
    }
    // 3) CoinCap
    if (usd === null) {
      try {
        const cc = await fetchPrice("https://api.coincap.io/v2/assets/stacks");
        const val = cc?.data?.priceUsd ? Number(cc.data.priceUsd) : null;
        usd = Number.isFinite(val) ? val : null;
      } catch {}
    }
    // 4) Binance STXUSDT
    if (usd === null) {
      try {
        const bz = await fetchPrice("https://api.binance.com/api/v3/ticker/price?symbol=STXUSDT");
        const val = bz?.price ? Number(bz.price) : null;
        usd = Number.isFinite(val) ? val : null;
      } catch {}
    }
    const sanitized = typeof usd === "number" && isFinite(usd) && usd >= 0.01 && usd <= 10 ? usd : 0.6;
    return NextResponse.json({ usd: sanitized }, { status: 200 });
  } catch (e) {
    return NextResponse.json({ usd: null }, { status: 200 });
  }
}


