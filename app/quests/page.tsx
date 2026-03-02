'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Quest, FilterOptions, User } from '@/lib/types';
import { QuestService } from '@/lib/services';
import { usePaginatedQuests } from '@/hooks/use-paginated-quests';
import { QuestCard } from '@/components/quests/quest-card';
import { QuestFilters } from '@/components/quests/quest-filters';
import { QuestPagination } from '@/components/quests/quest-pagination';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Search, Filter, Grid, List, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSession } from 'next-auth/react';

export default function QuestsPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [user, setUser] = useState<User | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all');

  // Use separate pagination hooks for each tab - load all immediately for tab counts
  const allQuests = usePaginatedQuests({
    initialPage: 1,
    itemsPerPage: 12,
    autoLoad: true,
    initialFilters: {}
  });

  const availableQuests = usePaginatedQuests({
    initialPage: 1,
    itemsPerPage: 12,
    autoLoad: true, // Load immediately to get count
    initialFilters: {status: 'unstarted'} // No status filter for available - backend determines availability
  });

  const completedQuests = usePaginatedQuests({
    initialPage: 1,
    itemsPerPage: 12,
    autoLoad: true, // Load immediately to get count
    initialFilters: { status: 'validated' }
  });

  const pendingQuests = usePaginatedQuests({
    initialPage: 1,
    itemsPerPage: 12,
    autoLoad: true, // Load immediately to get count
    initialFilters: { status: 'pending' }
  });

  const rejectedQuests = usePaginatedQuests({
    initialPage: 1,
    itemsPerPage: 12,
    autoLoad: true, // Load immediately to get count
    initialFilters: { status: 'rejected' }
  });

  // Get current tab data
  const getCurrentTabData = () => {
    switch (activeTab) {
      case 'available':
        return availableQuests;
      case 'completed':
        return completedQuests;
      case 'pending':
        return pendingQuests;
      case 'rejected':
        return rejectedQuests;
      default:
        return allQuests;
    }
  };

  const currentTabData = getCurrentTabData();



  // Load user data separately
  useEffect(() => {
    const loadUserData = async () => {
      if (session?.user?.token) {
        try {
          const userData = await QuestService.getCurrentUser(session.user.token);
          setUser(userData);
        } catch (error) {
          console.error('Failed to load user data:', error);
          setUser(null);
        }
      }
    };

    loadUserData();
  }, [session?.user?.token]);

  // Handle tab changes - no need to load data since all tabs are auto-loaded
  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };

  // Handle search term changes - update current active tab
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      currentTabData.updateFilters({ search: searchTerm });
    }, 300); // Debounce search

    return () => clearTimeout(timeoutId);
  }, [searchTerm, activeTab]); // Update when search term or active tab changes


  const handleQuestSelect = (quest: Quest) => {
    router.push(`/quests/${quest.id}`);
  };

  // Helper functions for quest status (still needed for UI display)
  const now = new Date();

  const isExpired = (quest: Quest): boolean => {
    return !!quest.endDate && new Date(quest.endDate) < now;
  };

  const isQuestCompleted = (quest: Quest) => quest.user_status === "validated";
  const isQuestRejected = (quest: Quest) => quest.user_status === "rejected";
  const isQuestPending = (quest: Quest) => quest.user_status === "pending";

  // Only show full page loading on very first load of all quests
  if (allQuests.isLoading && allQuests.quests.length === 0 && activeTab === 'all') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <p className="text-muted-foreground mt-2 text-sm">Loading quests...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6 p-3 sm:p-4 lg:p-6">
      {/* Header */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-cyan-500/10 rounded-lg" />
        <div className="relative bg-background/80 backdrop-blur-sm border-2 border-dashed border-primary/20 rounded-lg p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
            <div className="min-w-0 flex-1">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-primary via-blue-500 to-cyan-500 bg-clip-text text-transparent">
                Discover Quests
              </h1>
              <p className="text-muted-foreground font-mono text-xs sm:text-sm">
                {'>'} Explore {currentTabData.totalItems} quests to master the Hedera ecosystem
              </p>
            </div>
        
            {/* <div className="flex items-center gap-2 flex-shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className="gap-2 border-2 border-dashed hover:border-solid transition-all duration-200 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)] font-mono text-xs sm:text-sm"
              >
                <Filter className="w-4 h-4" />
                <span className="hidden sm:inline">{showFilters ? '[Hide]' : '[Show]'} Filters</span>
                <span className="sm:hidden">{showFilters ? 'Hide' : 'Filter'}</span>
              </Button>
              
              <div className="flex border-2 border-dashed border-muted rounded-lg overflow-hidden">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className={cn(
                    "rounded-none border-r border-dashed font-mono",
                    viewMode === 'grid' && "shadow-[inset_2px_2px_0px_0px_rgba(0,0,0,0.1)]"
                  )}
                >
                  <Grid className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className={cn(
                    "rounded-none font-mono",
                    viewMode === 'list' && "shadow-[inset_2px_2px_0px_0px_rgba(0,0,0,0.1)]"
                  )}
                >
                  <List className="w-4 h-4" />
                </Button>
              </div>
            </div> */}
          </div>
        </div>
      </div>

      {/* Quick Search */}
      <div className="relative w-full sm:max-w-md lg:max-w-lg">
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 to-blue-500/5 rounded-lg" />
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground z-50" />
          {/* Show loading indicator while search is being processed */}
          {currentTabData.isLoading && searchTerm && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
            </div>
          )}
         <Input
  placeholder="> Type to search quests..."
  className="pl-10 pr-10 border-2 border-dashed hover:border-solid transition-all duration-200 font-mono bg-background/50 backdrop-blur-sm w-full"
  value={searchTerm}
  onChange={(e) => setSearchTerm(e.target.value)}
  onKeyDown={(e) => {
    if (e.key === "Enter") {
      e.preventDefault(); 
    }
  }}
