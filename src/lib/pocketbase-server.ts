import PocketBase from 'pocketbase';

/**
 * Server-side PocketBase admin client.
 * Used in API routes, middleware, and server components.
 * Authenticates as superuser to bypass collection API rules.
 */

const POCKETBASE_URL = process.env.NEXT_PUBLIC_POCKETBASE_URL || 'http://127.0.0.1:8090';
const ADMIN_EMAIL = process.env.POCKETBASE_ADMIN_EMAIL || '';
const ADMIN_PASSWORD = process.env.POCKETBASE_ADMIN_PASSWORD || '';

let adminPb: PocketBase | null = null;
let authPromise: Promise<void> | null = null;

/**
 * Returns an authenticated admin PocketBase instance.
 * Caches the instance and re-authenticates only when the token expires.
 */
export async function getAdminPb(): Promise<PocketBase> {
    if (!adminPb) {
        adminPb = new PocketBase(POCKETBASE_URL);
        adminPb.autoCancellation(false);
    }

    // If token is still valid, return immediately
    if (adminPb.authStore.isValid) {
        return adminPb;
    }

    // Prevent multiple simultaneous auth attempts
    if (!authPromise) {
        authPromise = (async () => {
            try {
                await adminPb!.admins.authWithPassword(ADMIN_EMAIL, ADMIN_PASSWORD);
            } catch (error) {
                console.error('[PocketBase Server] Admin auth failed:', error);
                throw error;
            } finally {
                authPromise = null;
            }
        })();
    }

    await authPromise;
    return adminPb;
}

export const getAdminPB = getAdminPb;

export { POCKETBASE_URL };
