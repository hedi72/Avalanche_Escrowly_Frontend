import React from 'react';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';

interface QuestPaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  isLoading?: boolean;
  className?: string;
  showPageNumbers?: boolean;
  maxVisiblePages?: number;
}

export function QuestPagination({
  currentPage,
  totalPages,
  onPageChange,
  hasNextPage,
  hasPreviousPage,
  isLoading = false,
  className,
  showPageNumbers = true,
  maxVisiblePages = 5
}: QuestPaginationProps) {
  if (totalPages <= 1) {
    return null;
  }

  // Calculate which page numbers to show
  const getVisiblePages = (): (number | 'ellipsis')[] => {
    if (totalPages <= maxVisiblePages) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const pages: (number | 'ellipsis')[] = [];
    const halfVisible = Math.floor(maxVisiblePages / 2);

    if (currentPage <= halfVisible + 1) {
      // Show pages from start
      for (let i = 1; i <= maxVisiblePages - 1; i++) {
        pages.push(i);
      }
      if (totalPages > maxVisiblePages) {
        pages.push('ellipsis');
        pages.push(totalPages);
      }
    } else if (currentPage >= totalPages - halfVisible) {
      // Show pages from end
      pages.push(1);
      if (totalPages > maxVisiblePages) {
        pages.push('ellipsis');
      }
      for (let i = totalPages - maxVisiblePages + 2; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Show pages around current
      pages.push(1);
      pages.push('ellipsis');
      for (let i = currentPage - halfVisible + 1; i <= currentPage + halfVisible - 1; i++) {
        pages.push(i);
      }
      pages.push('ellipsis');
      pages.push(totalPages);
    }

    return pages;
  };

  const visiblePages = showPageNumbers ? getVisiblePages() : [];

  return (
    <div className={cn('flex items-center justify-center space-x-2', className)}>
      <Pagination>
        <PaginationContent className="gap-1">
          {/* Previous Button */}
          <PaginationItem>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(currentPage - 1)}
              disabled={!hasPreviousPage || isLoading}
              className="gap-1 font-mono border-dashed hover:border-solid transition-all duration-200"
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Previous</span>
            </Button>
          </PaginationItem>

          {/* Page Numbers */}
          {showPageNumbers && visiblePages.map((page, index) => (
            <PaginationItem key={index}>
              {page === 'ellipsis' ? (
                <div className="flex h-9 w-9 items-center justify-center">
                  <MoreHorizontal className="h-4 w-4" />
                </div>
              ) : (
                <PaginationLink
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    if (!isLoading) {
                      onPageChange(page as number);
                    }
                  }}
                  isActive={page === currentPage}
                  className={cn(
                    "font-mono border-dashed hover:border-solid transition-all duration-200",
                    page === currentPage && "bg-primary text-primary-foreground border-solid shadow-[inset_2px_2px_0px_0px_rgba(0,0,0,0.1)]",
                    isLoading && "opacity-50 cursor-not-allowed"
                  )}
                >
                  {page}
                </PaginationLink>
              )}
            </PaginationItem>
          ))}

          {/* Next Button */}
          <PaginationItem>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(currentPage + 1)}
              disabled={!hasNextPage || isLoading}
              className="gap-1 font-mono border-dashed hover:border-solid transition-all duration-200"
            >
              <span className="hidden sm:inline">Next</span>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </PaginationItem>
        </PaginationContent>
      </Pagination>

      {/* Page Info */}
      {/* <div className="text-xs sm:text-sm text-muted-foreground font-mono ml-4">
        Page {currentPage} of {totalPages}
      </div> */}
    </div>
  );
}

// Simplified pagination for mobile or minimal usage
export function SimplePagination({
  currentPage,
  totalPages,
  onPageChange,
  hasNextPage,
  hasPreviousPage,
  isLoading = false,
  className
}: Pick<QuestPaginationProps, 'currentPage' | 'totalPages' | 'onPageChange' | 'hasNextPage' | 'hasPreviousPage' | 'isLoading' | 'className'>) {
  if (totalPages <= 1) {
    return null;
  }

  return (
    <div className={cn('flex items-center justify-between', className)}>
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={!hasPreviousPage || isLoading}
        className="gap-1 font-mono border-dashed hover:border-solid transition-all duration-200"
      >
        <ChevronLeft className="h-4 w-4" />
        Previous
      </Button>

      <div className="text-sm text-muted-foreground font-mono">
        {currentPage} / {totalPages}
      </div>

      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={!hasNextPage || isLoading}
        className="gap-1 font-mono border-dashed hover:border-solid transition-all duration-200"
      >
        Next
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}