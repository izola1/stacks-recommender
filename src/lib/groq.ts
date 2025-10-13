// src/lib/groq.ts
import axios from "axios";

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

export async function queryGroqLLM(prompt: string, model?: string) {
  if (!process.env.GROQ_API_KEY) {
    throw new Error("GROQ_API_KEY is missing in environment variables");
  }

  const chosenModel =
    model ||
    (prompt.length < 250
      ? "llama-3.1-8b-instant"
      : "llama-3.3-70b-versatile");

  try {
    const response = await axios.post(
      GROQ_API_URL,
      {
        model: chosenModel,
        messages: [{ role: "user", content: prompt }], // ✅ content is always string
        temperature: 0.7,
        max_tokens: 1000,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    return response.data.choices?.[0]?.message?.content?.trim() || "No response";
  } catch (error: any) {
    console.error("❌ Groq API error:", error.response?.data || error.message);
    throw new Error("Groq API request failed");
  }
}





// // src/lib/groq.ts
// import axios from "axios";

// const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

// export async function queryGroqLLM(prompt: string, model?: string) {
//   if (!process.env.GROQ_API_KEY) {
//     throw new Error("GROQ_API_KEY is missing in environment variables");
//   }

//   // 🧠 Auto-select based on prompt length or explicit override
//   const chosenModel =
//     model ||
//     (prompt.length < 250
//       ? "llama-3.1-8b-instant" // ⚡ short prompt = fast model
//       : "llama-3.3-70b-versatile"); // 🧠 longer prompt = reasoning model

//   try {
//     const response = await axios.post(
//       GROQ_API_URL,
//       {
//         model: chosenModel,
//         messages: [{ role: "user", content: prompt }],
//         temperature: 0.7,
//         max_tokens: 1000,
//       },
//       {
//         headers: {
//           Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
//           "Content-Type": "application/json",
//         },
//       }
//     );

//     return response.data.choices?.[0]?.message?.content?.trim() || "No response";
//   } catch (error: any) {
//     console.error("❌ Groq API error:", error.response?.data || error.message);
//     throw new Error("Groq API request failed");
//   }
// }





// // src/lib/groq.ts
// import axios from "axios";

// /**
//  * Unified Groq LLM utility for both server and client use.
//  * Securely handles API keys and environment variables.
//  */

// const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

// interface GroqQueryOptions {
//   prompt: string;
//   model?: string;
//   apiKey?: string; // Optional (will use env var if not provided)
//   temperature?: number;
//   maxTokens?: number;
// }

// export async function queryGroqLLM({
//   prompt,
//   model = "llama3-70b-8192",
//   apiKey,
//   temperature = 0.7,
//   maxTokens = 1000,
// }: GroqQueryOptions): Promise<string> {
//   // Use provided API key or fallback to environment variable
//   const key =
//     apiKey ||
//     (typeof process !== "undefined"
//       ? process.env.GROQ_API_KEY
//       : undefined);

//   if (!key) {
//     throw new Error(
//       "❌ Groq API key not found. Provide it via GROQ_API_KEY env variable or apiKey parameter."
//     );
//   }

//   try {
//     const response = await axios.post(
//       GROQ_API_URL,
//       {
//         model,
//         messages: [{ role: "user", content: prompt }],
//         temperature,
//         max_tokens: maxTokens,
//       },
//       {
//         headers: {
//           Authorization: `Bearer ${key}`,
//           "Content-Type": "application/json",
//         },
//       }
//     );

//     const content =
//       response.data?.choices?.[0]?.message?.content?.trim() ||
//       "⚠️ No content returned by Groq API.";
//     return content;
//   } catch (error: any) {
//     console.error("❌ Groq API request failed:", error.response?.data || error);
//     throw new Error(
//       error.response?.data?.error?.message ||
//         "Groq API request failed. Check your API key or prompt."
//     );
//   }
// }


// import axios from "axios";

// const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

// /**
//  * Sends a prompt to Groq LLM API and returns the model's text response.
//  * 
//  * @param prompt - The natural language input sent to the Groq model
//  * @param model - The model to use (default: "llama3-70b-8192")
//  * @returns The AI-generated text content
//  */
// export async function queryGroqLLM(prompt: string, model = "llama3-70b-8192") {
//   if (!process.env.GROQ_API_KEY) {
//     throw new Error("GROQ_API_KEY is missing in environment variables");
//   }

//   try {
//     const response = await axios.post(
//       GROQ_API_URL,
//       {
//         model,
//         messages: [{ role: "user", content: prompt }],
//         temperature: 0.7,
//         max_tokens: 1000,
//       },
//       {
//         headers: {
//           Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
//           "Content-Type": "application/json",
//         },
//       }
//     );

//     const content = response.data.choices?.[0]?.message?.content?.trim();
//     return content || "No response from Groq model.";
//   } catch (error: any) {
//     console.error("❌ Groq API error:", error.response?.data || error.message);
//     throw new Error("Groq API request failed");
//   }
// }
