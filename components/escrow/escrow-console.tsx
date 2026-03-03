"use client";

import { useMemo, useState } from "react";
import {
  formatUnits,
  id,
  isAddress,
  isHexString,
  parseUnits,
  ZeroHash,
} from "ethers";
import { useToast } from "@/hooks/use-toast";
import { useCoreWallet } from "@/hooks/use-core-wallet";
import {
  getCampaignContract,
  getErc20Contract,
  getFactoryContract,
} from "@/lib/avalanche/contracts";
import { CONTRACT_ADDRESSES, DEFAULT_NETWORK } from "@/lib/avalanche/config";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type CampaignConfigView = {
  campaignId: string;
  sponsor: string;
  rewardToken: string;
  totalBudget: string;
  fixedRewardAmount: string;
  maxWinners: number;
  startAt: string;
  endAt: string;
  protocolFeeBps: number;
  verificationMode: number;
  payoutMode: number;
  status: number;
  tokenSymbol: string;
  tokenDecimals: number;
};

const VERIFICATION_OPTIONS = [
  { value: "0", label: "Direct verifier call" },
  { value: "1", label: "EIP-712 voucher" },
  { value: "2", label: "Merkle root" },
];

const PAYOUT_OPTIONS = [
  { value: "0", label: "Fixed per winner" },
  { value: "1", label: "Variable claim" },
];

