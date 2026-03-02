'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession, signIn } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { Mail, ArrowLeft, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';
import Image from 'next/image';
import { HydrationSafe } from '@/components/hydration-safe';
import ErrorBoundary from '@/components/error-boundary';

interface OtpVerificationProps {
  email: string;
  token: string;
  onBack: () => void;
  onVerificationComplete?: () => void;
  isMobile?: boolean;
}

export function OtpVerification({ email, token, onBack, onVerificationComplete, isMobile = false }: OtpVerificationProps) {
  const [otp, setOtp] = useState<string[]>(new Array(6).fill(''));
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);
  const { toast } = useToast();
  const router = useRouter();
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Countdown timer for resend cooldown
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => {
        setResendCooldown(resendCooldown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const handleChange = (element: HTMLInputElement, index: number) => {
    if (isNaN(Number(element.value))) return;

    const newOtp = [...otp];
    newOtp[index] = element.value;
    setOtp(newOtp);

    // Move to next input if current field is filled
    if (element.value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Clear error when user starts typing
    if (error) setError(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    // Move to previous input on backspace if current input is empty
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    
    // Move to next input on Enter if current input is filled
    if (e.key === 'Enter' && otp[index] && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
    
    // Submit on Enter if all fields are filled
    if (e.key === 'Enter' && otp.every(digit => digit !== '')) {
      handleSubmit();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text');
    
    // Extract only numbers and take first 6 digits
    const digits = pastedData.replace(/\D/g, '').slice(0, 6);
    
    if (digits.length > 0) {
      const newOtp = new Array(6).fill('');
      for (let i = 0; i < digits.length && i < 6; i++) {
        newOtp[i] = digits[i];
      }
      setOtp(newOtp);
      
      // Focus the next empty field or the last filled field
      const nextIndex = Math.min(digits.length, 5);
      inputRefs.current[nextIndex]?.focus();
      
      // Clear error when user pastes
      if (error) setError(null);
    }
  };

  const handleSubmit = async () => {
    const otpCode = otp.join('');
    
    if (otpCode.length !== 6) {
      setError('Please enter all 6 digits');
      toast({
        title: "Incomplete OTP",
        description: "Please enter all 6 digits of your verification code.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // First verify the OTP
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "https://hedera-quests.com"}/profile/verify-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ token: otpCode })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Invalid verification code' }));
        throw new Error(errorData.message || 'Invalid verification code');
      }

      const result = await response.json();

      // Show success message
      toast({
        title: "Email Verified Successfully!",
        description: "Your account has been verified. Signing you in...",
        variant: "default"
      });

      // Call the verification complete callback if provided
      if (onVerificationComplete) {
        onVerificationComplete();
        return;
      }

      // Auto sign in the user with the token (for registration flow)
      const signInResult = await signIn('credentials', {
        email: email,
        password: '', // Not needed for post-registration flow
        token: token,
        isRegistration: 'true',
        redirect: false,
      });

      if (signInResult?.error) {
        throw new Error('Failed to sign in after verification');
      }

      // Small delay to show success message
      await new Promise(resolve => setTimeout(resolve, 1000));

  
      router.push('/');
      
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to verify code. Please try again.';
      setError(errorMessage);
      
      toast({
        title: "Verification Failed",
        description: errorMessage,
        variant: "destructive"
      });
      
      // Clear the OTP fields on error
      setOtp(new Array(6).fill(''));
      inputRefs.current[0]?.focus();
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendEmail = async () => {
    if (resendCooldown > 0) return;

    setIsResending(true);
    setError(null);

    try {
      const response = await fetch('https://hedera-quests.com/profile/verify-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to resend verification email' }));
        throw new Error(errorData.message || 'Failed to resend verification email');
      }

      toast({
        title: "Verification Email Sent",
        description: "A new verification code has been sent to your email.",
        variant: "default"
      });

      // Set cooldown to prevent spam
      setResendCooldown(60);
      
      // Clear existing OTP
      setOtp(new Array(6).fill(''));
      inputRefs.current[0]?.focus();

    } catch (err: any) {
      const errorMessage = err.message || 'Failed to resend verification email. Please try again.';
      setError(errorMessage);
      
      toast({
        title: "Resend Failed",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsResending(false);
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
            <CardTitle className={`text-2xl ${isMobile ? 'text-white' : ''}`}>Verify Your Email</CardTitle>
            <p className={`${isMobile ? 'text-purple-200' : 'text-muted-foreground'}`}>
              We've sent a 6-digit verification code to
            </p>
            <p className="text-sm font-medium text-primary">{email}</p>
          </CardHeader>

          <CardContent className={`space-y-6 ${isMobile ? 'p-6 pt-2' : ''}`}>
            {/* OTP Input */}
            <div className="space-y-4">
              <div className="flex justify-center gap-2">
                {otp.map((digit, index) => (
                  <Input
                    key={index}
                    ref={(el) => (inputRefs.current[index] = el)}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleChange(e.target, index)}
                    onKeyDown={(e) => handleKeyDown(e, index)}
                    onPaste={index === 0 ? handlePaste : undefined}
                    className="w-12 h-12 text-center text-lg font-semibold"
                    disabled={isLoading}
                  />
                ))}
              </div>
              
              <p className="text-xs text-muted-foreground text-center">
                Enter the 6-digit code from your email
              </p>
            </div>

            {/* Error Alert */}
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Verify Button */}
            <Button 
              onClick={handleSubmit}
              className="w-full" 
              disabled={isLoading || otp.some(digit => digit === '')}
            >
              {isLoading ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Verify Email
                </>
              )}
            </Button>

            {/* Resend Section */}
            <div className="text-center space-y-2">
              <p className="text-sm text-muted-foreground">
                Didn't receive the email?
              </p>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={handleResendEmail}
                disabled={isResending || resendCooldown > 0}
                className="text-primary hover:text-primary/80"
              >
                {isResending ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : resendCooldown > 0 ? (
                  <>
                    <Mail className="mr-2 h-4 w-4" />
                    Resend in {resendCooldown}s
                  </>
                ) : (
                  <>
                    <Mail className="mr-2 h-4 w-4" />
                    Resend verification email
                  </>
                )}
              </Button>
            </div>

            {/* Back Button */}
            <div className="pt-4 border-t">
              <Button
                variant="ghost"
                size="sm"
                onClick={onBack}
                className="w-full"
                disabled={isLoading}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to login
              </Button>
            </div>
          </CardContent>
        </Card>
      </HydrationSafe>
    </ErrorBoundary>
  );
}
