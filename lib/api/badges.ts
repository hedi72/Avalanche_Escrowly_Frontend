import { createApiClientWithToken } from './client';
import type {
  Badge,
  CreateBadgeRequest,
  CreateBadgeResponse,
  ListBadgesResponse,
  GetBadgeResponse,
  BadgeFilters
} from '@/lib/types';

export const BadgesApi = {
  async listByUser(userId: string, token?: string): Promise<Badge[]> {
    const apiClient = token ? createApiClientWithToken(token) : require('./client').api;
    const response = await apiClient.get(`/badges/user/badges`);
    
    if (response.data && response.data.data && Array.isArray(response.data.data)) {
      return response.data.data.map((item: any) => ({
        ...item.badge,
        earnedAt: item.earnedAt 
      }));
    }
    
    return response.data || [];
  },

  async award(userId: string, badgeId: string, token?: string): Promise<Badge> {
    const apiClient = token ? createApiClientWithToken(token) : require('./client').api;
    const { data } = await apiClient.post(`/users/${userId}/badges`, { badgeId });
    return data;
  },

  async create(badgeData: CreateBadgeRequest, token?: string): Promise<CreateBadgeResponse> {
    const apiClient = token ? createApiClientWithToken(token) : require('./client').api;

    // Check if image is a File object (for file uploads) or string (for URL)
    if (badgeData.image && typeof badgeData.image !== 'string') {
      // Handle file upload with FormData
      const formData = new FormData();
      formData.append('name', badgeData.name);
      formData.append('description', badgeData.description);
      formData.append('maxToObtain', badgeData.maxToObtain.toString());
      formData.append('rarity', badgeData.rarity);
      formData.append('points', badgeData.points.toString());
      formData.append('image', badgeData.image as File);
      if (badgeData.isActive !== undefined) {
        formData.append('isActive', badgeData.isActive.toString());
      }

      const { data } = await apiClient.post('/badges', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        }
      });
      return data;
    } else {
      // Handle regular JSON payload
      const { data } = await apiClient.post('/badges', badgeData);
      return data;
    }
  },

  async list(filters?: BadgeFilters, token?: string): Promise<ListBadgesResponse> {
    const apiClient = token ? createApiClientWithToken(token) : require('./client').api;
    const params = new URLSearchParams();

    if (filters?.rarity) {
      params.append('rarity', filters.rarity);
    }
    if (filters?.isActive !== undefined) {
      params.append('isActive', filters.isActive.toString());
    }
    if (filters?.createdBy) {
      params.append('createdBy', filters.createdBy.toString());
    }

    const queryString = params.toString();
    const url = queryString ? `/badges?${queryString}` : '/badges';

    const { data } = await apiClient.get(url);
    return data;
  },

  async getById(id: string | number, token?: string): Promise<GetBadgeResponse> {
    const apiClient = token ? createApiClientWithToken(token) : require('./client').api;
    const { data } = await apiClient.get(`/badges/${id}`);
    return data;
  },

  async update(id: string | number, badgeData: Partial<CreateBadgeRequest>, token?: string): Promise<Badge> {
    const apiClient = token ? createApiClientWithToken(token) : require('./client').api;

    // Check if image is a File object (for file uploads) or string (for URL)
    if (badgeData.image && typeof badgeData.image !== 'string') {
      // Handle file upload with FormData
      const formData = new FormData();
      if (badgeData.name) formData.append('name', badgeData.name);
      if (badgeData.description) formData.append('description', badgeData.description);
      if (badgeData.maxToObtain) formData.append('maxToObtain', badgeData.maxToObtain.toString());
      if (badgeData.rarity) formData.append('rarity', badgeData.rarity);
      if (badgeData.points !== undefined) formData.append('points', badgeData.points.toString());
      formData.append('image', badgeData.image as File);
      if (badgeData.isActive !== undefined) {
        formData.append('isActive', badgeData.isActive.toString());
      }

      const { data } = await apiClient.put(`/badges/${id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        }
      });
      return data;
    } else {
      // Handle regular JSON payload
      const { data } = await apiClient.put(`/badges/${id}`, badgeData);
      return data;
    }
  },

  async delete(id: string | number, token?: string): Promise<void> {
    const apiClient = token ? createApiClientWithToken(token) : require('./client').api;
    await apiClient.delete(`/badges/${id}`);
  }
};


