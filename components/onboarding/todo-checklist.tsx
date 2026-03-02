'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle, Circle, Mail, Users, Shield, ArrowRight, ExternalLink, Trophy } from 'lucide-react';
import { User } from '@/lib/types';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface TodoChecklistProps {
  user: User;
}

interface TodoStep {
  id: string;
  title: string;
  description: string;
  icon: any;
  isCompleted: boolean;
  progress?: string;
  actionLink?: string;
  actionText?: string;
  reward?: string;
}

export function TodoChecklist({ user }: TodoChecklistProps) {
  // Calculate social media links progress
  const socialProfiles = [
    user.facebookProfile,
    user.twitterProfile,
    user.discordProfile,
    user.linkedInProfile
  ];
  const linkedSocials = socialProfiles.filter(profile => profile !== null).length;
  const socialProgress = `${linkedSocials}/4`;
  const socialsCompleted = linkedSocials > 0;

  // Check IDTrust verification status
  const idTrustCompleted = user.hederaProfile != null && user.hederaProfile?.verified;

  const steps: TodoStep[] = [
    {
      id: 'email',
      title: 'Verify Email',
      description: 'Confirm your email address to secure your account',
      icon: Mail,
      isCompleted: user.email_verified === true,
      actionLink: '/profile?tab=account',
      actionText: 'View Profile'
    },
    {
      id: 'socials',
      title: 'Link Social Accounts',
      description: 'Connect your social media profiles for enhanced features',
      icon: Users,
      isCompleted: socialsCompleted,
      progress: socialProgress,
      actionLink: '/profile?tab=account',
      actionText: 'Connect Socials'
    },
    {
      id: 'idtrust',
      title: 'IDTrust Verification',
      description: 'Complete identity verification for full platform access',
      icon: Shield,
      isCompleted: idTrustCompleted,
      actionLink: '/profile?tab=account',
      actionText: 'Start Verification',
      reward: '$2'
    }
  ];

  const completedSteps = steps.filter(step => step.isCompleted).length;
  const totalSteps = steps.length;
  const progressPercentage = (completedSteps / totalSteps) * 100;

  if (completedSteps === totalSteps) {
    return null; // Hide the component when all steps are completed
  }

  return (
    <Card className="border-2 border-dashed border-cyan-500/20 bg-gradient-to-br from-cyan-500/5 to-blue-500/5 hover:border-solid transition-all duration-200">
      <CardHeader className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 p-3 sm:p-4 lg:p-6">
        <CardTitle className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 font-mono">
          <div className="flex items-center gap-2">
            <div className="p-1 bg-cyan-500/20 rounded border border-dashed border-cyan-500/40">
              <CheckCircle className="w-4 h-4 text-cyan-500" />
            </div>
            <span className="text-sm sm:text-base">SETUP_PROGRESS</span>
          </div>
          <Badge variant="outline" className="font-mono text-xs self-start sm:self-auto">
            {completedSteps}/{totalSteps} COMPLETE
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 sm:space-y-4 p-3 sm:p-4 lg:p-6">
        <div className="space-y-2 sm:space-y-3">
          <div className="flex justify-between text-xs sm:text-sm font-mono mb-2">
            <span className="text-muted-foreground">COMPLETION_RATE</span>
            <span className="bg-gradient-to-r from-cyan-500 to-blue-500 bg-clip-text text-transparent font-bold">
              {Math.round(progressPercentage)}%
            </span>
          </div>
          <div className="w-full bg-muted rounded-full h-2 border border-dashed border-primary/20">
            <div 
              className="bg-gradient-to-r from-cyan-500 to-blue-500 h-2 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <div
                key={step.id}
                className={cn(
                  "relative p-3 sm:p-4 rounded-lg border-2 border-dashed transition-all duration-200 group",
                  step.isCompleted
                    ? "border-green-500/20 bg-green-500/5 hover:border-green-500/40"
                    : "border-muted-foreground/20 bg-muted/30 hover:border-primary/40"
                )}
              >
                <div className="flex items-start gap-2 sm:gap-3">
                  <div className={cn(
                    "flex-shrink-0 p-1.5 sm:p-2 rounded-full border border-dashed transition-all duration-200",
                    step.isCompleted
                      ? "border-green-500/40 bg-green-500/10 text-green-500"
                      : "border-muted-foreground/40 bg-muted text-muted-foreground"
                  )}>
                    {step.isCompleted ? (
                      <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                    ) : (
                      <Icon className="w-3 h-3 sm:w-4 sm:h-4" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-1">
                      <h4 className={cn(
                        "font-mono text-xs sm:text-sm font-semibold leading-tight",
                        step.isCompleted ? "text-green-500" : "text-foreground"
                      )}>
                        {step.title}
                      </h4>
                      {step.reward && (
                        <div className="flex ml-auto items-center text-xs sm:text-sm font-mono bg-gradient-to-r from-green-400/20 to-emerald-400/20 dark:from-green-500/30 dark:to-emerald-500/30 px-2 py-0.5 sm:py-1 rounded border-2 border-dashed border-green-500/40 dark:border-green-400/50 flex-shrink-0">
                          <Trophy className="w-3 h-3 sm:w-4 sm:h-4 mr-0.5 sm:mr-1 text-green-600 dark:text-green-400" />
                          <span className="text-green-700 dark:text-green-300 font-bold">{step.reward}</span>
                        </div>
                      )}
                      {step.progress && (
                        <Badge variant="secondary" className="font-mono text-xs self-start sm:self-auto w-fit">
                          {step.progress}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mb-2 sm:mb-3 line-clamp-2 leading-relaxed">
                      {step.description}
                    </p>
                    {!step.isCompleted && step.actionLink && (
                      <Link href={step.actionLink}>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs font-mono border-dashed hover:border-solid transition-all duration-200 group-hover:bg-primary/10 h-7 sm:h-8 px-2 sm:px-3"
                        >
                          {step.actionText}
                          <ExternalLink className="ml-1 h-2.5 w-2.5 sm:h-3 sm:w-3" />
                        </Button>
                      </Link>
                    )}
                    {step.isCompleted && (
                      <div className="text-xs font-mono text-green-500/80">
                        ✓ COMPLETED
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {completedSteps < totalSteps && (
          <div className="text-center pt-2">
            <p className="text-xs font-mono text-muted-foreground px-2">
              {'>'} Complete these steps to unlock all platform features
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
