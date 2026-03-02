'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  DollarSign, 
  AlertCircle, 
  Loader2,
  Wallet,
  TrendingUp,
  Info,
  CheckCircle2,
  XCircle,
  Clock
} from 'lucide-react';
import { QuestService } from '@/lib/services';
import { useSession } from 'next-auth/react';

type TransactionStatus = 'idle' | 'initiating' | 'pending' | 'success' | 'failed';

interface WithdrawConfirmationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  usdAmount: number;
  pointsAmount: number;
  walletAccountId: string;
  onConfirm: () => Promise<void>;
}

export function WithdrawConfirmationModal({ 
  open, 
  onOpenChange, 
  usdAmount, 
  pointsAmount,
  walletAccountId,
  onConfirm 
}: WithdrawConfirmationModalProps) {
  const { data: session } = useSession();
  const [hbarAmount, setHbarAmount] = useState<number | null>(null);
  const [isLoadingConversion, setIsLoadingConversion] = useState(false);
  const [conversionError, setConversionError] = useState('');
  const [transactionStatus, setTransactionStatus] = useState<TransactionStatus>('idle');
  const [transactionId, setTransactionId] = useState<number | null>(null);
  const [statusMessage, setStatusMessage] = useState('');
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const pollingAttempts = useRef(0);
  const MAX_POLLING_ATTEMPTS = 60; // Poll for max 60 seconds (60 attempts * 1s interval)

  // Fetch HBAR conversion when modal opens
  useEffect(() => {
    if (open && usdAmount > 0) {
      fetchHbarConversion();
    }
  }, [open, usdAmount]);

  // Cleanup polling on unmount or modal close
  useEffect(() => {
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  }, []);

  // Reset state when modal closes
  useEffect(() => {
    if (!open) {
      setTransactionStatus('idle');
      setTransactionId(null);
      setStatusMessage('');
      pollingAttempts.current = 0;
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    }
  }, [open]);

  const fetchHbarConversion = async () => {
    setIsLoadingConversion(true);
    setConversionError('');
    
    try {
      const token = session?.user?.token;
      const response = await QuestService.convertUsd(usdAmount, token);
      
      if (response.success) {
        // Convert to number to ensure we can use toFixed()
        setHbarAmount(Number(response.hbarValue));
      } else {
        setConversionError('Unable to fetch conversion rate');
      }
    } catch (error: any) {
      console.error('Failed to fetch HBAR conversion:', error);
      setConversionError(error.message || 'Failed to get conversion rate');
    } finally {
      setIsLoadingConversion(false);
    }
  };

  const startPolling = (txId: number) => {
    pollingAttempts.current = 0;
    
    pollingIntervalRef.current = setInterval(async () => {
      pollingAttempts.current += 1;

      // Stop polling after max attempts
      if (pollingAttempts.current >= MAX_POLLING_ATTEMPTS) {
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
        }
        setTransactionStatus('failed');
        setStatusMessage('Transaction check timed out. Please check your transaction history.');
        return;
      }

      try {
        const token = session?.user?.token;
        const response = await QuestService.checkTransaction(txId, token);

        if (response.success && response.transaction) {
          const { status } = response.transaction;

          if (status === 'success') {
            // Transaction successful
            if (pollingIntervalRef.current) {
              clearInterval(pollingIntervalRef.current);
              pollingIntervalRef.current = null;
            }
            setTransactionStatus('success');
            setStatusMessage('Transaction completed successfully!');
            
            // Call parent's onConfirm to refresh user data
            setTimeout(() => {
              onConfirm();
              onOpenChange(false);
            }, 2000);
          } else if (status === 'failed') {
            // Transaction failed
            if (pollingIntervalRef.current) {
              clearInterval(pollingIntervalRef.current);
              pollingIntervalRef.current = null;
            }
            setTransactionStatus('failed');
            setStatusMessage('Transaction failed. Please try again.');
          }
          // If status is still 'pending', continue polling
        }
      } catch (error: any) {
        console.error('Error polling transaction status:', error);
        // Continue polling on error unless we've hit max attempts
      }
    }, 1000); // Poll every 1 second
  };

  const handleConfirm = async () => {
    setTransactionStatus('initiating');
    setStatusMessage('Initiating withdrawal...');
    
    try {
      const token = session?.user?.token;
      const response = await QuestService.claimReward(walletAccountId, token);

      if (response.pending && response.transaction_id) {
        // Transaction initiated, start polling
        setTransactionId(response.transaction_id);
        setTransactionStatus('pending');
        setStatusMessage(response.message || 'Processing transaction...');
        startPolling(response.transaction_id);
      } else if (response.success) {
        // Immediate success (legacy response)
        setTransactionStatus('success');
        setStatusMessage(response.message || 'Withdrawal successful!');
        setTimeout(() => {
          onConfirm();
          onOpenChange(false);
        }, 2000);
      } else {
        // Error response
        setTransactionStatus('failed');
        setStatusMessage(response.message || 'Failed to initiate withdrawal');
      }
    } catch (error: any) {
      console.error('Failed to initiate withdrawal:', error);
      setTransactionStatus('failed');
      setStatusMessage(error.message || 'Failed to initiate withdrawal. Please try again.');
    }
  };

  const handleCancel = () => {
    const canClose = transactionStatus === 'idle' || 
                     transactionStatus === 'success' || 
                     transactionStatus === 'failed';
    
    if (canClose) {
      onOpenChange(false);
    }
  };

  const isProcessing = transactionStatus === 'initiating' || transactionStatus === 'pending';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] p-4 sm:p-6">
        <DialogHeader className="space-y-2">
          <DialogTitle className="flex items-center gap-2 font-mono text-lg sm:text-xl">
            <DollarSign className="w-5 h-5 text-green-500" />
            Confirm Withdrawal
          </DialogTitle>
          <DialogDescription className="font-mono text-xs">
            Review your withdrawal details before confirming
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Transaction Status Indicator (shown when processing) */}
          {transactionStatus !== 'idle' && (
            <div className={`border-2 rounded-lg p-4 space-y-3 ${
              transactionStatus === 'success' 
                ? 'bg-green-500/10 border-green-500/30' 
                : transactionStatus === 'failed'
                ? 'bg-red-500/10 border-red-500/30'
                : 'bg-blue-500/10 border-blue-500/30'
            }`}>
              <div className="flex items-center gap-3">
                {transactionStatus === 'initiating' && (
                  <>
                    <Loader2 className="w-5 h-5 text-blue-500 animate-spin flex-shrink-0" />
                    <div className="flex-1">
                      <p className="font-mono font-semibold text-sm text-blue-600 dark:text-blue-400">
                        Initiating Transaction
                      </p>
                      <p className="font-mono text-xs text-muted-foreground mt-1">
                        {statusMessage}
                      </p>
                    </div>
                  </>
                )}
                {transactionStatus === 'pending' && (
                  <>
                    <Clock className="w-5 h-5 text-blue-500 animate-pulse flex-shrink-0" />
                    <div className="flex-1">
                      <p className="font-mono font-semibold text-sm text-blue-600 dark:text-blue-400">
                        Processing Transaction
                      </p>
                      <p className="font-mono text-xs text-muted-foreground mt-1">
                        {statusMessage}
                      </p>
                      {transactionId && (
                        <p className="font-mono text-xs text-muted-foreground mt-1">
                          Transaction ID: #{transactionId}
                        </p>
                      )}
                    </div>
                  </>
                )}
                {transactionStatus === 'success' && (
                  <>
                    <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="font-mono font-semibold text-sm text-green-600 dark:text-green-400">
                        Transaction Successful! 🎉
                      </p>
                      <p className="font-mono text-xs text-muted-foreground mt-1">
                        {statusMessage}
                      </p>
                    </div>
                  </>
                )}
                {transactionStatus === 'failed' && (
                  <>
                    <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="font-mono font-semibold text-sm text-red-600 dark:text-red-400">
                        Transaction Failed
                      </p>
                      <p className="font-mono text-xs text-muted-foreground mt-1">
                        {statusMessage}
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Withdrawal Amount Card (hidden when transaction is processing/complete) */}
          {transactionStatus === 'idle' && (
            <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-2 border-dashed border-green-500/30 rounded-lg p-4 space-y-3">
              <div className="space-y-2">
                <p className="text-xs font-mono text-muted-foreground">Withdrawal Amount</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold font-mono bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                    ${usdAmount.toFixed(2)}
                  </span>
                  <Badge className="bg-green-500/30 dark:bg-green-500/20 text-green-700 dark:text-green-300 border-green-600/40 dark:border-green-500/30 font-mono text-xs">
                    {pointsAmount.toLocaleString()} PTS
                  </Badge>
                </div>
              </div>
            </div>
          )}

          {/* HBAR Conversion Card (hidden when transaction is processing/complete) */}
          {transactionStatus === 'idle' && (
            <div className="bg-gradient-to-br from-purple-500/10 to-cyan-500/10 border border-purple-500/30 rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-purple-400" />
                <h3 className="font-mono font-semibold text-sm">You Will Receive</h3>
              </div>
              
              {isLoadingConversion ? (
                <div className="flex items-center gap-2 py-2">
                  <Loader2 className="w-4 h-4 animate-spin text-purple-400" />
                  <span className="text-xs font-mono text-muted-foreground">
                    Calculating HBAR amount...
                  </span>
                </div>
              ) : conversionError ? (
                <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-3 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-destructive flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-destructive">{conversionError}</p>
                </div>
              ) : hbarAmount !== null ? (
                <div className="space-y-2">
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold font-mono text-purple-400">
                      ℏ {hbarAmount.toFixed(4)}
                    </span>
                    <span className="text-xs font-mono text-muted-foreground">HBAR</span>
                  </div>
                  <p className="text-xs font-mono text-muted-foreground">
                    Based on current exchange rate
                  </p>
                </div>
              ) : null}
            </div>
          )}

          {/* Destination Wallet */}
          {transactionStatus === 'idle' && (
            <div className="bg-card border border-border rounded-lg p-4 space-y-2">
              <div className="flex items-center gap-2">
                <Wallet className="w-4 h-4 text-cyan-400" />
                <h3 className="font-mono font-semibold text-sm">Destination Wallet</h3>
              </div>
              <div className="bg-muted rounded-md p-2 break-all">
                <p className="font-mono text-xs text-muted-foreground">
                  {walletAccountId}
                </p>
              </div>
            </div>
          )}

          {/* Important Notice */}
          {transactionStatus === 'idle' && (
            <div className="bg-blue-500/10 dark:bg-orange-500/10 border border-blue-500/30 dark:border-orange-500/30 rounded-lg p-3 flex items-start gap-2">
              <Info className="w-4 h-4 text-blue-600 dark:text-orange-400 flex-shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-xs font-semibold text-blue-700 dark:text-orange-400">Important</p>
                <p className="text-xs text-blue-600 dark:text-orange-400/80">
                  The HBAR amount will be sent to your AssetGuard wallet. This action cannot be undone.
                </p>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={isProcessing}
            className="w-full sm:w-auto font-mono"
          >
            {transactionStatus === 'success' || transactionStatus === 'failed' ? 'Close' : 'Cancel'}
          </Button>
          {transactionStatus === 'idle' && (
            <Button
              onClick={handleConfirm}
              disabled={isProcessing || isLoadingConversion || !!conversionError}
              className="w-full sm:w-auto font-mono bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
            >
              <DollarSign className="w-4 h-4 mr-2" />
              Confirm Withdrawal
            </Button>
          )}
          {transactionStatus === 'failed' && (
            <Button
              onClick={handleConfirm}
              className="w-full sm:w-auto font-mono bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
            >
              <DollarSign className="w-4 h-4 mr-2" />
              Retry
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
