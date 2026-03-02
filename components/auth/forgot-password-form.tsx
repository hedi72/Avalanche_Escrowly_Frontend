'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Image from 'next/image';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Mail, AlertCircle, CheckCircle, ArrowLeft, Shield } from 'lucide-react';
import { HydrationSafe } from '@/components/hydration-safe';
import ErrorBoundary from '@/components/error-boundary';
import { useToast } from '@/hooks/use-toast';
import { useRecaptcha } from '@/hooks/use-recaptcha';

const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

interface ForgotPasswordFormProps {
  onBack: () => void;
  isMobile?: boolean;
}

export function ForgotPasswordForm({ onBack, isMobile = false }: ForgotPasswordFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const { getRecaptchaToken, isAvailable: isRecaptchaAvailable } = useRecaptcha();

  const { register, handleSubmit, formState: { errors }, getValues } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema)
  });

  const verifyRecaptcha = async (): Promise<string | null> => {
    if (!isRecaptchaAvailable) {
      console.warn('reCAPTCHA not available, proceeding without verification');
      return null;
    }

    try {
      const token = await getRecaptchaToken('forgot_password');
      if (!token) {
        throw new Error('Failed to get reCAPTCHA token');
      }

      console.log('reCAPTCHA token generated successfully');
      return token;
    } catch (error) {
      console.error('reCAPTCHA verification error:', error);
      return null;
    }
  };

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setIsLoading(true);
    setError(null);

    // Show loading toast
    const loadingToast = toast({
      title: "Sending reset link...",
      description: "Please wait while we process your request.",
      variant: "default"
    });

    try {
      // Get reCAPTCHA token (will be null if not available)
      const recaptchaToken = await verifyRecaptcha();

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://hedera-quests.com";
      
      const response = await fetch(`${apiUrl}/profile/forget-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          email: data.email,
          ...(recaptchaToken && { recaptchaToken })
        }),
      });

      const result = await response.json();

      // Dismiss loading toast
      loadingToast.dismiss();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to send reset email');
      }

      if (result.success) {
        setIsSuccess(true);
        
        // Show success toast
        toast({
          title: "Reset link sent!",
          description: "Check your email for the password reset link.",
          variant: "default"
        });
      } else {
        throw new Error(result.message || 'Failed to send reset email');
      }
    } catch (err) {
      // Dismiss loading toast
      loadingToast.dismiss();

      const errorMessage = err instanceof Error ? err.message : 'Failed to send reset email. Please try again.';
      console.error('Forgot password error:', errorMessage);
      setError(errorMessage);

      // Show appropriate error toast
      let toastTitle = "Failed to Send Reset Link";
      let toastDescription = errorMessage;

      if (errorMessage.toLowerCase().includes('email') || errorMessage.toLowerCase().includes('not found')) {
        toastTitle = "Email Not Found";
        toastDescription = "No account found with this email address. Please check your email or create an account.";
      } else if (errorMessage.toLowerCase().includes('network') || errorMessage.toLowerCase().includes('connection')) {
        toastTitle = "Connection Error";
        toastDescription = "Unable to connect to our servers. Please check your internet connection and try again.";
      }

      toast({
        title: toastTitle,
        description: toastDescription,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendEmail = () => {
    const email = getValues('email');
    if (email) {
      setIsSuccess(false);
      handleSubmit(onSubmit)();
    }
  };

  if (isSuccess) {
    return (
      <ErrorBoundary>
        <HydrationSafe fallback={
          <div className="flex items-center justify-center p-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        }>
          <Card className={`w-full ${isMobile ? 'max-w-none border-0 shadow-none bg-transparent' : 'max-w-md'}`}>
            <CardHeader className={`text-center ${isMobile ? 'p-6 pb-4' : 'p-4'}`}>
              <div className="mx-auto mb-5 mt-4 w-5 h-5  relative">
                <Image src="/logo.png" alt="Hedera Quest" fill className="object-contain scale-[2.5]" />
              </div>
              <CardTitle className={`text-2xl ${isMobile ? 'text-white' : ''}`}>Check Your Email</CardTitle>
              <p className={`${isMobile ? 'text-purple-200' : 'text-muted-foreground'}`}>
                We've sent a password reset link to your email
              </p>
            </CardHeader>
            
            <CardContent className={`${isMobile ? 'p-6 pt-2' : ''}`}>
              <div className="space-y-4">
                <Alert className="border-green-500 bg-green-50 text-green-700">
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    A password reset link has been sent to your email address. 
                    Please check your inbox and follow the instructions to reset your password.
                  </AlertDescription>
                </Alert>

                <div className="space-y-3">
                  <Button 
                    onClick={handleResendEmail}
                    variant="outline" 
                    className="w-full"
                    disabled={isLoading}
                  >
                    {isLoading ? 'Sending...' : 'Resend Email'}
                  </Button>

                  <Button 
                    onClick={onBack}
                    variant="ghost" 
                    className="w-full"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Login
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </HydrationSafe>
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <HydrationSafe fallback={
        <div className="flex items-center justify-center p-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      }>
        <Card className={`w-full ${isMobile ? 'max-w-none border-0 shadow-none bg-transparent' : 'max-w-md'}`}>
          <CardHeader className={`text-center ${isMobile ? 'p-6 pb-4' : 'p-4'}`}>
            <div className="mx-auto mb-5 mt-4 w-5 h-5  relative">
              <Image src="/logo.png" alt="Hedera Quest" fill className="object-contain scale-[2.5]" />
            </div>
            <CardTitle className={`text-2xl ${isMobile ? 'text-white' : ''}`}>Reset Password</CardTitle>
            <p className={`${isMobile ? 'text-purple-200' : 'text-muted-foreground'}`}>
              Enter your email address and we'll send you a reset link
            </p>
          </CardHeader>
          
          <CardContent className={`${isMobile ? 'p-6 pt-2' : ''}`}>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
              <div className="space-y-2">
                <Label htmlFor="email" className={`${isMobile ? 'text-white' : ''}`}>Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email address"
                    className="pl-10"
                    {...register('email')}
                  />
                </div>
                {errors.email && (
                  <p className="text-sm text-destructive">{errors.email.message}</p>
                )}
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* reCAPTCHA Protection Indicator */}
              {isRecaptchaAvailable && (
                <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground border rounded-md p-2 bg-muted/20">
                  <Shield className="h-3 w-3" />
                  <span>Protected by reCAPTCHA</span>
                </div>
              )}

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Sending Reset Link...' : 'Send Reset Link'}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <button
                onClick={onBack}
                className="text-primary hover:underline font-medium text-sm inline-flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Login
              </button>
            </div>
          </CardContent>
        </Card>
      </HydrationSafe>
    </ErrorBoundary>
  );
}