import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Explore Quests - Hedera Quest Machine',
  description: 'Discover and complete exciting Hedera blockchain quests. Learn about DLT technology, smart contracts, NFTs, and DeFi while earning rewards and climbing the leaderboard.',
  keywords: [
    'Hedera quests',
    'blockchain challenges',
    'DLT quests',
    'smart contract challenges',
    'NFT quests',
    'DeFi challenges',
    'Hedera learning',
    'crypto education',
    'Web3 quests',
    'blockchain rewards'
  ],
  openGraph: {
    title: 'Explore Quests - Hedera Quest Machine',
    description: 'Discover and complete exciting Hedera blockchain quests. Learn about DLT technology while earning rewards.',
    url: 'https://quest.hederahacks.com/quests',
    images: [
      {
        url: '/og-quests.jpg',
        width: 1200,
        height: 630,
        alt: 'Hedera Quest Machine - Explore Quests',
      }
    ],
  },
  twitter: {
    title: 'Explore Quests - Hedera Quest Machine',
    description: 'Discover and complete exciting Hedera blockchain quests. Learn about DLT technology while earning rewards.',
    images: ['/twitter-quests.jpg'],
  },
};

export default function QuestsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
