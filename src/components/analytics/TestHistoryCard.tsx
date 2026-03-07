"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { TestResult, Test } from "@/types";
import {
    ChevronDown,
    ChevronUp,
    Clock,
    CheckCircle2,
    XCircle,
    MinusCircle,
    Timer,
    Target,
    BarChart3,
    Trophy
} from "lucide-react";

interface TestHistoryCardProps {
    result: TestResult;
    test: Test | undefined;
    index: number;
}

export default function TestHistoryCard({ result, test, index }: TestHistoryCardProps) {
    const [isExpanded, setIsExpanded] = useState(false);

    const maxScore = result.totalQuestions * 4;
    const accuracy = maxScore > 0 ? Math.round((result.score / maxScore) * 100) : 0;
    const date = new Date(result.completedAt * 1000);
    const formattedDate = date.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
    });
    const formattedTime = date.toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
    });

    // Calculate detailed stats
    const totalTimeSecs = result.timeTaken || 0;
    const totalTimeMins = Math.floor(totalTimeSecs / 60);
    const totalTimeRemainingSecs = totalTimeSecs % 60;

    // Count correct, incorrect, skipped
    let correct = 0;
    let incorrect = 0;
    let skipped = 0;
    let attempted = 0;

    if (result.answers && test?.questions) {
        let questions = test.questions;
        try {
            while (typeof questions === "string") questions = JSON.parse(questions);
        } catch (e) {
            questions = [];
        }

        for (let i = 0; i < result.totalQuestions; i++) {
            const userAnswer = result.answers[i];
            if (userAnswer === undefined || userAnswer === null) {
                skipped++;
            } else {
                attempted++;
                const q = (questions as any[])[i];
                if (q && userAnswer === q.correctAnswer) {
                    correct++;
                } else {
                    incorrect++;
                }
            }
        }
    } else {
        // Fallback: estimate from score
        attempted = Object.keys(result.answers || {}).length;
        skipped = result.totalQuestions - attempted;
        correct = result.score > 0 ? Math.round(result.score / 4) : 0;
        incorrect = attempted - correct;
    }

    const avgTimePerQ = attempted > 0 && totalTimeSecs > 0
        ? Math.round(totalTimeSecs / attempted)
        : 0;

    // Accuracy color
    const getAccuracyColor = (acc: number) => {
        if (acc >= 80) return "text-emerald-600 bg-emerald-50 border-emerald-200";
        if (acc >= 60) return "text-amber-600 bg-amber-50 border-amber-200";
        return "text-red-600 bg-red-50 border-red-200";
    };

    const getScoreBadgeColor = (acc: number) => {
        if (acc >= 80) return "bg-emerald-500";
        if (acc >= 60) return "bg-amber-500";
        return "bg-red-500";
    };

    return (
        <div
            className={`border-4 border-black rounded-3xl overflow-hidden transition-all duration-300 ${isExpanded ? "shadow-[8px_8px_0px_0px_rgba(255,208,47,1)]" : "shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]"
                } bg-white cursor-pointer group`}
            onClick={() => setIsExpanded(!isExpanded)}
        >
            {/* Header - Always Visible */}
            <div className="p-5 md:p-6 flex items-center gap-4 md:gap-6">
                {/* Rank Badge */}
                <div className={`w-12 h-12 md:w-14 md:h-14 rounded-2xl flex items-center justify-center text-white font-black text-lg md:text-xl flex-shrink-0 ${getScoreBadgeColor(accuracy)}`}>
                    #{index + 1}
                </div>

                {/* Test Info */}
                <div className="flex-1 min-w-0">
                    <h4 className="font-black text-black text-sm md:text-base uppercase italic tracking-tight truncate">
                        {test?.title || `Test ${result.testId?.substring(0, 8)}`}
                    </h4>
                    <div className="flex flex-wrap items-center gap-2 md:gap-3 mt-1">
                        <span className="text-[10px] font-bold text-black/40 uppercase tracking-widest">
                            {formattedDate} • {formattedTime}
                        </span>
                        {test?.subject && (
                            <span className="text-[9px] font-black bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full uppercase tracking-tight">
                                {test.subject}
                            </span>
                        )}
                    </div>
                </div>

                {/* Score & Expand */}
                <div className="flex items-center gap-3 flex-shrink-0">
                    <div className={`px-3 py-1.5 rounded-xl border-2 text-xs font-black ${getAccuracyColor(accuracy)}`}>
                        {accuracy}%
                    </div>
                    <div className="text-black/30 group-hover:text-black transition-colors">
                        {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    </div>
                </div>
            </div>

            {/* Expanded Details */}
            {isExpanded && (
                <div className="border-t-4 border-black animate-in fade-in slide-in-from-top-2 duration-300">
                    {/* Quick Stats Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-0 border-b-4 border-black">
                        <div className="p-4 md:p-5 border-r-2 border-b-2 md:border-b-0 border-black/10 text-center">
                            <div className="flex items-center justify-center gap-1.5 mb-1.5">
                                <Trophy size={14} className="text-primary" />
                                <span className="text-[9px] font-black text-black/40 uppercase tracking-widest">Score</span>
                            </div>
                            <div className="text-xl md:text-2xl font-black text-black">
                                {result.score}<span className="text-xs text-black/30 font-bold">/{maxScore}</span>
                            </div>
                        </div>
                        <div className="p-4 md:p-5 md:border-r-2 border-b-2 md:border-b-0 border-black/10 text-center">
                            <div className="flex items-center justify-center gap-1.5 mb-1.5">
                                <Clock size={14} className="text-blue-500" />
                                <span className="text-[9px] font-black text-black/40 uppercase tracking-widest">Time</span>
                            </div>
                            <div className="text-xl md:text-2xl font-black text-black">
                                {totalTimeMins > 0 ? `${totalTimeMins}m ${totalTimeRemainingSecs}s` : totalTimeSecs > 0 ? `${totalTimeSecs}s` : "N/A"}
                            </div>
                        </div>
                        <div className="p-4 md:p-5 border-r-2 border-black/10 text-center">
                            <div className="flex items-center justify-center gap-1.5 mb-1.5">
                                <Target size={14} className="text-purple-500" />
                                <span className="text-[9px] font-black text-black/40 uppercase tracking-widest">Attempted</span>
                            </div>
                            <div className="text-xl md:text-2xl font-black text-black">
                                {attempted}<span className="text-xs text-black/30 font-bold">/{result.totalQuestions}</span>
                            </div>
                        </div>
                        <div className="p-4 md:p-5 text-center">
                            <div className="flex items-center justify-center gap-1.5 mb-1.5">
                                <Timer size={14} className="text-orange-500" />
                                <span className="text-[9px] font-black text-black/40 uppercase tracking-widest">Avg/Q</span>
                            </div>
                            <div className="text-xl md:text-2xl font-black text-black">
                                {avgTimePerQ > 0 ? `${avgTimePerQ}s` : "N/A"}
                            </div>
                        </div>
                    </div>

                    {/* Breakdown Section */}
                    <div className="p-5 md:p-6 space-y-4">
                        <h5 className="text-xs font-black text-black uppercase tracking-widest italic">Question Breakdown</h5>

                        {/* Correct */}
                        <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <CheckCircle2 size={14} className="text-emerald-500" />
                                    <span className="text-xs font-black text-black uppercase tracking-tight">Correct</span>
                                </div>
                                <span className="text-xs font-black text-emerald-600">{correct} (+{correct * 4} marks)</span>
                            </div>
                            <div className="w-full h-3 bg-black/5 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-emerald-500 rounded-full transition-all duration-700"
                                    style={{ width: `${result.totalQuestions > 0 ? (correct / result.totalQuestions) * 100 : 0}%` }}
                                />
                            </div>
                        </div>

                        {/* Incorrect */}
                        <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <XCircle size={14} className="text-red-500" />
                                    <span className="text-xs font-black text-black uppercase tracking-tight">Incorrect</span>
                                </div>
                                <span className="text-xs font-black text-red-600">{incorrect} (-{incorrect} marks)</span>
                            </div>
                            <div className="w-full h-3 bg-black/5 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-red-500 rounded-full transition-all duration-700"
                                    style={{ width: `${result.totalQuestions > 0 ? (incorrect / result.totalQuestions) * 100 : 0}%` }}
                                />
                            </div>
                        </div>

                        {/* Skipped */}
                        <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <MinusCircle size={14} className="text-slate-400" />
                                    <span className="text-xs font-black text-black uppercase tracking-tight">Skipped</span>
                                </div>
                                <span className="text-xs font-black text-slate-400">{skipped} (0 marks)</span>
                            </div>
                            <div className="w-full h-3 bg-black/5 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-slate-300 rounded-full transition-all duration-700"
                                    style={{ width: `${result.totalQuestions > 0 ? (skipped / result.totalQuestions) * 100 : 0}%` }}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Accuracy Footer */}
                    <div className="p-4 md:p-5 bg-black text-white flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <BarChart3 size={16} className="text-primary" />
                            <span className="text-[10px] font-black uppercase tracking-widest">Final Accuracy</span>
                        </div>
                        <span className="text-lg font-black text-primary">{accuracy}%</span>
                    </div>
                </div>
            )}
        </div>
    );
}
