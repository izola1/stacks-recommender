import { NextResponse } from "next/server";
import axios from "axios";

export async function POST(req: Request) {
  try {
    const { goal = "yield", minApy = 0, limit = 6 } = await req.json();

    // 🔗 Fetch Velar pools
    const res = await axios.get("https://api.velar.co/pools/");
    const pools = Array.isArray(res.data) ? res.data : res.data?.data || [];

    // 🧩 Normalize Velar pool data
    const normalized = pools.map((p: any) => {
      const apy = Math.max(0, Number(p?.stats?.apy ?? 0));
      const tvl = Math.max(0, Number(p?.stats?.tvl_usd?.value ?? 0));

      return {
        id: p.lpTokenContractAddress || p.symbol,
        platform: "Velar",
        name: p.symbol || `${p.token0Symbol}/${p.token1Symbol}`,
        apy,
        tvl,
        risk: apy > 30 ? "high" : apy > 10 ? "medium" : "low",
        url: `https://app.velar.io/pool/${p.lpTokenContractAddress}`,
      };
    });

    // 🧮 Apply APY filter (≥ minApy)
    let filtered = normalized
      .filter((p: { apy: number }) => p.apy >= minApy)
      .sort((a: { apy: number }, b: { apy: number }) => b.apy - a.apy)
      .slice(0, limit);

    let message = `Showing pools with APY ≥ ${minApy}%.`;

    // 🪄 Graceful fallback if no matches
    if (filtered.length === 0) {
      filtered = normalized
        .sort((a: { apy: number }, b: { apy: number }) => b.apy - a.apy)
        .slice(0, limit);
      message = `No pools matched your APY ≥ ${minApy}%. Showing top ${filtered.length} pools instead.`;
    }

    // ✨ NEW: Ask AI to analyze these pools
    let aiSummary = "No AI insights available.";
    try {
      const aiRes = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          goal,
          minApy,
          pools: filtered,
        }),
      });

      if (aiRes.ok) {
        const aiData = await aiRes.json();
        aiSummary = aiData.summary || aiSummary;
      }
    } catch (err) {
      console.warn("⚠️ AI reasoning layer failed:", err.message);
    }

    // ✅ Return combined response
    return NextResponse.json({
      result: filtered,
      count: filtered.length,
      message,
      aiSummary,
    });
  } catch (err: any) {
    console.error("❌ Velar Recommendation API Error:", err.message);
    return NextResponse.json(
      { error: "Failed to fetch recommendations from Velar." },
      { status: 500 }
    );
  }
}



// import { NextResponse } from "next/server";
// import axios from "axios";

// export async function POST(req: Request) {
//   try {
//     const { minApy = 0, limit = 6 } = await req.json();

//     // 🔗 Fetch Velar pools
//     const res = await axios.get("https://api.velar.co/pools/");
//     const pools = Array.isArray(res.data) ? res.data : res.data?.data || [];

//     // 🧩 Normalize Velar pool data
//     const normalized = pools.map((p: any) => {
//       const apy = Math.max(0, Number(p?.stats?.apy ?? 0));
//       const tvl = Math.max(0, Number(p?.stats?.tvl_usd?.value ?? 0));

//       return {
//         id: p.lpTokenContractAddress || p.symbol,
//         platform: "Velar",
//         name: p.symbol || `${p.token0Symbol}/${p.token1Symbol}`,
//         apy,
//         tvl,
//         risk: apy > 30 ? "high" : apy > 10 ? "medium" : "low",
//         url: `https://app.velar.io/pool/${p.lpTokenContractAddress}`,
//       };
//     });

//     // 🧮 Apply APY filter (≥ minApy)
//     let filtered = normalized
//       .filter((p: { apy: number }) => p.apy >= minApy)
//       .sort((a: { apy: number }, b: { apy: number }) => b.apy - a.apy)
//       .slice(0, limit);

//     // 🪄 Graceful fallback if no matches
//     if (filtered.length === 0) {
//       filtered = normalized
//         .sort((a: { apy: number }, b: { apy: number }) => b.apy - a.apy)
//         .slice(0, limit);
//       return NextResponse.json({
//         result: filtered,
//         count: filtered.length,
//         message: `No pools matched your APY ≥ ${minApy}%. Showing top ${filtered.length} pools instead.`,
//       });
//     }

