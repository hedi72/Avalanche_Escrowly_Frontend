import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Rewards - Hedera Quest Machine',
  description: 'Claim your rewards from completing Hedera blockchain quests. Earn tokens, NFTs, badges, and other exclusive rewards for your achievements.',
  keywords: [
    'Hedera rewards',
    'quest rewards',
    'blockchain tokens',
    'NFT rewards',
    'quest badges',
    'Hedera tokens',
    'DLT rewards',
    'Web3 earnings',
    'crypto rewards'
  ],
  openGraph: {
    title: 'Rewards - Hedera Quest Machine',
    description: 'Claim your rewards from completing Hedera blockchain quests. Earn tokens, NFTs, badges, and other exclusive rewards.',
    url: 'https://quest.hederahacks.com/rewards',
    images: [
      {
        url: '/og-rewards.jpg',
        width: 1200,
        height: 630,
        alt: 'Hedera Quest Machine - Rewards',
      }
    ],
  },
  twitter: {
    title: 'Rewards - Hedera Quest Machine',
    description: 'Claim your rewards from completing Hedera blockchain quests. Earn tokens, NFTs, badges, and other exclusive rewards.',
    images: ['/twitter-rewards.jpg'],
  },
};

export default function RewardsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
