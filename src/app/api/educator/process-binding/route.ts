import { NextResponse } from 'next/server';
import { getAdminPB } from '@/lib/pocketbase-server';

export async function POST(req: Request) {
    try {
        const { userId, educatorId } = await req.json();
        // In pocketbase, binding process is much simpler, update role locally:
        const pb = await getAdminPB();
        await pb.collection('users').update(userId, { role: 'educator' });
        return NextResponse.json({ success: true, message: "Bound directly via Pocketbase" });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
