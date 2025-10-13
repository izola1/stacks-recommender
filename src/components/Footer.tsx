"use client";

import { Github, Linkedin, Twitter } from "lucide-react";

export default function Footer() {
  return (
    <footer className="w-full mt-auto border-t border-zinc-800 bg-zinc-950/60 backdrop-blur-md text-zinc-400 text-sm">
      <div className="max-w-7xl mx-auto px-6 py-6 flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Left: Copyright or brand */}
        <p className="text-center md:text-left">
          © {new Date().getFullYear()} <span className="text-white font-semibold">Stacks Recommender</span> — Empowering DeFi insights.
        </p>

        {/* Right: Social icons */}
        <div className="flex items-center gap-5">
          <a
            href="https://github.com/"
            target="_blank"
            rel="noreferrer"
            className="hover:text-white transition-colors"
          >
            <Github className="w-5 h-5" />
          </a>
          <a
            href="https://twitter.com/"
            target="_blank"
            rel="noreferrer"
            className="hover:text-white transition-colors"
          >
            <Twitter className="w-5 h-5" />
          </a>
          <a
            href="https://linkedin.com/"
            target="_blank"
            rel="noreferrer"
            className="hover:text-white transition-colors"
          >
            <Linkedin className="w-5 h-5" />
          </a>
        </div>
      </div>
    </footer>
  );
}



// export default function Footer() {
//   return (
//     <footer className="w-full py-6 border-t border-white/10 text-center text-xs text-zinc-500">
//       Built with ❤️ on Stacks — © {new Date().getFullYear()} All Rights Reserved.
//     </footer>
//   );
// }
