import { NextRequest, NextResponse } from "next/server";
import { getAdminPB } from '@/lib/pocketbase-server';

export async function GET() {
    try {
        const pb = await getAdminPB();
        const response = await pb.collection('banners').getList(1, 100, { sort: 'order' });
        return NextResponse.json(response.items);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const pb = await getAdminPB();
        const data = await req.json();
        const doc = await pb.collection('banners').create(data);
        return NextResponse.json(doc);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');
        if (!id) return NextResponse.json({ error: "Missing ID" }, { status: 400 });
        const pb = await getAdminPB();
        await pb.collection('banners').delete(id);
        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
