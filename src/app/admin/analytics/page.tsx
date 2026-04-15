"use client";

import { useEffect, useState } from "react";
import { getAllUserAnalytics } from "@/lib/pocketbase-db";
import { UserAnalytics } from "@/types";
import { Card } from "@/components/ui/Card";

export default function AnalyticsPage() {
    const [analytics, setAnalytics] = useState<UserAnalytics[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAnalytics = async () => {
            try {
                const data = await getAllUserAnalytics();
                setAnalytics(data || []);
            } catch (error) {
                console.error("Failed to fetch analytics", error);
            } finally {
                setLoading(false);
            }
        };
        fetchAnalytics();
    }, []);

    const now = Math.floor(Date.now() / 1000);
    const totalUsers = analytics.length;
    const activeUsers24h = analytics.filter(u => (now - (u.lastActive || 0)) < 86400).length;
    const totalSessions = analytics.reduce((acc, curr) => acc + (curr.sessions || 0), 0);
    const avgSessionTime = totalSessions > 0
        ? analytics.reduce((acc, curr) => acc + (curr.totalTime || 0), 0) / totalSessions
        : 0;

    // Sort logic
    const [sortField, setSortField] = useState<keyof UserAnalytics>('lastActive');
    const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

    const handleSort = (field: keyof UserAnalytics) => {
        if (sortField === field) {
            setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDir('desc');
        }
    };

    const sortedAnalytics = [...analytics].sort((a, b) => {
        const valA = a[sortField] || 0;
        const valB = b[sortField] || 0;
        if (valA < valB) return sortDir === 'asc' ? -1 : 1;
        if (valA > valB) return sortDir === 'asc' ? 1 : -1;
        return 0;
    });

    const formatTime = (seconds: number) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        return h > 0 ? `${h}h ${m}m` : `${m}m`;
    };

    const formatDate = (timestamp: number) => {
        if (!timestamp) return 'Never';
        return new Date(timestamp * 1000).toLocaleDateString() + ' ' + new Date(timestamp * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    if (loading) {
        return <div className="p-8 text-center animate-pulse">Loading Analytics Data...</div>;
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <h1 className="text-3xl font-black uppercase tracking-tighter italic">Admin Analytics Dashboard</h1>

            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="p-6 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] bg-white">
                    <h3 className="text-sm font-bold uppercase text-gray-500">Total Users Tracked</h3>
                    <p className="text-4xl font-black mt-2">{analytics.length}</p>
                </Card>
                <Card className="p-6 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] bg-white">
                    <h3 className="text-sm font-bold uppercase text-gray-500">Active Users (24h)</h3>
                    <p className="text-4xl font-black mt-2 text-green-600">{activeUsers24h}</p>
                </Card>
                <Card className="p-6 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] bg-white">
                    <h3 className="text-sm font-bold uppercase text-gray-500">Avg. Session Time</h3>
                    <p className="text-4xl font-black mt-2 text-blue-600">{formatTime(avgSessionTime)}</p>
                </Card>
                <Card className="p-6 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] bg-white">
                    <h3 className="text-sm font-bold uppercase text-gray-500">Total Sessions</h3>
                    <p className="text-4xl font-black mt-2 text-purple-600">{totalSessions}</p>
                </Card>
            </div>

            {/* User Activity Table */}
            <div className="bg-white border-2 border-black rounded-xl overflow-hidden shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <div className="p-4 border-b-2 border-black bg-gray-50 flex justify-between items-center">
                    <h2 className="text-xl font-black uppercase tracking-tight">Smart User Profiles</h2>
                    <span className="text-sm font-bold text-gray-500">{analytics.length} Users</span>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-100/50 border-b-2 border-black text-xs uppercase tracking-wider font-black text-gray-600">
                                <th className="p-4 cursor-pointer hover:bg-gray-200" onClick={() => handleSort('userId')}>Student</th>
                                <th className="p-4 cursor-pointer hover:bg-gray-200" onClick={() => handleSort('lastActive')}>Last Active {sortField === 'lastActive' && (sortDir === 'asc' ? '↑' : '↓')}</th>
                                <th className="p-4 cursor-pointer hover:bg-gray-200" onClick={() => handleSort('totalTime')}>Total Time {sortField === 'totalTime' && (sortDir === 'asc' ? '↑' : '↓')}</th>
                                <th className="p-4 cursor-pointer hover:bg-gray-200" onClick={() => handleSort('sessions')}>Sessions {sortField === 'sessions' && (sortDir === 'asc' ? '↑' : '↓')}</th>
                                <th className="p-4 cursor-pointer hover:bg-gray-200" onClick={() => handleSort('testsAttempted')}>Tests Taken {sortField === 'testsAttempted' && (sortDir === 'asc' ? '↑' : '↓')}</th>
                                <th className="p-4 cursor-pointer hover:bg-gray-200" onClick={() => handleSort('engagementLevel')}>Engagement {sortField === 'engagementLevel' && (sortDir === 'asc' ? '↑' : '↓')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {sortedAnalytics.map((user) => (
                                <tr key={user.userId} className="hover:bg-primary/5 transition-colors">
                                    <td className="p-4">
                                        <div className="font-bold text-sm">{(user as any).displayName || 'Unknown'}</div>
                                        <div className="text-xs text-gray-400">{(user as any).email || user.userId}</div>
                                    </td>
                                    <td className="p-4 font-medium">{formatDate(user.lastActive)}</td>
                                    <td className="p-4 font-bold text-blue-600">{formatTime(user.totalTime)}</td>
                                    <td className="p-4">{user.sessions}</td>
                                    <td className="p-4">{user.testsAttempted}</td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 rounded text-xs font-black uppercase border border-black ${user.engagementLevel === 'High' ? 'bg-green-300' :
                                            user.engagementLevel === 'Medium' ? 'bg-yellow-200' : 'bg-gray-200'
                                            }`}>
                                            {user.engagementLevel || 'Low'}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                            {sortedAnalytics.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="p-8 text-center text-gray-500 font-bold italic">No user activity recorded yet.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Simple Growth Chart Visual (CSS Only) */}
            <div className="bg-white border-2 border-black rounded-xl p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <h2 className="text-xl font-black uppercase tracking-tight mb-4">Engagement Distribution</h2>
                <div className="flex items-end gap-2 h-40 border-b-2 border-black pb-2">
                    {['High', 'Medium', 'Low'].map(level => {
                        const count = analytics.filter(u => (u.engagementLevel || 'Low') === level).length;
                        const height = totalUsers > 0 ? (count / totalUsers) * 100 : 0;
                        return (
                            <div key={level} className="flex-1 flex flex-col justify-end items-center group">
                                <div
                                    className={`w-full max-w-[80px] rounded-t-lg border-2 border-black transition-all group-hover:opacity-80 ${level === 'High' ? 'bg-green-400' :
                                        level === 'Medium' ? 'bg-yellow-300' : 'bg-gray-300'
                                        }`}
                                    style={{ height: `${Math.max(height, 5)}%` }}
                                >
                                    <span className="block text-center pt-2 font-black text-xs">{count}</span>
                                </div>
                                <span className="mt-2 text-xs font-bold uppercase">{level}</span>
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    );
}
