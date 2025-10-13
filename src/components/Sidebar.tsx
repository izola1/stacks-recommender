"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import clsx from "clsx";
import {
  Home,
  PieChart,
  Brain,
  Settings,
  Sun,
  Moon,
  Menu,
  ChevronLeft,
} from "lucide-react";
import { useTheme } from "next-themes";

export default function Sidebar() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  const links = [
    { href: "/", label: "Dashboard", icon: Home },
    { href: "/portfolio", label: "Portfolio", icon: PieChart },
    { href: "/ai", label: "AI Advisor", icon: Brain },
    { href: "/settings", label: "Settings", icon: Settings },
  ];

  return (
    <>
      {/* Mobile menu toggle */}
      <button
        className="md:hidden fixed top-4 left-4 z-50 p-2 bg-zinc-900/80 rounded-md border border-zinc-800 hover:bg-zinc-800 transition"
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        <Menu className="w-5 h-5 text-white" />
      </button>

      {/* Sidebar */}
      <aside
        className={clsx(
          "fixed md:static z-40 h-screen flex flex-col justify-between p-5 bg-gradient-to-b from-zinc-900/80 to-zinc-900/60 border-r border-zinc-800 transition-all duration-300",
          collapsed ? "w-20" : "w-64",
          mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        {/* Collapse toggle (desktop only) */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden md:flex items-center justify-center mb-6 p-2 rounded-md hover:bg-zinc-800/60 transition"
        >
          <ChevronLeft
            className={clsx(
              "w-5 h-5 text-zinc-400 transition-transform duration-300",
              collapsed ? "rotate-180" : "rotate-0"
            )}
          />
        </button>

        {/* Navigation */}
        <div className="flex flex-col gap-4 flex-1">
          <h2
            className={clsx(
              "text-xl font-bold text-white mb-4 transition-opacity",
              collapsed ? "opacity-0 pointer-events-none" : "opacity-100"
            )}
          >
            DeFi Dashboard
          </h2>

          <nav className="flex flex-col gap-2">
            {links.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={clsx(
                  "flex items-center gap-3 px-3 py-2 rounded-lg",
                  "text-zinc-300 hover:text-white hover:bg-zinc-800/70 transition"
                )}
              >
                <Icon className="w-5 h-5 shrink-0" />
                {!collapsed && <span>{label}</span>}
              </Link>
            ))}
          </nav>
        </div>

        {/* Theme Toggle */}
        <div className="border-t border-zinc-800 pt-4">
          <button
            onClick={() => setTheme(theme === "light" ? "dark" : "light")}
            className={clsx(
              "w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg",
              "bg-zinc-800/70 hover:bg-zinc-700/70 transition text-sm text-zinc-300"
            )}
          >
            {theme === "light" ? (
              <>
                <Moon className="w-4 h-4 text-yellow-400" />
                {!collapsed && "Dark Mode"}
              </>
            ) : (
              <>
                <Sun className="w-4 h-4 text-yellow-300" />
                {!collapsed && "Light Mode"}
              </>
            )}
          </button>
        </div>
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-30 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}
    </>
  );
}



// "use client";

// import Link from "next/link";
// import { Home, PieChart, Brain, Settings, Sun, Moon } from "lucide-react";
// import clsx from "clsx";
// import { useTheme } from "next-themes";
// import { useState, useEffect } from "react";

// export default function Sidebar() {
//   const { theme, setTheme } = useTheme();
//   const [mounted, setMounted] = useState(false);

//   useEffect(() => setMounted(true), []);
//   if (!mounted) return null;

//   const links = [
//     { href: "/", label: "Dashboard", icon: Home },
//     { href: "/portfolio", label: "Portfolio", icon: PieChart },
//     { href: "/ai", label: "AI Advisor", icon: Brain },
//     { href: "/settings", label: "Settings", icon: Settings },
//   ];

