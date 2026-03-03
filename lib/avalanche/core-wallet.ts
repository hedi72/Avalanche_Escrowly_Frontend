import type { Eip1193Provider } from "ethers";
import { DEFAULT_NETWORK } from "./config";

export type CoreProvider = Eip1193Provider & {
  isCoreWallet?: boolean;
  on?: (event: string, handler: (...args: any[]) => void) => void;
  removeListener?: (event: string, handler: (...args: any[]) => void) => void;
};

export function getCoreProvider(): CoreProvider | null {
  if (typeof window === "undefined") {
    return null;
  }

  const provider = (window as Window & { avalanche?: CoreProvider }).avalanche;
  return provider ?? null;
}

export function isCoreWalletInstalled(): boolean {
  return !!getCoreProvider();
}

export function toHexChainId(chainId: number): string {
  return `0x${chainId.toString(16)}`;
}

export async function ensureCoreNetwork(provider: CoreProvider) {
  const target = DEFAULT_NETWORK;
  const currentHex = (await provider.request({
    method: "eth_chainId",
  })) as string;

  const currentId = Number.parseInt(currentHex, 16);
  if (currentId === target.chainId) {
    return;
  }

  try {
    await provider.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: toHexChainId(target.chainId) }],
    });
  } catch (error) {
    const code = (error as { code?: number })?.code;
    if (code !== 4902) {
      throw error;
    }

    await provider.request({
      method: "wallet_addEthereumChain",
      params: [
        {
          chainId: toHexChainId(target.chainId),
          chainName: target.name,
          rpcUrls: target.rpcUrls,
          nativeCurrency: target.nativeCurrency,
          blockExplorerUrls: target.blockExplorerUrls,
        },
      ],
    });
  }
}
