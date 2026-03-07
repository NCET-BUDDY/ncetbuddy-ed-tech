"use client";

import { useState } from "react";
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
    const formattedDate = date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
    const formattedTime = date.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });

    const totalTimeSecs = result.timeTaken || 0;
    const totalTimeMins = Math.floor(totalTimeSecs / 60);
    const totalTimeRemainingSecs = totalTimeSecs % 60;

    let correct = 0, incorrect = 0, skipped = 0, attempted = 0;
    if (result.answers && test?.questions) {
        let questions = test.questions;
        try { while (typeof questions === "string") questions = JSON.parse(questions); } catch { questions = []; }
        for (let i = 0; i < result.totalQuestions; i++) {
            const userAnswer = result.answers[i];
            if (userAnswer === undefined || userAnswer === null) { skipped++; }
            else {
                attempted++;
                const q = (questions as any[])[i];
                if (q && userAnswer === q.correctAnswer) correct++;
                else incorrect++;
            }
        }
    } else {
        attempted = Object.keys(result.answers || {}).length;
        skipped = result.totalQuestions - attempted;
        correct = result.score > 0 ? Math.round(result.score / 4) : 0;
        incorrect = attempted - correct;
    }

    const avgTimePerQ = attempted > 0 && totalTimeSecs > 0 ? Math.round(totalTimeSecs / attempted) : 0;

    const getAccuracyColor = (acc: number) => {
        if (acc >= 80) return "text-emerald-600 bg-emerald-50";
        if (acc >= 60) return "text-amber-600 bg-amber-50";
        return "text-red-500 bg-red-50";
    };

    return (
        <div
            className={`border rounded-xl overflow-hidden transition-all duration-200 bg-white cursor-pointer group ${isExpanded ? "border-indigo-200 shadow-md" : "border-slate-200 hover:border-slate-300 hover:shadow-sm"
                }`}
            onClick={() => setIsExpanded(!isExpanded)}
        >
            {/* Header */}
            <div className="px-4 py-3 flex items-center gap-3">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0 ${accuracy >= 60 ? 'bg-emerald-500' : accuracy >= 30 ? 'bg-amber-500' : 'bg-red-500'}`}>
                    #{index + 1}
                </div>
                <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-slate-800 text-sm truncate">
                        {test?.title || `Test ${result.testId?.substring(0, 8)}`}
                    </h4>
                    <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] text-slate-400 font-medium">{formattedDate} • {formattedTime}</span>
                        {test?.subject && (
                            <span className="text-[9px] font-bold bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded uppercase">{test.subject}</span>
                        )}
                    </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={`px-2 py-1 rounded-lg text-xs font-bold ${getAccuracyColor(accuracy)}`}>{accuracy}%</span>
                    <div className="text-slate-300 group-hover:text-slate-500 transition-colors">
                        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </div>
                </div>
            </div>

            {/* Expanded Details */}
            {isExpanded && (
                <div className="border-t border-slate-100 animate-in fade-in slide-in-from-top-1 duration-200">
                    <div className="grid grid-cols-4 gap-0 border-b border-slate-100">
                        {[
                            { icon: <Trophy size={12} className="text-amber-500" />, label: "Score", value: `${result.score}/${maxScore}` },
                            { icon: <Clock size={12} className="text-blue-500" />, label: "Time", value: totalTimeMins > 0 ? `${totalTimeMins}m ${totalTimeRemainingSecs}s` : totalTimeSecs > 0 ? `${totalTimeSecs}s` : "N/A" },
                            { icon: <Target size={12} className="text-purple-500" />, label: "Attempted", value: `${attempted}/${result.totalQuestions}` },
                            { icon: <Timer size={12} className="text-orange-500" />, label: "Avg/Q", value: avgTimePerQ > 0 ? `${avgTimePerQ}s` : "N/A" },
                        ].map((stat, idx) => (
                            <div key={idx} className="p-3 text-center border-r border-slate-50 last:border-r-0">
                                <div className="flex items-center justify-center gap-1 mb-1">{stat.icon}<span className="text-[9px] text-slate-400 font-medium uppercase">{stat.label}</span></div>
                                <div className="text-sm font-bold text-slate-800">{stat.value}</div>
                            </div>
                        ))}
                    </div>

                    <div className="px-4 py-3 space-y-2.5">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Question Breakdown</p>
                        {[
                            { icon: <CheckCircle2 size={12} className="text-emerald-500" />, label: "Correct", count: correct, marks: `+${correct * 4}`, color: "bg-emerald-500", textColor: "text-emerald-600" },
                            { icon: <XCircle size={12} className="text-red-400" />, label: "Incorrect", count: incorrect, marks: `-${incorrect}`, color: "bg-red-400", textColor: "text-red-500" },
                            { icon: <MinusCircle size={12} className="text-slate-300" />, label: "Skipped", count: skipped, marks: "0", color: "bg-slate-300", textColor: "text-slate-400" },
                        ].map((item) => (
                            <div key={item.label} className="flex items-center gap-2">
                                {item.icon}
                                <span className="text-xs font-medium text-slate-600 w-16">{item.label}</span>
                                <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                    <div className={`h-full ${item.color} rounded-full transition-all duration-500`} style={{ width: `${result.totalQuestions > 0 ? (item.count / result.totalQuestions) * 100 : 0}%` }} />
                                </div>
                                <span className={`text-xs font-bold ${item.textColor} w-12 text-right`}>{item.count} ({item.marks})</span>
                            </div>
                        ))}
                    </div>

                    <div className="px-4 py-2.5 bg-slate-50 flex items-center justify-between border-t border-slate-100">
                        <div className="flex items-center gap-1.5">
                            <BarChart3 size={12} className="text-indigo-500" />
                            <span className="text-[10px] font-bold text-slate-400 uppercase">Final Accuracy</span>
                        </div>
                        <span className="text-sm font-bold text-indigo-600">{accuracy}%</span>
                    </div>
                </div>
            )}
        </div>
    );
}
