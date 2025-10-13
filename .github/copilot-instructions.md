# Copilot Instructions for AI Agents

## Project Overview
- **Stacks DeFi Protocol Recommender** is a Next.js (TypeScript, App Router) web app that analyzes Stacks wallet balances and DeFi protocol data to recommend actions (e.g., "Provide liquidity on ALEX Pool X for ~12% APY").
- The app connects to Stacks wallets (Leather/Hiro) and fetches balances via the Hiro API.
- DeFi protocol data is currently mocked (`src/lib/mockPools.ts`), with plans to integrate live endpoints (see `src/lib/providers/`).

## Key Architecture & Patterns
- **App Structure:**
  - All main UI and routing logic is in `src/app/` (Next.js App Router).
  - Components are in `src/components/` (e.g., `Preferences.tsx`, `WalletConnect.tsx`).
  - Protocol integrations are modularized in `src/lib/providers/` (e.g., `alex.ts`, `arkadiko.ts`).
  - Business logic for recommendations is in `src/lib/stacks.ts` and `src/lib/risk.ts`.
- **API Routes:**
  - Next.js API routes for price and recommendations: `src/app/api/price/stx/route.ts`, `src/app/api/recommendations/route.ts`.
- **Data Flow:**
  - Wallet connect → fetch balances (Hiro API) → fetch protocol data (mock/live) → compute recommendations → display in UI.
- **Config:**
  - Price source is configurable via `.env.local` (see README for details).

## Developer Workflows
- **Install:** `npm install`
- **Dev server:** `npm run dev` (http://localhost:3000)
- **Environment:** Node 18+, Next.js 13+ (App Router)
- **Testing:** No formal test suite; validate by running locally and checking browser console/network.
- **Deployment:** Deploy to Vercel (Next.js defaults).

## Project-Specific Conventions
- **Provider Pattern:** Add new DeFi protocols by creating a new file in `src/lib/providers/` and updating the provider index.
- **Mock Data:** Use `mockPools.ts` for local development; replace with live data for production.
- **Explainability:** Recommendations should include a rationale (see `src/lib/stacks.ts`).
- **No Fund Movement:** The app never moves funds without explicit wallet approval.

## Integration Points
- **Stacks Wallet:** Uses `@stacks/connect` for wallet integration.
- **Hiro API:** For balance queries.
- **DeFi Protocols:** Modular provider files for each protocol.
- **Price Feeds:** Configurable via environment variables; see `/api/price/stx` route.

## Examples
- To add a new protocol: create `src/lib/providers/newprotocol.ts` and export it in `src/lib/providers/index.ts`.
- To change price source: update `.env.local` as per README, then restart dev server.

## References
- See `README.md` for setup, environment, and price source pinning.
- See `docs/PITCH.md` for demo script and submission details.

---

If you are unsure about a workflow or pattern, check the README or the relevant file in `src/lib/` or `src/app/`.
