"use client";

import { CheckCheck, Calculator, Atom, FlaskConical } from "lucide-react";

interface SubjectStats {
    subject: string;
    avgScore: number;
    attemptedCorrect: number;
    attemptedWrong: number;
    notAttempted: number;
    notVisited: number;
}

interface PerformanceSummaryTableProps {
    stats: SubjectStats[];
}

const subjectIcons: Record<string, React.ReactNode> = {
    "Overall": <CheckCheck size={16} className="text-indigo-600" />,
    "Mathematics": <Calculator size={16} className="text-blue-600" />,
    "Physics": <Atom size={16} className="text-amber-600" />,
    "Chemistry": <FlaskConical size={16} className="text-red-600" />,
};

const BarCell = ({ value, color }: { value: number; color: string }) => (
    <td className="px-3 py-4 text-center">
        <div className="flex items-center gap-2">
            <div className="w-1 h-8 rounded-full overflow-hidden bg-slate-100">
                <div
                    className={`w-full rounded-full transition-all duration-700 ${color}`}
                    style={{ height: `${Math.min(100, value)}%` }}
                />
            </div>
            <span className="text-sm font-bold text-slate-800">{value}%</span>
        </div>
    </td>
);

export default function PerformanceSummaryTable({ stats }: PerformanceSummaryTableProps) {
    if (stats.length === 0) {
        return (
            <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center">
                <p className="text-sm font-bold text-slate-400">Attempt tests to see your performance summary</p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="px-6 py-4 border-b border-slate-100">
                <h3 className="text-lg font-black text-slate-900">Summary</h3>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full min-w-[600px]">
                    <thead>
                        <tr className="border-b border-slate-100">
                            <th className="text-left px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Subject</th>
                            <th className="text-center px-3 py-3 text-xs font-bold text-orange-500 uppercase tracking-wider">Average<br />Score</th>
                            <th className="text-center px-3 py-3 text-xs font-bold text-emerald-600 uppercase tracking-wider">Attempted<br />Correct</th>
                            <th className="text-center px-3 py-3 text-xs font-bold text-red-500 uppercase tracking-wider">Attempted<br />Wrong</th>
                            <th className="text-center px-3 py-3 text-xs font-bold text-indigo-500 uppercase tracking-wider">Not<br />Attempted</th>
                            <th className="text-center px-3 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">Not<br />Visited Qs</th>
                        </tr>
                    </thead>
                    <tbody>
                        {stats.map((row, idx) => (
                            <tr key={row.subject} className={`border-b border-slate-50 ${idx === 0 ? "bg-slate-50/50" : ""} hover:bg-slate-50 transition-colors`}>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-2.5">
                                        {subjectIcons[row.subject] || <CheckCheck size={16} className="text-slate-400" />}
                                        <span className="text-sm font-bold text-slate-800">{row.subject}</span>
                                    </div>
                                </td>
                                <BarCell value={row.avgScore} color="bg-orange-400" />
                                <BarCell value={row.attemptedCorrect} color="bg-emerald-500" />
                                <BarCell value={row.attemptedWrong} color="bg-red-400" />
                                <BarCell value={row.notAttempted} color="bg-indigo-400" />
                                <BarCell value={row.notVisited} color="bg-slate-300" />
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
