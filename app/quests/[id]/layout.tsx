import type { Metadata } from 'next';

type Props = {
  params: { id: string };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  // In a real app, you would fetch the quest data here
  // const quest = await fetch(`/api/quests/${params.id}`).then(res => res.json());
  
  return {
    title: `Quest Details - Hedera Quest Machine`,
    description: `Complete this exciting Hedera blockchain quest to learn, earn rewards, and advance your Web3 skills. Start your blockchain journey today!`,
    keywords: [
      'Hedera quest',
      'blockchain challenge',
      'DLT quest',
      'smart contract',
      'NFT quest',
      'DeFi challenge',
      'Hedera learning',
      'crypto education',
      'Web3 quest'
    ],
    openGraph: {
      title: `Quest Details - Hedera Quest Machine`,
      description: `Complete this exciting Hedera blockchain quest to learn, earn rewards, and advance your Web3 skills.`,
      url: `https://quest.hederahacks.com/quests/${params.id}`,
      images: [
        {
          url: '/og-quest-detail.jpg',
          width: 1200,
          height: 630,
          alt: 'Hedera Quest Machine - Quest Details',
        }
      ],
    },
    twitter: {
      title: `Quest Details - Hedera Quest Machine`,
      description: `Complete this exciting Hedera blockchain quest to learn, earn rewards, and advance your Web3 skills.`,
      images: ['/twitter-quest-detail.jpg'],
    },
  };
}

export default function QuestDetailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
