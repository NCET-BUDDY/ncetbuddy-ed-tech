import { NextRequest, NextResponse } from "next/server";
import { databases, DB_ID } from "@/lib/server/appwrite-admin";
import { Query } from "node-appwrite";

export async function GET() {
    try {
        const response = await databases.listDocuments(DB_ID, 'withdrawal_requests', [
            Query.orderDesc('createdAt'),
            Query.limit(500)
        ]);

        return NextResponse.json(response.documents);
    } catch (error: any) {
        console.error("Admin Withdrawals GET Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PATCH(req: NextRequest) {
    try {
        const { id, status } = await req.json();

        if (!id || !status) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const response = await databases.updateDocument(
            DB_ID,
            'withdrawal_requests',
            id,
            { status }
        );

        return NextResponse.json(response);
    } catch (error: any) {
        console.error("Admin Withdrawals PATCH Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
