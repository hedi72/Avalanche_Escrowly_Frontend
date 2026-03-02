'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DollarSign, Star, Eye, EyeOff, Minimize2, Maximize2, Lock, Settings, TrendingUp, Gift } from 'lucide-react';
import { cn } from '@/lib/utils';
import useStore from '@/lib/store';

interface BalanceWidgetProps {
  className?: string;
  conversionRate?: number;
  showClaimButton?: boolean;
  enableAnimations?: boolean;
}

interface WidgetConfig {
  isMinimized: boolean;
  showBalance: boolean;
}

const STORAGE_KEY = 'balance-widget-config';
const DEFAULT_CONVERSION_RATE = 0.01; // $0.001 per point

export function BalanceWidget({ 
  className, 
  conversionRate = DEFAULT_CONVERSION_RATE,
  showClaimButton = true,
  enableAnimations = true 
}: BalanceWidgetProps) {
  const { user, refreshUserProfile } = useStore();
  const router = useRouter();
  const [isMinimized, setIsMinimized] = useState(false);
  const [showBalance, setShowBalance] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
  // const [showSettings, setShowSettings] = useState(false);
  
 
  const [cachedBalance, setCachedBalance] = useState<number>(0);


  const currentPoints = user?.total_points ?? user?.points ?? 0;
  
  // Update cached balance only when we have a valid value
  useEffect(() => {
    if (currentPoints > 0 || (currentPoints === 0 && !cachedBalance)) {
      setCachedBalance(currentPoints);
    }
  }, [currentPoints]);
  
  // Use cached balance for display to prevent flashing
  const pointsBalance = cachedBalance;
  const dollarBalance = (pointsBalance * conversionRate).toFixed(2);
  const isPositiveBalance = pointsBalance > 0;

  // Debug logging
  console.log('BalanceWidget - User object:', user);
  console.log('BalanceWidget - Balance (total_points):', user?.total_points);
  console.log('BalanceWidget - Balance (points):', user?.points);
  console.log('BalanceWidget - Final balance used:', pointsBalance);

  // Load saved configuration
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const config = JSON.parse(saved);
          setIsMinimized(config.isMinimized || false);
          setShowBalance(config.showBalance !== false);
        }
      } catch (error) {
        console.warn('Failed to load balance widget config:', error);
      }
    }
  }, []);

  // Save configuration to localStorage
  const saveConfig = useCallback(() => {
    if (typeof window !== 'undefined') {
      try {
        const config = {
          isMinimized,
          showBalance
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
      } catch (error) {
        console.warn('Failed to save balance widget config:', error);
      }
    }
  }, [isMinimized, showBalance]);

  // Save config when state changes
  useEffect(() => {
    const timeoutId = setTimeout(saveConfig, 500); // Debounce saves
    return () => clearTimeout(timeoutId);
  }, [saveConfig]);

  // Throttle refresh calls to prevent overlapping requests
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshTime, setLastRefreshTime] = useState(0);
  
  const throttledRefresh = useCallback(async () => {
    const now = Date.now();
    const timeSinceLastRefresh = now - lastRefreshTime;
    
    // Prevent refresh if already refreshing or if less than 5 seconds since last refresh
    if (isRefreshing || timeSinceLastRefresh < 5000) {
      console.log('BalanceWidget - Skipping refresh (too soon or already refreshing)');
      return;
    }
    
    setIsRefreshing(true);
    setLastRefreshTime(now);
    
    try {
      await refreshUserProfile();
    } finally {
      setIsRefreshing(false);
    }
  }, [refreshUserProfile, isRefreshing, lastRefreshTime]);

  // Refresh user data on component mount (only once)
  useEffect(() => {
    if (user && !lastRefreshTime) {
      console.log('BalanceWidget - Initial refresh on mount');
      throttledRefresh();
    }
  }, [user?.id]);

  // Refresh user data when tab becomes visible (user returns to app)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && user) {
        console.log('BalanceWidget - Tab became visible, refreshing user data');
        throttledRefresh();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [user, throttledRefresh]);

  // Periodic refresh every 2 minutes when component is visible and user is logged in
  useEffect(() => {
    if (!user) return;

    const refreshInterval = setInterval(() => {
      if (!document.hidden) {
        console.log('BalanceWidget - Periodic refresh');
        throttledRefresh();
      }
    }, 120000); // 2 minutes

    return () => clearInterval(refreshInterval);
  }, [user, throttledRefresh]);



  // Enhanced toggle functions with animations
  const toggleMinimized = useCallback(() => {
    setIsMinimized(prev => !prev);
  }, []);

  const toggleBalance = useCallback(() => {
    setShowBalance(prev => !prev);
  }, []);

  // const toggleSettings = useCallback(() => {
  //   setShowSettings(prev => !prev);
  // }, []);

  // Navigate to rewards page
  const handleClaimClick = useCallback(() => {
    router.push('/rewards');
  }, [router]);

  // Don't show for admin users or if user is not logged in
  if (!user || user.role === 'admin') {
    return null;
  }

  return (
    <div
      className={cn(
        'fixed top-16 right-4 z-50 select-none group',
        'transition-all duration-300 ease-out',
        enableAnimations && 'animate-in fade-in slide-in-from-top-4',
        className
      )}
      style={{
        width: isMinimized ? 'auto' : '220px'
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      role="dialog"
      aria-label="Balance Widget"
      aria-live="polite"
    >
      <Card className={cn(
        'border-2 border-dashed transition-all duration-300',
        'backdrop-blur-md shadow-lg',
        isHovered ? 'shadow-2xl scale-[1.02]' : 'shadow-lg',
        isPositiveBalance 
          ? 'border-emerald-400/40 bg-gradient-to-br from-emerald-50/80 to-green-100/60 dark:from-emerald-950/40 dark:to-green-950/30'
          : 'border-slate-400/40 bg-gradient-to-br from-slate-50/80 to-slate-100/60 dark:from-slate-950/40 dark:to-slate-900/30'
      )}>
        <CardContent className="p-3 relative overflow-hidden">
          {/* Animated background gradient */}
          <div className={cn(
            'absolute inset-0 opacity-20 transition-opacity duration-500',
            isHovered && 'opacity-30',
            isPositiveBalance 
              ? 'bg-gradient-to-br from-emerald-400 via-green-400 to-teal-400'
              : 'bg-gradient-to-br from-slate-400 via-slate-500 to-slate-600'
          )} />
          
          {/* Content */}
          <div className="relative z-10">
            {isMinimized ? (
              // Enhanced Minimized view
              <div className="flex items-center gap-2 animate-in slide-in-from-left-2">
                <div className={cn(
                  'h-7 w-7 p-0 rounded-full transition-all duration-200 flex items-center justify-center',
                  'hover:scale-110 hover:bg-white/20'
                )}>
                  <DollarSign className={cn(
                    'w-4 h-4 transition-colors duration-200',
                    isPositiveBalance ? 'text-emerald-600' : 'text-slate-600'
                  )} />
                </div>
                
                <Badge className={cn(
                  'font-mono text-xs font-semibold transition-all duration-200',
                  'border backdrop-blur-sm',
                  isPositiveBalance 
                    ? 'bg-emerald-500/20 text-emerald-700 border-emerald-500/30 dark:text-emerald-300'
                    : 'bg-slate-500/20 text-slate-700 border-slate-500/30 dark:text-slate-300'
                )}>
                  {isPositiveBalance && <TrendingUp className="w-3 h-3 inline mr-1" />}
                  ${showBalance ? dollarBalance : '••••'}
                </Badge>
                
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0 rounded-full hover:scale-110 hover:bg-white/20 transition-all duration-200"
                  onClick={toggleMinimized}
                  aria-label="Expand widget"
                >
                  <Maximize2 className="w-3 h-3" />
                </Button>
              </div>
            ) : (
              // Enhanced Full view
              <div className="space-y-3 animate-in slide-in-from-right-2">
                {/* Enhanced Header with drag handle and controls */}
                <div className="flex items-center justify-between">
                  <div 
                    className={cn(
                      'flex items-center gap-2 flex-1 p-1 rounded-lg transition-all duration-200'
                    )}
                  >
                    <div className={cn(
                      'p-1.5 rounded-lg border border-dashed transition-all duration-200',
                      isPositiveBalance 
                        ? 'bg-emerald-500/20 border-emerald-400/40'
                        : 'bg-slate-500/20 border-slate-400/40'
                    )}>
                      <DollarSign className={cn(
                        'w-4 h-4 transition-colors duration-200',
                        isPositiveBalance ? 'text-emerald-600' : 'text-slate-600'
                      )} />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider">
                        Balance
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    {/* <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 rounded-full hover:scale-110 hover:bg-white/20 transition-all duration-200"
                      onClick={toggleSettings}
                      aria-label="Widget settings"
                    >
                      <Settings className="w-3 h-3" />
                    </Button> */}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 rounded-full hover:scale-110 hover:bg-white/20 transition-all duration-200"
                      onClick={toggleBalance}
                      aria-label={showBalance ? 'Hide balance' : 'Show balance'}
                    >
                      {showBalance ? (
                        <Eye className="w-3 h-3" />
                      ) : (
                        <EyeOff className="w-3 h-3" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 rounded-full hover:scale-110 hover:bg-white/20 transition-all duration-200"
                      onClick={toggleMinimized}
                      aria-label="Minimize widget"
                    >
                      <Minimize2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>

                {/* Enhanced Balance Display */}
                <div className="space-y-3">
                  {/* Main Balance */}
                  <div className="text-center">
                    <div className={cn(
                      'text-2xl font-bold font-mono transition-all duration-300',
                      'bg-gradient-to-r bg-clip-text text-transparent',
                      isPositiveBalance 
                        ? 'from-emerald-600 via-green-600 to-teal-600'
                        : 'from-slate-600 via-slate-700 to-slate-800',
                      isHovered && 'scale-105'
                    )}>
                      ${showBalance ? dollarBalance : '••••••'}
                    </div>
                    
                    {/* USD Label */}
                    <div className="flex items-center justify-center gap-1.5 mt-1">
                      <DollarSign className={cn(
                        'w-3 h-3 transition-colors duration-200',
                        isPositiveBalance ? 'text-emerald-500' : 'text-slate-500'
                      )} />
                      <span className={cn(
                        'font-mono text-xs font-medium transition-colors duration-200',
                        isPositiveBalance ? 'text-emerald-700 dark:text-emerald-300' : 'text-slate-600 dark:text-slate-400'
                      )}>
                        USD Balance
                      </span>
                    </div>
                  </div>

                  {/* Settings Panel */}
                  {/* {showSettings && (
                    <div className="space-y-2 p-2 bg-black/5 dark:bg-white/5 rounded-lg border border-dashed border-current/20 animate-in slide-in-from-top-2">
                      <div className="text-xs font-mono text-muted-foreground uppercase tracking-wider text-center">
                        Settings
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Conversion Rate:</span>
                        <span className="font-mono">${conversionRate.toFixed(4)}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Animations:</span>
                        <span className="font-mono">{enableAnimations ? 'ON' : 'OFF'}</span>
                      </div>
                    </div>
                  )} */}
                  
                  {/* Enhanced Claim Button */}
                  {showClaimButton && (
                    <Button 
                      onClick={handleClaimClick}
                      size="sm" 
                      className={cn(
                        'w-full h-8 text-xs font-mono transition-all duration-200',
                        'bg-gradient-to-r border border-dashed',
                        'hover:scale-[1.02] hover:shadow-md active:scale-[0.98]',
                        isPositiveBalance
                          ? 'from-emerald-500/20 to-green-500/20 hover:from-emerald-500/30 hover:to-green-500/30 border-emerald-500/40 text-emerald-800 dark:text-emerald-300'
                          : 'from-slate-500/20 to-slate-600/20 hover:from-slate-500/30 hover:to-slate-600/30 border-slate-500/40 text-slate-800 dark:text-slate-400'
                      )}
                    >
                      <Gift className="w-3 h-3 mr-1.5" />
                      CLAIM REWARDS
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default BalanceWidget;