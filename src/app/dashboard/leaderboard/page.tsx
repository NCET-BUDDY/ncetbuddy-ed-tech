"use client";

import { Card } from "@/components/ui/Card";
import { useEffect, useState } from "react";
import { getLeaderboardSummary, getUserProfile, getEducator } from "@/lib/appwrite-db";
import { UserProfile, Educator } from "@/types";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/Button";

import client from "@/lib/appwrite-student";

export default function LeaderboardPage() {
    const { user } = useAuth();
    const [topPerformer, setTopPerformer] = useState<(UserProfile & { rank: number }) | null>(null);
    const [userStanding, setUserStanding] = useState<{
        rank: number;
        totalScore: number;
        testsAttempted: number;
        aheadOfPercent: number;
        totalParticipants: number;
        mockTestPerformances?: { testId: string; title: string; score: number; obtainedAt: number }[];
        pyqPerformance?: { totalScore: number; testsAttempted: number };
    } | null>(null);
    const [totalParticipants, setTotalParticipants] = useState(0);
    const [educator, setEducator] = useState<Educator | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchLeaderboardData = async (isBackground = false) => {
        if (!user) return;

        try {
            if (!isBackground) setLoading(true);

            // Fetch leaderboard summary
            const summary = await getLeaderboardSummary(user.$id);
            setTopPerformer(summary.topPerformer);
            setUserStanding(summary.userStanding);
            setTotalParticipants(summary.totalParticipants);

            // Fetch educator context
            const profile = await getUserProfile(user.$id);
            if (profile?.enrolledEducatorId) {
                try {
                    const edu = await getEducator(profile.enrolledEducatorId);
                    setEducator(edu);
                } catch (e) {
                    console.log("No educator found");
                }
            }
        } catch (error) {
            console.error("Failed to fetch leaderboard:", error);
        } finally {
            if (!isBackground) setLoading(false);
        }
    };

    useEffect(() => {
        fetchLeaderboardData();

        // Subscribe to realtime updates for test results (throttled)
        let unsubscribe: (() => void) | undefined;
        let lastRefreshTime = 0;
        const THROTTLE_MS = 60 * 1000; // At most one refresh per 60 seconds

        try {
            const channel = `databases.${process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || '69c84948001622ba05f7'}.collections.test-results.documents`;

            unsubscribe = client.subscribe(channel, (response) => {
                const eventType = response.events[0];
                if (eventType.includes('.create')) {
                    const now = Date.now();
                    if (now - lastRefreshTime > THROTTLE_MS) {
                        lastRefreshTime = now;
                        fetchLeaderboardData(true); // Background update
                    }
                }
            });
        } catch (error) {
            console.error("Failed to subscribe to leaderboard updates:", error);
        }

        return () => {
            if (unsubscribe) {
                try {
                    unsubscribe();
                } catch (error) {
                    // Suppress cleanup errors
                }
            }
        };
    }, [user]);

    return (
        <div className="space-y-10 animate-in fade-in duration-500 pb-10">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-black uppercase tracking-tight italic">Leaderboard</h1>
                    <p className="text-sm md:text-base text-black font-bold opacity-60 mt-1 uppercase tracking-wider">
                        {educator ? `${educator.name} • NCET Test Series` : "NCET Buddy • Practice Mode"}
                    </p>
                </div>
                <Button
                    onClick={() => fetchLeaderboardData(false)}
                    variant="outline"
                    className="w-full sm:w-auto border-2 border-black text-black hover:bg-black hover:text-white transition-all font-black text-xs uppercase tracking-widest"
                    disabled={loading}
                >
                    {loading ? "Syncing..." : "Refresh"}
                </Button>
            </div>

            {/* Top Performer Block (Public) */}
            <div>
                <div className="flex items-center gap-3 mb-6">
                    <div className="h-8 w-2 bg-primary rounded-full"></div>
                    <h2 className="text-xl font-black text-black uppercase tracking-widest italic">Top Performer</h2>
                </div>
                <Card className="overflow-hidden border-4 border-black bg-white shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b-4 border-black bg-primary">
                                    <th className="p-4 text-sm font-black text-black uppercase tracking-wider">Rank</th>
                                    <th className="p-4 text-sm font-black text-black uppercase tracking-wider">Student</th>
                                    <th className="p-4 text-sm font-black text-black uppercase tracking-wider">Total Score (XP)</th>
                                    <th className="p-4 text-sm font-black text-black uppercase tracking-wider hidden md:table-cell">Tests Attempted</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading && !topPerformer ? (
                                    <tr>
                                        <td colSpan={4} className="p-8 text-center text-black font-bold">
                                            Loading leaderboard...
                                        </td>
                                    </tr>
                                ) : !topPerformer ? (
                                    <tr>
                                        <td colSpan={4} className="p-8 text-center text-black font-bold">
                                            No attempts yet. Leaderboard will update after the first test attempt.
                                        </td>
                                    </tr>
                                ) : (
                                    <tr className="border-b border-black hover:bg-primary/5 transition-colors">
                                        <td className="p-4">
                                            <span className="inline-flex items-center justify-center w-10 h-10 rounded-full font-black bg-primary text-black border-2 border-black">
                                                1
                                            </span>
                                        </td>
                                        <td className="p-4 text-black font-black">
                                            {topPerformer.displayName || "Anonymous User"}
                                        </td>
                                        <td className="p-4 text-black font-black">
                                            {topPerformer.totalScore?.toLocaleString() || 0}
                                        </td>
                                        <td className="p-4 text-black font-bold hidden md:table-cell">
                                            {topPerformer.testsAttempted || 0}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </Card>
            </div>

            {/* Your Standing Block (Private) */}
            <div>
                <div className="flex items-center gap-3 mb-6">
                    <div className="h-8 w-2 bg-black rounded-full"></div>
                    <h2 className="text-xl font-black text-black uppercase tracking-widest italic">Your Standing</h2>
                </div>
                <Card className="p-8 border-4 border-black bg-white shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]">
                    {loading && !userStanding ? (
                        <div className="text-center text-black font-bold py-8">
                            Loading your standing...
                        </div>
                    ) : !userStanding ? (
                        <div className="text-center text-black font-bold py-8">
                            Attempt your first mock test to get your percentile.
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {/* Your Score */}
                            <div className="flex items-center justify-between pb-4 border-b-2 border-black/10">
                                <span className="text-sm font-black text-black uppercase tracking-widest opacity-60">Your Score</span>
                                <span className="text-2xl font-black text-black uppercase italic">{userStanding.totalScore.toLocaleString()} XP</span>
                            </div>

                            {/* Your Rank */}
                            <div className="flex items-center justify-between pb-4 border-b-2 border-black/10">
                                <span className="text-sm font-black text-black uppercase tracking-widest opacity-60">Your Rank</span>
                                <span className="text-xl font-black text-black">
                                    {userStanding.rank} / {userStanding.totalParticipants}
                                </span>
                            </div>

                            {/* Percentile (Key Metric) */}
                            <div className="bg-primary/10 border-2 border-black rounded-2xl p-6 text-center">
                                <p className="text-xs font-black text-black uppercase tracking-widest mb-2 opacity-60">Performance Percentile</p>
                                {userStanding.totalParticipants > 1 ? (
                                    <p className="text-2xl md:text-3xl font-black text-black uppercase italic leading-tight">
                                        You are ahead of <span className="text-primary border-b-4 border-black">{userStanding.aheadOfPercent}%</span> of students
                                    </p>
                                ) : (
                                    <p className="text-xl font-black text-black uppercase italic">
                                        You are the first to attempt!
                                    </p>
                                )}
                            </div>

                            {/* Tests Attempted */}
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-black text-black uppercase tracking-widest opacity-60">Tests Attempted</span>
                                <span className="text-xl font-black text-black">{userStanding.testsAttempted}</span>
                            </div>
                        </div>
                    )}
                </Card>
            </div>

            {/* Test-wise Performance (Mock Tests) */}
            {userStanding?.mockTestPerformances && userStanding.mockTestPerformances.length > 0 && (
                <div>
                    <div className="flex items-center gap-3 mb-6">
                        <div className="h-8 w-2 bg-black rounded-full"></div>
                        <h2 className="text-xl font-black text-black uppercase tracking-widest italic">Mock Test Performance</h2>
                    </div>
                    <Card className="overflow-hidden border-4 border-black bg-white shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b-4 border-black bg-primary">
                                        <th className="p-4 text-sm font-black text-black uppercase tracking-wider">Test Name</th>
                                        <th className="p-4 text-sm font-black text-black uppercase tracking-wider">Score</th>
                                        <th className="p-4 text-sm font-black text-black uppercase tracking-wider hidden sm:table-cell">Date</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {userStanding.mockTestPerformances.map((test, index) => (
                                        <tr key={index} className="border-b border-black hover:bg-primary/5 transition-colors last:border-0">
                                            <td className="p-4 text-black font-bold">
                                                {test.title}
                                            </td>
                                            <td className="p-4 text-black font-black">
                                                {test.score.toLocaleString()} XP
                                            </td>
                                            <td className="p-4 text-black font-medium opacity-60 hidden sm:table-cell">
                                                {new Date(test.obtainedAt).toLocaleDateString()}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                </div>
            )}

            {/* PYQ Performance Summary */}
            {userStanding?.pyqPerformance && (
                <div>
                    <div className="flex items-center gap-3 mb-6">
                        <div className="h-8 w-2 bg-black rounded-full"></div>
                        <h2 className="text-xl font-black text-black uppercase tracking-widest italic">PYQ Performance</h2>
                    </div>
                    <Card className="p-8 border-4 border-black bg-white shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-2">
                                <span className="text-sm font-black text-black uppercase tracking-widest opacity-60">Total PYQ Score</span>
                                <p className="text-3xl font-black text-black uppercase italic">
                                    {userStanding.pyqPerformance.totalScore.toLocaleString()} XP
                                </p>
                            </div>
                            <div className="space-y-2">
                                <span className="text-sm font-black text-black uppercase tracking-widest opacity-60">PYQs Attempted</span>
                                <p className="text-3xl font-black text-black uppercase italic">
                                    {userStanding.pyqPerformance.testsAttempted}
                                </p>
                            </div>
                        </div>
                    </Card>
                </div>
            )}

            {/* Privacy Notice */}
            <div className="text-center">
                <p className="text-xs font-bold text-black/40 uppercase tracking-widest leading-relaxed">
                    To protect privacy, only the top performer is shown publicly. Your percentile is visible only to you.
                </p>
            </div>
        </div>
    );
}
