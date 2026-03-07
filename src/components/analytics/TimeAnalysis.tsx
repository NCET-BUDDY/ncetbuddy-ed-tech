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
import { Test, TestResult } from '@/types';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

interface TimeAnalysisProps {
    results: TestResult[];
    testDetailsMap: Map<string, Test>;
}

export default function TimeAnalysis({ results, testDetailsMap }: TimeAnalysisProps) {
    const processedData = results
        .slice(0, 10)
        .reverse()
        .map(res => {
            const test = testDetailsMap.get(res.testId);
            const title = test?.title || `Test ${res.id?.substring(0, 4)}`;
            let avgTime = 0;
            if (res.timeTaken && res.totalQuestions > 0) {
                avgTime = res.timeTaken / res.totalQuestions;
            } else if (res.questionTimes) {
                const total = Object.values(res.questionTimes).reduce((a, b) => a + b, 0);
                avgTime = total / res.totalQuestions;
            }
            return {
                title,
                avgTime: Math.round(avgTime),
                accuracy: Math.round((res.score / (res.totalQuestions * 4)) * 100)
            };
        });

    const data = {
        labels: processedData.map(d => d.title.substring(0, 10) + (d.title.length > 10 ? '...' : '')),
        datasets: [
            {
                label: 'Avg Time / Question (sec)',
                data: processedData.map(d => d.avgTime),
                borderColor: '#6366f1',
                backgroundColor: 'rgba(99, 102, 241, 0.05)',
                borderWidth: 2,
                tension: 0.4,
                fill: true,
                yAxisID: 'y',
            },
            {
                label: 'Accuracy (%)',
                data: processedData.map(d => d.accuracy),
                borderColor: '#ef4444',
                backgroundColor: 'transparent',
                borderWidth: 2,
                borderDash: [5, 5],
                tension: 0.4,
                yAxisID: 'y1',
            }
        ],
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index' as const, intersect: false },
        plugins: {
            legend: {
                display: true,
                labels: {
                    font: { weight: 'bold' as const, size: 11 },
                    color: '#475569',
                    usePointStyle: true,
                    boxWidth: 8,
                    padding: 16,
                },
            },
            tooltip: {
                backgroundColor: '#1e293b',
                titleFont: { weight: 'bold' as const },
                padding: 10,
                cornerRadius: 8,
            },
        },
        scales: {
            x: {
                grid: { display: false },
                ticks: { font: { weight: 'bold' as const, size: 10 }, color: '#94a3b8' },
            },
            y: {
                type: 'linear' as const,
                display: true,
                position: 'left' as const,
                title: { display: true, text: 'Seconds', font: { weight: 'bold' as const, size: 10 }, color: '#94a3b8' },
                grid: { color: 'rgba(0,0,0,0.04)' },
            },
            y1: {
                type: 'linear' as const,
                display: true,
                position: 'right' as const,
                title: { display: true, text: 'Accuracy %', font: { weight: 'bold' as const, size: 10 }, color: '#94a3b8' },
                grid: { drawOnChartArea: false },
                min: 0,
                max: 100,
            },
        },
    };

    return (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 h-full shadow-sm">
            <div className="mb-4">
                <h3 className="text-base font-bold text-slate-800">Time vs Efficiency</h3>
                <p className="text-xs text-slate-400">Are you rushing or taking too long?</p>
            </div>
            {processedData.length > 1 ? (
                <div className="w-full" style={{ height: '280px' }}>
                    <Line data={data} options={options} />
                </div>
            ) : (
                <div className="w-full flex flex-col items-center justify-center py-16 text-slate-300">
                    <span className="text-3xl mb-2">⏱️</span>
                    <p className="text-xs font-medium">Attempt more tests to see time analysis</p>
                </div>
            )}
        </div>
    );
}
