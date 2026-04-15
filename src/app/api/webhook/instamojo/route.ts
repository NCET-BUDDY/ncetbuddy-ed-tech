import { NextRequest, NextResponse } from "next/server";
import { getAdminPB } from "@/lib/pocketbase-server";
import crypto from 'crypto';

export async function POST(request: NextRequest) {
    try {
        const contentType = request.headers.get("content-type") || "";

        if (!contentType.includes("application/x-www-form-urlencoded")) {
            return NextResponse.json({ error: "Invalid content-type" }, { status: 400 });
        }

        const formData = await request.formData();
        const data: Record<string, string> = {};

        formData.forEach((value, key) => {
            data[key] = value.toString();
        });

        const salt = process.env.INSTAMOJO_SALT;
        const macProvided = data.mac;

        if (!salt) {
            console.error("INSTAMOJO_SALT not defined");
            return NextResponse.json({ error: "Server Configuration Error" }, { status: 500 });
        }

        const keys = Object.keys(data).filter(k => k !== 'mac').sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));
        const message = keys.map(k => `${data[k]}`).join('|');
        const generatedMac = crypto.createHmac('sha1', salt).update(message).digest('hex');

        if (generatedMac !== macProvided) {
            return NextResponse.json({ error: "Invalid MAC" }, { status: 400 });
        }

        const paymentId = data.payment_id;
        const paymentRequestId = data.payment_request_id;
        const status = data.status; 
        const amount = parseFloat(data.amount);
        const purpose = data.purpose;

        let userId = "UNKNOWN";
        let productName = purpose;
        let affiliateId = null;

        if (purpose && purpose.includes("|")) {
            const parts = purpose.split("|");
            productName = parts[0];
            userId = parts[1];
            if (parts.length > 2) affiliateId = parts[2];
        }

        const pb = await getAdminPB();

        if (status === 'Credit') {
            await pb.collection('payments').create({
                userId: userId,
                paymentId: paymentId,
                paymentRequestId: paymentRequestId,
                amount: amount,
                status: status,
                productName: productName,
                createdAt: Math.floor(Date.now() / 1000)
            });

            if (affiliateId && affiliateId !== userId) {
                const commission = amount * 0.25;
                try {
                    await pb.collection('affiliate_earnings').create({
                        affiliateId: affiliateId,
                        amount: commission,
                        status: 'pending',
                        referredUserId: userId,
                        purchaseId: paymentId,
                        createdAt: Math.floor(Date.now() / 1000)
                    });
                } catch (e) {}
            }

            try {
                await pb.collection('users').update(userId, { premiumStatus: true });
            } catch (e) { }
        }

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error("Webhook Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
