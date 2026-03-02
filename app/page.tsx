'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { QuestService } from '@/lib/services';
import { UserQuestService } from '@/lib/user-quest-service';
import { usePaginatedQuests } from '@/hooks/use-paginated-quests';
import { DashboardStats, Quest, User, Badge as BadgeType, Submission } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {  ArrowRight, BookOpen, Users, Copy, Link as LinkIcon, Gift, CheckCircle } from 'lucide-react';
import { QuestCard } from '@/components/quests/quest-card';
import { QuestPagination } from '@/components/quests/quest-pagination';
import { FeaturedQuestsSection } from '@/components/quests/featured-quests-section';
import { TodoChecklist } from '@/components/onboarding/todo-checklist';
import { HeroCarousel } from '@/components/landing/hero-carousel';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import useStore from '@/lib/store';

export default function Dashboard() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { setUser } = useStore();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [featuredQuests, setFeaturedQuests] = useState<Quest[]>([]);
  const [badges, setBadges] = useState<BadgeType[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [copiedState, setCopiedState] = useState<'code' | 'link' | null>(null);

  // Use paginated quests hook for unstarted quests
  const unstartedQuests = usePaginatedQuests({
    initialPage: 1,
    itemsPerPage: 12,
    autoLoad: true, // Load immediately to get count for tab
    initialFilters: { status: 'unstarted' }
  });

  const user = currentUser || (session?.user?.userData as User | undefined);
  const isAuthenticated = !!session && !!user;

  const handleQuestSelect = (questId: string) => {
    router.push(`/quests/${questId}`);
  };

  // Handle copy referral code
  const handleCopyReferralCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedState('code');
      setTimeout(() => setCopiedState(null), 2000);
    } catch (error) {
      console.error('Failed to copy referral code:', error);
    }
  };

  // Handle copy referral link
  const handleCopyReferralLink = async (code: string) => {
    try {
      const referralLink = `${window.location.origin}/auth/register?ref=${code}`;
      await navigator.clipboard.writeText(referralLink);
      setCopiedState('link');
      setTimeout(() => setCopiedState(null), 2000);
    } catch (error) {
      console.error('Failed to copy referral link:', error);
    }
  };

  // Redirect admin users to admin dashboard (fallback protection)
  useEffect(() => {
    if (user?.role === 'admin') {
      console.log('Dashboard: Admin user detected, redirecting to /admin');
      router.replace('/admin');
      return;
    }
  }, [user?.role, router]);

  useEffect(() => {
    const loadData = async () => {
      try {
        console.log('Dashboard: Loading data, session status:', status, 'user:', user);

        // Skip loading data if user is admin (admin dashboard doesn't need this data)
        if (user?.role === 'admin') {
          return;
        }

        // Load basic data for both authenticated and non-authenticated users
        const token = session?.user?.token;
        
        // Fetch fresh user profile if authenticated
        if (session && token) {
          try {
            const userProfile = await QuestService.getCurrentUser(token);
            if (userProfile) {
              setCurrentUser(userProfile);
              // Update the store with fresh user data
              setUser(userProfile);
            }
          } catch (error) {
            console.error('Failed to fetch user profile:', error);
          }
        }
        
        // Only load admin dashboard stats if user is admin
        const shouldLoadAdminStats = (user as any)?.role === 'admin';
        
        const [statsData, featuredQuestsResponse, completionsData] = await Promise.all([
          shouldLoadAdminStats ? QuestService.getDashboardStats(token).catch(() => null) : Promise.resolve(null),
          UserQuestService.getFeaturedQuests(1, 12, token).catch(() => ({ success: false, quests: [], page: 1, limit: 6, numberOfPages: 0 })),
          QuestService.getQuestCompletions(token).catch(() => ({ quests: [] })) // Fallback if API fails
        ]);

        // Extract featured quests from the new paginated response
        const featuredQuestsData = featuredQuestsResponse.quests || [];

        // Create a map of quest completions for quick lookup
        const completionsMap = new Map();
        if (completionsData.quests) {
          completionsData.quests.forEach((quest: any) => {
            completionsMap.set(String(quest.id), quest.completions?.length || 0);
          });
        }

        // Enhance featured quests with real completion data
        const enhancedFeaturedQuests = featuredQuestsData.map(quest => ({
          ...quest,
          completions: completionsMap.get(String(quest.id)) || quest.completions || 0
        }));

        setStats(statsData);
        // Filter featured quests to only show active ones
        const now = new Date();

        // const activeFeaturedQuests = enhancedFeaturedQuests.filter(quest =>
        //   (quest.status === 'active' || quest.status === 'published') &&
        //   quest.user_status === 'unstarted' &&
        //   quest.endDate && new Date(quest.endDate) > now
        // );

        setFeaturedQuests(enhancedFeaturedQuests);


        // Only load user-specific data if user is authenticated
        if (user) {
          try {
            // Use appropriate API based on user role:
            // - Admin users: Use getSubmissions (admin endpoint) to see all submissions
            // - Regular users: Use getUserCompletions (user-specific endpoint) to see only their own completions
            const isAdmin = (user as any)?.role === 'admin';
            
            const [badgesData, submissionsData] = await Promise.all([
              QuestService.getUserBadges(String(user.id), token).catch(() => []),
              isAdmin 
                ? QuestService.getSubmissions(undefined, String(user.id), token).catch(() => [])
                : QuestService.getUserCompletions(token).catch(() => [])
            ]);
            setBadges(badgesData || []);
            setSubmissions(submissionsData || []);
          } catch (error) {
            console.error('Failed to load user data:', error);
            setBadges([]);
            setSubmissions([]);
          }
        }
      } catch (error) {
        console.error('Failed to load dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    // Only load data when session is loaded
    if (status !== 'loading') {
      loadData();
    }
  }, [router, status, session]);

  if (status === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Show loading spinner while redirecting admin users (fallback)
  if (user?.role === 'admin') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <p className="mt-4 text-sm text-muted-foreground font-mono">Redirecting to admin dashboard...</p>
      </div>
    );
  }

  // Debug logging
  console.log('Dashboard render - Session status:', status);
  console.log('Dashboard render - Current user from state:', currentUser);
  console.log('Dashboard render - Session user data:', session?.user?.userData);
  console.log('Dashboard render - Final user object:', user);
  console.log('Dashboard render - Is authenticated:', isAuthenticated);

  if (!isAuthenticated) {
    return (
      <div className="space-y-6 sm:space-y-8 lg:space-y-12">
        {/* Hero Carousel for Non-Authenticated Users */}
        <div className="w-full">
          <HeroCarousel />
        </div>
        
       
      </div>
    );
  }

  // Quest filtering logic for authenticated users
  const completedQuestIds = submissions
    .filter(s => s.status === 'approved')
    .map(s => s.questId);

  // No need for manual loading since autoLoad is now true

  // Update search when search term changes
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      unstartedQuests.updateFilters({ status: 'unstarted', search: searchTerm });
    }, 300); // Debounce search

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  const filteredQuests = unstartedQuests.quests.filter((quest: Quest) => {
    const matchesCategory = selectedCategory === 'all' || quest.category === selectedCategory;
    const matchesDifficulty = selectedDifficulty === 'all' || quest.difficulty === selectedDifficulty;
    
    return matchesCategory && matchesDifficulty;
  });


  return (
    <div className="space-y-4 sm:space-y-6 lg:space-y-8">
      {/* Hero Carousel for All Users */}
      <div className="w-full">
        <HeroCarousel />
      </div>
      
      {/* Personalized Welcome Section */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 via-cyan-500/10 to-blue-500/10 rounded-lg" />
        <div className="relative bg-background/80 backdrop-blur-sm border-2 border-dashed border-primary/20 rounded-lg p-3 sm:p-4 lg:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
            <div className="space-y-1 sm:space-y-2 flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-primary via-purple-500 to-cyan-500 bg-clip-text text-transparent font-mono leading-tight">
                  Welcome back, {(() => {
                    if (user?.firstName && user?.lastName) {
                      return `${user.firstName} ${user.lastName}`;
                    }
                    return user?.username || user?.name || '';
                  })()}!
                </h1>
              </div>
              {/* <p className="text-muted-foreground font-mono text-sm">
                {'>'} Continue your quest journey • Streak: {user?.streak || 0} days
              </p> */}
            </div>
            <div className="flex-shrink-0 text-center sm:text-right bg-gradient-to-br from-primary/5 to-cyan-500/5 p-3 sm:p-4 rounded-lg border border-dashed border-primary/20">
              <div className="text-xl sm:text-2xl lg:text-3xl font-bold font-mono bg-gradient-to-r from-yellow-500 to-orange-500 bg-clip-text text-transparent">
                ${((user?.total_points || user?.points || 0) * 0.01).toFixed(2)}
              </div>
              <div className="text-muted-foreground text-xs sm:text-sm font-mono">TOTAL_BALANCE</div>
            </div>
          </div>
        </div>
      </div>

      {/* Todo Checklist - Setup Progress */}
      <TodoChecklist user={user} />

      
      {/* Referral Program Section */}
      <Card className="border-2 border-dashed border-emerald-500/20 bg-gradient-to-br from-emerald-500/5 to-teal-500/5 hover:border-solid transition-all duration-200">
        <CardHeader className="bg-gradient-to-r from-emerald-500/10 to-teal-500/10 p-3 sm:p-4 lg:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-2 flex-1">
              <div className="p-2 bg-emerald-500/20 rounded-lg border border-dashed border-emerald-500/30">
                <Gift className="w-5 h-5 text-emerald-500" />
              </div>
              <div>
                <CardTitle className="font-mono text-base sm:text-lg lg:text-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-green-500 bg-clip-text text-transparent">
                  REFERRAL_REWARDS
                </CardTitle>
                <p className="text-muted-foreground font-mono text-xs sm:text-sm mt-0.5">
                  {'>'} Invite friends and earn $0.20 per referral (Referrals must complete DID verification to be counted)
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Button
                variant="outline"
                size="sm"
                onClick={() => user?.referral_code && handleCopyReferralCode(user.referral_code)}
                className="font-mono border-dashed border-emerald-500/30 hover:border-solid hover:bg-emerald-500/10 text-xs sm:text-sm"
              >
                {copiedState === 'code' ? (
                  <>
                    <CheckCircle className="h-3 w-3 mr-1 text-green-500" />
                    COPIED!
                  </>
                ) : (
                  <>
                    <Copy className="h-3 w-3 mr-1" />
                    Copy Code
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => user?.referral_code && handleCopyReferralLink(user.referral_code)}
                className="font-mono border-dashed border-teal-500/30 hover:border-solid hover:bg-teal-500/10 text-xs sm:text-sm"
              >
                {copiedState === 'link' ? (
                  <>
                    <CheckCircle className="h-3 w-3 mr-1 text-green-500" />
                    COPIED!
                  </>
                ) : (
                  <>
                    <LinkIcon className="h-3 w-3 mr-1" />
                    Copy Link
                  </>
                )}
              </Button>
              <Link href="/profile?tab=profile#social-referral">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="font-mono border-dashed border-emerald-500/30 hover:border-solid hover:bg-emerald-500/10 text-xs sm:text-sm"
                >
                  View Details
                  <ArrowRight className="ml-1 h-3 w-3" />
                </Button>
              </Link>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Featured Quests Section */}
      <div className="space-y-4 sm:space-y-6">
        <FeaturedQuestsSection
          quests={featuredQuests}
          completedQuestIds={completedQuestIds}
          onQuestSelect={(questId) => router.push(`/quests/${questId}`)}
        />
      </div>

      {/* All Quests Section */}
      <div className="space-y-4 sm:space-y-6">
        <Card className="border-2 border-dashed border-primary/20 bg-gradient-to-br from-primary/5 to-blue-500/5 hover:border-solid transition-all duration-200">
          <CardHeader className="bg-gradient-to-r from-primary/10 to-blue-500/10 p-3 sm:p-4 lg:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <CardTitle className="flex items-center gap-2 font-mono text-base sm:text-lg lg:text-xl">
                  <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                  ALL_QUESTS
                </CardTitle>
                <p className="text-muted-foreground font-mono text-xs sm:text-sm mt-1">
                  {'>'} Browse and discover new quests • {unstartedQuests.totalItems} available
                </p>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6">
            {/* Search Filter */}
            <div className="space-y-2">
              <label className="text-xs sm:text-sm font-mono text-muted-foreground uppercase tracking-wider">SEARCH</label>
              <div className="relative">
                {/* Show loading indicator while search is being processed */}
                {unstartedQuests.isLoading && searchTerm && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 z-10">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                  </div>
                )}
                <Input
                  placeholder="Search unstarted quests..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="font-mono border-dashed text-sm pr-10"
                />
              </div>
            </div>

            {/* Quest Grid */}
            {unstartedQuests.isLoading && unstartedQuests.quests.length === 0 ? (
              <div className="flex flex-col items-center justify-center min-h-[300px]">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                <p className="text-muted-foreground mt-2 text-sm">Loading quests...</p>
              </div>
            ) : (
              <>
                {filteredQuests.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
                    {filteredQuests.map((quest: Quest) => (
                      <QuestCard 
                        key={quest.id} 
                        quest={quest} 
                        isCompleted={completedQuestIds.includes(String(quest.id))}
                        onSelect={() => handleQuestSelect(String(quest.id))}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="p-6 sm:p-8 lg:p-12 text-center bg-gradient-to-br from-primary/5 to-purple-500/5 rounded-lg border border-dashed border-primary/20">
                    <div className="text-4xl sm:text-6xl mb-4">TARGET</div>
                    <h3 className="text-base sm:text-lg font-semibold mb-2 font-mono text-primary">NO_QUESTS_FOUND</h3>
                    <p className="text-muted-foreground font-mono text-xs sm:text-sm">
                      {'>'} Try adjusting your filters or check back later for new quests.
                    </p>
                  </div>
                )}

                {/* Pagination */}
                {unstartedQuests.totalPages > 1 && (
                  <div className="mt-4">
                    <QuestPagination
                      currentPage={unstartedQuests.currentPage}
                      totalPages={unstartedQuests.totalPages}
                      onPageChange={unstartedQuests.goToPage}
                      hasNextPage={unstartedQuests.hasNextPage}
                      hasPreviousPage={unstartedQuests.hasPreviousPage}
                      isLoading={unstartedQuests.isLoading}
                    />
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Progress Section - Call to Action */}
      <Card className="border-2 border-dashed border-primary/20 bg-gradient-to-br from-primary/5 to-purple-500/5 hover:border-solid transition-all duration-200">
        <CardContent className="p-6 sm:p-8 lg:p-12 text-center">
          {/* <div className="text-4xl sm:text-6xl mb-4">CHART</div> */}
          <h3 className="text-base sm:text-lg font-semibold mb-2 font-mono text-primary">TRACK_YOUR_PROGRESS</h3>
          <p className="text-muted-foreground font-mono text-xs sm:text-sm px-4 mb-4">
            {'>'} View detailed analytics, quest completions, and performance metrics.
          </p>
          <Link href="/progress">
            <Button size="lg" className="font-mono border-dashed hover:border-solid transition-all duration-200 group">
              View Full Progress 
              <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </CardContent>
      </Card>

    </div>
  );
}