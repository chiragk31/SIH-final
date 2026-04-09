import { useState, useCallback, useEffect } from 'react';
import { PaginationMeta, computePaginationMeta } from '@/types/api';

export interface UsePaginationProps {
    initialPage?: number;
    pageSize?: number;
}

export interface UsePaginationReturn {
    currentPage: number;
    pageSize: number;
    paginationMeta: PaginationMeta | null;
    goToPage: (page: number) => void;
    nextPage: () => void;
    prevPage: () => void;
    resetPage: () => void;
    updatePaginationMeta: (total: number) => void;
}

/**
 * Generic pagination state management hook
 * Manages current page, navigation, and metadata computation
 */
export function usePagination({
    initialPage = 1,
    pageSize = 10,
}: UsePaginationProps = {}): UsePaginationReturn {
    const [currentPage, setCurrentPage] = useState(initialPage);
    const [paginationMeta, setPaginationMeta] = useState<PaginationMeta | null>(null);

    const updatePaginationMeta = useCallback(
        (total: number) => {
            const meta = computePaginationMeta(total, currentPage, pageSize);
            setPaginationMeta(meta);
        },
        [currentPage, pageSize]
    );

    const goToPage = useCallback(
        (page: number) => {
            if (page >= 1 && (!paginationMeta || page <= paginationMeta.totalPages)) {
                setCurrentPage(page);
            }
        },
        [paginationMeta]
    );

    const nextPage = useCallback(() => {
        if (paginationMeta?.hasNextPage) {
            setCurrentPage((prev) => prev + 1);
        }
    }, [paginationMeta]);

    const prevPage = useCallback(() => {
        if (paginationMeta?.hasPrevPage) {
            setCurrentPage((prev) => Math.max(1, prev - 1));
        }
    }, [paginationMeta]);

    const resetPage = useCallback(() => {
        setCurrentPage(initialPage);
    }, [initialPage]);

    return {
        currentPage,
        pageSize,
        paginationMeta,
        goToPage,
        nextPage,
        prevPage,
        resetPage,
        updatePaginationMeta,
    };
}
