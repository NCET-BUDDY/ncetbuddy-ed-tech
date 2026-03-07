"use client";

import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

interface TestMistakeData {
    testName: string;
    correct: number;
    incorrect: number;
    notAttempted: number;
}

interface MistakesOverviewChartProps {
    data: TestMistakeData[];
}

export default function MistakesOverviewChart({ data }: MistakesOverviewChartProps) {
    if (data.length < 2) {
        return (
            <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center shadow-sm">
                <p className="text-sm font-bold text-slate-400">Attempt more tests to see your mistakes overview</p>
            </div>
        );
    }

    const chartData = {
        labels: data.map(d => d.testName.length > 12 ? d.testName.substring(0, 12) + "..." : d.testName),
        datasets: [
            {
                label: 'Correct Qs',
                data: data.map(d => d.correct),
                borderColor: '#10b981',
                backgroundColor: 'rgba(16, 185, 129, 0.05)',
                borderWidth: 2.5,
                tension: 0.4,
                fill: false,
                pointBackgroundColor: '#10b981',
                pointRadius: 3,
                pointHoverRadius: 5,
            },
            {
                label: 'Not attempted Qs',
                data: data.map(d => d.notAttempted),
                borderColor: '#6366f1',
                backgroundColor: 'rgba(99, 102, 241, 0.05)',
                borderWidth: 2.5,
                tension: 0.4,
                fill: false,
                pointBackgroundColor: '#6366f1',
                pointRadius: 3,
                pointHoverRadius: 5,
            },
            {
                label: 'Incorrect Qs',
                data: data.map(d => d.incorrect),
                borderColor: '#ef4444',
                backgroundColor: 'rgba(239, 68, 68, 0.05)',
                borderWidth: 2.5,
                tension: 0.4,
                fill: false,
                pointBackgroundColor: '#ef4444',
                pointRadius: 3,
                pointHoverRadius: 5,
            },
        ],
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index' as const, intersect: false },
        plugins: {
            legend: {
                display: true,
                position: 'top' as const,
                align: 'start' as const,
                labels: {
                    usePointStyle: true,
                    pointStyle: 'circle',
                    font: { size: 11, weight: 'bold' as const },
                    color: '#475569',
                    padding: 20,
                    boxWidth: 8,
                },
            },
            tooltip: {
                backgroundColor: '#1e293b',
                titleFont: { weight: 'bold' as const },
                padding: 12,
                cornerRadius: 10,
                displayColors: true,
            },
        },
        scales: {
            x: {
                grid: { display: false },
                ticks: { font: { size: 10, weight: 'bold' as const }, color: '#94a3b8', maxRotation: 45 },
            },
            y: {
                grid: { color: 'rgba(0,0,0,0.04)' },
                ticks: { font: { size: 10 }, color: '#94a3b8', stepSize: 15 },
                beginAtZero: true,
            },
        },
    };

    return (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-black text-slate-900">Your Mistakes Overview</h3>
                    <p className="text-xs text-slate-400 mt-0.5">This graph shows how you performed through different tests you attempted</p>
                </div>
            </div>
            <div className="p-4 md:p-6" style={{ height: '320px' }}>
                <Line data={chartData} options={options} />
            </div>
        </div>
    );
}
