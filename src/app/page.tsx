"use client";
import { useState, useEffect } from "react";
import styles from "./page.module.css";
import { WalletConnect } from "@/components/WalletConnect";
import useSWR from "swr";
import axios from "axios";
import { getHiroApiBase } from "@/lib/stacks";
import { Preferences, type Goal } from "@/components/Preferences";
import { mockPools } from "@/lib/mockPools";
import { fetchAlexPools } from "@/lib/providers/alex";
import { riskNote, scorePool } from "@/lib/risk";

export default function Home() {
  const [address, setAddress] = useState<string | null>(null);

  useEffect(() => {
    // WalletConnect manages session; read from localStorage profile if present
    try {
      const raw = localStorage.getItem("blockstack-session");
      if (raw) {
        const session = JSON.parse(raw);
        const stx = session?.userData?.profile?.stxAddress?.testnet as string | undefined;
        setAddress(stx ?? null);
      }
    } catch {}
  }, []);

  const fetcher = (url: string) => axios.get(url).then(r => r.data);
  const { data: mainnet, error: mErr } = useSWR(
    address ? `${getHiroApiBase("mainnet")}/extended/v1/address/${address}/balances` : null,
    fetcher
  );
  const { data: testnet, error: tErr } = useSWR(
    address ? `${getHiroApiBase("testnet")}/extended/v1/address/${address}/balances` : null,
    fetcher
  );

  const mainBal = mainnet?.stx?.balance ? Number(mainnet.stx.balance) / 1e6 : 0;
  const testBal = testnet?.stx?.balance ? Number(testnet.stx.balance) / 1e6 : 0;
  const isMain = mainBal > testBal;
  const selected = isMain ? mainnet : testnet;
  const stxBalance = (isMain ? mainBal : testBal) || null;
  const networkLabel = isMain ? "mainnet" : "testnet";

  // Fetch STX price in USD (try 'stacks' then fallback 'blockstack')
  const priceFetcher = (url: string) => axios.get(url).then(r => r.data);
  const { data: pricePrimary } = useSWR(
    "stx-price-primary",
    () => priceFetcher("https://api.coingecko.com/api/v3/simple/price?ids=stacks&vs_currencies=usd")
  );
  const { data: priceFallback } = useSWR(
    pricePrimary?.stacks?.usd === undefined ? "stx-price-fallback" : null,
    () => priceFetcher("https://api.coingecko.com/api/v3/simple/price?ids=blockstack&vs_currencies=usd")
  );
  const stxUsd = pricePrimary?.stacks?.usd ?? priceFallback?.blockstack?.usd ?? null;
  const balanceUsd = stxUsd && stxBalance !== null ? stxUsd * stxBalance : null;
  const [goal, setGoal] = useState<Goal>("yield");
  const [minApy, setMinApy] = useState<number>(5);

  const { data: alexPools } = useSWR("alex-pools", async () => {
    try {
      return await fetchAlexPools();
    } catch {
      return mockPools;
    }
  });

  const pools = alexPools ?? mockPools;

  const recommendations = pools
    .filter(p => p.apy >= minApy)
    .sort((a, b) => scorePool(b, goal) - scorePool(a, goal))
    .slice(0, 3);

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <h1>Stacks Recommender</h1>
        <WalletConnect onConnected={(addr) => setAddress(addr)} onDisconnected={() => setAddress(null)} />
        <div style={{ marginTop: 16 }}>
          <Preferences
            value={{ goal, minApy }}
            onChange={({ goal, minApy }) => {
              setGoal(goal);
              setMinApy(minApy);
            }}
          />
        </div>
        {address && (
          <div style={{ marginTop: 16 }}>
            <div>Address: {address}</div>
            {(mErr || tErr) && <div>Failed to load balance</div>}
            {stxBalance !== null && (
              <div>
                STX Balance ({networkLabel}): {stxBalance.toFixed(6)} STX
                {balanceUsd !== null && (
                  <span> (~${balanceUsd.toFixed(2)} USD)</span>
                )}
              </div>
            )}
            {selected?.stx?.locked && Number(selected.stx.locked) > 0 && (
              <div>Locked: {(Number(selected.stx.locked) / 1e6).toFixed(6)} STX</div>
            )}
            {selected?.fungible_tokens && (
              <div style={{ marginTop: 8 }}>
                <div>Other tokens:</div>
                <ul>
                  {Object.entries(selected.fungible_tokens).slice(0,5).map(([k, v]: any) => (
                    <li key={k}>
                      {(v?.name || k)}: {v?.balance ? Number(v.balance) / Math.pow(10, v?.decimals || 0) : 0}
                      {v?.symbol ? ` ${v.symbol}` : ""}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
        <div style={{ marginTop: 24, width: "100%", maxWidth: 640 }}>
          <h2>Recommendations</h2>
          {recommendations.map(p => (
            <div key={p.id} style={{ border: "1px solid #333", padding: 12, borderRadius: 8, marginBottom: 12 }}>
              <div style={{ fontWeight: 600 }}>{p.name}</div>
              <div>Platform: {p.platform}</div>
              <div>Estimated APY: {p.apy}%</div>
              <div>Risk: {p.risk}</div>
              <div>Score: {scorePool(p, goal).toFixed(0)}/100</div>
              <div>
                Why this: matches your goal {goal === "yield" ? "(maximize yield)" : goal === "low-risk" ? "(lower risk)" : "(hands-off)"} and minimum APY ≥ {minApy}.
              </div>
              <div>{riskNote(p)}</div>
              <a href={p.url} target="_blank" rel="noreferrer">Open on {p.platform}</a>
            </div>
          ))}
          {recommendations.length === 0 && <div>No options match your filters.</div>}
        </div>
      </main>
    </div>
  );
}
