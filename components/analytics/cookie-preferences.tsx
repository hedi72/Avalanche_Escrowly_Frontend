'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { grantAnalyticsConsent, denyAnalyticsConsent } from '@/components/analytics';
import { Cookie } from 'lucide-react';

export function CookiePreferences() {
  const [analyticsEnabled, setAnalyticsEnabled] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);

  useEffect(() => {
    // Check current consent status
    const hasConsent = localStorage.getItem('analytics-consent') === 'true';
    setAnalyticsEnabled(hasConsent);
    setHasLoaded(true);
  }, []);

  const handleAnalyticsToggle = (enabled: boolean) => {
    setAnalyticsEnabled(enabled);
    
    if (enabled) {
      grantAnalyticsConsent();
    } else {
      denyAnalyticsConsent();
    }
  };

  if (!hasLoaded) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Cookie className="h-5 w-5" />
            <CardTitle>Cookie Preferences</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse">
            <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Cookie className="h-5 w-5" />
          <CardTitle>Cookie Preferences</CardTitle>
        </div>
        <CardDescription>
          Manage your cookie preferences. Changes will take effect immediately.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between space-x-2">
            <div className="space-y-1">
              <h4 className="text-sm font-medium">Essential Cookies</h4>
              <p className="text-xs text-muted-foreground">
                Required for the website to function properly. Cannot be disabled.
              </p>
            </div>
            <Switch checked={true} disabled />
          </div>
          
          <div className="flex items-center justify-between space-x-2">
            <div className="space-y-1">
              <h4 className="text-sm font-medium">Analytics Cookies</h4>
              <p className="text-xs text-muted-foreground">
                Help us understand how you use our website to improve your experience.
              </p>
            </div>
            <Switch 
              checked={analyticsEnabled} 
              onCheckedChange={handleAnalyticsToggle}
            />
          </div>
        </div>
        
        <div className="pt-4 border-t">
          <p className="text-xs text-muted-foreground">
            For more information about how we use cookies, please read our{' '}
            <a 
              href="/privacy-policy" 
              className="text-primary hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              Privacy Policy
            </a>.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
