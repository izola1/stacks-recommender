// src/lib/groqLLM.ts
// Utility to call Groq LLM API for completions

import axios from "axios";

export async function queryGroqLLM({ prompt, model, apiKey }: { prompt: string, model?: string, apiKey: string }) {
    // Use provided model if non-empty, else default
    const modelId = (typeof model === 'string' && model.trim().length > 0) ? model : "llama2-70b-4096";
    console.log("[Groq Utility] Received model:", model, "| Using modelId:", modelId);
    const url = "https://api.groq.com/openai/v1/chat/completions";

    const headers = {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
    };

    const data = {
        model: modelId,
        messages: [
            { role: "user", content: prompt }
        ],
        max_tokens: 256,
        temperature: 0.7
    };

    const response = await axios.post(url, data, { headers });
    // Groq returns OpenAI-compatible response
    return response.data.choices?.[0]?.message?.content || JSON.stringify(response.data);
}
