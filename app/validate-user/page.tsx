"use client"
import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, XCircle, Loader2, Home, ArrowRight } from 'lucide-react';

type ValidationState = 'loading' | 'success' | 'error';

export default function ValidateUserPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { toast } = useToast();
  
  const [validationState, setValidationState] = useState<ValidationState>('loading');
  const [countdown, setCountdown] = useState(5);
  const [errorMessage, setErrorMessage] = useState<string>('');

  const validateUser = async () => {
    try {
      const accessToken = session?.user?.token;
      
      if (!accessToken) {
        throw new Error('No authentication token found. Please log in again.');
      }

      const baseUrl =process.env.NEXT_PUBLIC_API_URL || 'https://hedera-quests.com';
      const response = await fetch(`${baseUrl}/profile/hederadid/validate-user`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(async () => {
         
          return { message: await response.text() };
        });
        throw new Error(errorData.message || `Validation failed: ${response.status} ${response.statusText}`);
      }

      // Success
      setValidationState('success');
      toast({
        title: "Validation Successful",
        description: "Your Hedera account has been successfully validated!",
        variant: "default",
      });

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'An unexpected error occurred during validation.';
      console.error('API validate-user error:', error);
      
      setValidationState('error');
      setErrorMessage(errorMsg);
      
      toast({
        title: "Validation Failed",
        description: errorMsg,
        variant: "destructive",
      });
    }
  };

  // Auto-redirect countdown effect
  useEffect(() => {
    if (validationState === 'success' && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (validationState === 'success' && countdown === 0) {
      router.push('/profile');
    }
  }, [validationState, countdown, router]);

  // Auto-validate when session is ready
  useEffect(() => {
    if (status === 'loading') return; 
    
    if (status === 'unauthenticated') {
      toast({
        title: "Authentication Required",
        description: "Please log in to validate your account.",
        variant: "destructive",
      });
      router.push('/auth/login');
      return;
    }

    if (session?.user?.token) {
      validateUser();
    }
  }, [session, status, router]);

  const handleGoHome = () => {
    router.push('/profile');
  };

  const handleRetry = () => {
    setValidationState('loading');
    setErrorMessage('');
    setCountdown(5);
    validateUser();
  };

  const renderContent = () => {
    switch (validationState) {
      case 'loading':
        return (
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <Loader2 className="h-16 w-16 animate-spin text-primary" />
            </div>
            <h1 className="text-3xl font-bold font-mono text-primary mb-4">
              Validating Your Account
            </h1>
            <p className="text-lg font-mono text-muted-foreground mb-6">
              Please wait while we validate your Hedera account...
            </p>
            <div className="bg-primary/10 rounded-lg p-4 border border-dashed border-primary/30">
              <p className="text-sm font-mono text-primary">
                {">"} PROCESSING_VALIDATION...
              </p>
            </div>
          </div>
        );

      case 'success':
        return (
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <CheckCircle className="h-16 w-16 text-green-500" />
            </div>
            <h1 className="text-3xl font-bold font-mono text-green-600 mb-4">
              Validation Successful!
            </h1>
            <p className="text-lg font-mono text-muted-foreground mb-6">
              Your Hedera account has been successfully validated. You can now access all quest features.
            </p>
            <div className="bg-green-500/10 rounded-lg p-4 border border-dashed border-green-500/30 mb-6">
              <p className="text-sm font-mono text-green-600">
                {">"} ACCOUNT_VERIFIED ✓
              </p>
              <p className="text-sm font-mono text-green-600 mt-1">
                {">"} REDIRECTING_IN {countdown}s...
              </p>
            </div>
            <Button
              variant="default"
              size="lg"
              className="font-mono"
              onClick={handleGoHome}
            >
              <Home className="w-4 h-4 mr-2" />
              Go to Profile Now
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        );

      case 'error':
        return (
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <XCircle className="h-16 w-16 text-red-500" />
            </div>
            <h1 className="text-3xl font-bold font-mono text-red-600 mb-4">
              Validation Failed
            </h1>
            <p className="text-lg font-mono text-muted-foreground mb-4">
              We encountered an error while validating your account.
            </p>
            {errorMessage && (
              <div className="bg-red-500/10 rounded-lg p-4 border border-dashed border-red-500/30 mb-6">
                <p className="text-sm font-mono text-red-600 break-words">
                  {">"} ERROR: {errorMessage}
                </p>
              </div>
            )}
            <div className="flex gap-3 justify-center flex-wrap">
              <Button
                variant="outline"
                size="lg"
                className="font-mono border-dashed"
                onClick={handleRetry}
              >
                <Loader2 className="w-4 h-4 mr-2" />
                Try Again
              </Button>
              <Button
                variant="default"
                size="lg"
                className="font-mono"
                onClick={handleGoHome}
              >
                <Home className="w-4 h-4 mr-2" />
                Go to Profile
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-primary/10 to-purple-500/10 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg p-8 border-2 border-dashed border-primary/30 max-w-md w-full">
        {renderContent()}
      </div>
      
      {/* Progress indicator */}
      <div className="mt-6 text-center">
        <p className="text-xs font-mono text-muted-foreground">
          HEDERA_QUEST_MACHINE v2.0
        </p>
      </div>
    </div>
  );
}
