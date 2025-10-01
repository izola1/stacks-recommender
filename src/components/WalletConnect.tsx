"use client";

import { useState, useEffect } from "react";
import { AppConfig, UserSession, showConnect } from "@stacks/connect";

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
    }
  }, []);

  function connect() {
    showConnect({
      appDetails: {
        name: "Stacks Recommender",
        icon: window.location.origin + "/favicon.ico",
      },
      redirectTo: "/",
      userSession,
      onFinish: () => {
        const data = userSession.loadUserData();
        const stx = data.profile?.stxAddress?.testnet as string | undefined;
        if (stx) {
          setAddress(stx);
          props.onConnected?.(stx);
        } else {
          setAddress(null);
        }
      },
      onCancel: () => {},
    });
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
        <button onClick={connect}>Connect Wallet</button>
      )}
    </div>
  );
}


