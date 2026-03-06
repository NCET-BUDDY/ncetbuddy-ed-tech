"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";

export default function RefTracker() {
    const searchParams = useSearchParams();

    useEffect(() => {
        const refId = searchParams.get('ref');
        if (refId && typeof window !== 'undefined') {
            // Save referral ID for up to 30 days
            const expiry = new Date().getTime() + 30 * 24 * 60 * 60 * 1000;
            localStorage.setItem('affiliate_ref', JSON.stringify({ id: refId, expiry }));
        }
    }, [searchParams]);

    return null;
}
