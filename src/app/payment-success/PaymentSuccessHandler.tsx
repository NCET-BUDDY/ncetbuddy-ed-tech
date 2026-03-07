"use client";

import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useState, useEffect } from 'react';
// Removed unused import
import { Loader2, CheckCircle, XCircle } from 'lucide-react';

export default function PaymentSuccessHandler() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();

    const [status, setStatus] = useState<'loading' | 'success' | 'failed' | 'processing'>('processing');
    const [errorMessage, setErrorMessage] = useState("");

    useEffect(() => {
        const processPayment = async () => {
            if (authLoading) return; // Wait for auth

            if (!user) {
                setStatus('failed');
                setErrorMessage("You must be logged in to process this payment.");
                return;
            }

            const paymentId = searchParams.get('payment_id');
            const paymentRequestId = searchParams.get('payment_request_id');
            const paymentStatus = searchParams.get('payment_status'); // 'Credit' or 'Failed'

            if (!paymentId || !paymentRequestId || !paymentStatus) {
                setStatus('failed');
                setErrorMessage("Invalid payment callback parameters.");
                return;
            }

            // For redirect success, Instamojo does not always append 'purpose' to the redirect URL natively, 
            // but we can enforce the hardcoded string here since this is explicitly the 'NCET Ready Test' purchase flow in the frontend.
            // The Webhook handles the actual dynamic parsing of the purpose string.
            if (paymentStatus === 'Credit') {
                try {
                    // Try to save the payment record to Appwrite safely via the backend
                    await fetch('/api/user/verify-payment', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            userId: user.$id,
                            paymentId: paymentId,
                            paymentRequestId: paymentRequestId,
                            amount: 0, // Handled properly by webhook
                            status: paymentStatus,
                            productName: "NCET Ready Test",
                            createdAt: Math.floor(Date.now() / 1000)
                        })
                    });

                    setStatus('success');
                } catch (error) {
                    console.error("Error saving payment:", error);
                    setStatus('failed');
                    setErrorMessage("Payment was successful, but we failed to record it. Please contact support.");
                }
            } else {
                setStatus('failed');
                setErrorMessage("Payment failed or was cancelled.");
            }
        };

        processPayment();
    }, [searchParams, user, authLoading, router]);

    if (authLoading || status === 'processing') {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4 text-center space-y-4">
                <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
                <h1 className="text-2xl font-bold">Processing your payment...</h1>
                <p className="text-foreground/70">Please do not close or refresh this page.</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
            <div className="max-w-md w-full p-8 text-center space-y-6">
                {status === 'success' ? (
                    <>
                        <CheckCircle className="h-20 w-20 text-green-500 mx-auto" />
                        <h1 className="text-3xl font-bold text-foreground">Payment Successful!</h1>
                        <p className="text-foreground/70">
                            Thank you for your purchase. Your NCET Ready Test is now unlocked.
                        </p>
                        <div className="pt-4">
                            <button
                                onClick={() => router.push('/dashboard/tests')}
                                className="w-full py-3 bg-primary text-black font-bold rounded-lg hover:bg-primary/90 transition-colors"
                            >
                                Go to My Tests
                            </button>
                        </div>
                    </>
                ) : (
                    <>
                        <XCircle className="h-20 w-20 text-red-500 mx-auto" />
                        <h1 className="text-3xl font-bold text-foreground">Payment Failed</h1>
                        <p className="text-foreground/70">
                            {errorMessage || "We couldn't process your payment. Please try again."}
                        </p>
                        <div className="pt-4 flex gap-4">
                            <button
                                onClick={() => router.push('/dashboard/tests')}
                                className="flex-1 py-3 border-2 border-primary text-primary font-bold rounded-lg hover:bg-primary/10 transition-colors"
                            >
                                Return
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