//     return NextResponse.json({
//       result: filtered,
//       count: filtered.length,
//       message: `Showing pools with APY ≥ ${minApy}%.`,
//     });
//   } catch (err: any) {
//     console.error("❌ Velar Recommendation API Error:", err.message);
//     return NextResponse.json(
//       { error: "Failed to fetch recommendations from Velar." },
//       { status: 500 }
//     );
//   }
// }


// import { NextResponse } from "next/server";
// import axios from "axios";

// export async function POST(req: Request) {
//   try {
//     const { minApy = 0, limit = 6 } = await req.json();

//     // 🔗 Fetch Velar pools
//     const res = await axios.get("https://api.velar.co/pools/");
//     const pools = Array.isArray(res.data) ? res.data : res.data?.data || [];

//     // 🧩 Normalize Velar pool data
//     const normalized = pools.map((p: any) => {
//       const apy = Number(p?.stats?.apy ?? 0);
//       const tvl = Number(p?.stats?.tvl_usd?.value ?? 0);

//       return {
//         id: p.lpTokenContractAddress || p.symbol,
//         platform: "Velar",
//         name: p.symbol || `${p.token0Symbol}/${p.token1Symbol}`,
//         apy,
//         tvl,
//         risk: apy > 30 ? "high" : apy > 10 ? "medium" : "low",
//         url: `https://app.velar.io/pool/${p.lpTokenContractAddress}`,
//       };
//     });

//     // 🧮 Apply APY filter (≤ minApy)
//     let filtered = normalized
//       .filter((p: { apy: number }) => p.apy <= minApy)
//       .sort((a: { apy: number }, b: { apy: number }) => b.apy - a.apy)
//       .slice(0, limit);

//     // 🪄 Graceful fallback if no matches
//     if (filtered.length === 0) {
//       filtered = normalized.sort((a: { apy: number }, b: { apy: number }) => b.apy - a.apy).slice(0, limit);
//       return NextResponse.json({
//         result: filtered,
//         count: filtered.length,
//         message: `No pools matched your ${minApy}% APY filter — showing top ${filtered.length} available pools instead.`,
//       });
//     }

//     return NextResponse.json({
//       result: filtered,
//       count: filtered.length,
//       message: `Showing pools with APY ≤ ${minApy}%`,
//     });
//   } catch (err: any) {
//     console.error("❌ Velar Recommendation API Error:", err.message);
//     return NextResponse.json(
//       { error: "Failed to fetch recommendations from Velar." },
//       { status: 500 }
//     );
//   }
// }



// import { NextResponse } from "next/server";
// import axios from "axios";

// export async function POST(req: Request) {
//   try {
//     const { minApy = 0, limit = 6 } = await req.json();

//     // 🔗 Fetch Velar pools
//     const res = await axios.get("https://api.velar.co/pools/");
//     const pools = Array.isArray(res.data) ? res.data : [];

//     // 🧩 Normalize Velar pool data
//     const normalized = pools.map((p: any) => {
//       const apy = Number(p?.stats?.apy ?? 0);
//       const tvl = Number(p?.tvl_usd?.value ?? 0);

//       return {
//         id: p.lpTokenContractAddress || p.symbol,
//         platform: "Velar",
//         name: p.symbol || `${p.token0Symbol}/${p.token1Symbol}`,
//         apy,
//         tvl,
//         risk: apy > 30 ? "high" : apy > 10 ? "medium" : "low",
//         url: `https://app.velar.com/pool/${p.lpTokenContractAddress}`,
//       };
//     });

//     // 🧮 Apply APY filter
//     let filtered = normalized
//       .filter((p) => p.apy >= minApy)
//       .sort((a, b) => b.apy - a.apy)
//       .slice(0, limit);

//     // 🪄 Graceful fallback if filter is too strict
//     if (filtered.length === 0) {
//       const topFallback = normalized
//         .sort((a, b) => b.apy - a.apy)
//         .slice(0, limit);

//       return NextResponse.json({
//         result: topFallback,
//         count: topFallback.length,
//         message: `No pools met your ${minApy}% APY filter — showing top ${topFallback.length} pools instead.`,
//       });
//     }

//     return NextResponse.json({
//       result: filtered,
//       count: filtered.length,
//     });
//   } catch (err: any) {
//     console.error("❌ Velar Recommendation API Error:", err.message);
//     return NextResponse.json(
//       { error: "Failed to fetch recommendations from Velar." },
//       { status: 500 }
//     );
//   }
// }



