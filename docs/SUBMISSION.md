# DoraHacks Submission Checklist

- Project name: Stacks DeFi Protocol Recommender (AI-Powered)
- Description: AI recommendations for Stacks DeFi actions based on wallet and protocol data
- Links:
  - Repo: <add GitHub URL>
  - Live demo: <add Vercel URL>
  - Video: <add YouTube/Drive link>
  - Screenshots: `docs/screenshot-1.png`, `docs/screenshot-2.png`
- Built on Stacks:
  - Wallet connect via `@stacks/connect`
  - Hiro API for balances/positions
  - ALEX API for pools/tickers
- How to run:
  ```bash
  npm install
  npm run dev
  ```
- Screenshots: add after deployment

## Reviewer Quick-Test Checklist
- Connect wallet and verify STX balance appears with USD and price source.
- Set goal/min APY; click Apply and see ranked recommendations.
- Click a recommendation link; confirm it opens the protocol’s page.
- Trigger AI advice; verify a Groq-backed response is returned.

## Judging Criteria Mapping
- Technical quality: live data ingestion (ALEX/Hiro), UI, scoring, explainability
- Security: read-only integrations; user approvals; clear risk notes
- Ease of use: connect → set goal → top 3 options with APY, risk, link
- Bitcoin alignment: increases DeFi participation on Stacks, unlocking BTC utility

## Future Work
- More protocols, position-aware suggestions, testnet simulation, deeper risk modeling