//   return (
//     <aside
//       className={clsx(
//         "hidden md:flex flex-col justify-between w-64 h-screen p-5",
//         "bg-gradient-to-b from-zinc-900/80 to-zinc-900/60 border-r border-zinc-800"
//       )}
//     >
//       {/* Top Navigation */}
//       <div className="flex flex-col gap-4">
//         <h2 className="text-xl font-bold text-white mb-6">DeFi Dashboard</h2>
//         <nav className="flex flex-col gap-2">
//           {links.map(({ href, label, icon: Icon }) => (
//             <Link
//               key={href}
//               href={href}
//               className={clsx(
//                 "flex items-center gap-3 px-3 py-2 rounded-lg",
//                 "text-zinc-300 hover:text-white hover:bg-zinc-800/70 transition"
//               )}
//             >
//               <Icon className="w-5 h-5" />
//               <span>{label}</span>
//             </Link>
//           ))}
//         </nav>
//       </div>

//       {/* Bottom Section — Theme Toggle */}
//       <div className="border-t border-zinc-800 pt-4">
//         <button
//           onClick={() => setTheme(theme === "light" ? "dark" : "light")}
//           className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-zinc-800/70 hover:bg-zinc-700/70 transition text-sm text-zinc-300"
//         >
//           {theme === "light" ? (
//             <>
//               <Moon className="w-4 h-4 text-yellow-400" />
//               Dark Mode
//             </>
//           ) : (
//             <>
//               <Sun className="w-4 h-4 text-yellow-300" />
//               Light Mode
//             </>
//           )}
//         </button>
//       </div>
//     </aside>
//   );
// }




// "use client";

// import { useState, useEffect } from "react";
// import Link from "next/link";
// import { usePathname } from "next/navigation";
// import { Home, PieChart, Brain, Settings, Menu, X } from "lucide-react";
// import clsx from "clsx";

// const navItems = [
//   { href: "/", label: "Dashboard", icon: Home },
//   { href: "/analytics", label: "Analytics", icon: PieChart },
//   { href: "/ai", label: "AI Advisor", icon: Brain },
//   { href: "/settings", label: "Settings", icon: Settings },
// ];

// export default function Sidebar() {
//   const pathname = usePathname();
//   const [open, setOpen] = useState(false);

//   // Close sidebar on route change (for mobile)
//   useEffect(() => {
//     setOpen(false);
//   }, [pathname]);

//   return (
//     <>
//       {/* Mobile Toggle Button */}
//       <button
//         className="fixed top-4 left-4 z-50 md:hidden p-2 rounded-md bg-zinc-900/80 border border-zinc-800 text-zinc-100"
//         onClick={() => setOpen((o) => !o)}
//       >
//         {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
//       </button>

//       {/* Sidebar */}
//       <aside
//         className={clsx(
//           "fixed md:static top-0 left-0 h-full w-64 bg-gradient-to-b from-zinc-950 to-zinc-900 border-r border-zinc-800 p-6 flex flex-col transition-transform duration-300 ease-in-out z-40",
//           open ? "translate-x-0" : "-translate-x-full md:translate-x-0"
//         )}
//       >
//         {/* Logo */}
//         <div className="text-xl font-bold text-white mb-8">Stacks Recommender</div>

//         {/* Navigation Links */}
//         <nav className="flex-1 space-y-2">
//           {navItems.map(({ href, label, icon: Icon }) => {
//             const active = pathname === href;
//             return (
//               <Link
//                 key={href}
//                 href={href}
//                 className={clsx(
//                   "flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200",
//                   active
//                     ? "bg-zinc-800 text-white"
//                     : "text-zinc-400 hover:bg-zinc-800/40 hover:text-white"
//                 )}
//               >
//                 <Icon className="w-4 h-4" />
//                 {label}
//               </Link>
//             );
//           })}
//         </nav>

//         {/* Footer */}
//         <div className="mt-auto text-xs text-zinc-600 pt-6 border-t border-zinc-800">
//           © {new Date().getFullYear()} Stacks Recommender
//         </div>
//       </aside>

//       {/* Overlay (for mobile) */}
//       {open && (
//         <div
//           className="fixed inset-0 bg-black/50 backdrop-blur-sm z-30 md:hidden"
//           onClick={() => setOpen(false)}
//         />
//       )}
//     </>
//   );
// }






// // src/components/Sidebar.tsx
// "use client";

