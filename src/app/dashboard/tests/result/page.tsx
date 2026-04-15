"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/context/AuthContext";
import { getTestPerformanceSummary } from "@/lib/pocketbase-db";
import { TestPerformanceSummary } from "@/types";
import { Trophy, Star, Dumbbell, ThumbsUp, TrendingUp, Target, BookOpen, RefreshCw, BarChart2 } from "lucide-react";

function formatTime(seconds: number): string {
    if (!seconds || seconds <= 0) return '—';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
}

function getGrade(percentage: number): { grade: string; label: string; color: string; icon: React.ReactNode } {
    if (percentage >= 90) return { grade: 'A+', label: 'Outstanding!', color: '#10B981', icon: <Trophy size={48} className="text-yellow-500" /> };
    if (percentage >= 80) return { grade: 'A', label: 'Excellent', color: '#059669', icon: <Star size={48} className="text-yellow-400" /> };
    if (percentage >= 70) return { grade: 'B+', label: 'Very Good', color: '#3B82F6', icon: <Dumbbell size={48} className="text-blue-400" /> };
    if (percentage >= 60) return { grade: 'B', label: 'Good', color: '#2563EB', icon: <ThumbsUp size={48} className="text-blue-500" /> };
    if (percentage >= 50) return { grade: 'C+', label: 'Above Average', color: '#F59E0B', icon: <TrendingUp size={48} className="text-amber-500" /> };
    if (percentage >= 40) return { grade: 'C', label: 'Average', color: '#D97706', icon: <Target size={48} className="text-amber-600" /> };
    if (percentage >= 30) return { grade: 'D', label: 'Below Average', color: '#EF4444', icon: <BookOpen size={48} className="text-red-400" /> };
    return { grade: 'F', label: 'Needs Improvement', color: '#DC2626', icon: <RefreshCw size={48} className="text-red-600" /> };
}

function ResultContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { user } = useAuth();

    const testId = searchParams.get("testId") || "";
    const score = parseInt(searchParams.get("score") || "0");
    const total = parseInt(searchParams.get("total") || "0");
    const maxScore = total * 4;
    const percentage = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
    const gradeInfo = getGrade(percentage);

    const [performance, setPerformance] = useState<TestPerformanceSummary | null>(null);
    const [animatedPercentage, setAnimatedPercentage] = useState(0);
    const [showContent, setShowContent] = useState(false);

    useEffect(() => {
        // Entrance animation
        const timer = setTimeout(() => setShowContent(true), 300);
        return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
        // Animate percentage counter
        if (!showContent) return;
        let current = 0;
        const step = Math.max(1, Math.floor(percentage / 40));
        const interval = setInterval(() => {
            current += step;
            if (current >= percentage) {
                current = percentage;
                clearInterval(interval);
            }
            setAnimatedPercentage(current);
        }, 30);
        return () => clearInterval(interval);
    }, [percentage, showContent]);

    useEffect(() => {
        if (!testId || !user) return;
        getTestPerformanceSummary(testId, user.$id).then(data => {
            if (data) setPerformance(data);
        });
    }, [testId, user]);

    // Circular progress SVG values
    const radius = 80;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (animatedPercentage / 100) * circumference;

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <div className={`max-w-lg w-full space-y-6 transition-all duration-700 ${showContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>

                {/* Main Result Card */}
                <Card className="p-8 border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] bg-white text-center relative overflow-hidden">

                    {/* Background decoration */}
                    <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-primary via-yellow-300 to-primary"></div>

                    {/* Grade & Icon */}
                    <div className="mb-4 flex justify-center">
                        {gradeInfo.icon}
                    </div>

                    <div className="mb-1">
                        <span
                            className="text-6xl font-black italic"
                            style={{ color: gradeInfo.color }}
                        >
                            {gradeInfo.grade}
                        </span>
                    </div>
                    <p className="text-sm font-black uppercase tracking-widest text-black/50 mb-8">{gradeInfo.label}</p>

                    {/* Circular Progress */}
                    <div className="relative w-48 h-48 mx-auto mb-6">
                        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 200 200">
                            {/* Background circle */}
                            <circle
                                cx="100" cy="100" r={radius}
                                fill="none" stroke="#E5E7EB" strokeWidth="12"
                            />
                            {/* Progress circle */}
                            <circle
                                cx="100" cy="100" r={radius}
                                fill="none"
                                stroke={gradeInfo.color}
                                strokeWidth="12"
                                strokeLinecap="round"
                                strokeDasharray={circumference}
                                strokeDashoffset={strokeDashoffset}
                                className="transition-all duration-300"
                            />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-4xl font-black text-black">{animatedPercentage}%</span>
                            <span className="text-[10px] font-bold text-black/40 uppercase">Accuracy</span>
                        </div>
                    </div>

                    {/* Score */}
                    <div className="bg-gray-100 rounded-xl px-6 py-4 inline-block border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                        <span className="text-3xl font-black text-black">{score}</span>
                        <span className="text-lg font-bold text-black/30">/{maxScore}</span>
                        <div className="text-[10px] font-black text-black/40 uppercase tracking-wider mt-1">Total Score</div>
                    </div>
                </Card>

                {/* Rank Card (if available) */}
                {performance && (
                    <Card className="p-5 border-3 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] bg-white">
                        <div className="grid grid-cols-3 gap-4 text-center">
                            <div>
                                <div className="text-2xl font-black text-black">
                                    #{performance.rank}
                                </div>
                                <div className="text-[10px] font-black text-black/40 uppercase mt-1">Your Rank</div>
                            </div>
                            <div>
                                <div className="text-2xl font-black" style={{
                                    color: performance.percentile >= 70 ? '#10B981' : performance.percentile >= 40 ? '#F59E0B' : '#EF4444'
                                }}>
                                    {performance.percentile}%
                                </div>
                                <div className="text-[10px] font-black text-black/40 uppercase mt-1">Percentile</div>
                            </div>
                            <div>
                                <div className="text-2xl font-black text-black">
                                    {performance.totalAttemptees}
                                </div>
                                <div className="text-[10px] font-black text-black/40 uppercase mt-1">Students</div>
                            </div>
                        </div>
                    </Card>
                )}

                {/* Stats Row */}
                <div className="grid grid-cols-3 gap-3">
                    <div className="bg-green-50 border-2 border-green-400 rounded-xl p-3 text-center shadow-[3px_3px_0px_0px_rgba(16,185,129,0.3)]">
                        <div className="text-xl font-black text-green-600">{performance?.correctCount || '—'}</div>
                        <div className="text-[9px] font-black text-green-500/60 uppercase tracking-wider">Correct</div>
                    </div>
                    <div className="bg-red-50 border-2 border-red-400 rounded-xl p-3 text-center shadow-[3px_3px_0px_0px_rgba(239,68,68,0.3)]">
                        <div className="text-xl font-black text-red-600">{performance?.incorrectCount || '—'}</div>
                        <div className="text-[9px] font-black text-red-500/60 uppercase tracking-wider">Wrong</div>
                    </div>
                    <div className="bg-gray-50 border-2 border-gray-400 rounded-xl p-3 text-center shadow-[3px_3px_0px_0px_rgba(107,114,128,0.3)]">
                        <div className="text-xl font-black text-gray-600">{performance?.unattemptedCount || '—'}</div>
                        <div className="text-[9px] font-black text-gray-500/60 uppercase tracking-wider">Skipped</div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                    <Button
                        onClick={() => router.push(`/dashboard/tests/review?testId=${testId}&score=${score}&total=${total}`)}
                        variant="outline"
                        className="flex-1 justify-center border-2 border-black text-black hover:bg-black hover:text-white font-black py-3 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] text-sm flex items-center gap-2"
                    >
                        <BarChart2 size={16} /> Full Analysis
                    </Button>
                    <Button
                        onClick={() => router.push("/dashboard/tests")}
                        className="flex-1 justify-center bg-primary border-2 border-black text-black hover:bg-black hover:text-primary font-black py-3 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] text-sm"
                    >
                        Try Another Test →
                    </Button>
                </div>
            </div>
        </div>
    );
}

export default function TestResultPage() {
    return (
        <Suspense fallback={
            <div className="flex flex-col items-center justify-center min-h-screen gap-4 bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-primary"></div>
                <p className="text-sm font-bold text-black/40 uppercase tracking-widest">Loading results...</p>
            </div>
        }>
            <ResultContent />
        </Suspense>
    );
}
