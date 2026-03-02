'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Users,
  Search,
  Filter,
  MoreHorizontal,
  UserPlus,
  Edit,
  Trash2,
  Eye,
  Ban,
  CheckCircle,
  XCircle,
  Clock,
  Trophy,
  Star,
  Zap,
  Loader2,
  AlertCircle,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ExternalLink,
  Twitter,
  Linkedin,
  MessageSquare,
  DollarSign,
  Calendar,
  Target,
  FileText,
  X,
  Download
} from 'lucide-react';
import { createApiClientWithToken } from '@/lib/api/client';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface User {
  id?: string | number;
  name?: string;
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  email_verified: boolean;
  total_points: number;
  widhdraw_usd?: string;
  avatar?: string;
  level?: number;
  streak?: number;
  created_at?: string;
  referred_partner?: {
    name: string;
  } | null;
  referral?: {
    firstName: string;
    lastName: string;
  } | null;
}

interface UserProfile {
  user: {
    id: number;
    firstName: string;
    lastName: string;
    username: string;
    email: string;
    bio: string;
    email_verified: boolean;
    total_points: number;
    widhdraw_usd?: string;
    facebookProfile?: {
      id: number;
      facebook_username: string;
      facebook_profile_picture?: string;
    } | null;
    twitterProfile?: {
      id: number;
      twitter_username: string;
      twitter_profile_picture?: string;
    } | null;
    discordProfile?: {
      id: number;
      discord_username: string;
      discord_picture?: string;
    } | null;
    hederaProfile?: {
      id: number;
      hedera_id: string;
      hedera_did?: string;
    } | null;
    linkedInProfile?: {
      id: number;
      linked_in_username: string;
      linked_in_profile_picture?: string;
    } | null;
  };
  completedQuests: Quest[];
  rejectedQuests: Quest[];
  pendingQuests: Quest[];
  total_completed: number;
  total_rejected: number;
  tottal_pending: number;
}

interface ReferredUser {
  id: number;
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  bio: string;
  email_verified: boolean;
  total_points: number;
}

interface ReferredUsersResponse {
  succes: boolean;
  page: number;
  limit: number;
  users: ReferredUser[];
  count: number;
  numberOfPage: number;
}

interface Quest {
  id: number;
  title: string;
  description: string;
  reward: string;
  difficulty: string;
  status: string;
  platform_type: string;
  quest_type: string;
  created_at: string;
}

interface ApiResponse {
  succes: boolean;
  users: User[];
  numberOfPages?: number;
  page?: number;
  limit?: number;
}

interface UserManagementProps {
  className?: string;
}

// Helper function to transform API user data
const transformUser = (apiUser: User): User & { id: string; name: string; points: number } => ({
  ...apiUser,
  id: String(apiUser.id || apiUser.username),
  name: `${apiUser.firstName} ${apiUser.lastName}`,
  points: apiUser.total_points,
  
  level: apiUser.level || 1,
  streak: apiUser.streak || 0,
  created_at: apiUser.created_at?.toString().split('T')[0] || new Date().toISOString().split('T')[0]
});

