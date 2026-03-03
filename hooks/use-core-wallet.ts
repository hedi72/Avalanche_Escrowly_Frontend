"use client";

import { BrowserProvider } from "ethers";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ensureCoreNetwork, getCoreProvider, isCoreWalletInstalled } from "@/lib/avalanche/core-wallet";

export type CoreWalletState = {
  isInstalled: boolean;
  isConnecting: boolean;
  account: string | null;
  chainId: number | null;
  provider: BrowserProvider | null;
  connect: () => Promise<void>;
  ensureNetwork: () => Promise<void>;
  disconnect: () => Promise<{ mode: "revoked" | "local"; stillConnected: boolean }>;
};

export function useCoreWallet(): CoreWalletState {
  const [isInstalled, setIsInstalled] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [account, setAccount] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [provider, setProvider] = useState<BrowserProvider | null>(null);
  const [isSoftDisconnected, setIsSoftDisconnected] = useState(false);

  const readSoftDisconnect = () =>
    typeof window !== "undefined" &&
    window.localStorage.getItem("core_wallet_soft_disconnected") === "true";

  const coreProvider = useMemo(() => getCoreProvider(), []);

  const refreshState = useCallback(async () => {
    if (!coreProvider) {
      return;
    }

    const softDisconnected = readSoftDisconnect();
    const accounts = (await coreProvider.request({
      method: "eth_accounts",
    })) as string[];
    setAccount(softDisconnected ? null : accounts?.[0] ?? null);

    const chainHex = (await coreProvider.request({
      method: "eth_chainId",
    })) as string;
    setChainId(Number.parseInt(chainHex, 16));
  }, [coreProvider]);

  useEffect(() => {
    setIsInstalled(isCoreWalletInstalled());

    if (!coreProvider) {
      return;
    }

    setProvider(new BrowserProvider(coreProvider));
    if (typeof window !== "undefined") {
      const stored = window.localStorage.getItem("core_wallet_soft_disconnected");
      setIsSoftDisconnected(stored === "true");
    }
    refreshState();

    const handleAccountsChanged = (accounts: string[]) => {
      if (readSoftDisconnect()) {
        setAccount(null);
        return;
      }
      setAccount(accounts?.[0] ?? null);
    };

    const handleChainChanged = (chainHex: string) => {
      setChainId(Number.parseInt(chainHex, 16));
    };

    coreProvider.on?.("accountsChanged", handleAccountsChanged);
    coreProvider.on?.("chainChanged", handleChainChanged);
    coreProvider.on?.("disconnect", () => setAccount(null));

    return () => {
      coreProvider.removeListener?.("accountsChanged", handleAccountsChanged);
      coreProvider.removeListener?.("chainChanged", handleChainChanged);
    };
  }, [coreProvider, refreshState]);

  const connect = useCallback(async () => {
    if (!coreProvider) {
      throw new Error("Core Wallet not installed");
    }

    if (typeof window !== "undefined") {
      window.localStorage.removeItem("core_wallet_soft_disconnected");
    }
    setIsSoftDisconnected(false);

    setIsConnecting(true);
    try {
      const accounts = (await coreProvider.request({
        method: "eth_requestAccounts",
      })) as string[];
      setAccount(accounts?.[0] ?? null);

      await refreshState();
    } finally {
      setIsConnecting(false);
    }
  }, [coreProvider, refreshState]);

  const ensureNetwork = useCallback(async () => {
    if (!coreProvider) {
      throw new Error("Core Wallet not installed");
    }
    await ensureCoreNetwork(coreProvider);
    await refreshState();
  }, [coreProvider, refreshState]);

  const disconnect: CoreWalletState["disconnect"] = useCallback(async () => {
    if (!coreProvider) {
      throw new Error("Core Wallet not installed");
    }

    let revoked = false;
    try {
      await coreProvider.request({
        method: "wallet_revokePermissions",
        params: [{ parentCapability: "eth_accounts" }],
      });
      revoked = true;
    } catch {
      revoked = false;
    }

    if (typeof window !== "undefined") {
      window.localStorage.setItem("core_wallet_soft_disconnected", "true");
    }
    setIsSoftDisconnected(true);

    const accounts = (await coreProvider.request({
      method: "eth_accounts",
    })) as string[];

    const stillConnected = !!accounts?.[0];
    setAccount(null);
    return { mode: revoked ? "revoked" : "local", stillConnected };
  }, [coreProvider]);

  return {
    isInstalled,
    isConnecting,
    account,
    chainId,
    provider,
    connect,
    ensureNetwork,
    disconnect,
  };
}
