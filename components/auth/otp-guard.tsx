'use client';

import { useEffect, useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useUserNotFoundHandler } from '@/hooks/use-user-not-found';
import { useRouter } from 'next/navigation';
import { OtpVerification } from '@/components/auth/otp-verification';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Loader2 } from 'lucide-react';
import Image from 'next/image';

interface OtpGuardProps {
  children: React.ReactNode;
  token?: string;
  email?: string;
}

export function OtpGuard({ children, token, email }: OtpGuardProps) {
  const { data: session, status } = useSession();
  const { handleUserNotFound, checkForUserNotFound } = useUserNotFoundHandler();
  const router = useRouter();
  const [isVerified, setIsVerified] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkVerificationStatus = async () => {
      if (status === 'loading') return;

      if (!session?.user?.token) {
        setError('No authentication token found. Please log in again.');
        setIsLoading(false);
        return;
      }

      try {
        // Check if user's email is already verified
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "https://hedera-quests.com"}/profile/me`, {
          method: 'GET',
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
          const user = data.admin || data.user || data;
          
          // If user is verified, allow access
          if (user.is_verified || user.email_verified_at) {
            setIsVerified(true);
          }
        }
      } catch (err) {
        console.error('Failed to check verification status:', err);
        // If we can't check status, assume not verified and show OTP
      }

      setIsLoading(false);
    };

    checkVerificationStatus();
  }, [session, status]);

  if (status === 'loading' || isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin mb-4" />
        <p className="text-muted-foreground">Checking verification status...</p>
      </div>
    );
  }

  if (!session) {
    // Not authenticated, redirect to login
    router.push('/auth/login');
    return null;
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-5 mt-4 w-5 h-5  relative">
              <Image src="/logo.png" alt="Hedera Quest" fill className="object-contain" />
            </div>
            <CardTitle className="text-xl">Verification Required</CardTitle>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isVerified) {
    // Need to verify email
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <OtpVerification
          email={email || session.user.email || ''}
          token={token || session.user.token || ''}
          onBack={() => router.push('/auth/login')}
        />
      </div>
    );
  }

  // User is verified, render protected content
  return <>{children}</>;
}
