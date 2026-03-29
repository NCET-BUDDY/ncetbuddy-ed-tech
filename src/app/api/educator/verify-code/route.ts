import { NextRequest, NextResponse } from 'next/server';
import { databases } from '@/lib/server/user-profile';
import { hashCode } from '@/lib/server/hash-code';
import { Query } from 'node-appwrite';
import crypto from 'crypto';

// Simple in-memory rate limiting
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(ip: string): boolean {
    const now = Date.now();
    const limit = rateLimitMap.get(ip);

    if (!limit || now > limit.resetTime) {
        // Reset or first attempt
        rateLimitMap.set(ip, { count: 1, resetTime: now + 5 * 60 * 1000 }); // 5 minutes
        return true;
    }

    if (limit.count >= 5) {
        return false; // Rate limit exceeded
    }

    limit.count++;
    return true;
}

export async function POST(request: NextRequest) {
    try {
        // Get client IP for rate limiting
        const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';

        // Check rate limit
        if (!checkRateLimit(ip)) {
            return NextResponse.json(
                { ok: false, message: 'Too many attempts. Please try again later.' },
                { status: 429 }
            );
        }

        // Parse request body
        const body = await request.json();
        const { clientCode } = body;

        if (!clientCode || typeof clientCode !== 'string') {
            return NextResponse.json(
                { ok: false, message: 'Client code is required' },
                { status: 400 }
            );
        }

        // Hash the code
        const codeHash = hashCode(clientCode);

        // Query database for matching code
        const dbId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || '69c84948001622ba05f7';

        const response = await databases.listDocuments(dbId, 'educator_codes', [
            Query.equal('codeHash', codeHash),
            Query.equal('active', true),
        ]);

        if (response.documents.length === 0) {
            return NextResponse.json(
                { ok: false, message: 'Invalid or inactive code' },
                { status: 401 }
            );
        }

        const codeDoc = response.documents[0];

        // Generate random session ID (no expiry - persists until OAuth completes)
        const sessionId = crypto.randomUUID();

        // Store session ID in database
        try {
            await databases.updateDocument(dbId, 'educator_codes', codeDoc.$id, {
                pendingSessionId: sessionId,
            });
        } catch (err) {
            console.error('Failed to store session ID:', err);
            return NextResponse.json(
                { ok: false, message: 'Server error' },
                { status: 500 }
            );
        }

        // Return session ID to client (they'll send it back during OAuth)
        return NextResponse.json({
            ok: true,
            sessionId,
            codeId: codeDoc.$id,
        });

    } catch (err) {
        console.error('Verify code error:', err);
        return NextResponse.json(
            { ok: false, message: 'Server error' },
            { status: 500 }
        );
    }
}
