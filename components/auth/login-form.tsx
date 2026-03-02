'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import type { User } from '@/lib/types';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Image from 'next/image';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Eye, EyeOff, Mail, Lock, AlertCircle, Shield } from 'lucide-react';
import { HydrationSafe } from '@/components/hydration-safe';
import ErrorBoundary from '@/components/error-boundary';
import { useToast } from '@/hooks/use-toast';
import { useRecaptcha } from '@/hooks/use-recaptcha';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginFormData = z.infer<typeof loginSchema>;

interface LoginFormProps {
  onSwitchToRegister: () => void;
  onSwitchToForgotPassword: () => void;
  isMobile?: boolean;
}

export function LoginForm({ onSwitchToRegister, onSwitchToForgotPassword, isMobile = false }: LoginFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const { toast } = useToast();
  const router = useRouter();
  const { getRecaptchaToken, isAvailable: isRecaptchaAvailable } = useRecaptcha();

  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema)
  });

  const verifyRecaptcha = async (): Promise<string | null> => {
    if (!isRecaptchaAvailable) {
      console.warn('reCAPTCHA not available, proceeding without verification');
      return null; // Allow login without reCAPTCHA if not available
    }

    try {
      const token = await getRecaptchaToken('login');
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

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    setError(null);

    // Client-side validation feedback
    if (!data.email || !data.password) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      setIsLoading(false);
      return;
    }

    // Show loading toast
    const loadingToast = toast({
      title: "Signing you in...",
      description: "Please wait while we verify your credentials.",
      variant: "default"
    });

    try {
      // Get reCAPTCHA token (will be null if not available)
      const recaptchaToken = await verifyRecaptcha();

      console.log('LoginForm: Attempting NextAuth signIn with:', { email: data.email, hasPassword: !!data.password });

      const result = await signIn('credentials', {
        email: data.email,
        password: data.password,
        recaptchaToken: recaptchaToken || undefined,
        redirect: false,
      });

      console.log('LoginForm: NextAuth signIn result:', result);

      // Dismiss loading toast
      loadingToast.dismiss();

      if (result?.error) {
        console.error('LoginForm: NextAuth signIn error:', result.error);
        throw new Error(result.error);
      }

      if (result?.ok) {
        console.log('LoginForm: NextAuth signIn successful');

        // Show success toast
        toast({
          title: "Welcome back!",
          description: "Successfully signed in!",
          variant: "default"
        });

        // Small delay to ensure session is established before redirect
        setTimeout(async () => {
          // Get the fresh session to check user role
          const { getSession } = await import('next-auth/react');
          const session = await getSession();
          
          if (session?.user?.role === 'admin' || session?.user?.isAdmin) {
            console.log('LoginForm: Admin user detected, redirecting to admin dashboard...');
            router.push('/admin');
          } else {
            console.log('LoginForm: Redirecting to home page...');
            router.push('/');
          }
        }, 500);
      } else {
        console.error('LoginForm: NextAuth signIn result not ok:', result);
        throw new Error('Sign in failed - unexpected result');
      }
    } catch (err) {
      // Dismiss loading toast
      loadingToast.dismiss();

      const errorMessage = err instanceof Error ? err.message : 'Login failed. Please try again.';
      console.error('LoginForm: Login error:', errorMessage);
      setError(errorMessage);

      // Show appropriate error toast based on error type
      let toastTitle = "Sign In Failed";
      let toastDescription = errorMessage;

      if (errorMessage.toLowerCase().includes('password')) {
        toastTitle = "Incorrect Password";
        toastDescription = "The password you entered is incorrect. Please try again.";
      } else if (errorMessage.toLowerCase().includes('email') || errorMessage.toLowerCase().includes('user not found')) {
        toastTitle = "Account Not Found";
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

  // Handle Google Sign In
  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setError(null);

    try {
      console.log('LoginForm: Attempting Google Sign In');
      
      const result = await signIn('google', {
        callbackUrl: '/',
        redirect: true,
      });

      // If there's an error and no redirect happened
      if (result?.error) {
        console.error('LoginForm: Google Sign In error:', result.error);
        setError('Failed to sign in with Google. Please try again.');
        setIsLoading(false);
      }
    } catch (error) {
      console.error('LoginForm: Google Sign In exception:', error);
      setError('An unexpected error occurred. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <ErrorBoundary>
      <HydrationSafe fallback={
        <div className="flex items-center justify-center p-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      }>
        <Card className={`w-full ${isMobile ? 'max-w-none border-0 shadow-none bg-transparent' : 'max-w-md'}`}>
          <CardHeader className={`text-center ${isMobile ? 'p-6 pb-4' : 'p-4'}`}>
            <div className="mx-auto mb-5 mt-4 w-5 h-5 relative">
              <Image src="/logo.png" alt="Hedera Quest" fill className="object-contain scale-[2.5]" />
            </div>
            <CardTitle className={`text-2xl ${isMobile ? 'text-white' : ''}`}>Welcome Back</CardTitle>
            <p className={`${isMobile ? 'text-purple-200' : 'text-muted-foreground'}`}>Sign in to continue your Hedera journey</p>
          </CardHeader>
          
          <CardContent className={`${isMobile ? 'p-6 pt-2' : ''}`}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div className="space-y-2">
            <Label htmlFor="email" className={`${isMobile ? 'text-white' : ''}`}>Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                className="pl-10"
                {...register('email')}
              />
            </div>
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className={`${isMobile ? 'text-white' : ''}`}>Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                className="pl-10 pr-10"
                {...register('password')}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.password && (
              <p className="text-sm text-destructive">{errors.password.message}</p>
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
            {isLoading ? 'Signing in...' : 'Sign In'}
          </Button>
        </form>

        {/* Divider */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className={`px-2 ${isMobile ? 'bg-black text-white' : 'bg-background text-muted-foreground'}`}>
              Or continue with
            </span>
          </div>
        </div>

        {/* Google Sign In Button */}
        <Button
          type="button"
          variant="outline"
          onClick={handleGoogleSignIn}
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-2"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
          <span>Continue with Google</span>
        </Button>

        <div className="mt-4 text-center">
          <button
            onClick={onSwitchToForgotPassword}
            className="text-sm text-primary hover:underline font-medium"
          >
            Forgot your password?
          </button>
        </div>

        <div className="mt-6 text-center">
          <p className="text-sm text-muted-foreground">
            Don't have an account?{' '}
            <button
              onClick={onSwitchToRegister}
              className="text-primary hover:underline font-medium"
            >
              Create one here
            </button>
          </p>
        </div>


          </CardContent>
        </Card>
      </HydrationSafe>
    </ErrorBoundary>
  );
}