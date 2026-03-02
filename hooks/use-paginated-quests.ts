import { useState, useEffect, useCallback, useRef } from 'react';
import { UserQuestService } from '@/lib/user-quest-service';
import type { Quest, QuestFilters, UserQuestsResponse } from '@/lib/types';
import { useSession } from 'next-auth/react';

interface UsePaginatedQuestsOptions {
  initialPage?: number;
  itemsPerPage?: number;
  initialFilters?: QuestFilters;
  autoLoad?: boolean;
}

interface UsePaginatedQuestsReturn {
  quests: Quest[];
  isLoading: boolean;
  error: string | null;
  currentPage: number;
  totalPages: number;
  totalItems: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  filters: QuestFilters;
  
  // Actions
  loadQuests: (page?: number, newFilters?: QuestFilters) => Promise<void>;
  nextPage: () => Promise<void>;
  previousPage: () => Promise<void>;
  goToPage: (page: number) => Promise<void>;
  updateFilters: (newFilters: Partial<QuestFilters>) => Promise<void>;
  refresh: () => Promise<void>;
  reset: () => void;
}

export function usePaginatedQuests(options: UsePaginatedQuestsOptions = {}): UsePaginatedQuestsReturn {
  const {
    initialPage = 1,
    itemsPerPage = 12,
    initialFilters = {},
    autoLoad = true
  } = options;

  const { data: session } = useSession();
  
  // State
  const [quests, setQuests] = useState<Quest[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [totalPages, setTotalPages] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  const [filters, setFilters] = useState<QuestFilters>({
    ...initialFilters,
    page: initialPage,
    limit: itemsPerPage
  });

  // Refs to hold current state values
  const currentPageRef = useRef(currentPage);
  const filtersRef = useRef(filters);
  
  // Update refs when state changes
  useEffect(() => {
    currentPageRef.current = currentPage;
  }, [currentPage]);
  
  useEffect(() => {
    filtersRef.current = filters;
  }, [filters]);

  // Computed values
  const hasNextPage = currentPage < totalPages;
  const hasPreviousPage = currentPage > 1;

  // Load quests function
  const loadQuests = useCallback(async (
    page: number = 1,
    newFilters: QuestFilters = {}
  ) => {
    try {
      setIsLoading(true);
      setError(null);

      const questFilters = {
        ...newFilters,
        page,
        limit: itemsPerPage
      };

      console.log('Loading quests with filters:', questFilters);

      const response: UserQuestsResponse = await UserQuestService.getUserQuests(
        questFilters,
        session?.user?.token
      );

      console.log('Quests loaded:', response);

      setQuests(response.quests || []);
      setCurrentPage(response.page);
      setTotalPages(response.numberOfPages);
      setTotalItems(response.count || 0); // Use count for total across all pages
      setFilters(questFilters);

    } catch (err) {
      console.error('Error loading quests:', err);
      setError(err instanceof Error ? err.message : 'Failed to load quests');
      setQuests([]);
    } finally {
      setIsLoading(false);
    }
  }, [itemsPerPage, session?.user?.token]); // Remove currentPage and filters from dependencies

  // Navigation functions
  const nextPage = useCallback(async () => {
    const current = currentPageRef.current;
    const currentFilters = filtersRef.current;
    if (current < totalPages) {
      const nextPageNum = current + 1;
      await loadQuests(nextPageNum, currentFilters);
    }
  }, [loadQuests, totalPages]);

  const previousPage = useCallback(async () => {
    const current = currentPageRef.current;
    const currentFilters = filtersRef.current;
    if (current > 1) {
      const prevPageNum = current - 1;
      await loadQuests(prevPageNum, currentFilters);
    }
  }, [loadQuests]);

  const goToPage = useCallback(async (page: number) => {
    const current = currentPageRef.current;
    const currentFilters = filtersRef.current;
    if (page >= 1 && page <= totalPages && page !== current) {
      await loadQuests(page, currentFilters);
    }
  }, [loadQuests, totalPages]);

  // Filter management
  const updateFilters = useCallback(async (newFilters: Partial<QuestFilters>) => {
    const currentFilters = filtersRef.current;
    const updatedFilters = {
      ...currentFilters,
      ...newFilters,
      page: 1, // Reset to first page when filters change
      limit: itemsPerPage
    };
    await loadQuests(1, updatedFilters);
  }, [loadQuests, itemsPerPage]);

  // Utility functions
  const refresh = useCallback(async () => {
    const current = currentPageRef.current;
    const currentFilters = filtersRef.current;
    await loadQuests(current, currentFilters);
  }, [loadQuests]);

  const reset = useCallback(() => {
    setQuests([]);
    setCurrentPage(initialPage);
    setTotalPages(0);
    setTotalItems(0);
    setError(null);
    setFilters({
      ...initialFilters,
      page: initialPage,
      limit: itemsPerPage
    });
  }, [initialPage, initialFilters, itemsPerPage]);

  // Auto-load on mount
  useEffect(() => {
    if (autoLoad && session?.user?.token) {
      loadQuests(initialPage, {
        ...initialFilters,
        page: initialPage,
        limit: itemsPerPage
      });
    }
  }, [autoLoad, session?.user?.token]); // Only depend on session token, not on the functions

  return {
    // Data
    quests,
    isLoading,
    error,
    currentPage,
    totalPages,
    totalItems,
    hasNextPage,
    hasPreviousPage,
    filters,
    
    // Actions
    loadQuests,
    nextPage,
    previousPage,
    goToPage,
    updateFilters,
    refresh,
    reset
  };
}