'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DollarSign, Gift, Wallet as WalletIcon, AlertCircle } from 'lucide-react';
import useStore from '@/lib/store';
import { WalletLinkModal } from '@/components/rewards/wallet-link-modal';
import { WalletCard } from '@/components/rewards/wallet-card';
import { WithdrawConfirmationModal } from '@/components/rewards/withdraw-confirmation-modal';
import { UserTransactionHistory } from '@/components/rewards/user-transaction-history';
import { useSession } from 'next-auth/react';
import { QuestService } from '@/lib/services';
import { useToast } from '@/hooks/use-toast';
import { Wallet as WalletType } from '@/lib/types';

export default function RewardsPage() {
  const { user, refreshUserProfile } = useStore();
  const { data: session } = useSession();
  const { toast } = useToast();
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [walletRefreshKey, setWalletRefreshKey] = useState(0);
  const [wallets, setWallets] = useState<WalletType[]>([]);
  const [isClaimingReward, setIsClaimingReward] = useState(false);
  const [claimThreshold, setClaimThreshold] = useState<number>(300); // Default 300 points

  // Use total_points as the primary source with fallback for backward compatibility
  const pointsBalance = user?.total_points ?? user?.points ?? 0;
  const conversionRate = 0.01; // $0.01 per point
  const dollarBalance = (pointsBalance * conversionRate).toFixed(2);

  // Refresh user data on component mount and when user changes
  useEffect(() => {
    if (user) {
      console.log('RewardsPage - Refreshing user profile data on mount/user change');
      refreshUserProfile();
    }
  }, [user?.id, refreshUserProfile]);

  // Refresh user data when tab becomes visible (user returns to app)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && user) {
        console.log('RewardsPage - Tab became visible, refreshing user data');
        refreshUserProfile();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [user, refreshUserProfile]);

  const handleWalletLinked = () => {
    // Trigger wallet card refresh and reload wallets
    setWalletRefreshKey(prev => prev + 1);
    loadWallets();
  };

  // Load wallets on component mount
  const loadWallets = async () => {
    try {
      const token = session?.user?.token;
      if (!token) return;

      const response = await QuestService.getWallets(token);
      if (response.success) {
        setWallets(response.wallets);
      }
    } catch (error) {
      console.error('Failed to load wallets:', error);
    }
  };

  // Load claim threshold
  const loadClaimOptions = async () => {
    try {
      const token = session?.user?.token;
      if (!token) return;

      const response = await QuestService.getClaimOptions(token);
      if (response.success && response.options) {
        setClaimThreshold(response.options.threshold);
      }
    } catch (error) {
      console.error('Failed to load claim options:', error);
      // Keep default threshold if fetch fails
    }
  };

  useEffect(() => {
    if (session?.user?.token) {
      loadWallets();
      loadClaimOptions();
    }
  }, [session?.user?.token]);

  // Handle claim reward
  const handleClaimReward = async () => {
    if (wallets.length === 0) {
      toast({
        title: "No Wallet Linked",
        description: "Please link an AssetGuard wallet before claiming rewards.",
        variant: "destructive",
      });
      return;
    }

    if (pointsBalance < claimThreshold) {
      const minDollarAmount = (claimThreshold * conversionRate).toFixed(2);
      toast({
        title: "Minimum Threshold Not Met",
        description: `You need at least ${claimThreshold} points ($${minDollarAmount}) to withdraw rewards.`,
        variant: "destructive",
      });
      return;
    }

    // Show confirmation modal
    setShowWithdrawModal(true);
  };

  // Confirm and process withdrawal
  const handleConfirmWithdrawal = async () => {
    // The actual withdrawal processing is now handled inside the modal
    // This function is called when the transaction is successful to refresh user data
    try {
      await refreshUserProfile();
    } catch (error) {
      console.error('Failed to refresh user profile:', error);
    }
  };

  // Check if user has met minimum threshold
  const hasMetThreshold = pointsBalance >= claimThreshold;
  const minDollarAmount = (claimThreshold * conversionRate).toFixed(2);

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Page Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-2">
          <Gift className="w-8 h-8 text-purple-500" />
          <h1 className="text-4xl font-bold font-mono bg-gradient-to-r from-purple-500 via-cyan-500 to-purple-500 bg-clip-text text-transparent">
            [REWARDS]
          </h1>
        </div>
        <p className="text-muted-foreground font-mono text-sm max-w-2xl mx-auto">
          Track your reward points and manage your wallet for redemption
        </p>
      </div>

      {/* Balance and Wallet Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-6xl mx-auto">
        {/* USD Balance Card */}
        <Card className="border-2 border-dashed border-green-500/30 bg-gradient-to-br from-green-500/10 to-emerald-500/10 backdrop-blur-sm">
          <CardHeader className="text-center pb-3">
            <CardTitle className="flex items-center justify-center gap-2 font-mono text-green-400">
              <DollarSign className="w-5 h-5" />
              YOUR BALANCE
            </CardTitle>
            <CardDescription className="font-mono text-xs">
              Your accumulated quest rewards
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center py-6">
            <div className="space-y-4">
              <div className="flex justify-center">
                <div className="text-4xl sm:text-5xl font-bold font-mono bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                  ${dollarBalance}
                </div>
              </div>
              <div className="flex justify-center">
                <Badge className="bg-green-500/30 dark:bg-green-500/20 text-green-700 dark:text-green-300 border-green-600/40 dark:border-green-500/30 font-mono text-xs">
                  {pointsBalance.toLocaleString()} POINTS
                </Badge>
              </div>
              {/* <div>
                <p className="text-xs font-mono text-muted-foreground">
                  Conversion Rate: 1 point = $0.01
                </p>
              </div> */}

              {/* Withdraw/Claim Button */}
              <div className="pt-2 space-y-2">
                <Button
                  onClick={handleClaimReward}
                  disabled={isClaimingReward || wallets.length === 0 || !hasMetThreshold}
                  className="w-full font-mono bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                >
                  {isClaimingReward ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <DollarSign className="w-4 h-4 mr-2" />
                      Withdraw Rewards
                    </>
                  )}
                </Button>

                {wallets.length === 0 && (
                  <p className="text-xs font-mono text-orange-500 dark:text-orange-400 flex items-center justify-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    Link wallet to withdraw
                  </p>
                )}

                {!hasMetThreshold && wallets.length > 0 && (
                  <p className="text-xs font-mono text-orange-500 dark:text-orange-400 flex items-center justify-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    Minimum {claimThreshold} points (${minDollarAmount}) required
                  </p>
                )}

                {hasMetThreshold && wallets.length > 0 && (
                  <p className="text-xs font-mono text-green-400 flex items-center justify-center gap-1">
                    ✓ Ready to withdraw
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Wallet Card */}
        <WalletCard 
          key={walletRefreshKey}
          onLinkWallet={() => setShowWalletModal(true)} 
        />
      </div>

      {/* Important Notice */}
      <div className="max-w-6xl mx-auto">
        <div className="bg-blue-500/10 dark:bg-orange-500/10 border-2 border-dashed border-blue-500/30 dark:border-orange-500/30 rounded-lg p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row items-start gap-3 sm:gap-4">
            <div className="bg-blue-500/20 dark:bg-orange-500/20 rounded-full p-2 sm:p-3 flex-shrink-0">
              <AlertCircle className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 dark:text-orange-400" />
            </div>
            <div className="space-y-2 flex-1">
              <h3 className="font-mono font-bold text-blue-700 dark:text-orange-400 text-sm sm:text-base">Important Notice</h3>
              <p className="font-mono text-xs sm:text-sm text-muted-foreground leading-relaxed">
                To receive rewards, you must link an AssetGuard wallet. AssetGuard is a secure enterprise-grade 
                digital asset wallet built on the Hedera network. Make sure to link your wallet before the 
                redemption period begins.
              </p>
              {wallets.length === 0 && (
                <div className="pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="font-mono w-full sm:w-auto"
                    onClick={() => setShowWalletModal(true)}
                  >
                    <WalletIcon className="w-4 h-4 mr-2" />
                    Learn More About AssetGuard
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Transaction History */}
      <UserTransactionHistory />



      {/* Wallet Link Modal */}
      <WalletLinkModal 
        open={showWalletModal} 
        onOpenChange={setShowWalletModal}
        onWalletLinked={handleWalletLinked}
      />

      {/* Withdraw Confirmation Modal */}
      <WithdrawConfirmationModal
        open={showWithdrawModal}
        onOpenChange={setShowWithdrawModal}
        usdAmount={parseFloat(dollarBalance)}
        pointsAmount={pointsBalance}
        walletAccountId={wallets[0]?.account_id || ''}
        onConfirm={handleConfirmWithdrawal}
      />
    </div>
  );
}