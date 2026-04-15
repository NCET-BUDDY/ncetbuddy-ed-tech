import PocketBase from 'pocketbase';

const POCKETBASE_URL = process.env.NEXT_PUBLIC_POCKETBASE_URL || 'http://127.0.0.1:8090';

/**
 * Client-side PocketBase instance.
 * Used in browser contexts (React components, client hooks).
 * Auth state is automatically persisted via cookies/localStorage by PocketBase SDK.
 */
const pb = new PocketBase(POCKETBASE_URL);

// Disable auto-cancellation to prevent rapid sequential requests from being cancelled
pb.autoCancellation(false);

export { pb, POCKETBASE_URL };

/**
 * Check if PocketBase is configured (URL is set and non-empty).
 */
export const isPocketBaseConfigured = (): boolean => {
    return !!POCKETBASE_URL && POCKETBASE_URL !== '';
};

export default pb;
