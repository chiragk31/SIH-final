import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export interface PaginationProps {
    currentPage: number;
    totalPages: number;
    pageSize: number;
    totalCount: number;
    onPageChange: (page: number) => void;
    className?: string;
}

/**
 * Simple pagination component with range display and arrow navigation
 * Format: "1-4 of 100" with < > arrows
 */
export function Pagination({
    currentPage,
    totalPages,
    pageSize,
    totalCount,
    onPageChange,
    className = '',
}: PaginationProps) {
    const canGoPrev = currentPage > 1;
    const canGoNext = currentPage < totalPages;

    // Calculate current range
    const startItem = (currentPage - 1) * pageSize + 1;
    const endItem = Math.min(currentPage * pageSize, totalCount);

    return (
        <nav
            role="navigation"
            aria-label="Pagination navigation"
            className={`flex items-center justify-center gap-4 ${className}`}
        >
            {/* Range Display */}
            <div className="text-sm text-muted-foreground font-medium">
                {totalCount > 0 ? (
                    <>
                        <span className="tabular-nums">{startItem}–{endItem}</span>
                        {' '}of{' '}
                        <span className="tabular-nums">{totalCount.toLocaleString()}</span>
                    </>
                ) : (
                    'No items'
                )}
            </div>

            {/* Navigation Arrows */}
            <div className="flex items-center gap-1">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={!canGoPrev}
                    aria-label="Go to previous page"
                    aria-disabled={!canGoPrev}
                    className="h-8 w-8"
                >
                    <ChevronLeft className="h-4 w-4" />
                </Button>

                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={!canGoNext}
                    aria-label="Go to next page"
                    aria-disabled={!canGoNext}
                    className="h-8 w-8"
                >
                    <ChevronRight className="h-4 w-4" />
                </Button>
            </div>
        </nav>
    );
}
