export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getAdminPB } from '@/lib/pocketbase-server';

export async function GET() {
    try {
        const pb = await getAdminPB();
        
        // Fetch new payments
        const paymentsResponse = await pb.collection('payments').getList(1, 500, { sort: '-createdAt' });
        const paymentsDocs = paymentsResponse.items;

        // Fetch user maps
        const userMap: Record<string, string> = {};
        try {
            const usersResponse = await pb.collection('users').getList(1, 500);
            usersResponse.items.forEach((doc: any) => {
                if (doc.email) userMap[doc.id] = doc.email;
            });
        } catch(e) {}

        const allTransactions = paymentsDocs.map((doc: any) => ({
            id: doc.id,
            email: userMap[doc.userId] || 'Unknown User',
            testId: doc.productName || 'Payment',
            amount: Number(doc.amount) || 0,
            status: doc.status === 'Credit' ? 'completed' : (doc.status === 'Failed' ? 'failed' : doc.status),
            createdAt: doc.createdAt || new Date(doc.created).getTime() / 1000,
            type: 'instamojo'
        }));

        return NextResponse.json(allTransactions);
    } catch (error: any) {
        return NextResponse.json({ error: error.message || "Failed to fetch purchases" }, { status: 500 });
    }
}
