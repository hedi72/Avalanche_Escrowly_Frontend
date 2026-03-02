'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Image from 'next/image';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Lock, Eye, EyeOff, AlertCircle, CheckCircle, Shield } from 'lucide-react';
import { HydrationSafe } from '@/components/hydration-safe';
import ErrorBoundary from '@/components/error-boundary';
import { useToast } from '@/hooks/use-toast';
import { useRecaptcha } from '@/hooks/use-recaptcha';

const updatePasswordSchema = z.object({
  newPassword: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  confirmPassword: z.string()
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type UpdatePasswordFormData = z.infer<typeof updatePasswordSchema>;

export default function UpdatePasswordPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [isTokenValid, setIsTokenValid] = useState<boolean | null>(null);
  
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { getRecaptchaToken, isAvailable: isRecaptchaAvailable } = useRecaptcha();

  const { register: registerMobile, handleSubmit: handleSubmitMobile, formState: { errors: errorsMobile } } = useForm<UpdatePasswordFormData>({
    resolver: zodResolver(updatePasswordSchema)
  });

  const { register: registerDesktop, handleSubmit: handleSubmitDesktop, formState: { errors: errorsDesktop } } = useForm<UpdatePasswordFormData>({
    resolver: zodResolver(updatePasswordSchema)
  });

  useEffect(() => {
    const tokenParam = searchParams?.get('token');
    if (tokenParam) {
      setToken(tokenParam);
      setIsTokenValid(true);
    } else {
      setIsTokenValid(false);
      setError('Invalid or missing reset token');
    }
  }, [searchParams]);

  const verifyRecaptcha = async (): Promise<string | null> => {
    if (!isRecaptchaAvailable) {
      console.warn('reCAPTCHA not available, proceeding without verification');
      return null;
    }

    try {
      const recaptchaToken = await getRecaptchaToken('update_password');
      if (!recaptchaToken) {
        throw new Error('Failed to get reCAPTCHA token');
      }

      console.log('reCAPTCHA token generated successfully');
      return recaptchaToken;
    } catch (error) {
      console.error('reCAPTCHA verification error:', error);
      return null;
    }
  };

  const onSubmit = async (data: UpdatePasswordFormData) => {
    if (!token) {
      setError('Reset token is missing');
      return;
    }

    setIsLoading(true);
    setError(null);

    const loadingToast = toast({
      title: "Updating password...",
      description: "Please wait while we update your password.",
      variant: "default"
    });

    try {
      const recaptchaToken = await verifyRecaptcha();
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://hedera-quests.com";
      
      const response = await fetch(`${apiUrl}/profile/update-password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          newPassword: data.newPassword,
          token: token,
          ...(recaptchaToken && { recaptchaToken })
        }),
      });

      const result = await response.json();
      loadingToast.dismiss();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to update password');
      }

      if (result.success) {
        setIsSuccess(true);
        toast({
          title: "Password Updated!",
          description: "Your password has been successfully updated.",
          variant: "default"
        });

        setTimeout(() => {
          router.push('/auth/login');
        }, 3000);
      } else {
        throw new Error(result.message || 'Failed to update password');
      }
    } catch (err) {
      loadingToast.dismiss();
      const errorMessage = err instanceof Error ? err.message : 'Failed to update password. Please try again.';
      console.error('Update password error:', errorMessage);
      setError(errorMessage);

      let toastTitle = "Failed to Update Password";
      let toastDescription = errorMessage;

      if (errorMessage.toLowerCase().includes('token') || errorMessage.toLowerCase().includes('expired')) {
        toastTitle = "Invalid or Expired Token";
        toastDescription = "The reset link has expired or is invalid. Please request a new password reset.";
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

  if (isTokenValid === false) {
    return (
      <ErrorBoundary>
        <HydrationSafe fallback={
          <div className="flex items-center justify-center min-h-screen">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        }>
          <div className="relative min-h-screen bg-[#0b0d14] flex items-center justify-center p-4">
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 opacity-20"
              style={{
                backgroundImage:
                  'linear-gradient(#111827 1px, transparent 1px), linear-gradient(90deg, #111827 1px, transparent 1px)',
                backgroundSize: '12px 12px'
              }}
            />
            
            <div className="relative w-full max-w-6xl">
              {/* Mobile Layout */}
              <div className="lg:hidden flex flex-col">
                <Card className="w-full max-w-none border-0 shadow-none bg-transparent">
                  <CardHeader className="text-center p-6 pb-4">
                    <div className="mx-auto mb-5 mt-4 w-5 h-5  relative">
                      <Image src="/logo.png" alt="Hedera Quest" fill className="object-contain scale-[2.5]" />
                    </div>
                    <CardTitle className="text-2xl text-white">Invalid Reset Link</CardTitle>
                    <p className="text-purple-200">
                      This password reset link is invalid or has expired
                    </p>
                  </CardHeader>
                  
                  <CardContent className="p-6 pt-2">
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        The password reset link you followed is invalid or has expired. 
                        Please request a new password reset.
                      </AlertDescription>
                    </Alert>
                    
                    <Button 
                      onClick={() => router.push('/auth/login')}
                      className="w-full mt-4"
                    >
                      Back to Login
                    </Button>
                  </CardContent>
                </Card>
              </div>

              {/* Desktop Layout */}
              <div className="hidden lg:flex justify-center">
                <Card className="w-full max-w-md">
                  <CardHeader className="text-center p-4">
                    <div className="mx-auto mb-5 mt-4 w-5 h-5  relative">
                      <Image src="/logo.png" alt="Hedera Quest" fill className="object-contain scale-[2.5]" />
                    </div>
                    <CardTitle className="text-2xl">Invalid Reset Link</CardTitle>
                    <p className="text-muted-foreground">
                      This password reset link is invalid or has expired
                    </p>
                  </CardHeader>
                  
                  <CardContent>
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        The password reset link you followed is invalid or has expired. 
                        Please request a new password reset.
                      </AlertDescription>
                    </Alert>
                    
                    <Button 
                      onClick={() => router.push('/auth/login')}
                      className="w-full mt-4"
                    >
                      Back to Login
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </HydrationSafe>
      </ErrorBoundary>
    );
  }

  if (isSuccess) {
    return (
      <ErrorBoundary>
        <HydrationSafe fallback={
          <div className="flex items-center justify-center min-h-screen">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        }>
          <div className="relative min-h-screen bg-[#0b0d14] flex items-center justify-center p-4">
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 opacity-20"
              style={{
                backgroundImage:
                  'linear-gradient(#111827 1px, transparent 1px), linear-gradient(90deg, #111827 1px, transparent 1px)',
                backgroundSize: '12px 12px'
              }}
            />
            
            <div className="relative w-full max-w-6xl">
              {/* Mobile Layout */}
              <div className="lg:hidden flex flex-col">
                <Card className="w-full max-w-none border-0 shadow-none bg-transparent">
                  <CardHeader className="text-center p-6 pb-4">
                    <div className="mx-auto mb-5 mt-4 w-5 h-5  relative">
                      <Image src="/logo.png" alt="Hedera Quest" fill className="object-contain scale-[2.5]" />
                    </div>
                    <CardTitle className="text-2xl text-white">Password Updated!</CardTitle>
                    <p className="text-purple-200">
                      Your password has been successfully updated
                    </p>
                  </CardHeader>
                  
                  <CardContent className="p-6 pt-2">
                    <Alert className="border-green-500 bg-green-50 text-green-700">
                      <CheckCircle className="h-4 w-4" />
                      <AlertDescription>
                        Your password has been successfully updated. You will be redirected to the login page shortly.
                      </AlertDescription>
                    </Alert>
                    
                    <Button 
                      onClick={() => router.push('/auth/login')}
                      className="w-full mt-4"
                    >
                      Go to Login
                    </Button>
                  </CardContent>
                </Card>
              </div>

              {/* Desktop Layout */}
              <div className="hidden lg:flex justify-center">
                <Card className="w-full max-w-md">
                  <CardHeader className="text-center p-4">
                    <div className="mx-auto mb-5 mt-4 w-5 h-5  relative">
                      <Image src="/logo.png" alt="Hedera Quest" fill className="object-contain scale-[2.5]" />
                    </div>
                    <CardTitle className="text-2xl">Password Updated!</CardTitle>
                    <p className="text-muted-foreground">
                      Your password has been successfully updated
                    </p>
                  </CardHeader>
                  
                  <CardContent>
                    <Alert className="border-green-500 bg-green-50 text-green-700">
                      <CheckCircle className="h-4 w-4" />
                      <AlertDescription>
                        Your password has been successfully updated. You will be redirected to the login page shortly.
                      </AlertDescription>
                    </Alert>
                    
                    <Button 
                      onClick={() => router.push('/auth/login')}
                      className="w-full mt-4"
                    >
                      Go to Login
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </HydrationSafe>
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <HydrationSafe fallback={
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      }>
        <div className="relative min-h-screen bg-[#0b0d14] flex items-center justify-center p-4">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-20"
            style={{
              backgroundImage:
                'linear-gradient(#111827 1px, transparent 1px), linear-gradient(90deg, #111827 1px, transparent 1px)',
              backgroundSize: '12px 12px'
            }}
          />
          
          <div className="relative w-full max-w-6xl">
            {/* Mobile Layout */}
            <div className="lg:hidden flex flex-col">
              <Card className="w-full max-w-none border-0 shadow-none bg-transparent">
                <CardHeader className="text-center p-6 pb-4">
                  <div className="mx-auto mb-5 mt-4 w-5 h-5  relative">
                    <Image src="/logo.png" alt="Hedera Quest" fill className="object-contain scale-[2.5]" />
                  </div>
                  <CardTitle className="text-2xl text-white">Set New Password</CardTitle>
                  <p className="text-purple-200">
                    Enter your new password below
                  </p>
                </CardHeader>
                
                <CardContent className="p-6 pt-2">
                  <form onSubmit={handleSubmitMobile(onSubmit)} className="space-y-4" noValidate>
                    <div className="space-y-2">
                      <Label htmlFor="mobile-newPassword" className="text-white">New Password</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="mobile-newPassword"
                          type={showPassword ? 'text' : 'password'}
                          placeholder="Enter your new password"
                          className="pl-10 pr-10"
                          {...registerMobile('newPassword')}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                      {errorsMobile.newPassword && (
                        <p className="text-sm text-destructive">{errorsMobile.newPassword.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="mobile-confirmPassword" className="text-white">Confirm New Password</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="mobile-confirmPassword"
                          type={showConfirmPassword ? 'text' : 'password'}
                          placeholder="Confirm your new password"
                          className="pl-10 pr-10"
                          {...registerMobile('confirmPassword')}
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                      {errorsMobile.confirmPassword && (
                        <p className="text-sm text-destructive">{errorsMobile.confirmPassword.message}</p>
                      )}
                    </div>

                    {error && (
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{error}</AlertDescription>
                      </Alert>
                    )}

                    {isRecaptchaAvailable && (
                      <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground border rounded-md p-2 bg-muted/20">
                        <Shield className="h-3 w-3" />
                        <span>Protected by reCAPTCHA</span>
                      </div>
                    )}

                    <Button type="submit" className="w-full" disabled={isLoading || !token}>
                      {isLoading ? 'Updating Password...' : 'Update Password'}
                    </Button>
                  </form>

                  <div className="mt-6 text-center">
                    <button
                      onClick={() => router.push('/auth/login')}
                      className="text-primary hover:underline font-medium text-sm"
                    >
                      Back to Login
                    </button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Desktop Layout */}
            <div className="hidden lg:flex justify-center">
              <Card className="w-full max-w-md">
                <CardHeader className="text-center p-4">
                  <div className="mx-auto mb-5 mt-4 w-5 h-5  relative">
                    <Image src="/logo.png" alt="Hedera Quest" fill className="object-contain scale-[2.5]" />
                  </div>
                  <CardTitle className="text-2xl">Set New Password</CardTitle>
                  <p className="text-muted-foreground">
                    Enter your new password below
                  </p>
                </CardHeader>
                
                <CardContent>
                  <form onSubmit={handleSubmitDesktop(onSubmit)} className="space-y-4" noValidate>
                    <div className="space-y-2">
                      <Label htmlFor="desktop-newPassword">New Password</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="desktop-newPassword"
                          type={showPassword ? 'text' : 'password'}
                          placeholder="Enter your new password"
                          className="pl-10 pr-10"
                          {...registerDesktop('newPassword')}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                      {errorsDesktop.newPassword && (
                        <p className="text-sm text-destructive">{errorsDesktop.newPassword.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="desktop-confirmPassword">Confirm New Password</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="desktop-confirmPassword"
                          type={showConfirmPassword ? 'text' : 'password'}
                          placeholder="Confirm your new password"
                          className="pl-10 pr-10"
                          {...registerDesktop('confirmPassword')}
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                      {errorsDesktop.confirmPassword && (
                        <p className="text-sm text-destructive">{errorsDesktop.confirmPassword.message}</p>
                      )}
                    </div>

                    {error && (
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{error}</AlertDescription>
                      </Alert>
                    )}

                    {isRecaptchaAvailable && (
                      <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground border rounded-md p-2 bg-muted/20">
                        <Shield className="h-3 w-3" />
                        <span>Protected by reCAPTCHA</span>
                      </div>
                    )}

                    <Button type="submit" className="w-full" disabled={isLoading || !token}>
                      {isLoading ? 'Updating Password...' : 'Update Password'}
                    </Button>
                  </form>

                  <div className="mt-6 text-center">
                    <button
                      onClick={() => router.push('/auth/login')}
                      className="text-primary hover:underline font-medium text-sm"
                    >
                      Back to Login
                    </button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </HydrationSafe>
    </ErrorBoundary>
  );
}