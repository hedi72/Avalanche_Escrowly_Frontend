'use client';

import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, CheckCircle2, Copy, ExternalLink, Plus, Wallet } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useCoreWallet } from '@/hooks/use-core-wallet';
import { DEFAULT_NETWORK } from '@/lib/avalanche/config';
import { QuestService } from '@/lib/services';

interface WalletCardProps {
  onLinkWallet: () => void;
}

export function WalletCard({ onLinkWallet }: WalletCardProps) {
  const { data: session } = useSession();
  const { account, chainId } = useCoreWallet();
  const [linkedWallet, setLinkedWallet] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!session?.user?.token) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    QuestService.getEvmWallet(session.user.token)
      .then((result) => setLinkedWallet(result.walletAddress))
      .catch(() => setLinkedWallet(null))
      .finally(() => setIsLoading(false));
  }, [session?.user?.token]);

  const handleCopy = async () => {
    if (!linkedWallet) {
      return;
    }
    await navigator.clipboard.writeText(linkedWallet);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  };

  const explorerUrl = linkedWallet ? `${DEFAULT_NETWORK.blockExplorerUrls[0]}/address/${linkedWallet}` : null;
  const isConnectedWalletLinked =
    !!account && !!linkedWallet && account.toLowerCase() === linkedWallet.toLowerCase();

  return (
    <Card className="border-2 border-dashed border-red-500/30 bg-gradient-to-br from-red-500/10 to-orange-500/10 backdrop-blur-sm">
      <CardHeader className="text-center pb-3">
        <CardTitle className="flex items-center justify-center gap-2 font-mono text-red-500">
          <Wallet className="w-5 h-5" />
          AVALANCHE WALLET
        </CardTitle>
        <CardDescription className="font-mono text-xs">
          The wallet used for direct reward claims and proof ownership
        </CardDescription>
      </CardHeader>
      <CardContent className="pb-6">
        {isLoading ? (
          <div className="py-6 text-center text-sm font-mono text-muted-foreground">Loading wallet...</div>
        ) : !linkedWallet ? (
          <div className="space-y-3 py-4 text-center">
            <div className="flex justify-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-500/20">
                <Wallet className="h-7 w-7 text-red-500" />
              </div>
            </div>
            <div className="space-y-1">
              <p className="font-mono text-sm text-muted-foreground">No Avalanche wallet linked</p>
              <p className="font-mono text-xs text-muted-foreground/70">
                Link your Core Wallet before claiming rewards.
              </p>
            </div>
            <Button onClick={onLinkWallet} className="font-mono">
              <Plus className="mr-2 h-4 w-4" />
              Link Avalanche Wallet
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="space-y-2 rounded-lg border border-border bg-card p-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge className="font-mono text-xs">Core Wallet</Badge>
                <Badge className="bg-green-500/20 text-green-700 dark:text-green-300 border-green-500/30 font-mono text-xs">
                  Linked
                </Badge>
                {chainId === DEFAULT_NETWORK.chainId && (
                  <Badge variant="outline" className="font-mono text-xs">
                    {DEFAULT_NETWORK.name}
                  </Badge>
                )}
              </div>

              <div className="space-y-1">
                <p className="font-mono text-xs text-muted-foreground">Linked address</p>
                <p className="break-all font-mono text-xs sm:text-sm font-semibold">{linkedWallet}</p>
              </div>

              <div className="rounded-md bg-muted/40 px-3 py-2 text-xs font-mono">
                {isConnectedWalletLinked
                  ? 'Connected Core Wallet matches the linked claim wallet.'
                  : account
                    ? 'Connected Core Wallet does not match the linked claim wallet.'
                    : 'Connect Core Wallet to confirm it matches the linked claim wallet.'}
              </div>

              <div className="flex flex-col gap-2 sm:flex-row">
                <Button variant="outline" size="sm" className="font-mono text-xs" onClick={handleCopy}>
                  {copied ? (
                    <>
                      <Check className="mr-2 h-3 w-3" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="mr-2 h-3 w-3" />
                      Copy address
                    </>
                  )}
                </Button>
                {explorerUrl && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="font-mono text-xs"
                    onClick={() => window.open(explorerUrl, '_blank')}
                  >
                    <ExternalLink className="mr-2 h-3 w-3" />
                    View on Snowtrace
                  </Button>
                )}
              </div>
            </div>

            <div className="flex items-start gap-2 rounded-lg border border-green-500/30 bg-green-500/10 p-3">
              <CheckCircle2 className="mt-0.5 h-4 w-4 text-green-500" />
              <p className="text-xs font-mono text-green-700 dark:text-green-300">
                This address is what the backend uses when the verifier approves you on-chain.
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
