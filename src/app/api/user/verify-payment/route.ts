import { NextResponse } from 'next/server';
import { databases, DB_ID } from '@/lib/server/appwrite-admin';
import { ID } from 'node-appwrite';

export async function POST(request: Request) {
    try {
        const body = await request.json();

        if (!body.userId || !body.paymentId || !body.status) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const response = await databases.createDocument(
            DB_ID,
            'payments',
            ID.unique(),
            {
                userId: body.userId,
                paymentId: body.paymentId,
                paymentRequestId: body.paymentRequestId || '',
                amount: body.amount || 0,
                status: body.status,
                productName: body.productName || "NCET Ready Test",
                createdAt: body.createdAt || Math.floor(Date.now() / 1000)
            }
        );

        return NextResponse.json({ success: true, id: response.$id });
    } catch (error: any) {
        console.error("API Error (Verify Payment):", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
