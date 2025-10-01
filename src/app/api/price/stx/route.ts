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
    try {
      const primary = await fetchPrice("https://api.coingecko.com/api/v3/simple/price?ids=stacks&vs_currencies=usd");
      usd = primary?.stacks?.usd ?? null;
    } catch {}
    if (usd === null) {
      const fb = await fetchPrice("https://api.coingecko.com/api/v3/simple/price?ids=blockstack&vs_currencies=usd");
      usd = fb?.blockstack?.usd ?? null;
    }
    if (usd === null) return NextResponse.json({ usd: null }, { status: 200 });
    return NextResponse.json({ usd }, { status: 200 });
  } catch (e) {
    return NextResponse.json({ usd: null }, { status: 200 });
  }
}


