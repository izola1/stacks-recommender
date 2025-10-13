"use client";

import { Menu, Wallet, LogOut } from "lucide-react";
import { useState } from "react";
import clsx from "clsx";

interface HeaderProps {
  connected?: boolean;
  address?: string;
  onDisconnect?: () => void;
  onMenuClick?: () => void;
}

export default function Header({
  connected,
  address,
  onDisconnect,
  onMenuClick,
}: HeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-zinc-900/80 to-zinc-800/50 border-b border-zinc-800 sticky top-0 z-30 backdrop-blur-xl">
      {/* Left: Mobile Menu Button + Title */}
      <div className="flex items-center gap-3">
        {/* Mobile menu toggle */}
        <button
          className="md:hidden p-2 rounded-md bg-zinc-900/60 border border-zinc-700 hover:bg-zinc-800 transition"
          onClick={onMenuClick}
        >
          <Menu className="w-5 h-5 text-zinc-300" />
        </button>

        <h1 className="text-lg md:text-2xl font-bold text-white tracking-tight">
          DeFi Dashboard
        </h1>
      </div>

      {/* Right: Wallet Info */}
      <div className="flex items-center gap-4">
        {!connected ? (
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-sky-600 hover:opacity-90 transition text-sm font-semibold">
            <Wallet className="w-4 h-4" />
            <span className="hidden sm:inline">Connect Wallet</span>
          </button>
        ) : (
          <div className="flex items-center gap-3">
            <div className="flex flex-col items-end">
              <span className="text-xs text-zinc-400 hidden sm:inline">
                Connected
              </span>
              <span className="text-sm font-medium text-zinc-100">
                {address?.slice(0, 6)}...{address?.slice(-4)}
              </span>
            </div>
            <button
              onClick={onDisconnect}
              className="p-2 rounded-md border border-zinc-700 hover:bg-zinc-800 transition"
            >
              <LogOut className="w-4 h-4 text-zinc-300" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
}



// "use client";

// import { useTheme } from "next-themes";
// import { Sun, Moon } from "lucide-react";
// import { useEffect, useState } from "react";
// import clsx from "clsx";

// export default function Header() {
//   const { theme, setTheme } = useTheme();
//   const [mounted, setMounted] = useState(false);

//   // Ensures theme is mounted before rendering icons (avoids hydration mismatch)
//   useEffect(() => setMounted(true), []);

//   if (!mounted) return null;

//   return (
//     <header
//       className={clsx(
//         "flex items-center justify-between px-6 py-4",
//         "bg-gradient-to-r from-zinc-900/60 to-zinc-800/40",
//         "backdrop-blur-md border-b border-zinc-800 shadow-sm"
//       )}
//     >
//       <h1 className="text-lg md:text-xl font-bold text-white tracking-tight">
//         DeFi Dashboard
//       </h1>

//       <div className="flex items-center gap-4">
//         {/* Theme Toggle */}
//         <button
//           onClick={() => setTheme(theme === "light" ? "dark" : "light")}
//           className="p-2 rounded-lg bg-zinc-800/60 border border-zinc-700 hover:bg-zinc-700 transition-colors"
//           aria-label="Toggle Theme"
//         >
//           {theme === "light" ? (
//             <Moon className="w-5 h-5 text-yellow-400" />
//           ) : (
//             <Sun className="w-5 h-5 text-yellow-300" />
//           )}
//         </button>
//       </div>
//     </header>
//   );
// }




// "use client";

// import { useState } from "react";
// import { Menu, Wallet, LogOut } from "lucide-react";
// import clsx from "clsx";
// import ThemeToggle from "./ThemeToggle";

// export default function Header({
//   connected,
//   address,
//   onDisconnect,
// }: {
//   connected?: boolean;
//   address?: string;
//   onDisconnect?: () => void;
// }) {
//   const [menuOpen, setMenuOpen] = useState(false);

//   const shortAddress = address
//     ? `${address.slice(0, 6)}...${address.slice(-4)}`
//     : null;

//   return (
//     <header className="w-full border-b border-zinc-800 bg-zinc-950/70 backdrop-blur-md sticky top-0 z-30">
//       <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
//         {/* Left section - logo/title */}
//         <div className="flex items-center gap-3">
//           <Menu
//             className="w-6 h-6 text-zinc-300 md:hidden cursor-pointer"
//             onClick={() => setMenuOpen((prev) => !prev)}
//           />
//           <h1 className="text-lg font-bold text-white">Stacks Recommender</h1>
//         </div>

//         {/* Right section - wallet & actions */}
//         <div className="flex items-center gap-4">
            
//           {connected ? (
//             <div className="flex items-center gap-2">
//               <span className="hidden sm:inline text-sm text-zinc-400">
//                 {shortAddress}
//               </span>
//               <button
//                 onClick={onDisconnect}
//                 className="flex items-center gap-2 px-3 py-1.5 text-sm rounded-md border border-zinc-700 hover:bg-zinc-800 text-zinc-300 transition"
//               >
//                 <LogOut className="w-4 h-4" /> Disconnect
//               </button>
//             </div>
//           ) : (
//             <button
//               onClick={() =>
//                 document
//                   .querySelector<HTMLButtonElement>("#wallet-connect-btn")
//                   ?.click()
//               }
//               className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-sky-500 to-purple-500 text-white font-medium shadow-md hover:scale-[1.02] transition"
//             >
//               <Wallet className="w-4 h-4" /> Connect Wallet
//             </button>
//           )}

//           <ThemeToggle />
//         </div>
//       </div>

//       {/* Mobile dropdown (if needed later) */}
//       {menuOpen && (
//         <div className="md:hidden bg-zinc-950 border-t border-zinc-800 px-6 py-4 flex flex-col gap-3 text-zinc-300">
//           <button className="text-left text-sm hover:text-white">Dashboard</button>
//           <button className="text-left text-sm hover:text-white">Analytics</button>
//           <button className="text-left text-sm hover:text-white">AI Advisor</button>
//           <button className="text-left text-sm hover:text-white">Settings</button>
//         </div>
//       )}
//     </header>
//   );
// }



// // src/components/Header.tsx
// "use client";

// import { Menu } from "lucide-react";

// export default function Header({
//   open,
//   setOpen,
// }: {
//   open: boolean;
//   setOpen: (v: boolean) => void;
// }) {
//   return (
//     <header className="flex items-center justify-between p-4 border-b border-white/10 bg-zinc-950/70 backdrop-blur-xl">
//       <div className="flex items-center gap-3">
//         <button
//           className="md:hidden text-zinc-400 hover:text-white"
//           onClick={() => setOpen(!open)}
//         >
//           <Menu className="w-6 h-6" />
//         </button>
//         <h1 className="text-lg font-semibold">AI-Powered DeFi Dashboard</h1>
//       </div>

//       <div className="flex items-center gap-3">
//         <button className="px-3 py-1 rounded-md bg-white/10 hover:bg-white/20 transition">
//           Connect Wallet
//         </button>
//       </div>
//     </header>
//   );
// }



// "use client";
// import { Wallet, Moon, Sun, Settings } from "lucide-react";
// import { useState } from "react";

// export default function Header() {
//   const [dark, setDark] = useState(true);

//   return (
//     <header className="flex items-center justify-between w-full border-b border-white/10 bg-white/5 backdrop-blur-xl px-6 py-4">
//       <div className="text-lg font-semibold tracking-tight">
//         Dashboard Overview
//       </div>

//       <div className="flex items-center gap-3">
//         <button className="hidden md:inline-flex items-center gap-2 px-3 py-2 rounded-md border border-white/10 bg-white/5 text-sm hover:bg-white/10">
//           <Settings size={16} /> Settings
//         </button>
//         <button
//           onClick={() => setDark(!dark)}
//           className="hidden md:inline-flex items-center gap-2 px-3 py-2 rounded-md border border-white/10 bg-white/5 text-sm hover:bg-white/10"
//         >
//           {dark ? <Sun size={16} /> : <Moon size={16} />} Theme
//         </button>
//         <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-gradient-to-r from-slate-900 to-zinc-900 border border-zinc-800">
//           <Wallet size={16} />
//           <div className="text-xs text-zinc-300">STX R...ADZNZ</div>
//         </div>
//       </div>
//     </header>
//   );
// }



// // import React from 'react';
// // import {
// //   IconWallet,
// //   IconSettings,
// //   IconMoon,
// //   IconSun,
// // } from "@tabler/icons-react";

// // interface HeaderProps {
// //   connected: boolean;
// //   address?: string;
// //   onDisconnect?: () => void;
// // }

// // export function Header({ connected, address, onDisconnect }: HeaderProps) {
// //   return (
// //     <header className="w-full flex items-center justify-between px-6 py-4 border-b border-zinc-800">
// //       <div className="flex items-center gap-4">
// //         <div className="text-2xl font-extrabold tracking-tight">Stacks <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-purple-400">Recommender</span></div>
// //         <div className="text-sm text-zinc-400">Find high-quality DeFi stacks & vaults</div>
// //       </div>

// //       <div className="flex items-center gap-3">
// //         <button className="hidden md:inline-flex items-center gap-2 text-sm px-3 py-2 rounded-md bg-zinc-900 border border-zinc-800">
// //           <IconSettings size={16} /> Settings
// //         </button>
// //         <button className="hidden md:inline-flex items-center gap-2 text-sm px-3 py-2 rounded-md bg-zinc-900 border border-zinc-800">
// //           <IconMoon size={16} /> Theme
// //         </button>

// //         <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-gradient-to-r from-slate-900 to-zinc-900 border border-zinc-800">
// //           <IconWallet size={16} />
// //           <div className="text-xs text-zinc-300">
// //             {connected ? (address ? `${address.slice(0, 6)}...${address.slice(-6)}` : 'Connected') : "Not connected"}
// //           </div>
// //           {connected && (
// //             <button onClick={onDisconnect} className="ml-3 text-xs text-sky-400">Disconnect</button>
// //           )}
// //         </div>
// //       </div>
// //     </header>
// //   );
// // }