import { NextResponse } from 'next/server';
import { getAdminPB } from '@/lib/pocketbase-server';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');
        const productName = searchParams.get('productName');

        if (!userId || !productName) {
            return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
        }

        const pb = await getAdminPB();

        // 1. Check if user is granted premium access directly
        try {
            const userDoc = await pb.collection('users').getOne(userId);
            if (userDoc.premiumStatus === true) {
                return NextResponse.json({ hasAccess: true, source: 'admin_grant' });
            }
        } catch (e) {
            // Ignore
        }

        // 2. Fallback: check actual payment records
        const isNRT = productName.toUpperCase().includes('NRT');
        const filterStr = isNRT ? `userId = "${userId}" && status = "Credit"` : `userId = "${userId}" && status = "Credit" && productName = "${productName}"`;

        const response = await pb.collection('payments').getList(1, 100, { filter: filterStr });

        if (isNRT) {
            const hasAnyNRTPayment = response.items.some((doc: any) => 
                (doc.productName || "").toUpperCase().includes('NRT')
            );
            return NextResponse.json({ hasAccess: hasAnyNRTPayment });
        }

        return NextResponse.json({ hasAccess: response.items.length > 0 });
    } catch (error: any) {
        console.error("API Error (Check Payment):", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
