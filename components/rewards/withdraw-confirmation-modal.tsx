'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle2, Loader2, Wallet } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useCoreWallet } from '@/hooks/use-core-wallet';
import { DEFAULT_NETWORK } from '@/lib/avalanche/config';
import { claimDirectReward } from '@/lib/avalanche/mvp';

interface WithdrawConfirmationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  campaignTitle: string;
  campaignAddress: string;
  rewardDisplay: string;
  rewardTokenSymbol: string;
  winnerWalletAddress: string;
  onConfirm: () => Promise<void>;
}

export function WithdrawConfirmationModal({
  open,
  onOpenChange,
  campaignTitle,
  campaignAddress,
  rewardDisplay,
  rewardTokenSymbol,
  winnerWalletAddress,
  onConfirm,
}: WithdrawConfirmationModalProps) {
  const { toast } = useToast();
  const { provider, account, ensureNetwork } = useCoreWallet();
  const [isClaiming, setIsClaiming] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleClaim = async () => {
    if (!provider || !account) {
      setError('Connect Core Wallet before claiming.');
      return;
    }

    setIsClaiming(true);
    setError(null);
    try {
      await ensureNetwork();
      const result = await claimDirectReward(provider, campaignAddress);
      setTxHash(result.txHash);
      await onConfirm();
      toast({
        title: 'Reward claimed',
        description: 'The reward transaction was confirmed and the proof should now be mintable in your wallet view.',
      });
    } catch (claimError) {
      setError(claimError instanceof Error ? claimError.message : 'Claim failed.');
    } finally {
      setIsClaiming(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader className="space-y-2">
          <DialogTitle className="flex items-center gap-2 font-mono text-lg sm:text-xl">
            <Wallet className="w-5 h-5 text-green-500" />
            Claim Reward
          </DialogTitle>
          <DialogDescription className="font-mono text-xs">
            This will call <code>claimDirect()</code> on the campaign contract from your linked Avalanche wallet.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="rounded-lg border border-dashed border-green-500/30 bg-green-500/10 p-4">
            <div className="mb-2 flex items-center justify-between gap-3">
              <span className="font-mono text-xs text-muted-foreground">Campaign</span>
              <Badge variant="outline" className="font-mono text-xs">
                {DEFAULT_NETWORK.name}
              </Badge>
            </div>
            <p className="font-mono text-sm font-semibold">{campaignTitle}</p>
            <div className="mt-3 flex items-center gap-2">
              <span className="text-2xl font-bold font-mono text-green-600 dark:text-green-400">
                {rewardDisplay}
              </span>
              <Badge className="font-mono text-xs">{rewardTokenSymbol}</Badge>
            </div>
          </div>

          <div className="space-y-2 rounded-lg border border-border bg-card p-4">
            <p className="font-mono text-xs text-muted-foreground">Winner wallet</p>
            <p className="break-all font-mono text-xs">{winnerWalletAddress}</p>
            <p className="font-mono text-xs text-muted-foreground">Campaign address</p>
            <p className="break-all font-mono text-xs">{campaignAddress}</p>
          </div>

          {txHash && (
            <div className="flex items-start gap-2 rounded-lg border border-green-500/30 bg-green-500/10 p-3">
              <CheckCircle2 className="mt-0.5 h-4 w-4 text-green-500" />
              <div className="space-y-1">
                <p className="text-xs font-mono text-green-700 dark:text-green-300">
                  Claim transaction confirmed.
                </p>
                <p className="break-all text-xs font-mono text-green-700 dark:text-green-300">{txHash}</p>
              </div>
            </div>
          )}

          {error && (
            <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3">
              <AlertCircle className="mt-0.5 h-4 w-4 text-destructive" />
              <p className="text-xs font-mono text-destructive">{error}</p>
            </div>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" className="font-mono" onClick={() => onOpenChange(false)} disabled={isClaiming}>
            Close
          </Button>
          <Button className="font-mono" onClick={handleClaim} disabled={isClaiming}>
            {isClaiming ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Claiming...
              </>
            ) : (
              'Confirm Claim'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
