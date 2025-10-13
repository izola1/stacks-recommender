import { NextRequest, NextResponse } from "next/server";

export async function GET() {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
        return NextResponse.json({ error: "Groq API key not set" }, { status: 500 });
    }
    try {
        const res = await fetch("https://api.groq.com/openai/v1/models", {
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json"
            }
        });
        if (!res.ok) {
            const err = await res.json();
            return NextResponse.json({ error: err.error?.message || "Failed to fetch models" }, { status: res.status });
        }
        const data = await res.json();
        const models = data.data?.map((m: any) => m.id) || [];
        return NextResponse.json({ models });
    } catch (e: any) {
        return NextResponse.json({ error: e.message || "Request failed" }, { status: 500 });
    }
}
