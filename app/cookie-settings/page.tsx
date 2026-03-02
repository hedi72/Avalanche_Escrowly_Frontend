import { Metadata } from 'next';
import { CookiePreferences } from '@/components/analytics';

export const metadata: Metadata = {
  title: 'Cookie Settings',
  description: 'Manage your cookie preferences and privacy settings.',
};

export default function CookieSettingsPage() {
  return (
    <div className="container mx-auto py-8 px-4 max-w-2xl">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Cookie Settings</h1>
          <p className="text-muted-foreground mt-2">
            Manage your cookie preferences and control how we collect and use your data.
          </p>
        </div>
        
        <CookiePreferences />
      </div>
    </div>
  );
}
