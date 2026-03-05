"use client";

/**
 * BUSINESS MODEL NOTES:
 * 
 * 1. PYQ (Previous Year Questions):
 *    - Platform-owned content
 *    - Always FREE for all users
 *    - Categorized by 5 subjects: Languages, Humanities, Science, Commerce, Non-Domain
 *    - No premium checks required
 * 
 * 2. Educator Mock Tests:
 *    - Educator-owned content
 *    - Premium-gated (future implementation)
 *    - Currently shows empty state: "No educator enrolled yet"
 *    - DO NOT show DEMO_TEST here
 * 
 * This separation is intentional for business model clarity.
 */

import { Card } from "@/components/ui/Card";
import Link from "next/link";
import { PYQSubject, Test, Purchase } from "@/types";
import { useEffect, useState } from "react";
import { getTests, getUserPurchases } from "@/lib/appwrite-db";
import { useAuth } from "@/context/AuthContext";
import { useRouter, useSearchParams } from "next/navigation";
import { PenLine, BookOpen, Microscope, Briefcase, Target, GraduationCap, Users } from "lucide-react";

const PYQ_SUBJECTS: { id: PYQSubject; label: string; icon: React.ReactNode; description: string }[] = [
    { id: 'languages', label: 'Languages', icon: <PenLine size={36} />, description: 'English, Hindi & Regional' },
    { id: 'humanities', label: 'Humanities', icon: <BookOpen size={36} />, description: 'History, Geography & More' },
    { id: 'science', label: 'Science', icon: <Microscope size={36} />, description: 'Physics, Chemistry, Biology, Maths' },
    { id: 'commerce', label: 'Commerce', icon: <Briefcase size={36} />, description: 'Economics, Accounts & Business' },
    { id: 'non-domain', label: 'Non-Domain', icon: <Target size={36} />, description: 'General Knowledge & Aptitude' }
];

function EducatorTestsList() {
    const { user } = useAuth();
    const [tests, setTests] = useState<Test[]>([]);
    const [purchases, setPurchases] = useState<Purchase[]>([]);
    const [loading, setLoading] = useState(true);
    const [purchasingId, setPurchasingId] = useState<string | null>(null);
    const router = useRouter();
    const searchParams = useSearchParams();

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch all tests
                const allTests = await getTests();
                // Filter for educator tests (assuming logic: price > 0 OR distinct type)
                // For now, let's assume any test with price > 0 is premium or testType 'educator'
                const premiumTests = allTests.filter(t => (t.price && t.price > 0) || t.testType === 'educator');
                setTests(premiumTests);

                if (user) {
                    const userPurchases = await getUserPurchases(user.$id);
                    setPurchases(userPurchases);
                }
            } catch (error) {
                console.error("Failed to fetch aggregator data", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [user]);

    // Check for success/failure params
    useEffect(() => {
        const success = searchParams.get('success');
        if (success === 'true') {
            alert("Payment Successful! You can now access the test.");
            // Remove params
            router.replace('/dashboard/tests');
            // Refresh purchases
            if (user) getUserPurchases(user.$id).then(setPurchases);
        } else if (success === 'false') {
            alert("Payment Failed. Please try again.");
            router.replace('/dashboard/tests');
        }
    }, [searchParams, user, router]);


    const handleBuyNow = async (test: Test) => {
        if (!user) {
            alert("Please login to purchase");
            return;
        }

        setPurchasingId(test.id);

        try {
            const res = await fetch('/api/payment/instamojo', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    testId: test.id,
                    userId: user.$id,
                    userEmail: user.email,
                    userName: user.name,
                    userPhone: user.phone || ''
                })
            });

            const data = await res.json();

            if (data.success && data.paymentUrl) {
                window.location.href = data.paymentUrl; // Redirect to Instamojo
            } else {
                console.error("Payment Error Data:", data);
                // TEMPORARY DEBUGGING: Show full error details in alert
                const errorMsg = data.details
                    ? `Error: ${data.error}\nDetails: ${typeof data.details === 'object' ? JSON.stringify(data.details, null, 2) : data.details}\nDebug: ${JSON.stringify(data.debug, null, 2)}`
                    : (data.error || "Payment initiation failed");

                alert(errorMsg);
                setPurchasingId(null);
            }
        } catch (error) {
            console.error("Purchase error:", error);
            alert("Something went wrong");
            setPurchasingId(null);
        }
    };

    if (loading) return <div className="text-center py-8">Loading available tests...</div>;

    if (tests.length === 0) {
        // Fallback to empty state
        return (
            <div className="text-center py-16 bg-white rounded-2xl border-2 border-black">
                <div className="text-5xl mb-4"><Users size={52} className="mx-auto text-black/30" /></div>
                <h3 className="text-lg font-bold text-foreground mb-2">
                    No educator mock tests available yet.
                </h3>
                <p className="text-foreground/70 font-medium text-sm">
                    Check back later!
                </p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tests.map(test => {
                const isPurchased = purchases.some(p => p.testId === test.id && p.status === 'completed');

                return (
                    <Card key={test.id} className="group hover:border-primary/50 transition-all duration-300 shadow-lg h-full flex flex-col">
                        <div className="flex flex-col h-full">
                            <div className="flex items-center justify-between mb-4">
                                <GraduationCap size={40} className="text-primary" />
                                <span className="px-3 py-1 text-xs font-bold text-white bg-green-600 rounded-full">
                                    ₹{test.price || 'PAID'}
                                </span>
                            </div>

                            <h3 className="text-xl font-bold text-foreground mb-2">
                                {test.title}
                            </h3>
                            <p className="text-foreground/70 text-sm font-medium mb-4 line-clamp-2">
                                {test.description || "Premium verification mock test."}
                            </p>

                            <div className="mt-auto pt-4 border-t border-border">
                                {isPurchased ? (
                                    <Link href={`/dashboard/tests/${test.id}`}>
                                        <button className="w-full py-2 bg-primary text-black font-bold rounded-lg hover:bg-primary/90">
                                            Start Test
                                        </button>
                                    </Link>
                                ) : (
                                    <button
                                        onClick={() => handleBuyNow(test)}
                                        disabled={purchasingId === test.id}
                                        className="w-full py-2 bg-black text-white font-bold rounded-lg hover:bg-gray-800 disabled:opacity-50"
                                    >
                                        {purchasingId === test.id ? 'Processing...' : 'Buy Now'}
                                    </button>
                                )}
                            </div>
                        </div>
                    </Card>
                );
            })}
        </div>
    );
}

export default function TestsPage() {
    return (
        <div className="space-y-12">
            {/* Page Header */}
            <div>
                <h1 className="text-3xl font-bold text-foreground">Mock Tests</h1>
                <p className="text-foreground mt-1 font-medium">Official mock tests created by educators</p>
            </div>

            {/* SECTION: EDUCATOR MOCK TESTS (PREMIUM) */}
            <section className="space-y-6">
                <EducatorTestsList />
            </section>
        </div>
    );
}
