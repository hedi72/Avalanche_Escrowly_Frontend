'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Wallet, Plus, CheckCircle2, ExternalLink, Copy, Check } from 'lucide-react';
import { QuestService } from '@/lib/services';
import { useSession } from 'next-auth/react';
import { Wallet as WalletType } from '@/lib/types';

interface WalletCardProps {
  onLinkWallet: () => void;
}

export function WalletCard({ onLinkWallet }: WalletCardProps) {
  const { data: session } = useSession();
  const [wallets, setWallets] = useState<WalletType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const loadWallets = async () => {
    try {
      setIsLoading(true);
      const token = session?.user?.token;
      const response = await QuestService.getWallets(token);
      if (response.success) {
        setWallets(response.wallets);
      }
    } catch (error) {
      console.error('Failed to load wallets:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (session?.user?.token) {
      loadWallets();
    }
  }, [session?.user?.token]);

  const handleCopyAccountId = async (accountId: string) => {
    try {
      await navigator.clipboard.writeText(accountId);
      setCopiedId(accountId);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (error) {
      console.error('Failed to copy account ID:', error);
    }
  };

  const openHashScan = (accountId: string) => {
    // Open HashScan for Hedera mainnet
    window.open(`https://hashscan.io/mainnet/account/${accountId}`, '_blank');
  };

  if (isLoading) {
    return (
      <Card className="border-2 border-dashed border-purple-500/30 bg-gradient-to-br from-purple-500/10 to-cyan-500/10 backdrop-blur-sm">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2 font-mono text-purple-400">
            <Wallet className="w-5 h-5 animate-pulse" />
            LINKED WALLET
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center py-6">
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-2 h-2 bg-cyan-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-2 border-dashed border-purple-500/30 bg-gradient-to-br from-purple-500/10 to-cyan-500/10 backdrop-blur-sm">
      <CardHeader className="text-center pb-3">
        <CardTitle className="flex items-center justify-center gap-2 font-mono text-purple-400">
          <Wallet className="w-5 h-5" />
          LINKED WALLET
        </CardTitle>
        <CardDescription className="font-mono text-xs">
          Manage your AssetGuard wallet for receiving rewards
        </CardDescription>
      </CardHeader>
      <CardContent className="pb-6">{wallets.length === 0 ? (
          <div className="text-center py-4 space-y-3">
            <div className="flex justify-center">
              <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-purple-500/20 flex items-center justify-center">
                <Wallet className="w-6 h-6 sm:w-8 sm:h-8 text-purple-400" />
              </div>
            </div>
            <div className="space-y-1">
              <p className="font-mono text-sm text-muted-foreground">No wallet linked yet</p>
              <p className="font-mono text-xs text-muted-foreground/70">
                Link your AssetGuard wallet to receive rewards
              </p>
            </div>
            <Button 
              onClick={onLinkWallet}
              className="w-full sm:w-auto font-mono"
            >
              <Plus className="w-4 h-4 mr-2" />
              Link AssetGuard Wallet
            </Button>
          </div>
        ) : (
          <div className="space-y-2 sm:space-y-3">
            {wallets.map((wallet) => (
              <div
                key={wallet.id}
                className="bg-card border border-border rounded-lg p-3 sm:p-4 space-y-3 hover:border-purple-500/50 transition-colors"
              >
                <div className="flex flex-col sm:flex-row items-start gap-3">
                  <div className="flex items-start gap-2 sm:gap-3 flex-1 min-w-0 w-full">
                    <div className="bg-green-500/20 rounded-full p-1.5 sm:p-2 flex-shrink-0">
                      <CheckCircle2 className="w-3 h-3 sm:w-4 sm:h-4 text-green-400" />
                    </div>
                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge className="bg-purple-500/30 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300 border-purple-600/40 dark:border-purple-500/30 font-mono text-xs">
                          AssetGuard
                        </Badge>
                        <Badge className="bg-green-500/30 dark:bg-green-500/20 text-green-700 dark:text-green-300 border-green-600/40 dark:border-green-500/30 font-mono text-xs">
                          Active
                        </Badge>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs font-mono text-muted-foreground">Account ID</p>
                        <p className="font-mono text-xs sm:text-sm font-semibold break-all">
                          {wallet.account_id}
                        </p>
                      </div>
                      <p className="text-xs font-mono text-muted-foreground">
                        Linked on {new Date(wallet.created_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 font-mono text-xs"
                    onClick={() => handleCopyAccountId(wallet.account_id)}
                  >
                    {copiedId === wallet.account_id ? (
                      <>
                        <Check className="w-3 h-3 mr-2" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3 mr-2" />
                        Copy ID
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 font-mono text-xs"
                    onClick={() => openHashScan(wallet.account_id)}
                  >
                    <ExternalLink className="w-3 h-3 mr-2" />
                    <span className="hidden sm:inline">View on HashScan</span>
                    <span className="sm:hidden">HashScan</span>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