// // /src/app/api/recommendations/route.ts
// import { NextResponse } from "next/server";
// import axios from "axios";

// export async function POST(req: Request) {
//   try {
//     const { goal, minApy = 0, limit = 6 } = await req.json();

//     // 🪙 4 Stacks-aligned DeFi APIs
//     const sources = [
//       { name: "Alex", url: "https://api.alexgo.io/v1/tickers" },
//       { name: "Arkadiko", url: "https://arkadiko-api.herokuapp.com/api/v1/tickers" },
//       { name: "Velar", url: "https://api.velar.co/pools" },
//       { name: "Bitflow", url: "https://bitflow-sdk-api-gateway-7owjsmt8.uc.gateway.dev/ticker" },
//     ];

//     // Fetch all concurrently
//     const results = await Promise.allSettled(
//       sources.map((s) => axios.get(s.url).then((res) => ({ ...s, data: res.data })))
//     );

//     // Normalize and combine
//     const allMarkets = results.flatMap((r) => {
//       if (r.status !== "fulfilled") return [];
//       const { name, data } = r.value;
//       return normalizeData(name, data);
//     });

//     // Filter and sort
//     const filtered = allMarkets
//       .filter((m) => m.apy >= minApy)
//       .sort((a, b) => b.apy - a.apy)
//       .slice(0, limit);

//     return NextResponse.json({ result: filtered, count: filtered.length });
//   } catch (err: any) {
//     console.error("❌ Recommendation API Error:", err);
//     return NextResponse.json({ error: "Failed to fetch recommendations" }, { status: 500 });
//   }
// }

// // 🔧 Normalize various APIs into a unified format
// function normalizeData(platform: string, data: any): any[] {
//   switch (platform) {
//     case "Alex":
//       return (data?.data || []).map((d: any) => ({
//         id: `alex-${d.symbol}`,
//         platform,
//         name: d.symbol,
//         apy: parseFloat(d.apy || 0),
//         tvl: parseFloat(d.tvl || 0),
//         risk: "medium",
//         url: "https://app.alexgo.io/",
//       }));
//     case "Arkadiko":
//       return (data || []).map((d: any) => ({
//         id: `arkadiko-${d.ticker || d.name}`,
//         platform,
//         name: d.ticker || d.name,
//         apy: parseFloat(d.apy || 0),
//         tvl: parseFloat(d.tvl_usd || 0),
//         risk: "low",
//         url: "https://app.arkadiko.finance/",
//       }));
//     case "Velar":
//       return (data?.pools || []).map((d: any) => ({
//         id: `velar-${d.pool_id}`,
//         platform,
//         name: `${d.token0.symbol}/${d.token1.symbol}`,
//         apy: parseFloat(d.apy || 0),
//         tvl: parseFloat(d.tvl_usd || 0),
//         risk: "medium",
//         url: "https://app.velar.io/",
//       }));
//     case "Bitflow":
//       return (data?.result || []).map((d: any) => ({
//         id: `bitflow-${d.symbol}`,
//         platform,
//         name: d.symbol,
//         apy: parseFloat(d.apy || 0),
//         tvl: parseFloat(d.tvl || 0),
//         risk: "medium",
//         url: "https://app.bitflow.finance/",
//       }));
//     default:
//       return [];
//   }
// }



// import { fetchAllPools } from "@/lib/pools";

// export async function POST(req: Request) {
//   try {
//     const { goal, minApy } = await req.json();

//     const allPools = await fetchAllPools();

//     // Filter based on user preferences
//     const filtered = allPools.filter(
//       (p) => (p.apy ?? 0) >= (minApy ?? 0)
//     );

//     return Response.json({
//       result: filtered,
//       count: filtered.length,
//     });
//   } catch (err) {
//     console.error("Error fetching pools:", err);
//     return new Response("Internal Server Error", { status: 500 });
//   }
// }


// import { NextResponse } from "next/server";
// import { fetchAllPools } from "@/lib/providers";

// export async function POST(req: Request) {
//   try {
//     const { goal, minApy } = await req.json();

//     const allPools = await fetchAllPools();

//     console.log("✅ All Pools Raw Data:", allPools.slice(0, 5));


//     // Basic filtering by min APY
//     let filtered = allPools.filter((p) => p.apy >= (minApy || 0));

