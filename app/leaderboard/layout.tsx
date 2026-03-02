import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Leaderboard - Hedera Quest Machine',
  description: 'Check out the top performers on the Hedera Quest Machine leaderboard. See who\'s leading in completing blockchain challenges and earning the most rewards.',
  keywords: [
    'Hedera leaderboard',
    'quest rankings',
    'blockchain competition',
    'top performers',
    'quest champions',
    'Hedera rewards',
    'DLT leaderboard',
    'Web3 competition'
  ],
  openGraph: {
    title: 'Leaderboard - Hedera Quest Machine',
    description: 'Check out the top performers on the Hedera Quest Machine leaderboard. See who\'s leading in blockchain challenges.',
    url: 'https://quest.hederahacks.com/leaderboard',
    images: [
      {
        url: '/og-leaderboard.jpg',
        width: 1200,
        height: 630,
        alt: 'Hedera Quest Machine - Leaderboard',
      }
    ],
  },
  twitter: {
    title: 'Leaderboard - Hedera Quest Machine',
    description: 'Check out the top performers on the Hedera Quest Machine leaderboard. See who\'s leading in blockchain challenges.',
    images: ['/twitter-leaderboard.jpg'],
  },
};

export default function LeaderboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
