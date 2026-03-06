import { NextRequest, NextResponse } from "next/server";
import { databases, DB_ID } from "@/lib/server/appwrite-admin";
import { ID } from "node-appwrite";

const INSTAMOJO_API_KEY = process.env.INSTAMOJO_API_KEY;
const INSTAMOJO_AUTH_TOKEN = process.env.INSTAMOJO_AUTH_TOKEN;
const INSTAMOJO_ENDPOINT = process.env.INSTAMOJO_ENDPOINT || "https://test.instamojo.com/api/1.1/";

export async function POST(request: NextRequest) {
    try {
        const { testId, userId, userEmail, userName, userPhone } = await request.json();

        if (!testId || !userId) {
            return NextResponse.json({ error: "Missing testId or userId" }, { status: 400 });
        }

        // 1. Get Test Details (Admin Access to read price)
        let test;
        try {
            test = await databases.getDocument(DB_ID, 'tests', testId);
        } catch (e: any) {
            console.error("Error fetching test details:", e);
            // TEMPORARY DEBUGGING: Return full error to client
            return NextResponse.json({
                error: "Test fetch failed",
                details: e.message || e,
                debug: {
                    testId,
                    dbId: DB_ID,
                    projectId: process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID_STUDENT,
                    hasKey: !!process.env.APPWRITE_API_KEY
                }
            }, { status: 404 });
        }

        if (!test.price || test.price <= 0) {
            // AUTOMATIC ENROLLMENT FOR FREE TESTS
            try {
                const uniqueId = ID.unique();
                await databases.createDocument(DB_ID, 'purchases', uniqueId, {
                    userId,
                    testId,
                    paymentRequestId: `FREE-${uniqueId}`, // Required field in schema
                    amount: 0,
                    status: 'completed',
                    createdAt: Math.floor(Date.now() / 1000)
                });

                return NextResponse.json({
                    success: true,
                    isFree: true,
                    message: "Test is free, access granted automatically."
                });
            } catch (dbError: any) {
                console.error("Failed to create free purchase record:", dbError);
                return NextResponse.json({
                    error: "Database error during auto-enrollment",
                    details: dbError.message || dbError
                }, { status: 500 });
            }
        }

        // 2. Validate Instamojo Config
        if (!INSTAMOJO_API_KEY || !INSTAMOJO_AUTH_TOKEN) {
            throw new Error(`Missing Instamojo Configuration. Key present: ${!!INSTAMOJO_API_KEY}, Token present: ${!!INSTAMOJO_AUTH_TOKEN}`);
        }

        // 3. Create Payment Request on Instamojo
        // 3. Create Payment Request on Instamojo
        const payload = new URLSearchParams();
        payload.append('purpose', `Purchase Test: ${test.title}`);
        payload.append('amount', test.price.toString());
        payload.append('buyer_name', userName || 'Student');
        payload.append('email', userEmail || '');
        payload.append('phone', userPhone || '');
        payload.append('redirect_url', `${process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_VERCEL_URL ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}` : 'http://localhost:3000'}/api/payment/callback`);
        payload.append('send_email', 'False'); // Per user guide
        payload.append('webhook', `${process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_VERCEL_URL ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}` : 'http://localhost:3000'}/api/payment/webhook`);
        payload.append('allow_repeated_payments', 'False');

        const response = await fetch(`${INSTAMOJO_ENDPOINT}payment-requests/`, {
            method: 'POST',
            headers: {
                'X-Api-Key': INSTAMOJO_API_KEY!,
                'X-Auth-Token': INSTAMOJO_AUTH_TOKEN!,
            },
            body: payload
        });

        const data = await response.json();

        if (!data.success) {
            console.error("Instamojo Error:", data);
            return NextResponse.json({
                error: "Failed to create payment request",
                details: data,
                debug: {
                    hasApiKey: !!process.env.INSTAMOJO_API_KEY,
                    hasAuthToken: !!process.env.INSTAMOJO_AUTH_TOKEN,
                    endpointUsed: process.env.INSTAMOJO_ENDPOINT || "default",
                    urlAttempted: `${INSTAMOJO_ENDPOINT}payment-requests/`
                }
            }, { status: 500 });
        }

        const paymentRequest = data.payment_request;

        // 3. Create 'Pending' Purchase Record in Database (Admin Access)
        try {
            await databases.createDocument(DB_ID, 'purchases', ID.unique(), {
                userId,
                testId,
                paymentRequestId: paymentRequest.id,
                amount: test.price,
                status: 'pending',
                createdAt: Math.floor(Date.now() / 1000)
            });
        } catch (dbError) {
            console.error("Failed to create purchase record in DB:", dbError);
            return NextResponse.json({ error: "Database error" }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            paymentUrl: `${paymentRequest.longurl}?embed=form` // Enable Light Checkout
        });

    } catch (error: any) {
        console.error("Payment API Error:", error);
        return NextResponse.json({
            error: "Internal Server Error",
            details: error.message || error,
            debug: {
                hasApiKey: !!process.env.INSTAMOJO_API_KEY,
                hasAuthToken: !!process.env.INSTAMOJO_AUTH_TOKEN,
                endpointUsed: process.env.INSTAMOJO_ENDPOINT || "default",
                urlAttempted: `${INSTAMOJO_ENDPOINT}payment-requests/`
            },
            stack: error.stack
        }, { status: 500 });
    }
}