// import { Home, PieChart, Brain, Settings } from "lucide-react";
// import Link from "next/link";
// import clsx from "clsx";

// export default function Sidebar({
//   open,
//   setOpen,
// }: {
//   open: boolean;
//   setOpen: (v: boolean) => void;
// }) {
//   const links = [
//     { name: "Dashboard", href: "/", icon: Home },
//     { name: "Portfolio", href: "/portfolio", icon: PieChart },
//     { name: "AI Advisor", href: "/advisor", icon: Brain },
//     { name: "Settings", href: "/settings", icon: Settings },
//   ];

//   return (
//     <aside
//       className={clsx(
//         "fixed md:static z-50 inset-y-0 left-0 w-64 bg-zinc-900/70 backdrop-blur-xl border-r border-white/10 transform transition-transform duration-300 ease-in-out",
//         open ? "translate-x-0" : "-translate-x-full md:translate-x-0"
//       )}
//     >
//       <div className="flex items-center justify-between px-4 py-4 md:hidden">
//         <h2 className="text-lg font-semibold">DeFi Dashboard</h2>
//         <button onClick={() => setOpen(false)} className="text-zinc-400 hover:text-white">
//           ✕
//         </button>
//       </div>

//       <div className="p-4">
//         <h2 className="text-2xl font-bold mb-6 hidden md:block">DeFi Dashboard</h2>

//         <nav className="space-y-2">
//           {links.map(({ name, href, icon: Icon }) => (
//             <Link
//               key={name}
//               href={href}
//               className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/10 transition"
//               onClick={() => setOpen(false)}
//             >
//               <Icon className="w-5 h-5 text-zinc-400" />
//               <span>{name}</span>
//             </Link>
//           ))}
//         </nav>
//       </div>
//     </aside>
//   );
// }



// "use client";
// import { useState } from "react";
// import { motion } from "framer-motion";
// import { Home, Settings, LineChart, Bot, Menu, X } from "lucide-react";
// import Link from "next/link";

// export default function Sidebar() {
//   const [open, setOpen] = useState(false);

//   const navItems = [
//     { name: "Dashboard", icon: <Home size={18} />, href: "/" },
//     { name: "Analytics", icon: <LineChart size={18} />, href: "#" },
//     { name: "AI Recommender", icon: <Bot size={18} />, href: "#" },
//     { name: "Settings", icon: <Settings size={18} />, href: "#" },
//   ];

//   return (
//     <>
//       {/* Mobile menu toggle */}
//       <button
//         onClick={() => setOpen(!open)}
//         className="absolute top-4 left-4 md:hidden z-50 bg-white/10 p-2 rounded-md border border-white/10 backdrop-blur-lg"
//       >
//         {open ? <X size={18} /> : <Menu size={18} />}
//       </button>

//       {/* Sidebar */}
//       <motion.aside
//         initial={{ x: -260 }}
//         animate={{ x: open ? 0 : -260 }}
//         transition={{ duration: 0.3 }}
//         className={`fixed md:static inset-y-0 left-0 z-40 w-64 md:w-60 flex flex-col justify-between 
//         glass border-r border-white/10 backdrop-blur-xl shadow-lg`}
//       >
//         <div className="p-6 flex flex-col gap-8">
//           {/* Logo */}
//           <div className="text-2xl font-bold bg-gradient-to-r from-sky-400 to-purple-400 text-transparent bg-clip-text">
//             Stacks<span className="text-white">Recommender</span>
//           </div>

//           {/* Navigation */}
//           <nav className="flex flex-col gap-3 mt-4">
//             {navItems.map((item) => (
//               <Link
//                 key={item.name}
//                 href={item.href}
//                 className="flex items-center gap-3 text-sm font-medium px-3 py-2 rounded-lg hover:bg-white/10 transition-colors"
//               >
//                 {item.icon}
//                 <span>{item.name}</span>
//               </Link>
//             ))}
//           </nav>
//         </div>

//         {/* Footer section inside sidebar */}
//         <div className="p-4 text-xs text-zinc-500 border-t border-white/10">
//           © {new Date().getFullYear()} Stacks Recommender
//         </div>
//       </motion.aside>
//     </>
//   );
// }
