'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { QuestService } from '@/lib/services';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Loader2,
  DollarSign,
  CheckCircle,
  XCircle,
  Clock,
  User,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface Transaction {
  id: number;
  user_id: number;
  transaction_id: string;
  to_wallet: string;
  status: string;
  created_at: string;
  updated_at: string;
  user: {
    firstName: string;
    lastName: string;
  };
}

export default function TransactionHistory() {
  const { data: session } = useSession();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [sort, setSort] = useState<'ASC' | 'DESC'>('DESC');
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const fetchTransactions = async () => {
    setIsLoading(true);
    try {
      const token = session?.user?.token;
      if (!token) return;

      const response = await QuestService.getTransactions(page, limit, sort, token);

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
  }, [page, limit, sort, session?.user?.token]);

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'success':
        return (
          <Badge className="bg-green-500/20 text-green-700 dark:text-green-300 border-green-500/30 font-mono">
            <CheckCircle className="w-3 h-3 mr-1" />
            SUCCESS
          </Badge>
        );
      case 'pending':
        return (
          <Badge className="bg-yellow-500/20 text-yellow-700 dark:text-yellow-300 border-yellow-500/30 font-mono">
            <Clock className="w-3 h-3 mr-1" />
            PENDING
          </Badge>
        );
      case 'failed':
        return (
          <Badge className="bg-red-500/20 text-red-700 dark:text-red-300 border-red-500/30 font-mono">
            <XCircle className="w-3 h-3 mr-1" />
            FAILED
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="font-mono">
            {status.toUpperCase()}
          </Badge>
        );
    }
  };

  const generateHashScanUrl = (transactionId: string) => {
    return `https://hashscan.io/mainnet/transaction/${transactionId}`;
  };

  return (
    <Card className="border-2 border-dashed border-green-500/20 bg-gradient-to-br from-green-500/5 to-emerald-500/5">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 font-mono bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
            <DollarSign className="w-5 h-5 text-green-600" />
            TRANSACTION_HISTORY
          </CardTitle>
          <div className="flex items-center gap-2">
            <Select
              value={sort}
              onValueChange={(value: 'ASC' | 'DESC') => {
                setSort(value);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-[130px] font-mono text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="DESC" className="font-mono">
                  <div className="flex items-center gap-2">
                    <ArrowUpDown className="w-3 h-3" />
                    Newest First
                  </div>
                </SelectItem>
                <SelectItem value="ASC" className="font-mono">
                  <div className="flex items-center gap-2">
                    <ArrowUpDown className="w-3 h-3" />
                    Oldest First
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={limit.toString()}
              onValueChange={(value) => {
                setLimit(parseInt(value));
                setPage(1);
              }}
            >
              <SelectTrigger className="w-[100px] font-mono text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10" className="font-mono">10 / page</SelectItem>
                <SelectItem value="25" className="font-mono">25 / page</SelectItem>
                <SelectItem value="50" className="font-mono">50 / page</SelectItem>
                <SelectItem value="100" className="font-mono">100 / page</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <p className="text-sm text-muted-foreground font-mono">
          Total Transactions: {totalCount}
        </p>
      </CardHeader>
      <CardContent className="border-t-2 border-dashed border-green-500/10">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : transactions.length === 0 ? (
          <div className="text-center py-12">
            <DollarSign className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground font-mono">No transactions found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-dashed border-green-500/20">
                    <TableHead className="font-mono text-xs">ID</TableHead>
                    <TableHead className="font-mono text-xs">USER</TableHead>
                    <TableHead className="font-mono text-xs">WALLET</TableHead>
                    <TableHead className="font-mono text-xs">TRANSACTION ID</TableHead>
                    <TableHead className="font-mono text-xs">STATUS</TableHead>
                    <TableHead className="font-mono text-xs">DATE</TableHead>
                    <TableHead className="font-mono text-xs">ACTION</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((transaction) => (
                    <TableRow
                      key={transaction.id}
                      className="border-dashed border-green-500/10 hover:bg-green-500/5"
                    >
                      <TableCell className="font-mono text-xs">
                        #{transaction.id}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 bg-blue-500/10 rounded border border-blue-500/20">
                            <User className="w-3 h-3 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-medium text-sm">
                              {transaction.user.firstName} {transaction.user.lastName}
                            </p>
                            <p className="text-xs text-muted-foreground font-mono">
                              ID: {transaction.user_id}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {transaction.to_wallet}
                      </TableCell>
                      <TableCell>
                        <code className="text-xs bg-muted px-2 py-1 rounded">
                          {transaction?.transaction_id?.substring(0, 20)}...
                        </code>
                      </TableCell>
                      <TableCell>{getStatusBadge(transaction.status)}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(transaction.created_at), {
                          addSuffix: true,
                        })}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="font-mono text-xs"
                          onClick={() =>
                            window.open(
                              generateHashScanUrl(transaction.transaction_id),
                              '_blank'
                            )
                          }
                        >
                          <ExternalLink className="w-3 h-3 mr-1" />
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-3">
              {transactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="border-2 border-dashed border-green-500/20 bg-gradient-to-br from-green-500/5 to-emerald-500/5 rounded-lg p-4 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs text-muted-foreground">
                      #{transaction.id}
                    </span>
                    {getStatusBadge(transaction.status)}
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-blue-500/10 rounded border border-blue-500/20">
                        <User className="w-3 h-3 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">
                          {transaction.user.firstName} {transaction.user.lastName}
                        </p>
                        <p className="text-xs text-muted-foreground font-mono">
                          ID: {transaction.user_id}
                        </p>
                      </div>
                    </div>

                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Wallet</p>
                      <code className="text-xs bg-muted px-2 py-1 rounded block">
                        {transaction.to_wallet}
                      </code>
                    </div>

                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Transaction</p>
                      <code className="text-xs bg-muted px-2 py-1 rounded block break-all">
                        {transaction.transaction_id}
                      </code>
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(transaction.created_at), {
                          addSuffix: true,
                        })}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        className="font-mono text-xs"
                        onClick={() =>
                          window.open(
                            generateHashScanUrl(transaction.transaction_id),
                            '_blank'
                          )
                        }
                      >
                        <ExternalLink className="w-3 h-3 mr-1" />
                        View
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-4 border-t-2 border-dashed border-green-500/10">
                <p className="text-sm text-muted-foreground font-mono">
                  Page {page} of {totalPages}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="font-mono"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="font-mono"
                  >
                    Next
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
