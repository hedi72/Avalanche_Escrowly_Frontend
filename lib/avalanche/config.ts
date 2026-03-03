export type AvalancheNetwork = {
  chainId: number;
  chainHex: string;
  name: string;
  rpcUrls: string[];
  blockExplorerUrls: string[];
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
};

const FUJI_NETWORK: AvalancheNetwork = {
  chainId: 43113,
  chainHex: "0xa869",
  name: "Avalanche Fuji C-Chain",
  rpcUrls: ["https://api.avax-test.network/ext/bc/C/rpc"],
  blockExplorerUrls: ["https://testnet.snowtrace.io"],
  nativeCurrency: {
    name: "Avalanche",
    symbol: "AVAX",
    decimals: 18,
  },
};

const MAINNET_NETWORK: AvalancheNetwork = {
  chainId: 43114,
  chainHex: "0xa86a",
  name: "Avalanche C-Chain",
  rpcUrls: ["https://api.avax.network/ext/bc/C/rpc"],
  blockExplorerUrls: ["https://snowtrace.io"],
  nativeCurrency: {
    name: "Avalanche",
    symbol: "AVAX",
    decimals: 18,
  },
};

const NETWORK_ENV = (process.env.NEXT_PUBLIC_AVALANCHE_NETWORK || "fuji").toLowerCase();
const CHAIN_ID_ENV = Number(process.env.NEXT_PUBLIC_AVALANCHE_CHAIN_ID || 0);

const baseNetwork =
  CHAIN_ID_ENV === MAINNET_NETWORK.chainId
    ? MAINNET_NETWORK
    : CHAIN_ID_ENV === FUJI_NETWORK.chainId
      ? FUJI_NETWORK
      : NETWORK_ENV === "mainnet"
        ? MAINNET_NETWORK
        : FUJI_NETWORK;

const RPC_OVERRIDE = process.env.NEXT_PUBLIC_AVALANCHE_RPC_URL?.trim();

export const DEFAULT_NETWORK: AvalancheNetwork = RPC_OVERRIDE
  ? {
      ...baseNetwork,
      rpcUrls: [RPC_OVERRIDE, ...baseNetwork.rpcUrls.filter((url) => url !== RPC_OVERRIDE)],
    }
  : baseNetwork;

const fallbackAddresses = {
  factory: "0xF7dbcC5b0F500163Fd84f7229A4E5D7C26d2c7E1",
  escrowVault: "0x847617b6Ad72A6C18b903dFceEA5a5c8b84C95b9",
  proof: "0xEB95599b4bEC01458b4685C3E365bFe42208886F",
  verifierRegistry: "0x2f3631c49A09Bfd9a83c17B8f4AFf25f2714002A",
  treasury: "0x1622A9a5008C86F52Dea53A8F1d9Df0F6285e6e4",
  accessManager: "0x20F1f2829A40C8659705f42Da9217ae25a977D88",
};

const readEnv = (key: string, fallback: string) => {
  const value = process.env[key];
  return value && value.trim().length > 0 ? value.trim() : fallback;
};

export const CONTRACT_ADDRESSES = {
  factory: readEnv("NEXT_PUBLIC_FACTORY_ADDRESS", fallbackAddresses.factory),
  escrowVault: readEnv("NEXT_PUBLIC_ESCROW_VAULT_ADDRESS", fallbackAddresses.escrowVault),
  proof: readEnv("NEXT_PUBLIC_PROOF_ADDRESS", fallbackAddresses.proof),
  verifierRegistry: readEnv("NEXT_PUBLIC_VERIFIER_REGISTRY_ADDRESS", fallbackAddresses.verifierRegistry),
  treasury: readEnv("NEXT_PUBLIC_TREASURY_ADDRESS", fallbackAddresses.treasury),
  accessManager: readEnv("NEXT_PUBLIC_ACCESS_MANAGER_ADDRESS", fallbackAddresses.accessManager),
};

export const DEFAULT_RPC_URL = DEFAULT_NETWORK.rpcUrls[0];
