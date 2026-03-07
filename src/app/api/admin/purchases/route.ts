import { NextRequest, NextResponse } from "next/server";
import { databases, DB_ID } from "@/lib/server/appwrite-admin";
import { Query } from "node-appwrite";

export async function GET(request: NextRequest) {
    try {
        // Fetch collections individually with error handling to prevent total failure
        let purchasesDocs: any[] = [];
        let paymentsDocs: any[] = [];

        try {
            const purchasesResponse = await databases.listDocuments(DB_ID, 'purchases', [
                Query.orderDesc('createdAt'),
                Query.limit(500)
            ]);
            purchasesDocs = purchasesResponse.documents;
        } catch (e) {
            console.error("Failed to fetch legacy purchases:", e);
        }

        try {
            const paymentsResponse = await databases.listDocuments(DB_ID, 'payments', [
                Query.orderDesc('createdAt'),
                Query.limit(500)
            ]);
            paymentsDocs = paymentsResponse.documents;
        } catch (e) {
            console.error("Failed to fetch new payments:", e);
        }

        // Fetch users to map emails - Wrap in try/catch
        const userMap: Record<string, string> = {};
        try {
            const [usersResponse, userProfilesResponse] = await Promise.all([
                databases.listDocuments(DB_ID, 'users', [Query.limit(500)]).catch(() => ({ documents: [] })),
                databases.listDocuments(DB_ID, 'user_profiles', [Query.limit(500)]).catch(() => ({ documents: [] }))
            ]);

            const allUserDocs = [...(usersResponse.documents || []), ...(userProfilesResponse.documents || [])];
            allUserDocs.forEach((doc: any) => {
                if (doc.email) userMap[doc.$id] = doc.email;
            });
        } catch (e) {
            console.error("Non-critical: Failed to fetch user emails", e);
        }

        // Normalize legacy purchases
        const formattedPurchases = purchasesDocs.map(doc => ({
            id: doc.$id,
            email: userMap[doc.userId] || 'Unknown User',
            testId: doc.testId || doc.productName || 'Unknown',
            amount: Number(doc.amount) || 0,
            status: doc.status || 'pending',
            createdAt: doc.createdAt,
            type: 'legacy'
        }));

        // Normalize new payments (map 'Credit' to 'completed')
        const formattedPayments = paymentsDocs.map(doc => ({
            id: doc.$id,
            email: userMap[doc.userId] || 'Unknown User',
            testId: doc.productName || 'Payment',
            amount: Number(doc.amount) || 0,
            status: doc.status === 'Credit' ? 'completed' : (doc.status === 'Failed' ? 'failed' : doc.status),
            createdAt: doc.createdAt,
            type: 'instamojo'
        }));

        // Combine and sort by date descending
        const allTransactions = [...formattedPurchases, ...formattedPayments].sort((a, b) => b.createdAt - a.createdAt);

        return NextResponse.json(allTransactions);
    } catch (error: any) {
        console.error("Fatal API Error (Purchases):", error);
        return NextResponse.json({ error: error.message || "Failed to fetch purchases" }, { status: 500 });
    }
}
