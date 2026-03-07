import { NextRequest, NextResponse } from "next/server";

const INSTAMOJO_API_KEY = process.env.INSTAMOJO_API_KEY;
const INSTAMOJO_AUTH_TOKEN = process.env.INSTAMOJO_AUTH_TOKEN;
const INSTAMOJO_BASE_URL = "https://www.instamojo.com/api/1.1";

export async function POST(request: NextRequest) {
    try {
        const { testId, userId, amount, userName, userEmail, userPhone, affiliateId } = await request.json();

        if (!testId || !userId || amount === undefined || amount === null) {
            return NextResponse.json({ error: "Missing required fields: testId, userId, or amount" }, { status: 400 });
        }

        if (amount <= 0) {
            return NextResponse.json({ error: "Amount must be greater than 0" }, { status: 400 });
        }

        if (!INSTAMOJO_API_KEY || !INSTAMOJO_AUTH_TOKEN) {
            console.error("Missing Instamojo Configuration");
            return NextResponse.json({
                error: "Payment gateway not configured. Please contact administrator."
            }, { status: 500 });
        }

        const purposeString = affiliateId ? `NCET Ready Test|${userId}|${affiliateId}` : `NCET Ready Test|${userId}`;
        const payload = new URLSearchParams();
        payload.append('purpose', purposeString);
        payload.append('amount', amount.toString());
        if (userName) payload.append('buyer_name', userName);
        if (userEmail) payload.append('email', userEmail);
        if (userPhone) payload.append('phone', userPhone);

        // Use the request's origin to ensure the redirect goes back to the same domain
        // the user is currently on (e.g. www.ncetbuddy.in), not the Vercel preview URL.
        const origin = request.headers.get('origin') || request.headers.get('referer');
        const baseUrl = origin
            ? new URL(origin).origin
            : (process.env.NEXT_PUBLIC_APP_URL ||
                (process.env.NEXT_PUBLIC_VERCEL_URL ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}` : 'http://localhost:3000'));

        payload.append('redirect_url', `${baseUrl}/payment-success`);
        payload.append('webhook', `${baseUrl}/api/webhook/instamojo`);
        payload.append('send_email', 'False');
        payload.append('allow_repeated_payments', 'False');

        const paymentRequestResponse = await fetch(`${INSTAMOJO_BASE_URL}/payment-requests/`, {
            method: 'POST',
            headers: {
                'X-Api-Key': INSTAMOJO_API_KEY,
                'X-Auth-Token': INSTAMOJO_AUTH_TOKEN,
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: payload.toString()
        });

        const data = await paymentRequestResponse.json();

        if (!paymentRequestResponse.ok || !data.success || !data.payment_request?.longurl) {
            console.error("Instamojo Error:", data);
            return NextResponse.json({
                error: "Failed to create payment request",
                details: data
            }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            paymentUrl: data.payment_request.longurl
        });

    } catch (error: any) {
        console.error("Payment API Error:", error);
        return NextResponse.json({
            error: "Internal Server Error",
            details: error.message || error
        }, { status: 500 });
    }
}
