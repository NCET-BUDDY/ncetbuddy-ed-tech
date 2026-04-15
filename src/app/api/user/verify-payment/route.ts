import { NextResponse } from 'next/server';
import { getAdminPB } from '@/lib/pocketbase-server';

export async function POST(request: Request) {
    try {
        const body = await request.json();

        if (!body.userId || !body.paymentId || !body.status) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const pb = await getAdminPB();

        const response = await pb.collection('payments').create({
            userId: body.userId,
            paymentId: body.paymentId,
            paymentRequestId: body.paymentRequestId || '',
            amount: body.amount || 0,
            status: body.status,
            productName: body.productName || "NCET Ready Test",
            createdAt: body.createdAt || Math.floor(Date.now() / 1000)
        });

        if (body.status === 'Credit') {
            try {
                await pb.collection('users').update(body.userId, {
                    premiumStatus: true
                });
            } catch (e) { }
        }

        return NextResponse.json({ success: true, id: response.id });
    } catch (error: any) {
        console.error("API Error (Verify Payment):", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
