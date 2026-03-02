import { createApiClientWithToken } from "./client";
import type { Quest, QuestFilters, UserQuestsResponse } from "@/lib/types";

export const UserQuestsApi = {
  async getUserQuests(
    filters?: QuestFilters,
    token?: string
  ): Promise<UserQuestsResponse> {
    console.log("UserQuestsApi.getUserQuests called with:", { filters, hasToken: !!token });
    
    const apiClient = token ? createApiClientWithToken(token) : require("./client").api;
    
    // Build query parameters
    const params: Record<string, any> = {};
    
    if (filters?.featured !== undefined) {
      params.featured = filters.featured;
    }
    
    if (filters?.search) {
      params.search = filters.search;
    }
    
    if (filters?.status) {
      // Don't send status parameter for 'available' - let backend handle it
      if (filters.status !== 'available') {
        params.status = filters.status;
      }
    }
    
    if (filters?.page) {
      params.page = filters.page;
    }
    
    if (filters?.limit) {
      params.limit = filters.limit;
    }
    
    console.log("Making API request to:", "/quests/user/quests-for-user");
    console.log("API params:", params);
    console.log("API base URL:", apiClient.defaults.baseURL);
    
    const response = await apiClient.get("/quests/user/quests-for-user", {
      params,
    });
    
    console.log("User quests API response received:", response.data);

    // The API returns the response in this format already
    if (response.data.success) {
      return response.data;
    }

    // Fallback in case the response format is different
    throw new Error("Invalid response format from user quests API");
  },

  async getFeaturedQuests(
    page: number = 1,
    limit: number = 6,
    token?: string
  ): Promise<UserQuestsResponse> {
    return this.getUserQuests({
      featured: true,
      page,
      limit
    }, token);
  },

  async searchQuests(
    searchTerm: string,
    page: number = 1,
    limit: number = 12,
    token?: string
  ): Promise<UserQuestsResponse> {
    return this.getUserQuests({
      search: searchTerm,
      page,
      limit
    }, token);
  },

  async getQuestsByStatus(
    status: string,
    page: number = 1,
    limit: number = 12,
    token?: string
  ): Promise<UserQuestsResponse> {
    return this.getUserQuests({
      status,
      page,
      limit
    }, token);
  }
};