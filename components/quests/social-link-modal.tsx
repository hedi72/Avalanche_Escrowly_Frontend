'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Twitter, 
  Facebook, 
  MessageSquare, 
  Instagram, 
  AlertCircle, 
  ExternalLink,
  LinkIcon, 
  Linkedin
} from 'lucide-react';
import { User } from '@/lib/types';

interface SocialLinkModalProps {
  user: User | null;
  platform: string;
  isOpen: boolean;
  onClose: () => void;
}

export function SocialLinkModal({ user, platform, isOpen, onClose }: SocialLinkModalProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const getSocialIcon = (platformType: string) => {
    switch (platformType?.toLowerCase()) {
      case 'twitter':
        return <Twitter className="w-6 h-6" />;
      case 'facebook':
        return <Facebook className="w-6 h-6" />;
      case 'discord':
        return <MessageSquare className="w-6 h-6" />;
      case 'linkedin':
        return <Linkedin className="w-6 h-6" />;
      default:
        return <LinkIcon className="w-6 h-6" />;
    }
  };

  const getSocialColor = (platformType: string) => {
    switch (platformType?.toLowerCase()) {
      case 'twitter':
        return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
      case 'facebook':
        return 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20';
      case 'discord':
        return 'bg-purple-500/10 text-purple-600 border-purple-500/20';
      case 'linkedin':
        return 'bg-blue-700/10 text-blue-700 border-blue-700/20';
      case 'instagram':
        return 'bg-pink-500/10 text-pink-600 border-pink-500/20';
      default:
        return 'bg-gray-500/10 text-gray-600 border-gray-500/20';
    }
  };

  const getPlatformDisplayName = (platformType: string) => {
    switch (platformType?.toLowerCase()) {
      case 'twitter':
        return 'Twitter';
      case 'facebook':
        return 'Facebook';
      case 'discord':
        return 'Discord';
      case 'linkedin':
        return 'LinkedIn';
      case 'instagram':
        return 'Instagram';
      default:
        return platformType;
    }
  };

  const isAccountLinked = (platformType: string) => {
    if (!user) return false;
    
    switch (platformType?.toLowerCase()) {
      case 'twitter':
        return !!user.twitterProfile;
      case 'facebook':
        return !!user.facebookProfile;
      case 'discord':
        return !!user.discordProfile;
      case 'linkedin':
        return !!user.linkedInProfile;
        
      default:
        return false;
    }
  };

  const handleLinkAccount = () => {
    setIsLoading(true);
    onClose();
    router.push(`/profile?tab=account&social=${platform.toLowerCase()}`);
  };

  const handleCancel = () => {
    onClose();
  };

  const linked = isAccountLinked(platform);
  const platformName = getPlatformDisplayName(platform);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className={`p-2 rounded-lg border ${getSocialColor(platform)}`}>
              {getSocialIcon(platform)}
            </div>
            Link {platformName} Account
          </DialogTitle>
          <DialogDescription className="text-base leading-relaxed pt-2">
            To participate in {platformName} quests, you need to link your {platformName} account first.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Once you link your {platformName} account, you'll be able to participate in all {platformName} quests and earn rewards!
            </AlertDescription>
          </Alert>

          <div className="mt-4 space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg border ${getSocialColor(platform)}`}>
                  {getSocialIcon(platform)}
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {platformName}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {linked ? 'Account linked' : 'Not linked'}
                  </p>
                </div>
              </div>
              <Badge variant={linked ? "default" : "secondary"}>
                {linked ? 'Connected' : 'Not Connected'}
              </Badge>
            </div>
          </div>
        </div>

        <DialogFooter className="flex gap-2 sm:gap-3">
          <Button 
            variant="outline" 
            onClick={handleCancel}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleLinkAccount}
            disabled={isLoading}
            className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            {isLoading ? 'Loading...' : `Link ${platformName}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
