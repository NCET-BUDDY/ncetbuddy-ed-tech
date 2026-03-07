"use client";

import { Card } from "@/components/ui/Card";
import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";
import { getUserTestResults, getTestById, getUserProfile, getEducator, hasCompletedAnyPurchase } from "@/lib/appwrite-db";
import { TestResult, Test, UserProfile, Educator } from "@/types";
import Link from "next/link";
import ProAnalyticsDashboard from "@/components/analytics/ProAnalyticsDashboard";
import TestHistoryCard from "@/components/analytics/TestHistoryCard";
import { Lock, Unlock, BarChart2, TrendingUp, Target, Zap, Brain, Flame, FileText, Star, ArrowUpDown, Clock, CheckCircle2, Trophy } from "lucide-react";

export default function AnalyticsPage() {
    const { user } = useAuth();
    const [isPremium, setIsPremium] = useState(false);
    const [checkingAccess, setCheckingAccess] = useState(true);
    const [results, setResults] = useState<TestResult[]>([]);
    const [testDetailsMap, setTestDetailsMap] = useState<Map<string, Test>>(new Map());
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [educator, setEducator] = useState<Educator | null>(null);

    const [stats, setStats] = useState({
        performanceIndex: 0,
        seriousnessScore: 0,
        educatorRank: "N/A",
        trueAccuracy: 0,
        last3Accuracy: 0
    });

    const [recentPerformance, setRecentPerformance] = useState<{ title: string; score: number; total: number }[]>([]);
    const [loading, setLoading] = useState(true);
    const [sortBy, setSortBy] = useState<'date' | 'score' | 'accuracy'>('date');

    const [subjectInsights, setSubjectInsights] = useState<{
        strongest: { subject: string; accuracy: number }[];
        weakest: { subject: string; accuracy: number }[];
        allSubjects: { subject: string; accuracy: number }[];
    }>({ strongest: [], weakest: [], allSubjects: [] });

    const [nextAction, setNextAction] = useState<{ title: string; subtitle: string }>({
        title: "Start Your Journey",
        subtitle: "Attempt your first mock test to unlock insights"
    });

    useEffect(() => {
        const checkPremiumAccess = async () => {
            if (!user) return;

            try {
                // 1. Fetch User Profile first (to check for manual premium grant)
                const profile = await getUserProfile(user.$id);
                setUserProfile(profile);

                // 2. Check Purchase History
                const hasPurchased = await hasCompletedAnyPurchase(user.$id);

                // 3. Centralized Premium Check: Manual Grant OR Purchase History
                const hasAccess = (profile?.premiumStatus === true) || hasPurchased;

                setIsPremium(hasAccess);
                setCheckingAccess(false);

                if (!hasAccess) {
                    setLoading(false);
                    return;
                }

                // Fetch full analytics only for premium users
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

                const totalTests = userResults.length;
                let globalAccuracy = 0;
                let last3Accuracy = 0;
                let performanceIndex = 0;

                if (totalTests > 0) {
                    const totalPercentage = userResults.reduce((acc, curr) => {
                        const maxScore = curr.totalQuestions * 4;
                        return acc + ((curr.score / maxScore) * 100);
                    }, 0);
                    globalAccuracy = Math.round(totalPercentage / totalTests);

                    const last3 = userResults.slice(0, 3);
                    const last3TotalPercentage = last3.reduce((acc, curr) => {
                        const maxScore = curr.totalQuestions * 4;
                        return acc + ((curr.score / maxScore) * 100);
                    }, 0);
                    last3Accuracy = Math.round(last3TotalPercentage / last3.length);
                    performanceIndex = Math.round((globalAccuracy * 0.4) + (last3Accuracy * 0.6));
                }

                setStats({
                    performanceIndex: totalTests > 0 ? performanceIndex : 0,
                    seriousnessScore: totalTests,
                    educatorRank: "N/A",
                    trueAccuracy: globalAccuracy,
                    last3Accuracy: last3Accuracy
                });

                if (totalTests === 0) {
                    setNextAction({
                        title: "Start Your Journey",
                        subtitle: "Attempt your first mock test to unlock analytics"
                    });
                } else if (last3Accuracy < 60) {
                    setNextAction({
                        title: "Action Required: Revise Basics",
                        subtitle: "High error rate detected. Review your weakest subject notes."
                    });
                } else if (last3Accuracy >= 90) {
                    setNextAction({
                        title: "Push for Perfection",
                        subtitle: "Excellent accuracy! Try a speed-focused sectional test."
                    });
                } else {
                    setNextAction({
                        title: "Build Consistency",
                        subtitle: "Maintain your streak. Attempt a full-length mock this weekend."
                    });
                }

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

                if (totalTests > 0 && last3Accuracy < 60 && weakest.length > 0) {
                    setNextAction({
                        title: `Revise ${weakest[0].subject}`,
                        subtitle: "You made frequent mistakes in basic concepts. Review notes and try again."
                    });
                }

                setSubjectInsights({ strongest, weakest, allSubjects: subjectAccuracy });

                const recentResults = userResults.slice(0, 5);
                const graphData = recentResults.map(res => {
                    const test = newTestDetailsMap.get(res.testId);
                    return {
                        title: test?.title || `Test`,
                        score: res.score,
                        total: res.totalQuestions * 4
                    };
                });
                setRecentPerformance(graphData.reverse());

            } catch (error) {
                console.error("Error fetching analytics:", error);
            } finally {
                setLoading(false);
            }
        };

        checkPremiumAccess();
    }, [user]);

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

                {/* Locked Premium Card */}
                <Card className="relative p-12 md:p-16 border-4 border-black bg-gradient-to-br from-primary/20 to-white shadow-[16px_16px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
                    {/* Lock Icon Background */}
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

                        {/* Feature Grid */}
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

                {/* Teaser Preview */}
                <div className="relative">
                    <div className="blur-sm pointer-events-none select-none opacity-30">
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                            {[1, 2, 3, 4].map((i) => (
                                <Card key={i} className="p-8 border-4 border-black bg-white h-40">
                                    <div />
                                </Card>
                            ))}
                        </div>
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="bg-black text-primary px-8 py-3 rounded-xl border-4 border-primary font-black uppercase text-sm tracking-wider shadow-xl">
                            Preview Mode - Purchase to Unlock
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Premium Analytics (Unlocked)
    const statCards = [
        { label: "Overall Performance", value: stats.performanceIndex > 0 ? `${stats.performanceIndex}/100` : "N/A", subtext: stats.performanceIndex > 0 ? "Based on accuracy & practice" : "Not enough data yet", positive: true },
        { label: "Practice Consistency", value: `${stats.seriousnessScore} / 12`, subtext: "Tests attempted", positive: true },
        { label: "Class Rank", value: stats.educatorRank, subtext: "Among students", positive: true },
        { label: "Accuracy Rate", value: `${stats.trueAccuracy}%`, subtext: `Recent performance: ${stats.last3Accuracy}%`, positive: true },
    ];

    const radius = 64;
    const circumference = 2 * Math.PI * radius;
    const goalPercentage = Math.min(100, Math.max(0, stats.trueAccuracy));
    const strokeDashoffset = circumference - (goalPercentage / 100) * circumference;

    return (
        <div className="space-y-10 animate-in fade-in duration-500 pb-10">
            {/* Premium Badge */}
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <h1 className="text-3xl font-black text-black uppercase tracking-tight italic">Performance Overview</h1>
                        <span className="px-4 py-1.5 bg-primary border-2 border-black rounded-lg text-[10px] font-black uppercase tracking-widest shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center gap-1">
                            <Star size={12} /> Premium
                        </span>
                    </div>
                    <p className="text-sm md:text-base text-black font-bold opacity-60 uppercase tracking-wider">
                        {educator ? `${educator.name} • NCET Preparation` : "Practice Mode • NCET Preparation"}
                    </p>
                    <p className="text-xs text-black/50 font-bold mt-2">
                        This report updates after every mock test.
                    </p>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                {statCards.map((stat, idx) => (
                    <Card key={idx} className="p-6 md:p-8 border-4 border-black bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:shadow-[8px_8px_0px_0px_rgba(255,208,47,1)] transition-all transform hover:-translate-y-1 flex flex-col justify-between h-full">
                        <div>
                            <div className="text-[10px] md:text-xs font-black text-black mb-3 uppercase tracking-widest opacity-40">{stat.label}</div>
                            <div className="text-2xl md:text-4xl font-black text-black mb-2 uppercase italic truncate" title={stat.value}>{stat.value}</div>
                        </div>
                        <div className={`text-[10px] font-bold uppercase tracking-widest inline-block text-black/40`}>
                            {stat.subtext}
                        </div>
                    </Card>
                ))}
            </div>

            {/* Summary Stats Bar */}
            {results.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-black rounded-3xl border-4 border-black">
                    <div className="text-center p-3">
                        <div className="flex items-center justify-center gap-1.5 mb-1"><FileText size={14} className="text-primary" /><span className="text-[9px] font-black text-white/40 uppercase tracking-widest">Total Tests</span></div>
                        <div className="text-2xl font-black text-primary">{results.length}</div>
                    </div>
                    <div className="text-center p-3">
                        <div className="flex items-center justify-center gap-1.5 mb-1"><Trophy size={14} className="text-emerald-400" /><span className="text-[9px] font-black text-white/40 uppercase tracking-widest">Best Score</span></div>
                        <div className="text-2xl font-black text-emerald-400">{Math.max(...results.map(r => Math.round((r.score / (r.totalQuestions * 4)) * 100)))}%</div>
                    </div>
                    <div className="text-center p-3">
                        <div className="flex items-center justify-center gap-1.5 mb-1"><Target size={14} className="text-blue-400" /><span className="text-[9px] font-black text-white/40 uppercase tracking-widest">Avg Accuracy</span></div>
                        <div className="text-2xl font-black text-blue-400">{stats.trueAccuracy}%</div>
                    </div>
                    <div className="text-center p-3">
                        <div className="flex items-center justify-center gap-1.5 mb-1"><Clock size={14} className="text-orange-400" /><span className="text-[9px] font-black text-white/40 uppercase tracking-widest">Total Time</span></div>
                        <div className="text-2xl font-black text-orange-400">{Math.round(results.reduce((a, r) => a + (r.timeTaken || 0), 0) / 60)}m</div>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                {/* Main Graph Area */}
                <div className="lg:col-span-2 space-y-10">
                    <section>
                        <div className="flex items-center gap-3 mb-6">
                            <div className="h-8 w-2 bg-primary rounded-full"></div>
                            <h2 className="text-xl font-black text-black uppercase tracking-widest italic">Subject-wise Performance</h2>
                        </div>
                        <Card className="p-10 min-h-[400px] flex items-end justify-between gap-6 border-4 border-black bg-white shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] overflow-x-auto">
                            {recentPerformance.length === 0 ? (
                                <div className="w-full h-full flex flex-col items-center justify-center text-black/20 font-black uppercase tracking-widest py-20 italic">
                                    <div className="text-6xl mb-4 opacity-10">📈</div>
                                    Attempt a mock test to unlock subject insights
                                </div>
                            ) : (
                                recentPerformance.map((data, idx) => (
                                    <div key={idx} className="w-full flex flex-col items-center gap-4 group min-w-[80px]">
                                        <div className="relative w-full bg-black/5 rounded-t-2xl overflow-hidden h-64 flex items-end border-2 border-black/5 group-hover:bg-primary/5 transition-colors">
                                            <div
                                                className="w-full bg-black group-hover:bg-primary transition-all duration-700 rounded-t-xl relative border-t-2 border-black"
                                                style={{ height: `${(data.score / data.total) * 100}%` }}
                                            >
                                                <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-black text-primary text-[10px] font-black px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all shadow-xl whitespace-nowrap border border-black z-20">
                                                    {data.score} / {data.total} • Accuracy: {Math.round((data.score / data.total) * 100)}%
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-center gap-1 w-full text-center">
                                            <span className="text-[10px] font-black text-black uppercase tracking-tighter truncate w-full italic" title={data.title}>
                                                {data.title.substring(0, 15)}
                                            </span>
                                            <span className="text-[10px] font-bold text-black/40">
                                                {Math.round((data.score / data.total) * 100)}%
                                            </span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </Card>
                    </section>

                    <section>
                        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
                            <div className="flex items-center gap-3">
                                <div className="h-8 w-2 bg-black rounded-full"></div>
                                <h2 className="text-xl font-black text-black uppercase tracking-widest italic">Complete Test History</h2>
                                <span className="text-[10px] font-black bg-black text-primary px-2 py-1 rounded-lg">{results.length} Tests</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <ArrowUpDown size={14} className="text-black/40" />
                                {(['date', 'score', 'accuracy'] as const).map(option => (
                                    <button
                                        key={option}
                                        onClick={() => setSortBy(option)}
                                        className={`text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg border-2 transition-all ${sortBy === option
                                                ? 'bg-black text-primary border-black'
                                                : 'bg-white text-black/40 border-black/10 hover:border-black'
                                            }`}
                                    >
                                        {option}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="space-y-4">
                            {[...results]
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
                            {results.length === 0 && (
                                <div className="p-10 text-center border-4 border-dashed border-black rounded-3xl text-black font-black uppercase opacity-20 italic">
                                    No tests attempted yet. Start a mock test!
                                </div>
                            )}
                        </div>
                    </section>
                </div>

                <div className="space-y-10">
                    <section>
                        <div className="flex items-center gap-3 mb-6">
                            <div className="h-8 w-2 bg-black rounded-full"></div>
                            <h2 className="text-xl font-black text-black uppercase tracking-widest italic">Performance Insights</h2>
                        </div>
                        <Card className="p-0 overflow-hidden border-4 border-black bg-white rounded-3xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                            <div className="p-6 border-b-4 border-black bg-primary/10">
                                <h4 className="font-black text-black uppercase tracking-widest text-xs mb-4 flex items-center gap-2">
                                    <Flame size={16} className="text-orange-500" /> Your Strengths
                                </h4>
                                {subjectInsights.strongest.length === 0 ? (
                                    <div className="text-xs font-bold text-black/40 uppercase tracking-widest text-center py-4">Attempt more tests to unlock insights</div>
                                ) : (
                                    <div className="space-y-4">
                                        {subjectInsights.strongest.map(t => (
                                            <div key={t.subject} className="space-y-2">
                                                <div className="flex justify-between text-[10px] font-black uppercase tracking-tighter">
                                                    <span className="text-black">{t.subject}</span>
                                                    <span className="text-green-600 font-black">{t.accuracy}%</span>
                                                </div>
                                                <div className="w-full h-3 bg-black/5 rounded-full overflow-hidden border border-black/10">
                                                    <div className="h-full bg-black rounded-full transition-all duration-1000" style={{ width: `${t.accuracy}%` }}></div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <div className="p-6 bg-white">
                                <h4 className="font-black text-black uppercase tracking-widest text-xs mb-4 flex items-center gap-2">
                                    <Zap size={16} className="text-yellow-500" /> Needs Improvement
                                </h4>
                                {subjectInsights.weakest.length === 0 && subjectInsights.strongest.length === 0 ? (
                                    <div className="text-xs font-bold text-black/40 uppercase tracking-widest text-center py-4">Detailed analysis arriving soon</div>
                                ) : subjectInsights.weakest.length === 0 ? (
                                    <div className="text-xs font-bold text-green-600 uppercase tracking-widest text-center py-4">All systems normal!</div>
                                ) : (
                                    <div className="space-y-4">
                                        {subjectInsights.weakest.map(t => (
                                            <div key={t.subject} className="space-y-2">
                                                <div className="flex justify-between text-[10px] font-black uppercase tracking-tighter">
                                                    <span className="text-black">{t.subject}</span>
                                                    <span className="text-red-600 font-black">{t.accuracy}%</span>
                                                </div>
                                                <div className="w-full h-3 bg-black/5 rounded-full overflow-hidden border border-black/10">
                                                    <div className="h-full bg-red-500 rounded-full border-r border-black transition-all duration-1000" style={{ width: `${t.accuracy}%` }}></div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* NEXT ACTION BLOCK */}
                            <div className="p-6 border-t-4 border-black bg-black text-white">
                                <h4 className="font-black uppercase tracking-widest text-xs mb-2 text-primary">
                                    What to Do Next
                                </h4>
                                <div className="flex flex-col gap-1">
                                    <h5 className="font-black text-lg uppercase italic leading-tight">
                                        {nextAction.title}
                                    </h5>
                                    <p className="text-xs font-bold text-white/60">
                                        {nextAction.subtitle}
                                    </p>
                                </div>
                            </div>
                        </Card>
                    </section>

                    <div className="p-8 rounded-3xl bg-primary border-4 border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] text-center relative overflow-hidden group">
                        <div className="absolute -top-10 -right-10 w-32 h-32 bg-white opacity-10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700"></div>
                        <h3 className="font-black text-black text-xl uppercase tracking-tighter italic mb-6">Daily Practice Progress</h3>
                        <div className="relative w-36 h-36 mx-auto mb-6 flex items-center justify-center">
                            <svg className="w-full h-full transform -rotate-90">
                                <circle cx="72" cy="72" r={radius} stroke="currentColor" strokeWidth="12" fill="transparent" className="text-black/5" />
                                <circle
                                    cx="72"
                                    cy="72"
                                    r={radius}
                                    stroke="currentColor"
                                    strokeWidth="12"
                                    fill="transparent"
                                    className="text-black transition-all duration-1000 ease-out"
                                    strokeDasharray={circumference}
                                    strokeDashoffset={strokeDashoffset}
                                    strokeLinecap="round"
                                />
                            </svg>
                            <div className="absolute flex flex-col items-center">
                                <span className="text-4xl font-black text-black">{stats.trueAccuracy}%</span>
                                <span className="text-[10px] uppercase font-black tracking-widest text-black opacity-40">ACCURACY</span>
                            </div>
                        </div>
                        <p className="text-xs text-black font-black uppercase tracking-widest opacity-60 leading-relaxed italic">
                            {educator ? "Daily target set by your educator" : "Set a daily goal to improve consistency"}
                        </p>
                    </div>
                </div>
            </div>

            {/* Pro Analytics Section (Enhanced) */}
            <ProAnalyticsDashboard
                isPremium={isPremium}
                userResults={results}
                testDetailsMap={testDetailsMap}
                subjectInsights={subjectInsights}
            />
        </div>
    );
}
