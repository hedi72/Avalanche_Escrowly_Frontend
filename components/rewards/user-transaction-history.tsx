'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { QuestService } from '@/lib/services';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Loader2,
  History,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';

interface Transaction {
  id: number;
  user_id: number;
  transaction_id: string;
  to_wallet: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export function UserTransactionHistory() {
  const { data: session } = useSession();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [limit] = useState(5);
  const [sort] = useState<'ASC' | 'DESC'>('DESC');
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const fetchTransactions = async () => {
    setIsLoading(true);
    try {
      const token = session?.user?.token;
      if (!token) {
        setIsLoading(false);
        return;
      }

      const response = await QuestService.getUserTransactions(page, limit, sort, token);

      if (response.success) {
        setTransactions(response.transactions);
        setTotalPages(response.numberOfPage);
        setTotalCount(response.count);
      }
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [page, session?.user?.token]);

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'success':
        return (
          <Badge className="bg-green-500/20 text-green-700 dark:text-green-300 border-green-500/30 font-mono text-xs">
            SUCCESS
          </Badge>
        );
      case 'pending':
        return (
          <Badge className="bg-yellow-500/20 text-yellow-700 dark:text-yellow-300 border-yellow-500/30 font-mono text-xs">
            PENDING
          </Badge>
        );
      case 'failed':
        return (
          <Badge className="bg-red-500/20 text-red-700 dark:text-red-300 border-red-500/30 font-mono text-xs">
            FAILED
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="font-mono text-xs">
            {status.toUpperCase()}
          </Badge>
        );
    }
  };

  const generateHashScanUrl = (transactionId: string) => {
    return `https://hashscan.io/mainnet/transaction/${transactionId}`;
  };

  // Don't render if no transactions and not loading
  if (!isLoading && totalCount === 0) {
    return null;
  }

  return (
    <div className="max-w-6xl mx-auto">
      <Card className="border-2 border-dashed border-purple-500/30 bg-gradient-to-br from-purple-500/10 to-cyan-500/10 backdrop-blur-sm">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 font-mono text-purple-400">
            <History className="w-5 h-5" />
            CLAIM HISTORY
          </CardTitle>
          <p className="text-xs font-mono text-muted-foreground">
            {totalCount} {totalCount === 1 ? 'transaction' : 'transactions'} total
          </p>
        </CardHeader>
        <CardContent className="border-t-2 border-dashed border-purple-500/10">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="space-y-4">
              {/* Transaction List */}
              <div className="space-y-2">
                {transactions.map((transaction, index) => (
                  <div
                    key={transaction.id}
                    className="group border-2 border-dashed border-purple-500/20 bg-gradient-to-br from-purple-500/5 to-cyan-500/5 rounded-lg px-4 py-2.5 hover:border-purple-500/40 transition-all duration-200"
                  >
                    {/* Desktop: Single line layout */}
                    <div className="hidden lg:flex items-center justify-between gap-4 text-sm">
                      {/* Status & ID */}
                      <div className="flex items-center gap-3 shrink-0">
                        <div className="p-1 bg-purple-500/10 rounded border border-purple-500/20">
                          {getStatusIcon(transaction.status)}
                        </div>
                        <span className="font-mono text-sm font-medium">
                          #{transaction.id}
                        </span>
                        {getStatusBadge(transaction.status)}
                      </div>

                      {/* Wallet */}
                      <div className="flex-1 min-w-0 max-w-[200px]">
                        <code className="text-xs bg-muted/50 px-2 py-1 rounded border border-dashed border-purple-500/20 font-mono truncate block">
                          {transaction.to_wallet}
                        </code>
                      </div>

                      {/* Transaction ID with View Link */}
                      <div className="flex-1 min-w-0 max-w-[350px]">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="font-mono text-xs h-7 px-2 w-full justify-start hover:bg-purple-500/10"
                          onClick={() => window.open(generateHashScanUrl(transaction.transaction_id), '_blank')}
                        >
                          <code className="truncate flex-1 text-left">
                            {transaction.transaction_id}
                          </code>
                          <ExternalLink className="w-3 h-3 ml-1 shrink-0" />
                        </Button>
                      </div>

                      {/* Time */}
                      <div className="text-right shrink-0 min-w-[140px]">
                        <p className="text-xs text-muted-foreground font-mono">
                          {format(new Date(transaction.created_at), 'MMM dd, HH:mm')}
                        </p>
                        <p className="text-xs text-muted-foreground/70 font-mono">
                          {formatDistanceToNow(new Date(transaction.created_at), { addSuffix: true })}
                        </p>
                      </div>
                    </div>

                    {/* Mobile/Tablet: Stacked layout */}
                    <div className="lg:hidden space-y-2.5">
                      {/* Header Row */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <div className="p-1 bg-purple-500/10 rounded border border-purple-500/20">
                            {getStatusIcon(transaction.status)}
                          </div>
                          <div>
                            <span className="font-mono text-sm font-medium">
                              Claim #{transaction.id}
                            </span>
                            <p className="text-xs text-muted-foreground font-mono">
                              {format(new Date(transaction.created_at), 'MMM dd, HH:mm')}
                            </p>
                          </div>
                        </div>
                        {getStatusBadge(transaction.status)}
                      </div>

                      {/* Wallet */}
                      <div>
                        <p className="text-xs text-muted-foreground font-mono mb-1">To Wallet</p>
                        <code className="text-xs bg-muted/50 px-2 py-1 rounded border border-dashed border-purple-500/20 font-mono block truncate">
                          {transaction.to_wallet}
                        </code>
                      </div>

                      {/* Transaction ID */}
                      <div>
                        <p className="text-xs text-muted-foreground font-mono mb-1">Transaction ID</p>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="font-mono text-xs h-7 px-2 w-full justify-start hover:bg-purple-500/10"
                          onClick={() => window.open(generateHashScanUrl(transaction.transaction_id), '_blank')}
                        >
                          <code className="truncate flex-1 text-left">
                            {transaction.transaction_id}
                          </code>
                          <ExternalLink className="w-3 h-3 ml-1 shrink-0" />
                        </Button>
                      </div>

                      {/* Time Ago */}
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        <span className="font-mono">
                          {formatDistanceToNow(new Date(transaction.created_at), { addSuffix: true })}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between pt-4 border-t-2 border-dashed border-purple-500/10">
                  <p className="text-xs sm:text-sm text-muted-foreground font-mono">
                    Page {page} of {totalPages}
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="font-mono h-8 px-2 sm:px-3"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      <span className="hidden sm:inline ml-1">Prev</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                      className="font-mono h-8 px-2 sm:px-3"
                    >
                      <span className="hidden sm:inline mr-1">Next</span>
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
