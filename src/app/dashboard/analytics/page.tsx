"use client";

import { Card } from "@/components/ui/Card";
import { useAuth } from "@/context/AuthContext";
import { useEffect, useState, useMemo } from "react";
import { getUserTestResults, getTestById, getUserProfile, getEducator, hasCompletedAnyPurchase } from "@/lib/appwrite-db";
import { TestResult, Test, UserProfile, Educator } from "@/types";
import Link from "next/link";
import ProAnalyticsDashboard from "@/components/analytics/ProAnalyticsDashboard";
import TestHistoryCard from "@/components/analytics/TestHistoryCard";
import PerformanceSummaryTable from "@/components/analytics/PerformanceSummaryTable";
import MistakesOverviewChart from "@/components/analytics/MistakesOverviewChart";
import TestMistakesTable from "@/components/analytics/TestMistakesTable";
import { Lock, Unlock, BarChart2, TrendingUp, Target, Zap, Brain, Flame, FileText, Star, ArrowUpDown, Clock, CheckCircle2, Trophy } from "lucide-react";

type FilterOption = 'all' | 'last3' | 'last5' | 'last10';

export default function AnalyticsPage() {
    const { user } = useAuth();
    const [isPremium, setIsPremium] = useState(false);
    const [checkingAccess, setCheckingAccess] = useState(true);
    const [results, setResults] = useState<TestResult[]>([]);
    const [testDetailsMap, setTestDetailsMap] = useState<Map<string, Test>>(new Map());
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [educator, setEducator] = useState<Educator | null>(null);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<FilterOption>('all');
    const [sortBy, setSortBy] = useState<'date' | 'score' | 'accuracy'>('date');

    const [subjectInsights, setSubjectInsights] = useState<{
        strongest: { subject: string; accuracy: number }[];
        weakest: { subject: string; accuracy: number }[];
        allSubjects: { subject: string; accuracy: number }[];
    }>({ strongest: [], weakest: [], allSubjects: [] });

    useEffect(() => {
        const fetchAnalytics = async () => {
            if (!user) return;

            try {
                const profile = await getUserProfile(user.$id);
                setUserProfile(profile);
                const hasPurchased = await hasCompletedAnyPurchase(user.$id);
                const hasAccess = (profile?.premiumStatus === true) || hasPurchased;
                setIsPremium(hasAccess);
                setCheckingAccess(false);

                if (!hasAccess) {
                    setLoading(false);
                    return;
                }

                if (profile?.enrolledEducatorId) {
                    try {
                        const edu = await getEducator(profile.enrolledEducatorId);
                        setEducator(edu);
                    } catch (e) {
                        console.log("No educator found");
                    }
                }

                const userResults = await getUserTestResults(user.$id);
                setResults(userResults);

                // Fetch all test details
                const uniqueTestIds = Array.from(new Set(userResults.map(r => r.testId)));
                const newTestDetailsMap = new Map<string, Test>();
                await Promise.all(uniqueTestIds.map(async (tid) => {
                    try {
                        const t = await getTestById(tid);
                        if (t) newTestDetailsMap.set(tid, t);
                    } catch (e) {
                        console.error(`Failed to fetch test ${tid}`, e);
                    }
                }));
                setTestDetailsMap(newTestDetailsMap);

                // Subject insights for Pro Analytics
                const subjectStats = new Map<string, { totalScore: number; maxScore: number }>();
                userResults.forEach(res => {
                    const test = newTestDetailsMap.get(res.testId);
                    const subject = test?.subject || "General";
                    const current = subjectStats.get(subject) || { totalScore: 0, maxScore: 0 };
                    current.totalScore += res.score;
                    current.maxScore += (res.totalQuestions * 4);
                    subjectStats.set(subject, current);
                });
                const subjectAccuracy = Array.from(subjectStats.entries()).map(([sub, data]) => ({
                    subject: sub,
                    accuracy: Math.round((data.totalScore / data.maxScore) * 100)
                }));
                subjectAccuracy.sort((a, b) => b.accuracy - a.accuracy);
                const strongest = subjectAccuracy.slice(0, 2);
                const weakest = subjectAccuracy.length > 2 ? subjectAccuracy.slice(-2).reverse() : [];
                setSubjectInsights({ strongest, weakest, allSubjects: subjectAccuracy });

            } catch (error) {
                console.error("Error fetching analytics:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchAnalytics();
    }, [user]);

    // Filter results based on selected tab
    const filteredResults = useMemo(() => {
        switch (filter) {
            case 'last3': return results.slice(0, 3);
            case 'last5': return results.slice(0, 5);
            case 'last10': return results.slice(0, 10);
            default: return results;
        }
    }, [results, filter]);

    // Compute Performance Summary (subject-wise stats) from filtered results
    const performanceSummary = useMemo(() => {
        if (filteredResults.length === 0) return [];

        const subjectMap = new Map<string, {
            totalQs: number; correct: number; wrong: number; notAttempted: number; notVisited: number; totalScore: number; maxScore: number;
        }>();

        // Ensure "Overall" always exists
        subjectMap.set("Overall", { totalQs: 0, correct: 0, wrong: 0, notAttempted: 0, notVisited: 0, totalScore: 0, maxScore: 0 });

        filteredResults.forEach(res => {
            const test = testDetailsMap.get(res.testId);
            let questions = test?.questions || [];
            try {
                while (typeof questions === "string") questions = JSON.parse(questions);
            } catch { questions = []; }

            const qArray = questions as any[];

            for (let i = 0; i < res.totalQuestions; i++) {
                const q = qArray[i];
                const subject = q?.subject || test?.subject || "General";
                const userAnswer = res.answers?.[i];

                // Get or create per-subject bucket
                if (!subjectMap.has(subject)) {
                    subjectMap.set(subject, { totalQs: 0, correct: 0, wrong: 0, notAttempted: 0, notVisited: 0, totalScore: 0, maxScore: 0 });
                }
                const s = subjectMap.get(subject)!;
                const overall = subjectMap.get("Overall")!;

                s.totalQs++;
                s.maxScore += 4;
                overall.totalQs++;
                overall.maxScore += 4;

                if (userAnswer === undefined || userAnswer === null || userAnswer === -1) {
                    // Not attempted or not visited
                    s.notAttempted++;
                    overall.notAttempted++;
                } else {
                    if (q && userAnswer === q.correctAnswer) {
                        s.correct++;
                        s.totalScore += 4;
                        overall.correct++;
                        overall.totalScore += 4;
                    } else {
                        s.wrong++;
                        s.totalScore -= 1;
                        overall.wrong++;
                        overall.totalScore -= 1;
                    }
                }
            }
        });

        // Convert to array format
        const result: { subject: string; avgScore: number; attemptedCorrect: number; attemptedWrong: number; notAttempted: number; notVisited: number }[] = [];

        // Overall first
        const overall = subjectMap.get("Overall")!;
        if (overall.totalQs > 0) {
            result.push({
                subject: "Overall",
                avgScore: Math.max(0, Math.round((overall.totalScore / overall.maxScore) * 100)),
                attemptedCorrect: Math.round((overall.correct / overall.totalQs) * 100),
                attemptedWrong: Math.round((overall.wrong / overall.totalQs) * 100),
                notAttempted: Math.round((overall.notAttempted / overall.totalQs) * 100),
                notVisited: 0,
            });
        }

        // Other subjects sorted by name
        Array.from(subjectMap.entries())
            .filter(([name]) => name !== "Overall")
            .sort((a, b) => a[0].localeCompare(b[0]))
            .forEach(([name, s]) => {
                if (s.totalQs > 0) {
                    result.push({
                        subject: name,
                        avgScore: Math.max(0, Math.round((s.totalScore / s.maxScore) * 100)),
                        attemptedCorrect: Math.round((s.correct / s.totalQs) * 100),
                        attemptedWrong: Math.round((s.wrong / s.totalQs) * 100),
                        notAttempted: Math.round((s.notAttempted / s.totalQs) * 100),
                        notVisited: 0,
                    });
                }
            });

        return result;
    }, [filteredResults, testDetailsMap]);

    // Compute Mistakes Overview data
    const mistakesChartData = useMemo(() => {
        return filteredResults
            .slice(0, 15)
            .reverse()
            .map(res => {
                const test = testDetailsMap.get(res.testId);
                let questions = test?.questions || [];
                try { while (typeof questions === "string") questions = JSON.parse(questions); } catch { questions = []; }
                const qArray = questions as any[];

                let correct = 0, incorrect = 0, notAttempted = 0;
                for (let i = 0; i < res.totalQuestions; i++) {
                    const userAnswer = res.answers?.[i];
                    if (userAnswer === undefined || userAnswer === null || userAnswer === -1) {
                        notAttempted++;
                    } else {
                        const q = qArray[i];
                        if (q && userAnswer === q.correctAnswer) correct++;
                        else incorrect++;
                    }
                }
                return {
                    testName: test?.title || `Test`,
                    correct,
                    incorrect,
                    notAttempted,
                };
            });
    }, [filteredResults, testDetailsMap]);

    // Compute Test-wise Mistakes table data
    const testMistakesRows = useMemo(() => {
        return filteredResults.map(res => {
            const test = testDetailsMap.get(res.testId);
            let questions = test?.questions || [];
            try { while (typeof questions === "string") questions = JSON.parse(questions); } catch { questions = []; }
            const qArray = questions as any[];

            let correct = 0, incorrect = 0, notAttempted = 0;
            for (let i = 0; i < res.totalQuestions; i++) {
                const userAnswer = res.answers?.[i];
                if (userAnswer === undefined || userAnswer === null || userAnswer === -1) {
                    notAttempted++;
                } else {
                    const q = qArray[i];
                    if (q && userAnswer === q.correctAnswer) correct++;
                    else incorrect++;
                }
            }
            const attempted = correct + incorrect;
            const accuracy = attempted > 0 ? Math.round((correct / attempted) * 100) : 0;

            return {
                testName: test?.title || `Test ${res.testId?.substring(0, 8)}`,
                date: new Date(res.completedAt * 1000).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }),
                correct,
                incorrect,
                notAttempted,
                totalQuestions: res.totalQuestions,
                accuracy,
            };
        });
    }, [filteredResults, testDetailsMap]);

    // Loading State
    if (checkingAccess || loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-black border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-xs font-black text-black uppercase tracking-widest">Loading Analytics...</p>
                </div>
            </div>
        );
    }

    // Locked State (Non-Premium)
    if (!isPremium) {
        return (
            <div className="space-y-10 animate-in fade-in duration-500 pb-10">
                <div>
                    <h1 className="text-3xl font-black text-black uppercase tracking-tight italic">Premium Analytics</h1>
                    <p className="text-sm md:text-base text-black font-bold opacity-60 mt-1 uppercase tracking-wider">
                        Unlock Advanced Performance Insights
                    </p>
                </div>

                <Card className="relative p-12 md:p-16 border-4 border-black bg-gradient-to-br from-primary/20 to-white shadow-[16px_16px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
                    <div className="absolute top-8 right-8 opacity-5">
                        <Lock size={120} />
                    </div>
                    <div className="relative z-10 space-y-8 text-center max-w-2xl mx-auto">
                        <div className="inline-block p-6 bg-black rounded-3xl border-4 border-primary shadow-[4px_4px_0px_0px_rgba(255,208,47,1)]">
                            <BarChart2 size={64} className="text-primary" />
                        </div>
                        <h2 className="text-4xl font-black text-black uppercase italic leading-tight">
                            Premium Analytics Dashboard
                        </h2>
                        <p className="text-base md:text-lg text-black/70 font-bold leading-relaxed">
                            Purchase any mock test to unlock your personalized performance dashboard with advanced insights, AI-powered recommendations, and detailed analytics.
                        </p>
                        <div className="grid grid-cols-2 gap-4 mt-8">
                            {[
                                { icon: <TrendingUp size={28} className="text-primary" />, label: "Performance Tracking" },
                                { icon: <Target size={28} className="text-primary" />, label: "Subject Deep-Dive" },
                                { icon: <Zap size={28} className="text-primary" />, label: "Speed Analytics" },
                                { icon: <Brain size={28} className="text-primary" />, label: "Smart Recommendations" },
                            ].map((feature, i) => (
                                <div key={i} className="p-4 bg-white border-2 border-black rounded-xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                                    <div className="mb-2 flex justify-center">{feature.icon}</div>
                                    <p className="text-xs font-black text-black uppercase">{feature.label}</p>
                                </div>
                            ))}
                        </div>
                        <Link
                            href="/dashboard/tests"
                            className="inline-block mt-8 px-12 py-5 bg-black text-primary border-4 border-black rounded-2xl font-black uppercase text-lg shadow-[6px_6px_0px_0px_rgba(255,208,47,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,0.3)] hover:-translate-y-1 transition-all tracking-wider flex items-center gap-2 justify-center"
                        >
                            <Unlock size={20} /> Unlock Now - Browse Tests
                        </Link>
                        <p className="text-xs text-black/40 font-bold uppercase tracking-widest">
                            One-time purchase • Lifetime access
                        </p>
                    </div>
                </Card>
            </div>
        );
    }

    // ========== PREMIUM ANALYTICS (UNLOCKED) ==========
    const filterTabs: { key: FilterOption; label: string }[] = [
        { key: 'all', label: 'All Tests' },
        { key: 'last3', label: 'Last 3 Tests' },
        { key: 'last5', label: 'Last 5 Tests' },
        { key: 'last10', label: 'Last 10 Tests' },
    ];

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-10">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                    <div className="flex items-center gap-3 mb-1">
                        <h1 className="text-3xl font-black text-slate-900">Performance</h1>
                    </div>
                    <p className="text-sm text-slate-400 font-bold">
                        {educator ? `${educator.name} • NCET Preparation` : "Practice Mode • NCET Preparation"}
                    </p>
                </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-2 flex-wrap">
                {filterTabs.map(tab => (
                    <button
                        key={tab.key}
                        onClick={() => setFilter(tab.key)}
                        className={`px-4 py-2 rounded-full text-xs font-black uppercase tracking-tight border-2 transition-all ${filter === tab.key
                                ? 'bg-indigo-600 text-white border-indigo-600 shadow-md'
                                : 'bg-white text-slate-500 border-slate-200 hover:border-indigo-300 hover:text-indigo-600'
                            }`}
                    >
                        {tab.label} {filter === tab.key && '✓'}
                    </button>
                ))}
            </div>

            {/* Performance Summary Table */}
            <PerformanceSummaryTable stats={performanceSummary} />

            {/* Test-wise Breakdown Header */}
            <div>
                <h2 className="text-2xl font-black text-slate-900 mb-1">Test-wise Mistakes</h2>
                <p className="text-sm text-slate-400">
                    Revisit questions which you either attempted incorrectly or didn&apos;t attempt in the paper
                </p>
            </div>

            {/* Mistakes Overview Chart */}
            <MistakesOverviewChart data={mistakesChartData} />

            {/* Test-wise Mistakes Table */}
            <TestMistakesTable rows={testMistakesRows} />

            {/* Complete Test History (Expandable Cards) */}
            <div>
                <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
                    <div className="flex items-center gap-3">
                        <h2 className="text-2xl font-black text-slate-900">Complete Test History</h2>
                        <span className="text-[10px] font-black bg-indigo-600 text-white px-2.5 py-1 rounded-full">{filteredResults.length} Tests</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <ArrowUpDown size={14} className="text-slate-400" />
                        {(['date', 'score', 'accuracy'] as const).map(option => (
                            <button
                                key={option}
                                onClick={() => setSortBy(option)}
                                className={`text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg border-2 transition-all ${sortBy === option
                                        ? 'bg-indigo-600 text-white border-indigo-600'
                                        : 'bg-white text-slate-400 border-slate-200 hover:border-indigo-300'
                                    }`}
                            >
                                {option}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="space-y-4">
                    {[...filteredResults]
                        .sort((a, b) => {
                            if (sortBy === 'score') return b.score - a.score;
                            if (sortBy === 'accuracy') return (b.score / (b.totalQuestions * 4)) - (a.score / (a.totalQuestions * 4));
                            return b.completedAt - a.completedAt;
                        })
                        .map((res, i) => (
                            <TestHistoryCard
                                key={res.id || i}
                                result={res}
                                test={testDetailsMap.get(res.testId)}
                                index={i}
                            />
                        ))
                    }
                    {filteredResults.length === 0 && (
                        <div className="p-10 text-center border-2 border-dashed border-slate-300 rounded-2xl text-slate-400 font-bold">
                            No tests attempted yet. Start a mock test!
                        </div>
                    )}
                </div>
            </div>

            {/* Pro Analytics Section (Radar + Time + Rank) */}
            <ProAnalyticsDashboard
                isPremium={isPremium}
                userResults={results}
                testDetailsMap={testDetailsMap}
                subjectInsights={subjectInsights}
            />
        </div>
    );
}
