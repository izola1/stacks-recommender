// /src/app/api/analyze/route.ts
import { NextResponse } from "next/server";
import { queryGroqLLM } from "@/lib/groq";

export async function POST(req: Request) {
    try {
        const { goal, minApy, pools } = await req.json();

        if (!pools || pools.length === 0) {
            return NextResponse.json({
                summary: "No pools available for analysis.",
            });
        }

        // 🧠 Build the dynamic prompt
        const prompt = `
You are a DeFi strategist specializing in the Stacks ecosystem. 
Analyze these pool options from Velar and provide personalized insights.

User goal: ${goal === "yield" ? "maximize yield" : "minimize risk"}
User APY preference: ≥ ${minApy}%

Pools:
${pools
                .map(
                    (p: any) =>
                        `• ${p.name}: ${p.apy}% APY, ${p.risk} risk, TVL: ${p.tvl.toFixed(2)}`
                )
                .join("\n")}

Please provide:
1. A short paragraph summarizing the best opportunities for the user.
2. Mention 1–2 specific pools that fit their goal.
3. Tone: helpful, concise, and beginner-friendly.
`;

        // 🧩 Call Groq LLM (Llama 3.3 or 3.1 auto-selection)
        const summary = await queryGroqLLM(prompt);

        return NextResponse.json({ summary });
    } catch (err: any) {
        console.error("❌ AI Analysis Error:", err.message);
        return NextResponse.json(
            { summary: "AI analysis failed. Please try again later." },
            { status: 500 }
        );
    }
}
