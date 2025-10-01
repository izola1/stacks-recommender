export type StacksNetwork = "mainnet" | "testnet";

export function getHiroApiBase(network: StacksNetwork = "testnet"): string {
  return network === "mainnet" ? "https://api.hiro.so" : "https://api.testnet.hiro.so";
}


