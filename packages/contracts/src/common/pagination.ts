/**
 * Crowdbeats V2 — Pagination Contract (Phase 3)
 * Cursor-based pagination for all list endpoints.
 */

export interface CursorPage<T> {
  readonly items: readonly T[];
  /** Opaque cursor for the next page. Absent if this is the last page. */
  readonly nextCursor?: string;
  readonly hasMore: boolean;
  readonly totalCount?: number;
}

export interface PaginationParams {
  /** Opaque cursor from the previous page response. */
  readonly cursor?: string;
  readonly limit: number;
}

export const DEFAULT_PAGE_SIZE = 20 as const;
export const MAX_PAGE_SIZE = 100 as const;

export function validatePaginationParams(p: PaginationParams): void {
  if (!Number.isInteger(p.limit) || p.limit < 1 || p.limit > MAX_PAGE_SIZE) {
    throw new Error(`limit must be an integer between 1 and ${MAX_PAGE_SIZE}. Got ${p.limit}.`);
  }
}
