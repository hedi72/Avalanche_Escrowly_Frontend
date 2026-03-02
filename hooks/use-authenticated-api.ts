'use client';

import { useSession } from 'next-auth/react';
import { useUserNotFoundHandler } from '@/hooks/use-user-not-found';
import { useCallback } from 'react';

export function useAuthenticatedApi() {
  const { data: session } = useSession();
  const { handleUserNotFound, checkForUserNotFound } = useUserNotFoundHandler();

  const apiCall = useCallback(async (
    url: string,
    options: RequestInit = {}
  ) => {
    if (!session?.user?.token) {
      throw new Error('No authentication token available');
    }

    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'https://hedera-quests.com';
    const fullUrl = url.startsWith('http') ? url : `${baseUrl}${url}`;

    const response = await fetch(fullUrl, {
      ...options,
      headers: {
        'Authorization': `Bearer ${session.user.token}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    const data = await response.json();

    // Check if user not found - this means account was deleted but session is still active
    if (checkForUserNotFound(response, data)) {
      await handleUserNotFound();
      throw new Error('User not found - account may have been deleted');
    }

    if (!response.ok) {
      throw new Error(`API call failed: ${response.status} ${response.statusText}`);
    }

    return { response, data };
  }, [session, handleUserNotFound, checkForUserNotFound]);

  return {
    apiCall,
    hasToken: !!session?.user?.token
  };
}
