"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { getUserTestResults, getTests, hasCompletedAnyPurchase, getUserProfile } from "@/lib/pocketbase-db";
import { Test, TestResult } from "@/types";
import { Brain, Target, Lock, Rocket, Gem, AlertTriangle } from "lucide-react";

interface SubjectPerformance {
    subject: string;
    accuracy: number;
    attempts: number;
}

export default function SmartPlannerPage() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [isPremium, setIsPremium] = useState(false);
    const [recommendation, setRecommendation] = useState<{
        primaryTest: Test | null;
        reason: string;
        allWeakSubjects: SubjectPerformance[];
    }>({ primaryTest: null, reason: "", allWeakSubjects: [] });

    useEffect(() => {
        const fetchPlannerData = async () => {
            if (!user) return;
            try {
                // Check Premium Status
                const [profile, hasPurchased] = await Promise.all([
                    getUserProfile(user.$id),
                    hasCompletedAnyPurchase(user.$id)
                ]);
                const premiumStatus = !!profile?.premiumStatus || hasPurchased;
                setIsPremium(premiumStatus);

                const [results, allTests] = await Promise.all([
                    getUserTestResults(user.$id),
                    getTests()
                ]);

                // 1. Calculate Subject Accuracy
                const subjectStats = new Map<string, { totalScore: number; maxScore: number; count: number }>();

                results.forEach(r => {
                    // Find test details to know subject
                    const test = allTests.find(t => t.id === r.testId);
                    const subject = test?.subject || "General";

                    const current = subjectStats.get(subject) || { totalScore: 0, maxScore: 0, count: 0 };
                    current.totalScore += r.score;
                    current.maxScore += (r.totalQuestions * 4);
                    current.count += 1;
                    subjectStats.set(subject, current);
                });

                const performances: SubjectPerformance[] = Array.from(subjectStats.entries()).map(([sub, data]) => ({
                    subject: sub,
                    accuracy: data.maxScore > 0 ? Math.round((data.totalScore / data.maxScore) * 100) : 0,
                    attempts: data.count
                })).sort((a, b) => a.accuracy - b.accuracy); // Ascending order (weakest first)

                // 2. Identify Weakest Subject
                const weakest = performances.length > 0 ? performances[0] : null;

                // 3. Find Unattempted Tests
                const attemptedTestIds = new Set(results.map(r => r.testId));
                // Filter tests: must be published. Prioritize keeping only unattempted ones.
                const unattemptedTests = allTests.filter(t => !attemptedTestIds.has(t.id) && t.status === 'Published');

                let recommendedTest: Test | null = null;
                let reason = "";

                if (!weakest) {
                    // New User: Suggest General/Diagnostic Test
                    recommendedTest = unattemptedTests.find(t => t.title.toLowerCase().includes("mock") || t.title.toLowerCase().includes("full")) || unattemptedTests[0] || null;
                    reason = "Start your journey with a full-length mock test to analyze your baseline performance.";
                } else if (weakest.accuracy < 60) {
                    // Critical Weakness
                    recommendedTest = unattemptedTests.find(t => t.subject === weakest.subject) ||
                        unattemptedTests.find(t => t.title.toLowerCase().includes(weakest.subject.toLowerCase())) || null;

                    if (recommendedTest) {
                        reason = `Your accuracy in ${weakest.subject} is low (${weakest.accuracy}%). Attempt this specific test to improve.`;
                    } else {
                        // Fallback if no specific subject test found
                        recommendedTest = unattemptedTests[0] || null;
                        reason = "Consistency is key. Attempt this fresh mock test to boost your overall score.";
                    }
                } else {
                    // Maintenance / General Practice
                    recommendedTest = unattemptedTests.find(t => t.title.toLowerCase().includes("mock")) || unattemptedTests[0] || null;
                    reason = "You're doing well! Maintain your streak with a full syllabus mock test.";
                }

                // Fallback: If all unattempted tests are exhausted (user took all tests), suggest retaking weakest
                if (!recommendedTest && results.length > 0) {
                    // Find test with lowest score
                    const lowestScoreResult = results.sort((a, b) => a.score - b.score)[0];
                    recommendedTest = allTests.find(t => t.id === lowestScoreResult.testId) || null;
                    reason = "Revision is crucial. Retake this test to improve your previous low score.";
                }

                setRecommendation({
                    primaryTest: recommendedTest || null,
                    reason,
                    allWeakSubjects: performances
                });

            } catch (error) {
                console.error("Error generating plan:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchPlannerData();
    }, [user]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-black border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-xs font-black text-black uppercase tracking-widest">Generating Your Plan...</p>
                </div>
            </div>
        );
    }

    const isLocked = recommendation.primaryTest && (recommendation.primaryTest.price || 0) > 0 && !isPremium;

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-20">
            {/* Header */}
            <div>
                <h1 className="text-4xl font-black text-black uppercase italic tracking-tighter mb-2 flex items-center gap-3">
                    AI Smart Planner <Brain size={36} />
                </h1>
                <p className="text-black/60 font-bold uppercase tracking-wide">
                    Your personalized roadmap to crack NCET
                </p>
            </div>

            {/* Today's Focus Card (The "Money" Shot) */}
            <Card className="p-8 md:p-12 border-4 border-black bg-gradient-to-br from-primary/20 to-white shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                    <Target size={200} />
                </div>

                <div className="relative z-10">
                    <div className="inline-block px-4 py-1 bg-black text-primary font-black uppercase text-xs tracking-widest rounded-full mb-6">
                        Today's Consumable Goal
                    </div>

                    <h2 className="text-3xl md:text-5xl font-black text-black uppercase italic leading-tight mb-4">
                        {recommendation.primaryTest ? `Attempt: ${recommendation.primaryTest.title}` : "All Tests Completed!"}
                    </h2>

                    <p className="text-lg font-bold text-black/70 mb-8 max-w-2xl leading-relaxed">
                        {recommendation.reason}
                    </p>

                    {recommendation.primaryTest ? (
                        <div className="flex flex-col md:flex-row gap-4">
                            <Link href={`/dashboard/tests/${recommendation.primaryTest.id}`}>
                                <Button className="w-full md:w-auto text-lg px-10 py-6 border-4 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[-2px] hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all flex items-center gap-2">
                                    {isLocked ? (
                                        <><Lock size={18} /> Unlock Test (₹{recommendation.primaryTest.price})</>
                                    ) : (
                                        <><Rocket size={18} /> Start Now</>
                                    )}
                                </Button>
                            </Link>
                            {/* Upsell / Info Badge */}
                            {!recommendation.primaryTest.testType || recommendation.primaryTest.testType === 'educator' ? (
                                <div className="flex items-center gap-2 px-6 py-3 border-4 border-black/10 rounded-xl bg-white/50 backdrop-blur-sm">
                                    <Gem size={20} className="text-blue-500" />
                                    <span className="font-bold text-xs uppercase tracking-widest opacity-60">High Yield Premium Test</span>
                                </div>
                            ) : null}
                        </div>
                    ) : (
                        <Link href="/dashboard/tests">
                            <Button variant="outline" className="border-4 text-black font-black uppercase">
                                Browse Library
                            </Button>
                        </Link>
                    )}
                </div>
            </Card>

            {/* Weak Areas Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Weakness Analysis */}
                <div className="space-y-6">
                    <div className="flex items-center gap-3">
                        <div className="h-8 w-2 bg-red-500 rounded-full"></div>
                        <h3 className="text-xl font-black text-black uppercase tracking-widest italic">Critical Focus Areas</h3>
                    </div>

                    <div className="space-y-4">
                        {recommendation.allWeakSubjects.length > 0 ? (
                            recommendation.allWeakSubjects.slice(0, 3).map((sub, idx) => (
                                <Card key={idx} className="p-6 border-4 border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center justify-between group hover:bg-black hover:text-white transition-colors cursor-default">
                                    <div>
                                        <h4 className="font-black text-lg uppercase italic">{sub.subject}</h4>
                                        <p className="text-xs font-bold uppercase tracking-widest opacity-60 group-hover:opacity-80">
                                            Accuracy: {sub.accuracy}%
                                        </p>
                                    </div>
                                    <div className="text-red-500 font-black group-hover:text-primary">
                                        <AlertTriangle size={24} />
                                    </div>
                                </Card>
                            ))
                        ) : (
                            <div className="p-8 border-4 border-dashed border-black/20 rounded-2xl text-center font-bold text-black/40 uppercase tracking-widest">
                                No weak areas detected yet. Keep practicing!
                            </div>
                        )}
                    </div>
                </div>

                {/* Upcoming Schedule (Mock) */}
                <div className="space-y-6">
                    <div className="flex items-center gap-3">
                        <div className="h-8 w-2 bg-black rounded-full"></div>
                        <h3 className="text-xl font-black text-black uppercase tracking-widest italic">Upcoming Schedule</h3>
                    </div>

                    <div className="relative border-l-4 border-black ml-4 pl-8 space-y-8 py-2">
                        {/* Tomorrow */}
                        <div className="relative">
                            <div className="absolute -left-[45px] top-0 w-6 h-6 bg-white border-4 border-black rounded-full"></div>
                            <h4 className="font-black text-black uppercase tracking-widest text-sm mb-2 opacity-50">Tomorrow</h4>
                            <div className="p-4 bg-white border-4 border-black rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                                <p className="font-black text-black italic">Attempt Subject Test: {recommendation.allWeakSubjects[1]?.subject || "General Aptitude"}</p>
                            </div>
                        </div>

                        {/* Day After */}
                        <div className="relative">
                            <div className="absolute -left-[45px] top-0 w-6 h-6 bg-black border-4 border-black rounded-full"></div>
                            <h4 className="font-black text-black uppercase tracking-widest text-sm mb-2 opacity-50">Weekend Goal</h4>
                            <div className="p-4 bg-primary border-4 border-black rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                                <p className="font-black text-black italic">Full Syllabus Mock Test (Premium)</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Motivation / Upsell Block */}
            <div className="mt-12 p-8 bg-black rounded-3xl border-4 border-black text-center relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-full bg-grid-white/[0.05] -z-0"></div>
                <div className="relative z-10">
                    <h3 className="text-3xl font-black text-primary uppercase italic mb-4">
                        Unlock Your Full Potential
                    </h3>
                    <p className="text-white/70 font-bold max-w-2xl mx-auto mb-8 text-lg">
                        Premium members get detailed step-by-step solutions for every question in these recommended tests.
                    </p>
                    <Link href="/dashboard/tests">
                        <button className="px-8 py-4 bg-primary text-black font-black uppercase tracking-widest rounded-xl hover:scale-105 transition-transform">
                            Get Premium Access
                        </button>
                    </Link>
                </div>
            </div>
        </div>
    );
}
