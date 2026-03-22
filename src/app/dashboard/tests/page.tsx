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
import { getTests, hasUserPaidForProduct, getUserPayments, getUserProfile } from "@/lib/appwrite-db";
import { useAuth } from "@/context/AuthContext";
import { useRouter, useSearchParams } from "next/navigation";
import { PenLine, BookOpen, Microscope, Briefcase, Target, GraduationCap, Users } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";

const PYQ_SUBJECTS: { id: PYQSubject; label: string; icon: React.ReactNode; description: string }[] = [
    { id: 'languages', label: 'Languages', icon: <PenLine size={36} />, description: 'English, Hindi & Regional' },
    { id: 'humanities', label: 'Humanities', icon: <BookOpen size={36} />, description: 'History, Geography & More' },
    { id: 'science', label: 'Science', icon: <Microscope size={36} />, description: 'Physics, Chemistry, Biology, Maths' },
    { id: 'commerce', label: 'Commerce', icon: <Briefcase size={36} />, description: 'Economics, Accounts & Business' },
    { id: 'non-domain', label: 'Non-Domain', icon: <Target size={36} />, description: 'General Knowledge & Aptitude' }
];

const DOMAIN_OPTIONS = [
    { id: 'Science', label: 'Science', description: 'Physics, Chemistry, Biology, Maths' },
    { id: 'Humanities', label: 'Humanities', description: 'History, Geography, Political Science' },
    { id: 'Commerce', label: 'Commerce', description: 'Economics, Accounts, Business Studies' }
];

