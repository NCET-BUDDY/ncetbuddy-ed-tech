import { NextRequest, NextResponse } from "next/server";
import { getAdminPB } from "@/lib/pocketbase-server";

export async function GET() {
    try {
        const pb = await getAdminPB();
        const response = await pb.collection('withdrawal_requests').getList(1, 500, { sort: '-created' });
        return NextResponse.json(response.items);
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

        const pb = await getAdminPB();
        const response = await pb.collection('withdrawal_requests').update(id, { status });

        return NextResponse.json(response);
    } catch (error: any) {
        console.error("Admin Withdrawals PATCH Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
