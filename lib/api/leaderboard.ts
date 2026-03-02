import { api, createApiClientWithToken } from './client';
import type { LeaderboardResponse } from '@/lib/types';

export const LeaderboardApi = {
  async getLeaderboard(token?: string, page: number = 1, limit: number = 10): Promise<LeaderboardResponse> {
    const apiClient = token ? createApiClientWithToken(token) : api;
    const response = await apiClient.get(`/user/leaderboard?page=${page}&limit=${limit}`);
    return response.data;
  }
};


