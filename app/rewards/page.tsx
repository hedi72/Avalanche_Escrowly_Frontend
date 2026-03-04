'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { JsonRpcProvider, formatUnits } from 'ethers';
import { useSession } from 'next-auth/react';
import { AlertCircle, CheckCircle2, Gift, Shield, Wallet as WalletIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useCoreWallet } from '@/hooks/use-core-wallet';
import { WalletCard } from '@/components/rewards/wallet-card';
import { WalletLinkModal } from '@/components/rewards/wallet-link-modal';
import { WithdrawConfirmationModal } from '@/components/rewards/withdraw-confirmation-modal';
import { getErc20Contract } from '@/lib/avalanche/contracts';
import { CAMPAIGN_STATUS, readClaimStatus } from '@/lib/avalanche/mvp';
import { DEFAULT_RPC_URL } from '@/lib/avalanche/config';
import { ClaimableCampaign } from '@/lib/types';
import { QuestService } from '@/lib/services';

type ClaimableCampaignView = ClaimableCampaign & {
  rewardDisplay: string;
  rewardTokenSymbol: string;
  onChainStatus: number | null;
  approvalExists: boolean;
  hasClaimedOnChain: boolean;
  hasProof: boolean;
};

const STATUS_LABELS: Record<number, string> = {
  [CAMPAIGN_STATUS.Created]: 'Created',
  [CAMPAIGN_STATUS.Funded]: 'Funded',
  [CAMPAIGN_STATUS.Active]: 'Active',
  [CAMPAIGN_STATUS.Finalized]: 'Finalized',
  [CAMPAIGN_STATUS.Cancelled]: 'Cancelled',
  [CAMPAIGN_STATUS.Paused]: 'Paused',
};

