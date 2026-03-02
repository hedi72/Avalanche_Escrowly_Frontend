'use client';

import { useCallback } from 'react';
import { event } from '@/components/analytics';

export function useAnalytics() {
  const trackEvent = useCallback((action: string, parameters?: {
    event_category?: string;
    event_label?: string;
    value?: number;
    [key: string]: any;
  }) => {
    // Only track if user has consented to analytics
    const hasConsent = localStorage.getItem('analytics-consent') === 'true';
    
    if (hasConsent) {
      event(action, parameters);
    }
  }, []);

  const trackQuestStart = useCallback((questId: string, questTitle: string) => {
    trackEvent('quest_start', {
      event_category: 'quest',
      event_label: questTitle,
      quest_id: questId,
    });
  }, [trackEvent]);

  const trackQuestComplete = useCallback((questId: string, questTitle: string) => {
    trackEvent('quest_complete', {
      event_category: 'quest',
      event_label: questTitle,
      quest_id: questId,
    });
  }, [trackEvent]);

  const trackUserRegistration = useCallback((method: string) => {
    trackEvent('sign_up', {
      method: method,
    });
  }, [trackEvent]);

  const trackUserLogin = useCallback((method: string) => {
    trackEvent('login', {
      method: method,
    });
  }, [trackEvent]);

  const trackRewardClaim = useCallback((rewardType: string, value?: number) => {
    trackEvent('reward_claim', {
      event_category: 'reward',
      event_label: rewardType,
      value: value,
    });
  }, [trackEvent]);

  const trackLeaderboardView = useCallback(() => {
    trackEvent('leaderboard_view', {
      event_category: 'engagement',
    });
  }, [trackEvent]);

  const trackSocialShare = useCallback((platform: string, content: string) => {
    trackEvent('share', {
      method: platform,
      content_type: content,
    });
  }, [trackEvent]);

  return {
    trackEvent,
    trackQuestStart,
    trackQuestComplete,
    trackUserRegistration,
    trackUserLogin,
    trackRewardClaim,
    trackLeaderboardView,
    trackSocialShare,
  };
}
