'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { pageview } from './google-analytics';

export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    const search = searchParams ? searchParams.toString() : '';
    const url = pathname + (search ? `?${search}` : '');
    const hasConsent = localStorage.getItem('analytics-consent') === 'true';
    
    if (hasConsent && process.env.NEXT_PUBLIC_GA_ID) {
      pageview(url);
    }
  }, [pathname, searchParams]);

  return <>{children}</>;
}
