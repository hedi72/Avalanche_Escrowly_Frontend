'use client';

import { Suspense } from 'react';
import { LoginForm } from '@/components/auth/login-form';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();

  const handleSwitchToRegister = () => {
    // Navigate to main auth page
    router.push('/');
  };

  const handleSwitchToForgotPassword = () => {
    // Navigate to forgot password page
    router.push('/auth/forgot-password');
  };

  return (
    <div className="relative min-h-screen bg-[#0b0d14] flex items-center justify-center p-4">
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
      
      <div className="relative w-full max-w-6xl">
        <Suspense fallback={
          <div className="flex items-center justify-center">
            <Card className="w-full max-w-md">
              <CardContent className="flex flex-col items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin mb-4" />
                <p className="text-muted-foreground">Loading...</p>
              </CardContent>
            </Card>
          </div>
        }>
          <div className="flex justify-center">
            <LoginForm 
              onSwitchToRegister={handleSwitchToRegister}
              onSwitchToForgotPassword={handleSwitchToForgotPassword}
            />
          </div>
        </Suspense>
      </div>
    </div>
  );
}