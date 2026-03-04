import {
  ClaimableCampaign,
  EvmWalletResponse,
  User,
  Quest,
  Submission,
  Badge,
  Event,
  LeaderboardEntry,
  LeaderboardResponse,
  FilterOptions,
  SubmissionContent,
  QuestCategory,
  Partner,
  PartnersResponse,
  Wallet,
  WalletsResponse,
  VerifyWalletResponse,
  ReviewSubmissionResponse,
} from "./types";
import { AuthService as ApiAuth } from "./api/auth";
import { QuestsApi } from "./api/quests";
import { SubmissionsApi } from "./api/submissions";
import { BadgesApi } from "./api/badges";
import { LeaderboardApi } from "./api/leaderboard";
import { EventsApi } from "./api/events";
import { UsersApi } from "./api/users";
import { PartnersApi } from "./api/partners";
import { WalletsApi } from "./api/wallets";

export class QuestService {
  // Authentication methods

  static async logout(): Promise<void> {
    try {
      await ApiAuth.logout();
    } catch (error) {
      throw error;
    }
  }

  static async forgotPassword(email: string, recaptchaToken?: string): Promise<{ success: boolean; message: string }> {
    try {
      return await ApiAuth.forgotPassword({ email, recaptchaToken });
    } catch (error) {
      throw error;
    }
  }

  static async updatePassword(newPassword: string, token: string, recaptchaToken?: string): Promise<{ success: boolean; message: string }> {
    try {
      return await ApiAuth.updatePassword({ newPassword, token, recaptchaToken });
    } catch (error) {
      throw error;
    }
  }

  static async getCurrentUser(token?: string): Promise<User | null> {
    try {
      if (!token) {
        return null;
      }

      const profileData = await ApiAuth.me(token);
      if (!profileData) {
        return null;
      }

      // Handle both admin and regular user data structures
      const userData =
        (profileData as any).admin || (profileData as any).user || profileData;
      if (!userData) {
        return null;
      }

      // Clean username by removing any brackets like [Admin]
      const cleanUsername = userData.username
        ? userData.username.replace(/\[.*?\]/g, "").trim()
        : "";

      const user: User = {
        id: String(userData.id),
        firstName: userData.firstName,
        lastName: userData.lastName,
        username: userData.username,
        name: (() => {
          if (profileData.is_admin) {
            // For admins, show full name
            const firstName = userData.firstName || "";
            const lastName = userData.lastName || "";
            const fullName = `${firstName} ${lastName}`.trim();
            return fullName || cleanUsername || "Admin";
          } else {
            // For regular users, show username or full name
            const firstName = userData.firstName || "";
            const lastName = userData.lastName || "";
            const fullName = `${firstName} ${lastName}`.trim();
            return fullName || cleanUsername || "User";
          }
        })(),
        email: userData.email,
        bio: userData.bio || "",
        avatar: "/logo.png",
        hederaAccountId: null,
        // Admin users don't have points
        points: profileData.is_admin ? undefined : userData.total_points || 0,
        level: userData.userLevel?.level || 1,
        streak: 0,
        joinedAt: userData.created_at || new Date().toISOString(),
        role: profileData.is_admin ? "admin" : "user",
        badges: [],
        completedQuests: [],
        userLevel: userData.userLevel,
        facebookProfile: userData.facebookProfile,
        twitterProfile: userData.twitterProfile,
        discordProfile: userData.discordProfile,
        linkedInProfile: userData.linkedInProfile,
        email_verified: userData.email_verified,
        hederaProfile: userData.hederaProfile,
        referral_code: userData.referral_code,
        evm_wallet_address: userData.evm_wallet_address ?? null,
      };

      return user;
    } catch (error) {
      console.error("Error fetching current user:", error);
      return null;
    }
  }

  static async updateUserProfile(
    userId: string,
    updates: Partial<User>
  ): Promise<User> {
    throw new Error("Not implemented");
  }