/>

        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 md:gap-6 relative">
        {/* Mobile Overlay for Filters */}
        {showFilters && (
          <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setShowFilters(false)} />
        )}
        
        {/* Sidebar Filters */}
        {showFilters && (
          <div className={cn(
            "bg-background border rounded-lg p-4",
            // Mobile: fixed overlay
            "fixed top-4 left-4 right-4 bottom-4 z-50 overflow-y-auto md:static md:inset-auto md:z-auto md:overflow-visible",
            // Desktop: normal sidebar
            "md:w-80 md:flex-shrink-0"
          )}>
            {/* Mobile close button */}
            <div className="flex justify-between items-center mb-4 md:hidden">
              <h3 className="font-semibold">Filters</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowFilters(false)}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            {/* Filters will be added here later */}
            <div className="p-4 text-center text-muted-foreground font-mono text-sm">
              Advanced filters coming soon...
            </div>
          </div>
        )}

        {/* Quest Content */}
        <div className="flex-1 min-w-0">
          <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-4 md:space-y-6">
            <div className="overflow-x-auto">
              <TabsList className="bg-gradient-to-r from-background via-muted/50 to-background border-2 border-dashed border-muted p-1 w-max md:w-auto">
               
                <TabsTrigger 
                  value="all"
                  className="font-mono data-[state=active]:bg-accent data-[state=active]:text-accent-foreground data-[state=active]:shadow-[inset_2px_2px_0px_0px_rgba(0,0,0,0.1)] transition-all duration-200 text-xs sm:text-sm whitespace-nowrap"
                >
                  All Quests ({allQuests.totalItems})
                </TabsTrigger>
                <TabsTrigger 
                  value="available"
                  className="font-mono data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-[inset_2px_2px_0px_0px_rgba(0,0,0,0.1)] transition-all duration-200 text-xs sm:text-sm whitespace-nowrap"
                >
                  Available ({availableQuests.totalItems})
                </TabsTrigger>
                <TabsTrigger 
                  value="completed"
                  className="font-mono data-[state=active]:bg-green-500 data-[state=active]:text-green-900 data-[state=active]:shadow-[inset_2px_2px_0px_0px_rgba(0,255,0,0.1)] transition-all duration-200 text-xs sm:text-sm whitespace-nowrap"
                >
                  Completed ({completedQuests.totalItems})
                </TabsTrigger>
                 <TabsTrigger 
                  value="pending"
                  className="font-mono data-[state=active]:bg-yellow-400 data-[state=active]:text-yellow-900 data-[state=active]:shadow-[inset_2px_2px_0px_0px_rgba(255,255,0,0.1)] transition-all duration-200 text-xs sm:text-sm whitespace-nowrap"
                >
                  Pending ({pendingQuests.totalItems})
                </TabsTrigger>
           
                <TabsTrigger 
                  value="rejected"
                  className="font-mono data-[state=active]:bg-destructive data-[state=active]:text-destructive-foreground data-[state=active]:shadow-[inset_2px_2px_0px_0px_rgba(255,0,0,0.1)] transition-all duration-200 text-xs sm:text-sm whitespace-nowrap"
                >
                  Rejected ({rejectedQuests.totalItems})
                </TabsTrigger>
             
              </TabsList>
            </div>

            <TabsContent value="all" className="space-y-4 md:space-y-6">
              {/* Loading state for quest content area only */}
              {allQuests.isLoading && allQuests.quests.length === 0 ? (
                <div className="flex flex-col items-center justify-center min-h-[300px]">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                  <p className="text-muted-foreground mt-2 text-sm">Loading quests...</p>
                </div>
              ) : (
                <>
                  {viewMode === 'grid' ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4 md:gap-6 mt-4 md:mt-6">
                      {allQuests.quests.map((quest) => (
                       <QuestCard
          key={quest.id}
          quest={quest}
          isCompleted={isQuestCompleted(quest)}
          isPending={isQuestPending(quest)}
          isRejected={isQuestRejected(quest)}
          isExpired={isExpired(quest)}
          onSelect={() => handleQuestSelect(quest)}
        />
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-3 md:space-y-4">
                      {allQuests.quests.map((quest) => (
                        <div key={quest.id} className="border rounded-lg p-4 md:p-6 hover:shadow-md transition-shadow cursor-pointer"
                             onClick={() => handleQuestSelect(quest)}>
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-3 mb-2">
                                <h3 className="text-base md:text-lg font-semibold truncate">{quest.title}</h3>
                                {isQuestCompleted(quest) && (
                                  <div className="w-5 h-5 md:w-6 md:h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                                    <div className="w-2 h-2 md:w-3 md:h-3 text-white text-xs">✓</div>
                                  </div>
                                )}
                              </div>
                              <p className="text-muted-foreground mb-3 text-sm md:text-base overflow-hidden"
                                 style={{
                                   display: '-webkit-box',
                                   WebkitLineClamp: 2,
                                   WebkitBoxOrient: 'vertical' as const
                                 }}>{quest.description}</p>
                              <div className="flex flex-wrap items-center gap-2 md:gap-4 text-xs md:text-sm text-muted-foreground">
                                <span className="capitalize">{(quest.category || 'general').replace('-', ' ')}</span>
                                <span className="capitalize">{quest.difficulty}</span>
                                <span>{quest.estimatedTime}</span>
                                <span>${(((typeof quest.points === 'number' ? quest.points : 0) || (typeof quest.reward === 'number' ? quest.reward : 0) || 0) * 0.01).toFixed(2)}</span>
                              </div>
                            </div>
                            <Button size="sm" className="flex-shrink-0">
                              {isQuestCompleted(quest) ? 'Review' : 'Start'}
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Pagination */}
                  {allQuests.totalPages > 1 && (
                    <div className="mt-8">
                      <QuestPagination
                        currentPage={allQuests.currentPage}
                        totalPages={allQuests.totalPages}
                        onPageChange={allQuests.goToPage}
                        hasNextPage={allQuests.hasNextPage}
                        hasPreviousPage={allQuests.hasPreviousPage}
                        isLoading={allQuests.isLoading}
                      />
                    </div>
                  )}

                  {allQuests.quests.length === 0 && !allQuests.isLoading && (
                    <div className="text-center py-8 md:py-12 px-4">
                      <p className="text-muted-foreground mb-4 text-sm md:text-base">No quests found matching your criteria.</p>
                      <Button
                        variant="outline"
                        onClick={() => allQuests.updateFilters({ search: '' })}
                        className="text-sm"
                      >
                        Clear Search
                      </Button>
                    </div>
                  )}
                </>
              )}
            </TabsContent>




            <TabsContent value="available">
              {/* Loading state for quest content area only */}
              {availableQuests.isLoading && availableQuests.quests.length === 0 ? (
                <div className="flex flex-col items-center justify-center min-h-[300px]">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                  <p className="text-muted-foreground mt-2 text-sm">Loading available quests...</p>
                </div>
              ) : (
                <>
                  <div className={cn(
                    viewMode === 'grid' 
                      ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4 md:gap-6'
                      : 'space-y-3 md:space-y-4'
                  )}>
                    {availableQuests.quests.map((quest) => (
                        <QuestCard
                          key={quest.id}
                          quest={quest}
                          isCompleted={false}
                          onSelect={() => handleQuestSelect(quest)}
                        />
                      ))}
                  </div>
                  
                  {/* Pagination for Available */}
                  {availableQuests.totalPages > 1 && (
                    <div className="mt-8">
                      <QuestPagination
                        currentPage={availableQuests.currentPage}
                        totalPages={availableQuests.totalPages}
                        onPageChange={availableQuests.goToPage}
                        hasNextPage={availableQuests.hasNextPage}
                        hasPreviousPage={availableQuests.hasPreviousPage}
                        isLoading={availableQuests.isLoading}
                      />
                    </div>
                  )}
                  
                  {availableQuests.quests.length === 0 && !availableQuests.isLoading && (
                    <div className="text-center py-8 md:py-12 px-4">
                      <p className="text-muted-foreground mb-4 text-sm md:text-base">No available quests found.</p>
                    </div>
                  )}
                </>
              )}
            </TabsContent>

            <TabsContent value="completed">
              {/* Loading state for quest content area only */}
              {completedQuests.isLoading && completedQuests.quests.length === 0 ? (
                <div className="flex flex-col items-center justify-center min-h-[300px]">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-500"></div>
                  <p className="text-muted-foreground mt-2 text-sm">Loading completed quests...</p>
                </div>
              ) : (
                <>
                  <div className={cn(
                    viewMode === 'grid' 
                      ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4 md:gap-6'
                      : 'space-y-3 md:space-y-4'
                  )}>
                    {completedQuests.quests.map((quest) => (
                        <QuestCard
                          key={quest.id}
                          quest={quest}
                          isCompleted={true}
                          onSelect={() => handleQuestSelect(quest)}
                        />
                      ))}
                  </div>
                  
                  {/* Pagination for Completed */}
                  {completedQuests.totalPages > 1 && (
                    <div className="mt-8">
                      <QuestPagination
                        currentPage={completedQuests.currentPage}
                        totalPages={completedQuests.totalPages}
                        onPageChange={completedQuests.goToPage}
                        hasNextPage={completedQuests.hasNextPage}
                        hasPreviousPage={completedQuests.hasPreviousPage}
                        isLoading={completedQuests.isLoading}
                      />
                    </div>
                  )}
                  
                  {completedQuests.quests.length === 0 && !completedQuests.isLoading && (
                    <div className="text-center py-8 md:py-12 px-4">
                      <p className="text-muted-foreground mb-4 text-sm md:text-base">No completed quests found.</p>
                    </div>
                  )}
                </>
              )}
            </TabsContent>

            <TabsContent value="pending">
              {/* Loading state for quest content area only */}
              {pendingQuests.isLoading && pendingQuests.quests.length === 0 ? (
                <div className="flex flex-col items-center justify-center min-h-[300px]">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-yellow-500"></div>
                  <p className="text-muted-foreground mt-2 text-sm">Loading pending quests...</p>
                </div>
              ) : (
                <>
                  <div className={cn(
                    viewMode === 'grid' 
                      ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4 md:gap-6'
                      : 'space-y-3 md:space-y-4'
                  )}>
                    {pendingQuests.quests.map((quest) => (
                        <QuestCard
                          key={quest.id}
                          quest={quest}
                          isCompleted={false}
                          isPending={true}
                          onSelect={() => handleQuestSelect(quest)}
                        />
                      ))}
                  </div>
                  
                  {/* Pagination for Pending */}
                  {pendingQuests.totalPages > 1 && (
                    <div className="mt-8">
                      <QuestPagination
                        currentPage={pendingQuests.currentPage}
                        totalPages={pendingQuests.totalPages}
                        onPageChange={pendingQuests.goToPage}
                        hasNextPage={pendingQuests.hasNextPage}
                        hasPreviousPage={pendingQuests.hasPreviousPage}
                        isLoading={pendingQuests.isLoading}
                      />
                    </div>
                  )}
                  
                  {pendingQuests.quests.length === 0 && !pendingQuests.isLoading && (
                    <div className="text-center py-8 md:py-12 px-4">
                      <p className="text-muted-foreground mb-4 text-sm md:text-base">No pending quests found.</p>
                    </div>
                  )}
                </>
              )}
            </TabsContent>

            <TabsContent value="rejected">
              {/* Loading state for quest content area only */}
              {rejectedQuests.isLoading && rejectedQuests.quests.length === 0 ? (
                <div className="flex flex-col items-center justify-center min-h-[300px]">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-red-500"></div>
                  <p className="text-muted-foreground mt-2 text-sm">Loading rejected quests...</p>
                </div>
              ) : (
                <>
                  <div className={cn(
                    viewMode === 'grid' 
                      ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4 md:gap-6'
                      : 'space-y-3 md:space-y-4'
                  )}>
                    {rejectedQuests.quests.map((quest) => (
                        <QuestCard
                          key={quest.id}
                          quest={quest}
                          isCompleted={false}
                          isRejected={true}
                          onSelect={() => handleQuestSelect(quest)}
                        />
                      ))}
                  </div>
                  
                  {/* Pagination for Rejected */}
                  {rejectedQuests.totalPages > 1 && (
                    <div className="mt-8">
                      <QuestPagination
                        currentPage={rejectedQuests.currentPage}
                        totalPages={rejectedQuests.totalPages}
                        onPageChange={rejectedQuests.goToPage}
                        hasNextPage={rejectedQuests.hasNextPage}
                        hasPreviousPage={rejectedQuests.hasPreviousPage}
                        isLoading={rejectedQuests.isLoading}
                      />
                    </div>
                  )}
                  
                  {rejectedQuests.quests.length === 0 && !rejectedQuests.isLoading && (
                    <div className="text-center py-8 md:py-12 px-4">
                      <p className="text-muted-foreground mb-4 text-sm md:text-base">No rejected quests found.</p>
                    </div>
                  )}
                </>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
