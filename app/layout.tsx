import './globals.css';
import { Inter } from 'next/font/google';
import { ThemeProvider } from '@/components/ui/theme-provider';
import { Suspense } from 'react';
// import { ClientProvider } from '@/components/providers/client-provider';
import { NextAuthProvider } from '@/components/providers/nextauth-provider';
import { RecaptchaProvider } from '@/components/providers/recaptcha-provider';
import { SessionSync } from '@/components/providers/session-sync';
import ErrorBoundary from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { AppContent } from '../components/app-content';
import { GoogleAnalytics, CookieConsent, AnalyticsProvider } from '@/components/analytics';
import type { Metadata } from 'next';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: {
    default: 'Hedera Quest Machine - Complete Challenges & Earn Rewards',
    template: '%s | Hedera Quest Machine'
  },
  description: 'Join the Hedera Quest Machine! Complete exciting blockchain challenges, learn about Hedera Hashgraph technology, earn rewards, and compete on the leaderboard. Start your Web3 journey today!',
  keywords: [
    'Hedera quests',
    'blockchain challenges',
    'Hedera Hashgraph',
    'Web3 learning',
    'crypto rewards',
    'DLT education',
    'blockchain gaming',
    'Hedera hackathon',
    'quest machine',
    'learn to earn',
    'Hedera network',
    'distributed ledger',
    'smart contracts',
    'NFT quests',
    'DeFi challenges'
  ],
  authors: [{ name: 'Hedera Hashgraph Association' }],
  creator: 'Hedera Hashgraph Association',
  publisher: 'Hedera Hashgraph Association',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://quest.hederahacks.com'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://quest.hederahacks.com',
    title: 'Hedera Quest Machine - Complete Challenges & Earn Rewards',
    description: 'Join the Hedera Quest Machine! Complete exciting blockchain challenges, learn about Hedera Hashgraph technology, earn rewards, and compete on the leaderboard.',
    siteName: 'Hedera Quest Machine',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Hedera Quest Machine - Learn, Complete, Earn',
      }
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Hedera Quest Machine - Complete Challenges & Earn Rewards',
    description: 'Join the Hedera Quest Machine! Complete exciting blockchain challenges, learn about Hedera Hashgraph technology, and earn rewards.',
    site: '@hedera',
    creator: '@hedera',
    images: ['/twitter-image.jpg'],
  },
  robots: {
    index: true,
    follow: true,
    nocache: true,
    googleBot: {
      index: true,
      follow: false,
      noimageindex: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon/favicon-96x96.png', sizes: '96x96', type: 'image/png' },
      { url: '/favicon/android-icon-192x192.png', sizes: '192x192', type: 'image/png' },
    ],
    shortcut: '/favicon/favicon.ico',
    apple: [
      { url: '/favicon/apple-icon-57x57.png', sizes: '57x57' },
      { url: '/favicon/apple-icon-60x60.png', sizes: '60x60' },
      { url: '/favicon/apple-icon-72x72.png', sizes: '72x72' },
      { url: '/favicon/apple-icon-76x76.png', sizes: '76x76' },
      { url: '/favicon/apple-icon-114x114.png', sizes: '114x114' },
      { url: '/favicon/apple-icon-120x120.png', sizes: '120x120' },
      { url: '/favicon/apple-icon-144x144.png', sizes: '144x144' },
      { url: '/favicon/apple-icon-152x152.png', sizes: '152x152' },
      { url: '/favicon/apple-icon-180x180.png', sizes: '180x180' },
    ],
    other: [
      {
        rel: 'apple-touch-icon-precomposed',
        url: '/favicon/apple-icon-precomposed.png',
      },
    ],
  },
  manifest: '/favicon/manifest.json',
  other: {
    'msapplication-TileColor': '#2b5797',
    'msapplication-TileImage': '/favicon/ms-icon-144x144.png',
    'msapplication-config': '/favicon/browserconfig.xml',
    'theme-color': '#000000',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        {/* Google Analytics */}
        {process.env.NEXT_PUBLIC_GA_ID && (
          <GoogleAnalytics gtagId={process.env.NEXT_PUBLIC_GA_ID} />
        )}
        
        <ThemeProvider defaultTheme="system" attribute="class" enableSystem disableTransitionOnChange>
          <RecaptchaProvider>
            <NextAuthProvider>
              <SessionSync />
              <ErrorBoundary>
                {/* <ClientProvider> */}
                  <Suspense fallback={
                    <div className="flex flex-col items-center justify-center min-h-screen">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                  }>
                    <AnalyticsProvider>
                      <AppContent>
                        {children}
                      </AppContent>
                    </AnalyticsProvider>
                  </Suspense>
                {/* </ClientProvider> */}
              </ErrorBoundary>
            </NextAuthProvider>
          </RecaptchaProvider>
          <Toaster />
          
          {/* Cookie Consent Banner */}
          <CookieConsent />
        </ThemeProvider>
      </body>
    </html>
  );
}