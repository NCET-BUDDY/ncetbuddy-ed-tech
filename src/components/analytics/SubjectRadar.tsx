"use client";

import {
    Chart as ChartJS,
    RadialLinearScale,
    PointElement,
    LineElement,
    Filler,
    Tooltip,
    Legend,
} from 'chart.js';
import { Radar } from 'react-chartjs-2';
import { Network } from "lucide-react";

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

interface SubjectRadarProps {
    subjectData: { subject: string; accuracy: number }[];
}

export default function SubjectRadar({ subjectData }: SubjectRadarProps) {
    if (subjectData.length < 3) {
        return (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 h-full flex flex-col items-center justify-center text-center">
                <Network size={32} className="mx-auto text-slate-300 mb-3" />
                <p className="text-sm font-medium text-slate-400">
                    Attempt tests in at least 3 subjects to unlock Radar View
                </p>
            </div>
        );
    }

    const data = {
        labels: subjectData.map(d => d.subject),
        datasets: [{
            label: 'Accuracy %',
            data: subjectData.map(d => d.accuracy),
            backgroundColor: 'rgba(99, 102, 241, 0.15)',
            borderColor: '#6366f1',
            borderWidth: 2,
            pointBackgroundColor: '#6366f1',
            pointBorderColor: '#fff',
            pointHoverBackgroundColor: '#fff',
            pointHoverBorderColor: '#6366f1',
        }],
    };

    const options = {
        scales: {
            r: {
                angleLines: { color: 'rgba(0,0,0,0.06)' },
                grid: { color: 'rgba(0,0,0,0.06)' },
                pointLabels: {
                    font: { size: 11, weight: 700 as const },
                    color: '#334155',
                },
                ticks: { display: false, stepSize: 20 },
                suggestedMin: 0,
                suggestedMax: 100,
            },
        },
        plugins: {
            legend: { display: false },
            tooltip: {
                backgroundColor: '#1e293b',
                titleFont: { weight: 'bold' as const },
                padding: 10,
                cornerRadius: 8,
                displayColors: false,
                callbacks: { label: (ctx: any) => `${ctx.raw}% Accuracy` },
            },
        },
        elements: { line: { tension: 0.2 } },
    };

    return (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 flex flex-col h-full shadow-sm">
            <div className="mb-4">
                <h3 className="text-base font-bold text-slate-800">Weakness Heatmap</h3>
                <p className="text-xs text-slate-400">Identify gaps at a glance</p>
            </div>
            <div className="flex-1 w-full max-h-[320px] relative">
                <Radar data={data} options={options} />
            </div>
        </div>
    );
}
