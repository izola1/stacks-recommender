"use client";

import { ReactNode, useState } from "react";
import { Menu, X } from "lucide-react";

export default function Layout({ children }: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-[#0f172a] to-[#1e293b] text-white">
      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-40 w-64 glass p-6 transform lg:translate-x-0 transition-transform duration-300 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-xl font-semibold">AI Recommender</h1>
          <button
            className="lg:hidden"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <nav className="space-y-4">
          <a href="/" className="block p-2 rounded-lg hover:bg-white/10">
            Dashboard
          </a>
          <a href="/history" className="block p-2 rounded-lg hover:bg-white/10">
            History
          </a>
          <a href="/settings" className="block p-2 rounded-lg hover:bg-white/10">
            Settings
          </a>
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="glass sticky top-0 z-20 p-4 flex items-center justify-between">
          <button
            className="lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="w-6 h-6" />
          </button>
          <h2 className="text-lg font-medium">Welcome back 👋</h2>
          <div className="flex items-center gap-3">
            <button className="bg-white/10 px-3 py-1 rounded-lg hover:bg-white/20">
              Connect Wallet
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6 overflow-y-auto">
          <div className="glass p-6 card-hover">{children}</div>
        </main>
      </div>
    </div>
  );
}
