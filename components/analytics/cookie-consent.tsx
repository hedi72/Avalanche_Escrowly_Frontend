'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { grantAnalyticsConsent, denyAnalyticsConsent } from './google-analytics';
import { X, Cookie, Shield, BarChart3 } from 'lucide-react';

export function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    // Check if user has already made a choice
    const hasConsent = localStorage.getItem('analytics-consent');
    const hasDeclined = localStorage.getItem('analytics-consent') === 'false';
    
    // Show banner if no choice has been made
    if (hasConsent === null) {
      setShowBanner(true);
    }
  }, []);

  const handleAcceptAll = () => {
    grantAnalyticsConsent();
    setShowBanner(false);
  };

//   const handleDeclineAll = () => {
//     denyAnalyticsConsent();
//     setShowBanner(false);
//   };

  const handleAcceptNecessary = () => {
    // Only accept necessary cookies, decline analytics
    denyAnalyticsConsent();
    setShowBanner(false);
  };

  if (!showBanner) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-end justify-center p-4">
      <Card className="w-full max-w-2xl bg-background border-border shadow-lg">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Cookie className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Cookie Settings</CardTitle>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowBanner(false)}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            We use cookies to enhance your experience and analyze our website traffic. 
            You can choose which cookies to accept below. For more information, please read our{' '}
            <a 
              href="/privacy-policy" 
              className="text-primary hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              Privacy Policy
            </a>.
          </p>

          {!showDetails ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Shield className="h-4 w-4 text-green-600" />
                  <div>
                    <p className="font-medium text-sm">Essential Cookies</p>
                    <p className="text-xs text-muted-foreground">Required for basic functionality</p>
                  </div>
                </div>
                <Badge variant="secondary" className="text-xs">Always Active</Badge>
              </div>

              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <BarChart3 className="h-4 w-4 text-blue-600" />
                  <div>
                    <p className="font-medium text-sm">Analytics Cookies</p>
                    <p className="text-xs text-muted-foreground">Help us understand how you use our site</p>
                  </div>
                </div>
                <Badge variant="outline" className="text-xs">Optional</Badge>
              </div>

              <Button
                variant="link"
                className="text-xs h-auto p-0"
                onClick={() => setShowDetails(true)}
              >
                Show detailed information
              </Button>
            </div>
          ) : (
            <div className="space-y-4 text-xs">
              <div className="space-y-2">
                <h4 className="font-semibold">Essential Cookies</h4>
                <p className="text-muted-foreground">
                  These cookies are necessary for the website to function and cannot be switched off. 
                  They are usually only set in response to actions made by you which amount to a request for services.
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-semibold">Analytics Cookies (Google Analytics)</h4>
                <p className="text-muted-foreground">
                  These cookies allow us to count visits and traffic sources so we can measure and improve 
                  the performance of our site. They help us know which pages are the most and least popular 
                  and see how visitors move around the site. All information these cookies collect is aggregated 
                  and therefore anonymous.
                </p>
                {/* <p className="text-muted-foreground">
                  <strong>Data collected:</strong> Page views, user interactions, device information, location (country/city level)
                </p>
                <p className="text-muted-foreground">
                  <strong>Retention:</strong> 26 months
                </p> */}
              </div>

              <Button
                variant="link"
                className="text-xs h-auto p-0"
                onClick={() => setShowDetails(false)}
              >
                Show less
              </Button>
            </div>
          )}
        </CardContent>

        <CardFooter className="flex flex-col sm:flex-row gap-2 pt-4">
          <Button
            onClick={handleAcceptAll}
            className="w-full sm:w-auto"
            size="sm"
          >
            Accept All Cookies
          </Button>
          <Button
            onClick={handleAcceptNecessary}
            variant="outline"
            className="w-full sm:w-auto"
            size="sm"
          >
            Accept Only Necessary
          </Button>
          {/* <Button
            onClick={handleDeclineAll}
            variant="ghost"
            className="w-full sm:w-auto"
            size="sm"
          >
            Decline All
          </Button> */}
        </CardFooter>
      </Card>
    </div>
  );
}
