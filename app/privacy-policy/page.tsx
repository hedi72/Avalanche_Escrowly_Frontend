import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'Learn how Hedera Quest Machine collects, uses, and protects your personal information.',
};

export default function PrivacyPolicyPage() {
  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8">Privacy Policy</h1>
      
      <div className="prose prose-gray dark:prose-invert max-w-none space-y-6">
        <section>
          <h2 className="text-2xl font-semibold mb-4">Information We Collect</h2>
          <p className="text-muted-foreground mb-4">
            We collect information you provide directly to us, such as when you create an account, 
            participate in quests, or contact us for support.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">Cookies and Analytics</h2>
          <p className="text-muted-foreground mb-4">
            We use Google Analytics to understand how visitors interact with our website. This helps us 
            improve our service and user experience.
          </p>
          
          <h3 className="text-xl font-semibold mb-2">Analytics Cookies</h3>
          <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
            <li>
              <strong>Google Analytics:</strong> We use Google Analytics to collect information about 
              how you use our website. This includes pages visited, time spent on pages, and general 
              location information (country/city level).
            </li>
            {/* <li>
              <strong>Data Retention:</strong> Analytics data is retained for 26 months.
            </li> */}
            <li>
              <strong>Data Sharing:</strong> Analytics data is processed by Google according to their 
              privacy policy.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">Your Cookie Choices</h2>
          <p className="text-muted-foreground mb-4">
            You can control cookie settings through your browser or by updating your preferences 
            in our cookie consent banner. Essential cookies cannot be disabled as they are necessary 
            for the website to function properly.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">Security Protection</h2>
          <p className="text-muted-foreground mb-4">
            This site is protected by reCAPTCHA and the Google{' '}
            <a 
              href="https://policies.google.com/privacy" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-primary underline hover:no-underline"
            >
              Privacy Policy
            </a>{' '}
            and{' '}
            <a 
              href="https://policies.google.com/terms" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-primary underline hover:no-underline"
            >
              Terms of Service
            </a>{' '}
            apply.
          </p>
          <p className="text-muted-foreground mb-4">
            We use Google reCAPTCHA v3 to protect our forms from spam and abuse. reCAPTCHA collects 
            hardware and software information, such as device and application data, and sends this 
            data to Google for analysis. Your use of reCAPTCHA is subject to Google's Privacy Policy 
            and Terms of Service.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">Data Security</h2>
          <p className="text-muted-foreground mb-4">
            We implement appropriate security measures to protect your personal information against 
            unauthorized access, alteration, disclosure, or destruction.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">Contact Us</h2>
          <p className="text-muted-foreground">
            If you have any questions about this Privacy Policy, please contact us through our 
            support channels.
          </p>
        </section>

        <section className="text-sm text-muted-foreground">
          <p>Last updated: {new Date().toLocaleDateString()}</p>
        </section>
      </div>
    </div>
  );
}
