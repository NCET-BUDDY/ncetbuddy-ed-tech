import { NextResponse } from 'next/server';
import { getAdminPB } from '@/lib/pocketbase-server';

export async function POST(req: Request) {
    try {
        const { code, educatorId } = await req.json();
        
        // Obsolete in pocketbase environment as user can be given educator role via UI
        return NextResponse.json({ 
            success: true, 
            message: "PocketBase automatically binds role via Admin UI"
        });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
