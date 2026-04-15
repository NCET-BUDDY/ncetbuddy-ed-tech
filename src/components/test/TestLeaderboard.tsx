"use client";

import { useEffect, useState } from "react";
import { getTestLeaderboard } from "@/lib/pocketbase-db";
import { TestRankEntry } from "@/types";
import { Trophy } from "lucide-react";

interface TestLeaderboardProps {
    testId: string;
    currentUserId?: string;
}

function formatTime(seconds: number): string {
    if (!seconds || seconds <= 0) return '—';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
}

export const TestLeaderboard: React.FC<TestLeaderboardProps> = ({ testId, currentUserId }) => {
    const [leaderboard, setLeaderboard] = useState<TestRankEntry[]>([]);
    const [userRank, setUserRank] = useState<TestRankEntry | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        const fetchLeaderboard = async () => {
            if (!testId) return;
            setLoading(true);
            setError(false);
            try {
                const { leaderboard: data, userRank: rank } = await getTestLeaderboard(testId, currentUserId);
                setLeaderboard(data);
                setUserRank(rank);
            } catch (e) {
                console.error("Error loading leaderboard:", e);
                setError(true);
            } finally {
                setLoading(false);
            }
        };
        fetchLeaderboard();
    }, [testId, currentUserId]);

    if (loading) {
        return (
            <div className="bg-white border-3 border-black rounded-2xl shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
                <div className="bg-black text-white px-5 py-3">
                    <h3 className="font-black uppercase text-sm tracking-wider flex items-center gap-2"><Trophy size={16} className="text-primary" /> Test Leaderboard</h3>
                </div>
                <div className="flex justify-center items-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
                </div>
            </div>
        );
    }

    if (error || leaderboard.length === 0) {
        return (
            <div className="bg-white border-3 border-black rounded-2xl shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
                <div className="bg-black text-white px-5 py-3">
                    <h3 className="font-black uppercase text-sm tracking-wider flex items-center gap-2"><Trophy size={16} className="text-primary" /> Test Leaderboard</h3>
                </div>
                <div className="text-center py-10">
                    <p className="text-sm font-bold text-black/40">
                        {error ? 'Failed to load leaderboard' : 'No participants yet. Be the first!'}
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white border-3 border-black rounded-2xl shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
            {/* Header */}
            <div className="bg-black text-white px-5 py-3 flex items-center justify-between">
                <h3 className="font-black uppercase text-sm tracking-wider flex items-center gap-2"><Trophy size={16} className="text-primary" /> Test Leaderboard</h3>
                <span className="text-xs font-bold opacity-60">{leaderboard.length} students</span>
            </div>

            {/* User Rank Summary */}
            {userRank && (
                <div className="px-5 py-3 bg-blue-50 border-b-2 border-blue-200 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-500 border-2 border-black flex items-center justify-center text-white font-black text-sm">
                            #{userRank.rank}
                        </div>
                        <div>
                            <p className="text-sm font-black text-black">Your Position</p>
                            <p className="text-xs font-bold text-black/40">
                                Rank {userRank.rank} of {leaderboard.length}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="px-3 py-1 bg-white border-2 border-black rounded-full text-xs font-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
                            {userRank.score}/{userRank.totalMarks}
                        </span>
                        <span className="px-3 py-1 bg-blue-100 border-2 border-blue-300 rounded-full text-xs font-black text-blue-700 shadow-[1px_1px_0px_0px_rgba(59,130,246,0.3)]">
                            {userRank.percentile}%ile
                        </span>
                    </div>
                </div>
            )}

            {/* Table */}
            <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
                <table className="w-full text-left">
                    <thead className="bg-gray-100 border-b-2 border-gray-200 sticky top-0 z-10">
                        <tr>
                            <th className="p-3 font-black text-xs uppercase tracking-wide text-gray-500">Rank</th>
                            <th className="p-3 font-black text-xs uppercase tracking-wide text-gray-500">Student</th>
                            <th className="p-3 font-black text-xs uppercase tracking-wide text-gray-500 text-right">Score</th>
                            <th className="p-3 font-black text-xs uppercase tracking-wide text-gray-500 text-right hidden sm:table-cell">Accuracy</th>
                            <th className="p-3 font-black text-xs uppercase tracking-wide text-gray-500 text-right hidden md:table-cell">Time</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {leaderboard.slice(0, 15).map((entry) => (
                            <tr
                                key={entry.userId}
                                className={`${entry.isCurrentUser
                                    ? 'bg-blue-50 border-l-4 border-l-blue-500'
                                    : 'hover:bg-gray-50'
                                    } transition-colors`}
                            >
                                <td className="p-3">
                                    <div className={`
                                        w-7 h-7 flex items-center justify-center rounded-full text-xs font-black
                                        ${entry.rank === 1 ? 'bg-yellow-100 text-yellow-700 border border-yellow-400' :
                                            entry.rank === 2 ? 'bg-gray-100 text-gray-600 border border-gray-300' :
                                                entry.rank === 3 ? 'bg-orange-100 text-orange-600 border border-orange-300' :
                                                    'text-gray-400'}
                                    `}>
                                        {entry.rank <= 3 ? ['🥇', '🥈', '🥉'][entry.rank - 1] : entry.rank}
                                    </div>
                                </td>
                                <td className="p-3 font-bold text-sm text-black">
                                    {entry.userName}
                                    {entry.isCurrentUser && <span className="text-xs text-blue-400 ml-1">(You)</span>}
                                </td>
                                <td className="p-3 font-black text-sm text-right text-black">
                                    {entry.score}<span className="text-xs text-black/30">/{entry.totalMarks}</span>
                                </td>
                                <td className="p-3 text-sm font-bold text-gray-500 text-right hidden sm:table-cell">
                                    {entry.accuracy}%
                                </td>
                                <td className="p-3 text-sm font-bold text-gray-500 text-right hidden md:table-cell">
                                    {formatTime(entry.timeTaken)}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
