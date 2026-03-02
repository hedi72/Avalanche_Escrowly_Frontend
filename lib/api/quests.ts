import { createApiClientWithToken } from "./client";
import type { Quest, FilterOptions } from "@/lib/types";

export const QuestsApi = {
  async list(filters?: FilterOptions, token?: string): Promise<Quest[]> {
    const apiClient = token ? createApiClientWithToken(token) : require("./client").api;
    const response = await apiClient.get("/quests", {
      params: filters,
    });

    console.log("Quests API response:", response.data);

    // Handle the new response format: { success: true, quests: [...], questCompletion: [...] }
    if (response.data.success && response.data.quests) {
      return response.data.quests;
    }

    // Handle alternative format: { success: true, data: [...], count: number }
    if (response.data.success && response.data.data) {
      return response.data.data;
    }

    // Fallback to direct array if response format is different
    return response.data;
  },
  async get(id: string, token?: string): Promise<Quest> {
    console.log("QuestsApi.get called with:", { id, hasToken: !!token });
    
    const apiClient = token ? createApiClientWithToken(token) : require("./client").api;
    
    console.log("Making API request to:", `/quests/${id}`);
    console.log("API base URL:", apiClient.defaults.baseURL);
    
    const response = await apiClient.get(`/quests/${id}`);
    
    console.log("Quest API response received:", response.data);

    // Handle the response format: { success: true, data: {...} }
    if (response.data.success && response.data.data) {
      return response.data.data;
    }

    // Fallback to direct object if response format is different
    return response.data;
  },
  async create(payload: {
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
  }, token?: string): Promise<Quest> {
    console.log("Creating quest with payload:", payload);

    const apiClient = token ? createApiClientWithToken(token) : require("./client").api;
    const response = await apiClient.post("/quests", payload);

    console.log("Create quest response:", response.data);

    // Handle the response format: { success: true, data: {...}, message: string }
    if (response.data.success && response.data.data) {
      return response.data.data;
    }

    // Fallback to direct object if response format is different
    return response.data;
  },
  async update(
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
    },
    token?: string
  ): Promise<Quest> {
    console.log("Updating quest with payload:", updates);

    const apiClient = token ? createApiClientWithToken(token) : require("./client").api;
    const response = await apiClient.put(`/quests/${id}`, updates);

    console.log("Update quest response:", response.data);

    // Handle the response format: { success: true, data: {...}, message: string }
    if (response.data.success && response.data.data) {
      return response.data.data;
    }

    // Fallback to direct object if response format is different
    return response.data;
  },
  async activate(id: string, token?: string): Promise<Quest> {
    console.log("Activating quest with ID:", id);

    const apiClient = token ? createApiClientWithToken(token) : require("./client").api;
    const response = await apiClient.put(`/quests/${id}`, { status: "active" });

    console.log("Activate quest response:", response.data);

    // Handle the response format: { success: true, data: {...}, message: string }
    if (response.data.success && response.data.data) {
      return response.data.data;
    }

    // Fallback to direct object if response format is different
    return response.data;
  },
  async remove(id: string, token?: string): Promise<void> {
    const apiClient = token ? createApiClientWithToken(token) : require("./client").api;
    await apiClient.delete(`/quests/${id}`);
  },
  async deleteQuest(
    id: string,
    token?: string
  ): Promise<{ success: boolean; message: string }> {
    const apiClient = token ? createApiClientWithToken(token) : require("./client").api;
    const response = await apiClient.delete(`/quests/${id}`);

    // Handle the response format: { success: true, message: string }
    if (response.data.success) {
      return response.data;
    }

    // Fallback response
    return { success: true, message: "Quest deleted successfully" };
  },
};
