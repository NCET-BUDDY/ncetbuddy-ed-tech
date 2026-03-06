import { Suspense } from 'react';
import PaymentSuccessHandler from './PaymentSuccessHandler';

export default function PaymentSuccessPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-background"><div className="text-xl font-bold">Processing payment...</div></div>}>
            <PaymentSuccessHandler />
        </Suspense>
    );
}
