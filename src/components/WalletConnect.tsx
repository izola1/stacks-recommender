"use client";

import { useState, useEffect } from "react";
import { AppConfig, UserSession } from "@stacks/connect";

const appConfig = new AppConfig(["store_write", "publish_data"]);
const userSession = new UserSession({ appConfig });

export function WalletConnect(props: { onConnected?: (address: string) => void; onDisconnected?: () => void }) {
  const [address, setAddress] = useState<string | null>(null);

  useEffect(() => {
    if (userSession.isUserSignedIn()) {
      const data = userSession.loadUserData();
      const stx = data.profile?.stxAddress?.testnet as string | undefined;
      if (stx) {
        setAddress(stx);
        props.onConnected?.(stx);
      } else {
        setAddress(null);
      }
    } else if (userSession.isSignInPending()) {
      userSession.handlePendingSignIn().then(() => {
        const data = userSession.loadUserData();
        const stx = data.profile?.stxAddress?.testnet as string | undefined;
        if (stx) {
          setAddress(stx);
          props.onConnected?.(stx);
        } else {
          setAddress(null);
        }
      });
    } else {
      // Try provider directly to get current addresses
      const provider: any = (window as any).LeatherProvider || (window as any).StacksProvider;
      provider?.request?.("stx_getAddresses").then((res: any) => {
        const addresses = res?.result?.addresses || res?.addresses;
        const stxAddr: string | undefined = addresses?.find?.((a: any) => a?.symbol === "STX")?.address
          || res?.result?.address
          || res?.address;
        if (stxAddr) {
          setAddress(stxAddr);
          props.onConnected?.(stxAddr);
        }
      }).catch(() => {});
    }
  }, []);

  async function connect() {
    console.log("connect: clicked");
    try {
      const provider: any = (window as any).LeatherProvider || (window as any).StacksProvider;
      if (!provider) {
        console.warn("connect: no provider found (install Leather/Hiro)");
        alert("No Stacks wallet detected. Please install Leather (leather.io) and try again.");
        return;
      }
      const res = await provider.request?.("stx_getAddresses");
      const addresses = res?.result?.addresses || res?.addresses;
      const addr: string | undefined = addresses?.find?.((a: any) => a?.symbol === "STX")?.address
        || addresses?.[0]?.address
        || res?.result?.address
        || res?.address;
      if (addr) {
        setAddress(addr);
        props.onConnected?.(addr);
        return;
      }
      // Fallback to userSession if extension returns nothing
      if (userSession.isUserSignedIn()) {
        const data = userSession.loadUserData();
        const stx = data.profile?.stxAddress?.testnet as string | undefined;
        if (stx) {
          setAddress(stx);
          props.onConnected?.(stx);
          return;
        }
      }
      console.warn("connect: no address returned from provider or session");
    } catch (e) {
      console.warn("connect: provider flow failed", e);
      alert("Wallet connection failed. Check your wallet is unlocked and try again.");
    }
  }

  function signOut() {
    userSession.signUserOut(window.location.origin);
    setAddress(null);
    props.onDisconnected?.();
  }

  return (
    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
      {address ? (
        <>
          <span>Connected: {address}</span>
          <button onClick={signOut}>Disconnect</button>
        </>
      ) : (
        <button type="button" onClick={connect}>Connect Wallet</button>
      )}
    </div>
  );
}