//     // Goal-based sorting
//     if (goal === "yield") filtered.sort((a, b) => b.apy - a.apy);
//     else if (goal === "low-risk")
//       filtered.sort((a, b) => a.apy - b.apy);
//     else if (goal === "hands-off")
//       filtered.sort((a, b) => a.risk.localeCompare(b.risk));

//     return NextResponse.json({ recommendations: filtered.slice(0, 10) });
//   } catch (err) {
//     console.error("Recommendations API failed:", err);
//     return NextResponse.json(
//       { error: "Failed to fetch recommendations" },
//       { status: 500 }
//     );
//   }
// }


// import { NextResponse } from "next/server";
// import { mockBitcoinPools } from "@/data/mockBitcoinPools";

// export async function POST(req: Request) {
//   try {
//     const { goal, minApy = 0 } = await req.json();

//     // Step 1: Filter pools by minimum APY
//     const filtered = mockBitcoinPools.filter((p) => p.apy >= minApy);

//     // Step 2: Rank pools based on user goal
//     let ranked = filtered;
//     if (goal === "yield") {
//       ranked = [...filtered].sort((a, b) => b.apy - a.apy);
//     } else if (goal === "low-risk") {
//       ranked = [...filtered].sort((a, b) => riskRank(a) - riskRank(b));
//     } else if (goal === "hands-off") {
//       ranked = [...filtered].sort((a, b) => b.apy * 0.7 + (3 - riskRank(a)) * 0.3);
//     }

//     return NextResponse.json({
//       success: true,
//       result: ranked,
//       source: "mock-bitcoin-pools"
//     });
//   } catch (err: any) {
//     console.error("Error generating recommendations:", err);
//     return NextResponse.json(
//       { success: false, error: err.message || "Internal server error" },
//       { status: 500 }
//     );
//   }
// }

// function riskRank(pool: any) {
//   const map = { low: 1, medium: 2, high: 3 };
//   return map[pool.riskLevel] ?? 2;
// }



// import { NextResponse } from "next/server";
// import { mockPools } from "@/lib/mockPools";
// import { scorePool } from "@/lib/risk";

// const DEFI_LLAMA_URL = "https://yields.llama.fi/pools";

// export async function POST(req: Request) {
//   try {
//     const { address, goal = "yield", minApy = 0, limit = 6 } = await req.json();

//     if (!address) {
//       return NextResponse.json(
//         { error: "Missing wallet address" },
//         { status: 400 }
//       );
//     }

//     // 1️⃣ Try fetching live market data (DefiLlama)
//     let pools: any[] = [];
//     try {
//       const res = await fetch(DEFI_LLAMA_URL, { next: { revalidate: 60 } });
//       const data = await res.json();
//       if (Array.isArray(data.data)) {
//         pools = data.data.map((p) => ({
//           id: p.pool,
//           name: p.project,
//           platform: p.chain,
//           apy: p.apy || 0,
//           risk:
//             p.risk === "low"
//               ? "low"
//               : p.apy < 10
//               ? "medium"
//               : "high",
//           url: p.url || `https://defillama.com/yields/pool/${p.pool}`,
//         }));
//       }
//     } catch (err) {
//       console.warn("⚠️ DefiLlama API failed, falling back to mock pools.");
//       pools = mockPools;
//     }

//     // 2️⃣ Fallback to mock data if no live data available
//     if (!pools || pools.length === 0) {
//       pools = mockPools;
//     }

//     // 3️⃣ Filter by preferences
//     const filtered = pools.filter((p) => {
//       const apyOk = p.apy >= minApy;
//       const goalOk =
//         goal === "yield"
//           ? true // Show all for yield goal
//           : goal === "low-risk"
//           ? p.risk === "low" || p.risk === "medium"
//           : goal === "hands-off"
//           ? p.name.toLowerCase().includes("auto") ||
//             p.name.toLowerCase().includes("vault") ||
//             p.platform.toLowerCase().includes("auto")
//           : true;
//       return apyOk && goalOk;
//     });

//     // 4️⃣ Score and rank
//     const ranked = filtered
//       .map((p) => ({
//         ...p,
//         score: scorePool(p, goal),
//       }))
//       .sort((a, b) => b.score - a.score)
//       .slice(0, limit);

//     return NextResponse.json({ recommendations: ranked });
//   } catch (err) {
//     console.error("❌ Error in /api/recommendations:", err);
//     return NextResponse.json(
//       { error: "Failed to process recommendations" },
//       { status: 500 }
//     );
//   }
// }



