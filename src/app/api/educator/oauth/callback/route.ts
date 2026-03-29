import { NextRequest, NextResponse } from 'next/server';
import { verifyGateToken } from '@/lib/server/gate-token';
import { databases, upsertUserProfile } from '@/lib/server/user-profile';
import { account as educatorAccount } from '@/lib/appwrite-educator';
import { Client, Account } from 'node-appwrite';

export async function GET(request: NextRequest) {
    try {
        // Step 1: Verify gate token exists
        const gateToken = request.cookies.get('edu_gate')?.value;

        if (!gateToken) {
            return NextResponse.redirect(new URL('/educator/login?error=gate_expired', request.url));
        }

        const gatePayload = verifyGateToken(gateToken);

        if (!gatePayload) {
            return NextResponse.redirect(new URL('/educator/login?error=gate_invalid', request.url));
        }

        // Step 2: Find Appwrite session cookie
        // After OAuth, Appwrite sets a session cookie with format: a_session_{projectId}
        const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID_EDUCATOR || '';

        // Get all cookies and find the session cookie
        let sessionValue: string | undefined;

        // Try the expected cookie name first
        const expectedCookie = request.cookies.get(`a_session_${projectId}`);
        if (expectedCookie) {
            sessionValue = expectedCookie.value;
        } else {
            // Search for any cookie starting with 'a_session_'
            const allCookies = request.cookies.getAll();
            const sessionCookie = allCookies.find(cookie => cookie.name.startsWith('a_session_'));
            if (sessionCookie) {
                sessionValue = sessionCookie.value;
            }
        }

        if (!sessionValue) {
            console.error('No Appwrite session cookie found');
            return NextResponse.redirect(new URL('/educator/login?error=no_session', request.url));
        }

        // Create server-side client with session
        const serverClient = new Client()
            .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || 'https://sgp.cloud.appwrite.io/v1')
            .setProject(projectId)
            .setSession(sessionValue);

        const serverAccount = new Account(serverClient);

        // Get current user
        let currentUser;
        try {
            currentUser = await serverAccount.get();
        } catch (err) {
            console.error('Failed to get user:', err);
            return NextResponse.redirect(new URL('/educator/login?error=invalid_session', request.url));
        }

        // Step 3: Fetch educator code document
        const dbId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || '69c84948001622ba05f7';

        let codeDoc;
        try {
            codeDoc = await databases.getDocument(dbId, 'educator_codes', gatePayload.codeDocId);
        } catch (err) {
            console.error('Failed to fetch code:', err);
            return NextResponse.redirect(new URL('/educator/login?error=code_not_found', request.url));
        }

        // Verify code is still active
        if (!codeDoc.active) {
            return NextResponse.redirect(new URL('/educator/login?error=code_inactive', request.url));
        }

        // Step 4: Binding logic
        if (!codeDoc.boundUserId) {
            // First use - bind to this user
            try {
                await databases.updateDocument(dbId, 'educator_codes', codeDoc.$id, {
                    boundUserId: currentUser.$id,
                    boundEmail: currentUser.email,
                    lastUsedAt: Math.floor(Date.now() / 1000),
                });
            } catch (err) {
                console.error('Failed to bind code:', err);
                return NextResponse.redirect(new URL('/educator/login?error=binding_failed', request.url));
            }
        } else if (codeDoc.boundUserId !== currentUser.$id) {
            // Code already bound to different user
            // Logout user
            try {
                await serverAccount.deleteSession('current');
            } catch (err) {
                console.error('Failed to logout:', err);
            }

            return NextResponse.redirect(new URL('/educator/login?error=code_already_bound', request.url));
        } else {
            // Same user - update last used
            try {
                await databases.updateDocument(dbId, 'educator_codes', codeDoc.$id, {
                    lastUsedAt: Math.floor(Date.now() / 1000),
                });
            } catch (err) {
                console.error('Failed to update lastUsedAt:', err);
            }
        }

        // Step 5: Upsert user profile with educator role
        try {
            await upsertUserProfile(currentUser.$id, {
                role: 'educator',
                educatorCodeId: codeDoc.$id,
                email: currentUser.email,
            });
        } catch (err) {
            console.error('Failed to upsert profile:', err);
            return NextResponse.redirect(new URL('/educator/login?error=profile_failed', request.url));
        }

        // Step 6: Clear gate token and redirect to dashboard
        const response = NextResponse.redirect(new URL('/educator/dashboard', request.url));

        response.cookies.delete('edu_gate');

        return response;

    } catch (err) {
        console.error('OAuth callback error:', err);
        return NextResponse.redirect(new URL('/educator/login?error=unknown', request.url));
    }
}
