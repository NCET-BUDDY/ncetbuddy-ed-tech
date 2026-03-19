import { NextResponse } from 'next/server';
import { databases, DB_ID } from '@/lib/server/appwrite-admin';
import { Query } from 'node-appwrite';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');
        const productName = searchParams.get('productName');

        if (!userId || !productName) {
            return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
        }

        // 1. Check if user is granted premium access directly
        try {
            const profileDoc = await databases.getDocument(DB_ID, 'user_profiles', userId);
            if (profileDoc.premiumStatus === true) {
                return NextResponse.json({ hasAccess: true, source: 'admin_grant' });
            }
        } catch (e) {
            // Fallback to legacy 'users' collection
            try {
                const legacyDoc = await databases.getDocument(DB_ID, 'users', userId);
                if (legacyDoc.premiumStatus === true) {
                    return NextResponse.json({ hasAccess: true, source: 'admin_grant' });
                }
            } catch (e2) {
                // Ignore and proceed
            }
        }

        // 2. Fallback: check actual payment records
        
        // Special logic for NRT: If product is NRT-related, ANY NRT purchase unlocks ALL NRT tests
        const isNRT = productName.toUpperCase().includes('NRT');
        
        const queries = [
            Query.equal('userId', userId),
            Query.equal('status', 'Credit')
        ];

        if (!isNRT) {
            queries.push(Query.equal('productName', productName));
        }

        const response = await databases.listDocuments(DB_ID, 'payments', queries);

        if (isNRT) {
            // Filter results to find ANY NRT payment if requested product is NRT
            const hasAnyNRTPayment = response.documents.some(doc => 
                (doc.productName || "").toUpperCase().includes('NRT')
            );
            return NextResponse.json({ hasAccess: hasAnyNRTPayment });
        }

        return NextResponse.json({ hasAccess: response.documents.length > 0 });
    } catch (error: any) {
        console.error("API Error (Check Payment):", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
