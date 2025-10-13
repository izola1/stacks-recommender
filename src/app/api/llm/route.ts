import { NextRequest, NextResponse } from "next/server";
import { queryHuggingFaceLLM } from "@/lib/hfLLM";
import { queryGroqLLM } from "@/lib/groqLLM";

export async function POST(req: NextRequest) {
    const { prompt, model, provider } = await req.json();
    if (!prompt) {
        return NextResponse.json({ error: "Prompt required" }, { status: 400 });
    }
    try {
        console.log("[API] Received model:", model);
        if (provider === "groq") {
            const groqApiKey = process.env.GROQ_API_KEY;
            if (!groqApiKey) {
                return NextResponse.json({ error: "Groq API key not set" }, { status: 500 });
            }
            // Log the model name for debugging
            console.log("[Groq] Passing model to utility:", model);
            const result = await queryGroqLLM({ prompt, model, apiKey: groqApiKey });
            return NextResponse.json({ result, modelUsed: model });
        } else {
            const hfApiKey = process.env.HUGGINGFACE_API_KEY;
            if (!hfApiKey) {
                return NextResponse.json({ error: "Hugging Face API key not set" }, { status: 500 });
            }
            console.log("[HF] Passing model to utility:", model);
            const result = await queryHuggingFaceLLM({ prompt, model, apiKey: hfApiKey });
            return NextResponse.json({ result, modelUsed: model });
        }
    } catch (e: any) {
        if (e.response && e.response.data) {
            return NextResponse.json({ error: e.message, details: e.response.data, modelUsed: model }, { status: e.response.status || 500 });
        }
        return NextResponse.json({ error: e.message || "LLM error", modelUsed: model }, { status: 500 });
    }
}
