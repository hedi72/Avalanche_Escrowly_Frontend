'use client';

import { Suspense } from 'react';
import { ForgotPasswordForm } from '@/components/auth/forgot-password-form';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

export default function ForgotPasswordPage() {
  const router = useRouter();

  const handleBack = () => {
    router.push('/auth/login');
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
      
      <Suspense fallback={
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin mb-4" />
            <p className="text-muted-foreground">Loading...</p>
          </CardContent>
        </Card>
      }>
        <ForgotPasswordForm onBack={handleBack} />
      </Suspense>
    </div>
  );
}