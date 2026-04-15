import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    // Obsolete in PocketBase. OAuth handle is pure client-side.
    return NextResponse.redirect(new URL('/educator/login?error=obsolete', request.url));
}
