// src/app/api/llm-recommend/route.ts
import { NextResponse } from "next/server";
import { queryGroqLLM } from "@/lib/groq";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { address, balances } = body;

    if (!address || !balances || Object.keys(balances).length === 0) {
      return NextResponse.json(
        { error: "Missing wallet address or balances" },
        { status: 400 }
      );
    }

    // 🧠 Build a clear natural language prompt for the LLM
    const prompt = `
You are a DeFi portfolio advisor AI. Analyze the user's wallet and suggest optimal yield or staking opportunities.

Wallet address: ${address}
Token balances:
${Object.entries(balances)
  .map(([symbol, amount]) => `- ${symbol}: ${amount}`)
  .join("\n")}

Return a JSON array of recommendations. Each recommendation should have:
[
  {
    "title": string,
    "platform": string,
    "apy": number | null,
    "url": string | null,
    "reason": string
  }
]
Make sure the response is valid JSON only — no explanations.
`;

    const llmResponse = await queryGroqLLM(prompt);

    // 🧩 Try parsing structured JSON safely
    let result: any[] = [];
    try {
      result = JSON.parse(llmResponse);
    } catch {
      console.warn("⚠️ LLM response not valid JSON, wrapping as text");
      result = [
        {
          title: "AI Recommendation",
          platform: "General",
          apy: null,
          url: null,
          reason: llmResponse,
        },
      ];
    }

    return NextResponse.json({ result });
  } catch (error: any) {
    console.error("LLM API error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch recommendations" },
      { status: 500 }
    );
  }
}



// // src/app/api/llm-recommend/route.ts
// import { NextRequest, NextResponse } from "next/server";
// import { queryGroqLLM } from "@/lib/groq";

// export async function POST(req: NextRequest) {
//   try {
//     const { address, balances } = await req.json();

//     if (!address || !balances) {
//       return NextResponse.json(
//         { error: "Missing wallet address or balances" },
//         { status: 400 }
//       );
//     }

//     const prompt = `
//     You are an expert Stacks DeFi strategist.
//     Analyze the following wallet and balances, and recommend 2–3 optimized DeFi strategies.
    
//     Wallet: ${address}
//     Balances: ${JSON.stringify(balances, null, 2)}

//     Please respond in JSON format as an array like:
//     [
//       { "title": "...", "platform": "...", "apy": 12.5, "url": "https://...", "reason": "..." }
//     ]
//     `;

//     const aiResponse = await queryGroqLLM({ prompt });

//     // Parse or sanitize model output
//     let result;
//     try {
//       result = JSON.parse(aiResponse);
//     } catch {
//       console.warn("AI returned non-JSON text, wrapping it safely.");
//       result = [
//         {
//           title: "General Recommendation",
//           platform: "Stacks DeFi",
//           reason: aiResponse,
//         },
//       ];
//     }

//     return NextResponse.json({ result }, { status: 200 });
//   } catch (err: any) {
//     console.error("LLM API error:", err);
//     return NextResponse.json(
//       { error: err.message || "Internal Server Error" },
//       { status: 500 }
//     );
//   }
// }




// // src/app/api/llm-recommend/route.ts
// import { NextRequest, NextResponse } from "next/server";
// import { z } from "zod";
// import { queryGroqLLM } from "@/lib/groq";
// import { fetchAllPools } from "@/lib/providers";
// import { getCache, setCache } from "@/lib/cache";

// const RecSchema = z.array(z.object({
//   title: z.string(),
//   platform: z.string(),
//   apy: z.number().nullable().optional(),
//   url: z.string().url().nullable().optional(),
//   reason: z.string(),
// }));

// export async function POST(req: NextRequest) {
//   try {
//     const { address, balances, goal = "maximize yield", model = "mixtral-8x7b" } = await req.json();

//     if (!address || typeof address !== "string")
//       return NextResponse.json({ error: "Invalid wallet address" }, { status: 400 });

//     const cacheKey = `llm:${address}:${goal}`;
//     const cached = getCache(cacheKey);
//     if (cached) return NextResponse.json({ result: cached, cached: true });

//     const pools = await fetchAllPools();
//     const prompt = `You are a DeFi portfolio advisor. Analyze this user's Stacks wallet and recommend the best DeFi opportunities.

