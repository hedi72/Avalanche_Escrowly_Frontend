import { api, createApiClientWithToken } from './client';

export interface Wallet {
  id: number;
  user_id: number;
  account_id: string;
  created_at: string;
  updated_at: string;
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

export interface ClaimRewardRequest {
  account_id: string;
}

export interface ClaimRewardResponse {
  success: boolean;
  pending?: boolean;
  transaction_id?: number;
  message: string;
}

export interface Transaction {
  id: number;
  user_id: number;
  transaction_id: string | null;
  to_wallet: string;
  status: 'pending' | 'success' | 'failed';
  claim_id: string;
  created_at: string;
  updated_at: string;
}

export interface CheckTransactionResponse {
  success: boolean;
  transaction: Transaction;
}

export interface ConvertUsdRequest {
  usd_value: number;
}

export interface ConvertUsdResponse {
  success: boolean;
  hbarValue: number;
}

export interface ClaimOptionsResponse {
  success: boolean;
  options: {
    id: number;
    threshold: number;
    created_at: string;
    updated_at: string;
  };
}

export class WalletsApi {
  /**
   * Verify and link an AssetGuard wallet to the user's account
   */
  static async verifyWallet(
    accountId: string,
    token?: string
  ): Promise<VerifyWalletResponse> {
    try {
      const apiClient = token ? createApiClientWithToken(token) : api;
      const response = await apiClient.post<VerifyWalletResponse>(
        '/user/verify-wallet',
        { account_id: accountId }
      );
      
      // Return the response as-is (success or failure from backend)
      return response.data;
    } catch (error: any) {
      console.error('Error verifying wallet:', error);
      
      // If backend returned an error response with a message, preserve it
      if (error.response?.data?.message) {
        return {
          success: false,
          message: error.response.data.message
        };
      }
      
      // Otherwise throw with a generic message
      throw new Error(
        error.message || 'Failed to verify wallet'
      );
    }
  }

  /**
   * Get all wallets linked to the user's account
   */
  static async getWallets(token?: string): Promise<WalletsResponse> {
    try {
      const apiClient = token ? createApiClientWithToken(token) : api;
      const response = await apiClient.get<WalletsResponse>('/user/wallets');
      return response.data;
    } catch (error: any) {
      console.error('Error fetching wallets:', error);
      throw new Error(
        error.response?.data?.message || 'Failed to fetch wallets'
      );
    }
  }

  /**
   * Claim reward for the user's linked wallet
   */
  static async claimReward(
    accountId: string,
    token?: string
  ): Promise<ClaimRewardResponse> {
    try {
      const apiClient = token ? createApiClientWithToken(token) : api;
      const response = await apiClient.post<ClaimRewardResponse>(
        '/user/claim-reward',
        { account_id: accountId }
      );

      // Return the response as-is (success or failure from backend)
      return response.data;
    } catch (error: any) {
      console.error('Error claiming reward:', error);

      // If backend returned an error response with a message, preserve it
      if (error.response?.data?.message) {
        return {
          success: false,
          pending: false,
          message: error.response.data.message
        };
      }

      // Otherwise throw with a generic message
      throw new Error(
        error.message || 'Failed to claim reward'
      );
    }
  }

  /**
   * Check transaction status by ID
   */
  static async checkTransaction(
    transactionId: number,
    token?: string
  ): Promise<CheckTransactionResponse> {
    try {
      const apiClient = token ? createApiClientWithToken(token) : api;
      const response = await apiClient.get<CheckTransactionResponse>(
        `/user/transactions/check/${transactionId}`
      );
      return response.data;
    } catch (error: any) {
      console.error('Error checking transaction:', error);
      throw new Error(
        error.response?.data?.message || 'Failed to check transaction status'
      );
    }
  }

  /**
   * Convert USD value to HBAR
   */
  static async convertUsd(
    usdValue: number,
    token?: string
  ): Promise<ConvertUsdResponse> {
    try {
      const apiClient = token ? createApiClientWithToken(token) : api;
      const response = await apiClient.post<ConvertUsdResponse>(
        '/user/convert-usd',
        { usd_value: usdValue }
      );
      return response.data;
    } catch (error: any) {
      console.error('Error converting USD to HBAR:', error);
      throw new Error(
        error.response?.data?.message || 'Failed to convert USD to HBAR'
      );
    }
  }

  /**
   * Get claim options including threshold
   */
  static async getClaimOptions(token?: string): Promise<ClaimOptionsResponse> {
    try {
      const apiClient = token ? createApiClientWithToken(token) : api;
      const response = await apiClient.get<ClaimOptionsResponse>(
        '/user/claim-options'
      );
      return response.data;
    } catch (error: any) {
      console.error('Error fetching claim options:', error);
      throw new Error(
        error.response?.data?.message || 'Failed to fetch claim options'
      );
    }
  }

  /**
   * Update claim options threshold (Admin only)
   */
  static async updateClaimOptions(
    threshold: number,
    token?: string
  ): Promise<ClaimOptionsResponse> {
    try {
      const apiClient = token ? createApiClientWithToken(token) : api;
      const response = await apiClient.put<ClaimOptionsResponse>(
        '/user/claim-options',
        { threshold }
      );
      return response.data;
    } catch (error: any) {
      console.error('Error updating claim options:', error);
      throw new Error(
        error.response?.data?.message || 'Failed to update claim options'
      );
    }
  }

  /**
   * Get all transactions history (Admin only)
   */
  static async getTransactions(
    page: number = 1,
    limit: number = 10,
    sort: 'ASC' | 'DESC' = 'DESC',
    token?: string
  ): Promise<any> {
    try {
      const apiClient = token ? createApiClientWithToken(token) : api;
      const response = await apiClient.get('/user/admin/transactions', {
        params: { page, limit, sort }
      });
      return response.data;
    } catch (error: any) {
      console.error('Error fetching transactions:', error);
      throw new Error(
        error.response?.data?.message || 'Failed to fetch transactions'
      );
    }
  }

  /**
   * Get user's own transactions history
   */
  static async getUserTransactions(
    page: number = 1,
    limit: number = 10,
    sort: 'ASC' | 'DESC' = 'DESC',
    token?: string
  ): Promise<any> {
    try {
      const apiClient = token ? createApiClientWithToken(token) : api;
      const response = await apiClient.get('/user/transactions', {
        params: { page, limit, sort }
      });
      return response.data;
    } catch (error: any) {
      console.error('Error fetching user transactions:', error);
      throw new Error(
        error.response?.data?.message || 'Failed to fetch transactions'
      );
    }
  }
}
