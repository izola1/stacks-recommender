export type Pool = {
  id: string;
  name: string;
  platform: string; // Allow any protocol name
  apy: number; // percent
  risk: "low" | "medium" | "high";
  url: string;
  // Optional metadata to improve scoring/explainability
  liquidityUsd?: number;
  volume24hUsd?: number;
};

export type FungibleToken = {
  name?: string;
  symbol?: string;
  balance?: string | number;
  decimals?: number;
};

export const mockPools: Pool[] = [
  {
    id: "alex-stx-usda",
    name: "ALEX STX/USDA LP",
    platform: "ALEX",
    apy: 12.4,
    risk: "medium",
    url: "https://app.alexlab.co/pools",
  },
  {
    id: "alex-usda",
    name: "ALEX USDA Savings",
    platform: "ALEX",
    apy: 7.1,
    risk: "low",
    url: "https://app.alexlab.co/earn",
  },
  {
    id: "alex-stx",
    name: "ALEX STX Staking",
    platform: "ALEX",
    apy: 9.3,
    risk: "low",
    url: "https://app.alexlab.co/stake",
  },
];


