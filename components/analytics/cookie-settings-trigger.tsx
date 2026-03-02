'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { CookieConsent } from './cookie-consent';

interface CookieSettingsTriggerProps {
  children?: React.ReactNode;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
}

export function CookieSettingsTrigger({ 
  children = 'Cookie Settings', 
  variant = 'ghost',
  size = 'sm',
  className 
}: CookieSettingsTriggerProps) {
  const [showConsent, setShowConsent] = useState(false);

  const handleOpenSettings = () => {
    // Clear the stored consent to force the banner to show
    localStorage.removeItem('analytics-consent');
    // Trigger a page reload to show the banner
    window.location.reload();
  };

  return (
    <>
      <Button
        variant={variant}
        size={size}
        className={className}
        onClick={handleOpenSettings}
      >
        {children}
      </Button>
    </>
  );
}
