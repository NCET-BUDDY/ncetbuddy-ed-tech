"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { getTests, getAdminTestAnalytics } from "@/lib/pocketbase-db";
import { Test, AdminTestAnalytics } from "@/types";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

function formatTime(seconds: number): string {
    if (!seconds || seconds <= 0) return '—';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
}

export default function AdminTestAnalyticsPage() {
    const router = useRouter();
    const [tests, setTests] = useState<Test[]>([]);
    const [selectedTestId, setSelectedTestId] = useState<string>("");
    const [analytics, setAnalytics] = useState<AdminTestAnalytics | null>(null);
    const [loading, setLoading] = useState(true);
    const [analyticsLoading, setAnalyticsLoading] = useState(false);

    useEffect(() => {
        const fetchTests = async () => {
            try {
                const data = await getTests();
                setTests(data);
                if (data.length > 0) {
                    setSelectedTestId(data[0].id || "");
                }
            } catch (e) {
                console.error("Error fetching tests:", e);
            } finally {
                setLoading(false);
            }
        };
        fetchTests();
    }, []);

    useEffect(() => {
        if (!selectedTestId) return;
        const fetchAnalytics = async () => {
            setAnalyticsLoading(true);
            try {
                const data = await getAdminTestAnalytics(selectedTestId);
                setAnalytics(data);
            } catch (e) {
                console.error("Error fetching analytics:", e);
            } finally {
                setAnalyticsLoading(false);
            }
        };
        fetchAnalytics();
    }, [selectedTestId]);

    // Chart data: Score Distribution
    const scoreDistChart = analytics ? {
        labels: analytics.scoreDistribution.map(d => d.range),
        datasets: [{
            label: 'Students',
            data: analytics.scoreDistribution.map(d => d.count),
            backgroundColor: '#FFD02F',
            borderColor: '#000',
            borderWidth: 2,
            borderRadius: 6,
        }],
    } : null;

    // Chart data: Question Success Rates
    const successChart = analytics ? {
        labels: analytics.questionSuccessRates.map(q => `Q${q.questionIndex + 1}`),
        datasets: [{
            label: '% Correct',
            data: analytics.questionSuccessRates.map(q => q.correctPercent),
            backgroundColor: analytics.questionSuccessRates.map(q =>
                q.correctPercent >= 70 ? '#10B981' :
                    q.correctPercent >= 40 ? '#F59E0B' :
                        '#EF4444'
            ),
            borderColor: '#000',
            borderWidth: 1,
            borderRadius: 4,
        }],
    } : null;

    const barOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            tooltip: {
                backgroundColor: '#000',
                cornerRadius: 8,
                padding: 12,
                titleFont: { weight: 'bold' as const },
            },
        },
        scales: {
            y: {
                beginAtZero: true,
                grid: { color: 'rgba(0,0,0,0.05)' },
                ticks: { font: { weight: 'bold' as const, size: 11 } },
            },
            x: {
                grid: { display: false },
                ticks: { font: { weight: 'bold' as const, size: 10 } },
            },
        },
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-12">
            {/* Header */}
            <div className="bg-white border-b-4 border-black shadow-lg">
                <div className="max-w-6xl mx-auto px-4 py-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-black uppercase italic text-black">📊 Test Analytics</h1>
                        <p className="text-xs font-bold text-black/40 uppercase tracking-wide mt-1">Admin Dashboard • Test Performance Insights</p>
                    </div>
                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <select
                            value={selectedTestId}
                            onChange={(e) => setSelectedTestId(e.target.value)}
                            className="flex-1 md:flex-none px-4 py-2.5 bg-white border-2 border-black rounded-xl font-bold text-sm shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus:outline-none focus:ring-2 focus:ring-primary"
                        >
                            {tests.map(t => (
                                <option key={t.id} value={t.id}>{t.title}</option>
                            ))}
                        </select>
                        <Button
                            onClick={() => router.push('/admin')}
                            variant="outline"
                            className="border-2 border-black font-black text-xs shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                        >
                            ← Back
                        </Button>
                    </div>
                </div>
            </div>

            {analyticsLoading ? (
                <div className="flex justify-center items-center py-20">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-10 w-10 border-t-4 border-b-4 border-primary mx-auto"></div>
                        <p className="text-xs font-bold text-black/40 mt-4 uppercase tracking-widest">Analyzing test data...</p>
                    </div>
                </div>
            ) : analytics ? (
                <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">

                    {/* Overview Stats */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <StatCard label="Total Attempts" value={String(analytics.totalAttemptees)} icon="👥" color="#3B82F6" />
                        <StatCard label="Average Score" value={String(analytics.averageScore)} icon="📊" color="#F59E0B" />
                        <StatCard label="Highest Score" value={String(analytics.highestScore)} icon="🔥" color="#10B981" />
                        <StatCard label="Lowest Score" value={String(analytics.lowestScore)} icon="📉" color="#EF4444" />
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <StatCard label="Median Score" value={String(analytics.medianScore)} icon="📏" color="#8B5CF6" />
                        <StatCard label="Avg Time Taken" value={formatTime(analytics.averageTimeTaken)} icon="⏱" color="#06B6D4" />
                        <StatCard label="Questions" value={String(analytics.questionSuccessRates.length)} icon="❓" color="#D97706" />
                        <StatCard label="Test Title" value={analytics.testTitle.substring(0, 15)} icon="📝" color="#000" small />
                    </div>

                    {/* Score Distribution */}
                    {scoreDistChart && (
                        <Card className="p-6 border-3 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] bg-white">
                            <h3 className="text-sm font-black uppercase tracking-widest text-black/60 mb-1">Score Distribution</h3>
                            <p className="text-xs text-black/40 font-bold mb-4">How students&apos; scores are distributed across ranges</p>
                            <div style={{ height: 280 }}>
                                <Bar data={scoreDistChart} options={barOptions as any} />
                            </div>
                        </Card>
                    )}

                    {/* Question Success Rates */}
                    {successChart && (
                        <Card className="p-6 border-3 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] bg-white">
                            <h3 className="text-sm font-black uppercase tracking-widest text-black/60 mb-1">Question Success Rates</h3>
                            <p className="text-xs text-black/40 font-bold mb-4">
                                % of students who answered each question correctly •
                                <span className="text-green-600"> Green: Easy</span> /
                                <span className="text-yellow-600"> Yellow: Medium</span> /
                                <span className="text-red-600"> Red: Hard</span>
                            </p>
                            <div style={{ height: Math.max(250, analytics.questionSuccessRates.length * 18) }}>
                                <Bar data={successChart} options={{
                                    ...barOptions as any,
                                    scales: {
                                        ...barOptions.scales,
                                        y: { ...barOptions.scales.y, max: 100, ticks: { ...barOptions.scales.y.ticks, callback: (v: any) => `${v}%` } },
                                    },
                                }} />
                            </div>
                        </Card>
                    )}

                    {/* Question Details Table */}
                    <Card className="border-3 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] bg-white overflow-hidden">
                        <div className="bg-black text-white px-5 py-3">
                            <h3 className="font-black uppercase text-sm tracking-wider">Question-Level Breakdown</h3>
                        </div>
                        <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
                            <table className="w-full text-left">
                                <thead className="bg-gray-100 border-b-2 border-gray-200 sticky top-0">
                                    <tr>
                                        <th className="p-3 font-black text-xs uppercase text-gray-500">#</th>
                                        <th className="p-3 font-black text-xs uppercase text-gray-500">Success Rate</th>
                                        <th className="p-3 font-black text-xs uppercase text-gray-500">Difficulty</th>
                                        <th className="p-3 font-black text-xs uppercase text-gray-500 text-right">Visual</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {analytics.questionSuccessRates.map((q) => {
                                        const difficulty = q.correctPercent >= 70 ? 'Easy' : q.correctPercent >= 40 ? 'Medium' : 'Hard';
                                        const diffColor = q.correctPercent >= 70 ? '#10B981' : q.correctPercent >= 40 ? '#F59E0B' : '#EF4444';
                                        return (
                                            <tr key={q.questionIndex} className="hover:bg-gray-50">
                                                <td className="p-3 font-black text-sm">Q{q.questionIndex + 1}</td>
                                                <td className="p-3 font-bold text-sm">{q.correctPercent}%</td>
                                                <td className="p-3">
                                                    <span className="px-2 py-1 rounded-full text-[10px] font-black uppercase"
                                                        style={{ color: diffColor, backgroundColor: diffColor + '15' }}>
                                                        {difficulty}
                                                    </span>
                                                </td>
                                                <td className="p-3 text-right">
                                                    <div className="w-24 bg-gray-200 rounded-full h-2 inline-block">
                                                        <div
                                                            className="h-full rounded-full transition-all"
                                                            style={{ width: `${q.correctPercent}%`, backgroundColor: diffColor }}
                                                        ></div>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </Card>

                    {/* Drop-off Analysis */}
                    {analytics.dropOffPoints.length > 0 && (
                        <Card className="p-6 border-3 border-orange-400 bg-orange-50 shadow-[6px_6px_0px_0px_rgba(251,146,60,0.3)]">
                            <h3 className="text-sm font-black uppercase tracking-widest text-orange-700 mb-3">⚠️ Drop-off Points</h3>
                            <p className="text-xs text-orange-600/70 font-bold mb-4">Questions where students stopped answering</p>
                            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                                {analytics.dropOffPoints.slice(0, 5).map((dp) => (
                                    <div key={dp.questionIndex} className="bg-white rounded-xl border-2 border-orange-300 p-3 text-center">
                                        <div className="text-lg font-black text-orange-700">Q{dp.questionIndex + 1}</div>
                                        <div className="text-xs font-bold text-orange-500">{dp.dropCount} students dropped</div>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    )}
                </div>
            ) : (
                <div className="text-center py-20">
                    <p className="text-lg font-bold text-black/40">No analytics available for this test</p>
                </div>
            )}
        </div>
    );
}

function StatCard({ label, value, icon, color, small }: { label: string; value: string; icon: string; color: string; small?: boolean }) {
    return (
        <div className="bg-white border-2 border-black rounded-xl p-4 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] text-center hover:scale-[1.02] transition-transform">
            <div className="text-xl mb-1">{icon}</div>
            <div className={`font-black text-black ${small ? 'text-sm' : 'text-2xl'}`}>{value}</div>
            <div className="text-[9px] font-black uppercase tracking-widest text-black/40 mt-1">{label}</div>
        </div>
    );
}
