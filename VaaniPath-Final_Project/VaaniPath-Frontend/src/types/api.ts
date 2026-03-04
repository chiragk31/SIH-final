/**
 * Generic paginated API response structure
 */
export interface PaginatedResponse<T> {
    data: T[];
    total: number;
    page: number;
    page_size: number;
}

/**
 * Computed pagination metadata for UI
 */
export interface PaginationMeta {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    pageSize: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
}

/**
 * Helper function to compute pagination metadata from API response
 */
export function computePaginationMeta(
    total: number,
    page: number,
    pageSize: number
): PaginationMeta {
    const totalPages = Math.max(1, Math.ceil(total / pageSize));

    return {
        currentPage: page,
        totalPages,
        totalCount: total,
        pageSize,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
    };
}