  // Quest methods
  static async getQuests(filters?: FilterOptions, token?: string): Promise<Quest[]> {
    try {
      const response = await QuestsApi.list(filters, token);
      return Array.isArray(response)
        ? response.map((quest: any) => ({
          ...quest,
          id: String(quest.id),
          createdAt: quest.created_at || quest.createdAt,
          updatedAt: quest.updated_at || quest.updatedAt,
        }))
        : [];
    } catch (error) {
      console.error("Error fetching quests:", error);
      throw error;
    }
  }

  static async getQuest(id: string, token?: string): Promise<Quest | null> {
    try {
      console.log("QuestService.getQuest called with:", { id, hasToken: !!token });

      const response = await QuestsApi.get(id, token);

      console.log("QuestService.getQuest response:", response);

      const processedQuest = {
        ...response,
        id: String(response.id),
        createdAt: response.createdAt || (response as any).created_at,
        updatedAt: response.updatedAt || response.updated_at,
      };

      console.log("Processed quest data:", processedQuest);

      return processedQuest;
    } catch (error) {
      console.error("Error fetching quest:", error);
      throw error;
    }
  }

  static async createQuest(quest: {
    title: string;
    description: string;
    reward: number;
    difficulty:
    | "easy"
    | "medium"
    | "hard"
    | "expert";
    status?: "active" | "completed" | "expired" | "draft";
    startDate?: string;
    endDate?: string;
    maxParticipants?: number;
    currentParticipants?: number;
    badgeIds?: number[];
    platform_type?: string;
    interaction_type?: string;
    quest_link?: string;
    event_id?: number;
    channel_id?: string;
    quest_type?: string;
    progress_to_add?: number;
    createdBy?: number;
    added_by?: number;
    steps?: string[];
    manual_submission?: boolean;
    with_evidence?: boolean;
    requires_attachment?: boolean;
    featured?: boolean;
    campaignId?: string | number;
    campaignAddress?: string;
    rewardTokenAddress?: string;
    verificationMode?: string;
    payoutMode?: string;
    fixedRewardAmount?: string;
    totalBudget?: string;
    rulesHash?: string;
    verifierGroupId?: string;
  }, token?: string): Promise<Quest> {
    try {
      const response = await QuestsApi.create(quest, token);
      return {
        ...response,
        id: String(response.id),
        createdAt: response.createdAt || (response as any).created_at,
        updatedAt: response.updatedAt || response.updated_at,
      };
    } catch (error) {
      throw error;
    }
  }

  static async updateQuest(
    id: string,
    updates: {
      title?: string;
      description?: string;
      reward?: number;
      difficulty?: "beginner" | "intermediate" | "advanced" | "expert";
      status?: "active" | "completed" | "expired" | "draft";
      startDate?: string;
      endDate?: string;
      maxParticipants?: number;
      badgeIds?: number[];
      platform_type?: string;
      interaction_type?: string;
      quest_link?: string;
      event_id?: number | null;
      quest_type?: string;
      progress_to_add?: number;
      createdBy?: number;
      added_by?: number;
    },
    token?: string
  ): Promise<Quest> {
    try {
      const response = await QuestsApi.update(id, updates, token);
      return {
        ...response,
        id: String(response.id),
        createdAt: response.createdAt || (response as any).created_at,
        updatedAt: response.updatedAt || (response as any).updated_at,
      };
    } catch (error) {
      throw error;
    }
  }

  static async activateQuest(id: string): Promise<Quest> {
    try {
      const response = await QuestsApi.activate(id);
      return {
        ...response,
        id: String(response.id),
        createdAt: response.createdAt || (response as any).created_at,
        updatedAt: response.updatedAt || (response as any).updated_at,
      };
    } catch (error) {
      throw error;
    }
  }

