"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { getLeaderboardSummary } from "@/lib/pocketbase-db";
import SubjectRadar from "./SubjectRadar";
import TimeAnalysis from "./TimeAnalysis";
import RankPredictor from "./RankPredictor";
import { Test, TestResult } from "@/types";
import { Rocket } from "lucide-react";

interface ProAnalyticsDashboardProps {
    userResults: TestResult[];
    testDetailsMap: Map<string, Test>;
    subjectInsights: {
        allSubjects: { subject: string; accuracy: number }[];
    };
    isPremium: boolean;
}

export default function ProAnalyticsDashboard({ userResults, testDetailsMap, subjectInsights, isPremium }: ProAnalyticsDashboardProps) {
    const { user } = useAuth();
    const [userStanding, setUserStanding] = useState<any>(null);

    useEffect(() => {
        const fetchStanding = async () => {
            if (user?.$id) {
                const summary = await getLeaderboardSummary(user.$id);
                setUserStanding(summary.userStanding);
            }
        };
        fetchStanding();
    }, [user, userResults]);

    if (!isPremium) return null;

    return (
        <section className="animate-in fade-in slide-in-from-bottom-3 duration-500">
            <div className="flex items-center gap-2.5 mb-6">
                <Rocket size={20} className="text-indigo-500" />
                <div>
                    <h2 className="text-xl font-bold text-slate-800">Pro Insights</h2>
                    <p className="text-xs text-slate-400">Deep dive into your performance metrics</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                <div className="lg:col-span-1 h-full min-h-[350px]">
                    <RankPredictor userStanding={userStanding} />
                </div>
                <div className="lg:col-span-2 min-h-[350px]">
                    <SubjectRadar subjectData={subjectInsights.allSubjects} />
                </div>
                <div className="lg:col-span-3 min-h-[350px]">
                    <TimeAnalysis results={userResults} testDetailsMap={testDetailsMap} />
                </div>
            </div>
        </section>
    );
}
