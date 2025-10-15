"use client";
import { useState, useEffect } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { Preferences } from "@/components/Preferences";
import WalletConnect from "@/components/WalletConnect";
import RecordIntent from "@/components/RecordIntent";
import { useWallet } from "@/hooks/useWallet";
import { scorePool, riskNote } from "@/lib/risk";

export default function Home() {
  const { address } = useWallet();

  const [goal, setGoal] = useState<"yield" | "safety">("yield");
  const [minApy, setMinApy] = useState<number>(0);
  const [scan, setScan] = useState<{ recommendations: any[]; message?: string }>({
    recommendations: [],
  });
  const [aiSummary, setAiSummary] = useState<string>(""); // 🧠 AI summary
  const [loadingScan, setLoadingScan] = useState(false);
  const [loadingAI, setLoadingAI] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [hasScanned, setHasScanned] = useState(false);
  const [buttonLabel, setButtonLabel] = useState("Apply Preferences");

  // 🧠 Main unified handler (Apply + Refresh)
  async function runScan() {
    if (!address) {
      setScan({
        recommendations: [],
        message: "🔒 Connect your wallet to view recommendations.",
      });
      return;
    }

    setLoadingScan(true);
    setScanError(null);
    setAiSummary("");

    try {
      const res = await axios.post("/api/recommendations", { goal, minApy });
      let pools = res.data.result || [];

      // 🧮 Filter by APY threshold
      let filteredPools = pools.filter((p: any) =>
        goal === "yield" ? p.apy >= minApy : p.apy <= minApy
      );

      let message = "";
      if (filteredPools.length === 0 && pools.length > 0) {
        filteredPools = pools;
        message = `No pools match your filter. Showing all available pools instead.`;
      } else if (filteredPools.length > 0) {
        message = `Showing pools that match your ${goal === "yield" ? "≥" : "≤"} ${minApy}% APY preference.`;
      } else {
        message = "No pools available at the moment.";
      }

      setScan({ recommendations: filteredPools, message });
      setHasScanned(true);
      setButtonLabel("Refresh Recommendations");

      // 🧠 Step 2: Ask AI for insights
      if (filteredPools.length > 0) {
        setLoadingAI(true);
        const aiRes = await axios.post("/api/analyze", {
          goal,
          minApy,
          pools: filteredPools,
        });
        setAiSummary(aiRes.data.summary || "");
      }
    } catch (err) {
      console.error("Fetch error:", err);
      setScanError("Failed to load recommendations. Please try again.");
    } finally {
      setTimeout(() => setLoadingScan(false), 400);
      setTimeout(() => setLoadingAI(false), 600);
    }
  }

  // 🧹 Reset user-specific states on wallet disconnect
  useEffect(() => {
    if (!address) {
      setGoal("yield");
      setMinApy(0);
      setScan({ recommendations: [], message: undefined });
      setScanError(null);
      setHasScanned(false);
      setButtonLabel("Apply Preferences");
      setLoadingScan(false);
      setAiSummary("");
    }
  }, [address]);

  function handlePreferenceChange({
    goal,
    minApy,
  }: {
    goal: "yield" | "safety";
    minApy: number;
  }) {
    setGoal(goal);
    setMinApy(minApy);
    setHasScanned(false);
    setButtonLabel("Apply Preferences");
  }

  return (
    <>
      {/* 🧭 Wallet Connect section */}
      <div className="p-4 pt-2 flex items-center justify-end space-x-4">
        <div className="text-sm text-zinc-400">
          {address ? (
            <span className="text-zinc-300 font-medium truncate max-w-[200px] inline-block align-middle" />
          ) : (
            <span className="text-zinc-500">🔒 Connect your wallet to begin</span>
          )}
        </div>
        <WalletConnect />
      </div>

      <div className="max-w-6xl mx-auto px-6 py-6 grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar */}
        <aside className="lg:col-span-1 flex flex-col gap-6">
          {/* Wallet Box */}
          <div className="rounded-2xl p-5 glass">
            <div className="text-xs text-zinc-400 mb-1">Wallet</div>
            <div className="text-sm font-medium break-words text-zinc-200">
              {address || "Not connected"}
            </div>
          </div>

          {/* Preferences Box */}
          <div className="rounded-2xl p-7 glass shadow-lg space-y-5">
            <h3 className="text-lg font-semibold mb-3">Preferences</h3>

            <Preferences
              value={{ goal, minApy }}
              onChange={handlePreferenceChange}
              disabled={!address}
            />

            {/* ✅ Unified button */}
            <div className="relative mt-5">
              <AnimatePresence mode="wait">
                <motion.button
                  key={hasScanned ? "refresh" : "apply"}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: loadingScan ? 1.02 : 1 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  onClick={runScan}
                  disabled={loadingScan || !address}
                  className={`w-full px-5 py-3 rounded-lg text-sm font-medium text-white transition-all bg-gradient-to-r from-sky-500 to-blue-600 shadow-md ${loadingScan
                      ? "cursor-wait opacity-80"
                      : !address
                        ? "bg-zinc-800 text-zinc-500 cursor-not-allowed"
                        : "hover:opacity-90"
                    }`}
                >
                  {loadingScan
                    ? "Refreshing..."
                    : !hasScanned
                      ? "Apply Preferences"
                      : "Refresh Recommendations"}
                </motion.button>
              </AnimatePresence>
            </div>
          </div>
        </aside>

        {/* Main Section */}
        <section className="lg:col-span-3">
          <div className="flex items-center justify-between mb-5 -mt-2">
            <h2 className="text-2xl font-bold">Recommendations (Velar)</h2>
            <span className="text-sm text-zinc-500">Top performing pools</span>
          </div>

          {scan?.message && (
            <div className="mb-5 p-3 rounded-lg bg-blue-900/30 border border-blue-600 text-blue-200 text-sm">
              {scan.message}
            </div>
          )}

          {/* 🧠 AI Insights Section */}
          {aiSummary && (
            <div className="mb-6 p-5 rounded-xl bg-gradient-to-r from-sky-900/20 to-blue-900/20 border border-sky-700 text-sky-100 text-sm shadow-md">
              <h4 className="text-base font-semibold mb-2">🤖 AI Insights</h4>
              <p>{aiSummary}</p>
            </div>
          )}

          {loadingAI && (
            <div className="text-zinc-400 text-center mt-6 animate-pulse">
              ✨ Analyzing your best opportunities...
            </div>
          )}

          {!address ? (
            <div className="text-zinc-400 text-center mt-10">
              🔒 Connect your wallet to view recommendations.
            </div>
          ) : !hasScanned && (
            <div className="text-zinc-400 text-center mt-10">
              ⚙️ Set your preferences and click{" "}
              <span className="text-sky-400 font-medium">Apply Preferences</span>{" "}
              to view your best pool recommendations.
            </div>
          )}

          {address && loadingScan && (
            <div className="text-zinc-400 text-center mt-10 animate-pulse">
              Loading Velar pools...
            </div>
          )}

          {scanError && (
            <div className="text-red-400 text-center">{scanError}</div>
          )}

          {!loadingScan && address && scan.recommendations.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {scan.recommendations.map((p) => {
                const score = Math.round(scorePool(p, goal));
                const riskLabel = p.risk.charAt(0).toUpperCase() + p.risk.slice(1);
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
                      <div>
                        <div className="text-sm font-semibold">
                          Velar <span className="text-zinc-400">•</span> {p.name}
                        </div>
                        <div className="text-xs text-zinc-500">
                          Score: {score}/100
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold">
                          {p.apy.toFixed(2)}%
                        </div>
                        <span
                          className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs ${riskColor}`}
                        >
                          {riskLabel}
                        </span>
                      </div>
                    </div>
                    <div className="text-sm text-zinc-400">
                      Matches your goal — {riskNote(p)}
                    </div>
                    <div className="flex justify-between items-center">
                      <a
                        href={p.url}
                        target="_blank"
                        className="px-3 py-2 rounded-md border border-zinc-800 text-sm hover:bg-zinc-800/40"
                      >
                        Open on Velar
                      </a>
                      <RecordIntent address={address} poolId={p.id} />
                    </div>
                  </article>
                );
              })}
            </div>
          )}

          {!loadingScan && address && scan.recommendations.length === 0 && hasScanned && (
            <div className="text-zinc-400 text-center">
              No pools found for your filter.
            </div>
          )}
        </section>
      </div>
    </>
  );
}





// "use client";
// import { useState, useEffect } from "react";
// import axios from "axios";
// import { motion, AnimatePresence } from "framer-motion";
// import { Preferences } from "@/components/Preferences";
// import WalletConnect from "@/components/WalletConnect";
// import RecordIntent from "@/components/RecordIntent";
// import { useWallet } from "@/hooks/useWallet";
// import { scorePool, riskNote } from "@/lib/risk";

// export default function Home() {
//   const { address } = useWallet();

//   const [goal, setGoal] = useState<"yield" | "safety">("yield");
//   const [minApy, setMinApy] = useState<number>(0);
//   const [scan, setScan] = useState<{ recommendations: any[]; message?: string }>({
//     recommendations: [],
//   });
//   const [loadingScan, setLoadingScan] = useState(false);
//   const [scanError, setScanError] = useState<string | null>(null);
//   const [hasScanned, setHasScanned] = useState(false);
//   const [buttonLabel, setButtonLabel] = useState("Apply Preferences");

//   // 🧠 Main unified handler (Apply + Refresh)
//   async function runScan() {
//     if (!address) {
//       setScan({
//         recommendations: [],
//         message: "🔒 Connect your wallet to view recommendations.",
//       });
//       return;
//     }

//     setLoadingScan(true);
//     setScanError(null);

//     try {
//       const res = await axios.post("/api/recommendations", { goal });
//       let pools = res.data.result || [];

//       // 🧮 Filter by APY threshold
//       let filteredPools = pools.filter((p: any) => p.apy <= minApy);

//       let message = "";
//       if (filteredPools.length === 0 && pools.length > 0) {
//         filteredPools = pools;
//         message = `No pools match your APY ≤ ${minApy}%. Showing all available pools instead.`;
//       } else if (filteredPools.length > 0) {
//         message = `Showing pools with APY ≤ ${minApy}%.`;
//       } else {
//         message = "No pools available at the moment.";
//       }

//       setScan({
//         recommendations: filteredPools,
//         message,
//       });

//       setHasScanned(true);
//       setButtonLabel("Refresh Recommendations");
//     } catch (err) {
//       console.error("Fetch error:", err);
//       setScanError("Failed to load recommendations. Please try again.");
//     } finally {
//       setTimeout(() => setLoadingScan(false), 400);
//     }
//   }

//   // 🧹 Reset user-specific states on wallet disconnect
//   useEffect(() => {
//     if (!address) {
//       setGoal("yield");
//       setMinApy(0);
//       setScan({ recommendations: [], message: undefined });
//       setScanError(null);
//       setHasScanned(false);
//       setButtonLabel("Apply Preferences");
//       setLoadingScan(false);
//     }
//   }, [address]);

//   function handlePreferenceChange({
//     goal,
//     minApy,
//   }: {
//     goal: "yield" | "safety";
//     minApy: number;
//   }) {
//     setGoal(goal);
//     setMinApy(minApy);
//     setHasScanned(false);
//     setButtonLabel("Apply Preferences");
//   }

//   return (
//     <>
//       {/* 🧭 Wallet Connect section */}
//       <div className="p-4 pt-2 flex items-center justify-end space-x-4">
//         <div className="text-sm text-zinc-400">
//           {address ? (
//             <span className="text-zinc-300 font-medium truncate max-w-[200px] inline-block align-middle" />
//           ) : (
//             <span className="text-zinc-500">🔒 Connect your wallet to begin</span>
//           )}
//         </div>
//         <WalletConnect />
//       </div>

//       <div className="max-w-6xl mx-auto px-6 py-6 grid grid-cols-1 lg:grid-cols-4 gap-8">
//         {/* Sidebar */}
//         <aside className="lg:col-span-1 flex flex-col gap-6">
//           {/* Wallet Box */}
//           <div className="rounded-2xl p-5 glass">
//             <div className="text-xs text-zinc-400 mb-1">Wallet</div>
//             <div className="text-sm font-medium break-words text-zinc-200">
//               {address || "Not connected"}
//             </div>
//           </div>

//           {/* Preferences Box */}
//           <div className="rounded-2xl p-7 glass shadow-lg space-y-5">
//             <h3 className="text-lg font-semibold mb-3">Preferences</h3>

//             {/* ⬇️ Pass address to Preferences to control APY input state */}
//             <Preferences
//               value={{ goal, minApy }}
//               onChange={handlePreferenceChange}
//               disabled={!address}
//             />

//             {/* ✅ Unified button */}
//             <div className="relative mt-5">
//               <AnimatePresence mode="wait">
//                 <motion.button
//                   key={hasScanned ? "refresh" : "apply"}
//                   initial={{ opacity: 0, scale: 0.95 }}
//                   animate={{ opacity: 1, scale: loadingScan ? 1.02 : 1 }}
//                   transition={{ duration: 0.3, ease: "easeInOut" }}
//                   exit={{ opacity: 0, scale: 0.95 }}
//                   onClick={runScan}
//                   disabled={loadingScan || !address}
//                   className={`w-full px-5 py-3 rounded-lg text-sm font-medium text-white transition-all bg-gradient-to-r from-sky-500 to-blue-600 shadow-md ${loadingScan
//                       ? "cursor-wait opacity-80"
//                       : !address
//                         ? "bg-zinc-800 text-zinc-500 cursor-not-allowed"
//                         : "hover:opacity-90"
//                     }`}
//                 >
//                   {loadingScan
//                     ? "Refreshing..."
//                     : !hasScanned
//                       ? "Apply Preferences"
//                       : "Refresh Recommendations"}
//                 </motion.button>
//               </AnimatePresence>
//             </div>
//           </div>
//         </aside>

//         {/* Main Section */}
//         <section className="lg:col-span-3">
//           <div className="flex items-center justify-between mb-5 -mt-2">
//             <h2 className="text-2xl font-bold">Recommendations (Velar)</h2>
//             <span className="text-sm text-zinc-500">Top performing pools</span>
//           </div>

//           {scan?.message && (
//             <div className="mb-5 p-3 rounded-lg bg-blue-900/30 border border-blue-600 text-blue-200 text-sm">
//               {scan.message}
//             </div>
//           )}

//           {!address ? (
//             <div className="text-zinc-400 text-center mt-10">
//               🔒 Connect your wallet to view recommendations.
//             </div>
//           ) : !hasScanned && (
//             <div className="text-zinc-400 text-center mt-10">
//               ⚙️ Set your preferences and click{" "}
//               <span className="text-sky-400 font-medium">Apply Preferences</span>{" "}
//               to view your best pool recommendations.
//             </div>
//           )}

//           {address && loadingScan && (
//             <div className="text-zinc-400 text-center mt-10 animate-pulse">
//               Loading Velar pools...
//             </div>
//           )}

//           {scanError && (
//             <div className="text-red-400 text-center">{scanError}</div>
//           )}

//           {!loadingScan && address && scan.recommendations.length > 0 && (
//             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//               {scan.recommendations.map((p) => {
//                 const score = Math.round(scorePool(p, goal));
//                 const riskLabel =
//                   p.risk.charAt(0).toUpperCase() + p.risk.slice(1);
//                 const riskColor =
//                   p.risk === "low"
//                     ? "bg-green-600 text-green-50"
//                     : p.risk === "medium"
//                       ? "bg-yellow-600 text-yellow-50"
//                       : "bg-red-600 text-red-50";

//                 return (
//                   <article
//                     key={p.id}
//                     className="p-6 rounded-2xl border border-zinc-700 bg-zinc-900/70 backdrop-blur-md shadow-lg hover:border-sky-500/50 transition-all space-y-4"
//                   >
//                     <div className="flex items-start justify-between gap-3">
//                       <div>
//                         <div className="text-sm font-semibold">
//                           Velar <span className="text-zinc-400">•</span> {p.name}
//                         </div>
//                         <div className="text-xs text-zinc-500">
//                           Score: {score}/100
//                         </div>
//                       </div>
//                       <div className="text-right">
//                         <div className="text-2xl font-bold">
//                           {p.apy.toFixed(2)}%
//                         </div>
//                         <span
//                           className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs ${riskColor}`}
//                         >
//                           {riskLabel}
//                         </span>
//                       </div>
//                     </div>
//                     <div className="text-sm text-zinc-400">
//                       Matches your goal with APY ≤ {minApy}% — {riskNote(p)}
//                     </div>
//                     <div className="flex justify-between items-center">
//                       <a
//                         href={p.url}
//                         target="_blank"
//                         className="px-3 py-2 rounded-md border border-zinc-800 text-sm hover:bg-zinc-800/40"
//                       >
//                         Open on Velar
//                       </a>
//                       <RecordIntent address={address} poolId={p.id} />
//                     </div>
//                   </article>
//                 );
//               })}
//             </div>
//           )}

//           {!loadingScan && address && scan.recommendations.length === 0 && hasScanned && (
//             <div className="text-zinc-400 text-center">
//               No pools found for your filter.
//             </div>
//           )}
//         </section>
//       </div>
//     </>
//   );
// }



// "use client";
// import { useState, useEffect } from "react";
// import axios from "axios";
// import { motion, AnimatePresence } from "framer-motion";
// import { Preferences } from "@/components/Preferences";
// import WalletConnect from "@/components/WalletConnect";
// import RecordIntent from "@/components/RecordIntent";
// import { useWallet } from "@/hooks/useWallet";
// import { scorePool, riskNote } from "@/lib/risk";

// export default function Home() {
//   const { address } = useWallet();

//   const [goal, setGoal] = useState<"yield" | "safety">("yield");
//   const [minApy, setMinApy] = useState<number>(0);
//   const [scan, setScan] = useState<{ recommendations: any[]; message?: string }>({
//     recommendations: [],
//   });
//   const [loadingScan, setLoadingScan] = useState(false);
//   const [scanError, setScanError] = useState<string | null>(null);
//   const [hasScanned, setHasScanned] = useState(false);
//   const [buttonLabel, setButtonLabel] = useState("Apply Preferences");

//   // 🧠 Main unified handler (Apply + Refresh)
//   async function runScan() {
//     if (!address) {
//       setScan({
//         recommendations: [],
//         message: "🔒 Connect your wallet to view recommendations.",
//       });
//       return;
//     }

//     setLoadingScan(true);
//     setScanError(null);

//     try {
//       const res = await axios.post("/api/recommendations", { goal });
//       let pools = res.data.result || [];

//       // 🧮 Filter by APY threshold
//       let filteredPools = pools.filter((p: any) => p.apy <= minApy);

//       let message = "";
//       if (filteredPools.length === 0 && pools.length > 0) {
//         filteredPools = pools;
//         message = `No pools match your APY ≤ ${minApy}%. Showing all available pools instead.`;
//       } else if (filteredPools.length > 0) {
//         message = `Showing pools with APY ≤ ${minApy}%.`;
//       } else {
//         message = "No pools available at the moment.";
//       }

//       setScan({
//         recommendations: filteredPools,
//         message,
//       });

//       setHasScanned(true);
//       setButtonLabel("Refresh Recommendations");
//     } catch (err) {
//       console.error("Fetch error:", err);
//       setScanError("Failed to load recommendations. Please try again.");
//     } finally {
//       setTimeout(() => setLoadingScan(false), 400);
//     }
//   }

//   // 🧹 Reset user-specific states on wallet disconnect
//   useEffect(() => {
//     if (!address) {
//       setGoal("yield");
//       setMinApy(0);
//       setScan({ recommendations: [], message: undefined });
//       setScanError(null);
//       setHasScanned(false);
//       setButtonLabel("Apply Preferences");
//       setLoadingScan(false);
//     }
//   }, [address]);

//   function handlePreferenceChange({
//     goal,
//     minApy,
//   }: {
//     goal: "yield" | "safety";
//     minApy: number;
//   }) {
//     setGoal(goal);
//     setMinApy(minApy);
//     setHasScanned(false);
//     setButtonLabel("Apply Preferences");
//   }

//   return (
//     <>
//       {/* 🧭 Wallet Connect section with status first, then button */}
//       <div className="p-4 pt-2 flex items-center justify-end space-x-4">

//         <div className="text-sm text-zinc-400">
//           {address ? (
//             <span className="text-zinc-300 font-medium truncate max-w-[200px] inline-block align-middle">
//               {/* Connected: {address} */}
//             </span>
//           ) : (
//             <span className="text-zinc-500">🔒 Connect your wallet to begin</span>
//           )}
//         </div>
//         <WalletConnect />
//       </div>



//       <div className="max-w-6xl mx-auto px-6 py-6 grid grid-cols-1 lg:grid-cols-4 gap-8">
//         {/* Sidebar */}
//         <aside className="lg:col-span-1 flex flex-col gap-6">
//           {/* Wallet Box */}
//           <div className="rounded-2xl p-5 glass">
//             <div className="text-xs text-zinc-400 mb-1">Wallet</div>
//             <div className="text-sm font-medium break-words text-zinc-200">
//               {address || "Not connected"}
//             </div>
//           </div>

//           {/* Preferences Box — made to breathe */}
//           <div className="rounded-2xl p-7 glass shadow-lg space-y-5">
//             <h3 className="text-lg font-semibold mb-3">Preferences</h3>
//             <Preferences value={{ goal, minApy }} onChange={handlePreferenceChange} />

//             {/* ✅ Unified button */}
//             <div className="relative mt-5">
//               <AnimatePresence mode="wait">
//                 <motion.button
//                   key={hasScanned ? "refresh" : "apply"}
//                   initial={{ opacity: 0, scale: 0.95 }}
//                   animate={{
//                     opacity: 1,
//                     scale: loadingScan ? 1.02 : 1,
//                   }}
//                   transition={{ duration: 0.3, ease: "easeInOut" }}
//                   exit={{ opacity: 0, scale: 0.95 }}
//                   onClick={runScan}
//                   disabled={loadingScan || !address}
//                   className={`w-full px-5 py-3 rounded-lg text-sm font-medium text-white transition-all bg-gradient-to-r from-sky-500 to-blue-600 shadow-md ${loadingScan
//                     ? "cursor-wait opacity-80"
//                     : !address
//                       ? "bg-zinc-800 text-zinc-500 cursor-not-allowed"
//                       : "hover:opacity-90"
//                     }`}
//                 >
//                   {loadingScan
//                     ? "Refreshing..."
//                     : !hasScanned
//                       ? "Apply Preferences"
//                       : "Refresh Recommendations"}
//                 </motion.button>
//               </AnimatePresence>
//             </div>
//           </div>
//         </aside>

//         {/* Main Section */}
//         <section className="lg:col-span-3">
//           {/* Raised title area */}
//           <div className="flex items-center justify-between mb-5 -mt-2">
//             <h2 className="text-2xl font-bold">Recommendations (Velar)</h2>
//             <span className="text-sm text-zinc-500">Top performing pools</span>
//           </div>

//           {scan?.message && (
//             <div className="mb-5 p-3 rounded-lg bg-blue-900/30 border border-blue-600 text-blue-200 text-sm">
//               {scan.message}
//             </div>
//           )}

//           {/* 🧭 Dynamic guidance based on wallet + scan state */}
//           {!address ? (
//             <div className="text-zinc-400 text-center mt-10">
//               🔒 Connect your wallet to view recommendations.
//             </div>
//           ) : !hasScanned && (
//             <div className="text-zinc-400 text-center mt-10">
//               ⚙️ Set your preferences and click <span className="text-sky-400 font-medium">Apply Preferences</span> to view your best pool recommendations.
//             </div>
//           )}


//           {address && loadingScan && (
//             <div className="text-zinc-400 text-center mt-10 animate-pulse">
//               Loading Velar pools...
//             </div>
//           )}

//           {scanError && (
//             <div className="text-red-400 text-center">{scanError}</div>
//           )}

//           {!loadingScan && address && scan.recommendations.length > 0 && (
//             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//               {scan.recommendations.map((p) => {
//                 const score = Math.round(scorePool(p, goal));
//                 const riskLabel =
//                   p.risk.charAt(0).toUpperCase() + p.risk.slice(1);
//                 const riskColor =
//                   p.risk === "low"
//                     ? "bg-green-600 text-green-50"
//                     : p.risk === "medium"
//                       ? "bg-yellow-600 text-yellow-50"
//                       : "bg-red-600 text-red-50";

//                 return (
//                   <article
//                     key={p.id}
//                     className="p-6 rounded-2xl border border-zinc-700 bg-zinc-900/70 backdrop-blur-md shadow-lg hover:border-sky-500/50 transition-all space-y-4"
//                   >
//                     <div className="flex items-start justify-between gap-3">
//                       <div>
//                         <div className="text-sm font-semibold">
//                           Velar <span className="text-zinc-400">•</span> {p.name}
//                         </div>
//                         <div className="text-xs text-zinc-500">
//                           Score: {score}/100
//                         </div>
//                       </div>
//                       <div className="text-right">
//                         <div className="text-2xl font-bold">
//                           {p.apy.toFixed(2)}%
//                         </div>
//                         <span
//                           className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs ${riskColor}`}
//                         >
//                           {riskLabel}
//                         </span>
//                       </div>
//                     </div>
//                     <div className="text-sm text-zinc-400">
//                       Matches your goal with APY ≤ {minApy}% — {riskNote(p)}
//                     </div>
//                     <div className="flex justify-between items-center">
//                       <a
//                         href={p.url}
//                         target="_blank"
//                         className="px-3 py-2 rounded-md border border-zinc-800 text-sm hover:bg-zinc-800/40"
//                       >
//                         Open on Velar
//                       </a>
//                       <RecordIntent address={address} poolId={p.id} />
//                     </div>
//                   </article>
//                 );
//               })}
//             </div>
//           )}

//           {!loadingScan &&
//             address &&
//             scan.recommendations.length === 0 &&
//             hasScanned && (
//               <div className="text-zinc-400 text-center">
//                 No pools found for your filter.
//               </div>
//             )}
//         </section>
//       </div>
//     </>
//   );
// }




// "use client";
// import { useState } from "react";
// import axios from "axios";
// import { motion, AnimatePresence } from "framer-motion";
// import { Preferences } from "@/components/Preferences";
// import WalletConnect from "@/components/WalletConnect";
// import RecordIntent from "@/components/RecordIntent";
// import { useWallet } from "@/hooks/useWallet";
// import { scorePool, riskNote } from "@/lib/risk";
// import { useEffect } from "react";

// export default function Home() {
//   const { address } = useWallet();

//   const [goal, setGoal] = useState<"yield" | "safety">("yield");
//   const [minApy, setMinApy] = useState<number>(0);
//   const [scan, setScan] = useState<{ recommendations: any[]; message?: string }>({
//     recommendations: [],
//   });
//   const [loadingScan, setLoadingScan] = useState(false);
//   const [scanError, setScanError] = useState<string | null>(null);
//   const [hasScanned, setHasScanned] = useState(false);
//   const [buttonLabel, setButtonLabel] = useState("Apply Preferences");

//   // 🧠 Main unified handler (Apply + Refresh)
//   async function runScan() {
//     if (!address) {
//       setScan({
//         recommendations: [],
//         message: "🔒 Connect your wallet to view recommendations.",
//       });
//       return;
//     }

//     setLoadingScan(true);
//     setScanError(null);

//     try {
//       const res = await axios.post("/api/recommendations", { goal });
//       let pools = res.data.result || [];

//       // 🧮 Filter by APY threshold
//       let filteredPools = pools.filter((p: any) => p.apy <= minApy);

//       let message = "";
//       if (filteredPools.length === 0 && pools.length > 0) {
//         // fallback to showing all
//         filteredPools = pools;
//         message = `No pools match your APY ≤ ${minApy}%. Showing all available pools instead.`;
//       } else if (filteredPools.length > 0) {
//         message = `Showing pools with APY ≤ ${minApy}%.`;
//       } else {
//         message = "No pools available at the moment.";
//       }

//       setScan({
//         recommendations: filteredPools,
//         message,
//       });

//       setHasScanned(true);
//       setButtonLabel("Refresh Recommendations");
//     } catch (err) {
//       console.error("Fetch error:", err);
//       setScanError("Failed to load recommendations. Please try again.");
//     } finally {
//       setTimeout(() => setLoadingScan(false), 400);
//     }
//   }


//   // 👇 Add this just after your state hooks
//   useEffect(() => {
//     if (!address) {
//       // 🧹 Reset all user-specific states when wallet disconnects
//       setGoal("yield");
//       setMinApy(0);
//       setScan({ recommendations: [], message: undefined });
//       setScanError(null);
//       setHasScanned(false);
//       setButtonLabel("Apply Preferences");
//       setLoadingScan(false);
//     }
//   }, [address]);

//   // ⚙️ Update user preferences (reset scan state)
//   function handlePreferenceChange({
//     goal,
//     minApy,
//   }: {
//     goal: "yield" | "safety";
//     minApy: number;
//   }) {
//     setGoal(goal);
//     setMinApy(minApy);
//     setHasScanned(false);
//     setButtonLabel("Apply Preferences");
//   }

//   return (
//     <>
//       <div className="p-4">
//         <WalletConnect />
//       </div>

//       <div className="max-w-6xl mx-auto px-6 py-10 grid grid-cols-1 lg:grid-cols-4 gap-8">
//         {/* Sidebar */}
//         <aside className="lg:col-span-1 flex flex-col gap-6">
//           <div className="rounded-2xl p-5 glass">
//             <div className="text-xs text-zinc-400">Wallet</div>
//             <div className="text-sm font-medium break-words">
//               {address || "Not connected"}
//             </div>
//           </div>

//           <div className="rounded-2xl p-6 glass shadow-lg space-y-4">
//             <h3 className="text-lg font-semibold mb-2">Preferences</h3>
//             <Preferences value={{ goal, minApy }} onChange={handlePreferenceChange} />

//             {/* ✅ Unified button replaces Apply + Refresh */}
//             <div className="relative mt-3">
//               <AnimatePresence mode="wait">
//                 <motion.button
//                   key={hasScanned ? "refresh" : "apply"}
//                   initial={{ opacity: 0, scale: 0.95 }}
//                   animate={{
//                     opacity: 1,
//                     scale: loadingScan ? 1.02 : 1,
//                   }}
//                   transition={{ duration: 0.3, ease: "easeInOut" }}
//                   exit={{ opacity: 0, scale: 0.95 }}
//                   onClick={runScan}
//                   disabled={loadingScan || !address}
//                   className={`w-full px-4 py-2 rounded-lg text-sm font-medium text-white transition-all bg-gradient-to-r from-sky-500 to-blue-600 shadow-md ${loadingScan
//                     ? "cursor-wait opacity-80"
//                     : !address
//                       ? "bg-zinc-800 text-zinc-500 cursor-not-allowed"
//                       : "hover:opacity-90"
//                     }`}
//                 >
//                   {loadingScan
//                     ? "Refreshing..."
//                     : !hasScanned
//                       ? "Apply Preferences"
//                       : "Refresh Recommendations"}
//                 </motion.button>
//               </AnimatePresence>
//             </div>
//           </div>
//         </aside>

//         {/* Main Section */}
//         <section className="lg:col-span-3">
//           <div className="flex items-center justify-between mb-6">
//             <h2 className="text-2xl font-bold">Recommendations (Velar)</h2>
//             <span className="text-sm text-zinc-500">Top performing pools</span>
//           </div>

//           {scan?.message && (
//             <div className="mb-4 p-3 rounded-lg bg-blue-900/30 border border-blue-600 text-blue-200 text-sm">
//               {scan.message}
//             </div>
//           )}

//           {!address && (
//             <div className="text-zinc-400 text-center mt-10">
//               🔒 Connect your wallet to view recommendations.
//             </div>
//           )}

//           {address && loadingScan && (
//             <div className="text-zinc-400 text-center mt-10 animate-pulse">
//               Loading Velar pools...
//             </div>
//           )}

//           {scanError && (
//             <div className="text-red-400 text-center">{scanError}</div>
//           )}

//           {!loadingScan && address && scan.recommendations.length > 0 && (
//             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//               {scan.recommendations.map((p) => {
//                 const score = Math.round(scorePool(p, goal));
//                 const riskLabel =
//                   p.risk.charAt(0).toUpperCase() + p.risk.slice(1);
//                 const riskColor =
//                   p.risk === "low"
//                     ? "bg-green-600 text-green-50"
//                     : p.risk === "medium"
//                       ? "bg-yellow-600 text-yellow-50"
//                       : "bg-red-600 text-red-50";

//                 return (
//                   <article
//                     key={p.id}
//                     className="p-6 rounded-2xl border border-zinc-700 bg-zinc-900/70 backdrop-blur-md shadow-lg hover:border-sky-500/50 transition-all space-y-4"
//                   >
//                     <div className="flex items-start justify-between gap-3">
//                       <div>
//                         <div className="text-sm font-semibold">
//                           Velar <span className="text-zinc-400">•</span> {p.name}
//                         </div>
//                         <div className="text-xs text-zinc-500">
//                           Score: {score}/100
//                         </div>
//                       </div>
//                       <div className="text-right">
//                         <div className="text-2xl font-bold">
//                           {p.apy.toFixed(2)}%
//                         </div>
//                         <span
//                           className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs ${riskColor}`}
//                         >
//                           {riskLabel}
//                         </span>
//                       </div>
//                     </div>
//                     <div className="text-sm text-zinc-400">
//                       Matches your goal with APY ≤ {minApy}% — {riskNote(p)}
//                     </div>
//                     <div className="flex justify-between items-center">
//                       <a
//                         href={p.url}
//                         target="_blank"
//                         className="px-3 py-2 rounded-md border border-zinc-800 text-sm hover:bg-zinc-800/40"
//                       >
//                         Open on Velar
//                       </a>
//                       <RecordIntent address={address} poolId={p.id} />
//                     </div>
//                   </article>
//                 );
//               })}
//             </div>
//           )}

//           {!loadingScan &&
//             address &&
//             scan.recommendations.length === 0 &&
//             hasScanned && (
//               <div className="text-zinc-400 text-center">
//                 No pools found for your filter.
//               </div>
//             )}
//         </section>
//       </div>
//     </>
//   );
// }



// "use client";
// import { useState } from "react";
// import axios from "axios";
// import { motion, AnimatePresence } from "framer-motion";
// import { Preferences } from "@/components/Preferences";
// import WalletConnect from "@/components/WalletConnect";
// import RecordIntent from "@/components/RecordIntent";
// import { useWallet } from "@/hooks/useWallet";
// import { scorePool, riskNote } from "@/lib/risk";

// export default function Home() {
//   const { address } = useWallet();

//   const [goal, setGoal] = useState<"yield" | "safety">("yield");
//   const [minApy, setMinApy] = useState<number>(0);
//   const [scan, setScan] = useState<{ recommendations: any[]; message?: string }>({
//     recommendations: [],
//   });
//   const [loadingScan, setLoadingScan] = useState(false);
//   const [scanError, setScanError] = useState<string | null>(null);
//   const [hasScanned, setHasScanned] = useState(false);
//   const [buttonLabel, setButtonLabel] = useState("Apply Preferences");

//   // 🧠 Main unified handler (Apply + Refresh)
//   async function runScan() {
//     if (!address) {
//       setScan({
//         recommendations: [],
//         message: "Connect your wallet to view recommendations.",
//       });
//       return;
//     }

//     setLoadingScan(true);
//     setScanError(null);

//     try {
//       const res = await axios.post("/api/recommendations", { minApy, goal });
//       setScan({
//         recommendations: res.data.result || [],
//         message: res.data.message || undefined,
//       });
//       setHasScanned(true);
//       setButtonLabel("Refresh Recommendations");
//     } catch (err) {
//       console.error("Fetch error:", err);
//       setScanError("Failed to load recommendations. Please try again.");
//     } finally {
//       // 🩵 Ensure loading stops even if rerenders happen
//       setTimeout(() => setLoadingScan(false), 500);
//     }
//   }

//   // ⚙️ Update user preferences (reset scan state)
//   function handlePreferenceChange({
//     goal,
//     minApy,
//   }: {
//     goal: "yield" | "safety";
//     minApy: number;
//   }) {
//     setGoal(goal);
//     setMinApy(minApy);
//     setHasScanned(false);
//     setButtonLabel("Apply Preferences");
//   }

//   return (
//     <>
//       <div className="p-4">
//         <WalletConnect />
//       </div>

//       <div className="max-w-6xl mx-auto px-6 py-10 grid grid-cols-1 lg:grid-cols-4 gap-8">
//         {/* Sidebar */}
//         <aside className="lg:col-span-1 flex flex-col gap-6">
//           <div className="rounded-2xl p-5 glass">
//             <div className="text-xs text-zinc-400">Wallet</div>
//             <div className="text-sm font-medium break-words">
//               {address || "Not connected"}
//             </div>
//           </div>

//           <div className="rounded-2xl p-6 glass shadow-lg space-y-4">
//             <h3 className="text-lg font-semibold mb-2">Preferences</h3>
//             <Preferences value={{ goal, minApy }} onChange={handlePreferenceChange} />

//             {/* ✅ Unified button replaces Apply + Refresh */}
//             <div className="relative mt-3">
//               <AnimatePresence mode="wait">
//                 <motion.button
//                   key={hasScanned ? "refresh" : "apply"} // ✅ stable keys
//                   initial={{ opacity: 0, scale: 0.95 }}
//                   animate={{
//                     opacity: 1,
//                     scale: loadingScan ? 1.02 : 1,
//                   }}
//                   transition={{ duration: 0.3, ease: "easeInOut" }}
//                   exit={{ opacity: 0, scale: 0.95 }}
//                   onClick={runScan}
//                   disabled={loadingScan || !address}
//                   className={`w-full px-4 py-2 rounded-lg text-sm font-medium text-white transition-all bg-gradient-to-r from-sky-500 to-blue-600 shadow-md ${loadingScan
//                     ? "cursor-wait opacity-80"
//                     : !address
//                       ? "bg-zinc-800 text-zinc-500 cursor-not-allowed"
//                       : "hover:opacity-90"
//                     }`}
//                 >
//                   {loadingScan
//                     ? "Refreshing..."
//                     : !hasScanned
//                       ? "Apply Preferences"
//                       : "Refresh Recommendations"}
//                 </motion.button>
//               </AnimatePresence>
//             </div>
//           </div>
//         </aside>

//         {/* Main Section */}
//         <section className="lg:col-span-3">
//           <div className="flex items-center justify-between mb-6">
//             <h2 className="text-2xl font-bold">Recommendations (Velar)</h2>
//             <span className="text-sm text-zinc-500">Top performing pools</span>
//           </div>

//           {scan?.message && (
//             <div className="mb-4 p-3 rounded-lg bg-blue-900/30 border border-blue-600 text-blue-200 text-sm">
//               {scan.message}
//             </div>
//           )}

//           {!address && (
//             <div className="text-zinc-400 text-center mt-10">
//               🔒 Connect your wallet to view recommendations.
//             </div>
//           )}

//           {address && loadingScan && (
//             <div className="text-zinc-400 text-center mt-10 animate-pulse">
//               Loading Velar pools...
//             </div>
//           )}

//           {scanError && (
//             <div className="text-red-400 text-center">{scanError}</div>
//           )}

//           {!loadingScan && address && scan.recommendations.length > 0 && (
//             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//               {scan.recommendations.map((p) => {
//                 const score = Math.round(scorePool(p, goal));
//                 const riskLabel =
//                   p.risk.charAt(0).toUpperCase() + p.risk.slice(1);
//                 const riskColor =
//                   p.risk === "low"
//                     ? "bg-green-600 text-green-50"
//                     : p.risk === "medium"
//                       ? "bg-yellow-600 text-yellow-50"
//                       : "bg-red-600 text-red-50";

//                 return (
//                   <article
//                     key={p.id}
//                     className="p-6 rounded-2xl border border-zinc-700 bg-zinc-900/70 backdrop-blur-md shadow-lg hover:border-sky-500/50 transition-all space-y-4"
//                   >
//                     <div className="flex items-start justify-between gap-3">
//                       <div>
//                         <div className="text-sm font-semibold">
//                           Velar <span className="text-zinc-400">•</span> {p.name}
//                         </div>
//                         <div className="text-xs text-zinc-500">
//                           Score: {score}/100
//                         </div>
//                       </div>
//                       <div className="text-right">
//                         <div className="text-2xl font-bold">
//                           {p.apy.toFixed(2)}%
//                         </div>
//                         <span
//                           className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs ${riskColor}`}
//                         >
//                           {riskLabel}
//                         </span>
//                       </div>
//                     </div>
//                     <div className="text-sm text-zinc-400">
//                       Matches your goal with APY ≤ {minApy}% — {riskNote(p)}
//                     </div>
//                     <div className="flex justify-between items-center">
//                       <a
//                         href={p.url}
//                         target="_blank"
//                         className="px-3 py-2 rounded-md border border-zinc-800 text-sm hover:bg-zinc-800/40"
//                       >
//                         Open on Velar
//                       </a>
//                       <RecordIntent address={address} poolId={p.id} />
//                     </div>
//                   </article>
//                 );
//               })}
//             </div>
//           )}

//           {!loadingScan &&
//             address &&
//             scan.recommendations.length === 0 &&
//             hasScanned && (
//               <div className="text-zinc-400 text-center">
//                 No pools found for your filter.
//               </div>
//             )}
//         </section>
//       </div>
//     </>
//   );
// }



// "use client";

// import { useState } from "react";
// import axios from "axios";
// import { motion, AnimatePresence } from "framer-motion";
// import { Preferences } from "@/components/Preferences";
// import WalletConnect from "@/components/WalletConnect";
// import RecordIntent from "@/components/RecordIntent";
// import { useWallet } from "@/hooks/useWallet";
// import { scorePool, riskNote } from "@/lib/risk";

// export default function Home() {
//   const { address } = useWallet();

//   const [goal, setGoal] = useState<"yield" | "safety">("yield");
//   const [minApy, setMinApy] = useState<number>(0);
//   const [scan, setScan] = useState<{ recommendations: any[]; message?: string }>({
//     recommendations: [],
//   });
//   const [loadingScan, setLoadingScan] = useState(false);
//   const [scanError, setScanError] = useState<string | null>(null);
//   const [hasScanned, setHasScanned] = useState(false);
//   const [buttonLabel, setButtonLabel] = useState("Apply Preferences");

//   // 🧠 Main unified handler (Apply + Refresh)
//   async function runScan() {
//     if (!address) {
//       setScan({
//         recommendations: [],
//         message: "Connect your wallet to view recommendations.",
//       });
//       return;
//     }

//     setLoadingScan(true);
//     setScanError(null);

//     try {
//       const res = await axios.post("/api/recommendations", { minApy, goal });
//       setScan({
//         recommendations: res.data.result || [],
//         message: res.data.message || undefined,
//       });
//       setHasScanned(true);
//       setButtonLabel("Refresh Recommendations");
//     } catch (err) {
//       console.error("Fetch error:", err);
//       setScanError("Failed to load recommendations. Please try again.");
//     } finally {
//       setLoadingScan(false);
//     }
//   }

//   // ⚙️ Update user preferences (reset scan state)
//   function handlePreferenceChange({
//     goal,
//     minApy,
//   }: {
//     goal: "yield" | "safety";
//     minApy: number;
//   }) {
//     setGoal(goal);
//     setMinApy(minApy);
//     setHasScanned(false);
//     setButtonLabel("Apply Preferences");
//   }

//   return (
//     <>
//       <div className="p-4">
//         <WalletConnect />
//       </div>

//       <div className="max-w-6xl mx-auto px-6 py-10 grid grid-cols-1 lg:grid-cols-4 gap-8">
//         {/* Sidebar */}
//         <aside className="lg:col-span-1 flex flex-col gap-6">
//           <div className="rounded-2xl p-5 glass">
//             <div className="text-xs text-zinc-400">Wallet</div>
//             <div className="text-sm font-medium break-words">
//               {address || "Not connected"}
//             </div>
//           </div>

//           <div className="rounded-2xl p-6 glass shadow-lg space-y-4">
//             <h3 className="text-lg font-semibold mb-2">Preferences</h3>
//             <Preferences value={{ goal, minApy }} onChange={handlePreferenceChange} />

//             {/* ✅ Unified button replaces Apply + Refresh */}
//             <div className="relative mt-3">
//               <AnimatePresence mode="wait">
//                 <motion.button
//                   key={buttonLabel}
//                   initial={{ opacity: 0, scale: 0.95 }}
//                   animate={{
//                     opacity: 1,
//                     scale: loadingScan ? [1, 1.05, 1] : 1,
//                     background: loadingScan
//                       ? [
//                         "linear-gradient(90deg, #0ea5e9, #2563eb, #0ea5e9)",
//                         "linear-gradient(90deg, #2563eb, #0ea5e9, #2563eb)",
//                       ]
//                       : "linear-gradient(90deg, #0ea5e9, #2563eb)",
//                   }}
//                   transition={{
//                     duration: loadingScan ? 2 : 0.3,
//                     repeat: loadingScan ? Infinity : 0,
//                     ease: "easeInOut",
//                   }}
//                   exit={{ opacity: 0, scale: 0.95 }}
//                   onClick={runScan}
//                   disabled={loadingScan || !address}
//                   className={`w-full px-4 py-2 rounded-lg text-sm font-medium text-white transition-all bg-gradient-to-r from-sky-500 to-blue-600 shadow-md ${loadingScan
//                       ? "cursor-wait"
//                       : !address
//                         ? "bg-zinc-800 text-zinc-500 cursor-not-allowed"
//                         : "hover:opacity-90"
//                     }`}
//                 >
//                   {loadingScan ? "Refreshing..." : buttonLabel}
//                 </motion.button>
//               </AnimatePresence>
//             </div>
//           </div>
//         </aside>

//         {/* Main Section */}
//         <section className="lg:col-span-3">
//           <div className="flex items-center justify-between mb-6">
//             <h2 className="text-2xl font-bold">Recommendations (Velar)</h2>
//             <span className="text-sm text-zinc-500">Top performing pools</span>
//           </div>

//           {scan?.message && (
//             <div className="mb-4 p-3 rounded-lg bg-blue-900/30 border border-blue-600 text-blue-200 text-sm">
//               {scan.message}
//             </div>
//           )}

//           {!address && (
//             <div className="text-zinc-400 text-center mt-10">
//               🔒 Connect your wallet to view recommendations.
//             </div>
//           )}

//           {address && loadingScan && (
//             <div className="text-zinc-400 text-center mt-10 animate-pulse">
//               Loading Velar pools...
//             </div>
//           )}

//           {scanError && (
//             <div className="text-red-400 text-center">{scanError}</div>
//           )}

//           {!loadingScan && address && scan.recommendations.length > 0 && (
//             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//               {scan.recommendations.map((p) => {
//                 const score = Math.round(scorePool(p, goal));
//                 const riskLabel =
//                   p.risk.charAt(0).toUpperCase() + p.risk.slice(1);
//                 const riskColor =
//                   p.risk === "low"
//                     ? "bg-green-600 text-green-50"
//                     : p.risk === "medium"
//                       ? "bg-yellow-600 text-yellow-50"
//                       : "bg-red-600 text-red-50";

//                 return (
//                   <article
//                     key={p.id}
//                     className="p-6 rounded-2xl border border-zinc-700 bg-zinc-900/70 backdrop-blur-md shadow-lg hover:border-sky-500/50 transition-all space-y-4"
//                   >
//                     <div className="flex items-start justify-between gap-3">
//                       <div>
//                         <div className="text-sm font-semibold">
//                           Velar <span className="text-zinc-400">•</span> {p.name}
//                         </div>
//                         <div className="text-xs text-zinc-500">
//                           Score: {score}/100
//                         </div>
//                       </div>
//                       <div className="text-right">
//                         <div className="text-2xl font-bold">
//                           {p.apy.toFixed(2)}%
//                         </div>
//                         <span
//                           className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs ${riskColor}`}
//                         >
//                           {riskLabel}
//                         </span>
//                       </div>
//                     </div>
//                     <div className="text-sm text-zinc-400">
//                       Matches your goal with APY ≤ {minApy}% — {riskNote(p)}
//                     </div>
//                     <div className="flex justify-between items-center">
//                       <a
//                         href={p.url}
//                         target="_blank"
//                         className="px-3 py-2 rounded-md border border-zinc-800 text-sm hover:bg-zinc-800/40"
//                       >
//                         Open on Velar
//                       </a>
//                       <RecordIntent address={address} poolId={p.id} />
//                     </div>
//                   </article>
//                 );
//               })}
//             </div>
//           )}

//           {!loadingScan && address && scan.recommendations.length === 0 && hasScanned && (
//             <div className="text-zinc-400 text-center">
//               No pools found for your filter.
//             </div>
//           )}
//         </section>
//       </div>
//     </>
//   );
// }



// "use client";

// import { useState } from "react";
// import axios from "axios";
// import { motion, AnimatePresence } from "framer-motion";
// import { Preferences } from "@/components/Preferences";
// import WalletConnect from "@/components/WalletConnect";
// import RecordIntent from "@/components/RecordIntent";
// import { useWallet } from "@/hooks/useWallet";
// import { scorePool, riskNote } from "@/lib/risk";

// export default function Home() {
//   const { address } = useWallet();

//   const [goal, setGoal] = useState<"yield" | "safety">("yield");
//   const [minApy, setMinApy] = useState<number>(0);
//   const [scan, setScan] = useState<{ recommendations: any[]; message?: string }>({
//     recommendations: [],
//   });
//   const [loadingScan, setLoadingScan] = useState(false);
//   const [scanError, setScanError] = useState<string | null>(null);
//   const [hasScanned, setHasScanned] = useState(false);
//   const [buttonLabel, setButtonLabel] = useState("Apply Preferences");

//   // 🔍 Fetch recommendations dynamically from Velar
//   async function runScan() {
//     if (!address) {
//       setScan({ recommendations: [], message: "Connect your wallet to view recommendations." });
//       return;
//     }

//     setLoadingScan(true);
//     setScanError(null);

//     try {
//       const res = await axios.post("/api/recommendations", { minApy, goal });
//       setScan({ recommendations: res.data.result || [], message: res.data.message });
//       setHasScanned(true);
//       setButtonLabel("Refresh Recommendations");
//     } catch (err) {
//       console.error("Fetch error:", err);
//       setScanError("Failed to load recommendations. Please try again.");
//     } finally {
//       setLoadingScan(false);
//     }
//   }

//   // ⚙️ Update preferences
//   function handlePreferenceChange({ goal, minApy }: { goal: "yield" | "safety"; minApy: number }) {
//     setGoal(goal);
//     setMinApy(minApy);
//     setHasScanned(false);
//     setButtonLabel("Apply Preferences");
//   }

//   return (
//     <>
//       <div className="p-4">
//         <WalletConnect />
//       </div>

//       <div className="max-w-6xl mx-auto px-6 py-10 grid grid-cols-1 lg:grid-cols-4 gap-8">
//         {/* Sidebar */}
//         <aside className="lg:col-span-1 flex flex-col gap-6">
//           <div className="rounded-2xl p-5 glass">
//             <div className="text-xs text-zinc-400">Wallet</div>
//             <div className="text-sm font-medium break-words">{address || "Not connected"}</div>
//           </div>

//           <div className="rounded-2xl p-6 glass shadow-lg space-y-4">
//             <h3 className="text-lg font-semibold mb-2">Preferences</h3>
//             <Preferences value={{ goal, minApy }} onChange={handlePreferenceChange} />

//             {/* Unified Button */}
//             <div className="relative mt-3">
//               <AnimatePresence mode="wait">
//                 <motion.button
//                   key={buttonLabel}
//                   initial={{ opacity: 0, scale: 0.95 }}
//                   animate={{
//                     opacity: 1,
//                     scale: loadingScan ? [1, 1.05, 1] : 1,
//                     background: loadingScan
//                       ? [
//                         "linear-gradient(90deg, #0ea5e9, #2563eb, #0ea5e9)",
//                         "linear-gradient(90deg, #2563eb, #0ea5e9, #2563eb)",
//                       ]
//                       : "linear-gradient(90deg, #0ea5e9, #2563eb)",
//                   }}
//                   transition={{
//                     duration: loadingScan ? 2 : 0.3,
//                     repeat: loadingScan ? Infinity : 0,
//                     ease: "easeInOut",
//                   }}
//                   exit={{ opacity: 0, scale: 0.95 }}
//                   onClick={runScan}
//                   disabled={loadingScan || !address}
//                   className={`w-full px-4 py-2 rounded-lg text-sm font-medium text-white transition-all bg-gradient-to-r from-sky-500 to-blue-600 shadow-md ${loadingScan
//                     ? "cursor-wait"
//                     : !address
//                       ? "bg-zinc-800 text-zinc-500 cursor-not-allowed"
//                       : "hover:opacity-90"
//                     }`}
//                 >
//                   {loadingScan ? "Refreshing..." : buttonLabel}
//                 </motion.button>
//               </AnimatePresence>
//             </div>
//           </div>
//         </aside>

//         {/* Main Section */}
//         <section className="lg:col-span-3">
//           <div className="flex items-center justify-between mb-6">
//             <h2 className="text-2xl font-bold">Recommendations (Velar)</h2>
//             <span className="text-sm text-zinc-500">Top performing pools</span>
//           </div>

//           {scan?.message && (
//             <div className="mb-4 p-3 rounded-lg bg-blue-900/30 border border-blue-600 text-blue-200 text-sm">
//               {scan.message}
//             </div>
//           )}

//           {!address && (
//             <div className="text-zinc-400 text-center mt-10">
//               🔒 Connect your wallet to view recommendations.
//             </div>
//           )}

//           {address && loadingScan && (
//             <div className="text-zinc-400 text-center mt-10 animate-pulse">
//               Loading Velar pools...
//             </div>
//           )}

//           {scanError && <div className="text-red-400 text-center">{scanError}</div>}

//           {!loadingScan && address && scan.recommendations.length > 0 && (
//             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//               {scan.recommendations.map((p) => {
//                 const score = Math.round(scorePool(p, goal));
//                 const riskLabel = p.risk.charAt(0).toUpperCase() + p.risk.slice(1);
//                 const riskColor =
//                   p.risk === "low"
//                     ? "bg-green-600 text-green-50"
//                     : p.risk === "medium"
//                       ? "bg-yellow-600 text-yellow-50"
//                       : "bg-red-600 text-red-50";

//                 return (
//                   <article
//                     key={p.id}
//                     className="p-6 rounded-2xl border border-zinc-700 bg-zinc-900/70 backdrop-blur-md shadow-lg hover:border-sky-500/50 transition-all space-y-4"
//                   >
//                     <div className="flex items-start justify-between gap-3">
//                       <div>
//                         <div className="text-sm font-semibold">
//                           Velar <span className="text-zinc-400">•</span> {p.name}
//                         </div>
//                         <div className="text-xs text-zinc-500">Score: {score}/100</div>
//                       </div>
//                       <div className="text-right">
//                         <div className="text-2xl font-bold">{p.apy.toFixed(2)}%</div>
//                         <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs ${riskColor}`}>
//                           {riskLabel}
//                         </span>
//                       </div>
//                     </div>
//                     <div className="text-sm text-zinc-400">
//                       Matches your goal with APY ≤ {minApy}% — {riskNote(p)}
//                     </div>
//                     <div className="flex justify-between items-center">
//                       <a
//                         href={p.url}
//                         target="_blank"
//                         className="px-3 py-2 rounded-md border border-zinc-800 text-sm hover:bg-zinc-800/40"
//                       >
//                         Open on Velar
//                       </a>
//                       <RecordIntent address={address} poolId={p.id} />
//                     </div>
//                   </article>
//                 );
//               })}
//             </div>
//           )}

//           {!loadingScan && address && scan.recommendations.length === 0 && hasScanned && (
//             <div className="text-zinc-400 text-center">No pools found for your filter.</div>
//           )}
//         </section>
//       </div>
//     </>
//   );
// }



// "use client";

// import { useState } from "react";
// import axios from "axios";
// import { motion, AnimatePresence } from "framer-motion";
// import { Preferences } from "@/components/Preferences";
// import WalletConnect from "@/components/WalletConnect";
// import RecordIntent from "@/components/RecordIntent";
// import { useWallet } from "@/hooks/useWallet";
// import { scorePool, riskNote } from "@/lib/risk";

// export default function Home() {
//   const { address } = useWallet();

//   const [goal, setGoal] = useState<"yield" | "safety">("yield");
//   const [minApy, setMinApy] = useState<number>(0);
//   const [scan, setScan] = useState<{ recommendations: any[]; message?: string }>({
//     recommendations: [],
//   });
//   const [loadingScan, setLoadingScan] = useState(false);
//   const [scanError, setScanError] = useState<string | null>(null);
//   const [hasScanned, setHasScanned] = useState(false);
//   const [buttonLabel, setButtonLabel] = useState("Apply Preferences");

//   // 🧠 Fetch Velar pools dynamically
//   async function runScan() {
//     if (!address) {
//       setScan({ recommendations: [], message: "Connect your wallet to view recommendations." });
//       return;
//     }

//     setLoadingScan(true);
//     setScanError(null);

//     try {
//       const res = await axios.post("/api/recommendations", { minApy, goal });
//       setScan({ recommendations: res.data.result || [], message: res.data.message });
//       setHasScanned(true);
//       setButtonLabel("Refresh Recommendations");
//     } catch (err) {
//       console.error("Fetch error:", err);
//       setScanError("Failed to load recommendations. Please try again.");
//     } finally {
//       setLoadingScan(false);
//     }
//   }

//   // 🧩 Reset label when preferences change
//   function handlePreferenceChange({ goal, minApy }: { goal: "yield" | "safety"; minApy: number }) {
//     setGoal(goal);
//     setMinApy(minApy);
//     setHasScanned(false);
//     setButtonLabel("Apply Preferences");
//   }

//   return (
//     <>
//       <div className="p-4">
//         <WalletConnect />
//       </div>

//       <div className="max-w-6xl mx-auto px-6 py-10 grid grid-cols-1 lg:grid-cols-4 gap-8">
//         {/* Sidebar */}
//         <aside className="lg:col-span-1 flex flex-col gap-6">
//           <div className="rounded-2xl p-5 glass">
//             <div className="text-xs text-zinc-400">Wallet</div>
//             <div className="text-sm font-medium break-words">{address || "Not connected"}</div>
//           </div>

//           <div className="rounded-2xl p-6 glass shadow-lg space-y-4">
//             <h3 className="text-lg font-semibold mb-2">Preferences</h3>
//             <Preferences value={{ goal, minApy }} onChange={handlePreferenceChange} />

//             <div className="relative mt-3">
//               <AnimatePresence mode="wait">
//                 <motion.button
//                   key={buttonLabel}
//                   initial={{ opacity: 0, scale: 0.95 }}
//                   animate={{
//                     opacity: 1,
//                     scale: loadingScan ? [1, 1.03, 1] : 1, // ✨ Pulse effect while loading
//                   }}
//                   transition={{
//                     duration: loadingScan ? 1.2 : 0.25,
//                     repeat: loadingScan ? Infinity : 0,
//                     ease: "easeInOut",
//                   }}
//                   exit={{ opacity: 0, scale: 0.95 }}
//                   onClick={runScan}
//                   disabled={loadingScan || !address}
//                   className={`w-full px-4 py-2 rounded-lg text-sm font-medium transition-colors ${loadingScan
//                       ? "bg-sky-700/80 text-white cursor-wait"
//                       : !address
//                         ? "bg-zinc-800 text-zinc-500 cursor-not-allowed"
//                         : "bg-gradient-to-r from-sky-500 to-blue-600 hover:opacity-90 text-white"
//                     }`}
//                 >
//                   {loadingScan ? "Refreshing..." : buttonLabel}
//                 </motion.button>
//               </AnimatePresence>
//             </div>
//           </div>
//         </aside>

//         {/* Main Section */}
//         <section className="lg:col-span-3">
//           <div className="flex items-center justify-between mb-6">
//             <h2 className="text-2xl font-bold">Recommendations (Velar)</h2>
//             <span className="text-sm text-zinc-500">Top performing pools</span>
//           </div>

//           {scan?.message && (
//             <div className="mb-4 p-3 rounded-lg bg-blue-900/30 border border-blue-600 text-blue-200 text-sm">
//               {scan.message}
//             </div>
//           )}

//           {!address && (
//             <div className="text-zinc-400 text-center mt-10">
//               🔒 Connect your wallet to view recommendations.
//             </div>
//           )}

//           {address && loadingScan && <div className="text-zinc-400">Loading Velar pools...</div>}
//           {scanError && <div className="text-red-400">{scanError}</div>}

//           {!loadingScan && address && scan.recommendations.length > 0 && (
//             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//               {scan.recommendations.map((p) => {
//                 const score = Math.round(scorePool(p, goal));
//                 const riskLabel = p.risk.charAt(0).toUpperCase() + p.risk.slice(1);
//                 const riskColor =
//                   p.risk === "low"
//                     ? "bg-green-600 text-green-50"
//                     : p.risk === "medium"
//                       ? "bg-yellow-600 text-yellow-50"
//                       : "bg-red-600 text-red-50";

//                 return (
//                   <article
//                     key={p.id}
//                     className="p-6 rounded-2xl border border-zinc-700 bg-zinc-900/70 backdrop-blur-md shadow-lg hover:border-sky-500/50 transition-all space-y-4"
//                   >
//                     <div className="flex items-start justify-between gap-3">
//                       <div>
//                         <div className="text-sm font-semibold">
//                           Velar <span className="text-zinc-400">•</span> {p.name}
//                         </div>
//                         <div className="text-xs text-zinc-500">Score: {score}/100</div>
//                       </div>
//                       <div className="text-right">
//                         <div className="text-2xl font-bold">{p.apy.toFixed(2)}%</div>
//                         <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs ${riskColor}`}>
//                           {riskLabel}
//                         </span>
//                       </div>
//                     </div>
//                     <div className="text-sm text-zinc-400">
//                       Matches your goal with APY ≤ {minApy}% — {riskNote(p)}
//                     </div>
//                     <div className="flex justify-between items-center">
//                       <a
//                         href={p.url}
//                         target="_blank"
//                         className="px-3 py-2 rounded-md border border-zinc-800 text-sm hover:bg-zinc-800/40"
//                       >
//                         Open on Velar
//                       </a>
//                       <RecordIntent address={address} poolId={p.id} />
//                     </div>
//                   </article>
//                 );
//               })}
//             </div>
//           )}

//           {!loadingScan && address && scan.recommendations.length === 0 && hasScanned && (
//             <div className="text-zinc-400">No pools found for your filter.</div>
//           )}
//         </section>
//       </div>
//     </>
//   );
// }



// "use client";

// import { useState } from "react";
// import axios from "axios";
// import { motion, AnimatePresence } from "framer-motion";
// import { Preferences } from "@/components/Preferences";
// import WalletConnect from "@/components/WalletConnect";
// import RecordIntent from "@/components/RecordIntent";
// import { useWallet } from "@/hooks/useWallet";
// import { scorePool, riskNote } from "@/lib/risk";

// export default function Home() {
//   const { address } = useWallet();

//   const [goal, setGoal] = useState<"yield" | "safety">("yield");
//   const [minApy, setMinApy] = useState<number>(0);
//   const [scan, setScan] = useState<{ recommendations: any[]; message?: string }>({
//     recommendations: [],
//   });
//   const [loadingScan, setLoadingScan] = useState(false);
//   const [scanError, setScanError] = useState<string | null>(null);
//   const [hasScanned, setHasScanned] = useState(false);
//   const [buttonLabel, setButtonLabel] = useState("Apply Preferences");

//   // 🧠 Fetch Velar pools dynamically
//   async function runScan() {
//     if (!address) {
//       setScan({ recommendations: [], message: "Connect your wallet to view recommendations." });
//       return;
//     }

//     setLoadingScan(true);
//     setScanError(null);

//     try {
//       const res = await axios.post("/api/recommendations", { minApy, goal });
//       setScan({ recommendations: res.data.result || [], message: res.data.message });
//       setHasScanned(true);
//       setButtonLabel("Refresh Recommendations");
//     } catch (err) {
//       console.error("Fetch error:", err);
//       setScanError("Failed to load recommendations. Please try again.");
//     } finally {
//       setLoadingScan(false);
//     }
//   }

//   // 🧩 Reset label when preferences change
//   function handlePreferenceChange({ goal, minApy }: { goal: "yield" | "safety"; minApy: number }) {
//     setGoal(goal);
//     setMinApy(minApy);
//     setHasScanned(false);
//     setButtonLabel("Apply Preferences");
//   }

//   return (
//     <>
//       <div className="p-4">
//         <WalletConnect />
//       </div>

//       <div className="max-w-6xl mx-auto px-6 py-10 grid grid-cols-1 lg:grid-cols-4 gap-8">
//         {/* Sidebar */}
//         <aside className="lg:col-span-1 flex flex-col gap-6">
//           <div className="rounded-2xl p-5 glass">
//             <div className="text-xs text-zinc-400">Wallet</div>
//             <div className="text-sm font-medium break-words">{address || "Not connected"}</div>
//           </div>

//           <div className="rounded-2xl p-6 glass shadow-lg space-y-4">
//             <h3 className="text-lg font-semibold mb-2">Preferences</h3>
//             <Preferences value={{ goal, minApy }} onChange={handlePreferenceChange} />

//             <div className="relative mt-3">
//               <AnimatePresence mode="wait">
//                 <motion.button
//                   key={buttonLabel} // animate on label change
//                   initial={{ opacity: 0, scale: 0.95 }}
//                   animate={{ opacity: 1, scale: 1 }}
//                   exit={{ opacity: 0, scale: 0.95 }}
//                   transition={{ duration: 0.25 }}
//                   onClick={runScan}
//                   disabled={loadingScan || !address}
//                   className={`w-full px-4 py-2 rounded-lg text-sm font-medium transition-colors ${loadingScan
//                       ? "bg-zinc-700 cursor-wait text-zinc-400"
//                       : !address
//                         ? "bg-zinc-800 text-zinc-500 cursor-not-allowed"
//                         : "bg-gradient-to-r from-sky-500 to-blue-600 hover:opacity-90 text-white"
//                     }`}
//                 >
//                   {loadingScan ? "Refreshing..." : buttonLabel}
//                 </motion.button>
//               </AnimatePresence>
//             </div>
//           </div>
//         </aside>

//         {/* Main Section */}
//         <section className="lg:col-span-3">
//           <div className="flex items-center justify-between mb-6">
//             <h2 className="text-2xl font-bold">Recommendations (Velar)</h2>
//             <span className="text-sm text-zinc-500">Top performing pools</span>
//           </div>

//           {scan?.message && (
//             <div className="mb-4 p-3 rounded-lg bg-blue-900/30 border border-blue-600 text-blue-200 text-sm">
//               {scan.message}
//             </div>
//           )}

//           {!address && (
//             <div className="text-zinc-400 text-center mt-10">
//               🔒 Connect your wallet to view recommendations.
//             </div>
//           )}

//           {address && loadingScan && <div className="text-zinc-400">Loading Velar pools...</div>}
//           {scanError && <div className="text-red-400">{scanError}</div>}

//           {!loadingScan && address && scan.recommendations.length > 0 && (
//             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//               {scan.recommendations.map((p) => {
//                 const score = Math.round(scorePool(p, goal));
//                 const riskLabel = p.risk.charAt(0).toUpperCase() + p.risk.slice(1);
//                 const riskColor =
//                   p.risk === "low"
//                     ? "bg-green-600 text-green-50"
//                     : p.risk === "medium"
//                       ? "bg-yellow-600 text-yellow-50"
//                       : "bg-red-600 text-red-50";

//                 return (
//                   <article
//                     key={p.id}
//                     className="p-6 rounded-2xl border border-zinc-700 bg-zinc-900/70 backdrop-blur-md shadow-lg hover:border-sky-500/50 transition-all space-y-4"
//                   >
//                     <div className="flex items-start justify-between gap-3">
//                       <div>
//                         <div className="text-sm font-semibold">
//                           Velar <span className="text-zinc-400">•</span> {p.name}
//                         </div>
//                         <div className="text-xs text-zinc-500">Score: {score}/100</div>
//                       </div>
//                       <div className="text-right">
//                         <div className="text-2xl font-bold">{p.apy.toFixed(2)}%</div>
//                         <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs ${riskColor}`}>
//                           {riskLabel}
//                         </span>
//                       </div>
//                     </div>
//                     <div className="text-sm text-zinc-400">
//                       Matches your goal with APY ≤ {minApy}% — {riskNote(p)}
//                     </div>
//                     <div className="flex justify-between items-center">
//                       <a
//                         href={p.url}
//                         target="_blank"
//                         className="px-3 py-2 rounded-md border border-zinc-800 text-sm hover:bg-zinc-800/40"
//                       >
//                         Open on Velar
//                       </a>
//                       <RecordIntent address={address} poolId={p.id} />
//                     </div>
//                   </article>
//                 );
//               })}
//             </div>
//           )}

//           {!loadingScan && address && scan.recommendations.length === 0 && hasScanned && (
//             <div className="text-zinc-400">No pools found for your filter.</div>
//           )}
//         </section>
//       </div>
//     </>
//   );
// }




// "use client";

// import { useState } from "react";
// import axios from "axios";
// import { Preferences } from "@/components/Preferences";
// import WalletConnect from "@/components/WalletConnect";
// import RecordIntent from "@/components/RecordIntent";
// import { useWallet } from "@/hooks/useWallet";
// import { scorePool, riskNote } from "@/lib/risk";

// export default function Home() {
//   const { address } = useWallet();

//   const [goal, setGoal] = useState<"yield" | "safety">("yield");
//   const [minApy, setMinApy] = useState<number>(0);
//   const [scan, setScan] = useState<{ recommendations: any[]; message?: string }>({
//     recommendations: [],
//   });
//   const [loadingScan, setLoadingScan] = useState(false);
//   const [scanError, setScanError] = useState<string | null>(null);
//   const [hasScanned, setHasScanned] = useState(false);
//   const [buttonLabel, setButtonLabel] = useState("Apply Preferences");

//   // ✅ Fetch Velar recommendations
//   async function runScan() {
//     if (!address) {
//       setScan({ recommendations: [], message: "Connect your wallet to view recommendations." });
//       return;
//     }

//     setLoadingScan(true);
//     setScanError(null);

//     try {
//       const res = await axios.post("/api/recommendations", { minApy, goal });
//       setScan({ recommendations: res.data.result || [], message: res.data.message });
//       setHasScanned(true);
//       setButtonLabel("Refresh Recommendations");
//     } catch (err) {
//       console.error("Fetch error:", err);
//       setScanError("Failed to load recommendations. Please try again.");
//     } finally {
//       setLoadingScan(false);
//     }
//   }

//   // ✅ Reset button when preferences change
//   function handlePreferenceChange({ goal, minApy }: { goal: "yield" | "safety"; minApy: number }) {
//     setGoal(goal);
//     setMinApy(minApy);
//     setHasScanned(false);
//     setButtonLabel("Apply Preferences");
//   }

//   return (
//     <>
//       <div className="p-4">
//         <WalletConnect />
//       </div>

//       <div className="max-w-6xl mx-auto px-6 py-10 grid grid-cols-1 lg:grid-cols-4 gap-8">
//         {/* Sidebar */}
//         <aside className="lg:col-span-1 flex flex-col gap-6">
//           <div className="rounded-2xl p-5 glass">
//             <div className="text-xs text-zinc-400">Wallet</div>
//             <div className="text-sm font-medium break-words">{address || "Not connected"}</div>
//           </div>

//           <div className="rounded-2xl p-6 glass shadow-lg space-y-4">
//             <h3 className="text-lg font-semibold mb-2">Preferences</h3>
//             <Preferences value={{ goal, minApy }} onChange={handlePreferenceChange} />

//             <button
//               onClick={runScan}
//               disabled={loadingScan || !address}
//               className={`w-full mt-3 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${loadingScan
//                   ? "bg-zinc-700 cursor-wait text-zinc-400"
//                   : !address
//                     ? "bg-zinc-800 text-zinc-500 cursor-not-allowed"
//                     : "bg-gradient-to-r from-sky-500 to-blue-600 hover:opacity-90 text-white"
//                 }`}
//             >
//               {loadingScan ? "Refreshing..." : buttonLabel}
//             </button>
//           </div>
//         </aside>

//         {/* Main Section */}
//         <section className="lg:col-span-3">
//           <div className="flex items-center justify-between mb-6">
//             <h2 className="text-2xl font-bold">Recommendations (Velar)</h2>
//             <span className="text-sm text-zinc-500">Top performing pools</span>
//           </div>

//           {scan?.message && (
//             <div className="mb-4 p-3 rounded-lg bg-blue-900/30 border border-blue-600 text-blue-200 text-sm">
//               {scan.message}
//             </div>
//           )}

//           {!address && (
//             <div className="text-zinc-400 text-center mt-10">
//               🔒 Connect your wallet to view recommendations.
//             </div>
//           )}

//           {address && loadingScan && <div className="text-zinc-400">Loading Velar pools...</div>}
//           {scanError && <div className="text-red-400">{scanError}</div>}

//           {!loadingScan && address && scan.recommendations.length > 0 && (
//             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//               {scan.recommendations.map((p) => {
//                 const score = Math.round(scorePool(p, goal));
//                 const riskLabel = p.risk.charAt(0).toUpperCase() + p.risk.slice(1);
//                 const riskColor =
//                   p.risk === "low"
//                     ? "bg-green-600 text-green-50"
//                     : p.risk === "medium"
//                       ? "bg-yellow-600 text-yellow-50"
//                       : "bg-red-600 text-red-50";

//                 return (
//                   <article
//                     key={p.id}
//                     className="p-6 rounded-2xl border border-zinc-700 bg-zinc-900/70 backdrop-blur-md shadow-lg hover:border-sky-500/50 transition-all space-y-4"
//                   >
//                     <div className="flex items-start justify-between gap-3">
//                       <div>
//                         <div className="text-sm font-semibold">
//                           Velar <span className="text-zinc-400">•</span> {p.name}
//                         </div>
//                         <div className="text-xs text-zinc-500">Score: {score}/100</div>
//                       </div>
//                       <div className="text-right">
//                         <div className="text-2xl font-bold">{p.apy.toFixed(2)}%</div>
//                         <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs ${riskColor}`}>
//                           {riskLabel}
//                         </span>
//                       </div>
//                     </div>
//                     <div className="text-sm text-zinc-400">
//                       Matches your goal with APY ≤ {minApy}% — {riskNote(p)}
//                     </div>
//                     <div className="flex justify-between items-center">
//                       <a
//                         href={p.url}
//                         target="_blank"
//                         className="px-3 py-2 rounded-md border border-zinc-800 text-sm hover:bg-zinc-800/40"
//                       >
//                         Open on Velar
//                       </a>
//                       <RecordIntent address={address} poolId={p.id} />
//                     </div>
//                   </article>
//                 );
//               })}
//             </div>
//           )}

//           {!loadingScan && address && scan.recommendations.length === 0 && hasScanned && (
//             <div className="text-zinc-400">No pools found for your filter.</div>
//           )}
//         </section>
//       </div>
//     </>
//   );
// }



// "use client";

// import { useState } from "react";
// import axios from "axios";
// import { Preferences } from "@/components/Preferences";
// import WalletConnect from "@/components/WalletConnect";
// import RecordIntent from "@/components/RecordIntent";
// import { useWallet } from "@/hooks/useWallet";
// import { scorePool, riskNote } from "@/lib/risk";

// export default function Home() {
//   const { address } = useWallet();

//   const [goal, setGoal] = useState<"yield" | "safety">("yield");
//   const [minApy, setMinApy] = useState<number>(0);
//   const [scan, setScan] = useState<{ recommendations: any[]; message?: string }>({
//     recommendations: [],
//   });
//   const [loadingScan, setLoadingScan] = useState(false);
//   const [scanError, setScanError] = useState<string | null>(null);
//   const [hasScanned, setHasScanned] = useState(false);

//   // ✅ Fetch Velar recommendations when user applies preferences
//   async function runScan() {
//     if (!address) {
//       setScan({ recommendations: [], message: "Connect your wallet to view recommendations." });
//       return;
//     }

//     setLoadingScan(true);
//     setScanError(null);

//     try {
//       const res = await axios.post("/api/recommendations", { minApy, goal });
//       setScan({ recommendations: res.data.result || [], message: res.data.message });
//       setHasScanned(true);
//     } catch (err) {
//       console.error("Fetch error:", err);
//       setScanError("Failed to load recommendations. Please try again.");
//     } finally {
//       setLoadingScan(false);
//     }
//   }

//   return (
//     <>
//       <div className="p-4">
//         <WalletConnect />
//       </div>

//       <div className="max-w-6xl mx-auto px-6 py-10 grid grid-cols-1 lg:grid-cols-4 gap-8">
//         {/* Sidebar */}
//         <aside className="lg:col-span-1 flex flex-col gap-6">
//           <div className="rounded-2xl p-5 glass">
//             <div className="text-xs text-zinc-400">Wallet</div>
//             <div className="text-sm font-medium break-words">{address || "Not connected"}</div>
//           </div>

//           <div className="rounded-2xl p-6 glass shadow-lg space-y-4">
//             <h3 className="text-lg font-semibold mb-2">Preferences</h3>
//             <Preferences
//               value={{ goal, minApy }}
//               onChange={({ goal, minApy }) => {
//                 setGoal(goal);
//                 setMinApy(minApy);
//               }}
//             />

//             <button
//               onClick={runScan}
//               disabled={loadingScan || !address}
//               className={`w-full mt-3 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${loadingScan
//                   ? "bg-zinc-700 cursor-wait text-zinc-400"
//                   : !address
//                     ? "bg-zinc-800 text-zinc-500 cursor-not-allowed"
//                     : "bg-gradient-to-r from-sky-500 to-blue-600 hover:opacity-90 text-white"
//                 }`}
//             >
//               {loadingScan
//                 ? "Refreshing..."
//                 : hasScanned
//                   ? "Refresh Recommendations"
//                   : "Apply Preferences"}
//             </button>
//           </div>
//         </aside>

//         {/* Main Section */}
//         <section className="lg:col-span-3">
//           <div className="flex items-center justify-between mb-6">
//             <h2 className="text-2xl font-bold">Recommendations (Velar)</h2>
//             <span className="text-sm text-zinc-500">Top performing pools</span>
//           </div>

//           {scan?.message && (
//             <div className="mb-4 p-3 rounded-lg bg-blue-900/30 border border-blue-600 text-blue-200 text-sm">
//               {scan.message}
//             </div>
//           )}

//           {!address && (
//             <div className="text-zinc-400 text-center mt-10">
//               🔒 Connect your wallet to view recommendations.
//             </div>
//           )}

//           {address && loadingScan && <div className="text-zinc-400">Loading Velar pools...</div>}
//           {scanError && <div className="text-red-400">{scanError}</div>}

//           {!loadingScan && address && scan.recommendations.length > 0 && (
//             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//               {scan.recommendations.map((p) => {
//                 const score = Math.round(scorePool(p, goal));
//                 const riskLabel = p.risk.charAt(0).toUpperCase() + p.risk.slice(1);
//                 const riskColor =
//                   p.risk === "low"
//                     ? "bg-green-600 text-green-50"
//                     : p.risk === "medium"
//                       ? "bg-yellow-600 text-yellow-50"
//                       : "bg-red-600 text-red-50";

//                 return (
//                   <article
//                     key={p.id}
//                     className="p-6 rounded-2xl border border-zinc-700 bg-zinc-900/70 backdrop-blur-md shadow-lg hover:border-sky-500/50 transition-all space-y-4"
//                   >
//                     <div className="flex items-start justify-between gap-3">
//                       <div>
//                         <div className="text-sm font-semibold">
//                           Velar <span className="text-zinc-400">•</span> {p.name}
//                         </div>
//                         <div className="text-xs text-zinc-500">Score: {score}/100</div>
//                       </div>
//                       <div className="text-right">
//                         <div className="text-2xl font-bold">{p.apy.toFixed(2)}%</div>
//                         <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs ${riskColor}`}>
//                           {riskLabel}
//                         </span>
//                       </div>
//                     </div>
//                     <div className="text-sm text-zinc-400">
//                       Matches your goal with APY ≤ {minApy}% — {riskNote(p)}
//                     </div>
//                     <div className="flex justify-between items-center">
//                       <a
//                         href={p.url}
//                         target="_blank"
//                         className="px-3 py-2 rounded-md border border-zinc-800 text-sm hover:bg-zinc-800/40"
//                       >
//                         Open on Velar
//                       </a>
//                       <RecordIntent address={address} poolId={p.id} />
//                     </div>
//                   </article>
//                 );
//               })}
//             </div>
//           )}

//           {!loadingScan && address && scan.recommendations.length === 0 && hasScanned && (
//             <div className="text-zinc-400">No pools found for your filter.</div>
//           )}
//         </section>
//       </div>
//     </>
//   );
// }



// "use client";

// import { useState } from "react";
// import axios from "axios";
// import { Preferences } from "@/components/Preferences";
// import WalletConnect from "@/components/WalletConnect";
// import RecordIntent from "@/components/RecordIntent";
// import { useWallet } from "@/hooks/useWallet";
// import { scorePool, riskNote } from "@/lib/risk";

// export default function Home() {
//   const { address } = useWallet();

//   const [goal, setGoal] = useState<"yield" | "safety">("yield");
//   const [minApy, setMinApy] = useState<number>(0);
//   const [scan, setScan] = useState<{ recommendations: any[]; message?: string }>({
//     recommendations: [],
//   });
//   const [loadingScan, setLoadingScan] = useState(false);
//   const [scanError, setScanError] = useState<string | null>(null);

//   // ✅ Fetch Velar recommendations only when user clicks refresh
//   async function runScan() {
//     if (!address) {
//       setScan({ recommendations: [], message: "Connect your wallet to view recommendations." });
//       return;
//     }

//     setLoadingScan(true);
//     setScanError(null);

//     try {
//       const res = await axios.post("/api/recommendations", { minApy, goal });
//       setScan({ recommendations: res.data.result || [], message: res.data.message });
//     } catch (err) {
//       console.error("Fetch error:", err);
//       setScanError("Failed to load recommendations. Please try again.");
//     } finally {
//       setLoadingScan(false);
//     }
//   }

//   return (
//     <>
//       <div className="p-4">
//         <WalletConnect />
//       </div>

//       <div className="max-w-6xl mx-auto px-6 py-10 grid grid-cols-1 lg:grid-cols-4 gap-8">
//         {/* Sidebar */}
//         <aside className="lg:col-span-1 flex flex-col gap-6">
//           <div className="rounded-2xl p-5 glass">
//             <div className="text-xs text-zinc-400">Wallet</div>
//             <div className="text-sm font-medium break-words">{address || "Not connected"}</div>
//           </div>

//           <div className="rounded-2xl p-6 glass shadow-lg space-y-4">
//             <h3 className="text-lg font-semibold mb-2">Preferences</h3>
//             <Preferences
//               value={{ goal, minApy }}
//               onChange={({ goal, minApy }) => {
//                 setGoal(goal);
//                 setMinApy(minApy);
//               }}
//             />

//             <button
//               onClick={runScan}
//               disabled={loadingScan || !address}
//               className={`w-full mt-3 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${loadingScan
//                   ? "bg-zinc-700 cursor-wait text-zinc-400"
//                   : !address
//                     ? "bg-zinc-800 text-zinc-500 cursor-not-allowed"
//                     : "bg-gradient-to-r from-sky-500 to-blue-600 hover:opacity-90 text-white"
//                 }`}
//             >
//               {loadingScan ? "Refreshing..." : "Refresh Recommendations"}
//             </button>
//           </div>
//         </aside>

//         {/* Main Section */}
//         <section className="lg:col-span-3">
//           <div className="flex items-center justify-between mb-6">
//             <h2 className="text-2xl font-bold">Recommendations (Velar)</h2>
//             <span className="text-sm text-zinc-500">Top performing pools</span>
//           </div>

//           {scan?.message && (
//             <div className="mb-4 p-3 rounded-lg bg-blue-900/30 border border-blue-600 text-blue-200 text-sm">
//               {scan.message}
//             </div>
//           )}

//           {!address && (
//             <div className="text-zinc-400 text-center mt-10">
//               🔒 Connect your wallet to view recommendations.
//             </div>
//           )}

//           {address && loadingScan && <div className="text-zinc-400">Loading Velar pools...</div>}
//           {scanError && <div className="text-red-400">{scanError}</div>}

//           {!loadingScan && address && scan.recommendations.length > 0 && (
//             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//               {scan.recommendations.map((p) => {
//                 const score = Math.round(scorePool(p, goal));
//                 const riskLabel = p.risk.charAt(0).toUpperCase() + p.risk.slice(1);
//                 const riskColor =
//                   p.risk === "low"
//                     ? "bg-green-600 text-green-50"
//                     : p.risk === "medium"
//                       ? "bg-yellow-600 text-yellow-50"
//                       : "bg-red-600 text-red-50";

//                 return (
//                   <article
//                     key={p.id}
//                     className="p-6 rounded-2xl border border-zinc-700 bg-zinc-900/70 backdrop-blur-md shadow-lg hover:border-sky-500/50 transition-all space-y-4"
//                   >
//                     <div className="flex items-start justify-between gap-3">
//                       <div>
//                         <div className="text-sm font-semibold">
//                           Velar <span className="text-zinc-400">•</span> {p.name}
//                         </div>
//                         <div className="text-xs text-zinc-500">Score: {score}/100</div>
//                       </div>
//                       <div className="text-right">
//                         <div className="text-2xl font-bold">{p.apy.toFixed(2)}%</div>
//                         <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs ${riskColor}`}>
//                           {riskLabel}
//                         </span>
//                       </div>
//                     </div>
//                     <div className="text-sm text-zinc-400">
//                       Matches your goal with APY ≤ {minApy}% — {riskNote(p)}
//                     </div>
//                     <div className="flex justify-between items-center">
//                       <a
//                         href={p.url}
//                         target="_blank"
//                         className="px-3 py-2 rounded-md border border-zinc-800 text-sm hover:bg-zinc-800/40"
//                       >
//                         Open on Velar
//                       </a>
//                       <RecordIntent address={address} poolId={p.id} />
//                     </div>
//                   </article>
//                 );
//               })}
//             </div>
//           )}

//           {!loadingScan && address && scan.recommendations.length === 0 && (
//             <div className="text-zinc-400">No pools found for your filter.</div>
//           )}
//         </section>
//       </div>
//     </>
//   );
// }




// "use client";

// import { useState, useEffect } from "react";
// import axios from "axios";
// import { Preferences } from "@/components/Preferences";
// import WalletConnect from "@/components/WalletConnect";
// import { getHiroApiBase } from "@/lib/stacks";
// import { scorePool, riskNote } from "@/lib/risk";
// import type { Goal } from "@/components/Preferences";
// import RecordIntent from "@/components/RecordIntent";
// import GroqLLMDemo from "@/components/GroqLLMDemo";
// import { useWallet } from "@/hooks/useWallet";

// export default function Home() {
//   const { address } = useWallet();

//   const [goal, setGoal] = useState<Goal>("yield");
//   const [minApy, setMinApy] = useState<number>(0);
//   const [scan, setScan] = useState<{ recommendations: any[]; message?: string }>({ recommendations: [] });
//   const [loadingScan, setLoadingScan] = useState(false);
//   const [scanError, setScanError] = useState<string | null>(null);

//   // ✅ Fetch Velar recommendations only when wallet is connected
//   async function runScan() {
//     if (!address) {
//       setScan({ recommendations: [], message: "Connect your wallet to see recommendations." });
//       return;
//     }

//     setLoadingScan(true);
//     setScanError(null);

//     try {
//       const res = await axios.post("/api/recommendations", { minApy, goal });
//       setScan({ recommendations: res.data.result || [], message: res.data.message });
//     } catch (err) {
//       console.error("Fetch error:", err);
//       setScanError("Failed to load recommendations. Please try again.");
//     } finally {
//       setLoadingScan(false);
//     }
//   }

//   useEffect(() => {
//     if (address) runScan();
//   }, [goal, minApy, address]);

//   return (
//     <>
//       <div className="p-4">
//         <WalletConnect />
//       </div>

//       <div className="max-w-6xl mx-auto px-6 py-10 grid grid-cols-1 lg:grid-cols-4 gap-8">
//         <aside className="lg:col-span-1 flex flex-col gap-6">
//           <div className="rounded-2xl p-5 glass">
//             <div className="text-xs text-zinc-400">Wallet</div>
//             <div className="text-sm font-medium break-words">{address || "Not connected"}</div>
//           </div>

//           <div className="rounded-2xl p-6 glass shadow-lg">
//             <h3 className="text-lg font-semibold mb-3">Preferences</h3>
//             <Preferences
//               value={{ goal, minApy }}
//               onChange={({ goal, minApy }) => {
//                 setGoal(goal);
//                 setMinApy(minApy);
//               }}
//             />
//           </div>
//         </aside>

//         <section className="lg:col-span-3">
//           <div className="flex items-center justify-between mb-6">
//             <h2 className="text-2xl font-bold">Recommendations (Velar)</h2>
//             <span className="text-sm text-zinc-500">Top performing pools</span>
//           </div>

//           {scan?.message && (
//             <div className="mb-4 p-3 rounded-lg bg-blue-900/30 border border-blue-600 text-blue-200 text-sm">
//               {scan.message}
//             </div>
//           )}

//           {!address && (
//             <div className="text-zinc-400 text-center mt-10">
//               🔒 Connect your wallet to view recommendations.
//             </div>
//           )}

//           {address && loadingScan && <div className="text-zinc-400">Loading Velar pools...</div>}
//           {scanError && <div className="text-red-400">{scanError}</div>}

//           {!loadingScan && address && scan.recommendations.length > 0 && (
//             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//               {scan.recommendations.map((p) => {
//                 const score = Math.round(scorePool(p, goal));
//                 const riskLabel = p.risk.charAt(0).toUpperCase() + p.risk.slice(1);
//                 const riskColor =
//                   p.risk === "low"
//                     ? "bg-green-600 text-green-50"
//                     : p.risk === "medium"
//                     ? "bg-yellow-600 text-yellow-50"
//                     : "bg-red-600 text-red-50";

//                 return (
//                   <article
//                     key={p.id}
//                     className="p-6 rounded-2xl border border-zinc-700 bg-zinc-900/70 backdrop-blur-md shadow-lg hover:border-sky-500/50 transition-all space-y-4"
//                   >
//                     <div className="flex items-start justify-between gap-3">
//                       <div>
//                         <div className="text-sm font-semibold">
//                           Velar <span className="text-zinc-400">•</span> {p.name}
//                         </div>
//                         <div className="text-xs text-zinc-500">Score: {score}/100</div>
//                       </div>
//                       <div className="text-right">
//                         <div className="text-2xl font-bold">{p.apy.toFixed(2)}%</div>
//                         <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs ${riskColor}`}>
//                           {riskLabel}
//                         </span>
//                       </div>
//                     </div>
//                     <div className="text-sm text-zinc-400">
//                       Matches your goal with APY ≤ {minApy}% — {riskNote(p)}
//                     </div>
//                     <div className="flex justify-between items-center">
//                       <a
//                         href={p.url}
//                         target="_blank"
//                         className="px-3 py-2 rounded-md border border-zinc-800 text-sm hover:bg-zinc-800/40"
//                       >
//                         Open on Velar
//                       </a>
//                       <RecordIntent address={address} poolId={p.id} />
//                     </div>
//                   </article>
//                 );
//               })}
//             </div>
//           )}

//           {!loadingScan && address && scan.recommendations.length === 0 && (
//             <div className="text-zinc-400">No pools found for your filter.</div>
//           )}
//         </section>
//       </div>
//     </>
//   );
// }



// "use client";

// import { useState, useEffect } from "react";
// import useSWR from "swr";
// import axios from "axios";
// import { Preferences } from "@/components/Preferences";
// import WalletConnect from "@/components/WalletConnect";
// import { getHiroApiBase } from "@/lib/stacks";
// import { scorePool, riskNote } from "@/lib/risk";
// import type { Goal } from "@/components/Preferences";
// import type { Pool } from "@/lib/mockPools";
// import RecordIntent from "@/components/RecordIntent";
// import GroqLLMDemo from "@/components/GroqLLMDemo";
// import { useWallet } from "@/hooks/useWallet";

// export default function Home() {
//   const { address } = useWallet();
//   const fetcher = (url: string) => axios.get(url).then((r) => r.data);

//   // Wallet balances
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

//   // Price
//   const { data: priceData } = useSWR("/api/price/stx", fetcher);
//   const exactUsd = typeof priceData?.usd === "number" ? priceData.usd : null;
//   const balanceUsd = stxBalance !== null && exactUsd !== null ? exactUsd * stxBalance : null;

//   // Preferences
//   const [goal, setGoal] = useState<Goal>("yield");
//   const [minApy, setMinApy] = useState<number>(0);

//   // Recommendations state
//   const [scan, setScan] = useState<{ recommendations: Pool[]; message?: string; error?: string } | null>(null);
//   const [loadingScan, setLoadingScan] = useState(false);
//   const [scanError, setScanError] = useState<string | null>(null);

//   // ✅ Updated: Dynamic fetch from Velar + fallback message
// async function runScan() {
//   if (!address) return;
//   setLoadingScan(true);
//   setScanError(null);

//   try {
//     const response = await axios.get("https://api.velar.co/pools/");
//     const pools = response.data?.data || []; // ✅ real pool array is inside .data

//     console.log("Fetched Velar pools:", pools.length);

//     // Normalize pools for UI
//     const normalizedPools = pools.map((pool: any) => ({
//       id: pool.lpTokenContractAddress,
//       symbol: pool.symbol,
//       token0: pool.token0Symbol,
//       token1: pool.token1Symbol,
//       apy:
//         pool.stats?.apy && pool.stats.apy !== "--"
//           ? Number(pool.stats.apy)
//           : 0, // handle cases where apy is '--'
//       tvl: pool.stats?.tvl_usd?.value || 0,
//       volume: pool.stats?.volume_usd?.value || 0,
//     }));

//     console.log("Normalized pools:", normalizedPools.slice(0, 3)); // just preview 3

//     // Filter by APY if needed
//     const minAPY = 5; // for example, 5%
//     const filteredPools = normalizedPools.filter((p: { apy: number }) => p.apy >= minAPY);

//     setScan({
//       recommendations: filteredPools,
//     });

//     if (filteredPools.length === 0) {
//       setScanError("No pools match your filters or APY threshold.");
//     }
//   } catch (err) {
//     console.error("Velar fetch error:", err);
//     setScanError("Failed to fetch from Velar. Please try again later.");
//     setScan({ recommendations: [] });
//   } finally {
//     setLoadingScan(false);
//   }
// }




//   useEffect(() => {
//     if (address) runScan();
//   }, [goal, minApy, address]);

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
//       const res = await axios.post("/api/llm-recommend", { address, balances });
//       setLlmRec(res.data.result);
//     } catch (e: any) {
//       setLlmError(e.message || "LLM error");
//     } finally {
//       setLlmLoading(false);
//     }
//   }

//   return (
//     <>
//       <div className="p-4">
//         <WalletConnect />
//       </div>

//       <div className="max-w-6xl mx-auto px-6 py-10 grid grid-cols-1 lg:grid-cols-4 gap-8">
//         <div className="lg:col-span-1 flex flex-col gap-6">
//           <div className="rounded-2xl p-5 glass">
//             <div className="flex items-center justify-between">
//               <div>
//                 <div className="text-xs text-zinc-400">Address</div>
//                 <div className="text-sm font-medium">{address || "Not connected"}</div>
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
//               <div className="text-xs text-zinc-400">STX Balance ({networkLabel})</div>
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

//           <aside className="rounded-2xl p-6 glass shadow-lg w-full">
//             <h3 className="text-lg font-semibold mb-3">Preferences</h3>
//             <Preferences
//               value={{ goal, minApy }}
//               onChange={({ goal, minApy }) => {
//                 setGoal(goal);
//                 setMinApy(minApy);
//               }}
//             />
//           </aside>
//         </div>

//         <section className="lg:col-span-3">
//           <div className="flex items-center justify-between mb-6">
//             <h2 className="text-2xl font-bold">Recommendations (Velar)</h2>
//             <div className="text-sm text-zinc-400">Top performing pools</div>
//           </div>

//           {/* ✅ Optional info message */}
//           {scan?.message && (
//             <div className="mb-4 p-3 rounded-lg bg-blue-900/30 border border-blue-600 text-blue-200 text-sm">
//               {scan.message}
//             </div>
//           )}

//           {loadingScan && <div className="text-zinc-400">Loading Velar pools...</div>}
//           {scanError && <div className="text-red-400">{scanError}</div>}

//           {!loadingScan && !scanError && (scan?.recommendations?.length ?? 0) > 0 && (
//             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//               {scan?.recommendations?.map((p) => {
//                 const score = Math.round(scorePool(p, goal));
//                 const riskLabel = p.risk === "low" ? "Low" : p.risk === "medium" ? "Medium" : "High";
//                 const riskColor =
//                   p.risk === "low"
//                     ? "bg-green-600 text-green-50"
//                     : p.risk === "medium"
//                     ? "bg-yellow-600 text-yellow-50"
//                     : "bg-red-600 text-red-50";

//                 return (
//                   <article
//                     key={p.id}
//                     className="p-6 rounded-2xl border border-zinc-700 bg-zinc-900/70 backdrop-blur-md shadow-lg hover:border-sky-500/50 transition-all space-y-4"
//                   >
//                     <div className="flex items-start justify-between gap-3">
//                       <div className="flex items-center gap-3">
//                         <div className="w-12 h-12 rounded-xl bg-zinc-800 flex items-center justify-center text-xl font-bold">
//                           V
//                         </div>
//                         <div>
//                           <div className="text-sm font-semibold">
//                             Velar <span className="text-zinc-400">•</span>{" "}
//                             <span className="text-zinc-300">{p.name}</span>
//                           </div>
//                           <div className="text-xs text-zinc-500 mt-1">
//                             Score: <span className="font-medium text-zinc-100">{score}/100</span>
//                           </div>
//                         </div>
//                       </div>
//                       <div className="flex flex-col items-end gap-2">
//                         <div className="text-2xl font-extrabold tracking-tight">{p.apy.toFixed(1)}%</div>
//                         <span
//                           className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${riskColor}`}
//                         >
//                           {riskLabel}
//                         </span>
//                       </div>
//                     </div>

//                     <div className="text-sm text-zinc-400 leading-relaxed">
//                       Matches your goal {goal} with APY ≥ {minApy}. {riskNote(p)}
//                     </div>

//                     <div className="flex items-center justify-between">
//                       <a
//                         href={p.url}
//                         target="_blank"
//                         rel="noreferrer"
//                         className="inline-flex items-center gap-2 px-3 py-2 rounded-md border border-zinc-800 text-sm hover:bg-zinc-800/40"
//                       >
//                         Open on Velar
//                       </a>
//                       <div className="text-xs text-zinc-500">Updated: just now</div>
//                     </div>

//                     <div>
//                       <RecordIntent address={address} poolId={p.id} />
//                     </div>
//                   </article>
//                 );
//               })}
//             </div>
//           )}

//           {!loadingScan && !scanError && (!scan || scan?.recommendations?.length === 0) && (
//             <div className="text-zinc-400">
//               No options match your filters. Try lowering the minimum APY.
//             </div>
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
//             <GroqLLMDemo walletAddress={address || ""} balances={getUserBalances()} />
//           </section>
//         </section>
//       </div>
//     </>
//   );
// }


// "use client";

// import { useState, useEffect } from "react";
// import useSWR from "swr";
// import axios from "axios";
// import { Preferences } from "@/components/Preferences";
// import WalletConnect from "@/components/WalletConnect";
// import { getHiroApiBase } from "@/lib/stacks";
// import { scorePool, riskNote } from "@/lib/risk";
// import type { Goal } from "@/components/Preferences";
// import type { Pool } from "@/lib/mockPools";
// import RecordIntent from "@/components/RecordIntent";
// import GroqLLMDemo from "@/components/GroqLLMDemo";
// import { useWallet } from "@/hooks/useWallet";

// export default function Home() {
//   const { address } = useWallet();

//   // Fetcher
//   const fetcher = (url: string) => axios.get(url).then((r) => r.data);

//   // Wallet balances
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

//   // Price
//   const { data: priceData } = useSWR("/api/price/stx", fetcher);
//   const exactUsd = typeof priceData?.usd === "number" ? priceData.usd : null;
//   const balanceUsd = stxBalance !== null && exactUsd !== null ? exactUsd * stxBalance : null;

//   // Preferences
//   const [goal, setGoal] = useState<Goal>("yield");
//   const [minApy, setMinApy] = useState<number>(0);

//   // Recommendations state
//   const [scan, setScan] = useState<{ recommendations: Pool[]; error?: string } | null>(null);
//   const [loadingScan, setLoadingScan] = useState(false);
//   const [scanError, setScanError] = useState<string | null>(null);

//   // Fetch dynamically from Velar API
//   async function runScan() {
//     if (!address) return;
//     setLoadingScan(true);
//     setScanError(null);
//     try {
//       const velarPools = await axios.get("https://api.velar.co/pools/");
//       const pools = Array.isArray(velarPools.data) ? velarPools.data : [];

//       // Normalize Velar response to match Pool interface
//       const normalizedPools: Pool[] = pools.map((p: any) => ({
//         id: p.pool_id || p.id || p.contract_address,
//         name: p.name || `${p.tokenA?.symbol}/${p.tokenB?.symbol}`,
//         platform: "Velar",
//         apy: Number(p.apy) || Number(p.estimated_apy) || 0,
//         url: `https://app.velar.com/pool/${p.pool_id || p.contract_address}`,
//         risk:
//           (p.apy || 0) > 15
//             ? "high"
//             : (p.apy || 0) > 8
//             ? "medium"
//             : "low",
//       }));

//       // Filter + sort pools
//       const filtered = normalizedPools.filter((p) => p.apy >= minApy);
//       const sorted = filtered.sort((a, b) => b.apy - a.apy);

//       // Pick top 6
//       const topPools = sorted.slice(0, 6);

//       setScan({ recommendations: topPools });
//       if (topPools.length === 0) {
//         setScanError("No pools match your filters or APY threshold.");
//       }
//     } catch (err) {
//       console.error("Velar fetch error:", err);
//       setScanError("Failed to fetch from Velar. Please try again later.");
//       setScan({ recommendations: [] });
//     } finally {
//       setLoadingScan(false);
//     }
//   }

//   // Auto re-scan
//   useEffect(() => {
//     if (address) runScan();
//   }, [goal, minApy, address]);

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
//       {/* Wallet Connect */}
//       <div className="p-4">
//         <WalletConnect />
//       </div>

//       <div className="max-w-6xl mx-auto px-6 py-10 grid grid-cols-1 lg:grid-cols-4 gap-8">
//         {/* Left Column */}
//         <div className="lg:col-span-1 flex flex-col gap-6">
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

//           <aside className="rounded-2xl p-6 glass shadow-lg w-full">
//             <h3 className="text-lg font-semibold mb-3">Preferences</h3>
//             <Preferences
//               value={{ goal, minApy }}
//               onChange={({ goal, minApy }) => {
//                 setGoal(goal);
//                 setMinApy(minApy);
//               }}
//             />
//           </aside>
//         </div>

//         {/* Right Column */}
//         <section className="lg:col-span-3">
//           <div className="flex items-center justify-between mb-6">
//             <h2 className="text-2xl font-bold">Recommendations (Velar)</h2>
//             <div className="text-sm text-zinc-400">Top performing pools</div>
//           </div>

//           {loadingScan && (
//             <div className="text-zinc-400">Loading Velar pools...</div>
//           )}
//           {scanError && <div className="text-red-400">{scanError}</div>}

//           {!loadingScan &&
//             !scanError &&
//             scan?.recommendations?.length > 0 && (
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
//                       className="p-6 rounded-2xl border border-zinc-700 bg-zinc-900/70 backdrop-blur-md shadow-lg hover:border-sky-500/50 transition-all space-y-4"
//                     >
//                       <div className="flex items-start justify-between gap-3">
//                         <div className="flex items-center gap-3">
//                           <div className="w-12 h-12 rounded-xl bg-zinc-800 flex items-center justify-center text-xl font-bold">
//                             V
//                           </div>
//                           <div>
//                             <div className="text-sm font-semibold">
//                               Velar{" "}
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

//                       <div className="text-sm text-zinc-400 leading-relaxed">
//                         Matches your goal {goal} with APY ≥ {minApy}.{" "}
//                         {riskNote(p)}
//                       </div>

//                       <div className="flex items-center justify-between">
//                         <a
//                           href={p.url}
//                           target="_blank"
//                           rel="noreferrer"
//                           className="inline-flex items-center gap-2 px-3 py-2 rounded-md border border-zinc-800 text-sm hover:bg-zinc-800/40"
//                         >
//                           Open on Velar
//                         </a>
//                         <div className="text-xs text-zinc-500">
//                           Updated: just now
//                         </div>
//                       </div>

//                       <div>
//                         <RecordIntent address={address} poolId={p.id} />
//                       </div>
//                     </article>
//                   );
//                 })}
//               </div>
//             )}

//           {!loadingScan &&
//             !scanError &&
//             (!scan || scan?.recommendations?.length === 0) && (
//               <div className="text-zinc-400">
//                 No options match your filters. Try lowering the minimum APY.
//               </div>
//             )}

//           {/* AI Recommendation */}
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

//           {/* Chat Section */}
//           <section className="mt-10">
//             <h2 className="text-xl font-bold mb-3">Ask the DeFi LLM</h2>
//             <GroqLLMDemo
//               walletAddress={address || ""}
//               balances={getUserBalances()}
//             />
//           </section>
//         </section>
//       </div>
//     </>
//   );
// }



// "use client";

// import { useState, useEffect } from "react";
// import useSWR from "swr";
// import axios from "axios";
// import { Preferences } from "@/components/Preferences";
// import WalletConnect from "@/components/WalletConnect";
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

//   // Preferences
//   const [goal, setGoal] = useState<Goal>("yield");
//   const [minApy, setMinApy] = useState<number>(0);

//   // Recommendations
//   const [scan, setScan] = useState<{ recommendations: Pool[]; error?: string } | null>(null);
//   const [loadingScan, setLoadingScan] = useState(false);
//   const [scanError, setScanError] = useState<string | null>(null);

//   async function runScan() {
//     if (!address) return;
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

//   // 🧠 Automatically re-scan when preferences or address changes
//   useEffect(() => {
//     if (address) runScan();
//   }, [goal, minApy, address]);

//   // AI Recommendation
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

//       {/* Main Layout */}
//       <div className="max-w-6xl mx-auto px-6 py-10 grid grid-cols-1 lg:grid-cols-4 gap-8">
//         {/* Left Column */}
//         <div className="lg:col-span-1 flex flex-col gap-6">
//           {/* Wallet Summary */}
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
//               }}
//             />
//           </aside>
//         </div>

//         {/* Right Column: Recommendations */}
//         <section className="lg:col-span-3">
//           <div className="flex items-center justify-between mb-6">
//             <h2 className="text-2xl font-bold">Recommendations</h2>
//             <div className="text-sm text-zinc-400">Showing best matches</div>
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
//                       className="p-6 rounded-2xl border border-zinc-700 bg-zinc-900/70 backdrop-blur-md shadow-lg hover:border-sky-500/50 transition-all space-y-4"
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

//                       <div className="text-sm text-zinc-400 leading-relaxed">
//                         Why this: matches your goal{" "}
//                         {goal === "yield"
//                           ? "(maximize yield)"
//                           : goal === "low-risk"
//                           ? "(lower risk)"
//                           : "(hands-off)"}{" "}
//                         and minimum APY ≥ {minApy}. {riskNote(p)}
//                       </div>

//                       <div className="flex items-center justify-between">
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

//                       <div>
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
//                 No options match your filters or data is unavailable. Try lowering minimum APY and scanning again.
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

//           {/* DeFi LLM Chat */}
//           <section className="mt-10">
//             <h2 className="text-xl font-bold mb-3">Ask the DeFi LLM</h2>
//             <GroqLLMDemo walletAddress={address || ""} balances={getUserBalances()} />
//           </section>
//         </section>
//       </div>
//     </>
//   );
// }



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