  static async deleteQuest(
    id: string,
    token?: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      const response = await QuestsApi.deleteQuest(id, token);
      return response;
    } catch (error) {
      throw error;
    }
  }

  // Submission methods
  static async submitQuest(
    questId: string,
    userId: string,
    content: SubmissionContent,
    token?: string
  ): Promise<Submission> {
    try {
      const response = await SubmissionsApi.submit(questId, content, token);
      return {
        ...response,
        id: String(response.id),
        submittedAt: response.submittedAt || (response as any).created_at,
      };
    } catch (error) {
      throw error;
    }
  }

  static async getSubmissions(
    questId?: string,
    userId?: string,
    token?: string
  ): Promise<Submission[]> {
    try {
      const response = await SubmissionsApi.list({ questId, userId }, token);
      return Array.isArray(response)
        ? response.map((submission: any) => ({
          ...submission,
          id: String(submission.id),
          submittedAt: submission.submittedAt || submission.created_at,
        }))
        : [];
    } catch (error) {
      console.error("Error fetching submissions:", error);
      // Return empty array instead of mock data to prevent false completed quest counts
      return [];
    }
  }

  static async getQuestCompletions(token?: string): Promise<any> {
    try {
      const response = await SubmissionsApi.getQuestCompletions(token);
      return response;
    } catch (error) {
      console.error("Error fetching quest completions:", error);
      throw error;
    }
  }

  // New method to get quests with submission counts (optimized)
  static async getQuestsWithSubmissionCounts(token?: string): Promise<any> {
    try {
      const response = await SubmissionsApi.getQuestsWithSubmissionCounts(token);
      return response;
    } catch (error) {
      console.error("Error fetching quests with submission counts:", error);
      throw error;
    }
  }

  // New method to get paginated submissions for a specific quest
  static async getSubmissionsByQuest(questId: string, page: number = 1, limit: number = 10, status?: string, token?: string): Promise<any> {
    try {
      const response = await SubmissionsApi.getSubmissionsByQuest(questId, page, limit, status, token);
      return response;
    } catch (error) {
      console.error("Error fetching submissions by quest:", error);
      throw error;
    }
  }

  static async reviewSubmission(
    submissionId: string,
    status: "approved" | "rejected" | "needs-revision",
    rejectionReason?: string,
    points?: number,
    token?: string,
    options?: {
      approveOnChain?: boolean;
      rewardAmountAtomic?: string;
      winnerWallet?: string;
    },
  ): Promise<ReviewSubmissionResponse | Submission> {
    try {
      const response = await SubmissionsApi.review(submissionId, {
        status,
        rejectionReason,
        points,
        approveOnChain: options?.approveOnChain,
        rewardAmountAtomic: options?.rewardAmountAtomic,
        winnerWallet: options?.winnerWallet,
      }, token);
      if ((response as ReviewSubmissionResponse).data) {
        return response as ReviewSubmissionResponse;
      }
      return {
        ...(response as Submission),
        id: String((response as Submission).id),
        submittedAt: (response as Submission).submittedAt || (response as any).created_at,
      };
    } catch (error) {
      throw error;
    }
  }

  static async retryOnChainApproval(
    submissionId: string,
    options?: {
      rewardAmountAtomic?: string;
      winnerWallet?: string;
    },
    token?: string
  ): Promise<ReviewSubmissionResponse> {
    try {
      return await SubmissionsApi.retryOnChainApproval(submissionId, options, token);
    } catch (error) {
      throw error;
    }
  }

  static async getCompletionStats(token?: string): Promise<{ completed: number; pending: number; total: number; rejected: number }> {
    try {
      const response = await SubmissionsApi.getStats(token);
      if (response.success) {
        return response.data;
      } else {
        throw new Error('Failed to fetch completion stats');
      }
    } catch (error) {
      console.error("Error fetching completion stats:", error);
      throw error;
    }
  }

  // Badge methods
  static async getUserBadges(userId?: string, token?: string): Promise<Badge[]> {
    try {
      const badges = await BadgesApi.listByUser(userId || '', token);
      return badges;
    } catch (error) {
      console.error("Error fetching user badges:", error);
      // Return empty array instead of mock data to prevent false badge counts
      return [];
    }
  }

  static async getUserCompletions(token?: string): Promise<any[]> {
    try {
      const response = await SubmissionsApi.getUserCompletions(token);
      // Handle the new data structure
      if (response && response.data) {
        return response.data.map((completion: any) => ({
          id: completion.id,
          questId: completion.questId,
          userId: completion.userId,
          status: completion.status, // 'validated' maps to 'approved'
          submittedAt: completion.completedAt || completion.created_at,
          reviewedAt: completion.validatedAt,
          rejectedAt: completion.rejectedAt,
          feedback: completion.rejectionReason,
          points: completion.quest?.progress_to_add,
          quest: completion.quest
        }));
      }
      return [];
    } catch (error) {
      console.error("Error fetching user completions:", error);
      return [];
    }
  }

  static async getAllBadges(token?: string): Promise<Badge[]> {
    try {
      const response = await BadgesApi.list(undefined, token);
      return response.data;
    } catch (error) {
      console.error("Error fetching all badges:", error);
      throw error;
    }
  }

  static async awardBadge(userId: string, badgeId: string, token?: string): Promise<Badge> {
    try {
      const badge = await BadgesApi.award(userId, badgeId, token);
      return badge;
    } catch (error) {
      console.error("Error awarding badge:", error);
      throw error;
    }
  }

  // Leaderboard methods
  static async getLeaderboard(token?: string, page: number = 1, limit: number = 10): Promise<LeaderboardResponse> {
    try {
      const response = await LeaderboardApi.getLeaderboard(token, page, limit);
      return response;
    } catch (error) {
      console.error("Error fetching leaderboard:", error);
      throw error;
    }
  }

  // Event methods
  static async getEvents(token?: string): Promise<Event[]> {
    try {
      const events = await EventsApi.list(token);
      return events;
    } catch (error) {
      console.error("Error fetching events:", error);
      throw error;
    }
  }

  static async getEvent(id: string, token?: string): Promise<Event | null> {
    try {
      const event = await EventsApi.get(id, token);
      return event;
    } catch (error) {
      console.error("Error fetching event:", error);
      return null;
    }
  }

  // Dashboard methods
  static async getDashboardStats(token?: string): Promise<any> {
    try {
      const { createApiClientWithToken } = await import("./api/client");
      const apiClient = token ? createApiClientWithToken(token) : (await import("./api/client")).api;
      const response = await apiClient.get("/admin/dashboard");
      return response.data;
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      // Return default stats on error
      return {
        success: false,
        data: {
          userData: {
            count: 0,
            lastWeek: 0,
          },
          approvalRate: {
            count: 0,
            lastWeek: 0,
          },
          questSubmissionData: {
            count: 0,
            lastWeek: 0,
          },
        },
      };
    }
  }

  static async getPointsStats(token?: string): Promise<any> {
    try {
      const { createApiClientWithToken } = await import("./api/client");
      const apiClient = token ? createApiClientWithToken(token) : (await import("./api/client")).api;
      const response = await apiClient.get("/admin/stats/points");
      return response.data;
    } catch (error) {
      console.error("Error fetching points stats:", error);
      // Return default points stats on error
      return {
        success: false,
        existingPoints: 0,
        pendingPoints: 0,
      };
    }
  }

  // Utility methods
  static validateHederaAccountId(accountId: string): boolean {
    const hederaAccountRegex = /^\d+\.\d+\.\d+$/;
    return hederaAccountRegex.test(accountId);
  }

  static validateTransactionId(transactionId: string): boolean {
    const transactionIdRegex = /^\d+\.\d+\.\d+@\d+\.\d+$/;
    return transactionIdRegex.test(transactionId);
  }

  static generateHashScanUrl(
    accountId: string,
    network: "testnet" | "mainnet" = "testnet"
  ): string {
    const baseUrl =
      network === "mainnet"
        ? "https://hashscan.io/mainnet/account"
        : "https://hashscan.io/testnet/account";
    return `${baseUrl}/${accountId}`;
  }

  static generateTransactionUrl(
    transactionId: string,
    network: "testnet" | "mainnet" = "testnet"
  ): string {
    const baseUrl =
      network === "mainnet"
        ? "https://hashscan.io/mainnet/transaction"
        : "https://hashscan.io/testnet/transaction";
    return `${baseUrl}/${transactionId}`;
  }

  // Partner methods
  static async getPartners(page: number = 1, limit: number = 10, sort?: 'ASC' | 'DESC', search?: string, token?: string): Promise<PartnersResponse> {
    try {
      const response = await PartnersApi.list(page, limit, sort, search, token);
      return response;
    } catch (error) {
      console.error("Error fetching partners:", error);
      throw error;
    }
  }

  static async getPartner(id: number, token?: string): Promise<Partner> {
    try {
      const response = await PartnersApi.findById(id, token);
      return response;
    } catch (error) {
      console.error("Error fetching partner:", error);
      throw error;
    }
  }

  static async createPartner(name: string, photo?: File, token?: string): Promise<Partner> {
    try {
      const formData = new FormData();
      formData.append('name', name);
      if (photo) {
        formData.append('photo', photo);
      }

      const response = await PartnersApi.create(formData, token);
      return response;
    } catch (error) {
      console.error("Error creating partner:", error);
      throw error;
    }
  }

  static async updatePartner(id: number, name: string, photo?: File, token?: string): Promise<Partner> {
    try {
      const formData = new FormData();
      formData.append('name', name);
      if (photo) {
        formData.append('photo', photo);
      }

      const response = await PartnersApi.update(id, formData, token);
      return response;
    } catch (error) {
      console.error("Error updating partner:", error);
      throw error;
    }
  }

  static async deletePartner(id: number, token?: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await PartnersApi.delete(id, token);
      return response;
    } catch (error) {
      console.error("Error deleting partner:", error);
      throw error;
    }
  }

  static async downloadPartnerReferredUsersCSV(partnerId: number, token?: string): Promise<Blob> {
    try {
      const { createApiClientWithToken } = await import("./api/client");
      const apiClient = token ? createApiClientWithToken(token) : (await import("./api/client")).api;

      const response = await apiClient.get(`/partners/referred-users-details/${partnerId}`, {
        responseType: 'blob',
      });
      return response.data;
    } catch (error) {
      console.error("Error downloading partner referred users CSV:", error);
      throw error;
    }
  }

  // Referral methods
  static async getReferralProfile(page: number = 1, limit: number = 10, token?: string) {
    try {
      const response = await UsersApi.getReferralProfile(page, limit, token);
      return response;
    } catch (error) {
      console.error("Error fetching referral profile:", error);
      throw error;
    }
  }

  static async updateEvmWallet(walletAddress: string, token?: string): Promise<EvmWalletResponse> {
    try {
      return await UsersApi.updateEvmWallet(walletAddress, token);
    } catch (error) {
      console.error("Error updating EVM wallet:", error);
      throw error;
    }
  }

  static async getEvmWallet(token?: string): Promise<EvmWalletResponse> {
    try {
      return await UsersApi.getEvmWallet(token);
    } catch (error) {
      console.error("Error fetching EVM wallet:", error);
      throw error;
    }
  }

  static async getClaimableCampaigns(token?: string): Promise<ClaimableCampaign[]> {
    try {
      const response = await UsersApi.getClaimableCampaigns(token);
      return response.data;
    } catch (error) {
      console.error("Error fetching claimable campaigns:", error);
      throw error;
    }
  }

  static async finalizeDirectClaims(questId: string, token?: string) {
    try {
      return await QuestsApi.finalizeDirectClaims(questId, token);
    } catch (error) {
      console.error("Error finalizing direct claims:", error);
      throw error;
    }
  }

  // Analytics methods
  static async getUserMetricsPerDay(
    startDate?: string,
    endDate?: string,
    token?: string
  ): Promise<{ success: boolean; data: Array<{ date: string; count: string | number }> }> {
    try {
      const { createApiClientWithToken } = await import("./api/client");
      const apiClient = token ? createApiClientWithToken(token) : (await import("./api/client")).api;

      const params: any = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const response = await apiClient.get("/user/user-metrics/per-day", { params });
      return response.data;
    } catch (error) {
      console.error("Error fetching user metrics per day:", error);
      // Return default empty data on error
      return {
        success: false,
        data: [],
      };
    }
  }

  static async getUserMetricsPerWeek(
    startDate?: string,
    endDate?: string,
    token?: string
  ): Promise<{ success: boolean; data: Array<{ count: string; week_start: string; week_end: string }> }> {
    try {
      const { createApiClientWithToken } = await import("./api/client");
      const apiClient = token ? createApiClientWithToken(token) : (await import("./api/client")).api;

      const params: { startDate?: string; endDate?: string } = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const response = await apiClient.get("/user/user-metrics/per-week", { params });
      return response.data;
    } catch (error) {
      console.error("Error fetching user metrics per week:", error);
      // Return default empty data on error
      return {
        success: false,
        data: [],
      };
    }
  }

  static async getUserAcquisitionMetrics(
    token?: string
  ): Promise<{
    success: boolean;
    data: {
      total: number;
      direct: number;
      user_referral: number;
      partner_referral: number;
      percentages: {
        direct: string;
        user_referral: string;
        partner_referral: string;
      };
    };
  }> {
    try {
      const { createApiClientWithToken } = await import("./api/client");
      const apiClient = token ? createApiClientWithToken(token) : (await import("./api/client")).api;

      const response = await apiClient.get("/user/user-metrics/acquisation");
      return response.data;
    } catch (error) {
      console.error("Error fetching user acquisition metrics:", error);
      // Return default empty data on error
      return {
        success: false,
        data: {
          total: 0,
          direct: 0,
          user_referral: 0,
          partner_referral: 0,
          percentages: {
            direct: "0",
            user_referral: "0",
            partner_referral: "0",
          },
        },
      };
    }
  }

  // Wallet methods
  static async verifyWallet(accountId: string, token?: string): Promise<VerifyWalletResponse> {
    try {
      return await WalletsApi.verifyWallet(accountId, token);
    } catch (error) {
      console.error("Error verifying wallet:", error);
      throw error;
    }
  }

  static async getWallets(token?: string): Promise<WalletsResponse> {
    try {
      return await WalletsApi.getWallets(token);
    } catch (error) {
      console.error("Error fetching wallets:", error);
      throw error;
    }
  }

  static async claimReward(accountId: string, token?: string): Promise<any> {
    try {
      return await WalletsApi.claimReward(accountId, token);
    } catch (error) {
      console.error("Error claiming reward:", error);
      throw error;
    }
  }

  static async checkTransaction(transactionId: number, token?: string): Promise<any> {
    try {
      return await WalletsApi.checkTransaction(transactionId, token);
    } catch (error) {
      console.error("Error checking transaction:", error);
      throw error;
    }
  }

  static async convertUsd(usdValue: number, token?: string): Promise<any> {
    try {
      return await WalletsApi.convertUsd(usdValue, token);
    } catch (error) {
      console.error("Error converting USD to HBAR:", error);
      throw error;
    }
  }

  static async getClaimOptions(token?: string): Promise<any> {
    try {
      return await WalletsApi.getClaimOptions(token);
    } catch (error) {
      console.error("Error fetching claim options:", error);
      throw error;
    }
  }

  static async updateClaimOptions(threshold: number, token?: string): Promise<any> {
    try {
      return await WalletsApi.updateClaimOptions(threshold, token);
    } catch (error) {
      console.error("Error updating claim options:", error);
      throw error;
    }
  }

  static async getTransactions(page: number = 1, limit: number = 10, sort: 'ASC' | 'DESC' = 'DESC', token?: string): Promise<any> {
    try {
      return await WalletsApi.getTransactions(page, limit, sort, token);
    } catch (error) {
      console.error("Error fetching transactions:", error);
      throw error;
    }
  }

  static async getUserTransactions(page: number = 1, limit: number = 10, sort: 'ASC' | 'DESC' = 'DESC', token?: string): Promise<any> {
    try {
      return await WalletsApi.getUserTransactions(page, limit, sort, token);
    } catch (error) {
      console.error("Error fetching user transactions:", error);
      throw error;
    }
  }
}
