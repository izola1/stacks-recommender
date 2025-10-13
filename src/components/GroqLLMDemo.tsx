"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, Loader2 } from "lucide-react";

type Recommendation = {
  title: string;
  platform: string;
  apy?: number | null;
  url?: string | null;
  reason: string;
};

export default function GroqLLMDemo({
  walletAddress,
  balances,
}: {
  walletAddress: string;
  balances: Record<string, number>;
}) {
  const [loading, setLoading] = useState(false);
  const [recs, setRecs] = useState<Recommendation[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<number | null>(null);

const handleClick = async () => {
  if (!walletAddress) {
    setError("Please connect your wallet first.");
    return;
  }

  if (!balances || Object.keys(balances).length === 0) {
    setError("No balances found to analyze.");
    return;
  }

  setLoading(true);
  setError(null);
  setRecs([]);


    try {
      const res = await fetch("/api/llm-recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address: walletAddress, balances }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to fetch recommendations");

      // ✅ Defensive check for correct shape
      if (!Array.isArray(data.result)) {
        throw new Error("Unexpected response format from server.");
      }

      setRecs(data.result);
    } catch (err: any) {
      console.error("❌ Error fetching recommendations:", err);
      setError(err.message || "Failed to get recommendations.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-3xl mx-auto py-6">
      <Button
        onClick={handleClick}
        disabled={loading}
        className="self-center bg-blue-600 hover:bg-blue-700 text-white"
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Generating recommendations...
          </>
        ) : (
          "Generate AI Recommendations"
        )}
      </Button>

      {error && (
        <div className="text-red-500 bg-red-100 border border-red-300 p-3 rounded-xl">
          {error}
        </div>
      )}

      {!loading && recs.length > 0 && (
        <div className="grid gap-4">
          <AnimatePresence>
            {recs.map((rec, index) => (
              <motion.div
                key={index}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="p-4 rounded-2xl border border-white/10 bg-white/10 backdrop-blur-md shadow-glass"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-white">{rec.title}</h3>
                    <p className="text-sm text-gray-300">
                      Platform:{" "}
                      <span className="font-medium text-blue-400">
                        {rec.platform}
                      </span>
                      {rec.apy && (
                        <span className="ml-2 text-green-400">
                          • APY: {rec.apy.toFixed(2)}%
                        </span>
                      )}
                    </p>
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() =>
                      setExpanded(expanded === index ? null : index)
                    }
                  >
                    {expanded === index ? (
                      <ChevronUp className="w-4 h-4 text-white" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-white" />
                    )}
                  </Button>
                </div>

                <AnimatePresence>
                  {expanded === index && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden mt-3 text-gray-200 text-sm leading-relaxed"
                    >
                      <p>{rec.reason}</p>
                      {rec.url && (
                        <a
                          href={rec.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-2 inline-block text-blue-400 underline"
                        >
                          Visit protocol
                        </a>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}




// // src/components/GroqLLMDemo.tsx
// "use client";

// import { useState } from "react";
// import { motion, AnimatePresence } from "framer-motion";
// import { Button } from "@/components/ui/button";
// import { ChevronDown, ChevronUp, Loader2 } from "lucide-react";

// type Recommendation = {
//   title: string;
//   platform: string;
//   apy?: number | null;
//   url?: string | null;
//   reason: string;
// };

// export default function GroqLLMDemo({
//   walletAddress,
//   balances,
// }: {
//   walletAddress: string;
//   balances: Record<string, number>;
// }) {
//   const [loading, setLoading] = useState(false);
//   const [recs, setRecs] = useState<Recommendation[]>([]);
//   const [error, setError] = useState<string | null>(null);
//   const [expanded, setExpanded] = useState<number | null>(null);

//   const handleClick = async () => {
//     setLoading(true);
//     setError(null);
//     setRecs([]);

//     try {
//       const res = await fetch("/api/llm-recommend", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({
//           address: walletAddress,
//           balances,
//         }),
//       });

//       const data = await res.json();
//       if (!res.ok) throw new Error(data.error || "Failed to fetch recommendations");
//       setRecs(data.result);
//     } catch (err: any) {
//       setError(err.message);
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="flex flex-col gap-6 max-w-3xl mx-auto py-6">
//       <Button
//         onClick={handleClick}
//         disabled={loading}
//         className="self-center bg-blue-600 hover:bg-blue-700 text-white"
//       >
//         {loading ? (
//           <>
//             <Loader2 className="mr-2 h-4 w-4 animate-spin" />
//             Generating recommendations...
//           </>
//         ) : (
//           "Generate AI Recommendations"
//         )}
//       </Button>

//       {error && (
//         <div className="text-red-500 bg-red-100 border border-red-300 p-3 rounded-xl">
//           {error}
//         </div>
//       )}

//       {!loading && recs.length > 0 && (
//         <div className="grid gap-4">
//           <AnimatePresence>
//             {recs.map((rec, index) => (
//               <motion.div
//                 key={index}
//                 layout
//                 initial={{ opacity: 0, y: 10 }}
//                 animate={{ opacity: 1, y: 0 }}
//                 exit={{ opacity: 0 }}
//                 className="p-4 rounded-2xl border border-white/10 bg-white/10 backdrop-blur-md shadow-glass"
//               >
//                 <div className="flex items-center justify-between">
//                   <div>
//                     <h3 className="text-lg font-semibold text-white">{rec.title}</h3>
//                     <p className="text-sm text-gray-300">
//                       Platform:{" "}
//                       <span className="font-medium text-blue-400">
//                         {rec.platform}
//                       </span>
//                       {rec.apy && (
//                         <span className="ml-2 text-green-400">
//                           • APY: {rec.apy.toFixed(2)}%
//                         </span>
//                       )}
//                     </p>
//                   </div>
//                   <Button
//                     size="icon"
//                     variant="ghost"
//                     onClick={() => setExpanded(expanded === index ? null : index)}
//                   >
//                     {expanded === index ? (
//                       <ChevronUp className="w-4 h-4 text-white" />
//                     ) : (
//                       <ChevronDown className="w-4 h-4 text-white" />
//                     )}
//                   </Button>
//                 </div>

//                 <AnimatePresence>
//                   {expanded === index && (
//                     <motion.div
//                       initial={{ opacity: 0, height: 0 }}
//                       animate={{ opacity: 1, height: "auto" }}
//                       exit={{ opacity: 0, height: 0 }}
//                       transition={{ duration: 0.3 }}
//                       className="overflow-hidden mt-3 text-gray-200 text-sm leading-relaxed"
//                     >
//                       <p>{rec.reason}</p>
//                       {rec.url && (
//                         <a
//                           href={rec.url}
//                           target="_blank"
//                           rel="noopener noreferrer"
//                           className="mt-2 inline-block text-blue-400 underline"
//                         >
//                           Visit protocol
//                         </a>
//                       )}
//                     </motion.div>
//                   )}
//                 </AnimatePresence>
//               </motion.div>
//             ))}
//           </AnimatePresence>
//         </div>
//       )}
//     </div>
//   );
// }




// import React, { useState } from "react";

// const DEFAULT_MODELS = [
//     "groq/compound-mini",
//     "openai/gpt-oss-120b",
//     "groq/compound",
//     "openai/gpt-oss-20b",
//     "deepseek-r1-distill-llama-70b",
//     "qwen/qwen3-32b",
//     "llama-3.1-8b-instant",
//     "meta-llama/llama-4-scout-17b-16e-instruct",
//     "meta-llama/llama-4-maverick-17b-128e-instruct",
//     "llama-3.3-70b-versatile",
//     "gemma2-9b-it",
//     "moonshotai/kimi-k2-instruct-0905",
//     "moonshotai/kimi-k2-instruct"
// ];

// export default function GroqLLMDemo() {
//     const [prompt, setPrompt] = useState("");
//     const [model, setModel] = useState(DEFAULT_MODELS[0]);
//     const [models, setModels] = useState(DEFAULT_MODELS);
//     const [response, setResponse] = useState("");
//     const [error, setError] = useState("");
//     const [loading, setLoading] = useState(false);

//     // Fetch available models from Groq API
//     async function fetchModels() {
//         setError("");
//         try {
//             const res = await fetch("/api/groq-models");
//             if (!res.ok) throw new Error("Failed to fetch models");
//             const data = await res.json();
//             setModels(data.models);
//         } catch (e: any) {
//             setError(e.message || "Could not fetch models");
//         }
//     }

//     async function handleSubmit(e: React.FormEvent) {
//         e.preventDefault();
//         setLoading(true);
//         setError("");
//         setResponse("");
//         try {
//             const res = await fetch("/api/llm", {
//                 method: "POST",
//                 headers: { "Content-Type": "application/json" },
//                 body: JSON.stringify({ prompt, model, provider: "groq" })
//             });
//             const data = await res.json();
//             if (res.ok) {
//                 setResponse(data.result);
//             } else {
//                 setError(data.error || "Unknown error");
//                 if (data.details?.error?.message) setError(data.details.error.message);
//             }
//         } catch (e: any) {
//             setError(e.message || "Request failed");
//         } finally {
//             setLoading(false);
//         }
//     }

//     return (
//         <div className="max-w-2xl mx-auto p-6 bg-white rounded shadow mt-8">
//             <h2 className="text-xl font-bold mb-4">Groq LLM Demo</h2>
//             <form onSubmit={handleSubmit} className="space-y-4">
//                 <div>
//                     <label className="block font-medium mb-1">Prompt</label>
//                     <textarea
//                         className="w-full border rounded p-2"
//                         rows={3}
//                         value={prompt}
//                         onChange={e => setPrompt(e.target.value)}
//                         required
//                     />
//                 </div>
//                 <div>
//                     <label className="block font-medium mb-1">Model</label>
//                     <div className="flex gap-2 items-center">
//                         <select
//                             className="border rounded p-2"
//                             value={model}
//                             onChange={e => setModel(e.target.value)}
//                         >
//                             {models.map(m => (
//                                 <option key={m} value={m}>{m}</option>
//                             ))}
//                         </select>
//                         <button
//                             type="button"
//                             className="text-blue-600 underline text-sm"
//                             onClick={fetchModels}
//                         >
//                             Refresh models
//                         </button>
//                     </div>
//                 </div>
//                 <button
//                     type="submit"
//                     className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
//                     disabled={loading}
//                 >
//                     {loading ? "Loading..." : "Ask LLM"}
//                 </button>
//             </form>
//             {error && <div className="mt-4 text-red-600">{error}</div>}
//             {response && (
//                 <div className="mt-6 bg-gray-100 p-4 rounded whitespace-pre-wrap">
//                     {response}
//                 </div>
//             )}
//         </div>
//     );
// }
