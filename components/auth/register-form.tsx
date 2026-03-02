'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { signIn } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Image from 'next/image';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AuthService } from '@/lib/api/auth';
import type { ApiError } from '@/lib/api/client';
import type { User } from '@/lib/types';
import { Eye, EyeOff, Mail, Lock, User as UserIcon, AlertCircle, Shield, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { HydrationSafe } from '@/components/hydration-safe';
import ErrorBoundary from '@/components/error-boundary';
import { useToast } from '@/hooks/use-toast';
import { useRecaptcha } from '@/hooks/use-recaptcha';

const registerSchema = z.object({
  name: z.string()
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name must be less than 50 characters')
    .regex(/^[a-zA-Z\s\-']+$/, 'Name can only contain letters, spaces, hyphens, and apostrophes')
    .refine((val) => val.trim().length >= 2, 'Name must contain at least 2 non-space characters')
    .refine((val) => !/^[\s\-']+$/.test(val), 'Name must contain at least one letter')
    .refine((val) => !val.includes('  '), 'Name cannot contain consecutive spaces'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
  referralCode: z.string()
    .optional()
    .refine((val) => !val || val.trim().length >= 2, 'Referral code must be at least 2 characters if provided')
    .refine((val) => !val || val.trim().length <= 50, 'Referral code must be less than 50 characters'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type RegisterFormData = z.infer<typeof registerSchema>;

interface RegisterFormProps {
  onSwitchToLogin: () => void;
  onRegistrationSuccess: (email: string, token: string) => void;
  referralCode?: string | null;
  isMobile?: boolean;
}

export function RegisterForm({ onSwitchToLogin, onRegistrationSuccess, referralCode, isMobile = false }: RegisterFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { toast } = useToast();
  const { getRecaptchaToken, isAvailable: isRecaptchaAvailable } = useRecaptcha();

  const { register, handleSubmit, formState: { errors }, setValue } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      referralCode: referralCode || ''
    }
  });

  // Update referralCode field when prop changes (only if not manually modified)
  useEffect(() => {
    if (referralCode) {
      setValue('referralCode', referralCode);
    }
  }, [referralCode, setValue]);

  const verifyRecaptcha = async (): Promise<string | null> => {
    if (!isRecaptchaAvailable) {
      console.warn('reCAPTCHA not available, proceeding without verification');
      return null; // Allow registration without reCAPTCHA if not available
    }

    try {
      const token = await getRecaptchaToken('register');
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

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true);
    setError(null);

    // Client-side validation feedback
    if (!data.name || !data.email || !data.password || !data.confirmPassword) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      setIsLoading(false);
      return;
    }

    if (data.password !== data.confirmPassword) {
      toast({
        title: "Password Mismatch",
        description: "Passwords do not match. Please check and try again.",
        variant: "destructive"
      });
      setIsLoading(false);
      return;
    }

    // Show loading toast
    const loadingToast = toast({
      title: "Creating your account...",
      description: "Please wait while we set up your account.",
      variant: "default"
    });

    try {
      // Get reCAPTCHA token (will be null if not available)
      const recaptchaToken = await verifyRecaptcha();

      const result = await AuthService.register({
        name: data.name,
        email: data.email,
        password: data.password,
        confirmPassword: data.confirmPassword,
        recaptchaToken: recaptchaToken || undefined,
        referralCode: data.referralCode || referralCode || undefined,
      });
      
      // Dismiss loading toast
      loadingToast.dismiss();
      
      // Show success toast
      toast({
        title: "Account Created Successfully!",
        description: "Please check your email for a verification code.",
        variant: "default"
      });
      
      // Registration successful - proceed to OTP verification
      onRegistrationSuccess(data.email, result.token);
    } catch (err: any) {
      // Dismiss loading toast
      loadingToast.dismiss();
      
      // Extract the actual error message from the API response
      let errorMessage = 'Registration failed. Please try again.';
      
      // Handle ApiError from our client
      if (err && typeof err === 'object' && err.message) {
        errorMessage = err.message;
      }
      // Handle axios error response format
      else if (err?.response?.data?.message) {
        errorMessage = err.response.data.message;
      }
      // Handle string errors
      else if (typeof err === 'string') {
        errorMessage = err;
      }
      // Handle standard Error objects
      else if (err instanceof Error) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      
      // Show error toast with the actual backend message
      toast({
        title: "Registration Failed",
        description: errorMessage,
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
      console.log('RegisterForm: Attempting Google Sign In');
      
      const result = await signIn('google', {
        callbackUrl: '/',
        redirect: true,
      });

      // If there's an error and no redirect happened
      if (result?.error) {
        console.error('RegisterForm: Google Sign In error:', result.error);
        setError('Failed to sign in with Google. Please try again.');
        setIsLoading(false);
      }
    } catch (error) {
      console.error('RegisterForm: Google Sign In exception:', error);
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
            <CardTitle className={`text-2xl ${isMobile ? 'text-white' : ''}`}>Create Account</CardTitle>
            <p className={`${isMobile ? 'text-purple-200' : 'text-muted-foreground'}`}>Sign up to start your Hedera journey</p>
          </CardHeader>
      
      <CardContent className={`${isMobile ? 'p-6 pt-2' : ''}`}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div className="space-y-2">
            <Label htmlFor="name" className={`${isMobile ? 'text-white' : ''}`}>Full Name</Label>
            <div className="relative">
              <UserIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="name"
                type="text"
                placeholder="Enter your full name"
                className="pl-10"
                {...register('name')}
              />
            </div>
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

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
                placeholder="Create a password"
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

          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className={`${isMobile ? 'text-white' : ''}`}>Confirm Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="Confirm your password"
                className="pl-10 pr-10"
                {...register('confirmPassword')}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="referralCode" className={`${isMobile ? 'text-white' : ''}`}>
              Referral Code <span className="text-sm text-muted-foreground">(Optional)</span>
            </Label>
            <div className="relative">
              <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="referralCode"
                type="text"
                placeholder="Enter referral code (optional)"
                className={`pl-10 ${referralCode ? 'pr-24' : ''} ${referralCode ? 'border-green-500/50 bg-green-50/50' : ''}`}
                {...register('referralCode')}
              />
              {/* {referralCode && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <Badge variant="secondary" className="text-xs bg-green-100 text-green-700 border-green-300">
                    Auto-filled
                  </Badge>
                </div>
              )} */}
            </div>
            {errors.referralCode && (
              <p className="text-sm text-destructive">{errors.referralCode.message}</p>
            )}
            {referralCode ? (
              <p className="text-xs text-green-600">
                ✓ Referral code automatically applied from your invitation link.
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">
                Have a referral code? Enter it here.
              </p>
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
            {isLoading ? 'Creating Account...' : 'Create Account'}
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

        <div className="mt-6 text-center">
          <p className="text-sm text-muted-foreground">
            Already have an account?{' '}
            <button
              onClick={onSwitchToLogin}
              className="text-primary hover:underline font-medium"
            >
              Sign in here
            </button>
          </p>
        </div>
      </CardContent>
    </Card>
      </HydrationSafe>
    </ErrorBoundary>
  );
}