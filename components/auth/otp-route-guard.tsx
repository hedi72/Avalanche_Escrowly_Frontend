'use client';

import { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useUserNotFoundHandler } from '@/hooks/use-user-not-found';
import { useRouter } from 'next/navigation';
import { OtpVerification } from './otp-verification';
import { useToast } from '@/hooks/use-toast';

interface OtpRouteGuardProps {
  children: React.ReactNode;
}

export function OtpRouteGuard({ children }: OtpRouteGuardProps) {
  const { data: session, status } = useSession();
  const { handleUserNotFound, checkForUserNotFound } = useUserNotFoundHandler();
  const [needsVerification, setNeedsVerification] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [userEmail, setUserEmail] = useState<string>('');
  const [userToken, setUserToken] = useState<string>('');
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    const checkEmailVerification = async () => {
      if (status === 'loading') return;
      
      if (!session?.user?.token) {
        setIsChecking(false);
        return;
      }

      try {
        // Check user profile to see if email is verified
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "https://hedera-quests.com"}/profile/me`, {
          headers: {
            'Authorization': `Bearer ${session.user.token}`,
            'Content-Type': 'application/json',
          },
        });

        const data = await response.json();

        // Check if user not found - this means account was deleted but session is still active
        if (checkForUserNotFound(response, data)) {
          await handleUserNotFound();
          return;
        }

        if (response.ok) {
          const emailVerified = data.user?.email_verified || false;
          
          if (!emailVerified) {
            console.log('Email not verified, showing OTP verification');
            setUserEmail(data.user?.email || session.user?.email || '');
            setUserToken(session.user.token);
            setNeedsVerification(true);
            
            // Show info toast
            toast({
              title: "Email Verification Required",
              description: "Please verify your email address to continue.",
              variant: "default"
            });
          } else {
            setNeedsVerification(false);
          }
        }
      } catch (error) {
        console.error('Error checking email verification:', error);
        // If we can't check, assume verification is not needed to avoid blocking the user
        setNeedsVerification(false);
      } finally {
        setIsChecking(false);
      }
    };

    checkEmailVerification();
  }, [session, status, toast]);

  const handleVerificationComplete = () => {
    setNeedsVerification(false);
    toast({
      title: "Email Verified!",
      description: "Your email has been successfully verified.",
      variant: "default"
    });
  };

  const handleBackToLogin = () => {
    // Sign out and redirect to login
    router.push('/auth/login');
  };

  if (isChecking) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <p className="mt-4 text-muted-foreground">Checking verification status...</p>
      </div>
    );
  }

  if (needsVerification && userEmail && userToken) {
    return (
      <div className="min-h-screen bg-[#0b0d14] flex items-center justify-center p-4">
        {/* Pixel grid background */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              'linear-gradient(#111827 1px, transparent 1px), linear-gradient(90deg, #111827 1px, transparent 1px)',
            backgroundSize: '12px 12px'
          }}
        />
        
        <div className="relative z-10">
          <OtpVerification
            email={userEmail}
            token={userToken}
            onBack={handleBackToLogin}
            onVerificationComplete={handleVerificationComplete}
          />
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
