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

        const response = await databases.listDocuments(DB_ID, 'payments', [
            Query.equal('userId', userId),
            Query.equal('productName', productName),
            Query.equal('status', 'Credit')
        ]);

        return NextResponse.json({ hasAccess: response.documents.length > 0 });
    } catch (error: any) {
        console.error("API Error (Check Payment):", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
