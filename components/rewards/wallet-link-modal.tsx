'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Wallet, 
  ExternalLink, 
  CheckCircle2, 
  AlertCircle, 
  Info,
  Youtube,
  Smartphone,
  Shield,
  Loader2,
  Apple
} from 'lucide-react';
import { QuestService } from '@/lib/services';
import { useSession } from 'next-auth/react';

interface WalletLinkModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onWalletLinked: () => void;
}

export function WalletLinkModal({ open, onOpenChange, onWalletLinked }: WalletLinkModalProps) {
  const { data: session } = useSession();
  const [accountId, setAccountId] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const validateAccountId = (id: string): boolean => {
    // Hedera account ID format: 0.0.xxxxx
    const hederaAccountRegex = /^0\.0\.\d+$/;
    return hederaAccountRegex.test(id);
  };

  const handleVerifyWallet = async () => {
    setError('');
    setSuccess(false);

    // Validate format
    if (!accountId.trim()) {
      setError('Please enter your wallet account ID');
      return;
    }

    if (!validateAccountId(accountId.trim())) {
      setError('Invalid account ID format. Expected format: 0.0.xxxxx');
      return;
    }

    setIsVerifying(true);

    try {
      const token = session?.user?.token;
      const response = await QuestService.verifyWallet(accountId.trim(), token);

      if (response.success) {
        setSuccess(true);
        setTimeout(() => {
          onWalletLinked();
          onOpenChange(false);
          // Reset form
          setAccountId('');
          setSuccess(false);
        }, 2000);
      } else {
        // Display the backend error message as-is
        setError(response.message || 'Failed to verify wallet. Please try again.');
      }
    } catch (err: any) {
      // Check if error has a response from the API with a message
      const errorMessage = err.response?.data?.message || err.message || 'Failed to verify wallet. Please ensure this is a valid AssetGuard wallet.';
      setError(errorMessage);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAccountId(e.target.value);
    setError('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader className="space-y-2">
          <DialogTitle className="flex items-center gap-2 font-mono text-lg sm:text-xl">
            <Wallet className="w-4 h-4 sm:w-5 sm:h-5 text-purple-500" />
            Link Your AssetGuard Wallet
          </DialogTitle>
          <DialogDescription className="font-mono text-xs">
            Connect your AssetGuard wallet to receive rewards
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 sm:space-y-6 py-2 sm:py-4">{/* Success Message */}
          {success && (
            <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3 sm:p-4 flex items-start gap-2 sm:gap-3">
              <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 dark:text-green-400 flex-shrink-0 mt-0.5" />
              <div className="space-y-1 flex-1 min-w-0">
                <p className="text-xs sm:text-sm font-semibold text-green-700 dark:text-green-500">Wallet Linked Successfully!</p>
                <p className="text-xs text-green-600 dark:text-green-500/80">Your AssetGuard wallet has been verified and linked to your account.</p>
              </div>
            </div>
          )}

          {/* What is AssetGuard Section */}
          <div className="bg-gradient-to-br from-purple-500/10 to-cyan-500/10 border border-purple-500/30 rounded-lg p-3 sm:p-4 space-y-2 sm:space-y-3">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400" />
              <h3 className="font-mono font-semibold text-xs sm:text-sm">What is AssetGuard?</h3>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              AssetGuard is a secure digital asset wallet built for enterprises on the Hedera network. 
              It provides enterprise-grade security for managing your digital assets and receiving rewards.
            </p>
          </div>

          {/* Getting Started Steps */}
          <div className="space-y-2 sm:space-y-3">
            <h3 className="font-mono font-semibold text-xs sm:text-sm flex items-center gap-2">
              <Info className="w-3 h-3 sm:w-4 sm:h-4 text-cyan-500" />
              Getting Started
            </h3>
            
            <div className="space-y-2 sm:space-y-3">
              {/* Step 1: Download */}
              <div className="bg-card border border-border rounded-lg p-3 sm:p-4 space-y-2 sm:space-y-3">
                <div className="flex items-start gap-2 sm:gap-3">
                  <div className="bg-purple-500/20 text-purple-400 rounded-full w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center flex-shrink-0 font-mono text-xs font-bold">
                    1
                  </div>
                  <div className="flex-1 space-y-2 min-w-0">
                    <p className="font-mono text-xs sm:text-sm font-semibold">Download AssetGuard Wallet</p>
                    <p className="text-xs text-muted-foreground">
                      Get the official AssetGuard wallet for iOS or Android
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full font-mono text-xs"
                        onClick={() => window.open('https://apps.apple.com/us/app/tha-assetguard/id6751275677', '_blank')}
                      >
                        <Apple className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                        App Store
                        <ExternalLink className="w-3 h-3 ml-2" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full font-mono text-xs"
                        onClick={() => window.open('https://play.google.com/store/apps/details?id=org.tha.hashpay&pcampaignid=web_share', '_blank')}
                      >
                        <Smartphone className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                        Play Store
                        <ExternalLink className="w-3 h-3 ml-2" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 2: Setup */}
              <div className="bg-card border border-border rounded-lg p-3 sm:p-4 space-y-2 sm:space-y-3">
                <div className="flex items-start gap-2 sm:gap-3">
                  <div className="bg-cyan-500/20 text-cyan-400 rounded-full w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center flex-shrink-0 font-mono text-xs font-bold">
                    2
                  </div>
                  <div className="flex-1 space-y-2 min-w-0">
                    <p className="font-mono text-xs sm:text-sm font-semibold">Setup Your Wallet</p>
                    <p className="text-xs text-muted-foreground">
                      Follow the tutorial video to create and configure your wallet
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full font-mono text-xs"
                      onClick={() => window.open('https://youtu.be/1yUyR7gRpl4', '_blank')}
                    >
                      <Youtube className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                      Watch Tutorial
                      <ExternalLink className="w-3 h-3 ml-2" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Step 3: Link */}
              <div className="bg-card border border-border rounded-lg p-3 sm:p-4 space-y-2 sm:space-y-3">
                <div className="flex items-start gap-2 sm:gap-3">
                  <div className="bg-green-500/20 text-green-400 rounded-full w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center flex-shrink-0 font-mono text-xs font-bold">
                    3
                  </div>
                  <div className="flex-1 space-y-2 sm:space-y-3 min-w-0">
                    <p className="font-mono text-xs sm:text-sm font-semibold">Link Your Wallet</p>
                    <p className="text-xs text-muted-foreground">
                      Enter your Hedera account ID from AssetGuard wallet
                    </p>
                    
                    <div className="space-y-2">
                      <label className="text-xs font-mono text-muted-foreground">
                        Wallet Account ID
                      </label>
                      <Input
                        placeholder="0.0.xxxxx"
                        value={accountId}
                        onChange={handleInputChange}
                        disabled={isVerifying || success}
                        className="font-mono text-sm"
                      />
                      <p className="text-xs text-muted-foreground flex items-start gap-1">
                        <Info className="w-3 h-3 mt-0.5 flex-shrink-0" />
                        <span>You can find your account ID in your AssetGuard wallet app</span>
                      </p>
                    </div>

                    {/* Error Message */}
                    {error && (
                      <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-2 sm:p-3 flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 text-destructive flex-shrink-0 mt-0.5" />
                        <p className="text-xs text-destructive break-words">{error}</p>
                      </div>
                    )}

                    <Button
                      onClick={handleVerifyWallet}
                      disabled={isVerifying || success || !accountId.trim()}
                      className="w-full font-mono text-sm"
                    >
                      {isVerifying ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Verifying Wallet...
                        </>
                      ) : success ? (
                        <>
                          <CheckCircle2 className="w-4 h-4 mr-2" />
                          Wallet Linked!
                        </>
                      ) : (
                        <>
                          <Wallet className="w-4 h-4 mr-2" />
                          Link Wallet
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Security Note */}
          <div className="bg-blue-500/10 dark:bg-orange-500/10 border border-blue-500/30 dark:border-orange-500/30 rounded-lg p-2 sm:p-3 flex items-start gap-2">
            <Shield className="w-3 h-3 sm:w-4 sm:h-4 text-blue-600 dark:text-orange-400 flex-shrink-0 mt-0.5" />
            <div className="space-y-1 flex-1 min-w-0">
              <p className="text-xs font-semibold text-blue-700 dark:text-orange-400">Security Note</p>
              <p className="text-xs text-blue-600 dark:text-orange-400/80">
                Only link wallets you control. Never share your private keys or recovery phrase with anyone.
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
