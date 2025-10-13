// src/lib/hfLLM.ts
// Utility to call Hugging Face Inference API for LLM completions

import axios from "axios";

export async function queryHuggingFaceLLM({ prompt, model, apiKey }: { prompt: string, model?: string, apiKey: string }) {
    // Default to a popular open LLM (change as needed)
    const modelId = model || "mistralai/Mixtral-8x7B-Instruct-v0.1";
    const url = `https://api-inference.huggingface.co/models/${modelId}`;

    const headers = {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
    };

    const data = {
        inputs: prompt,
        parameters: {
            max_new_tokens: 256,
            temperature: 0.7
        }
    };

    const response = await axios.post(url, data, { headers });
    // The response format may vary by model; handle both string and array outputs
    if (typeof response.data === "string") return response.data;
    if (Array.isArray(response.data) && response.data[0]?.generated_text) return response.data[0].generated_text;
    if (response.data?.generated_text) return response.data.generated_text;
    return JSON.stringify(response.data);
}