export function UserManagement({ className }: UserManagementProps) {
  const { data: session } = useSession();
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [referredUsers, setReferredUsers] = useState<ReferredUser[]>([]);
  const [referredUsersCount, setReferredUsersCount] = useState(0);
  const [referredUsersPage, setReferredUsersPage] = useState(1);
  const [referredUsersLimit, setReferredUsersLimit] = useState(10);
  const [referredUsersTotalPages, setReferredUsersTotalPages] = useState(1);
  const [referredUsersLoading, setReferredUsersLoading] = useState(false);
  const [referredUsersError, setReferredUsersError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [sortField, setSortField] = useState<'total_points' | 'created_at'>('total_points');
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('DESC');
  const [isDownloadingDID, setIsDownloadingDID] = useState(false);
  // Removed pageInput in favor of leaderboard-style pagination

  // Fetch referred users
  const fetchReferredUsers = async (userId: string | number, page: number = 1, limit: number = 10) => {
    try {
      setReferredUsersLoading(true);
      setReferredUsersError(null);
      const token = session?.user?.token;
      const apiClient = token ? createApiClientWithToken(token) : require('@/lib/api/client').api;
      const response = await apiClient.get(`/user/admin/referred-by/${userId}`, {
        params: { page, limit }
      });

      if (response.data.succes) {
        setReferredUsers(response.data.users || []);
        setReferredUsersCount(response.data.count || 0);
        setReferredUsersTotalPages(response.data.numberOfPage || 1);
      } else {
        throw new Error('Failed to fetch referred users');
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'An error occurred while fetching referred users';
      setReferredUsersError(errorMessage);
      console.error('Error fetching referred users:', err);
    } finally {
      setReferredUsersLoading(false);
    }
  };

  // Fetch user profile details
  const fetchUserProfile = async (userId: string | number) => {
    try {
      setProfileLoading(true);
      setProfileError(null);
      const token = session?.user?.token;
      const apiClient = token ? createApiClientWithToken(token) : require('@/lib/api/client').api;
      const response = await apiClient.get(`/user/profile/details/${userId}`);

      if (response.data.success) {
        setUserProfile(response.data.profile);
      } else {
        throw new Error('Failed to fetch user profile');
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'An error occurred while fetching user profile';
      setProfileError(errorMessage);
      console.error('Error fetching user profile:', err);
    } finally {
      setProfileLoading(false);
    }
  };

  // Fetch users from API
  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = session?.user?.token;
      const apiClient = token ? createApiClientWithToken(token) : require('@/lib/api/client').api;
      
      const params: any = { 
        page, 
        limit,
        sorted: sortField,
        sort_type: sortOrder
      };
      
      // Add search parameter if search term exists
      if (debouncedSearchTerm.trim()) {
        params.search = debouncedSearchTerm.trim();
      }
      
      const response = await apiClient.get('/user/admin/all', { 
        params 
      });

      const data: ApiResponse = response.data;

      if (data.succes) {
        const transformedUsers = data.users.map(transformUser);
        setUsers(transformedUsers);
        if (typeof data.numberOfPages === 'number') setTotalPages(data.numberOfPages);
        if (typeof data.page === 'number' && data.page !== page) setPage(data.page);
      } else {
        throw new Error('Failed to fetch users');
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'An error occurred';
      setError(errorMessage);
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };

  // Debounced search term
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500); // 500ms delay

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Reset page when search changes
  useEffect(() => {
    setPage(1);
  }, [debouncedSearchTerm]);

  // Fetch users on component mount and when dependencies change
  useEffect(() => {
    fetchUsers();
  }, [page, limit, sortField, sortOrder, debouncedSearchTerm, session?.user?.token]);

  // Removed pageInput sync effect (not needed with numbered pagination)



  // Pagination helpers (match leaderboard UX)
  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages && newPage !== page) {
      setPage(newPage);
    }
  };

  const renderPaginationItems = () => {
    const items: JSX.Element[] = [];
    const showEllipsis = totalPages > 7;

    if (!showEllipsis) {
      for (let i = 1; i <= totalPages; i++) {
        items.push(
          <PaginationItem key={i}>
            <PaginationLink
              onClick={() => handlePageChange(i)}
              isActive={page === i}
              className="cursor-pointer"
            >
              {i}
            </PaginationLink>
          </PaginationItem>
        );
      }
    } else {
      // First page
      items.push(
        <PaginationItem key={1}>
          <PaginationLink
            onClick={() => handlePageChange(1)}
            isActive={page === 1}
            className="cursor-pointer"
          >
            1
          </PaginationLink>
        </PaginationItem>
      );

      // Left ellipsis
      if (page > 4) {
        items.push(
          <PaginationItem key="ellipsis-left">
            <PaginationEllipsis />
          </PaginationItem>
        );
      }

      // Pages around current
      const start = Math.max(2, page - 1);
      const end = Math.min(totalPages - 1, page + 1);
      for (let i = start; i <= end; i++) {
        items.push(
          <PaginationItem key={i}>
            <PaginationLink
              onClick={() => handlePageChange(i)}
              isActive={page === i}
              className="cursor-pointer"
            >
              {i}
            </PaginationLink>
          </PaginationItem>
        );
      }

      // Right ellipsis
      if (page < totalPages - 3) {
        items.push(
          <PaginationItem key="ellipsis-right">
            <PaginationEllipsis />
          </PaginationItem>
        );
      }

      // Last page
      if (totalPages > 1) {
        items.push(
          <PaginationItem key={totalPages}>
            <PaginationLink
              onClick={() => handlePageChange(totalPages)}
              isActive={page === totalPages}
              className="cursor-pointer"
            >
              {totalPages}
            </PaginationLink>
          </PaginationItem>
        );
      }
    }

    return items;
  };

  // Handle sorting
  const handleSort = (field: 'total_points' | 'created_at') => {
    if (sortField === field) {
      // Toggle sort order if same field
      setSortOrder(prev => prev === 'ASC' ? 'DESC' : 'ASC');
    } else {
      // Set new field with default DESC order
      setSortField(field);
      setSortOrder('DESC');
    }
    // Reset to first page when sorting changes
    setPage(1);
  };

  // Auto-trigger fetch when sort parameters change
  useEffect(() => {
    setPage(1);
  }, [sortField, sortOrder]);

  const getSortIcon = (field: 'total_points' | 'created_at') => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-4 h-4 text-gray-400" />;
    }
    return sortOrder === 'ASC' ? 
      <ArrowUp className="w-4 h-4 text-purple-600" /> : 
      <ArrowDown className="w-4 h-4 text-purple-600" />;
  };

  // Download DID-verified users
  const handleDownloadDIDVerifiedUsers = async () => {
    try {
      setIsDownloadingDID(true);
      const token = session?.user?.token;
      const apiClient = token ? createApiClientWithToken(token) : require('@/lib/api/client').api;
      
      const response = await apiClient.get('/admin/users/did-verfied', {
        responseType: 'blob',
      });

      // Create download link
      const blob = new Blob([response.data], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `did-verified-users-${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast({
        title: "Success",
        description: "DID-verified users exported successfully",
        duration: 3000,
      });
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to download DID-verified users';
      console.error('Error downloading DID-verified users:', err);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setIsDownloadingDID(false);
    }
  };

  // Handle viewing user profile
  const handleViewProfile = async (user: User) => {
    setSelectedUser(user);
    setIsProfileDialogOpen(true);
    setReferredUsers([]);
    setReferredUsersCount(0);
    setReferredUsersPage(1);
    setReferredUsersLimit(10);
    await Promise.all([
      fetchUserProfile(user.id || user.username),
      fetchReferredUsers(user.id || user.username, 1, 10)
    ]);
  };

  // Handle referred users pagination
  const handleReferredUsersPageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= referredUsersTotalPages && newPage !== referredUsersPage && selectedUser) {
      setReferredUsersPage(newPage);
      fetchReferredUsers(selectedUser.id || selectedUser.username, newPage, referredUsersLimit);
    }
  };

  const renderReferredUsersPaginationItems = () => {
    const items: JSX.Element[] = [];
    const showEllipsis = referredUsersTotalPages > 7;

    if (!showEllipsis) {
      for (let i = 1; i <= referredUsersTotalPages; i++) {
        items.push(
          <PaginationItem key={i}>
            <PaginationLink
              onClick={() => handleReferredUsersPageChange(i)}
              isActive={referredUsersPage === i}
              className="cursor-pointer"
            >
              {i}
            </PaginationLink>
          </PaginationItem>
        );
      }
    } else {
      // First page
      items.push(
        <PaginationItem key={1}>
          <PaginationLink
            onClick={() => handleReferredUsersPageChange(1)}
            isActive={referredUsersPage === 1}
            className="cursor-pointer"
          >
            1
          </PaginationLink>
        </PaginationItem>
      );

      // Left ellipsis
      if (referredUsersPage > 4) {
        items.push(
          <PaginationItem key="ellipsis-left">
            <PaginationEllipsis />
          </PaginationItem>
        );
      }

      // Pages around current
      const start = Math.max(2, referredUsersPage - 1);
      const end = Math.min(referredUsersTotalPages - 1, referredUsersPage + 1);
      for (let i = start; i <= end; i++) {
        items.push(
          <PaginationItem key={i}>
            <PaginationLink
              onClick={() => handleReferredUsersPageChange(i)}
              isActive={referredUsersPage === i}
              className="cursor-pointer"
            >
              {i}
            </PaginationLink>
          </PaginationItem>
        );
      }

      // Right ellipsis
      if (referredUsersPage < referredUsersTotalPages - 3) {
        items.push(
          <PaginationItem key="ellipsis-right">
            <PaginationEllipsis />
          </PaginationItem>
        );
      }

      // Last page
      if (referredUsersTotalPages > 1) {
        items.push(
          <PaginationItem key={referredUsersTotalPages}>
            <PaginationLink
              onClick={() => handleReferredUsersPageChange(referredUsersTotalPages)}
              isActive={referredUsersPage === referredUsersTotalPages}
              className="cursor-pointer"
            >
              {referredUsersTotalPages}
            </PaginationLink>
          </PaginationItem>
        );
      }
    }

    return items;
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  // const getStatusBadge = (status: string) => {
  //   switch (status) {
  //     case 'active':
  //       return <Badge className="bg-green-500/10 text-green-500 border-green-500/20 font-mono"><CheckCircle className="w-3 h-3 mr-1" />ACTIVE</Badge>;
  //     case 'suspended':
  //       return <Badge className="bg-red-500/10 text-red-500 border-red-500/20 font-mono"><Ban className="w-3 h-3 mr-1" />SUSPENDED</Badge>;
  //     case 'pending':
  //       return <Badge className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20 font-mono"><Clock className="w-3 h-3 mr-1" />PENDING</Badge>;
  //     default:
  //       return <Badge variant="outline" className="font-mono">{status.toUpperCase()}</Badge>;
  //   }
  // };



  // const handleUserAction = async (userId: string | number, action: string) => {
  //   try {
  //     // Optimistically update UI
  //     setUsers(prev => prev.map(user => {
  //       if (String(user.id) === String(userId)) {
  //         switch (action) {
  //           case 'suspend':
  //             return user; // Status not supported in User interface
  //           case 'activate':
  //             return user; // Status not supported in User interface
  //           case 'promote':
  //             return { ...user, role: user.role === 'user' ? 'moderator' : 'admin' };
  //           case 'demote':
  //             return { ...user, role: user.role === 'admin' ? 'moderator' : 'user' };
  //           default:
  //             return user;
  //         }
  //       }
  //       return user;
  //     }));

  //     // TODO: Make API call to update user on server
  //     // const response = await fetch(`/api/admin/users/${userId}`, {
  //     //   method: 'PATCH',
  //     //   headers: { 'Content-Type': 'application/json' },
  //     //   body: JSON.stringify({ action })
  //     // });
  //     // 
  //     // if (!response.ok) {
  //     //   throw new Error('Failed to update user');
  //     // }
  //   } catch (err) {
  //     console.error('Error updating user:', err);
  //     // Revert optimistic update on error
  //     fetchUsers();
  //   }
  // };

  return (
    <div className={className}>
      <Card className="border-2 border-dashed border-purple-500/20 bg-gradient-to-br from-purple-500/5 to-cyan-500/5">
        <CardHeader className="bg-gradient-to-r from-purple-500/10 to-cyan-500/10">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <CardTitle className="flex items-center gap-2 font-mono">
              <div className="p-1 bg-purple-500/20 rounded border border-dashed border-purple-500/40">
                <Users className="w-4 h-4 text-purple-500" />
              </div>
              USER_MANAGEMENT
            </CardTitle>
            <Button
              onClick={handleDownloadDIDVerifiedUsers}
              disabled={isDownloadingDID}
              variant="outline"
              size="sm"
              className="font-mono border-dashed border-green-500/30 hover:border-solid hover:bg-green-50 dark:hover:bg-green-900/20 text-green-600 hover:text-green-700 transition-all duration-200"
            >
              {isDownloadingDID ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  [DOWNLOADING...]
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  [EXPORT_DID_VERIFIED]
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Filters and Search */}
          <div className="flex flex-col lg:flex-row gap-4 mt-5">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="[SEARCH_USERS]"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 font-mono border-dashed border-purple-500/30 focus:border-solid"
              />
            </div>
            
            {/* Sort Controls  */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-muted-foreground font-mono">[SORT]</span>
                <Select value={sortField} onValueChange={(value: 'total_points' | 'created_at') => setSortField(value as 'total_points' | 'created_at')}>
                  <SelectTrigger className="w-36 font-mono border-dashed border-purple-500/30 focus:border-solid">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="font-mono">
                    <SelectItem value="total_points">Points</SelectItem>
                    <SelectItem value="created_at">Join Date</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSortOrder(prev => prev === 'ASC' ? 'DESC' : 'ASC')}
                  className="px-3 font-mono border-dashed border-purple-500/30 hover:border-solid"
                  title={`Sort ${sortOrder === 'ASC' ? 'Descending' : 'Ascending'}`}
                >
                  {getSortIcon(sortField)}
                </Button>
              </div>
            </div>
            {/* <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40 font-mono border-dashed border-purple-500/30">
                <SelectValue placeholder="[STATUS]" />
              </SelectTrigger>
              <SelectContent className="font-mono">
                <SelectItem value="all">[ALL_STATUS]</SelectItem>
                <SelectItem value="active">[ACTIVE]</SelectItem>
                <SelectItem value="suspended">[SUSPENDED]</SelectItem>
                <SelectItem value="pending">[PENDING]</SelectItem>
              </SelectContent>
            </Select>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-40 font-mono border-dashed border-purple-500/30">
                <SelectValue placeholder="[ROLE]" />
              </SelectTrigger>
              <SelectContent className="font-mono">
                <SelectItem value="all">[ALL_ROLES]</SelectItem>
                <SelectItem value="user">[USER]</SelectItem>
                <SelectItem value="moderator">[MODERATOR]</SelectItem>
                <SelectItem value="admin">[ADMIN]</SelectItem>
              </SelectContent>
            </Select> */}

          </div>

          {/* Users Table */}
          <div className="border-2 border-dashed border-purple-500/20 rounded-lg overflow-hidden bg-gradient-to-br from-white/50 to-purple-50/30 dark:from-gray-900/50 dark:to-purple-900/10">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
                <span className="ml-3 font-mono text-purple-500">LOADING_USERS...</span>
              </div>
            ) : error ? (
              <div className="flex items-center justify-center py-12 text-red-500">
                <AlertCircle className="w-8 h-8" />
                <span className="ml-2 font-mono">ERROR: {error}</span>
                <Button 
                  onClick={fetchUsers} 
                  className="ml-4 font-mono bg-red-500/10 border border-red-500/30 hover:bg-red-500/20"
                  size="sm"
                >
                  RETRY
                </Button>
              </div>
            ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-gradient-to-r from-purple-500/10 to-cyan-500/10 border-b-2 border-dashed border-purple-500/30">
                  <TableHead className="font-mono font-semibold text-purple-700 dark:text-purple-300 py-4">[USER]</TableHead>
                  <TableHead className="font-mono font-semibold text-purple-700 dark:text-purple-300 py-4">[REFERRED BY]</TableHead>
                  <TableHead className="font-mono font-semibold text-purple-700 dark:text-purple-300 py-4">[STATUS]</TableHead>
                  {/* <TableHead 
                    className={cn(
                      "font-mono font-semibold py-4 cursor-pointer hover:bg-purple-500/8 transition-colors select-none",
                      sortField === 'total_points' 
                        ? "text-purple-600 dark:text-purple-400" 
                        : "text-purple-700 dark:text-purple-300"
                    )}
                    onClick={() => handleSort('total_points')}
                    title="Click to sort by points"
                  >
                    <div className="flex items-center gap-2">
                      [STATS]
                      {sortField === 'total_points' && getSortIcon('total_points')}
                    </div>
                  </TableHead> */}
                  <TableHead className="font-mono font-semibold text-purple-700 dark:text-purple-300 py-4">[USD_BALANCE]</TableHead>
                  <TableHead className="font-mono font-semibold text-purple-700 dark:text-purple-300 py-4">[WITHDRAWN_USD]</TableHead>
                  <TableHead 
                    className={cn(
                      "font-mono font-semibold py-4 cursor-pointer hover:bg-purple-500/8 transition-colors select-none",
                      sortField === 'created_at' 
                        ? "text-purple-600 dark:text-purple-400" 
                        : "text-purple-700 dark:text-purple-300"
                    )}
                    onClick={() => handleSort('created_at')}
                    title="Click to sort by join date"
                  >
                    <div className="flex items-center gap-2">
                      [JOINED]
                      {sortField === 'created_at' && getSortIcon('created_at')}
                    </div>
                  </TableHead>
                  <TableHead className="font-mono font-semibold text-purple-700 dark:text-purple-300 py-4 text-center">[ACTIONS]</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id} className="border-b border-dashed border-purple-500/10 hover:bg-gradient-to-r hover:from-purple-500/8 hover:to-cyan-500/8 transition-all duration-200 group">
                    <TableCell className="py-4">
                      <div className="flex items-center gap-4">
                        <Avatar className="h-10 w-10 border-2 border-dashed border-purple-500/30 group-hover:border-solid transition-all duration-200">
                          <AvatarImage src={user.avatar} alt={user.name} />
                          <AvatarFallback className="bg-gradient-to-r from-purple-500 to-cyan-500 text-white font-mono text-sm font-semibold">
                            {getInitials(`${user.firstName} ${user.lastName}`)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <div className="font-semibold font-mono text-gray-900 dark:text-gray-100 truncate">{user.firstName} {user.lastName}</div>
                          <div className="text-sm text-muted-foreground font-mono truncate">@{user.username}</div>
                          <div className="text-xs text-muted-foreground font-mono truncate">{user.email}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="py-4">
                      {user.referred_partner ? (
                        <Badge className="bg-blue-100 text-blue-800 border-blue-200 font-mono text-xs">
                          Partner: {user?.referred_partner?.name}
                        </Badge>
                      ) : user.referral ? (
                        <Badge className="bg-purple-100 text-purple-800 border-purple-200 font-mono text-xs">
                          User: {user?.referral?.firstName} {user?.referral?.lastName}
                        </Badge>
                      ) : (
                        <Badge className="bg-gray-100 text-gray-800 border-gray-200 font-mono text-xs">
                          DIRECT
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="py-4">
                      <div className="flex items-center gap-2">
                        {user.email_verified ? (
                          <Badge className="bg-green-100 text-green-800 border-green-200 font-mono text-xs">
                            VERIFIED
                          </Badge>
                        ) : (
                          <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200 font-mono text-xs">
                            UNVERIFIED
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    {/* <TableCell className="py-4">
                      <div className="flex items-center gap-3 text-sm font-mono">
                        <div className="flex items-center gap-1.5 bg-purple-50 dark:bg-purple-900/20 px-2 py-1 rounded border border-dashed border-purple-300/50">
                          <Star className="w-3.5 h-3.5 text-purple-600" />
                          <span className="font-semibold">{user.total_points?.toLocaleString()}</span>
                        </div>
                       
                      </div>
                    </TableCell> */}
                    <TableCell className="py-4">
                      <div className="text-sm font-mono">
                        <span className="text-muted-foreground">$</span>
                        <span className="font-semibold">{((user.total_points || 0) * 0.01).toFixed(2)}</span>
                      </div>
                    </TableCell>
                    <TableCell className="py-4">
                      <div className="flex items-center gap-1.5 bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded border border-dashed border-green-300/50 w-fit">
                        <DollarSign className="w-3.5 h-3.5 text-green-600" />
                        <span className="font-semibold text-sm font-mono">{(user.widhdraw_usd || 0)}</span>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-sm py-4 text-muted-foreground">{user.created_at}</TableCell>
                    <TableCell className="py-4">
                      <div className="flex items-center justify-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewProfile(user)}
                          className="h-8 px-3 border border-dashed border-blue-500/30 hover:border-solid hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-600 hover:text-blue-700 transition-all duration-200"
                        >
                          <Eye className="w-3.5 h-3.5 mr-1" />
                          View
                        </Button>
                      </div>
                    </TableCell>
                    {/* <TableCell className="py-4">
                      <div className="flex items-center justify-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedUser(user);
                            setIsEditDialogOpen(true);
                          }}
                          

                          className="h-8 px-3 border border-dashed border-blue-500/30 hover:border-solid hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-600 hover:text-blue-700 transition-all duration-200"
                        >
                          <Edit className="w-3.5 h-3.5 mr-1" />
                          Edit
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0 border border-dashed border-purple-500/30 hover:border-solid hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all duration-200">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="font-mono border-2 border-dashed border-purple-500/30">
                          <DropdownMenuLabel>[ACTIONS]</DropdownMenuLabel>
                          <DropdownMenuSeparator className="border-dashed border-purple-500/20" />
                          <DropdownMenuItem onClick={() => {
                            setSelectedUser(user);
                            setIsEditDialogOpen(true);
                          }}>
                            <Edit className="mr-2 h-4 w-4" />
                            [EDIT]
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleUserAction(user.id || user.username, 'suspend')} className="text-red-600">
                            <Ban className="mr-2 h-4 w-4" />
                            [SUSPEND]
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleUserAction(user.id || user.username, 'activate')} className="text-green-600">
                            <CheckCircle className="mr-2 h-4 w-4" />
                            [ACTIVATE]
                          </DropdownMenuItem>
                          {user.role !== 'admin' && (
                            <DropdownMenuItem onClick={() => handleUserAction(user.id || user.username, 'promote')} className="text-blue-600">
                              <Shield className="mr-2 h-4 w-4" />
                              [PROMOTE]
                            </DropdownMenuItem>
                          )}
                          {user.role !== 'user' && (
                            <DropdownMenuItem onClick={() => handleUserAction(user.id || user.username, 'demote')} className="text-orange-600">
                              <Shield className="mr-2 h-4 w-4" />
                              [DEMOTE]
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator className="border-dashed border-purple-500/20" />
                          <DropdownMenuItem className="text-red-600">
                            <Trash2 className="mr-2 h-4 w-4" />
                            [DELETE]
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell> */}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            )}
          </div>

          {/* Pagination Controls (Leaderboard-style) */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground font-mono">[ROWS_PER_PAGE]</span>
              <Select value={String(limit)} onValueChange={(val) => { setLimit(Number(val)); setPage(1); }}>
                <SelectTrigger className="w-24 font-mono border-dashed border-purple-500/30">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="font-mono">
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() => handlePageChange(page - 1)}
                      className={cn(
                        'cursor-pointer',
                        (loading || page <= 1) && 'pointer-events-none opacity-50'
                      )}
                    />
                  </PaginationItem>

                  {renderPaginationItems()}

                  <PaginationItem>
                    <PaginationNext
                      onClick={() => handlePageChange(page + 1)}
                      className={cn(
                        'cursor-pointer',
                        (loading || page >= totalPages) && 'pointer-events-none opacity-50'
                      )}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          </div>

          {/* Stats Summary */}
          {/* <div className="grid grid-cols-1 md:grid-cols-3 gap-4"> */}
            {/* <div className="bg-gradient-to-r from-blue-500/10 to-cyan-500/10 p-4 rounded-lg border border-dashed border-blue-500/20">
              <div className="text-2xl font-bold font-mono text-blue-500">{users.length}</div>
              <div className="text-sm text-muted-foreground font-mono">TOTAL_USERS</div>
            </div> */}
            {/* <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 p-4 rounded-lg border border-dashed border-green-500/20">
              <div className="text-2xl font-bold font-mono text-green-500">{users.filter(u => u.email_verified).length}</div>
              <div className="text-sm text-muted-foreground font-mono">VERIFIED_USERS</div>
            </div> */}
            {/* <div className="bg-gradient-to-r from-purple-500/10 to-indigo-500/10 p-4 rounded-lg border border-dashed border-purple-500/20">
              <div className="text-2xl font-bold font-mono text-purple-500">{users.filter(u => u.role === 'admin' || u.role === 'moderator').length}</div>
              <div className="text-sm text-muted-foreground font-mono">STAFF_MEMBERS</div>
            </div> */}
            {/* <div className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 p-4 rounded-lg border border-dashed border-yellow-500/20">
              <div className="text-2xl font-bold font-mono text-yellow-500">{users.filter(u => !u.email_verified).length}</div>
              <div className="text-sm text-muted-foreground font-mono">UNVERIFIED</div>
            </div> */}
          {/* </div> */}
        </CardContent>
      </Card>

      {/* User Profile Dialog */}
      <Dialog open={isProfileDialogOpen} onOpenChange={setIsProfileDialogOpen}>
        <DialogContent className="font-mono border-2 border-dashed border-blue-500/30 max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="bg-gradient-to-r from-blue-500 to-cyan-500 bg-clip-text text-transparent flex items-center gap-2">
              <Eye className="w-5 h-5 text-blue-500" />
              [USER_PROFILE]
            </DialogTitle>
            <DialogDescription>
              Detailed information about user activities and social connections.
            </DialogDescription>
          </DialogHeader>
          
          {profileLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
              <span className="ml-3 font-mono text-blue-500">LOADING_PROFILE...</span>
            </div>
          ) : profileError ? (
            <div className="flex items-center justify-center py-12 text-red-500">
              <AlertCircle className="w-8 h-8" />
              <span className="ml-2 font-mono">ERROR: {profileError}</span>
              <Button 
                onClick={() => selectedUser && fetchUserProfile(selectedUser.id || selectedUser.username)} 
                className="ml-4 font-mono bg-red-500/10 border border-red-500/30 hover:bg-red-500/20"
                size="sm"
              >
                RETRY
              </Button>
            </div>
          ) : userProfile ? (
            <div className="space-y-6">
              {/* User Info Header */}
              <Card className="border-dashed border-blue-500/30 bg-gradient-to-r from-blue-50/50 to-cyan-50/50 dark:from-blue-950/30 dark:to-cyan-950/30">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-16 w-16 border-2 border-dashed border-blue-500/50">
                        <AvatarImage 
                          src={userProfile.user.twitterProfile?.twitter_profile_picture || userProfile.user.linkedInProfile?.linked_in_profile_picture} 
                          alt={`${userProfile.user.firstName} ${userProfile.user.lastName}`} 
                        />
                        <AvatarFallback className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-mono text-lg font-semibold">
                          {userProfile.user.firstName[0]}{userProfile.user.lastName[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="space-y-1">
                        <h3 className="text-xl font-semibold font-mono text-blue-700 dark:text-blue-300">
                          {userProfile.user.firstName} {userProfile.user.lastName}
                        </h3>
                        <p className="text-sm text-muted-foreground font-mono">@{userProfile.user.username}</p>
                        <p className="text-sm text-muted-foreground font-mono">{userProfile.user.email}</p>
                        {userProfile.user.bio && (
                          <p className="text-sm text-muted-foreground mt-2">{userProfile.user.bio}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <Badge className={cn(
                        "font-mono text-xs",
                        userProfile.user.email_verified 
                          ? "bg-green-100 text-green-800 border-green-200" 
                          : "bg-yellow-100 text-yellow-800 border-yellow-200"
                      )}>
                        {userProfile.user.email_verified ? 'VERIFIED' : 'UNVERIFIED'}
                      </Badge>
                      <div className="flex items-center gap-2 bg-purple-50 dark:bg-purple-900/20 px-3 py-2 rounded border border-dashed border-purple-300/50">
                        <Star className="w-4 h-4 text-purple-600" />
                        <span className="font-semibold font-mono">{userProfile.user.total_points.toLocaleString()}</span>
                        <span className="text-xs text-muted-foreground">pts</span>
                      </div>
                      <div className="flex items-center gap-2 bg-green-50 dark:bg-green-900/20 px-3 py-2 rounded border border-dashed border-green-300/50">
                        <DollarSign className="w-4 h-4 text-green-600" />
                        <span className="font-semibold font-mono text-green-700">
                          ${(userProfile.user.total_points * 0.01).toFixed(2)}
                        </span>
                      </div>
                      {/* <div className="flex items-center gap-2 bg-orange-50 dark:bg-orange-900/20 px-3 py-2 rounded border border-dashed border-orange-300/50">
                        <DollarSign className="w-4 h-4 text-orange-600" />
                        <span className="font-semibold font-mono text-orange-700">
                          ${(userProfile.user.widhdraw_usd || 0)}
                        </span>
                        <span className="text-xs text-muted-foreground">withdrawn</span>
                      </div> */}
                    </div>
                  </div>
                </CardHeader>
              </Card>

              {/* Social Connections */}
              <Card className="border-dashed border-purple-500/30">
                <CardHeader>
                  <CardTitle className="font-mono text-purple-700 dark:text-purple-300 flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    [SOCIAL_CONNECTIONS]
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {/* Twitter */}
                    <div className={cn(
                      "flex items-center gap-3 p-3 rounded border border-dashed transition-all",
                      userProfile.user.twitterProfile 
                        ? "border-blue-400/50 bg-blue-50/50 dark:bg-blue-950/20" 
                        : "border-gray-300/50 bg-gray-50/50 dark:bg-gray-800/20"
                    )}>
                      <Twitter className={cn("w-5 h-5", userProfile.user.twitterProfile ? "text-blue-500" : "text-gray-400")} />
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-mono text-muted-foreground">TWITTER/X</div>
                        {userProfile.user.twitterProfile ? (
                          <div className="text-sm font-semibold truncate">@{userProfile.user.twitterProfile.twitter_username}</div>
                        ) : (
                          <div className="text-sm text-gray-500">Not connected</div>
                        )}
                      </div>
                    </div>

                    {/* LinkedIn */}
                    <div className={cn(
                      "flex items-center gap-3 p-3 rounded border border-dashed transition-all",
                      userProfile.user.linkedInProfile 
                        ? "border-blue-600/50 bg-blue-50/50 dark:bg-blue-950/20" 
                        : "border-gray-300/50 bg-gray-50/50 dark:bg-gray-800/20"
                    )}>
                      <Linkedin className={cn("w-5 h-5", userProfile.user.linkedInProfile ? "text-blue-600" : "text-gray-400")} />
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-mono text-muted-foreground">LINKEDIN</div>
                        {userProfile.user.linkedInProfile ? (
                          <div className="text-sm font-semibold truncate">{userProfile.user.linkedInProfile.linked_in_username}</div>
                        ) : (
                          <div className="text-sm text-gray-500">Not connected</div>
                        )}
                      </div>
                    </div>

                    {/* Discord */}
                    <div className={cn(
                      "flex items-center gap-3 p-3 rounded border border-dashed transition-all",
                      userProfile.user.discordProfile 
                        ? "border-indigo-500/50 bg-indigo-50/50 dark:bg-indigo-950/20" 
                        : "border-gray-300/50 bg-gray-50/50 dark:bg-gray-800/20"
                    )}>
                      <MessageSquare className={cn("w-5 h-5", userProfile.user.discordProfile ? "text-indigo-500" : "text-gray-400")} />
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-mono text-muted-foreground">DISCORD</div>
                        {userProfile.user.discordProfile ? (
                          <div className="text-sm font-semibold truncate">{userProfile.user.discordProfile.discord_username}</div>
                        ) : (
                          <div className="text-sm text-gray-500">Not connected</div>
                        )}
                      </div>
                    </div>

                    {/* Facebook */}
                    <div className={cn(
                      "flex items-center gap-3 p-3 rounded border border-dashed transition-all",
                      userProfile.user.facebookProfile 
                        ? "border-blue-700/50 bg-blue-50/50 dark:bg-blue-950/20" 
                        : "border-gray-300/50 bg-gray-50/50 dark:bg-gray-800/20"
                    )}>
                      <div className={cn("w-5 h-5 rounded text-white font-bold text-xs flex items-center justify-center", userProfile.user.facebookProfile ? "bg-blue-700" : "bg-gray-400")}>
                        f
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-mono text-muted-foreground">FACEBOOK</div>
                        {userProfile.user.facebookProfile ? (
                          <div className="text-sm font-semibold truncate">{userProfile.user.facebookProfile.facebook_username}</div>
                        ) : (
                          <div className="text-sm text-gray-500">Not connected</div>
                        )}
                      </div>
                    </div>

                    {/* Hedera */}
                    <div className={cn(
                      "flex items-center gap-3 p-3 rounded border border-dashed transition-all",
                      userProfile.user.hederaProfile 
                        ? "border-green-500/50 bg-green-50/50 dark:bg-green-950/20" 
                        : "border-gray-300/50 bg-gray-50/50 dark:bg-gray-800/20"
                    )}>
                      <div className={cn("w-5 h-5 rounded text-white font-bold text-xs flex items-center justify-center", userProfile.user.hederaProfile ? "bg-green-500" : "bg-gray-400")}>
                        H
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-mono text-muted-foreground">HEDERA</div>
                        {userProfile.user.hederaProfile ? (
                          <div className="text-sm font-semibold truncate">{userProfile.user.hederaProfile.hedera_id.slice(0, 20)}...</div>
                        ) : (
                          <div className="text-sm text-gray-500">Not connected</div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Quest Statistics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="border-dashed border-green-500/30 bg-gradient-to-br from-green-50/50 to-emerald-50/50 dark:from-green-950/30 dark:to-emerald-950/30">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-green-500/10 rounded border border-dashed border-green-500/30">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <div className="text-2xl font-bold font-mono text-green-700">{userProfile.total_completed}</div>
                        <div className="text-sm font-mono text-green-600/80">COMPLETED</div>
                      </div>
                    </div>
                  </CardHeader>
                </Card>

                <Card className="border-dashed border-yellow-500/30 bg-gradient-to-br from-yellow-50/50 to-orange-50/50 dark:from-yellow-950/30 dark:to-orange-950/30">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-yellow-500/10 rounded border border-dashed border-yellow-500/30">
                        <Clock className="w-5 h-5 text-yellow-600" />
                      </div>
                      <div>
                        <div className="text-2xl font-bold font-mono text-yellow-700">{userProfile.tottal_pending}</div>
                        <div className="text-sm font-mono text-yellow-600/80">PENDING</div>
                      </div>
                    </div>
                  </CardHeader>
                </Card>

                <Card className="border-dashed border-red-500/30 bg-gradient-to-br from-red-50/50 to-pink-50/50 dark:from-red-950/30 dark:to-pink-950/30">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-red-500/10 rounded border border-dashed border-red-500/30">
                        <XCircle className="w-5 h-5 text-red-600" />
                      </div>
                      <div>
                        <div className="text-2xl font-bold font-mono text-red-700">{userProfile.total_rejected}</div>
                        <div className="text-sm font-mono text-red-600/80">REJECTED</div>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              </div>

              {/* Referred Users Section */}
              <Card className="border-dashed border-cyan-500/30">
                <CardHeader>
                  <CardTitle className="font-mono text-cyan-700 dark:text-cyan-300 flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    [REFERRED_USERS] ({referredUsersCount})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {referredUsersLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin text-cyan-500" />
                      <span className="ml-3 font-mono text-cyan-500">LOADING_REFERRED_USERS...</span>
                    </div>
                  ) : referredUsersError ? (
                    <div className="flex items-center justify-center py-8 text-red-500">
                      <AlertCircle className="w-6 h-6" />
                      <span className="ml-2 font-mono text-sm">ERROR: {referredUsersError}</span>
                    </div>
                  ) : referredUsers.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground font-mono">
                      No referred users yet
                    </div>
                  ) : (
                    <>
                      <div className="space-y-2">
                        {referredUsers.map((refUser) => (
                          <div key={refUser.id} className="flex items-center justify-between p-3 bg-cyan-50/50 dark:bg-cyan-900/20 rounded border border-dashed border-cyan-300/50 hover:bg-cyan-100/50 dark:hover:bg-cyan-900/30 transition-colors">
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <Avatar className="h-10 w-10 border-2 border-dashed border-cyan-500/30">
                                <AvatarFallback className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-mono text-xs font-semibold">
                                  {refUser.firstName[0]}{refUser.lastName[0]}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <div className="font-medium text-sm truncate">
                                  {refUser.firstName} {refUser.lastName}
                                </div>
                                <div className="text-xs text-muted-foreground font-mono truncate">
                                  @{refUser.username}
                                </div>
                                <div className="text-xs text-muted-foreground truncate">
                                  {refUser.email}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-3 ml-3">
                              <Badge className={cn(
                                "font-mono text-xs whitespace-nowrap",
                                refUser.email_verified 
                                  ? "bg-green-100 text-green-800 border-green-200" 
                                  : "bg-yellow-100 text-yellow-800 border-yellow-200"
                              )}>
                                {refUser.email_verified ? 'VERIFIED' : 'UNVERIFIED'}
                              </Badge>
                              <div className="flex items-center gap-1.5 bg-purple-50 dark:bg-purple-900/20 px-3 py-1.5 rounded border border-dashed border-purple-300/50 whitespace-nowrap">
                                <Star className="w-3.5 h-3.5 text-purple-600" />
                                <span className="font-semibold font-mono text-sm">{refUser.total_points.toLocaleString()}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      {/* Pagination for Referred Users */}
                      {referredUsersTotalPages > 1 && (
                        <div className="flex items-center justify-center pt-2">
                          <Pagination>
                            <PaginationContent>
                              <PaginationItem>
                                <PaginationPrevious
                                  onClick={() => handleReferredUsersPageChange(referredUsersPage - 1)}
                                  className={cn(
                                    'cursor-pointer',
                                    (referredUsersLoading || referredUsersPage <= 1) && 'pointer-events-none opacity-50'
                                  )}
                                />
                              </PaginationItem>

                              {renderReferredUsersPaginationItems()}

                              <PaginationItem>
                                <PaginationNext
                                  onClick={() => handleReferredUsersPageChange(referredUsersPage + 1)}
                                  className={cn(
                                    'cursor-pointer',
                                    (referredUsersLoading || referredUsersPage >= referredUsersTotalPages) && 'pointer-events-none opacity-50'
                                  )}
                                />
                              </PaginationItem>
                            </PaginationContent>
                          </Pagination>
                        </div>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Quest Details Tabs */}
              <div className="space-y-4">
                <div className="border-2 border-dashed border-gray-300/50 rounded-lg bg-gradient-to-r from-gray-50/30 to-gray-100/30 dark:from-gray-800/30 dark:to-gray-700/30">
                  {/* Completed Quests */}
                  {userProfile.completedQuests.length > 0 && (
                    <div className="p-4 border-b border-dashed border-gray-300/50">
                      <h4 className="font-mono font-semibold text-green-700 mb-3 flex items-center gap-2">
                        <CheckCircle className="w-4 h-4" />
                        COMPLETED_QUESTS ({userProfile.completedQuests.length})
                      </h4>
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {userProfile.completedQuests.map((quest) => (
                          <div key={quest.id} className="flex items-center justify-between p-3 bg-green-50/50 dark:bg-green-900/20 rounded border border-dashed border-green-300/50">
                            <div className="flex-1">
                              <div className="font-medium text-sm">{quest.title}</div>
                              <div className="text-xs text-muted-foreground font-mono">
                                {quest.platform_type} • {quest.difficulty} • {new Date(quest.created_at).toLocaleDateString()}
                              </div>
                            </div>
                            <Badge className="bg-green-100 text-green-800 border-green-200 font-mono text-xs">
                              +{quest.reward} pts
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Pending Quests */}
                  {userProfile.pendingQuests.length > 0 && (
                    <div className="p-4 border-b border-dashed border-gray-300/50">
                      <h4 className="font-mono font-semibold text-yellow-700 mb-3 flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        PENDING_QUESTS ({userProfile.pendingQuests.length})
                      </h4>
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {userProfile.pendingQuests.map((quest) => (
                          <div key={quest.id} className="flex items-center justify-between p-3 bg-yellow-50/50 dark:bg-yellow-900/20 rounded border border-dashed border-yellow-300/50">
                            <div className="flex-1">
                              <div className="font-medium text-sm">{quest.title}</div>
                              <div className="text-xs text-muted-foreground font-mono">
                                {quest.platform_type} • {quest.difficulty} • {new Date(quest.created_at).toLocaleDateString()}
                              </div>
                            </div>
                            <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200 font-mono text-xs">
                              {quest.reward} pts
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Rejected Quests */}
                  {userProfile.rejectedQuests.length > 0 && (
                    <div className="p-4">
                      <h4 className="font-mono font-semibold text-red-700 mb-3 flex items-center gap-2">
                        <XCircle className="w-4 h-4" />
                        REJECTED_QUESTS ({userProfile.rejectedQuests.length})
                      </h4>
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {userProfile.rejectedQuests.map((quest) => (
                          <div key={quest.id} className="flex items-center justify-between p-3 bg-red-50/50 dark:bg-red-900/20 rounded border border-dashed border-red-300/50">
                            <div className="flex-1">
                              <div className="font-medium text-sm">{quest.title}</div>
                              <div className="text-xs text-muted-foreground font-mono">
                                {quest.platform_type} • {quest.difficulty} • {new Date(quest.created_at).toLocaleDateString()}
                              </div>
                            </div>
                            <Badge className="bg-red-100 text-red-800 border-red-200 font-mono text-xs">
                              {quest.reward} pts
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : null}
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setIsProfileDialogOpen(false);
                setUserProfile(null);
                setSelectedUser(null);
                setReferredUsers([]);
                setReferredUsersCount(0);
                setReferredUsersPage(1);
                setReferredUsersLimit(10);
                setReferredUsersTotalPages(1);
              }} 
              className="font-mono border-dashed"
            >
              [CLOSE]
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="font-mono border-2 border-dashed border-purple-500/30">
          <DialogHeader>
            <DialogTitle className="bg-gradient-to-r from-purple-500 to-cyan-500 bg-clip-text text-transparent">
              [EDIT_USER]
            </DialogTitle>
            <DialogDescription>
              Modify user details and permissions.
            </DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium font-mono">[FIRST_NAME]</label>
                  <Input defaultValue={selectedUser.firstName} className="font-mono border-dashed" />
                </div>
                <div>
                  <label className="text-sm font-medium font-mono">[LAST_NAME]</label>
                  <Input defaultValue={selectedUser.lastName} className="font-mono border-dashed" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium font-mono">[USERNAME]</label>
                  <Input defaultValue={selectedUser.username} className="font-mono border-dashed" />
                </div>
                <div>
                  <label className="text-sm font-medium font-mono">[EMAIL]</label>
                  <Input defaultValue={selectedUser.email} className="font-mono border-dashed" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium font-mono">[REFERRED BY]</label>
                  <Input 
                    value={
                      selectedUser.referred_partner 
                        ? `Partner: ${selectedUser.referred_partner.name}` 
                        : selectedUser.referral 
                          ? `User: ${selectedUser.referral.firstName} ${selectedUser.referral.lastName}`
                          : 'Direct Registration'
                    } 
                    className="font-mono border-dashed" 
                    readOnly 
                  />
                </div>
                <div>
                  <label className="text-sm font-medium font-mono">[STATUS]</label>
                  <Select defaultValue="active">
                    <SelectTrigger className="font-mono border-dashed">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="font-mono">
                      <SelectItem value="active">[ACTIVE]</SelectItem>
                      <SelectItem value="suspended">[SUSPENDED]</SelectItem>
                      <SelectItem value="pending">[PENDING]</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} className="font-mono border-dashed">
              [CANCEL]
            </Button>
            <Button onClick={() => setIsEditDialogOpen(false)} className="font-mono bg-gradient-to-r from-purple-500 to-cyan-500">
              [SAVE_CHANGES]
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default UserManagement;