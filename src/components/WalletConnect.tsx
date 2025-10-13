// src/components/WalletConnect.tsx
"use client";

import { useWallet } from "@/hooks/useWallet";
import styles from "./WalletConnect.module.css";

export default function WalletConnect() {
  const { address, connecting, connect, disconnect, connectError } = useWallet();

  return (
    <div className={styles.walletConnectRow}>
      {address ? (
        <>
          <span className="truncate">Connected: {address}</span>
          <button
            onClick={disconnect}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-sky-500 to-purple-500 text-white font-medium shadow-md hover:scale-[1.02] transition"
          >
            Disconnect
          </button>
        </>
      ) : (
        <>
          <button
            type="button"
            onClick={connect}
            disabled={connecting}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-sky-500 to-purple-500 text-white font-medium shadow-md hover:scale-[1.02] transition disabled:opacity-60"
          >
            {connecting ? "Connecting..." : "Connect Wallet"}
          </button>
          {connectError && <span className={styles.error}>{connectError}</span>}
        </>
      )}
    </div>
  );
}



// "use client";

// import { useState, useEffect } from "react";
// import styles from "./WalletConnect.module.css";
// import { AppConfig, UserSession } from "@stacks/connect";

// const appConfig = new AppConfig(["store_write", "publish_data"]);
// const userSession = new UserSession({ appConfig });

// function WalletConnect(props: { onConnected?: (address: string) => void; onDisconnected?: () => void }) {
//   const [address, setAddress] = useState<string | null>(null);

//   const { onConnected } = props;
//   useEffect(() => {
//     // Restore last connected address without pinging the wallet (prevents popup on refresh)
//     try {
//       const saved = localStorage.getItem("stx-address");
//       if (saved) {
//         setAddress(saved);
//         onConnected?.(saved);
//       }
//     } catch { }
//   }, [onConnected]);

//   const [connecting, setConnecting] = useState(false);
//   const [connectError, setConnectError] = useState<string | null>(null);

//   async function connect() {
//     setConnecting(true);
//     setConnectError(null);
//     try {
//       // Types for Stacks wallet browser providers are not published.
//       // The 'any' usage below is unavoidable for compatibility with Leather/Hiro extensions.
//       // If official types are released, update this to use them.
//       // eslint-disable-next-line @typescript-eslint/no-explicit-any
//       const provider = (window as unknown as { LeatherProvider?: any; StacksProvider?: any }).LeatherProvider
//         || (window as unknown as { LeatherProvider?: any; StacksProvider?: any }).StacksProvider;
//       if (!provider) {
//         setConnectError("No Stacks wallet detected. Please install Leather (leather.io) and try again.");
//         setConnecting(false);
//         return;
//       }
//       const res = await provider.request?.("stx_getAddresses");
//       const addresses = res?.result?.addresses || res?.addresses;
//       let addr: string | undefined = undefined;
//       if (Array.isArray(addresses)) {
//         const stxAddr = addresses.find((a: { symbol?: string; address?: string }) => a?.symbol === "STX");
//         addr = stxAddr?.address || addresses[0]?.address;
//       }
//       addr = addr || res?.result?.address || res?.address;
//       if (addr) {
//         setAddress(addr);
//         props.onConnected?.(addr);
//         try {
//           localStorage.setItem("stx-connected", "1");
//           localStorage.setItem("stx-address", addr);
//         } catch { }
//         setConnecting(false);
//         return;
//       }
//       // Fallback to userSession if extension returns nothing
//       if (userSession.isUserSignedIn()) {
//         const data = userSession.loadUserData();
//         const stx = data.profile?.stxAddress?.testnet as string | undefined;
//         if (stx) {
//           setAddress(stx);
//           props.onConnected?.(stx);
//           setConnecting(false);
//           return;
//         }
//       }
//       setConnectError("No address returned from provider or session.");
//     } catch {
//       setConnectError("Wallet connection failed. Check your wallet is unlocked and try again.");
//     } finally {
//       setConnecting(false);
//     }
//   }

//   function signOut() {
//     setAddress(null);
//     props.onDisconnected?.();
//     try {
//       localStorage.removeItem("stx-connected");
//       localStorage.removeItem("stx-address");
//     } catch { }
//   }

//   return (
//     <div className={styles.walletConnectRow}>
//       {address ? (
//         <>
//           <span>Connected: {address}</span>
//           <button onClick={signOut} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-sky-500 to-purple-500 text-white font-medium shadow-md hover:scale-[1.02] transition">Disconnect</button>
//         </>
//       ) : (
//         <>
//           <button type="button" onClick={connect} disabled={connecting} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-sky-500 to-purple-500 text-white font-medium shadow-md hover:scale-[1.02] transition">
//             {connecting ? "Connecting..." : "Connect Wallet"}
//           </button>
//           {connectError && <span className={styles.error}>{connectError}</span>}
//         </>
//       )}
//     </div>
//   );
// }

// export default WalletConnect;

