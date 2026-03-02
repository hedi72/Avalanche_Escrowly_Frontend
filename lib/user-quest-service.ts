import { UserQuestsApi } from "./api/user-quests";
import type { Quest, QuestFilters, UserQuestsResponse } from "./types";

export class UserQuestService {
  
  /**
   * Get paginated user quests with filters
   * @param filters - Quest filters including pagination
   * @param token - Authentication token
   * @returns Paginated quest response
   */
  static async getUserQuests(
    filters?: QuestFilters,
    token?: string
  ): Promise<UserQuestsResponse> {
    try {
      console.log('UserQuestService.getUserQuests called with:', { filters, hasToken: !!token });
      
      const response = await UserQuestsApi.getUserQuests(filters, token);
      
      // Transform quest data to ensure consistent format
      const transformedQuests = response.quests.map((quest: any) => ({
        ...quest,
        id: String(quest.id),
        createdAt: quest.created_at || quest.createdAt,
        updatedAt: quest.updated_at || quest.updatedAt,
        points: Number(quest.reward) || quest.points || 0,
      }));

      return {
        ...response,
        quests: transformedQuests,
        data: transformedQuests // Also populate data array for compatibility
      };
    } catch (error) {
      console.error("Error fetching user quests:", error);
      throw error;
    }
  }

  /**
   * Get featured quests with pagination
   * @param page - Page number (default: 1)
   * @param limit - Items per page (default: 6)
   * @param token - Authentication token
   */
  static async getFeaturedQuests(
    page: number = 1,
    limit: number = 6,
    token?: string
  ): Promise<UserQuestsResponse> {
    try {
      return await this.getUserQuests({
        featured: true,
        page,
        limit
      }, token);
    } catch (error) {
      console.error("Error fetching featured quests:", error);
      throw error;
    }
  }

  /**
   * Search quests with pagination
   * @param searchTerm - Search term
   * @param page - Page number (default: 1)
   * @param limit - Items per page (default: 12)
   * @param token - Authentication token
   */
  static async searchQuests(
    searchTerm: string,
    page: number = 1,
    limit: number = 12,
    token?: string
  ): Promise<UserQuestsResponse> {
    try {
      return await this.getUserQuests({
        search: searchTerm,
        page,
        limit
      }, token);
    } catch (error) {
      console.error("Error searching quests:", error);
      throw error;
    }
  }

  /**
   * Get quests by status with pagination
   * @param status - Quest status filter
   * @param page - Page number (default: 1)
   * @param limit - Items per page (default: 12)
   * @param token - Authentication token
   */
  static async getQuestsByStatus(
    status: string,
    page: number = 1,
    limit: number = 12,
    token?: string
  ): Promise<UserQuestsResponse> {
    try {
      return await this.getUserQuests({
        status,
        page,
        limit
      }, token);
    } catch (error) {
      console.error("Error fetching quests by status:", error);
      throw error;
    }
  }

  /**
   * Get all quests for a page (no specific filters)
   * @param page - Page number (default: 1)
   * @param limit - Items per page (default: 12)
   * @param token - Authentication token
   */
  static async getAllQuests(
    page: number = 1,
    limit: number = 12,
    token?: string
  ): Promise<UserQuestsResponse> {
    try {
      return await this.getUserQuests({
        page,
        limit
      }, token);
    } catch (error) {
      console.error("Error fetching all quests:", error);
      throw error;
    }
  }
}