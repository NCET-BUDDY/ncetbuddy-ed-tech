import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Middleware to protect educator routes.
 * Ensures only users with 'educator' role can access /educator/* pages.
 * 
 * PocketBase auth tokens are stored client-side in a cookie named 'pb_auth'.
 * We verify the token by calling PocketBase's API from the edge runtime.
 */
export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Only protect /educator/* routes (except login, signup, and oauth-callback)
    if (pathname.startsWith('/educator') &&
        !pathname.startsWith('/educator/login') &&
        !pathname.startsWith('/educator/signup') &&
        !pathname.startsWith('/educator/oauth-callback')) {

        const POCKETBASE_URL = process.env.NEXT_PUBLIC_POCKETBASE_URL || '';

        // Get PocketBase auth cookie
        const pbAuthCookie = request.cookies.get('pb_auth');

        if (!pbAuthCookie) {
            // No session - redirect to login
            return NextResponse.redirect(new URL('/educator/login', request.url));
        }

        try {
            // Parse the pb_auth cookie to extract the token
            let authData: { token?: string; model?: any } = {};
            try {
                authData = JSON.parse(pbAuthCookie.value);
            } catch (e) {
                return NextResponse.redirect(new URL('/educator/login', request.url));
            }

            if (!authData.token) {
                return NextResponse.redirect(new URL('/educator/login', request.url));
            }

            // Verify the token by calling PocketBase auth refresh endpoint
            const verifyResponse = await fetch(`${POCKETBASE_URL}/api/collections/users/auth-refresh`, {
                method: 'POST',
                headers: {
                    'Authorization': authData.token,
                    'Content-Type': 'application/json',
                },
            });

            if (!verifyResponse.ok) {
                // Token invalid or expired
                return NextResponse.redirect(new URL('/educator/login', request.url));
            }

            const userData = await verifyResponse.json();
            const userId = userData?.record?.id;

            if (!userId) {
                return NextResponse.redirect(new URL('/educator/login', request.url));
            }

            // Check user role in user_profiles collection (or users collection)
            const profileResponse = await fetch(`${POCKETBASE_URL}/api/collections/user_profiles/records/${userId}`, {
                headers: {
                    'Authorization': authData.token,
                },
            });

            if (!profileResponse.ok) {
                // Profile doesn't exist - not an educator
                return NextResponse.redirect(new URL('/educator/login', request.url));
            }

            const profileData = await profileResponse.json();

            if (profileData.role !== 'educator') {
                // User is not an educator
                return NextResponse.redirect(new URL('/educator/login', request.url));
            }

            // User is authenticated and is an educator - allow access
            return NextResponse.next();

        } catch (err) {
            console.error('Middleware auth error:', err);
            return NextResponse.redirect(new URL('/educator/login', request.url));
        }
    }

    // Not an educator route or is login/signup - allow access
    return NextResponse.next();
}

export const config = {
    matcher: '/educator/:path*',
};
