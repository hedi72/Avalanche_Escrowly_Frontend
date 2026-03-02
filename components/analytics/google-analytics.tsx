'use client';

import { useEffect } from 'react';
import Script from 'next/script';

declare global {
  interface Window {
    gtag: (...args: any[]) => void;
    dataLayer: any[];
  }
}

interface GoogleAnalyticsProps {
  gtagId: string;
}

export function GoogleAnalytics({ gtagId }: GoogleAnalyticsProps) {
  useEffect(() => {
    // Check if user has consented to analytics cookies
    const hasConsent = localStorage.getItem('analytics-consent') === 'true';
    
    if (hasConsent && window.gtag) {
      window.gtag('consent', 'update', {
        analytics_storage: 'granted'
      });
    }
  }, []);

  return (
    <>
      <Script
        strategy="afterInteractive"
        src={`https://www.googletagmanager.com/gtag/js?id=${gtagId}`}
      />
      <Script
        id="google-analytics"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            
            // Default consent state - deny all
            gtag('consent', 'default', {
              'analytics_storage': 'denied',
              'ad_storage': 'denied',
              'ad_user_data': 'denied',
              'ad_personalization': 'denied',
            });
            
            gtag('config', '${gtagId}', {
              page_title: document.title,
              page_location: window.location.href,
            });
          `,
        }}
      />
    </>
  );
}

// Analytics helper functions
export const gtag = (...args: any[]) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag(...args);
  }
};

// Track page views
export const pageview = (url: string) => {
  gtag('config', process.env.NEXT_PUBLIC_GA_ID, {
    page_path: url,
  });
};

// Track events
export const event = (action: string, parameters?: any) => {
  gtag('event', action, parameters);
};

// Grant consent
export const grantAnalyticsConsent = () => {
  gtag('consent', 'update', {
    analytics_storage: 'granted'
  });
  localStorage.setItem('analytics-consent', 'true');
};

// Deny consent
export const denyAnalyticsConsent = () => {
  gtag('consent', 'update', {
    analytics_storage: 'denied'
  });
  localStorage.setItem('analytics-consent', 'false');
};
