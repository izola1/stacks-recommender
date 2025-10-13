
# Stacks DeFi Protocol Recommender (AI-Powered)

**Unlock the Bitcoin economy with AI-powered DeFi recommendations.**

This web app connects to your Stacks wallet, analyzes your on-chain balances, and uses live DeFi protocol data to recommend the best actions for you (e.g., "Provide liquidity on ALEX Pool X for ~12% APY").
The AI-driven engine blends yield, risk, and your preferences to surface the top opportunities—making Stacks DeFi accessible for everyone.

## Quickstart

1. **Requirements:** Node 18+, npm
2. **Install dependencies:**
  ```bash
  npm install
  ```
3. **Run the dev server:**
  ```bash
  npm run dev
  ```
4. **Open** [http://localhost:3000](http://localhost:3000), connect your Leather/Hiro wallet, and view your personalized DeFi recommendations.

## Environment Variables

- Set your keys in a local `.env.local` (and in Vercel Project Settings for production):
  - `GROQ_API_KEY` – required for the AI personalized advice endpoint (`/api/llm-recommend`).
  - Optional STX price pinning to match your wallet's price source exactly (see section below):
    - `STX_PRICE_PROVIDER` – `coingecko-pro` | `cryptocompare` | `custom`
    - `STX_PRICE_API_KEY` – API key for the chosen provider (if applicable)
    - `STX_PRICE_URL` – for `custom`, must return `{ "usd": number }`
    - `STX_PRICE_OVERRIDE_USD` – set a fixed USD price for demos (takes precedence)

Example `.env.local`:

```
# LLM
GROQ_API_KEY=your_groq_key_here

# STX price source pinning (choose one approach)
# STX_PRICE_PROVIDER=coingecko-pro
# STX_PRICE_API_KEY=your_cg_pro_key
# STX_PRICE_PROVIDER=cryptocompare
# STX_PRICE_API_KEY=your_cc_key
# STX_PRICE_PROVIDER=custom
# STX_PRICE_URL=https://your-endpoint-returning-usd
# STX_PRICE_OVERRIDE_USD=0.60
```

## How It Works

1. **Connect your Stacks wallet** (Leather/Hiro) to the app.
2. **The app fetches your on-chain balances** using the Hiro API.
3. **Live DeFi protocol data** (ALEX, Arkadiko, Bitflow, StackSwap) is fetched from APIs or reliable estimates.
4. **AI-driven recommendation engine** analyzes your balances, preferences (goal, minimum APY), and protocol data to suggest the top DeFi actions for you.
5. **Each recommendation includes:**
  - Estimated APY
  - Risk level and rationale
  - Deep link to the protocol
  - Transparent scoring based on your preferences

## Tech Stack
- Next.js (App Router, TypeScript)
- Stacks: `@stacks/connect`, `@stacks/transactions`, `@stacks/network`
- Data/API: Hiro API (balances), live and mock protocol data (ALEX, Arkadiko, Bitflow, StackSwap)
- SWR + Axios for fetching


## Demo & Pitch Video

**Demo video instructions:**
1. Show connecting your wallet and viewing your STX balance.
2. Set your goal (e.g., "maximize yield") and minimum APY.
3. Run a scan and explain the top recommendations (APY, risk, rationale, deep link).
4. Highlight how the AI engine personalizes results and makes DeFi accessible.
5. (Optional) Show how live protocol data is fetched and fallback to mock data if needed.

See `docs/PITCH.md` for a sample 60–90s pitch script.


### DoraHacks Submission Steps
1. Push this repo to GitHub (public).
2. Deploy to Vercel: import the repo, set framework to Next.js, build defaults.
3. Add live demo URL and repo to DoraHacks submission form.
4. Record a 60–90s demo using `docs/PITCH.md` as your script; upload and link.
5. Ensure README has run instructions and links.

## Deployment

Deploy on Vercel:
- Import the repo into Vercel and select the Next.js framework preset.
- Add required Environment Variables in Vercel Project Settings (same as `.env.local`).
- Trigger a deploy and verify:
  - `/` loads, wallet connects.
  - `/api/price/stx` returns `{ usd, source }`.
  - `/api/recommendations` returns recommendations.
  - `/api/llm-recommend` returns an AI response (requires `GROQ_API_KEY`).

After deployment, add these to the README top section:
- Live demo: <your Vercel URL>
- Pitch video: <YouTube/Drive URL>

## Screenshots

Add 1–2 screenshots to `docs/` and link them here for judges:
- Connected wallet and balances
- Recommendations list with APY, risk, score


## AI-Driven Recommendation Engine

- The core engine (see `src/lib/risk.ts`, `src/lib/providers/`, and `src/app/api/recommendations/route.ts`) blends APY, risk, and your preferences to score and rank DeFi opportunities.
- Recommendations are explainable, with rationale and risk notes for each pool.
- The system is modular—new protocols can be added easily.


## Stacks Integration & Safety
- Built on Stacks tooling: wallet connect via `@stacks/connect`, Hiro API usage.
- No funds are ever moved without your explicit wallet approval.
- Recommendations are informational; DeFi involves risk.

## License
MIT


## Price Source Pinning (match wallet exactly)

To make the USD balance match your wallet provider precisely, pin the price source via environment variables.

1. Create a `.env.local` in the project root (or copy `.env.local.example`):
   - CoinGecko Pro (recommended):
     - `STX_PRICE_PROVIDER=coingecko-pro`
     - `STX_PRICE_API_KEY=YOUR_CG_PRO_KEY`
   - CryptoCompare:
     - `STX_PRICE_PROVIDER=cryptocompare`
     - `STX_PRICE_API_KEY=YOUR_CRYPTOCOMPARE_KEY`
   - Custom URL (must return `{ "usd": number }`):
     - `STX_PRICE_PROVIDER=custom`
     - `STX_PRICE_URL=https://your-price-endpoint`
2. Restart dev server:
   ```bash
   npm run dev
   ```
3. Verify in browser console:
   ```js
   fetch('/api/price/stx').then(r=>r.json()).then(console.log)
   ```
   You should see `{ usd: <number> }` matching your wallet's price source.
