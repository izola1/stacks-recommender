"use client";

import { useState } from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-[#0a0a0d] via-[#0f0f13] to-[#17171c] text-gray-100">
      {/* Sidebar */}
      <Sidebar />

      {/* Main content area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
        <main className="flex-1 overflow-y-auto p-6 md:p-10">{children}</main>
      </div>
    </div>
  );
}



// // src/components/AppShell.tsx
// "use client";

// import { useState } from "react";
// import { Menu, X } from "lucide-react";
// import Sidebar from "@/components/Sidebar";
// import Header from "@/components/Header";

// export default function AppShell({ children }: { children: React.ReactNode }) {
//   const [open, setOpen] = useState(false);

//   return (
//     <div className="flex h-screen bg-gradient-to-b from-zinc-950 to-zinc-900 text-white">
//       {/* Sidebar */}
//       <Sidebar open={open} setOpen={setOpen} />

//       {/* Main content area */}
//       <div className="flex-1 flex flex-col overflow-hidden">
//         <Header open={open} setOpen={setOpen} />
//         <main className="flex-1 overflow-y-auto p-6">{children}</main>
//       </div>
//     </div>
//   );
// }
