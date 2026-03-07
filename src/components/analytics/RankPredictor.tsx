"use client";

import { Wand2 } from "lucide-react";

interface RankPredictorProps {
    userStanding: {
        rank: number;
        percentile: number;
        totalParticipants: number;
        testsAttempted: number;
        totalScore: number;
    } | null;
}

export default function RankPredictor({ userStanding }: RankPredictorProps) {
    if (!userStanding || userStanding.testsAttempted < 3) {
        return (
            <div className="bg-indigo-50 rounded-2xl border border-indigo-100 p-6 h-full flex flex-col items-center justify-center text-center">
                <Wand2 size={32} className="text-indigo-300 mx-auto mb-3" />
                <h3 className="text-base font-bold text-slate-800 mb-1">Rank Predictor</h3>
                <p className="text-xs text-slate-400 max-w-[200px]">
                    Attempt at least 3 tests to unlock your predicted All India Rank.
                </p>
            </div>
        );
    }

    const { percentile } = userStanding;
    const hypotheticalTotalStudents = 5000;
    const predictedRank = Math.max(1, Math.floor(hypotheticalTotalStudents * ((100 - percentile) / 100)));

    return (
        <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-2xl p-6 h-full relative overflow-hidden text-white">
            <div className="absolute -right-6 -bottom-6 text-[100px] opacity-10 font-black select-none pointer-events-none">#1</div>

            <div className="relative z-10">
                <h3 className="text-sm font-bold text-white/70 mb-1">Rank Predictor</h3>
                <p className="text-[10px] text-white/50">Based on current performance</p>

                <div className="mt-6 flex items-end gap-1.5">
                    <span className="text-5xl font-black leading-none">{predictedRank}</span>
                    <span className="text-sm text-white/60 font-medium mb-1">/ {hypotheticalTotalStudents}</span>
                </div>

                <div className="mt-5 space-y-1.5">
                    <div className="flex justify-between text-xs font-medium text-white/70">
                        <span>Current Percentile</span>
                        <span>{percentile}%</span>
                    </div>
                    <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden">
                        <div className="h-full bg-white rounded-full transition-all duration-700" style={{ width: `${percentile}%` }} />
                    </div>
                </div>

                <div className="mt-4 p-3 bg-white/10 rounded-xl">
                    <p className="text-[10px] text-white/80 leading-relaxed">
                        You are performing better than <span className="font-bold text-white">{Math.floor(percentile)}%</span> of students.
                    </p>
                </div>

                <p className="text-[9px] text-white/30 text-center mt-3">* Projection based on platform data</p>
            </div>
        </div>
    );
}
