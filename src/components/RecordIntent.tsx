"use client";

import { useState, useMemo } from "react";
import { openContractCall } from "@stacks/connect";
import { StacksNetworks } from "@stacks/network";
import { bufferCVFromString, uintCV } from "@stacks/transactions";

type Props = {
  address: string | null;
  poolId: string;
};

export default function RecordIntent(props: Props) {
  const { address, poolId } = props;
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [txId, setTxId] = useState<string | null>(null);

  const contractId = process.env.NEXT_PUBLIC_INTENT_CONTRACT as string | undefined; // e.g. SP... .intent-registry
  const [contractAddress, contractName] = useMemo(() => {
    if (!contractId) return [null, null] as const;
    const parts = contractId.split(".");
    return parts.length === 2 ? [parts[0], parts[1]] : [null, null];
  }, [contractId]);

  async function onClick() {
    setError(null);
    setTxId(null);
    if (!contractAddress || !contractName) {
      setError("Contract not configured");
      return;
    }
    setPending(true);
    try {
      const network = StacksNetworks.testnet;
      const args = [bufferCVFromString(poolId), uintCV(Math.floor(Date.now() / 1000))];
      await openContractCall({
        network,
        contractAddress,
        contractName,
        functionName: "record-intent",
        functionArgs: args,
        appDetails: { name: "Stacks Recommender", icon: "/favicon.ico" },
        onFinish: (data) => {
          setTxId(data.txId);
          setPending(false);
        },
        onCancel: () => setPending(false),
      });
    } catch (e: any) {
      setError(e?.message || "Contract call failed");
      setPending(false);
    }
  }

  return (
    <div style={{ marginTop: 8 }}>
      <button type="button" onClick={onClick} disabled={!address || pending || !contractAddress} style={{
        background: '#0f766e', color: 'white', padding: '6px 10px', borderRadius: 6,
        border: 'none', cursor: pending || !address ? 'not-allowed' : 'pointer', opacity: pending || !address ? 0.6 : 1
      }}>
        {pending ? "Recording intent..." : "Record intent on-chain (testnet)"}
      </button>
      {error && <div style={{ color: '#b91c1c', marginTop: 6 }}>{error}</div>}
      {txId && (
        <div style={{ marginTop: 6 }}>
          Submitted: <a href={`https://explorer.hiro.so/txid/${txId}?chain=testnet`} target="_blank" rel="noreferrer">view on explorer</a>
        </div>
      )}
    </div>
  );
}