function EducatorTestsList() {
    const { user } = useAuth();
    const [tests, setTests] = useState<Test[]>([]);
    const [purchasedTests, setPurchasedTests] = useState<Record<string, boolean>>({});
    const [loading, setLoading] = useState(true);
    const [purchasingId, setPurchasingId] = useState<string | null>(null);
    const router = useRouter();
    const searchParams = useSearchParams();

    const [selectedDomain, setSelectedDomain] = useState<string | null>(null);
    const [showDomainModal, setShowDomainModal] = useState(false);
    const [tempDomain, setTempDomain] = useState<string>("");

    useEffect(() => {
        // Only run on client
        if (typeof window !== 'undefined') {
            const storedDomain = localStorage.getItem('selected_nrt_domain');
            if (storedDomain) {
                setSelectedDomain(storedDomain);
            } else {
                setShowDomainModal(true);
            }
        }
    }, []);

    const handleDomainSubmit = () => {
        if (!tempDomain) {
            alert("Please select a domain to continue");
            return;
        }
        localStorage.setItem('selected_nrt_domain', tempDomain);
        setSelectedDomain(tempDomain);
        setShowDomainModal(false);
        window.dispatchEvent(new Event('domainChanged'));
    };

    const handleResetDomain = () => {
        localStorage.removeItem('selected_nrt_domain');
        setSelectedDomain(null);
        setTempDomain("");
        setShowDomainModal(true);
        window.dispatchEvent(new Event('domainChanged'));
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch all tests
                const allTests = await getTests();
                // Filter for educator tests (assuming logic: price > 0 OR distinct type)
                // For now, let's assume any test with price > 0 is premium or testType 'educator'
                const premiumTests = allTests.filter(t => 
                    (t.price && t.price > 0) || 
                    t.testType === 'educator' || 
                    t.title.toUpperCase().includes('NRT')
                );
                setTests(premiumTests);

                if (user) {
                    // Optimized: Fetch all payments once
                    const [payments, profile] = await Promise.all([
                        getUserPayments(user.$id),
                        getUserProfile(user.$id)
                    ]);
                    
                    const successfulPayments = payments.filter((p: any) => p.status === 'Credit');
                    const purchasedProductNames = new Set(successfulPayments.map((p: any) => p.productName));
                    const hasAnyNRTPurchase = successfulPayments.some((p: any) => 
                        (p.productName || "").toUpperCase().includes('NRT')
                    );
                    
                    const isAdmin = (profile as any)?.role === 'admin';
                    const hasGlobalPremium = (profile as any)?.premiumStatus === true;

                    const purchasedMap: Record<string, boolean> = {};
                    const filteredTests = premiumTests.filter(test => {
                        const isNRT = test.title.toUpperCase().includes('NRT');
                        const isNRT1 = test.title.toUpperCase().includes('NRT 1') || test.title.toUpperCase() === 'NRT 1';
                        const isNRTDemo = test.title.toUpperCase().includes('NRT DEMO');
                        
                        // Access rules:
                        const hasDirectPurchase = purchasedProductNames.has(test.title) || 
                                               (test.series && purchasedProductNames.has(test.series));
                        
                        const unlockedByBundle = isNRT && hasAnyNRTPurchase;
                        
                        // Domain-specific free access for NRT DEMO
                        const isProfileScience = (profile as any)?.stream === 'Science';
                        const isNRTDemoFree = isNRTDemo && isProfileScience;
                        
                        purchasedMap[test.id] = isAdmin || 
                                              hasGlobalPremium || 
                                              hasDirectPurchase || 
                                              unlockedByBundle ||
                                              isNRTDemoFree;

                        // Visibility rule:
                        // 1. If not NRT, pulse through (handled by next filter)
                        // 2. If NRT:
                        //    - Include in 'tests' state if it matches a possible NRT test.
                        //    - The RENDER filter below handles domain-specific visibility from localStorage.
                        if (!isNRT) return true;
                        
                        // Include NRT 1, NRT DEMO, and anything purchased/admin in state
                        // We filter strictly in render because selectedDomain is there.
                        return isNRT1 || isNRTDemo || purchasedMap[test.id] || isAdmin;
                    });

                    setTests(filteredTests);
                    setPurchasedTests(purchasedMap);
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
            // Hard refresh to reload state instead of manual map update for simplicity
            window.location.reload();
        } else if (success === 'false') {
            alert("Payment Failed. Please try again.");
            router.replace('/dashboard/tests');
        }
    }, [searchParams, router]);


    const handleBuyNow = async (test: Test) => {
        if (!user) {
            alert("Please login to purchase");
            return;
        }

        setPurchasingId(test.id);

        // FREE TEST: Skip payment, go directly to test
        if (!test.price || test.price <= 0) {
            router.push(`/dashboard/tests/${test.id}`);
            setPurchasingId(null);
            return;
        }

        let affiliateId = undefined;
        try {
            const stored = localStorage.getItem('affiliate_ref');
            if (stored) {
                const parsed = JSON.parse(stored);
                if (parsed.expiry > Date.now()) {
                    affiliateId = parsed.id;
                } else {
                    localStorage.removeItem('affiliate_ref');
                }
            }
        } catch (e) {
            console.error(e);
        }

        try {
            const res = await fetch('/api/create-payment', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    testId: test.id,
                    seriesName: test.series || test.title,
                    userId: user.$id,
                    amount: test.price || 0,
                    userEmail: user.email,
                    userName: user.name,
                    userPhone: user.phone || '',
                    affiliateId,
                    clientOrigin: window.location.origin
                })
            });

            const data = await res.json();

            if (data.success && data.paymentUrl) {
                window.location.href = data.paymentUrl; // Redirect to Instamojo
            } else if (data.success && data.isFree) {
                alert("Success! You have enrolled in this free test.");
                setPurchasingId(null);
                router.push(`/dashboard/tests`);
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
        <div className="space-y-6">
            <Dialog open={showDomainModal} onOpenChange={(open) => {
                // Prevent closing by clicking outside if no domain is selected
                if (!open && !selectedDomain) return;
                setShowDomainModal(open);
            }}>
                <DialogContent className="sm:max-w-md" hideCloseButton>
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-black text-center text-primary uppercase tracking-tight">Select Your Domain</DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                        <p className="text-center text-foreground/70 mb-6">
                            Choose your domain to see the most relevant Mock Tests. This will lock other domain tests.
                        </p>
                        <div className="space-y-4">
                            {DOMAIN_OPTIONS.map((domain) => (
                                <div
                                    key={domain.id}
                                    onClick={() => setTempDomain(domain.id)}
                                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${tempDomain === domain.id
                                        ? 'border-primary bg-primary/5'
                                        : 'border-border hover:border-primary/50'
                                        }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${tempDomain === domain.id ? 'border-primary' : 'border-border'}`}>
                                            {tempDomain === domain.id && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
                                        </div>
                                        <div>
                                            <h4 className={`font-black uppercase tracking-tight ${tempDomain === domain.id ? 'text-primary' : 'text-foreground'}`}>{domain.label}</h4>
                                            <p className="text-xs text-secondary">{domain.description}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <Button
                            className="w-full mt-6 py-6 text-lg font-black uppercase tracking-widest bg-primary text-white hover:bg-primary-hover shadow-xl shadow-primary/20"
                            onClick={handleDomainSubmit}
                            disabled={!tempDomain}
                        >
                            Continue
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {selectedDomain && (
                <div className="flex justify-between items-center bg-primary/10 p-4 rounded-xl border border-primary/20">
                    <div>
                        <span className="text-sm text-foreground/70">Selected Domain:</span>
                        <span className="font-bold text-primary ml-2">{selectedDomain}</span>
                    </div>
                    <Button variant="outline" onClick={handleResetDomain}>
                        Change Domain
                    </Button>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {tests
                    .filter(test => {
                        // Filter tests based on selected domain
                        if (!selectedDomain) return false;

                        const isPurchased = purchasedTests[test.id] || false;
                        const lowerTitle = test.title.toLowerCase();
                        const lowerDomain = selectedDomain.toLowerCase();
                        const lowerSeries = (test.series || "").toLowerCase();

                        // 1. Specific science-only rule for NRT1 and NRT Demo (User request)
                        const isNRT1orDemo = lowerTitle.includes('nrt1') || 
                                           lowerTitle.includes('nrt 1') || 
                                           lowerTitle.includes('nrt demo');
                        
                        if (isNRT1orDemo) {
                            // Strictly Science only (unless purchased)
                            const isVisible = lowerDomain === 'science' || isPurchased;
                            
                            // FORCE NRT DEMO as "purchased" (free) if it's visible in science
                            if (isVisible && lowerTitle.includes('nrt demo')) {
                                // Although purchasedTests came from fetchData effect, we want to ensure
                                // that if it's displayed in "Science", it's marked as accessible.
                                // It should be handled by price (being 0) anyway, but let's be safe.
                            }
                            return isVisible;
                        }

                        // 2. Purchased tests are ALWAYS visible
                        if (isPurchased) return true;

                        // 3. Full Syllabus mock tests are visible to everyone
                        if (test.isFullSyllabus) return true;

                        // 4. Strict Domain/Stream filtering
                        // Test must belong to the selected series/domain
                        if (lowerSeries === lowerDomain) {
                            return true;
                        }

                        // Fallback: strictly exclude if it belongs to another domain's series
                        const otherDomains = DOMAIN_OPTIONS.map(d => d.id.toLowerCase()).filter(d => d !== lowerDomain);
                        const belongsToOtherSeries = otherDomains.some(d => lowerSeries === d);
                        
                        if (belongsToOtherSeries) return false;

                        return false;
                    })
                    .map(test => {
                        // Recalculate isPurchased to ensure NRT DEMO is free in Science domain
                        // even if the user profile stream doesn't match.
                        let isPurchased = purchasedTests[test.id] || false;
                        if (test.title.toUpperCase().includes('NRT DEMO') && selectedDomain?.toLowerCase() === 'science') {
                            isPurchased = true;
                        }

                return (
                    <Card key={test.id} className="group hover:border-primary/50 transition-all duration-300 shadow-lg h-full flex flex-col">
                        <div className="flex flex-col h-full">
                            <div className="flex items-center justify-between mb-4">
                                <GraduationCap size={40} className="text-primary" />
                                <span className={`px-3 py-1 text-xs font-bold text-white rounded-full ${(!test.price || test.price <= 0) ? 'bg-primary' : 'bg-primary/20'}`}>
                                    {(!test.price || test.price <= 0) ? 'FREE' : `₹${test.price}`}
                                </span>
                            </div>

                            <h3 className="text-xl font-bold text-foreground mb-2">
                                {test.title}
                            </h3>
                            <p className="text-foreground/70 text-sm font-medium mb-4 line-clamp-2">
                                {test.description || (test.title === "NRT 1" ? "Pack of 10 Full Relevant Mock Test" : "Premium verification mock test.")}
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
                                        className={`w-full py-2 font-bold rounded-lg transition-colors disabled:opacity-50 ${(!test.price || test.price <= 0)
                                            ? 'bg-primary hover:bg-primary-hover text-white'
                                            : 'bg-black hover:bg-gray-800 text-white'
                                            }`}
                                    >
                                        {purchasingId === test.id ? 'Processing...' : ((!test.price || test.price <= 0) ? 'Enroll Now' : 'Buy Now')}
                                    </button>
                                )}
                            </div>
                        </div>
                    </Card>
                );
            })}
            </div>
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
