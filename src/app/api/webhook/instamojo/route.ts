import { NextRequest, NextResponse } from "next/server";
import { createPaymentRecord } from "@/lib/appwrite-db";
import crypto from 'crypto';

export async function POST(request: NextRequest) {
    try {
        const contentType = request.headers.get("content-type") || "";

        // Instamojo sends data as application/x-www-form-urlencoded
        if (!contentType.includes("application/x-www-form-urlencoded")) {
            return NextResponse.json({ error: "Invalid content-type" }, { status: 400 });
        }

        const formData = await request.formData();
        const data: Record<string, string> = {};

        // Convert FormData to object for MAC calculation
        formData.forEach((value, key) => {
            data[key] = value.toString();
        });

        const salt = process.env.INSTAMOJO_SALT;
        const macProvided = data.mac;

        if (!salt) {
            console.error("INSTAMOJO_SALT not defined in environment variables");
            return NextResponse.json({ error: "Server Configuration Error" }, { status: 500 });
        }

        // 1. Verify MAC (Message Authentication Code)
        // Sort keys alphabetically (Case-Insensitive as per Instamojo docs)
        const keys = Object.keys(data)
            .filter(k => k !== 'mac')
            .sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));

        const message = keys.map(k => `${data[k]}`).join('|');

        const generatedMac = crypto.createHmac('sha1', salt)
            .update(message)
            .digest('hex');

        if (generatedMac !== macProvided) {
            console.error("Invalid MAC address - potential tampering");
            return NextResponse.json({ error: "Invalid MAC" }, { status: 400 });
        }

        // 2. Process Payment Status
        const paymentId = data.payment_id;
        const paymentRequestId = data.payment_request_id;
        const status = data.status; // 'Credit' or 'Failed'
        const amount = parseFloat(data.amount);
        const purpose = data.purpose; // E.g., "NCET Ready Test:USER_ID"

        console.log(`Webhook Received: Payment ${paymentId} for Request ${paymentRequestId} is ${status}`);

        // We embed userId in the purpose string during creation to extract it safely here
        // fallback to extracting from purpose if we structured it as "Product Name|userId"
        let userId = "UNKNOWN";
        let productName = purpose;

        if (purpose && purpose.includes("|")) {
            const parts = purpose.split("|");
            productName = parts[0];
            userId = parts[1];
        }

        // 3. Write securely to database
        if (status === 'Credit') {
            await createPaymentRecord({
                userId: userId,
                paymentId: paymentId,
                paymentRequestId: paymentRequestId,
                amount: amount,
                status: status,
                productName: productName,
                createdAt: Math.floor(Date.now() / 1000)
            });
        }

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error("Webhook Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
