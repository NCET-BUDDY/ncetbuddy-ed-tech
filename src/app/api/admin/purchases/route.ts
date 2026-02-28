import { NextRequest, NextResponse } from "next/server";
import { databases, DB_ID } from "@/lib/server/appwrite-admin";
import { Query } from "node-appwrite";

export async function GET(request: NextRequest) {
    try {
        // Fetch all purchases (limit to 5000 for analytics aggregation)
        const response = await databases.listDocuments(DB_ID, 'purchases', [
            Query.orderDesc('createdAt'),
            Query.limit(5000)
        ]);

        return NextResponse.json(response.documents);
    } catch (error) {
        console.error("Error fetching purchases:", error);
        return NextResponse.json({ error: "Failed to fetch purchases" }, { status: 500 });
    }
}
