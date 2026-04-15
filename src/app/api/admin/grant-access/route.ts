import { NextResponse } from 'next/server';
import { getAdminPB } from '@/lib/pocketbase-server';

export async function POST(request: Request) {
    let userId: string | undefined;
    try {
        const body = await request.json();
        userId = body.userId;

        if (!userId) {
            return NextResponse.json({ error: "Missing userId" }, { status: 400 });
        }

        const pb = await getAdminPB();

        const existingPayments = await pb.collection('payments').getList(1, 1, {
            filter: `userId = "${userId}" && productName = "NCET Ready Test" && status = "Credit"`
        });

        if (existingPayments.items.length > 0) {
            return NextResponse.json({ success: true, message: "User already has access." });
        }

        const manualPaymentId = `manual_admin_unlock_${Date.now()}`;

        await pb.collection('payments').create({
            userId,
            paymentId: manualPaymentId,
            paymentRequestId: manualPaymentId,
            amount: 0,
            status: 'Credit',
            productName: "NCET Ready Test",
            createdAt: Math.floor(Date.now() / 1000)
        });

        return NextResponse.json({ success: true, message: "Test access granted successfully." });

    } catch (error: any) {
        return NextResponse.json({ error: error.message || "An error occurred" }, { status: 500 });
    }
}
