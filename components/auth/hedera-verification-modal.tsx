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
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { AlertCircle, Shield } from 'lucide-react';

interface HederaVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNeverShowAgain: () => void;
}

export function HederaVerificationModal({ isOpen, onClose, onNeverShowAgain }: HederaVerificationModalProps) {
  const router = useRouter();
  const [neverShowAgain, setNeverShowAgain] = useState(false);

  const handleCompleteVerification = () => {
    if (neverShowAgain) {
      onNeverShowAgain();
    } else {
      onClose();
    }
    router.push('/profile?tab=account');
  };

  const handleDoItLater = () => {
    if (neverShowAgain) {
      onNeverShowAgain();
    } else {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose} modal>
      <DialogContent className="sm:max-w-md font-mono border-2 border-dashed border-blue-500/30 bg-gradient-to-br from-blue-50/50 to-purple-50/50 dark:from-blue-950/20 dark:to-purple-950/20">
        <DialogHeader className="text-center space-y-4">
          <div className="mx-auto w-12 h-12 bg-blue-500/10 rounded-full flex items-center justify-center border border-dashed border-blue-500/30">
            <img
              src="/icon.png"
              alt="Hedera Logo"
              className="w-6 h-6"
            />
          </div>
          <DialogTitle className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            [HEDERA_IDTrust_VERIFICATION]
          </DialogTitle>

          <DialogDescription asChild>
            <div className="text-sm text-muted-foreground space-y-3">
              {/* <p>
                Complete your Hedera IDTrust verification to unlock all quest features and earn rewards.
              </p> */}
              <div className="p-3 border border-dashed border-yellow-500/30 bg-gradient-to-r from-yellow-500/5 to-orange-500/5 rounded-lg">
                <div className="flex items-center gap-2 text-yellow-600 dark:text-yellow-400 mb-2">
                  <AlertCircle className="w-4 h-4" />
                  <span className="font-semibold text-xs uppercase tracking-wider">
                    Action Required
                  </span>
                </div>
                <p className="text-xs">
                  Hedera IDTrust verification is mandatory for participating in quests and earning rewards. This ensures secure and trusted interactions within the ecosystem.
                </p>
              </div>
            </div>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center space-x-2 px-1">
            <Checkbox
              id="never-show-again"
              checked={neverShowAgain}
              onCheckedChange={(checked) => setNeverShowAgain(checked as boolean)}
              className="border-dashed border-blue-500/50 data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500"
            />
            <Label
              htmlFor="never-show-again"
              className="text-sm font-mono text-muted-foreground cursor-pointer hover:text-blue-600 transition-colors"
            >
              Never show this again
            </Label>
          </div>

          <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <Button
              variant="outline"
              onClick={handleDoItLater}
              className="font-mono border-dashed border-gray-500/50 hover:border-solid transition-all duration-200"
            >
              DO_IT_LATER
            </Button>
            <Button
              onClick={handleCompleteVerification}
              className="font-mono bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-200"
            >
              <Shield className="w-4 h-4 mr-2" />
              COMPLETE_VERIFICATION
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
