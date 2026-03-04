// Core types for the Hedera Quest Machine
export interface UserLevel {
  id: number;
  user_id: number;
  level: number;
  progress: number;
  max_progress: number;
  created_at: string;
  updated_at: string;
}

export interface User {

  id: string | number;
  firstName?: string;
  lastName?: string;
  username?: string;
  name: string;
  email: string;
  avatar?: string;
  bio?: string;
  hederaAccountId: string | null;
  points: number;
  total_points?: number;
  level: number;
  streak: number;
  joinedAt: string;
  role: 'user' | 'admin' | 'moderator';
  badges: Badge[];
  completedQuests: string[];
  userLevel?: UserLevel;
  linkedInProfile?: any;
  facebookProfile?: any;
  twitterProfile?: any;
  discordProfile?: any;
  email_verified?: boolean;
  referral_code?: string;
  evm_wallet_address?: string | null;
  hederaProfile?: {
    id: number;
    hedera_id: string;
    hedera_did?: string | null;
    verified: boolean;
    user_id: number;
    created_at: string;
    updated_at: string;
  } | null;
}

export interface Quest {
  id: string | number;
  title: string;
  description: string;
  category?: QuestCategory;
  difficulty: Difficulty;
  points?: number;
  reward?: string | number;
  estimatedTime?: string;
  requirements?: string[];
  submissionType?: SubmissionType;
  submissionInstructions?: string;
  quest_type?: string;
  isActive?: boolean;
  status?: string;
  createdAt?: string;
  created_at?: string;
  updatedAt?: string;
  updated_at?: string;
  completions?: number;
  maxCompletions?: number;
  maxParticipants?: number;
  currentParticipants?: number;
  prerequisites?: string[];
  thumbnail?: string;
  startDate?: string;
  endDate?: string;
  createdBy?: number;
  added_by?: number;
  creator?: {
    id: number;
    firstName: string;
    lastName: string;
    username: string;
  };
  badges?: Array<{
    id: number;
    name: string;
  }>;
  platform_type?: string;
  interaction_type?: string;
  quest_link?: string;
  channel_id?: string;
  event_id?: number;
  progress_to_add?: number;
  user_status?: string;
  quest_steps?: string;
  manual_submission?: boolean;
  with_evidence?: boolean;
  requires_attachment?: boolean;
  featured?: boolean;
  campaignId?: string | number | null;
  campaignAddress?: string | null;
  rewardTokenAddress?: string | null;
  verificationMode?: 'DirectVerifierCall' | 'EIP712Voucher' | 'MerkleRoot' | null;
  payoutMode?: 'FixedPerWinner' | 'VariableClaim' | null;
  fixedRewardAmount?: string | null;
  totalBudget?: string | null;
  rulesHash?: string | null;
  verifierGroupId?: string | null;
}

export interface Submission {
  id: string;
  questId: string;
  userId: string;
  status: SubmissionStatus;
  submittedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  content: SubmissionContent;
  feedback?: string;
  points?: number;
  quest?: Quest;
  user?: {
    id?: string | number;
    username?: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    evm_wallet_address?: string | null;
  };
  approvalStatus?: 'pending' | 'submitted' | 'failed' | null;
  approvalTxHash?: string | null;
  approvalAmountAtomic?: string | null;
  approvalErrorMessage?: string | null;
}

export interface Badge {
  id: string | number;
  name: string;
  description: string;
  rarity: BadgeRarity;
  icon?: string;
  image?: string | null;
  earnedAt?: string;
  category?: string;
  maxToObtain?: number;
  points?: number;
  isActive?: boolean;
  createdBy?: number;
  created_at?: string;
  updated_at?: string;
}

export interface Event {
  id: number;
  title: string;
  description: string;
  reward: string;
  reward_image: string;
  created_at: string;
  updated_at: string;
  startDate?: string;
  endDate?: string;
  type?: EventType;
  quests?: string[];
  participants?: number;
  maxParticipants?: number;
  isActive?: boolean;
}

export type QuestCategory =
  | 'getting-started'
  | 'defi'
  | 'nfts'
  | 'development'
  | 'consensus'
  | 'smart-contracts'
  | 'token-service'
  | 'file-service'
  | 'community';

export type Difficulty = 'easy' | 'medium' | 'hard' | 'beginner' | 'intermediate' | 'advanced' | 'expert' | 'master';

export type SubmissionType = 'url' | 'text' | 'file' | 'transaction-id' | 'account-id';

export type SubmissionStatus = 'pending' | 'approved' | 'rejected' | 'needs-revision' | 'validated';

export type BadgeRarity = 'common' | 'rare' | 'epic' | 'legendary';

export type EventType = 'hackathon' | 'cohort' | 'challenge' | 'community-event';

export interface SubmissionContent {
  type: SubmissionType;
  url?: string;
  text?: string;
  fileName?: string;
  transactionId?: string;
  accountId?: string;
}

export interface LeaderboardEntry {
  id: number;
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  bio: string;
  email_verified: boolean;
  total_points: number;
  rank: string;
}

export interface LeaderboardResponse {
  success: boolean;
  data: {
    rank: number;
    users: LeaderboardEntry[];
    numberOfPages: number;
    page: number;
    limit: number;
  };
}

