'use client';

import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle2, Loader2, Shield, Wallet } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useToast } from '@/hooks/use-toast';
import { useCoreWallet } from '@/hooks/use-core-wallet';
import { DEFAULT_NETWORK } from '@/lib/avalanche/config';
import { QuestService } from '@/lib/services';

interface WalletLinkModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onWalletLinked: () => void;
}

export function WalletLinkModal({ open, onOpenChange, onWalletLinked }: WalletLinkModalProps) {
  const { data: session } = useSession();
  const { toast } = useToast();
  const { isInstalled, isConnecting, account, chainId, connect, ensureNetwork } = useCoreWallet();
  const [isSaving, setIsSaving] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [linkedWallet, setLinkedWallet] = useState<string | null>(null);

  const hasWrongNetwork = chainId !== null && chainId !== DEFAULT_NETWORK.chainId;

  useEffect(() => {
    if (!open || !session?.user?.token) {
      return;
    }

    QuestService.getEvmWallet(session.user.token)
      .then((result) => setLinkedWallet(result.walletAddress))
      .catch(() => setLinkedWallet(null));
  }, [open, session?.user?.token]);

  const handleConnect = async () => {
    setError(null);
    try {
      await connect();
      await ensureNetwork();
    } catch (connectError) {
      setError(connectError instanceof Error ? connectError.message : 'Failed to connect Core Wallet.');
    }
  };

  const handleLinkWallet = async () => {
    if (!account) {
      setError('Connect Core Wallet before linking your Avalanche address.');
      return;
    }
    if (!session?.user?.token) {
      setError('You must be logged in to link a wallet.');
      return;
    }

    setIsSaving(true);
    setError(null);
    try {
      if (hasWrongNetwork) {
        await ensureNetwork();
      }

      const result = await QuestService.updateEvmWallet(account, session.user.token);
      setLinkedWallet(result.walletAddress);
      setIsSuccess(true);
      toast({
        title: 'Avalanche wallet linked',
        description: 'Your Core Wallet address is now ready for reward claims.',
      });

      window.setTimeout(() => {
        setIsSuccess(false);
        onWalletLinked();
        onOpenChange(false);
      }, 1200);
    } catch (linkError) {
      setError(linkError instanceof Error ? linkError.message : 'Failed to link your Avalanche wallet.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[540px]">
        <DialogHeader className="space-y-2">
          <DialogTitle className="flex items-center gap-2 font-mono text-lg sm:text-xl">
            <Wallet className="w-5 h-5 text-red-500" />
            Link Avalanche Wallet
          </DialogTitle>
          <DialogDescription className="font-mono text-xs">
            Connect your Core Wallet and save the same address in the backend so verifier approvals and claims use one wallet.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="rounded-lg border border-dashed border-red-500/30 bg-red-500/5 p-4">
            <div className="mb-2 flex items-center gap-2">
              <Shield className="w-4 h-4 text-red-500" />
              <span className="font-mono text-sm font-semibold">MVP Wallet Rule</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Use the same Avalanche wallet for sponsor actions, winner approvals visibility, reward claims, and proof ownership.
            </p>
          </div>

          <div className="space-y-2 rounded-lg border border-border p-4">
            <div className="flex items-center justify-between gap-3">
              <span className="font-mono text-xs text-muted-foreground">Target network</span>
              <Badge variant="outline" className="font-mono text-xs">
                {DEFAULT_NETWORK.name}
              </Badge>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="font-mono text-xs text-muted-foreground">Core Wallet</span>
              <Badge className={isInstalled ? 'font-mono text-xs' : 'bg-destructive/20 text-destructive font-mono text-xs'}>
                {isInstalled ? 'Installed' : 'Not installed'}
              </Badge>
            </div>
            <div className="space-y-1">
              <span className="font-mono text-xs text-muted-foreground">Connected address</span>
              <div className="break-all rounded-md bg-muted/40 px-3 py-2 font-mono text-xs">
                {account ?? 'Not connected'}
              </div>
            </div>
            <div className="space-y-1">
              <span className="font-mono text-xs text-muted-foreground">Backend linked address</span>
              <div className="break-all rounded-md bg-muted/40 px-3 py-2 font-mono text-xs">
                {linkedWallet ?? 'No Avalanche wallet linked yet'}
              </div>
            </div>
          </div>

          {hasWrongNetwork && (
            <div className="rounded-lg border border-orange-500/30 bg-orange-500/10 p-3 text-xs text-orange-500">
              Core Wallet is connected to the wrong network. Switch to {DEFAULT_NETWORK.name} before linking.
            </div>
          )}

          {error && (
            <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3">
              <AlertCircle className="mt-0.5 h-4 w-4 text-destructive" />
              <p className="text-xs text-destructive">{error}</p>
            </div>
          )}

          {isSuccess && (
            <div className="flex items-start gap-2 rounded-lg border border-green-500/30 bg-green-500/10 p-3">
              <CheckCircle2 className="mt-0.5 h-4 w-4 text-green-500" />
              <p className="text-xs text-green-600 dark:text-green-400">
                Avalanche wallet linked successfully.
              </p>
            </div>
          )}

          <div className="flex flex-col gap-2 sm:flex-row">
            <Button onClick={handleConnect} variant="outline" className="font-mono" disabled={isConnecting || isSaving}>
              {isConnecting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Connecting...
                </>
              ) : (
                'Connect Core Wallet'
              )}
            </Button>
            <Button onClick={handleLinkWallet} className="font-mono" disabled={!account || isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Link This Address'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
