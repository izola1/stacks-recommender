"use client";

import { useState, useEffect } from "react";
import useSWR from "swr";
import axios from "axios";
import { Preferences } from "@/components/Preferences";
import WalletConnect from "@/components/WalletConnect";
import { getHiroApiBase } from "@/lib/stacks";
import { scorePool, riskNote } from "@/lib/risk";
import type { Goal } from "@/components/Preferences";
import type { Pool } from "@/lib/mockPools";
import RecordIntent from "@/components/RecordIntent";
import GroqLLMDemo from "@/components/GroqLLMDemo";
import { useWallet } from "@/hooks/useWallet";

export default function Home() {
  // Get shared wallet state
  const { address } = useWallet();

  // Fetch balance data
  const fetcher = (url: string) => axios.get(url).then((r) => r.data);
  const { data: mainnet } = useSWR(
    address ? `${getHiroApiBase("mainnet")}/extended/v1/address/${address}/balances` : null,
    fetcher
  );
  const { data: testnet } = useSWR(
    address ? `${getHiroApiBase("testnet")}/extended/v1/address/${address}/balances` : null,
    fetcher
  );

  const mainBal = mainnet?.stx?.balance ? Number(mainnet.stx.balance) / 1e6 : 0;
  const testBal = testnet?.stx?.balance ? Number(testnet.stx.balance) / 1e6 : 0;
  const isMain = mainBal > testBal;
  const selected = isMain ? mainnet : testnet;
  const stxBalance = (isMain ? mainBal : testBal) || null;
  const networkLabel = isMain ? "mainnet" : "testnet";

  // Fetch STX price
  const priceFetcher = (url: string) => axios.get(url).then((r) => r.data);
  const { data: priceData } = useSWR("/api/price/stx", priceFetcher);
  const exactUsd = typeof priceData?.usd === "number" ? priceData.usd : null;
  const balanceUsd = stxBalance !== null && exactUsd !== null ? exactUsd * stxBalance : null;

  // Preferences
  const [goal, setGoal] = useState<Goal>("yield");
  const [minApy, setMinApy] = useState<number>(0);

  // Recommendations
  const [scan, setScan] = useState<{ recommendations: Pool[]; error?: string } | null>(null);
  const [loadingScan, setLoadingScan] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);

  async function runScan() {
    if (!address) return;
    setLoadingScan(true);
    setScanError(null);
    try {
      const res = await axios
        .post("/api/recommendations", {
          address,
          goal,
          minApy,
          limit: 6,
        })
        .then((r) => r.data);
      setScan(res);
      if (res?.error) setScanError(res.error);
    } catch {
      setScan({ recommendations: [] });
      setScanError("Failed to fetch recommendations. Please try again.");
    } finally {
      setLoadingScan(false);
    }
  }

  // 🧠 Automatically re-scan when preferences or address changes
  useEffect(() => {
    if (address) runScan();
  }, [goal, minApy, address]);

  // AI Recommendation
  const [llmRec, setLlmRec] = useState<string>("");
  const [llmLoading, setLlmLoading] = useState(false);
  const [llmError, setLlmError] = useState<string>("");

  function getUserBalances() {
    if (!selected) return {};
    const balances: Record<string, any> = {
      stx: selected.stx?.balance ? Number(selected.stx.balance) / 1e6 : 0,
      locked: selected.stx?.locked ? Number(selected.stx.locked) / 1e6 : 0,
    };
    if (selected.fungible_tokens) {
      Object.entries(selected.fungible_tokens).forEach(([k, v]) => {
        balances[k] = v;
      });
    }
    return balances;
  }

  async function runLlmPersonalized() {
    setLlmLoading(true);
    setLlmError("");
    setLlmRec("");
    try {
      const balances = getUserBalances();
      const res = await axios.post("/api/llm-recommend", {
        address,
        balances,
      });
      setLlmRec(res.data.result);
    } catch (e: any) {
      setLlmError(e.message || "LLM error");
    } finally {
      setLlmLoading(false);
    }
  }

  return (
    <>
      {/* Wallet Connect Button */}
      <div className="p-4">
        <WalletConnect />
      </div>

      {/* Main Layout */}
      <div className="max-w-6xl mx-auto px-6 py-10 grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Left Column */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          {/* Wallet Summary */}
          <div className="rounded-2xl p-5 glass">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-zinc-400">Address</div>
                <div className="text-sm font-medium">
                  {address || "Not connected"}
                </div>
              </div>
              {address && (
                <button
                  onClick={() => navigator.clipboard.writeText(address)}
                  className="p-2 rounded-md border border-zinc-800 hover:bg-zinc-800/50"
                >
                  Copy
                </button>
              )}
            </div>

            <div className="mt-4">
              <div className="text-xs text-zinc-400">
                STX Balance ({networkLabel})
              </div>
              <div className="text-lg font-semibold">
                {stxBalance?.toFixed(6)} STX
                {balanceUsd !== null && (
                  <span className="text-sm text-zinc-500 ml-2">
                    (~${balanceUsd.toFixed(2)})
                  </span>
                )}
              </div>
              {selected?.stx?.locked && Number(selected.stx.locked) > 0 && (
                <div className="mt-1 text-zinc-400">
                  Locked: {(Number(selected.stx.locked) / 1e6).toFixed(6)} STX
                </div>
              )}
            </div>
          </div>

          {/* Preferences Card */}
          <aside className="rounded-2xl p-6 glass shadow-lg w-full">
            <h3 className="text-lg font-semibold mb-3">Preferences</h3>
            <Preferences
              value={{ goal, minApy }}
              onChange={({ goal, minApy }) => {
                setGoal(goal);
                setMinApy(minApy);
              }}
            />
          </aside>
        </div>

        {/* Right Column: Recommendations */}
        <section className="lg:col-span-3">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Recommendations</h2>
            <div className="text-sm text-zinc-400">Showing best matches</div>
          </div>

          {loadingScan && (
            <div className="text-zinc-400">Loading recommendations...</div>
          )}
          {scanError && <div className="text-red-400">{scanError}</div>}

          {!loadingScan &&
            !scanError &&
            scan?.recommendations &&
            scan.recommendations.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {scan.recommendations.map((p) => {
                  const score = Math.round(scorePool(p, goal));
                  const riskLabel =
                    p.risk === "low"
                      ? "Low"
                      : p.risk === "medium"
                      ? "Medium"
                      : "High";
                  const riskColor =
                    p.risk === "low"
                      ? "bg-green-600 text-green-50"
                      : p.risk === "medium"
                      ? "bg-yellow-600 text-yellow-50"
                      : "bg-red-600 text-red-50";

                  return (
                    <article
                      key={p.id}
                      className="p-6 rounded-2xl border border-zinc-700 bg-zinc-900/70 backdrop-blur-md shadow-lg hover:border-sky-500/50 transition-all space-y-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl bg-zinc-800 flex items-center justify-center text-xl font-bold">
                            {p.platform[0]}
                          </div>
                          <div>
                            <div className="text-sm font-semibold">
                              {p.platform}{" "}
                              <span className="text-zinc-400">•</span>{" "}
                              <span className="text-zinc-300">{p.name}</span>
                            </div>
                            <div className="text-xs text-zinc-500 mt-1">
                              Score:{" "}
                              <span className="font-medium text-zinc-100">
                                {score}/100
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <div className="text-2xl font-extrabold tracking-tight">
                            {p.apy.toFixed(1)}%
                          </div>
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${riskColor}`}
                          >
                            {riskLabel}
                          </span>
                        </div>
                      </div>

                      <div className="text-sm text-zinc-400 leading-relaxed">
                        Why this: matches your goal{" "}
                        {goal === "yield"
                          ? "(maximize yield)"
                          : goal === "low-risk"
                          ? "(lower risk)"
                          : "(hands-off)"}{" "}
                        and minimum APY ≥ {minApy}. {riskNote(p)}
                      </div>

                      <div className="flex items-center justify-between">
                        <a
                          href={p.url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-2 px-3 py-2 rounded-md border border-zinc-800 text-sm hover:bg-zinc-800/40"
                        >
                          Open on {p.platform}
                        </a>
                        <div className="text-xs text-zinc-500">
                          Updated: just now
                        </div>
                      </div>

                      <div>
                        <RecordIntent address={address} poolId={p.id} />
                      </div>
                    </article>
                  );
                })}
              </div>
            )}

          {!loadingScan &&
            !scanError &&
            (!scan || (scan?.recommendations ?? []).length === 0) && (
              <div className="text-zinc-400">
                No options match your filters or data is unavailable. Try lowering minimum APY and scanning again.
              </div>
            )}

          {/* AI Recommendation Section */}
          <div className="mt-8">
            <button
              onClick={runLlmPersonalized}
              disabled={llmLoading || !address}
              className="px-4 py-2 rounded-lg bg-gradient-to-r from-sky-500 to-purple-500 font-semibold shadow-sm disabled:opacity-60"
            >
              {llmLoading ? "AI is analyzing..." : "Get AI-Powered Personalized Advice"}
            </button>
            {llmError && <div className="text-red-400 mt-3">{llmError}</div>}
            {llmRec && (
              <div className="mt-4 rounded-lg bg-zinc-900/50 text-zinc-200 p-4 whitespace-pre-wrap">
                <strong>AI Recommendation:</strong>
                <div>{llmRec}</div>
              </div>
            )}
          </div>

          {/* DeFi LLM Chat */}
          <section className="mt-10">
            <h2 className="text-xl font-bold mb-3">Ask the DeFi LLM</h2>
            <GroqLLMDemo walletAddress={address || ""} balances={getUserBalances()} />
          </section>
        </section>
      </div>
    </>
  );
}



// // src/app/page.tsx
// "use client";

// import { Preferences } from "@/components/Preferences";
// import WalletConnect from "@/components/WalletConnect";
// import useSWR from "swr";
// import axios from "axios";
// import { useState } from "react";
// import { getHiroApiBase } from "@/lib/stacks";
// import { scorePool, riskNote } from "@/lib/risk";
// import type { Goal } from "@/components/Preferences";
// import type { Pool } from "@/lib/mockPools";
// import RecordIntent from "@/components/RecordIntent";
// import GroqLLMDemo from "@/components/GroqLLMDemo";
// import { useWallet } from "@/hooks/useWallet";

// export default function Home() {
//   // Get shared wallet state
//   const { address } = useWallet();

//   // Fetch balance data
//   const fetcher = (url: string) => axios.get(url).then((r) => r.data);
//   const { data: mainnet } = useSWR(
//     address ? `${getHiroApiBase("mainnet")}/extended/v1/address/${address}/balances` : null,
//     fetcher
//   );
//   const { data: testnet } = useSWR(
//     address ? `${getHiroApiBase("testnet")}/extended/v1/address/${address}/balances` : null,
//     fetcher
//   );

//   const mainBal = mainnet?.stx?.balance ? Number(mainnet.stx.balance) / 1e6 : 0;
//   const testBal = testnet?.stx?.balance ? Number(testnet.stx.balance) / 1e6 : 0;
//   const isMain = mainBal > testBal;
//   const selected = isMain ? mainnet : testnet;
//   const stxBalance = (isMain ? mainBal : testBal) || null;
//   const networkLabel = isMain ? "mainnet" : "testnet";

//   // Fetch STX price
//   const priceFetcher = (url: string) => axios.get(url).then((r) => r.data);
//   const { data: priceData } = useSWR("/api/price/stx", priceFetcher);
//   const exactUsd = typeof priceData?.usd === "number" ? priceData.usd : null;
//   const balanceUsd = stxBalance !== null && exactUsd !== null ? exactUsd * stxBalance : null;

//   const [goal, setGoal] = useState<Goal>("yield");
//   const [minApy, setMinApy] = useState<number>(0);

//   // Recommendation scan
//   const [scan, setScan] = useState<{ recommendations: Pool[]; error?: string } | null>(null);
//   const [loadingScan, setLoadingScan] = useState(false);
//   const [scanError, setScanError] = useState<string | null>(null);

//   async function runScan() {
//     setLoadingScan(true);
//     setScanError(null);
//     try {
//       const res = await axios
//         .post("/api/recommendations", {
//           address,
//           goal,
//           minApy,
//           limit: 6,
//         })
//         .then((r) => r.data);
//       setScan(res);
//       if (res?.error) setScanError(res.error);
//     } catch {
//       setScan({ recommendations: [] });
//       setScanError("Failed to fetch recommendations. Please try again.");
//     } finally {
//       setLoadingScan(false);
//     }
//   }

//   // LLM Recommendation
//   const [llmRec, setLlmRec] = useState<string>("");
//   const [llmLoading, setLlmLoading] = useState(false);
//   const [llmError, setLlmError] = useState<string>("");

//   function getUserBalances() {
//     if (!selected) return {};
//     const balances: Record<string, any> = {
//       stx: selected.stx?.balance ? Number(selected.stx.balance) / 1e6 : 0,
//       locked: selected.stx?.locked ? Number(selected.stx.locked) / 1e6 : 0,
//     };
//     if (selected.fungible_tokens) {
//       Object.entries(selected.fungible_tokens).forEach(([k, v]) => {
//         balances[k] = v;
//       });
//     }
//     return balances;
//   }

//   async function runLlmPersonalized() {
//     setLlmLoading(true);
//     setLlmError("");
//     setLlmRec("");
//     try {
//       const balances = getUserBalances();
//       const res = await axios.post("/api/llm-recommend", {
//         address,
//         balances,
//       });
//       setLlmRec(res.data.result);
//     } catch (e: any) {
//       setLlmError(e.message || "LLM error");
//     } finally {
//       setLlmLoading(false);
//     }
//   }

//   return (
//     <>
//       {/* Wallet Connect Button */}
//       <div className="p-4">
//         <WalletConnect />
//       </div>

//       {/* Main Grid Layout */}
//       <div className="max-w-6xl mx-auto px-6 py-10 grid grid-cols-1 lg:grid-cols-4 gap-8">
//         {/* Left Column: Wallet Summary + Preferences */}
//         <div className="lg:col-span-1 flex flex-col gap-6">
//           {/* Wallet Summary Card */}
//           <div className="rounded-2xl p-5 glass">
//             <div className="flex items-center justify-between">
//               <div>
//                 <div className="text-xs text-zinc-400">Address</div>
//                 <div className="text-sm font-medium">
//                   {address || "Not connected"}
//                 </div>
//               </div>
//               {address && (
//                 <button
//                   onClick={() => navigator.clipboard.writeText(address)}
//                   className="p-2 rounded-md border border-zinc-800 hover:bg-zinc-800/50"
//                 >
//                   Copy
//                 </button>
//               )}
//             </div>

//             <div className="mt-4">
//               <div className="text-xs text-zinc-400">
//                 STX Balance ({networkLabel})
//               </div>
//               <div className="text-lg font-semibold">
//                 {stxBalance?.toFixed(6)} STX
//                 {balanceUsd !== null && (
//                   <span className="text-sm text-zinc-500 ml-2">
//                     (~${balanceUsd.toFixed(2)})
//                   </span>
//                 )}
//               </div>
//               {selected?.stx?.locked && Number(selected.stx.locked) > 0 && (
//                 <div className="mt-1 text-zinc-400">
//                   Locked: {(Number(selected.stx.locked) / 1e6).toFixed(6)} STX
//                 </div>
//               )}
//             </div>
//           </div>

//           {/* Preferences Card */}
//           <aside className="rounded-2xl p-6 glass shadow-lg w-full">
//             <h3 className="text-lg font-semibold mb-3">Preferences</h3>
//             <Preferences
//               value={{ goal, minApy }}
//               onChange={({ goal, minApy }) => {
//                 setGoal(goal);
//                 setMinApy(minApy);
//                 runScan();
//               }}
//             />
//           </aside>
//         </div>

//         {/* Right Column: Recommendations */}
//         <section className="lg:col-span-3">
//           <div className="flex items-center justify-between mb-6">
//             <h2 className="text-2xl font-bold">Recommendations</h2>
//             <div className="text-sm text-zinc-400">
//               Showing best matches
//             </div>
//           </div>

//           {loadingScan && (
//             <div className="text-zinc-400">Loading recommendations...</div>
//           )}
//           {scanError && <div className="text-red-400">{scanError}</div>}

//           {!loadingScan &&
//             !scanError &&
//             scan?.recommendations &&
//             scan.recommendations.length > 0 && (
//               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//                 {scan.recommendations.map((p) => {
//                   const score = Math.round(scorePool(p, goal));
//                   const riskLabel =
//                     p.risk === "low"
//                       ? "Low"
//                       : p.risk === "medium"
//                       ? "Medium"
//                       : "High";
//                   const riskColor =
//                     p.risk === "low"
//                       ? "bg-green-600 text-green-50"
//                       : p.risk === "medium"
//                       ? "bg-yellow-600 text-yellow-50"
//                       : "bg-red-600 text-red-50";

//                   return (
//                     <article
//                       key={p.id}
//                       className="p-5 rounded-2xl border border-zinc-800 glass card-hover shadow-md"
//                     >
//                       <div className="flex items-start justify-between gap-3">
//                         <div className="flex items-center gap-3">
//                           <div className="w-12 h-12 rounded-xl bg-zinc-800 flex items-center justify-center text-xl font-bold">
//                             {p.platform[0]}
//                           </div>
//                           <div>
//                             <div className="text-sm font-semibold">
//                               {p.platform}{" "}
//                               <span className="text-zinc-400">•</span>{" "}
//                               <span className="text-zinc-300">{p.name}</span>
//                             </div>
//                             <div className="text-xs text-zinc-500 mt-1">
//                               Score:{" "}
//                               <span className="font-medium text-zinc-100">
//                                 {score}/100
//                               </span>
//                             </div>
//                           </div>
//                         </div>
//                         <div className="flex flex-col items-end gap-2">
//                           <div className="text-2xl font-extrabold tracking-tight">
//                             {p.apy.toFixed(1)}%
//                           </div>
//                           <span
//                             className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${riskColor}`}
//                           >
//                             {riskLabel}
//                           </span>
//                         </div>
//                       </div>

//                       <div className="mt-4 text-sm text-zinc-400">
//                         Why this: matches your goal{" "}
//                         {goal === "yield"
//                           ? "(maximize yield)"
//                           : goal === "low-risk"
//                           ? "(lower risk)"
//                           : "(hands-off)"}{" "}
//                         and minimum APY ≥ {minApy}. {riskNote(p)}
//                       </div>

//                       <div className="mt-5 flex items-center justify-between">
//                         <a
//                           href={p.url}
//                           target="_blank"
//                           rel="noreferrer"
//                           className="inline-flex items-center gap-2 px-3 py-2 rounded-md border border-zinc-800 text-sm hover:bg-zinc-800/40"
//                         >
//                           Open on {p.platform}
//                         </a>
//                         <div className="text-xs text-zinc-500">
//                           Updated: just now
//                         </div>
//                       </div>

//                       <div className="mt-3">
//                         <RecordIntent address={address} poolId={p.id} />
//                       </div>
//                     </article>
//                   );
//                 })}
//               </div>
//             )}

//           {!loadingScan &&
//             !scanError &&
//             (!scan || (scan?.recommendations ?? []).length === 0) && (
//               <div className="text-zinc-400">
//                 No options match your filters or data is unavailable. Try
//                 lowering minimum APY and scanning again.
//               </div>
//             )}

//           {/* AI Recommendation Section */}
//           <div className="mt-8">
//             <button
//               onClick={runLlmPersonalized}
//               disabled={llmLoading || !address}
//               className="px-4 py-2 rounded-lg bg-gradient-to-r from-sky-500 to-purple-500 font-semibold shadow-sm disabled:opacity-60"
//             >
//               {llmLoading ? "AI is analyzing..." : "Get AI-Powered Personalized Advice"}
//             </button>
//             {llmError && <div className="text-red-400 mt-3">{llmError}</div>}
//             {llmRec && (
//               <div className="mt-4 rounded-lg bg-zinc-900/50 text-zinc-200 p-4 whitespace-pre-wrap">
//                 <strong>AI Recommendation:</strong>
//                 <div>{llmRec}</div>
//               </div>
//             )}
//           </div>

//           {/* DeFi LLM Chat Section */}

//           {/* DeFi LLM Chat Section */}
//             <section className="mt-10">
//               <h2 className="text-xl font-bold mb-3">Ask the DeFi LLM</h2>
//               <GroqLLMDemo walletAddress={address || ""} balances={getUserBalances()} />
//             </section>

//           {/* <section className="mt-10">
//             <h2 className="text-xl font-bold mb-3">Ask the DeFi LLM</h2>
//             <GroqLLMDemo />
//           </section> */}
//         </section>
//       </div>
//     </>
//   );
// }





// "use client";

// import Header from "@/components/Header";
// import { Preferences } from "@/components/Preferences";
// import WalletConnect from "@/components/WalletConnect";
// import useSWR from "swr";
// import axios from "axios";
// import { useState, useEffect } from "react";
// import { getHiroApiBase } from "@/lib/stacks";
// import { scorePool, riskNote } from "@/lib/risk";
// import type { Goal } from "@/components/Preferences";
// import type { Pool } from "@/lib/mockPools";
// import RecordIntent from "@/components/RecordIntent";
// import GroqLLMDemo from "@/components/GroqLLMDemo";

// export default function Home() {
//   const [address, setAddress] = useState<string | null>(null);

//   // Restore saved wallet address
//   useEffect(() => {
//     try {
//       const saved = localStorage.getItem("stx-address");
//       if (saved) setAddress(saved);
//     } catch {}
//   }, []);

//   // Fetch balance data
//   const fetcher = (url: string) => axios.get(url).then((r) => r.data);
//   const { data: mainnet } = useSWR(
//     address ? `${getHiroApiBase("mainnet")}/extended/v1/address/${address}/balances` : null,
//     fetcher
//   );
//   const { data: testnet } = useSWR(
//     address ? `${getHiroApiBase("testnet")}/extended/v1/address/${address}/balances` : null,
//     fetcher
//   );

//   const mainBal = mainnet?.stx?.balance ? Number(mainnet.stx.balance) / 1e6 : 0;
//   const testBal = testnet?.stx?.balance ? Number(testnet.stx.balance) / 1e6 : 0;
//   const isMain = mainBal > testBal;
//   const selected = isMain ? mainnet : testnet;
//   const stxBalance = (isMain ? mainBal : testBal) || null;
//   const networkLabel = isMain ? "mainnet" : "testnet";

//   // Fetch STX price
//   const priceFetcher = (url: string) => axios.get(url).then((r) => r.data);
//   const { data: priceData } = useSWR("/api/price/stx", priceFetcher);
//   const exactUsd = typeof priceData?.usd === "number" ? priceData.usd : null;
//   const balanceUsd = stxBalance !== null && exactUsd !== null ? exactUsd * stxBalance : null;

//   const [goal, setGoal] = useState<Goal>("yield");
//   const [minApy, setMinApy] = useState<number>(0);

//   // Recommendation scan
//   const [scan, setScan] = useState<{ recommendations: Pool[]; error?: string } | null>(null);
//   const [loadingScan, setLoadingScan] = useState(false);
//   const [scanError, setScanError] = useState<string | null>(null);

//   async function runScan() {
//     setLoadingScan(true);
//     setScanError(null);
//     try {
//       const res = await axios
//         .post("/api/recommendations", {
//           address,
//           goal,
//           minApy,
//           limit: 6,
//         })
//         .then((r) => r.data);
//       setScan(res);
//       if (res?.error) setScanError(res.error);
//     } catch {
//       setScan({ recommendations: [] });
//       setScanError("Failed to fetch recommendations. Please try again.");
//     } finally {
//       setLoadingScan(false);
//     }
//   }

//   // LLM Recommendation
//   const [llmRec, setLlmRec] = useState<string>("");
//   const [llmLoading, setLlmLoading] = useState(false);
//   const [llmError, setLlmError] = useState<string>("");

//   function getUserBalances() {
//     if (!selected) return {};
//     const balances: Record<string, any> = {
//       stx: selected.stx?.balance ? Number(selected.stx.balance) / 1e6 : 0,
//       locked: selected.stx?.locked ? Number(selected.stx.locked) / 1e6 : 0,
//     };
//     if (selected.fungible_tokens) {
//       Object.entries(selected.fungible_tokens).forEach(([k, v]) => {
//         balances[k] = v;
//       });
//     }
//     return balances;
//   }

//   async function runLlmPersonalized() {
//     setLlmLoading(true);
//     setLlmError("");
//     setLlmRec("");
//     try {
//       const balances = getUserBalances();
//       const res = await axios.post("/api/llm-recommend", {
//         address,
//         balances,
//       });
//       setLlmRec(res.data.result);
//     } catch (e: any) {
//       setLlmError(e.message || "LLM error");
//     } finally {
//       setLlmLoading(false);
//     }
//   }

//   return (
//     <>
//       {/* Wallet Connect Button */}
//       <div className="p-4">
//         <WalletConnect onConnected={setAddress} />
//       </div>

//       {/* Main Grid Layout */}
//       <div className="max-w-6xl mx-auto px-6 py-10 grid grid-cols-1 lg:grid-cols-4 gap-8">
//         {/* Left Column: Wallet Summary + Preferences */}
//         <div className="lg:col-span-1 flex flex-col gap-6">
//           {/* Wallet Summary Card */}
//           <div className="rounded-2xl p-5 glass">
//             <div className="flex items-center justify-between">
//               <div>
//                 <div className="text-xs text-zinc-400">Address</div>
//                 <div className="text-sm font-medium">
//                   {address || "Not connected"}
//                 </div>
//               </div>
//               {address && (
//                 <button
//                   onClick={() => navigator.clipboard.writeText(address)}
//                   className="p-2 rounded-md border border-zinc-800 hover:bg-zinc-800/50"
//                 >
//                   Copy
//                 </button>
//               )}
//             </div>

//             <div className="mt-4">
//               <div className="text-xs text-zinc-400">
//                 STX Balance ({networkLabel})
//               </div>
//               <div className="text-lg font-semibold">
//                 {stxBalance?.toFixed(6)} STX
//                 {balanceUsd !== null && (
//                   <span className="text-sm text-zinc-500 ml-2">
//                     (~${balanceUsd.toFixed(2)})
//                   </span>
//                 )}
//               </div>
//               {selected?.stx?.locked && Number(selected.stx.locked) > 0 && (
//                 <div className="mt-1 text-zinc-400">
//                   Locked: {(Number(selected.stx.locked) / 1e6).toFixed(6)} STX
//                 </div>
//               )}
//             </div>
//           </div>

//           {/* Preferences Card */}
//           <aside className="rounded-2xl p-6 glass shadow-lg w-full">
//             <h3 className="text-lg font-semibold mb-3">Preferences</h3>
//             <Preferences
//               value={{ goal, minApy }}
//               onChange={({ goal, minApy }) => {
//                 setGoal(goal);
//                 setMinApy(minApy);
//                 runScan();
//               }}
//             />
//           </aside>
//         </div>

//         {/* Right Column: Recommendations */}
//         <section className="lg:col-span-3">
//           <div className="flex items-center justify-between mb-6">
//             <h2 className="text-2xl font-bold">Recommendations</h2>
//             <div className="text-sm text-zinc-400">
//               Showing best matches
//             </div>
//           </div>

//           {loadingScan && (
//             <div className="text-zinc-400">Loading recommendations...</div>
//           )}
//           {scanError && <div className="text-red-400">{scanError}</div>}

//           {!loadingScan &&
//             !scanError &&
//             scan?.recommendations &&
//             scan.recommendations.length > 0 && (
//               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//                 {scan.recommendations.map((p) => {
//                   const score = Math.round(scorePool(p, goal));
//                   const riskLabel =
//                     p.risk === "low"
//                       ? "Low"
//                       : p.risk === "medium"
//                       ? "Medium"
//                       : "High";
//                   const riskColor =
//                     p.risk === "low"
//                       ? "bg-green-600 text-green-50"
//                       : p.risk === "medium"
//                       ? "bg-yellow-600 text-yellow-50"
//                       : "bg-red-600 text-red-50";

//                   return (
//                     <article
//                       key={p.id}
//                       className="p-5 rounded-2xl border border-zinc-800 glass card-hover shadow-md"
//                     >
//                       <div className="flex items-start justify-between gap-3">
//                         <div className="flex items-center gap-3">
//                           <div className="w-12 h-12 rounded-xl bg-zinc-800 flex items-center justify-center text-xl font-bold">
//                             {p.platform[0]}
//                           </div>
//                           <div>
//                             <div className="text-sm font-semibold">
//                               {p.platform}{" "}
//                               <span className="text-zinc-400">•</span>{" "}
//                               <span className="text-zinc-300">{p.name}</span>
//                             </div>
//                             <div className="text-xs text-zinc-500 mt-1">
//                               Score:{" "}
//                               <span className="font-medium text-zinc-100">
//                                 {score}/100
//                               </span>
//                             </div>
//                           </div>
//                         </div>
//                         <div className="flex flex-col items-end gap-2">
//                           <div className="text-2xl font-extrabold tracking-tight">
//                             {p.apy.toFixed(1)}%
//                           </div>
//                           <span
//                             className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${riskColor}`}
//                           >
//                             {riskLabel}
//                           </span>
//                         </div>
//                       </div>

//                       <div className="mt-4 text-sm text-zinc-400">
//                         Why this: matches your goal{" "}
//                         {goal === "yield"
//                           ? "(maximize yield)"
//                           : goal === "low-risk"
//                           ? "(lower risk)"
//                           : "(hands-off)"}{" "}
//                         and minimum APY ≥ {minApy}. {riskNote(p)}
//                       </div>

//                       <div className="mt-5 flex items-center justify-between">
//                         <a
//                           href={p.url}
//                           target="_blank"
//                           rel="noreferrer"
//                           className="inline-flex items-center gap-2 px-3 py-2 rounded-md border border-zinc-800 text-sm hover:bg-zinc-800/40"
//                         >
//                           Open on {p.platform}
//                         </a>
//                         <div className="text-xs text-zinc-500">
//                           Updated: just now
//                         </div>
//                       </div>

//                       <div className="mt-3">
//                         <RecordIntent address={address} poolId={p.id} />
//                       </div>
//                     </article>
//                   );
//                 })}
//               </div>
//             )}

//           {!loadingScan &&
//             !scanError &&
//             (!scan || (scan?.recommendations ?? []).length === 0) && (
//               <div className="text-zinc-400">
//                 No options match your filters or data is unavailable. Try
//                 lowering minimum APY and scanning again.
//               </div>
//             )}

//           {/* AI Recommendation Section */}
//           <div className="mt-8">
//             <button
//               onClick={runLlmPersonalized}
//               disabled={llmLoading || !address}
//               className="px-4 py-2 rounded-lg bg-gradient-to-r from-sky-500 to-purple-500 font-semibold shadow-sm disabled:opacity-60"
//             >
//               {llmLoading ? "AI is analyzing..." : "Get AI-Powered Personalized Advice"}
//             </button>
//             {llmError && <div className="text-red-400 mt-3">{llmError}</div>}
//             {llmRec && (
//               <div className="mt-4 rounded-lg bg-zinc-900/50 text-zinc-200 p-4 whitespace-pre-wrap">
//                 <strong>AI Recommendation:</strong>
//                 <div>{llmRec}</div>
//               </div>
//             )}
//           </div>

//           {/* DeFi LLM Chat Section */}
//           <section className="mt-10">
//             <h2 className="text-xl font-bold mb-3">Ask the DeFi LLM</h2>
//             <GroqLLMDemo />
//           </section>
//         </section>
//       </div>
//     </>
//   );
// }




// "use client";
// import Header from "@/components/Header";
// import { PreferencesCard } from "@/components/PreferencesCard";
// import { RecommendationCard, type RecommendationItem } from "@/components/RecommendationCard";
// import GroqLLMDemo from "@/components/GroqLLMDemo";
// import { useRef } from "react";
// import { useState, useEffect } from "react";
// import WalletConnect from "@/components/WalletConnect";
// import useSWR from "swr";
// import axios from "axios";
// import { getHiroApiBase } from "@/lib/stacks";
// import { Preferences, type Goal } from "@/components/Preferences";
// import { riskNote, scorePool } from "@/lib/risk";
// import type { Pool, FungibleToken } from "@/lib/mockPools";
// import RecordIntent from "@/components/RecordIntent";


// export default function Home() {
//   const [address, setAddress] = useState<string | null>(null);

//   useEffect(() => {
//     // Restore saved address only; do NOT ping wallet on load to avoid popups
//     try {
//       const saved = localStorage.getItem("stx-address");
//       if (saved) setAddress(saved);
//     } catch { }
//   }, []);

//   const fetcher = (url: string) => axios.get(url).then(r => r.data);
//   const { data: mainnet, error: mErr } = useSWR(
//     address ? `${getHiroApiBase("mainnet")}/extended/v1/address/${address}/balances` : null,
//     fetcher
//   );
//   const { data: testnet, error: tErr } = useSWR(
//     address ? `${getHiroApiBase("testnet")}/extended/v1/address/${address}/balances` : null,
//     fetcher
//   );

//   const mainBal = mainnet?.stx?.balance ? Number(mainnet.stx.balance) / 1e6 : 0;
//   const testBal = testnet?.stx?.balance ? Number(testnet.stx.balance) / 1e6 : 0;
//   const isMain = mainBal > testBal;
//   const selected = isMain ? mainnet : testnet;
//   const stxBalance = (isMain ? mainBal : testBal) || null;
//   const networkLabel = isMain ? "mainnet" : "testnet";

//   // Fetch STX price in USD (try 'stacks' then fallback 'blockstack')
//   const priceFetcher = (url: string) => axios.get(url).then(r => r.data);
//   const { data: priceData } = useSWR("/api/price/stx", priceFetcher);
//   const exactUsd = typeof priceData?.usd === "number" ? priceData.usd : null;
//   const priceSource = priceData?.source as string | undefined;
//   const balanceUsd = stxBalance !== null && exactUsd !== null ? exactUsd * stxBalance : null;
//   const [priceAt, setPriceAt] = useState<number | null>(null);
//   useEffect(() => {
//     if (typeof priceData?.usd === "number") setPriceAt(Date.now());
//   }, [priceData]);
//   const [goal, setGoal] = useState<Goal>("yield");
//   const [minApy, setMinApy] = useState<number>(0);


//   // Results of server-side recommendation scan
//   const [scan, setScan] = useState<{ recommendations: Pool[]; error?: string } | null>(null);
//   const [loadingScan, setLoadingScan] = useState(false);
//   const [scanError, setScanError] = useState<string | null>(null);

//   // LLM personalized recommendation state
//   const [llmRec, setLlmRec] = useState<string>("");
//   const [llmLoading, setLlmLoading] = useState(false);
//   const [llmError, setLlmError] = useState<string>("");
//   // Helper to extract balances for LLM prompt
//   function getUserBalances() {
//     if (!selected) return {};
//     const balances: Record<string, any> = {
//       stx: selected.stx?.balance ? Number(selected.stx.balance) / 1e6 : 0,
//       locked: selected.stx?.locked ? Number(selected.stx.locked) / 1e6 : 0,
//     };
//     if (selected.fungible_tokens) {
//       Object.entries(selected.fungible_tokens).forEach(([k, v]) => {
//         balances[k] = v;
//       });
//     }
//     return balances;
//   }

//   async function runLlmPersonalized() {
//     setLlmLoading(true);
//     setLlmError("");
//     setLlmRec("");
//     try {
//       const balances = getUserBalances();
//       const res = await axios.post("/api/llm-recommend", {
//         address,
//         balances,
//         // Optionally allow model selection in future
//       });
//       setLlmRec(res.data.result);
//     } catch (e: any) {
//       setLlmError(e.message || "LLM error");
//     } finally {
//       setLlmLoading(false);
//     }
//   }

//   async function runScan() {
//     setLoadingScan(true);
//     setScanError(null);
//     try {
//       const res = await axios.post("/api/recommendations", {
//         address,
//         goal,
//         minApy,
//         limit: 6,
//       }).then(r => r.data);
//       setScan(res);
//       if (res?.error) setScanError(res.error);
//     } catch {
//       setScan({ recommendations: [] });
//       setScanError("Failed to fetch recommendations. Please try again.");
//     } finally {
//       setLoadingScan(false);
//     }
//   }

//   // Transform recommendations data for the new UI components
//   const transformedRecommendations = scan?.recommendations?.map(p => ({
//     id: p.id,
//     platform: p.platform,
//     pair: p.name,
//     apy: p.apy,
//     risk: p.risk === "low" ? "Low" : p.risk === "medium" ? "Medium" : "High",
//     score: Math.round(scorePool(p, goal)),
//     link: p.url
//   })) || [];

//   return (
//     <div className="min-h-screen bg-black text-white font-sans">
//       <Header 
//         connected={!!address}
//         address={address || undefined}
//         onDisconnect={() => setAddress(null)}
//       />
//       <WalletConnect onConnected={setAddress} />

//       <main className="max-w-6xl mx-auto px-6 py-10 grid grid-cols-1 lg:grid-cols-4 gap-8">
//         {/* Left column: wallet summary + preferences */}
//         <div className="lg:col-span-1 flex flex-col gap-6">
//           <div className="rounded-2xl p-5 bg-gradient-to-br from-zinc-900/50 to-zinc-900/30 border border-zinc-800">
//             <div className="flex items-center justify-between">
//               <div>
//                 <div className="text-xs text-zinc-400">Address</div>
//                 <div className="text-sm font-medium">{address || "Not connected"}</div>
//               </div>
//               {address && (
//                 <button
//                   onClick={() => navigator.clipboard.writeText(address)}
//                   className="p-2 rounded-md border border-zinc-800"
//                 >
//                   Copy
//                 </button>
//               )}
//             </div>

//             <div className="mt-4">
//               <div className="text-xs text-zinc-400">STX Balance ({networkLabel})</div>
//               <div className="text-lg font-semibold">
//                 {stxBalance?.toFixed(6)} STX
//                 {balanceUsd !== null && (
//                   <span className="text-sm text-zinc-500">(~${balanceUsd.toFixed(2)})</span>
//                 )}
//               </div>
//               {selected?.stx?.locked && Number(selected.stx.locked) > 0 && (
//                 <div className="mt-1 text-zinc-400">Locked: {(Number(selected.stx.locked) / 1e6).toFixed(6)} STX</div>
//               )}
//             </div>
//           </div>

//           <aside className="rounded-2xl p-6 bg-gradient-to-br from-zinc-900/60 to-zinc-900/40 border border-zinc-800 shadow-lg w-full">
//             <h3 className="text-lg font-semibold mb-3">Preferences</h3>
//             <Preferences
//               value={{ goal, minApy }}
//               onChange={({ goal, minApy }) => {
//                 setGoal(goal);
//                 setMinApy(minApy);
//                 runScan();
//               }}
//             />
//           </aside>
//         </div>

//         <section className="lg:col-span-3">
//           <div className="flex items-center justify-between mb-6">
//             <h2 className="text-2xl font-bold">Recommendations</h2>
//             <div className="text-sm text-zinc-400">Showing best matches</div>
//           </div>

//           {loadingScan && <div className="text-zinc-400">Loading recommendations...</div>}
//           {scanError && <div className="text-red-400">{scanError}</div>}

//           {(!loadingScan && !scanError && scan?.recommendations && scan.recommendations.length > 0) && (
//             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//               {scan.recommendations.map((p) => {
//                 const score = Math.round(scorePool(p, goal));
//                 const riskLabel = p.risk === "low" ? "Low" : p.risk === "medium" ? "Medium" : "High";
//                 const riskColor = p.risk === "low" ? "bg-green-600 text-green-50" : p.risk === "medium" ? "bg-yellow-600 text-yellow-50" : "bg-red-600 text-red-50";
//                 return (
//                   <article
//                     key={p.id}
//                     className="p-5 rounded-2xl border border-zinc-800 bg-gradient-to-br from-zinc-900/40 to-zinc-900/60 shadow-md hover:scale-[1.01] transition-transform"
//                   >
//                     <div className="flex items-start justify-between gap-3">
//                       <div className="flex items-center gap-3">
//                         <div className="w-12 h-12 rounded-xl bg-zinc-800 flex items-center justify-center text-xl font-bold">{p.platform[0]}</div>
//                         <div>
//                           <div className="text-sm font-semibold">{p.platform} <span className="text-zinc-400">•</span> <span className="text-zinc-300">{p.name}</span></div>
//                           <div className="text-xs text-zinc-500 mt-1">Score: <span className="font-medium text-zinc-100">{score}/100</span></div>
//                         </div>
//                       </div>
//                       <div className="flex flex-col items-end gap-2">
//                         <div className="text-2xl font-extrabold tracking-tight">{p.apy.toFixed(1)}%</div>
//                         <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${riskColor}`}>{riskLabel}</span>
//                       </div>
//                     </div>

//                     <div className="mt-4 text-sm text-zinc-400">Why this: matches your goal {goal === "yield" ? "(maximize yield)" : goal === "low-risk" ? "(lower risk)" : "(hands-off)"} and minimum APY ≥ {minApy}. {riskNote(p)}</div>

//                     <div className="mt-5 flex items-center justify-between">
//                       <a href={p.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 px-3 py-2 rounded-md border border-zinc-800 text-sm">
//                         Open on {p.platform}
//                       </a>
//                       <div className="text-xs text-zinc-500">Updated: just now</div>
//                     </div>

//                     <div className="mt-3">
//                       <RecordIntent address={address} poolId={p.id} />
//                     </div>
//                   </article>
//                 );
//               })}
//             </div>
//           )}

//           {(!loadingScan && !scanError && (!scan || (scan?.recommendations ?? []).length === 0)) && (
//             <div className="text-zinc-400">No options match your filters or data is unavailable. Try lowering minimum APY and scanning again.</div>
//           )}

//           <div className="mt-8">
//             <button
//               onClick={runLlmPersonalized}
//               disabled={llmLoading || !address}
//               className="px-4 py-2 rounded-lg bg-gradient-to-r from-sky-500 to-purple-500 font-semibold shadow-sm disabled:opacity-60"
//             >
//               {llmLoading ? "AI is analyzing..." : "Get AI-Powered Personalized Advice"}
//             </button>
//             {llmError && <div className="text-red-400 mt-3">{llmError}</div>}
//             {llmRec && (
//               <div className="mt-4 rounded-lg bg-zinc-900/50 text-zinc-200 p-4 whitespace-pre-wrap">
//                 <strong>AI Recommendation:</strong>
//                 <div>{llmRec}</div>
//               </div>
//             )}
//           </div>

//           <section className="mt-10">
//             <h2 className="text-xl font-bold mb-3">Ask the DeFi LLM</h2>
//             <GroqLLMDemo />
//           </section>
//         </section>
//       </main>
//     </div>
//   );
// }
