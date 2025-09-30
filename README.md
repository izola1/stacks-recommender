# Stacks DeFi Protocol Recommender (AI-Powered)

An AI-assisted web app that analyzes your Stacks wallet balances and current DeFi protocol data to recommend actions (e.g., "Provide liquidity on ALEX Pool X for ~12% APY").

## Quickstart

1. Requirements: Node 18+, npm
2. Install deps:
   ```bash
   npm install
   ```
3. Run dev:
   ```bash
   npm run dev
   ```
4. Open `http://localhost:3000`, connect your Leather/Hiro wallet, view balance and recommendations.

## Tech Stack
- Next.js (App Router, TypeScript)
- Stacks: `@stacks/connect`, `@stacks/transactions`, `@stacks/network`
- Data/API: Hiro API (balances), mock protocol data (ALEX pools) → to be replaced with live endpoints
- SWR + Axios for fetching

## Hackathon Requirements Mapping
- Built on Stacks tooling: wallet connect via `@stacks/connect`, Hiro API usage.
- GitHub repo with README: this file documents setup and scope.
- Functioning demo: local dev now; deploy on Vercel for public access.
- Demo/pitch video: to be added in `docs/` with script and link.
- Submission via DoraHacks with repo + live demo links.

### DoraHacks Submission Steps
1. Push this repo to GitHub (public).
2. Deploy to Vercel: import the repo, set framework to Next.js, build defaults.
3. Add live demo URL and repo to DoraHacks submission form.
4. Record 60–90s demo using `docs/PITCH.md` as your script; upload and link.
5. Ensure README has run instructions and links.

## Roadmap (MVP)
- Wallet connect and STX balance (done)
- Preferences: goal and minimum APY (done)
- Recommendations list with explainability (this commit)
- Replace mock pools with live ALEX pool data (next)
- Risk notes and deep links to target protocols
- Deploy to Vercel + prepare pitch video

## Safety / Disclaimer
- This app does not move funds without your explicit approval in your wallet.
- Recommendations are informational; DeFi involves risk.

## License
MIT