export function EscrowConsole() {
  const { toast } = useToast();
  const { isInstalled, isConnecting, account, chainId, provider, connect, ensureNetwork } =
    useCoreWallet();

  const [factoryNextId, setFactoryNextId] = useState<string>("-");
  const [campaignLookupId, setCampaignLookupId] = useState("");
  const [campaignLookupAddress, setCampaignLookupAddress] = useState<string>("-");
  const [campaignAddress, setCampaignAddress] = useState("");
  const [campaignConfig, setCampaignConfig] = useState<CampaignConfigView | null>(null);
  const [readLoading, setReadLoading] = useState(false);

  const [createForm, setCreateForm] = useState({
    rewardToken: "",
    totalBudget: "",
    fixedRewardAmount: "",
    startAt: "",
    endAt: "",
    maxWinners: "1",
    verificationMode: "0",
    payoutMode: "0",
    rulesText: "",
    rulesHash: "",
    eligibilityRoot: "",
    verifierGroupId: "",
    proofNonTransferable: true,
  });
  const [createLoading, setCreateLoading] = useState(false);
  const [createdCampaignId, setCreatedCampaignId] = useState<string>("-");
  const [createdCampaignAddress, setCreatedCampaignAddress] = useState<string>("-");

  const [fundAddress, setFundAddress] = useState("");
  const [fundLoading, setFundLoading] = useState(false);

  const networkMismatch =
    chainId !== null && chainId !== DEFAULT_NETWORK.chainId;

  const canInteract = useMemo(() => !!provider, [provider]);

  const handleConnect = async () => {
    try {
      await connect();
      await ensureNetwork();
    } catch (error) {
      toast({
        title: "Core Wallet",
        description: (error as Error).message || "Failed to connect.",
        variant: "destructive",
      });
    }
  };

  const handleLoadFactory = async () => {
    if (!provider) {
      toast({
        title: "Core Wallet",
        description: "Connect Core Wallet first.",
        variant: "destructive",
      });
      return;
    }

    setReadLoading(true);
    try {
      const factory = getFactoryContract(provider);
      const nextId = await factory.nextCampaignId();
      setFactoryNextId(nextId.toString());
    } catch (error) {
      toast({
        title: "Factory read failed",
        description: (error as Error).message,
        variant: "destructive",
      });
    } finally {
      setReadLoading(false);
    }
  };

  const handleLookupCampaign = async () => {
    if (!provider) {
      toast({
        title: "Core Wallet",
        description: "Connect Core Wallet first.",
        variant: "destructive",
      });
      return;
    }

    if (!campaignLookupId.trim()) {
      toast({
        title: "Campaign lookup",
        description: "Enter a campaign id.",
        variant: "destructive",
      });
      return;
    }

    setReadLoading(true);
    try {
      const factory = getFactoryContract(provider);
      const campaignAddr = await factory.campaignOf(BigInt(campaignLookupId));
      setCampaignLookupAddress(campaignAddr);
    } catch (error) {
      toast({
        title: "Lookup failed",
        description: (error as Error).message,
        variant: "destructive",
      });
    } finally {
      setReadLoading(false);
    }
  };

  const handleLoadCampaignConfig = async () => {
    if (!provider) {
      toast({
        title: "Core Wallet",
        description: "Connect Core Wallet first.",
        variant: "destructive",
      });
      return;
    }

    if (!isAddress(campaignAddress)) {
      toast({
        title: "Campaign address",
        description: "Enter a valid campaign address.",
        variant: "destructive",
      });
      return;
    }

    setReadLoading(true);
    try {
      const campaign = getCampaignContract(campaignAddress, provider);
      const [config, status, campaignId] = await Promise.all([
        campaign.config(),
        campaign.status(),
        campaign.campaignId(),
      ]);

      const token = getErc20Contract(config.rewardToken, provider);
      const [decimals, symbol] = await Promise.all([
        token.decimals(),
        token.symbol(),
      ]);

      setCampaignConfig({
        campaignId: campaignId.toString(),
        sponsor: config.sponsor,
        rewardToken: config.rewardToken,
        totalBudget: formatUnits(config.totalBudget, decimals),
        fixedRewardAmount: formatUnits(config.fixedRewardAmount, decimals),
        maxWinners: Number(config.maxWinners),
        startAt: new Date(Number(config.startAt) * 1000).toLocaleString(),
        endAt: new Date(Number(config.endAt) * 1000).toLocaleString(),
        protocolFeeBps: Number(config.protocolFeeBps),
        verificationMode: Number(config.verificationMode),
        payoutMode: Number(config.payoutMode),
        status: Number(status),
        tokenSymbol: symbol,
        tokenDecimals: Number(decimals),
      });
    } catch (error) {
      toast({
        title: "Campaign read failed",
        description: (error as Error).message,
        variant: "destructive",
      });
    } finally {
      setReadLoading(false);
    }
  };

  const handleCreateCampaign = async () => {
    if (!provider || !account) {
      toast({
        title: "Core Wallet",
        description: "Connect Core Wallet first.",
        variant: "destructive",
      });
      return;
    }

    if (!isAddress(createForm.rewardToken)) {
      toast({
        title: "Create campaign",
        description: "Reward token address is invalid.",
        variant: "destructive",
      });
      return;
    }

    if (!createForm.totalBudget) {
      toast({
        title: "Create campaign",
        description: "Total budget is required.",
        variant: "destructive",
      });
      return;
    }

    const startAtSeconds = Math.floor(new Date(createForm.startAt).getTime() / 1000);
    const endAtSeconds = Math.floor(new Date(createForm.endAt).getTime() / 1000);

    if (!Number.isFinite(startAtSeconds) || !Number.isFinite(endAtSeconds)) {
      toast({
        title: "Create campaign",
        description: "Start and end dates are required.",
        variant: "destructive",
      });
      return;
    }

    if (startAtSeconds >= endAtSeconds) {
      toast({
        title: "Create campaign",
        description: "Start date must be before end date.",
        variant: "destructive",
      });
      return;
    }

    const payoutMode = Number(createForm.payoutMode);
    const verificationMode = Number(createForm.verificationMode);

    if (payoutMode === 0 && !createForm.fixedRewardAmount) {
      toast({
        title: "Create campaign",
        description: "Fixed reward amount is required for fixed payout mode.",
        variant: "destructive",
      });
      return;
    }

    const rulesHash = createForm.rulesHash
      ? createForm.rulesHash
      : createForm.rulesText
        ? id(createForm.rulesText)
        : ZeroHash;

    const eligibilityRoot = createForm.eligibilityRoot || ZeroHash;
    const verifierGroupId = createForm.verifierGroupId || ZeroHash;

    if (!isHexString(rulesHash, 32)) {
      toast({
        title: "Create campaign",
        description: "Rules hash must be a 32-byte hex value.",
        variant: "destructive",
      });
      return;
    }

    if (!isHexString(eligibilityRoot, 32) || !isHexString(verifierGroupId, 32)) {
      toast({
        title: "Create campaign",
        description: "Eligibility root and verifier group id must be 32-byte hex values.",
        variant: "destructive",
      });
      return;
    }

    setCreateLoading(true);
    try {
      await ensureNetwork();

      const signer = await provider.getSigner();
      const token = getErc20Contract(createForm.rewardToken, signer);
      const decimals = await token.decimals();

      const totalBudget = parseUnits(createForm.totalBudget, decimals);
      const fixedRewardAmount =
        payoutMode === 0
          ? parseUnits(createForm.fixedRewardAmount || "0", decimals)
          : 0n;

      const maxWinners = Number(createForm.maxWinners);
      if (!Number.isFinite(maxWinners) || maxWinners <= 0) {
        throw new Error("Max winners must be greater than 0.");
      }

      const factory = getFactoryContract(signer);
      const tx = await factory.createCampaign({
        rewardToken: createForm.rewardToken,
        totalBudget,
        fixedRewardAmount,
        startAt: BigInt(startAtSeconds),
        endAt: BigInt(endAtSeconds),
        maxWinners,
        verificationMode,
        payoutMode,
        rulesHash,
        eligibilityRoot,
        verifierGroupId,
        proofNonTransferable: createForm.proofNonTransferable,
      });

      const receipt = await tx.wait();
      if (receipt?.logs?.length) {
        for (const log of receipt.logs) {
          try {
            const parsed = factory.interface.parseLog(log);
            if (parsed?.name === "CampaignCreated") {
              setCreatedCampaignId(parsed.args.campaignId.toString());
              setCreatedCampaignAddress(parsed.args.campaign);
              break;
            }
          } catch {
            // ignore unrelated logs
          }
        }
      }

      toast({
        title: "Campaign created",
        description: `Transaction ${tx.hash} confirmed.`,
      });
    } catch (error) {
      toast({
        title: "Create failed",
        description: (error as Error).message,
        variant: "destructive",
      });
    } finally {
      setCreateLoading(false);
    }
  };

  const handleFundCampaign = async () => {
    if (!provider || !account) {
      toast({
        title: "Core Wallet",
        description: "Connect Core Wallet first.",
        variant: "destructive",
      });
      return;
    }

    if (!isAddress(fundAddress)) {
      toast({
        title: "Fund campaign",
        description: "Enter a valid campaign address.",
        variant: "destructive",
      });
      return;
    }

    setFundLoading(true);
    try {
      await ensureNetwork();

      const signer = await provider.getSigner();
      const campaign = getCampaignContract(fundAddress, signer);
      const config = await campaign.config();

      const token = getErc20Contract(config.rewardToken, signer);
      const [decimals, symbol, allowance] = await Promise.all([
        token.decimals(),
        token.symbol(),
        token.allowance(account, CONTRACT_ADDRESSES.escrowVault),
      ]);

      const totalBudget = config.totalBudget as bigint;

      if (allowance < totalBudget) {
        const approveTx = await token.approve(CONTRACT_ADDRESSES.escrowVault, totalBudget);
        await approveTx.wait();
      }

      const fundTx = await campaign.fundCampaign();
      await fundTx.wait();

      toast({
        title: "Campaign funded",
        description: `Funded ${formatUnits(totalBudget, decimals)} ${symbol}.`,
      });
    } catch (error) {
      toast({
        title: "Funding failed",
        description: (error as Error).message,
        variant: "destructive",
      });
    } finally {
      setFundLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-mono">Core Wallet</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="text-sm text-muted-foreground">
            Network: {DEFAULT_NETWORK.name} (chainId {DEFAULT_NETWORK.chainId})
          </div>
          <div className="text-sm">
            Status:{" "}
            {isInstalled ? (account ? "Connected" : "Not connected") : "Not installed"}
          </div>
          <div className="text-xs text-muted-foreground break-all">
            Account: {account ?? "-"}
          </div>
          {networkMismatch && (
            <div className="text-xs text-orange-500">
              Wrong network detected. Switch to {DEFAULT_NETWORK.name}.
            </div>
          )}
          <Button onClick={handleConnect} disabled={isConnecting}>
            {account ? "Reconnect" : "Connect Core Wallet"}
          </Button>
          {networkMismatch && (
            <Button variant="outline" onClick={ensureNetwork} disabled={isConnecting}>
              Switch network
            </Button>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-mono">Factory Read</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm text-muted-foreground break-all">
              Factory: {CONTRACT_ADDRESSES.factory}
            </div>
            <Button onClick={handleLoadFactory} disabled={!canInteract || readLoading}>
              Load next campaign id
            </Button>
            <div className="text-sm">Next campaign id: {factoryNextId}</div>

            <div className="space-y-2">
              <Label htmlFor="campaign-id">Lookup campaign by id</Label>
              <Input
                id="campaign-id"
                value={campaignLookupId}
                onChange={(event) => setCampaignLookupId(event.target.value)}
                placeholder="1"
              />
              <Button onClick={handleLookupCampaign} disabled={!canInteract || readLoading}>
                Lookup campaign
              </Button>
              <div className="text-xs text-muted-foreground break-all">
                Campaign address: {campaignLookupAddress}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-mono">Campaign Read</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="campaign-address">Campaign address</Label>
              <Input
                id="campaign-address"
                value={campaignAddress}
                onChange={(event) => setCampaignAddress(event.target.value)}
                placeholder="0x..."
              />
              <Button onClick={handleLoadCampaignConfig} disabled={!canInteract || readLoading}>
                Load campaign config
              </Button>
            </div>

            {campaignConfig && (
              <div className="space-y-2 text-xs text-muted-foreground">
                <div>Campaign id: {campaignConfig.campaignId}</div>
                <div>Sponsor: {campaignConfig.sponsor}</div>
                <div>Token: {campaignConfig.rewardToken}</div>
                <div>
                  Budget: {campaignConfig.totalBudget} {campaignConfig.tokenSymbol}
                </div>
                <div>
                  Fixed reward: {campaignConfig.fixedRewardAmount} {campaignConfig.tokenSymbol}
                </div>
                <div>Max winners: {campaignConfig.maxWinners}</div>
                <div>Start: {campaignConfig.startAt}</div>
                <div>End: {campaignConfig.endAt}</div>
                <div>Fee (bps): {campaignConfig.protocolFeeBps}</div>
                <div>Verification mode: {campaignConfig.verificationMode}</div>
                <div>Payout mode: {campaignConfig.payoutMode}</div>
                <div>Status: {campaignConfig.status}</div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-mono">Create Campaign</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reward-token">Reward token address</Label>
              <Input
                id="reward-token"
                value={createForm.rewardToken}
                onChange={(event) =>
                  setCreateForm((prev) => ({ ...prev, rewardToken: event.target.value }))
                }
                placeholder="0x..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="total-budget">Total budget</Label>
                <Input
                  id="total-budget"
                  value={createForm.totalBudget}
                  onChange={(event) =>
                    setCreateForm((prev) => ({ ...prev, totalBudget: event.target.value }))
                  }
                  placeholder="1000"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fixed-reward">Fixed reward (if fixed)</Label>
                <Input
                  id="fixed-reward"
                  value={createForm.fixedRewardAmount}
                  onChange={(event) =>
                    setCreateForm((prev) => ({ ...prev, fixedRewardAmount: event.target.value }))
                  }
                  placeholder="100"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="start-at">Start at</Label>
                <Input
                  id="start-at"
                  type="datetime-local"
                  value={createForm.startAt}
                  onChange={(event) =>
                    setCreateForm((prev) => ({ ...prev, startAt: event.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end-at">End at</Label>
                <Input
                  id="end-at"
                  type="datetime-local"
                  value={createForm.endAt}
                  onChange={(event) =>
                    setCreateForm((prev) => ({ ...prev, endAt: event.target.value }))
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="max-winners">Max winners</Label>
              <Input
                id="max-winners"
                value={createForm.maxWinners}
                onChange={(event) =>
                  setCreateForm((prev) => ({ ...prev, maxWinners: event.target.value }))
                }
                placeholder="3"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Verification mode</Label>
                <Select
                  value={createForm.verificationMode}
                  onValueChange={(value) =>
                    setCreateForm((prev) => ({ ...prev, verificationMode: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select mode" />
                  </SelectTrigger>
                  <SelectContent>
                    {VERIFICATION_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Payout mode</Label>
                <Select
                  value={createForm.payoutMode}
                  onValueChange={(value) =>
                    setCreateForm((prev) => ({ ...prev, payoutMode: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select payout" />
                  </SelectTrigger>
                  <SelectContent>
                    {PAYOUT_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="rules-text">Rules text (optional)</Label>
              <Textarea
                id="rules-text"
                value={createForm.rulesText}
                onChange={(event) =>
                  setCreateForm((prev) => ({ ...prev, rulesText: event.target.value }))
                }
                placeholder="Human-readable rules..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="rules-hash">Rules hash override (bytes32)</Label>
              <Input
                id="rules-hash"
                value={createForm.rulesHash}
                onChange={(event) =>
                  setCreateForm((prev) => ({ ...prev, rulesHash: event.target.value }))
                }
                placeholder="0x..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="eligibility-root">Eligibility root (bytes32)</Label>
                <Input
                  id="eligibility-root"
                  value={createForm.eligibilityRoot}
                  onChange={(event) =>
                    setCreateForm((prev) => ({ ...prev, eligibilityRoot: event.target.value }))
                  }
                  placeholder="0x..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="verifier-group">Verifier group id (bytes32)</Label>
                <Input
                  id="verifier-group"
                  value={createForm.verifierGroupId}
                  onChange={(event) =>
                    setCreateForm((prev) => ({ ...prev, verifierGroupId: event.target.value }))
                  }
                  placeholder="0x..."
                />
              </div>
            </div>

            <div className="flex items-center gap-2 text-sm">
              <input
                id="non-transferable"
                type="checkbox"
                checked={createForm.proofNonTransferable}
                onChange={(event) =>
                  setCreateForm((prev) => ({
                    ...prev,
                    proofNonTransferable: event.target.checked,
                  }))
                }
              />
              <Label htmlFor="non-transferable">Proof non-transferable</Label>
            </div>

            <Button
              onClick={handleCreateCampaign}
              disabled={!canInteract || createLoading}
            >
              Create campaign
            </Button>

            <div className="text-xs text-muted-foreground break-all">
              Created campaign id: {createdCampaignId}
            </div>
            <div className="text-xs text-muted-foreground break-all">
              Created campaign address: {createdCampaignAddress}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-mono">Fund Campaign</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm text-muted-foreground break-all">
              Escrow vault: {CONTRACT_ADDRESSES.escrowVault}
            </div>
            <div className="space-y-2">
              <Label htmlFor="fund-campaign">Campaign address</Label>
              <Input
                id="fund-campaign"
                value={fundAddress}
                onChange={(event) => setFundAddress(event.target.value)}
                placeholder="0x..."
              />
            </div>
            <Button onClick={handleFundCampaign} disabled={!canInteract || fundLoading}>
              Approve &amp; fund
            </Button>
            <div className="text-xs text-muted-foreground">
              This will approve the vault and call fundCampaign().
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