// import { NextResponse } from "next/server";
// import { mockPools } from "@/lib/mockPools";
// import { scorePool } from "@/lib/risk";

// export async function POST(req: Request) {
//   try {
//     const { address, goal = "yield", minApy = 0, limit = 6 } = await req.json();

//     if (!address) {
//       return NextResponse.json(
//         { error: "Missing wallet address" },
//         { status: 400 }
//       );
//     }

//     // 1️⃣ Filter pools based on preferences
//     const filtered = mockPools.filter((p) => {
//       const apyOk = p.apy >= minApy;
//       const goalOk =
//         goal === "yield"
//           ? true // show all, then sorted by yield
//           : goal === "low-risk"
//           ? p.risk === "low" || p.risk === "medium"
//           : goal === "hands-off"
//           ? p.platform.toLowerCase().includes("auto") ||
//             p.name.toLowerCase().includes("auto") ||
//             p.name.toLowerCase().includes("vault")
//           : true;
//       return apyOk && goalOk;
//     });

//     // 2️⃣ Rank by score
//     const ranked = filtered
//       .map((p) => ({
//         ...p,
//         score: scorePool(p, goal),
//       }))
//       .sort((a, b) => b.score - a.score)
//       .slice(0, limit);

//     // 3️⃣ Return results
//     return NextResponse.json({ recommendations: ranked });
//   } catch (err) {
//     console.error("❌ Error in /api/recommendations:", err);
//     return NextResponse.json(
//       { error: "Failed to process recommendation request" },
//       { status: 500 }
//     );
//   }
// }




// import { NextResponse } from "next/server";
// import { fetchAllPools } from "@/lib/providers";
// import { scorePool } from "@/lib/risk";
// import type { Goal } from "@/components/Preferences";
// import type { Pool } from "@/lib/mockPools";

// export const revalidate = 0;

// type ReqBody = {
//   address?: string | null;
//   goal: Goal;
//   minApy: number;
//   limit?: number;
// };

// // Simple per-IP in-memory rate limiter (best-effort in serverless)
// const rlMap = new Map<string, { count: number; windowStart: number }>();
// const RL_WINDOW_MS = 60 * 1000; // 1 minute
// const RL_MAX = 60; // allow up to 60 scans/min per IP

// function rateLimit(ip: string | null | undefined): boolean {
//   const key = ip || "unknown";
//   const now = Date.now();
//   const cur = rlMap.get(key);
//   if (!cur || now - cur.windowStart > RL_WINDOW_MS) {
//     rlMap.set(key, { count: 1, windowStart: now });
//     return true;
//   }
//   if (cur.count >= RL_MAX) return false;
//   cur.count += 1;
//   return true;
// }

// export async function POST(req: Request) {
//   try {
//     // Body size cap via Content-Length (best-effort)
//     const len = Number((req.headers as any).get?.("content-length") || 0);
//     if (len && len > 20 * 1024) {
//       return NextResponse.json({ recommendations: [], error: "payload_too_large" }, { status: 413 });
//     }

//     // Rate limit by IP
//     const xf = (req.headers as any).get?.("x-forwarded-for") as string | null | undefined;
//     const ip = xf ? xf.split(",")[0]?.trim() : null;
//     if (!rateLimit(ip)) {
//       return NextResponse.json({ recommendations: [], error: "rate_limited" }, { status: 429 });
//     }

//     const body = (await req.json()) as ReqBody;
//     const goal = body.goal ?? "yield";
//     const minApy = Math.max(0, Math.min(100, Number(body.minApy ?? 0)));
//     const limit = Math.min(10, Math.max(1, Number(body.limit ?? 6)));

//     // Fetch pools from all supported platforms (ALEX, Arkadiko, StackSwap, Bitflow)
//     const pools: Pool[] = await fetchAllPools();

//     const filtered = pools
//       .filter((p) => p.apy >= minApy)
//       .sort((a, b) => scorePool(b, goal) - scorePool(a, goal))
//       .slice(0, limit);

//     return NextResponse.json(
//       {
//         recommendations: filtered,
//         meta: { goal, minApy, limit, count: filtered.length },
//       },
//       { status: 200 }
//     );
//   } catch {
//     return NextResponse.json({ recommendations: [], error: "scan_failed" }, { status: 200 });
//   }
// }


