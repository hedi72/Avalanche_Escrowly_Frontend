import axios, { AxiosError, AxiosInstance } from 'axios';
import { signOut } from 'next-auth/react';

export type ApiError = {
  status: number;
  code?: string;
  message: string;
  details?: unknown;
};

// Function to handle user not found case
async function handleUserNotFound() {
  console.log('API: User not found - account may have been deleted. Signing out...');
  
  // Only sign out if we're in the browser
  if (typeof window !== 'undefined') {
    await signOut({ callbackUrl: '/' });
  }
}

function toApiError(error: AxiosError): ApiError {
  const status = error.response?.status ?? 0;
  const data: any = error.response?.data ?? {};

  console.error('API Error:', {
    message: error.message,
    status: status,
    responseData: data,
  });

  return {
    status,
    code: data.code,
    message: data.message || error.message,
    details: data.details
  };
}

export function createApiClient(baseURL: string): AxiosInstance {
  const instance = axios.create({
    baseURL,
    timeout: 1000000,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
  });

  instance.interceptors.request.use((config) => {
    // Log request for debugging
    console.log('API Request:', {
      url: config.url,
      method: config.method,
      hasAuth: !!config.headers?.Authorization,
    });

    return config;
  });

  instance.interceptors.response.use(
    (response) => {
      // Check for user not found in successful responses
      const data = response.data;
      if (data && !data.success && data.message === "user not found") {
        handleUserNotFound();
        throw new Error('User not found - account may have been deleted');
      }
      return response;
    },
    (error: AxiosError) => {
      // Check for user not found in error responses
      const data: any = error.response?.data ?? {};
      if (!data.success && data.message === "user not found") {
        handleUserNotFound();
      }
      throw toApiError(error);
    }
  );

  return instance;
}

// Default instance using env var
export const api = createApiClient((process.env.NEXT_PUBLIC_API_URL || 'https://hedera-quests.com').replace(/\/$/, ''));

// Helper function to create API client with NextAuth session token
export function createApiClientWithToken(token: string): AxiosInstance {
  const instance = createApiClient((process.env.NEXT_PUBLIC_API_URL || 'https://hedera-quests.com').replace(/\/$/, ''));

  instance.interceptors.request.use((config) => {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
    return config;
  });

  return instance;
}




