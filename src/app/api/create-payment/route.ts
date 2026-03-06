import { NextRequest, NextResponse } from "next/server";

const INSTAMOJO_CLIENT_ID = process.env.INSTAMOJO_CLIENT_ID;
const INSTAMOJO_CLIENT_SECRET = process.env.INSTAMOJO_CLIENT_SECRET;
// The Direct API framework usually targets api.instamojo.com in prod, and test.instamojo.com in sandbox. 
// Standard API version uses api/1.1/ but OAuth token generation uses /oauth2/token/
const INSTAMOJO_BASE_URL = "https://api.instamojo.com";

export async function POST(request: NextRequest) {
    try {
        const { testId, userId, amount, userName, userEmail, userPhone } = await request.json();

        if (!testId || !userId || !amount) {
            return NextResponse.json({ error: "Missing required fields: testId, userId, or amount" }, { status: 400 });
        }

        if (amount <= 0) {
            return NextResponse.json({ error: "Amount must be greater than 0" }, { status: 400 });
        }

        // Validate Instamojo Config
        if (!INSTAMOJO_CLIENT_ID || !INSTAMOJO_CLIENT_SECRET) {
            console.error("Missing Instamojo Configuration");
            return NextResponse.json({
                error: "Payment gateway not configured. Please contact administrator."
            }, { status: 500 });
        }

        // --- STEP 1: Get OAuth Access Token ---
        const tokenPayload = new URLSearchParams();
        tokenPayload.append('grant_type', 'client_credentials');
        tokenPayload.append('client_id', INSTAMOJO_CLIENT_ID);
        tokenPayload.append('client_secret', INSTAMOJO_CLIENT_SECRET);

        const tokenResponse = await fetch(`${INSTAMOJO_BASE_URL}/oauth2/token/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: tokenPayload.toString()
        });

        const tokenData = await tokenResponse.json();

        if (!tokenResponse.ok || !tokenData.access_token) {
            console.error("Instamojo Auth Error:", tokenData);
            return NextResponse.json({ error: "Failed to authenticate with payment gateway" }, { status: 500 });
        }

        const accessToken = tokenData.access_token;

        // --- STEP 2: Create Payment Request ---
        const purposeString = `NCET Ready Test|${userId}`;
        const payload = new URLSearchParams();
        payload.append('purpose', purposeString);
        payload.append('amount', amount.toString());
        if (userName) payload.append('buyer_name', userName);
        if (userEmail) payload.append('email', userEmail);
        if (userPhone) payload.append('phone', userPhone);

        const baseUrl = process.env.NEXT_PUBLIC_APP_URL ||
            (process.env.NEXT_PUBLIC_VERCEL_URL ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}` : 'http://localhost:3000');

        payload.append('redirect_url', `${baseUrl}/payment-success`);
        payload.append('webhook', `${baseUrl}/api/webhook/instamojo`);
        payload.append('send_email', 'False');
        payload.append('allow_repeated_payments', 'False');

        // Note: For OAuth, the endpoint is usually /v2/payment_requests/
        const paymentRequestResponse = await fetch(`${INSTAMOJO_BASE_URL}/v2/payment_requests/`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: payload.toString()
        });

        const data = await paymentRequestResponse.json();

        // v2 API structural check
        if (!paymentRequestResponse.ok || (!data.id && !data.payment_request?.id)) {
            console.error("Instamojo Error:", data);
            return NextResponse.json({
                error: "Failed to create payment request",
                details: data
            }, { status: 500 });
        }

        const paymentRequest = data.payment_request;

        return NextResponse.json({
            success: true,
            paymentUrl: paymentRequest.longurl
        });

    } catch (error: any) {
        console.error("Payment API Error:", error);
        return NextResponse.json({
            error: "Internal Server Error",
            details: error.message || error
        }, { status: 500 });
    }
}
