import { NextResponse } from 'next/server';
import { databases, DB_ID } from '@/lib/server/appwrite-admin';
import { ID, Query } from 'node-appwrite';

export async function POST(request: Request) {
    let userId: string | undefined;
    try {
        const body = await request.json();
        userId = body.userId;

        if (!userId) {
            return NextResponse.json({ error: "Missing userId" }, { status: 400 });
        }

        // Check if user already has access
        const existingPayments = await databases.listDocuments(DB_ID, 'payments', [
            Query.equal('userId', userId),
            Query.equal('productName', "NCET Ready Test"),
            Query.equal('status', 'Credit')
        ]);

        if (existingPayments.documents.length > 0) {
            return NextResponse.json({ success: true, message: "User already has access." });
        }

        // Create manual payment record with Server API Key (bypassing permissions)
        const manualPaymentId = `manual_admin_unlock_${Date.now()}`;

        await databases.createDocument(
            DB_ID,
            'payments',
            ID.unique(),
            {
                userId,
                paymentId: manualPaymentId,
                paymentRequestId: manualPaymentId,
                amount: 0,
                status: 'Credit',
                productName: "NCET Ready Test",
                createdAt: Math.floor(Date.now() / 1000)
            }
        );

        return NextResponse.json({ success: true, message: "Test access granted successfully." });

    } catch (error: any) {
        console.error("API Error (Admin Grant Access):", {
            message: error.message,
            code: error.code,
            type: error.type,
            userId,
            env: {
                projectId: process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID_STUDENT,
                dbId: DB_ID,
                hasKey: !!(process.env.APPWRITE_API_KEY_STUDENT || process.env.APPWRITE_API_KEY)
            }
        });
        return NextResponse.json({ 
            error: error.message || "An error occurred",
            details: error.code === 401 ? "Check APPWRITE_API_KEY and Project ID mapping" : undefined
        }, { status: 500 });
    }
}
