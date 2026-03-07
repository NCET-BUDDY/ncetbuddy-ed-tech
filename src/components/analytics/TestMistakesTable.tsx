"use client";

import { useState } from "react";
import { ArrowUpDown } from "lucide-react";

interface TestMistakeRow {
    testName: string;
    date: string;
    correct: number;
    incorrect: number;
    notAttempted: number;
    totalQuestions: number;
    accuracy: number; // 0-100
}

interface TestMistakesTableProps {
    rows: TestMistakeRow[];
}

// Mini accuracy donut ring
const AccuracyDonut = ({ accuracy }: { accuracy: number }) => {
    const size = 40;
    const strokeWidth = 4;
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (accuracy / 100) * circumference;
    const color = accuracy >= 70 ? '#10b981' : accuracy >= 40 ? '#f59e0b' : '#ef4444';

    return (
        <div className="relative" style={{ width: size, height: size }}>
            <svg width={size} height={size} className="transform -rotate-90">
                <circle
                    cx={size / 2} cy={size / 2} r={radius}
                    stroke="#f1f5f9" strokeWidth={strokeWidth} fill="transparent"
                />
                <circle
                    cx={size / 2} cy={size / 2} r={radius}
                    stroke={color} strokeWidth={strokeWidth} fill="transparent"
                    strokeDasharray={circumference} strokeDashoffset={offset}
                    strokeLinecap="round"
                    className="transition-all duration-700"
                />
            </svg>
        </div>
    );
};

export default function TestMistakesTable({ rows }: TestMistakesTableProps) {
    const [sortKey, setSortKey] = useState<'date' | 'accuracy' | 'wrong'>('date');

    const sortedRows = [...rows].sort((a, b) => {
        if (sortKey === 'accuracy') return b.accuracy - a.accuracy;
        if (sortKey === 'wrong') return b.incorrect - a.incorrect;
        return 0; // already sorted by date
    });

    if (rows.length === 0) {
        return (
            <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center shadow-sm">
                <p className="text-sm font-bold text-slate-400">No test data available</p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between flex-wrap gap-3">
                <h3 className="text-lg font-black text-slate-900">Test-wise Mistakes</h3>
                <div className="flex items-center gap-2">
                    <ArrowUpDown size={14} className="text-slate-400" />
                    <span className="text-xs font-bold text-slate-400">Sort By</span>
                    <select
                        value={sortKey}
                        onChange={(e) => setSortKey(e.target.value as any)}
                        className="text-xs font-bold text-slate-600 border border-slate-200 rounded-lg px-2 py-1 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    >
                        <option value="date">Date</option>
                        <option value="accuracy">Accuracy</option>
                        <option value="wrong">Most Mistakes</option>
                    </select>
                </div>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full min-w-[650px]">
                    <thead>
                        <tr className="border-b border-slate-100 bg-slate-50/50">
                            <th className="text-left px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Test name</th>
                            <th className="text-center px-3 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Accuracy<br />Trend</th>
                            <th className="text-center px-3 py-3 text-xs font-bold text-red-500 uppercase tracking-wider">Attempted<br />Wrong</th>
                            <th className="text-center px-3 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Not<br />Attempted</th>
                            <th className="text-center px-3 py-3 text-xs font-bold text-emerald-600 uppercase tracking-wider">Attempted<br />Correct</th>
                            <th className="text-center px-3 py-3 text-xs font-bold text-slate-700 uppercase tracking-wider">Total<br />Questions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sortedRows.map((row, idx) => (
                            <tr key={idx} className="border-b border-slate-50 hover:bg-slate-50/70 transition-colors cursor-pointer group">
                                <td className="px-6 py-4">
                                    <div>
                                        <p className="text-sm font-bold text-slate-800 group-hover:text-indigo-600 transition-colors truncate max-w-[200px]">
                                            {row.testName}
                                        </p>
                                        <p className="text-[10px] font-bold text-slate-400 mt-0.5">{row.date}</p>
                                    </div>
                                </td>
                                <td className="px-3 py-4">
                                    <div className="flex justify-center">
                                        <AccuracyDonut accuracy={row.accuracy} />
                                    </div>
                                </td>
                                <td className="px-3 py-4 text-center">
                                    <span className="text-sm font-black text-red-500">{row.incorrect}</span>
                                </td>
                                <td className="px-3 py-4 text-center">
                                    <span className="text-sm font-bold text-slate-600">{row.notAttempted}</span>
                                </td>
                                <td className="px-3 py-4 text-center">
                                    <span className="text-sm font-black text-emerald-600">{row.correct}</span>
                                </td>
                                <td className="px-3 py-4 text-center">
                                    <span className="text-sm font-black text-slate-800">{row.totalQuestions}</span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
