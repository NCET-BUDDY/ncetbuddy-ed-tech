/**
 * Client-side in-memory cache for PocketBase database queries.
 * Dramatically reduces database reads by caching frequently-accessed data.
 *
 * Design:
 * - In-memory Map for fast access
 * - TTL-based expiration
 * - Manual invalidation for write-after-read consistency
 */

interface CacheEntry<T> {
    data: T;
    expiresAt: number;
}

const cache = new Map<string, CacheEntry<any>>();

// TTL constants (in milliseconds)
export const CACHE_TTL = {
    /** Static content that rarely changes (tests, books, formula cards, videos) */
    STATIC: 10 * 60 * 1000,      // 10 minutes
    /** User-specific data (test results, profile) */
    USER: 3 * 60 * 1000,          // 3 minutes
    /** Aggregated data (leaderboard, analytics) */
    AGGREGATE: 5 * 60 * 1000,     // 5 minutes
    /** Forum and social data */
    SOCIAL: 5 * 60 * 1000,        // 5 minutes
} as const;

// ── Cache-Miss Rate Monitor ─────────────────────────────────────────────────
const MISS_WINDOW_MS = 60 * 1000;
const MISS_ALERT_THRESHOLD = 50;

let missTimes: number[] = [];
let alertFiredAt = 0;

function recordCacheMiss(key: string): void {
    const now = Date.now();
    missTimes.push(now);
    missTimes = missTimes.filter(t => now - t < MISS_WINDOW_MS);

    if (
        missTimes.length >= MISS_ALERT_THRESHOLD &&
        now - alertFiredAt > MISS_WINDOW_MS &&
        typeof window !== 'undefined'
    ) {
        alertFiredAt = now;
        console.warn(`[pocketbase-cache] ⚠️ ${missTimes.length} cache misses in 60s — possible infinite loop or unoptimized fetch. Last key: ${key}`);
    }
}

/**
 * Fetch data with caching. Returns cached data if fresh, otherwise calls fetcher.
 */
export async function cachedFetch<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttlMs: number
): Promise<T> {
    const existing = cache.get(key);
    if (existing && Date.now() < existing.expiresAt) {
        return existing.data;
    }

    recordCacheMiss(key);
    const data = await fetcher();
    cache.set(key, {
        data,
        expiresAt: Date.now() + ttlMs,
    });
    return data;
}

/**
 * Invalidate a specific cache key.
 */
export function invalidateCache(key: string): void {
    cache.delete(key);
}

/**
 * Invalidate all cache keys matching a prefix.
 */
export function invalidateCacheByPrefix(prefix: string): void {
    for (const key of cache.keys()) {
        if (key.startsWith(prefix)) {
            cache.delete(key);
        }
    }
}

/**
 * Clear entire cache. Use sparingly (e.g., on logout).
 */
export function clearAllCache(): void {
    cache.clear();
}

// Cache key builders for consistency
export const CacheKeys = {
    tests: () => 'tests_list',
    testsListOnly: () => 'tests_list_only',
    testById: (id: string) => `test_${id}`,
    books: () => 'books_list',
    formulaCards: () => 'formula_cards_list',
    videoClasses: () => 'video_classes_list',
    forumPosts: (category?: string) => `forum_posts_${category || 'all'}`,
    userTestResults: (userId: string) => `user_results_${userId}`,
    userProfile: (userId: string) => `user_profile_${userId}`,
    leaderboardSummary: (userId: string) => `leaderboard_summary_${userId}`,
    leaderboard: () => 'leaderboard',
    dailyProgress: (userId: string) => `daily_progress_${userId}`,
    notifications: () => 'notifications_list',
    educators: () => 'educators_list',
    activeBanners: () => 'active_banners',
    educatorVideos: (educatorId: string) => `educator_videos_${educatorId}`,
    allEducatorVideos: () => 'all_educator_videos',
    userPayments: (userId: string) => `user_payments_${userId}`,
    userPurchases: (userId: string) => `user_purchases_${userId}`,
    hasUserPaid: (userId: string, product: string) => `paid_${userId}_${product}`,
} as const;
