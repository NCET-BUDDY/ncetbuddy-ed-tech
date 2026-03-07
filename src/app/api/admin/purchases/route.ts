import { NextRequest, NextResponse } from "next/server";
import { databases, DB_ID } from "@/lib/server/appwrite-admin";
import { Query } from "node-appwrite";

export async function GET(request: NextRequest) {
    try {
        // Fetch all legacy purchases
        const purchasesResponse = await databases.listDocuments(DB_ID, 'purchases', [
            Query.orderDesc('createdAt'),
            Query.limit(3000)
        ]);

        // Fetch all new payments (Instamojo system)
        const paymentsResponse = await databases.listDocuments(DB_ID, 'payments', [
            Query.orderDesc('createdAt'),
            Query.limit(3000)
        ]);

        // Normalize legacy purchases
        const formattedPurchases = purchasesResponse.documents.map(doc => ({
            id: doc.$id,
            testId: doc.testId || doc.productName || 'Unknown',
            amount: doc.amount || 0,
            status: doc.status || 'pending',
            createdAt: doc.createdAt,
            type: 'legacy'
        }));

        // Normalize new payments (map 'Credit' to 'completed')
        const formattedPayments = paymentsResponse.documents.map(doc => ({
            id: doc.$id,
            testId: doc.productName || 'Payment',
            amount: doc.amount || 0,
            status: doc.status === 'Credit' ? 'completed' : (doc.status === 'Failed' ? 'failed' : doc.status),
            createdAt: doc.createdAt,
            type: 'instamojo'
        }));

        // Combine and sort by date descending
        const allTransactions = [...formattedPurchases, ...formattedPayments].sort((a, b) => b.createdAt - a.createdAt);

        return NextResponse.json(allTransactions);
    } catch (error) {
        console.error("Error fetching purchases:", error);
        return NextResponse.json({ error: "Failed to fetch purchases" }, { status: 500 });
    }
}
