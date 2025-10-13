import { NextResponse } from "next/server";

// Simple in-memory cache to smooth over brief rate limits
let lastUsd: number | null = null;
let lastAt = 0;

export const revalidate = 60; // cache for 60s

export async function GET() {
  // Optional pinned provider to exactly match wallet source
  const provider = process.env.STX_PRICE_PROVIDER; // 'coingecko-pro' | 'cryptocompare' | 'custom'
  const apiKey = process.env.STX_PRICE_API_KEY;
  const customUrl = process.env.STX_PRICE_URL; // must return { usd: number }
  const overrideUsdRaw = process.env.STX_PRICE_OVERRIDE_USD;
  const overrideUsd = overrideUsdRaw ? Number(overrideUsdRaw) : null;

  async function fetchPrice(url: string) {
    const res = await fetch(url, { next: { revalidate: 60 } });
    if (!res.ok) throw new Error(`price fetch failed ${res.status}`);
    return res.json();
  }

  try {
    // 0) Explicit override for demos – takes precedence
    if (typeof overrideUsd === "number" && isFinite(overrideUsd) && overrideUsd > 0) {
      lastUsd = overrideUsd;
      lastAt = Date.now();
      return NextResponse.json({ usd: overrideUsd, source: "override" }, { status: 200 });
    }

    // If env is configured, pin to that provider to match wallet exactly
    if (provider === "coingecko-pro" && apiKey) {
      try {
        const res = await fetch("https://pro-api.coingecko.com/api/v3/simple/price?ids=stacks&vs_currencies=usd", {
          headers: { "x-cg-pro-api-key": apiKey },
          next: { revalidate: 30 },
        });
        if (res.ok) {
          const j = await res.json();
          const usd = j?.stacks?.usd ?? null;
          if (typeof usd === "number" && isFinite(usd)) {
            lastUsd = usd;
            lastAt = Date.now();
            return NextResponse.json({ usd, source: "coingecko-pro" }, { status: 200 });
          }
        }
      } catch {}
    }

    if (provider === "cryptocompare" && apiKey) {
      try {
        const res = await fetch("https://min-api.cryptocompare.com/data/price?fsym=STX&tsyms=USD", {
          headers: { Authorization: `Apikey ${apiKey}` },
          next: { revalidate: 30 },
        });
        if (res.ok) {
          const j = await res.json();
          const usd = j?.USD ? Number(j.USD) : null;
          if (typeof usd === "number" && isFinite(usd)) {
            lastUsd = usd;
            lastAt = Date.now();
            return NextResponse.json({ usd, source: "cryptocompare" }, { status: 200 });
          }
        }
      } catch {}
    }

    if (provider === "custom" && customUrl) {
      try {
        const res = await fetch(customUrl, { next: { revalidate: 30 } });
        if (res.ok) {
          const j = await res.json();
          const usd = j?.usd ?? null;
          if (typeof usd === "number" && isFinite(usd)) {
            lastUsd = usd;
            lastAt = Date.now();
            return NextResponse.json({ usd, source: "custom" }, { status: 200 });
          }
        }
      } catch {}
    }

    // Prefer exact price from CoinGecko; fallback to Binance and CoinCap; sanitize and cache
    let usd: number | null = null;
    let source: string | null = null;
    // 1) CoinGecko primary
    try {
      const primary = await fetchPrice("https://api.coingecko.com/api/v3/simple/price?ids=stacks&vs_currencies=usd");
      usd = primary?.stacks?.usd ?? null;
      if (usd !== null) source = "coingecko";
    } catch {}
    // 2) CoinGecko alt key
    if (usd === null) {
      try {
        const fb = await fetchPrice("https://api.coingecko.com/api/v3/simple/price?ids=blockstack&vs_currencies=usd");
        usd = fb?.blockstack?.usd ?? null;
        if (usd !== null) source = "coingecko_blockstack";
      } catch {}
    }
    // 3) Binance STXUSDT
    if (usd === null) {
      try {
        const bz = await fetchPrice("https://api.binance.com/api/v3/ticker/price?symbol=STXUSDT");
        const val = bz?.price ? Number(bz.price) : null;
        usd = Number.isFinite(val) ? val : null;
        if (usd !== null) source = "binance";
      } catch {}
    }
    // 4) CoinCap
    if (usd === null) {
      try {
        const cc = await fetchPrice("https://api.coincap.io/v2/assets/stacks");
        const val = cc?.data?.priceUsd ? Number(cc.data.priceUsd) : null;
        usd = Number.isFinite(val) ? val : null;
        if (usd !== null) source = "coincap";
      } catch {}
    }
    // 5) CryptoCompare (no key basic endpoint)
    if (usd === null) {
      try {
        const cc = await fetchPrice("https://min-api.cryptocompare.com/data/price?fsym=STX&tsyms=USD");
        const val = cc?.USD ? Number(cc.USD) : null;
        usd = Number.isFinite(val) ? val : null;
        if (usd !== null) source = "cryptocompare_public";
      } catch {}
    }
    // If we have a numeric value and it's sane (between $0.01 and $10), return it and cache
    const now = Date.now();
    const isSane = typeof usd === "number" && isFinite(usd) && usd >= 0.01 && usd <= 10;
    if (isSane) {
      lastUsd = usd as number;
      lastAt = now;
      return NextResponse.json({ usd: lastUsd, source: source ?? "public" }, { status: 200 });
    }
    // Fallback to cached price within 30 minutes if present
    if (lastUsd !== null && now - lastAt < 30 * 60 * 1000) {
      return NextResponse.json({ usd: lastUsd, source: "cache" }, { status: 200 });
    }
    // Final fallback to a modest constant to avoid nulls in demo
    return NextResponse.json({ usd: 0.6, source: "fallback" }, { status: 200 });
  } catch (e) {
    return NextResponse.json({ usd: null, source: "error" }, { status: 200 });
  }
}