// Return ONLY valid JSON in this format:
// [
//   {
//     "title": "string",
//     "platform": "ALEX | Arkadiko | Bitflow | Velar | StackingDAO",
//     "apy": number,
//     "url": "string",
//     "reason": "string"
//   }
// ]

// User balances:
// ${JSON.stringify(balances || {}, null, 2)}

// DeFi Pools (sample):
// ${JSON.stringify(pools.slice(0, 10).map(p => ({
//   name: p.name,
//   platform: p.platform,
//   apy: p.apy,
//   tvl: p.tvl
// })), null, 2)}

// Return ONLY the JSON array, no commentary or markdown.`;

//     const responseText = await queryGroqLLM({
//       prompt,
//       apiKey: process.env.GROQ_API_KEY!,
//       model,
//     });

//     let parsed;
//     try {
//       parsed = JSON.parse(responseText);
//       const validated = RecSchema.parse(parsed);
//       setCache(cacheKey, validated, 2 * 60_000); // cache for 2 minutes
//       return NextResponse.json({ result: validated });
//     } catch (err: any) {
//       return NextResponse.json({
//         error: "Invalid LLM output",
//         raw: responseText,
//         message: err.message,
//       }, { status: 500 });
//     }
//   } catch (err: any) {
//     console.error(err);
//     return NextResponse.json({ error: err.message || "Server error" }, { status: 500 });
//   }
// }



// import { NextRequest, NextResponse } from "next/server";
// import { queryGroqLLM } from "@/lib/groqLLM";
// import { fetchAllPools } from "@/lib/providers";

// export const revalidate = 0;

// // Simple per-IP in-memory rate limiter (best-effort in serverless)
// const rlMap = new Map<string, { count: number; windowStart: number }>();
// const RL_WINDOW_MS = 60 * 1000; // 1 minute
// const RL_MAX = 20; // stricter for LLM endpoint

// function rateLimit(ip: string | null | undefined): boolean {
//     const key = ip || "unknown";
//     const now = Date.now();
//     const cur = rlMap.get(key);
//     if (!cur || now - cur.windowStart > RL_WINDOW_MS) {
//         rlMap.set(key, { count: 1, windowStart: now });
//         return true;
//     }
//     if (cur.count >= RL_MAX) return false;
//     cur.count += 1;
//     return true;
// }

// export async function POST(req: NextRequest) {
//     try {
//         // Body size cap via Content-Length (best-effort)
//         const len = Number(req.headers.get("content-length") || 0);
//         if (len && len > 32 * 1024) {
//             return NextResponse.json({ error: "payload_too_large" }, { status: 413 });
//         }
//         // Rate limit by IP
//         const xf = req.headers.get("x-forwarded-for");
//         const ip = xf ? xf.split(",")[0]?.trim() : null;
//         if (!rateLimit(ip)) {
//             return NextResponse.json({ error: "rate_limited" }, { status: 429 });
//         }
//         const { address, balances, model = "groq/compound-mini" } = await req.json();
//         // Sanitize balances and pool snapshot sizes to avoid prompt bloat
//         const safeBalances = typeof balances === "object" && balances ? JSON.parse(JSON.stringify(balances)) : {};
//         // Fetch live DeFi pools
//         const pools = await fetchAllPools();
//         // Compose a prompt for the LLM
//         const prompt = `You are a DeFi advisor for the Stacks ecosystem. The user has the following wallet balances: ${JSON.stringify(
//             safeBalances
//         )}.

// Here are the current DeFi pools and opportunities (with APY, risk, and platform):\n${JSON.stringify(
//             pools.slice(0, 10).map(p => ({ id: p.id, name: p.name, platform: p.platform, apy: p.apy, risk: p.risk, url: p.url }))
//         )}\n
// Based on the user's balances and the available pools, recommend the top 2-3 actions they could take to maximize yield or minimize risk. For each, explain why it fits their situation, and include the pool name, platform, and APY in your answer.`;

//         const groqApiKey = process.env.GROQ_API_KEY;
//         if (!groqApiKey) {
//             return NextResponse.json({ error: "Groq API key not set" }, { status: 500 });
//         }
//         const result = await queryGroqLLM({ prompt, model, apiKey: groqApiKey });
//         return NextResponse.json({ result, modelUsed: model });
//     } catch (e: any) {
//         return NextResponse.json({ error: e.message || "LLM error" }, { status: 500 });
//     }
// }
