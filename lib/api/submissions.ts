import { createApiClientWithToken } from './client';
import type { Submission, SubmissionContent } from '@/lib/types';

export const SubmissionsApi = {
  async list(params?: { questId?: string; userId?: string }, token?: string): Promise<Submission[]> {
    const apiClient = token ? createApiClientWithToken(token) : require('./client').api;
    const { data } = await apiClient.get('/quest-completions/submissions', { params });
    return data;
  },
  
  async getUserCompletions(token?: string): Promise<any> {
    const apiClient = token ? createApiClientWithToken(token) : require('./client').api;
    const { data } = await apiClient.get('/quest-completions/user/completions');
    return data;
  },
  
  async getQuestCompletions(token?: string): Promise<any> {
    const apiClient = token ? createApiClientWithToken(token) : require('./client').api;
    const { data } = await apiClient.get('/quest-completions/submissions');
    return data;
  },
  
  // New endpoint to get quests with submission counts
  async getQuestsWithSubmissionCounts(token?: string): Promise<any> {
    const apiClient = token ? createApiClientWithToken(token) : require('./client').api;
    const { data } = await apiClient.get('/quest-completions/quest/submission-count');
    return data;
  },
  
  // New endpoint to get paginated submissions by quest
  async getSubmissionsByQuest(questId: string, page: number = 1, limit: number = 10, status?: string, token?: string): Promise<any> {
    const apiClient = token ? createApiClientWithToken(token) : require('./client').api;
    const params: any = { page, limit };
    if (status && status !== 'all') {
      params.status = status;
    }
    const { data } = await apiClient.get(`/quest-completions/submissions2/${questId}`, {
      params
    });
    return data;
  },
  
  async submit(questId: string, content: SubmissionContent, token?: string): Promise<Submission> {
    const apiClient = token ? createApiClientWithToken(token) : require('./client').api;
    const { data } = await apiClient.post(`/quests/${questId}/submissions`, { content });
    return data;
  },
  async review(
    submissionId: string,
    payload: { status: 'approved' | 'rejected' | 'needs-revision'; rejectionReason?: string; points?: number },
    token?: string
  ): Promise<Submission> {
    const apiClient = token ? createApiClientWithToken(token) : require('./client').api;

    // Use the correct endpoint and HTTP method based on the status
    let endpoint: string;
    let response: any;

    // Prepare the payload with the correct field names for each endpoint
    let requestPayload: any;

    if (payload.status === 'approved') {
      endpoint = `/quest-completions/completions/${submissionId}/validate`;
      requestPayload = {
        status: payload.status,
        points: payload.points
      };
      response = await apiClient.put(endpoint, requestPayload);
    } else if (payload.status === 'rejected') {
      endpoint = `/quest-completions/completions/${submissionId}/reject`;
      requestPayload = {
        status: payload.status,
        rejectionReason: payload.rejectionReason, // Ensure we're sending rejectionReason not feedback
        points: payload.points
      };
      response = await apiClient.put(endpoint, requestPayload);
    } else {
      // For needs-revision, use the original review endpoint
      endpoint = `/submissions/${submissionId}/review`;
      requestPayload = {
        status: payload.status,
        feedback: payload.rejectionReason, // This endpoint might expect 'feedback' field
        points: payload.points
      };
      response = await apiClient.post(endpoint, requestPayload);
    }

    return response.data;
  },

  async getStats(token?: string): Promise<{ success: boolean; data: { completed: number; pending: number; total: number; rejected: number } }> {
    const apiClient = token ? createApiClientWithToken(token) : require('./client').api;
    const { data } = await apiClient.get('/admin/stats/completion');
    return data;
  }
};