export default function RewardsPage() {
  const { data: session } = useSession();
  const { toast } = useToast();
  const { account, provider, connect, ensureNetwork } = useCoreWallet();
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [selectedClaim, setSelectedClaim] = useState<ClaimableCampaignView | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [linkedWallet, setLinkedWallet] = useState<string | null>(null);
  const [claimableCampaigns, setClaimableCampaigns] = useState<ClaimableCampaignView[]>([]);

  const fallbackProvider = useMemo(() => new JsonRpcProvider(DEFAULT_RPC_URL), []);

  const loadClaimableCampaigns = useCallback(async () => {
    if (!session?.user?.token) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const [walletResult, campaigns] = await Promise.all([
        QuestService.getEvmWallet(session.user.token),
        QuestService.getClaimableCampaigns(session.user.token),
      ]);
      setLinkedWallet(walletResult.walletAddress);

      const readProvider = provider ?? fallbackProvider;
      const enriched = await Promise.all(
        campaigns.map(async (campaign) => {
          let rewardDisplay = campaign.rewardAmountAtomic ?? '0';
          let rewardTokenSymbol = 'TOKEN';
          let onChainStatus: number | null = null;
          let approvalExists = false;
          let hasClaimedOnChain = false;
          let hasProof = false;

          try {
            if (campaign.rewardTokenAddress) {
              const token = getErc20Contract(campaign.rewardTokenAddress, readProvider);
              const [decimals, symbol] = await Promise.all([token.decimals(), token.symbol()]);
              rewardTokenSymbol = symbol;
              if (campaign.rewardAmountAtomic) {
                rewardDisplay = formatUnits(campaign.rewardAmountAtomic, decimals);
              }
            }

            if (walletResult.walletAddress) {
              const claimStatus = await readClaimStatus(
                readProvider,
                campaign.campaignAddress,
                walletResult.walletAddress
              );
              onChainStatus = claimStatus.status;
              approvalExists = claimStatus.approvalExists;
              hasClaimedOnChain = claimStatus.hasClaimed;
              hasProof = claimStatus.hasProof;
            }
          } catch (readError) {
            console.error('Failed to enrich claimable campaign:', campaign.campaignAddress, readError);
          }

          return {
            ...campaign,
            rewardDisplay,
            rewardTokenSymbol,
            onChainStatus,
            approvalExists,
            hasClaimedOnChain,
            hasProof,
          };
        })
      );

      setClaimableCampaigns(enriched);
    } catch (error) {
      console.error('Failed to load claimable campaigns:', error);
      toast({
        title: 'Rewards load failed',
        description: error instanceof Error ? error.message : 'Could not load claimable campaigns.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [fallbackProvider, provider, session?.user?.token, toast]);

  useEffect(() => {
    void loadClaimableCampaigns();
  }, [loadClaimableCampaigns]);

  const handleConnectWallet = async () => {
    try {
      await connect();
      await ensureNetwork();
      setShowWalletModal(true);
    } catch (error) {
      toast({
        title: 'Core Wallet',
        description: error instanceof Error ? error.message : 'Could not connect Core Wallet.',
        variant: 'destructive',
      });
    }
  };

  const linkedWalletMatchesConnectedWallet =
    !!linkedWallet && !!account && linkedWallet.toLowerCase() === account.toLowerCase();

  const claimedCount = claimableCampaigns.filter((item) => item.hasClaimedOnChain).length;
  const readyToClaimCount = claimableCampaigns.filter((item) => item.approvalExists && !item.hasClaimedOnChain).length;

  return (
    <div className="container mx-auto space-y-8 px-4 py-8">
      <div className="space-y-4 text-center">
        <div className="flex items-center justify-center gap-2">
          <Gift className="h-8 w-8 text-red-500" />
          <h1 className="bg-gradient-to-r from-red-500 via-orange-500 to-red-500 bg-clip-text text-4xl font-bold font-mono text-transparent">
            [AVALANCHE REWARDS]
          </h1>
        </div>
        <p className="mx-auto max-w-3xl font-mono text-sm text-muted-foreground">
          This page is the direct-verifier MVP claim flow. The backend marks you as a winner, then you claim on-chain with the same Avalanche wallet.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="border-2 border-dashed border-red-500/30 bg-gradient-to-br from-red-500/10 to-orange-500/10 backdrop-blur-sm">
          <CardHeader className="text-center pb-3">
            <CardTitle className="flex items-center justify-center gap-2 font-mono text-red-500">
              <Gift className="h-5 w-5" />
              CLAIM OVERVIEW
            </CardTitle>
            <CardDescription className="font-mono text-xs">
              On-chain claim status for the current linked Avalanche wallet
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-lg border border-dashed border-orange-500/30 bg-orange-500/10 p-4">
                <div className="text-3xl font-bold font-mono text-orange-500">{readyToClaimCount}</div>
                <div className="font-mono text-xs text-muted-foreground">READY TO CLAIM</div>
              </div>
              <div className="rounded-lg border border-dashed border-green-500/30 bg-green-500/10 p-4">
                <div className="text-3xl font-bold font-mono text-green-500">{claimedCount}</div>
                <div className="font-mono text-xs text-muted-foreground">ALREADY CLAIMED</div>
              </div>
            </div>

            <div className="rounded-lg border border-dashed border-border bg-card p-4">
              <div className="mb-2 flex items-center justify-between gap-2">
                <span className="font-mono text-xs text-muted-foreground">Linked winner wallet</span>
                <Badge variant="outline" className="font-mono text-xs">
                  {linkedWallet ? 'Backend saved' : 'Missing'}
                </Badge>
              </div>
              <div className="break-all font-mono text-xs sm:text-sm">
                {linkedWallet ?? 'No Avalanche wallet linked yet.'}
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button onClick={handleConnectWallet} variant="outline" className="font-mono text-xs">
                  <WalletIcon className="mr-2 h-4 w-4" />
                  Connect Core Wallet
                </Button>
                <Button onClick={() => setShowWalletModal(true)} className="font-mono text-xs">
                  Save Avalanche Wallet
                </Button>
              </div>
            </div>

            {linkedWallet && !linkedWalletMatchesConnectedWallet && (
              <div className="flex items-start gap-2 rounded-lg border border-orange-500/30 bg-orange-500/10 p-3">
                <AlertCircle className="mt-0.5 h-4 w-4 text-orange-500" />
                <p className="text-xs font-mono text-orange-600 dark:text-orange-400">
                  The connected Core Wallet does not match the wallet stored in the backend. Claims will fail unless they match.
                </p>
              </div>
            )}

            {linkedWallet && linkedWalletMatchesConnectedWallet && (
              <div className="flex items-start gap-2 rounded-lg border border-green-500/30 bg-green-500/10 p-3">
                <CheckCircle2 className="mt-0.5 h-4 w-4 text-green-500" />
                <p className="text-xs font-mono text-green-700 dark:text-green-300">
                  The connected Core Wallet matches the wallet the verifier approved.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <WalletCard onLinkWallet={() => setShowWalletModal(true)} />
      </div>

      <div className="space-y-4">
        <div className="rounded-lg border border-dashed border-blue-500/30 bg-blue-500/10 p-4">
          <div className="mb-2 flex items-center gap-2">
            <Shield className="h-5 w-5 text-blue-500" />
            <h2 className="font-mono text-sm font-semibold">How the MVP claim flow works</h2>
          </div>
          <p className="font-mono text-xs text-muted-foreground">
            Submit the quest off-chain, get validated by the verifier, wait for the backend to submit `approveWinner(...)`, then claim from this page with `claimDirect()`. Your proof is minted during the same on-chain claim.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {isLoading ? (
            <Card>
              <CardContent className="py-8 text-center font-mono text-sm text-muted-foreground">
                Loading claimable campaigns...
              </CardContent>
            </Card>
          ) : claimableCampaigns.length === 0 ? (
            <Card>
              <CardContent className="space-y-2 py-8 text-center">
                <p className="font-mono text-sm text-muted-foreground">No claimable campaigns yet.</p>
                <p className="font-mono text-xs text-muted-foreground">
                  You will see items here after a verifier validates your submission and the on-chain approval is successfully submitted.
                </p>
              </CardContent>
            </Card>
          ) : (
            claimableCampaigns.map((campaign) => {
              const canClaim =
                !!linkedWallet &&
                linkedWalletMatchesConnectedWallet &&
                campaign.approvalExists &&
                !campaign.hasClaimedOnChain &&
                (campaign.onChainStatus === CAMPAIGN_STATUS.Active || campaign.onChainStatus === CAMPAIGN_STATUS.Finalized);

              return (
                <Card key={campaign.completionId} className="border-2 border-dashed border-red-500/20 bg-gradient-to-br from-red-500/5 to-orange-500/5">
                  <CardHeader>
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="space-y-2">
                        <CardTitle className="font-mono text-lg">{campaign.title}</CardTitle>
                        <CardDescription className="font-mono text-xs">
                          Quest #{campaign.questId} · Campaign #{campaign.campaignId}
                        </CardDescription>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="outline" className="font-mono text-xs">
                          {campaign.rewardDisplay} {campaign.rewardTokenSymbol}
                        </Badge>
                        <Badge variant="outline" className="font-mono text-xs">
                          {campaign.onChainStatus !== null ? STATUS_LABELS[campaign.onChainStatus] : 'Unknown'}
                        </Badge>
                        <Badge
                          className={
                            campaign.hasProof
                              ? 'bg-green-500/20 text-green-700 dark:text-green-300 border-green-500/30 font-mono text-xs'
                              : 'font-mono text-xs'
                          }
                        >
                          {campaign.hasProof ? 'Proof minted' : 'Proof pending'}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                      <div className="rounded-lg border border-border bg-card p-3">
                        <p className="font-mono text-xs text-muted-foreground">Campaign address</p>
                        <p className="break-all font-mono text-xs">{campaign.campaignAddress}</p>
                      </div>
                      <div className="rounded-lg border border-border bg-card p-3">
                        <p className="font-mono text-xs text-muted-foreground">Verifier approval</p>
                        <p className="font-mono text-xs">
                          {campaign.approvalExists ? 'Stored on-chain' : campaign.approvalStatus ?? 'Not available'}
                        </p>
                        {campaign.approvalTxHash && (
                          <p className="mt-1 break-all font-mono text-[11px] text-muted-foreground">
                            {campaign.approvalTxHash}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <Badge className={campaign.hasClaimedOnChain ? 'bg-green-500/20 text-green-700 dark:text-green-300 border-green-500/30 font-mono text-xs' : 'font-mono text-xs'}>
                        {campaign.hasClaimedOnChain ? 'Claimed' : 'Not claimed'}
                      </Badge>
                      <Badge className={campaign.approvalExists ? 'bg-green-500/20 text-green-700 dark:text-green-300 border-green-500/30 font-mono text-xs' : 'bg-orange-500/20 text-orange-700 dark:text-orange-300 border-orange-500/30 font-mono text-xs'}>
                        {campaign.approvalExists ? 'Ready from verifier side' : 'Waiting for verifier'}
                      </Badge>
                    </div>

                    <div className="flex flex-col gap-2 sm:flex-row">
                      <Button
                        className="font-mono"
                        disabled={!canClaim}
                        onClick={() => setSelectedClaim(campaign)}
                      >
                        Claim Reward
                      </Button>
                      {!linkedWallet && (
                        <Button variant="outline" className="font-mono" onClick={() => setShowWalletModal(true)}>
                          Link Avalanche Wallet
                        </Button>
                      )}
                    </div>

                    {!canClaim && (
                      <p className="font-mono text-xs text-muted-foreground">
                        {campaign.hasClaimedOnChain
                          ? 'This reward is already claimed.'
                          : !linkedWallet
                            ? 'Link your Avalanche wallet before claiming.'
                            : !linkedWalletMatchesConnectedWallet
                              ? 'Connect the same wallet that is stored in the backend.'
                              : !campaign.approvalExists
                                ? 'The verifier approval is not available on-chain yet.'
                                : 'Campaign must be Active or Finalized before claiming.'}
                      </p>
                    )}
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>

      <WalletLinkModal
        open={showWalletModal}
        onOpenChange={setShowWalletModal}
        onWalletLinked={() => {
          void loadClaimableCampaigns();
        }}
      />

      {selectedClaim && (
        <WithdrawConfirmationModal
          open={!!selectedClaim}
          onOpenChange={(open) => {
            if (!open) {
              setSelectedClaim(null);
            }
          }}
          campaignTitle={selectedClaim.title}
          campaignAddress={selectedClaim.campaignAddress}
          rewardDisplay={selectedClaim.rewardDisplay}
          rewardTokenSymbol={selectedClaim.rewardTokenSymbol}
          winnerWalletAddress={linkedWallet ?? selectedClaim.winnerWalletAddress ?? ''}
          onConfirm={async () => {
            await loadClaimableCampaigns();
            setSelectedClaim(null);
          }}
        />
      )}
    </div>
  );
}
