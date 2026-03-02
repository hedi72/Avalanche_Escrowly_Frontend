import { createApiClientWithToken } from './client';
import type { Partner, PartnersResponse } from '@/lib/types';

export const PartnersApi = {
  async list(page: number = 1, limit: number = 10, sort?: 'ASC' | 'DESC', search?: string, token?: string): Promise<PartnersResponse> {
    const apiClient = token ? createApiClientWithToken(token) : require('./client').api;
    const { data } = await apiClient.get('/partners/all', {
      params: { page, limit, sort, search }
    });
    return data;
  },

  async create(formData: FormData, token?: string): Promise<Partner> {
    const apiClient = token ? createApiClientWithToken(token) : require('./client').api;
    const { data } = await apiClient.post('/partners/create', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return data.partner || data; // Handle both possible response structures
  },

  async findById(id: number, token?: string): Promise<Partner> {
    const apiClient = token ? createApiClientWithToken(token) : require('./client').api;
    const { data } = await apiClient.get(`/partners/find/${id}`);
    return data.partner; // Extract the partner from the response
  },

  async update(id: number, formData: FormData, token?: string): Promise<Partner> {
    const apiClient = token ? createApiClientWithToken(token) : require('./client').api;
    const { data } = await apiClient.put(`/partners/update/${id}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return data.partner || data; // Handle both possible response structures
  },

  async delete(id: number, token?: string): Promise<{ success: boolean; message: string }> {
    const apiClient = token ? createApiClientWithToken(token) : require('./client').api;
    const { data } = await apiClient.delete(`/partners/delete/${id}`);
    return data;
  },
};