export interface DashboardStats {
  totalUsers: number;
  activeQuests: number;
  totalSubmissions: number;
  approvalRate: number;
  avgCompletionTime: number;
  popularCategories: Array<{
    category: QuestCategory;
    count: number;
  }>;
}

export interface FilterOptions {
  categories: QuestCategory[];
  difficulties: Difficulty[];
  search: string;
  showCompleted: boolean;
}

// Badge creation types
export interface CreateBadgeRequest {
  name: string;
  description: string;
  maxToObtain: number;
  rarity: BadgeRarity;
  points: number;
  image?: string | File;
  isActive?: boolean;
}

export interface CreateBadgeResponse {
  success: boolean;
  data: {
    id: number;
    name: string;
    description: string;
    image: string | null;
    maxToObtain: number;
    rarity: BadgeRarity;
    points: number;
    isActive: boolean;
    createdBy: number;
    created_at: string;
    updated_at: string;
  };
  message: string;
}

export interface ListBadgesResponse {
  success: boolean;
  data: Badge[];
  count: number;
}

export interface GetBadgeResponse {
  success: boolean;
  data: Badge;
}

export interface BadgeFilters {
  rarity?: BadgeRarity;
  isActive?: boolean;
  createdBy?: number;
}

// Quest Update Types
export interface UpdateQuestRequest {
  title?: string;
  description?: string;
  reward?: number;
  difficulty?: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  status?: 'active' | 'completed' | 'expired' | 'draft';
  startDate?: string;
  endDate?: string;
  maxParticipants?: number;
  badgeIds?: number[];
  manual_submission?: boolean;
  with_evidence?: boolean;
  requires_attachment?: boolean;
}

export interface UpdateQuestResponse {
  success: boolean;
  data: {
    id: number;
    title: string;
    description: string;
    reward: string;
    difficulty: string;
    status: string;
    startDate: string;
    endDate: string;
    maxParticipants: number;
    currentParticipants: number;
    createdBy: number;
    created_at: string;
    updated_at: string;
    badges: Array<{
      id: number;
      name: string;
    }>;
  };
  message: string;
}

// Pagination Types
export interface PaginatedResponse<T> {
  success: boolean;
  page: number;
  limit: number;
  data: T[];
  numberOfPages: number;
  count: number; // Total count across all pages
}

export interface UserQuestsResponse extends PaginatedResponse<Quest> {
  quests: Quest[];
}

export interface QuestFilters {
  featured?: boolean;
  search?: string;
  status?: string;
  page?: number;
  limit?: number;
}

// Partner Types
export interface Partner {
  id: number;
  name: string;
  photo?: string;
  referral_code: string;
  numberOfReferredUsers?: number;
  numberOfDidReferredUsers?: number;
  numberOfDorrahacksReferredUsers?: number;
  numberOfCompletedReferredUsers?: number;
}

export interface PartnersResponse {
  success: boolean;
  partners: Partner[];
  numberOfPages: number;
  page: number;
  limit: number;
}

// Referral Types
export interface ReferredUser {
  id: number;
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  bio: string;
  email_verified: boolean;
  total_points: number;
}

export interface ReferralProfileResponse {
  success: boolean;
  user: {
    id: number;
    firstName: string;
    lastName: string;
    username: string;
    email: string;
    bio: string;
    email_verified: boolean;
    total_points: number;
    referral_code: string;
  };
  referredUsers: ReferredUser[];
  countReferral: number;
  page: number;
  limit: number;
  numberOfPages: number;
}

// Wallet Types
export interface Wallet {
  id: number;
  user_id: number;
  account_id: string;
  created_at: string;
  updated_at: string;
}

export interface EvmWalletResponse {
  success: boolean;
  walletAddress: string | null;
}

export interface ClaimableCampaign {
  completionId: number;
  questId: number;
  title: string;
  campaignId: string | number | null;
  campaignAddress: string;
  rewardTokenAddress: string | null;
  verificationMode: 'DirectVerifierCall' | 'EIP712Voucher' | 'MerkleRoot' | null;
  payoutMode: 'FixedPerWinner' | 'VariableClaim' | null;
  rewardAmountAtomic: string | null;
  winnerWalletAddress: string | null;
  approvalStatus: 'pending' | 'submitted' | 'failed' | null;
  approvalTxHash: string | null;
  approvalErrorMessage: string | null;
  submissionStatus: SubmissionStatus | string;
  validatedAt: string | null;
}

export interface ReviewSubmissionResponse {
  success: boolean;
  validationPersisted?: boolean;
  data: Submission;
  onChainApproval?: {
    success: boolean;
    campaignId?: string | number | null;
    campaignAddress?: string;
    winnerWalletAddress?: string | null;
    approvalAmountAtomic?: string | null;
    approvalTxHash?: string | null;
    approvalStatus?: 'submitted' | 'failed';
    message?: string;
  } | null;
  message: string;
}

export interface WalletsResponse {
  success: boolean;
  wallets: Wallet[];
}

export interface VerifyWalletRequest {
  account_id: string;
}

export interface VerifyWalletResponse {
  success: boolean;
  message: string;
}
