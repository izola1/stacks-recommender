// src/hooks/useWallet.tsx
"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { AppConfig, UserSession } from "@stacks/connect";

const appConfig = new AppConfig(["store_write", "publish_data"]);
const userSession = new UserSession({ appConfig });

type WalletContextValue = {
  address: string | null;
  connecting: boolean;
  connectError: string | null;
  connect: () => Promise<void>;
  disconnect: () => void;
  setAddress: (addr: string | null) => void;
};

const WalletContext = createContext<WalletContextValue | undefined>(undefined);

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [address, setAddressState] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [connectError, setConnectError] = useState<string | null>(null);

  // Restore saved address only (do NOT ping wallet on load)
  useEffect(() => {
    try {
      const saved = localStorage.getItem("stx-address");
      if (saved) setAddressState(saved);
    } catch {
      /* ignore */
    }
  }, []);

  // keep localStorage in sync
  useEffect(() => {
    try {
      if (address) {
        localStorage.setItem("stx-address", address);
        localStorage.setItem("stx-connected", "1");
      } else {
        localStorage.removeItem("stx-address");
        localStorage.removeItem("stx-connected");
      }
    } catch {
      /* ignore */
    }
  }, [address]);

  const connect = useCallback(async () => {
    setConnecting(true);
    setConnectError(null);
    try {
      // Try Wallet Provider extensions first (Leather, Hiro)
      // Note: provider types differ by wallet; keep defensive checks
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const provider =
        (window as any).LeatherProvider || (window as any).StacksProvider;
      if (!provider) {
        setConnectError(
          "No Stacks wallet detected. Install Leather (leather.io) or another Stacks wallet."
        );
        setConnecting(false);
        return;
      }

      const res = await provider.request?.("stx_getAddresses");
      const addresses = res?.result?.addresses || res?.addresses;
      let addr: string | undefined = undefined;

      if (Array.isArray(addresses)) {
        const stxAddr = addresses.find(
          // some extensions include symbol; be defensive
          (a: any) => a?.symbol === "STX" || a?.address?.startsWith("SP")
        );
        addr = stxAddr?.address || addresses[0]?.address;
      }

      addr = addr || res?.result?.address || res?.address;

      if (addr) {
        setAddressState(addr);
        setConnecting(false);
        return;
      }

      // Fallback: check userSession (if user signed in via connect)
      if (userSession.isUserSignedIn()) {
        const data = userSession.loadUserData();
        // attempt to extract STX address from common shapes
        const stx =
          data?.profile?.stxAddress?.mainnet ||
          data?.profile?.stxAddress?.testnet ||
          data?.profile?.stxAddress ||
          data?.profile?.username;
        if (stx) {
          setAddressState(stx as string);
          setConnecting(false);
          return;
        }
      }

      setConnectError("Wallet provider returned no address.");
    } catch (e: any) {
      setConnectError(e?.message || "Wallet connection failed");
    } finally {
      setConnecting(false);
    }
  }, []);

  const disconnect = useCallback(() => {
    setAddressState(null);
    setConnectError(null);
    try {
      localStorage.removeItem("stx-address");
      localStorage.removeItem("stx-connected");
    } catch {
      /* ignore */
    }
  }, []);

  const ctx: WalletContextValue = {
    address,
    connecting,
    connectError,
    connect,
    disconnect,
    setAddress: setAddressState,
  };

  return <WalletContext.Provider value={ctx}>{children}</WalletContext.Provider>;
}

export function useWallet() {
  const ctx = useContext(WalletContext);
  if (!ctx) {
    throw new Error("useWallet must be used inside WalletProvider");
  }
  return ctx;
}
