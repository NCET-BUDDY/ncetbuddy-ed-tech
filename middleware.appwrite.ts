import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { Client, Databases, Account } from 'node-appwrite';

/**
 * Middleware to protect educator routes
 * Ensures only users with 'educator' role can access /educator/* pages
 */
export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Only protect /educator/* routes (except login, signup, and oauth-callback)
    if (pathname.startsWith('/educator') &&
        !pathname.startsWith('/educator/login') &&
        !pathname.startsWith('/educator/signup') &&
        !pathname.startsWith('/educator/oauth-callback')) {

        // Get Appwrite session cookie
        const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID_EDUCATOR || '';
        const sessionCookieName = `a_session_${projectId}`;
        const sessionCookie = request.cookies.get(sessionCookieName);

        if (!sessionCookie) {
            // No session - redirect to login
            return NextResponse.redirect(new URL('/educator/login', request.url));
        }

        // Verify session and check role
        try {
            const client = new Client()
                .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || '')
                .setProject(projectId)
                .setSession(sessionCookie.value);

            const account = new Account(client);
            const databases = new Databases(client);

            // Get current user
            const user = await account.get();

            // Check user role in user_profiles collection
            const dbId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || '';

            let userProfile;
            try {
                userProfile = await databases.getDocument(dbId, 'user_profiles', user.$id);
            } catch (err: any) {
                // Profile doesn't exist - not an educator
                return NextResponse.redirect(new URL('/educator/login', request.url));
            }

            if (userProfile.role !== 'educator') {
                // User is not an educator
                return NextResponse.redirect(new URL('/educator/login', request.url));
            }

            // User is authenticated and is an educator - allow access
            return NextResponse.next();

        } catch (err) {
            console.error('Middleware auth error:', err);
            // Session invalid or expired - redirect to login
            return NextResponse.redirect(new URL('/educator/login', request.url));
        }
    }

    // Not an educator route or is login/signup - allow access
    return NextResponse.next();
}

export const config = {
    matcher: '/educator/:path*',
};
