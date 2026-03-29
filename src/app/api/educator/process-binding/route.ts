import { NextRequest, NextResponse } from 'next/server';
import { databases, upsertUserProfile } from '@/lib/server/user-profile';

export async function POST(request: NextRequest) {
    try {
        // Parse request body to get session info and user data
        const body = await request.json();
        const { sessionId, codeId, userId, userEmail } = body;

        console.log('Received binding request:', { sessionId: sessionId?.substring(0, 8) + '...', codeId, userId, userEmail });

        if (!sessionId || !codeId || !userId || !userEmail) {
            console.error('Missing required fields');
            return NextResponse.json(
                { success: false, error: 'missing_session_info' },
                { status: 400 }
            );
        }

        // Step 1: Verify session ID matches database
        const dbId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || '69c84948001622ba05f7';

        let codeDoc;
        try {
            codeDoc = await databases.getDocument(dbId, 'educator_codes', codeId);
        } catch (err) {
            console.error('Failed to fetch code:', err);
            return NextResponse.json({ success: false, error: 'code_not_found' }, { status: 404 });
        }

        console.log('Code doc retrieved. Pending session:', codeDoc.pendingSessionId?.substring(0, 8) + '...');

        // Verify session ID matches
        if (codeDoc.pendingSessionId !== sessionId) {
            console.error('Session ID mismatch!', {
                expected: codeDoc.pendingSessionId?.substring(0, 8),
                received: sessionId?.substring(0, 8)
            });
            return NextResponse.json({ success: false, error: 'session_invalid' }, { status: 401 });
        }

        // Verify code is active
        if (!codeDoc.active) {
            console.error('Code is inactive');
            return NextResponse.json({ success: false, error: 'code_inactive' }, { status: 403 });
        }

        console.log('Session verified. Processing binding...');

        // Step 2: Binding logic (using client-provided user info)
        // This is safe because we verified the session ID matches database
        if (!codeDoc.boundUserId) {
            // First use - bind
            console.log('First use - binding code to user:', userId);
            try {
                await databases.updateDocument(dbId, 'educator_codes', codeDoc.$id, {
                    boundUserId: userId,
                    boundEmail: userEmail,
                    lastUsedAt: Math.floor(Date.now() / 1000),
                    pendingSessionId: null, // Clear pending session
                });
                console.log('Code bound successfully');
            } catch (err) {
                console.error('Failed to bind code:', err);
                return NextResponse.json({ success: false, error: 'binding_failed' }, { status: 500 });
            }
        } else if (codeDoc.boundUserId !== userId) {
            // Code bound to different user - reject
            console.error('Code already bound to different user:', {
                boundTo: codeDoc.boundUserId,
                attemptedBy: userId
            });
            return NextResponse.json({ success: false, error: 'code_already_bound' }, { status: 403 });
        } else {
            // Same user - update lastUsedAt and clear pending session
            console.log('Same user login - updating last used');
            try {
                await databases.updateDocument(dbId, 'educator_codes', codeDoc.$id, {
                    lastUsedAt: Math.floor(Date.now() / 1000),
                    pendingSessionId: null, // Clear pending session
                });
            } catch (err) {
                console.error('Failed to update lastUsedAt:', err);
            }
        }

        // Step 3: Upsert user profile
        console.log('Upserting user profile...');
        try {
            await upsertUserProfile(userId, {
                role: 'educator',
                educatorCodeId: codeDoc.$id,
                email: userEmail,
            });
            console.log('User profile updated successfully');
        } catch (err) {
            console.error('Failed to upsert profile:', err);
            return NextResponse.json({ success: false, error: 'profile_failed' }, { status: 500 });
        }

        // Step 4: Return success
        console.log('Binding process complete!');
        return NextResponse.json({ success: true });

    } catch (err) {
        console.error('Process binding error:', err);
        return NextResponse.json({ success: false, error: 'unknown' }, { status: 500 });
    }
}
