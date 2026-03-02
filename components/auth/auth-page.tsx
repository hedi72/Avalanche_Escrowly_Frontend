'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { LoginForm } from './login-form';
import { RegisterForm } from './register-form';
import { OtpVerification } from './otp-verification';
import { ForgotPasswordForm } from './forgot-password-form';
import { Trophy, Star, Users, Target } from 'lucide-react';
import { HydrationSafe } from '@/components/hydration-safe';
import ErrorBoundary from '@/components/error-boundary';

import { User } from '@/lib/types';

type AuthFlow = 'login' | 'register' | 'otp-verification' | 'forgot-password';

export function AuthPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [currentFlow, setCurrentFlow] = useState<AuthFlow>('login');
  const [registrationData, setRegistrationData] = useState<{
    email: string;
    token: string;
  } | null>(null);
  const [referralCode, setReferralCode] = useState<string | null>(null);

  // Initialize from URL parameters
  useEffect(() => {
    if (!searchParams) return;
    
    const flow = searchParams.get('flow');
    const ref = searchParams.get('ref');
    
    // Set referral code if present
    if (ref) {
      setReferralCode(ref);
    }
    
    // Set initial flow based on URL parameter
    if (flow === 'register' || flow === 'login' || flow === 'forgot-password') {
      setCurrentFlow(flow as AuthFlow);
    } else if (ref && !flow) {
      // If referral code is present but no specific flow, default to register
      setCurrentFlow('register');
    }
  }, [searchParams]);

  const updateUrl = (flow: AuthFlow, preserveRef: boolean = true) => {
    const params = new URLSearchParams();
    params.set('flow', flow);
    
    if (preserveRef && referralCode) {
      params.set('ref', referralCode);
    }
    
    router.replace(`?${params.toString()}`, { scroll: false });
  };

  const handleSwitchToLogin = () => {
    setCurrentFlow('login');
    setRegistrationData(null);
    updateUrl('login');
  };

  const handleSwitchToRegister = () => {
    setCurrentFlow('register');
    setRegistrationData(null);
    updateUrl('register');
  };

  const handleSwitchToForgotPassword = () => {
    setCurrentFlow('forgot-password');
    setRegistrationData(null);
    updateUrl('forgot-password', false); // Don't preserve ref for forgot password
  };

  const handleRegistrationSuccess = (email: string, token: string) => {
    setRegistrationData({ email, token });
    setCurrentFlow('otp-verification');
  };

  const renderAuthForm = (isMobile = false) => {
    const formProps = { isMobile };
    
    switch (currentFlow) {
      case 'login':
        return (
          <LoginForm 
            onSwitchToRegister={handleSwitchToRegister}
            onSwitchToForgotPassword={handleSwitchToForgotPassword}
            {...formProps} 
          />
        );
      case 'register':
        return (
          <RegisterForm 
            onSwitchToLogin={handleSwitchToLogin}
            onRegistrationSuccess={handleRegistrationSuccess}
            referralCode={referralCode}
            {...formProps}
          />
        );
      case 'forgot-password':
        return (
          <ForgotPasswordForm
            onBack={handleSwitchToLogin}
            {...formProps}
          />
        );
      case 'otp-verification':
        return registrationData ? (
          <OtpVerification
            email={registrationData.email}
            token={registrationData.token}
            onBack={handleSwitchToLogin}
            {...formProps}
          />
        ) : null;
      default:
        return (
          <LoginForm 
            onSwitchToRegister={handleSwitchToRegister}
            onSwitchToForgotPassword={handleSwitchToForgotPassword}
            {...formProps} 
          />
        );
    }
  };

  return (
    <ErrorBoundary>
      <HydrationSafe fallback={
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      }>
        <div className="relative min-h-screen bg-[#0b0d14] flex items-center justify-center p-4">
          {/* Pixel grid background */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-20"
            style={{
              backgroundImage:
                'linear-gradient(#111827 1px, transparent 1px), linear-gradient(90deg, #111827 1px, transparent 1px)'
              , backgroundSize: '12px 12px'
            }}
          />
      <div className="relative w-full max-w-6xl">
        {/* Mobile Layout - Auth Form First */}
        <div className="lg:hidden flex flex-col">
          {/* Auth Form - Full Width Mobile */}
          <div className="w-full">
            {renderAuthForm(true)}
          </div>
          
          {/* Branding - Mobile */}
          <div className="text-white space-y-6 text-center p-4 mt-8">
            <div className="space-y-4">
              <div className="flex items-center justify-center gap-3">
                <h1 className={`font-pixel text-3xl font-bold tracking-wider`}>Hedera Quest</h1>
              </div>
              <p className="text-lg text-purple-200">
                Master the Hedera ecosystem through gamified learning
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-black/30 border-2 border-cyan-400 rounded-none p-4 text-center shadow-[4px_4px_0_0_rgba(0,0,0,0.6)]">
                <Users className="w-6 h-6 text-cyan-400 mx-auto mb-2" />
                <h3 className={`font-pixel text-sm mb-1`}>Join Community</h3>
                <p className="text-xs text-purple-200">
                  Connect with developers
                </p>
              </div>
              
              <div className="bg-black/30 border-2 border-green-400 rounded-none p-4 text-center shadow-[4px_4px_0_0_rgba(0,0,0,0.6)]">
                <Target className="w-6 h-6 text-green-400 mx-auto mb-2" />
                <h3 className={`font-pixel text-sm mb-1`}>Complete Quests</h3>
                <p className="text-xs text-purple-200">
                  Learn by doing
                </p>
              </div>
              
              <div className="bg-black/30 border-2 border-yellow-400 rounded-none p-4 text-center shadow-[4px_4px_0_0_rgba(0,0,0,0.6)]">
                <Star className="w-6 h-6 text-yellow-400 mx-auto mb-2" />
                <h3 className={`font-pixel text-sm mb-1`}>Earn Rewards</h3>
                <p className="text-xs text-purple-200">
                  Collect badges
                </p>
              </div>
              
              <div className="bg-black/30 border-2 border-purple-400 rounded-none p-4 text-center shadow-[4px_4px_0_0_rgba(0,0,0,0.6)]">
                <Trophy className="w-6 h-6 text-purple-400 mx-auto mb-2" />
                <h3 className={`font-pixel text-sm mb-1`}>Level Up</h3>
                <p className="text-xs text-purple-200">
                  Track progress
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Desktop Layout - Side by Side */}
        <div className="hidden lg:grid grid-cols-2 gap-8 items-center">
          {/* Left Side - Branding */}
          <div className="text-white space-y-8 text-left">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <h1 className={`font-pixel text-4xl font-bold tracking-wider`}>Hedera Quest</h1>
              </div>
              <p className="text-xl text-purple-200">
                Master the Hedera ecosystem through gamified learning
              </p>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="bg-black/30 border-2 border-cyan-400 rounded-none p-6 text-center shadow-[4px_4px_0_0_rgba(0,0,0,0.6)]">
                <Users className="w-8 h-8 text-cyan-400 mx-auto mb-3" />
                <h3 className={`font-pixel mb-2`}>Join the Community</h3>
                <p className="text-sm text-purple-200">
                  Connect with developers and learners worldwide
                </p>
              </div>
              
              <div className="bg-black/30 border-2 border-green-400 rounded-none p-6 text-center shadow-[4px_4px_0_0_rgba(0,0,0,0.6)]">
                <Target className="w-8 h-8 text-green-400 mx-auto mb-3" />
                <h3 className={`font-pixel mb-2`}>Complete Quests</h3>
                <p className="text-sm text-purple-200">
                  Learn by doing with hands-on challenges
                </p>
              </div>
              
              <div className="bg-black/30 border-2 border-yellow-400 rounded-none p-6 text-center shadow-[4px_4px_0_0_rgba(0,0,0,0.6)]">
                <Star className="w-8 h-8 text-yellow-400 mx-auto mb-3" />
                <h3 className={`font-pixel mb-2`}>Earn Rewards</h3>
                <p className="text-sm text-purple-200">
                  Collect badges and climb the leaderboard
                </p>
              </div>
              
              <div className="bg-black/30 border-2 border-purple-400 rounded-none p-6 text-center shadow-[4px_4px_0_0_rgba(0,0,0,0.6)]">
                <Trophy className="w-8 h-8 text-purple-400 mx-auto mb-3" />
                <h3 className={`font-pixel mb-2`}>Level Up</h3>
                <p className="text-sm text-purple-200">
                  Track your progress and showcase skills
                </p>
              </div>
            </div>
          </div>

          {/* Right Side - Auth Form */}
          <div className="flex justify-end">
            {renderAuthForm(false)}
          </div>
        </div>
      </div>
    </div>
      </HydrationSafe>
    </ErrorBoundary>
  );
}