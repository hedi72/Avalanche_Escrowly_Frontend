'use client';

import { useCallback } from 'react';
import { signOut } from 'next-auth/react';
import { useToast } from '@/hooks/use-toast';

export function useUserNotFoundHandler() {
  const { toast } = useToast();

  const handleUserNotFound = useCallback(async () => {
    console.log("User not found - account may have been deleted. Signing out...");
    
    toast({
      title: "Account Not Found",
      description: "Your account was not found. You will be signed out.",
      variant: "destructive",
    });
    
    // Sign out the user and redirect to home
    await signOut({ callbackUrl: "/" });
  }, [toast]);

  const checkForUserNotFound = useCallback((response: Response, data?: any) => {
    // Check if response indicates user not found
    if (!response.ok || (data && !data.success && data.message === "user not found")) {
      return true;
    }
    return false;
  }, []);

  return {
    handleUserNotFound,
    checkForUserNotFound
  };
}
