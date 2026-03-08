"use client";

import { useEffect, useState, Suspense, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { getTestById, getTestPerformanceSummary, getQuestionLevelAnalysis } from "@/lib/appwrite-db";
import { Test, Question, TestPerformanceSummary, QuestionAnalysis, TestRankEntry } from "@/types";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { LatexRenderer } from "@/components/ui/LatexRenderer";
import { useAuth } from "@/context/AuthContext";
import {
    Timer,
    TrendingUp,
    AlertCircle,
    Info,
    CheckCircle2,
    XCircle,
    Target,
    Clock,
    Trophy,
    BarChart3
} from "lucide-react";

// Chart.js dynamic import for SSR safety
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
    PointElement,
    LineElement,
    Filler,
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend, PointElement, LineElement, Filler);

// ─── Utility ──────────────────────────────────────────
function formatTime(seconds: number): string {
    if (!seconds || seconds <= 0) return '—';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
}

function getPercentileColor(p: number): string {
    if (p >= 90) return '#10B981';
    if (p >= 70) return '#3B82F6';
    if (p >= 50) return '#F59E0B';
    return '#EF4444';
}

function getScoreEmoji(percent: number): string {
    if (percent >= 90) return '🏆';
    if (percent >= 75) return '🌟';
    if (percent >= 50) return '💪';
    if (percent >= 30) return '📈';
    return '🎯';
}


// ─── Main Component ───────────────────────────────────
function TestReviewContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { user } = useAuth();
    const testId = searchParams.get("testId");
    const score = parseInt(searchParams.get("score") || "0");
    const totalQuestions = parseInt(searchParams.get("total") || "0");

    const [test, setTest] = useState<Test | null>(null);
    const [userAnswers, setUserAnswers] = useState<Record<number, number>>({});
    const [questionTimes, setQuestionTimes] = useState<Record<number, number>>({});
    const [timeTaken, setTimeTaken] = useState<number>(0);
    const [loading, setLoading] = useState(true);
    const [performance, setPerformance] = useState<TestPerformanceSummary | null>(null);
    const [questionAnalysis, setQuestionAnalysis] = useState<QuestionAnalysis[]>([]);
    const [activeTab, setActiveTab] = useState<'overview' | 'analysis' | 'leaderboard'>('overview');
    const [showAllQuestions, setShowAllQuestions] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            if (!testId || !user) {
                router.push("/dashboard/tests");
                return;
            }

            try {
                // Get user answers from sessionStorage
                const storedAnswers = sessionStorage.getItem(`test_answers_${testId}`);
                const storedTimes = sessionStorage.getItem(`test_questionTimes_${testId}`);
                const storedTimeTaken = sessionStorage.getItem(`test_timeTaken_${testId}`);

                let parsedAnswers: Record<number, number> = {};
                let parsedQuestionTimes: Record<number, number> = {};

                if (storedAnswers) {
                    parsedAnswers = JSON.parse(storedAnswers);
                    setUserAnswers(parsedAnswers);
                    sessionStorage.removeItem(`test_answers_${testId}`);
                }
                if (storedTimes) {
                    parsedQuestionTimes = JSON.parse(storedTimes);
                    setQuestionTimes(parsedQuestionTimes);
                    sessionStorage.removeItem(`test_questionTimes_${testId}`);
                }
                if (storedTimeTaken) {
                    setTimeTaken(parseInt(storedTimeTaken) || 0);
                    sessionStorage.removeItem(`test_timeTaken_${testId}`);
                }

                // Fetch data concurrently for performance
                const [testData, perfData, analysis] = await Promise.all([
                    getTestById(testId),
                    getTestPerformanceSummary(testId, user.$id),
                    getQuestionLevelAnalysis(testId, parsedAnswers, parsedQuestionTimes)
                ]);

                if (testData) setTest(testData);
                if (perfData) {
                    setPerformance(perfData);

                    // Fallback: If session storage was empty, use data from perfData
                    if (Object.keys(parsedAnswers).length === 0 && perfData.answers) {
                        setUserAnswers(perfData.answers);
                        parsedAnswers = perfData.answers;
                    }
                    if (Object.keys(parsedQuestionTimes).length === 0 && perfData.questionTimes) {
                        setQuestionTimes(perfData.questionTimes);
                        parsedQuestionTimes = perfData.questionTimes;
                    }
                    if (timeTaken === 0 && perfData.timeTaken) {
                        setTimeTaken(perfData.timeTaken);
                    }
                }

                // Recalculate analysis if we got new answers from fallback
                const finalAnalysis = analysis.length > 0 ? analysis :
                    await getQuestionLevelAnalysis(testId, parsedAnswers, parsedQuestionTimes);

                setQuestionAnalysis(finalAnalysis);

            } catch (error) {
                console.error("Error loading test review:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [testId, router, user]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 gap-4">
                <div className="relative w-20 h-20">
                    <div className="absolute inset-0 rounded-full border-4 border-gray-200"></div>
                    <div className="absolute inset-0 rounded-full border-4 border-t-primary border-r-transparent border-b-transparent border-l-transparent animate-spin"></div>
                </div>
                <p className="text-sm font-bold text-black/50 uppercase tracking-widest animate-pulse">
                    Analyzing your performance...
                </p>
            </div>
        );
    }

    if (!test) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-black mb-4">Test Not Found</h2>
                    <Button onClick={() => router.push("/dashboard/tests")}>Back to Tests</Button>
                </div>
            </div>
        );
    }

    const maxScore = totalQuestions * 4;
    const percentage = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
    const correctCount = test.questions.filter((q, idx) => userAnswers[idx] === q.correctAnswer).length;
    const incorrectCount = Object.keys(userAnswers).length - correctCount;
    const unattempted = totalQuestions - Object.keys(userAnswers).length;

    // Chart data
    const breakdownData = {
        labels: ['Correct', 'Incorrect', 'Unattempted'],
        datasets: [{
            data: [correctCount, incorrectCount, unattempted],
            backgroundColor: ['#10B981', '#EF4444', '#9CA3AF'],
            borderColor: ['#059669', '#DC2626', '#6B7280'],
            borderWidth: 2,
        }],
    };

    const doughnutOptions = {
        responsive: true,
        cutout: '65%',
        plugins: {
            legend: { display: false },
            tooltip: {
                backgroundColor: '#000',
                titleFont: { weight: 'bold' as const, size: 13 },
                bodyFont: { size: 12 },
                cornerRadius: 8,
                padding: 12,
            },
        },
    };

    // Question success rate bar chart
    const successRateData = {
        labels: questionAnalysis.map((_, i) => `Q${i + 1}`),
        datasets: [{
            label: '% Students Correct',
            data: questionAnalysis.map(q => q.globalCorrectPercent),
            backgroundColor: questionAnalysis.map(q =>
                q.status === 'correct' ? '#10B981' :
                    q.status === 'incorrect' ? '#EF4444' : '#D1D5DB'
            ),
            borderColor: '#000',
            borderWidth: 1,
            borderRadius: 4,
        }],
    };

    const barOptions = {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
            y: {
                beginAtZero: true,
                max: 100,
                grid: { color: 'rgba(0,0,0,0.05)' },
                ticks: { font: { weight: 'bold' as const, size: 11 }, callback: (value: any) => `${value}%` },
            },
            x: {
                grid: { display: false },
                ticks: { font: { weight: 'bold' as const, size: 10 } },
            },
        },
        plugins: {
            legend: { display: false },
            tooltip: {
                backgroundColor: '#000',
                titleFont: { weight: 'bold' as const },
                bodyFont: { size: 12 },
                cornerRadius: 8,
                padding: 12,
                callbacks: {
                    label: (ctx: any) => {
                        const q = questionAnalysis[ctx.dataIndex];
                        return [
                            `${q.globalCorrectPercent}% students got this right`,
                            `Your answer: ${q.status === 'correct' ? '✓ Correct' : q.status === 'incorrect' ? '✗ Wrong' : '— Skipped'}`,
                        ];
                    },
                },
            },
        },
    };

    // Identify weak & strong topics
    const weakQuestions = questionAnalysis.filter(q => q.status === 'incorrect');
    const strongQuestions = questionAnalysis.filter(q => q.status === 'correct');

    // Questions to display in analysis tab
    const displayQuestions = showAllQuestions ? test.questions : test.questions.slice(0, 10);

    return (
        <div className="min-h-screen bg-gray-50 pb-32 md:pb-24">

            {/* ─── HERO HEADER ──────────────────────────────────────── */}
            <div className="sticky top-0 z-50 bg-white border-b-4 border-black shadow-xl">
                <div className="max-w-6xl mx-auto px-4 py-3 md:py-5">
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
                        <div className="w-full md:w-auto">
                            <h1 className="text-lg md:text-2xl font-black text-black uppercase italic truncate">
                                {getScoreEmoji(percentage)} Performance Report
                            </h1>
                            <p className="text-xs font-bold text-black/50 uppercase tracking-wide mt-0.5">
                                {test.title}
                            </p>
                        </div>
                        <div className="flex items-center gap-2 w-full md:w-auto">
                            <div className="flex-1 md:flex-none text-center px-3 py-2 md:px-5 md:py-3 bg-primary border-2 border-black rounded-xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                                <div className="text-lg md:text-2xl font-black text-black">{score}<span className="text-xs opacity-40">/{maxScore}</span></div>
                                <div className="text-[9px] md:text-[10px] font-black text-black/50 uppercase">Score</div>
                            </div>
                            {performance && (
                                <>
                                    <div className="flex-1 md:flex-none text-center px-3 py-2 md:px-5 md:py-3 bg-white border-2 border-black rounded-xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                                        <div className="text-lg md:text-2xl font-black text-black">
                                            {performance.rank}<span className="text-xs opacity-40">/{performance.totalAttemptees}</span>
                                        </div>
                                        <div className="text-[9px] md:text-[10px] font-black text-black/50 uppercase">Rank</div>
                                    </div>
                                    <div className="flex-1 md:flex-none text-center px-3 py-2 md:px-5 md:py-3 border-2 border-black rounded-xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]" style={{ backgroundColor: getPercentileColor(performance.percentile) + '20' }}>
                                        <div className="text-lg md:text-2xl font-black" style={{ color: getPercentileColor(performance.percentile) }}>
                                            {performance.percentile}%
                                        </div>
                                        <div className="text-[9px] md:text-[10px] font-black text-black/50 uppercase">Percentile</div>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Tab Navigation */}
                    <div className="flex gap-1 mt-3 bg-gray-100 rounded-lg p-1">
                        {(['overview', 'analysis', 'leaderboard'] as const).map(tab => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`flex-1 py-2 px-3 rounded-md text-xs font-black uppercase tracking-wide transition-all ${activeTab === tab
                                    ? 'bg-black text-white shadow-md'
                                    : 'text-black/50 hover:text-black hover:bg-white'
                                    }`}
                            >
                                {tab === 'overview' ? '📊 Overview' : tab === 'analysis' ? '🔍 Analysis' : '🏆 Leaderboard'}
                            </button>
                        ))}
                    </div>
                </div>
            </div>


            {/* ─── TAB: OVERVIEW ────────────────────────────────────── */}
            {activeTab === 'overview' && (
                <div className="max-w-6xl mx-auto px-4 py-6 md:py-8 space-y-6">

                    {/* Score Cards Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                        <ScoreCard
                            icon="✔"
                            label="Correct"
                            value={String(correctCount)}
                            color="#10B981"
                            bgColor="#D1FAE5"
                            subtext={`+${correctCount * 4} marks`}
                        />
                        <ScoreCard
                            icon="❌"
                            label="Incorrect"
                            value={String(incorrectCount)}
                            color="#EF4444"
                            bgColor="#FEE2E2"
                            subtext={`-${incorrectCount} marks`}
                        />
                        <ScoreCard
                            icon="➖"
                            label="Unattempted"
                            value={String(unattempted)}
                            color="#6B7280"
                            bgColor="#F3F4F6"
                            subtext="0 marks"
                        />
                        <ScoreCard
                            icon="🎯"
                            label="Accuracy"
                            value={`${percentage}%`}
                            color="#3B82F6"
                            bgColor="#DBEAFE"
                            subtext={timeTaken > 0 ? formatTime(timeTaken) : '—'}
                        />
                    </div>

                    {/* New Premium Metrics Row */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <PremiumScoreCard
                            icon={<TrendingUp size={18} className="text-emerald-500" />}
                            label="Positive Score"
                            value={String(correctCount * 4)}
                            max={String(maxScore)}
                            info="Total marks earned from correct answers"
                        />
                        <PremiumScoreCard
                            icon={<AlertCircle size={18} className="text-red-500" />}
                            label="Marks Lost"
                            value={String(incorrectCount)}
                            max={String(maxScore)}
                            info="Total marks lost due to negative marking"
                        />
                        <PremiumScoreCard
                            icon={<Timer size={18} className="text-orange-500" />}
                            label="Time Taken"
                            value={timeTaken > 60 ? Math.floor(timeTaken / 60) : 0}
                            unit="min"
                            info="Total time spent on the test"
                            totalSecs={timeTaken}
                        />
                    </div>

                    {/* Charts Row */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">

                        {/* Doughnut Chart */}
                        <Card className="p-5 md:p-6 border-3 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] bg-white">
                            <h3 className="text-sm font-black uppercase tracking-widest text-black/60 mb-4">Question Breakdown</h3>
                            <div className="flex items-center gap-6">
                                <div className="w-36 h-36 md:w-44 md:h-44 relative">
                                    <Doughnut data={breakdownData} options={doughnutOptions} />
                                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                                        <span className="text-2xl font-black text-black">{totalQuestions}</span>
                                        <span className="text-[10px] font-bold text-black/40 uppercase">Questions</span>
                                    </div>
                                </div>
                                <div className="space-y-3 flex-1">
                                    <LegendItem color="#10B981" label="Correct" value={correctCount} total={totalQuestions} />
                                    <LegendItem color="#EF4444" label="Incorrect" value={incorrectCount} total={totalQuestions} />
                                    <LegendItem color="#9CA3AF" label="Unattempted" value={unattempted} total={totalQuestions} />
                                </div>
                            </div>
                        </Card>

                        {/* Performance Gauges */}
                        <Card className="p-5 md:p-6 border-3 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] bg-white">
                            <h3 className="text-sm font-black uppercase tracking-widest text-black/60 mb-4">Performance Metrics</h3>
                            <div className="space-y-4">
                                <MetricBar label="Score" value={score} max={maxScore} color="#FFD02F" />
                                <MetricBar label="Accuracy" value={percentage} max={100} color="#3B82F6" suffix="%" />
                                {performance && (
                                    <>
                                        <MetricBar label="Percentile" value={performance.percentile} max={100} color={getPercentileColor(performance.percentile)} suffix="%" />
                                        <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                                            <span className="text-xs font-bold text-black/50 uppercase">Avg Score (All)</span>
                                            <span className="text-lg font-black text-black">{performance.averageScore}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-xs font-bold text-black/50 uppercase">Highest Score</span>
                                            <span className="text-lg font-black text-primary">{performance.highestScore}</span>
                                        </div>
                                    </>
                                )}
                            </div>
                        </Card>
                    </div>

                    {/* Global Success Rate Bar Chart */}
                    {questionAnalysis.length > 0 && (
                        <Card className="p-5 md:p-6 border-3 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] bg-white">
                            <h3 className="text-sm font-black uppercase tracking-widest text-black/60 mb-2">Question Difficulty</h3>
                            <p className="text-xs text-black/40 font-bold mb-4">% of students who answered correctly • Your answers color-coded</p>
                            <div style={{ height: Math.max(200, Math.min(350, questionAnalysis.length * 20)) }}>
                                <Bar data={successRateData} options={barOptions as any} />
                            </div>
                            <div className="flex gap-4 mt-3 justify-center">
                                <span className="flex items-center gap-1.5 text-xs font-bold text-black/50">
                                    <span className="w-3 h-3 rounded-sm bg-[#10B981] border border-black"></span> You got it right
                                </span>
                                <span className="flex items-center gap-1.5 text-xs font-bold text-black/50">
                                    <span className="w-3 h-3 rounded-sm bg-[#EF4444] border border-black"></span> You got it wrong
                                </span>
                                <span className="flex items-center gap-1.5 text-xs font-bold text-black/50">
                                    <span className="w-3 h-3 rounded-sm bg-[#D1D5DB] border border-black"></span> Skipped
                                </span>
                            </div>
                        </Card>
                    )}

                    {/* Strengths & Weaknesses */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Card className="p-5 border-2 border-green-300 bg-green-50 shadow-[4px_4px_0px_0px_rgba(16,185,129,0.3)]">
                            <h3 className="text-sm font-black uppercase tracking-widest text-green-700 mb-3">💪 Strong Areas</h3>
                            {strongQuestions.length === 0 ? (
                                <p className="text-sm text-green-600 font-bold">No correct answers yet. Keep practicing!</p>
                            ) : (
                                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                                    {strongQuestions.slice(0, 8).map(q => (
                                        <div key={q.questionIndex} className="flex items-center justify-between text-sm bg-white/60 rounded-lg px-3 py-2">
                                            <span className="font-bold text-green-800">Q{q.questionIndex + 1}</span>
                                            <span className="text-xs font-bold text-green-600">{q.globalCorrectPercent}% got right</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </Card>
                        <Card className="p-5 border-2 border-red-300 bg-red-50 shadow-[4px_4px_0px_0px_rgba(239,68,68,0.3)]">
                            <h3 className="text-sm font-black uppercase tracking-widest text-red-700 mb-3">⚠️ Weak Areas</h3>
                            {weakQuestions.length === 0 ? (
                                <p className="text-sm text-red-600 font-bold">Perfect score! No mistakes!</p>
                            ) : (
                                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                                    {weakQuestions.slice(0, 8).map(q => (
                                        <div key={q.questionIndex} className="flex items-center justify-between text-sm bg-white/60 rounded-lg px-3 py-2">
                                            <span className="font-bold text-red-800">Q{q.questionIndex + 1}</span>
                                            <div className="flex items-center gap-2">
                                                {q.timeSpent > 0 && (
                                                    <span className="text-[10px] font-bold text-red-400">⏱ {formatTime(q.timeSpent)}</span>
                                                )}
                                                <span className="text-xs font-bold text-red-600">{q.globalCorrectPercent}% got right</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </Card>
                    </div>
                </div>
            )}


            {/* ─── TAB: DEEP ANALYSIS ──────────────────────────────── */}
            {activeTab === 'analysis' && (
                <div className="max-w-6xl mx-auto px-4 py-6 md:py-8 space-y-4 md:space-y-6">
                    {/* Summary Banner */}
                    <div className="bg-black text-white rounded-2xl p-4 flex flex-wrap items-center justify-center gap-4 md:gap-8 text-center">
                        <div>
                            <div className="text-2xl font-black">{correctCount}</div>
                            <div className="text-[10px] uppercase tracking-widest opacity-60">✔ Correct</div>
                        </div>
                        <div className="w-px h-8 bg-white/20 hidden md:block"></div>
                        <div>
                            <div className="text-2xl font-black text-red-400">{incorrectCount}</div>
                            <div className="text-[10px] uppercase tracking-widest opacity-60">❌ Wrong</div>
                        </div>
                        <div className="w-px h-8 bg-white/20 hidden md:block"></div>
                        <div>
                            <div className="text-2xl font-black text-gray-400">{unattempted}</div>
                            <div className="text-[10px] uppercase tracking-widest opacity-60">⏳ Skipped</div>
                        </div>
                        <div className="w-px h-8 bg-white/20 hidden md:block"></div>
                        <div>
                            <div className="text-2xl font-black text-primary">{percentage}%</div>
                            <div className="text-[10px] uppercase tracking-widest opacity-60">Accuracy</div>
                        </div>
                    </div>

                    {/* Question Cards */}
                    {displayQuestions.map((question: Question, index: number) => {
                        const userAnswer = userAnswers[index];
                        const isCorrect = userAnswer === question.correctAnswer;
                        const isAttempted = userAnswer !== undefined;
                        const qa = questionAnalysis[index];

                        return (
                            <Card
                                key={index}
                                className={`p-4 md:p-6 border-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] ${!isAttempted
                                    ? "border-gray-400 bg-gray-50"
                                    : isCorrect
                                        ? "border-green-500 bg-green-50"
                                        : "border-red-500 bg-red-50"
                                    }`}
                            >
                                {/* Question Header */}
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b-2 border-black/10">
                                    <h3 className="text-base md:text-lg font-black text-black uppercase">
                                        Question {index + 1}
                                    </h3>
                                    <div className="flex items-center gap-2 flex-wrap">
                                        {/* Time spent */}
                                        {qa?.timeSpent > 0 && (
                                            <span className="px-2 py-1 bg-white border border-gray-300 rounded-full text-[10px] font-bold text-gray-600">
                                                ⏱ {formatTime(qa.timeSpent)}
                                            </span>
                                        )}
                                        {/* Global success */}
                                        {qa && (
                                            <span className="px-2 py-1 bg-blue-50 border border-blue-200 rounded-full text-[10px] font-bold text-blue-600">
                                                📊 {qa.globalCorrectPercent}% got right
                                            </span>
                                        )}
                                        {/* Status badge */}
                                        <span
                                            className={`px-3 py-1 rounded-full font-black uppercase text-[10px] border-2 ${!isAttempted
                                                ? "bg-gray-200 border-gray-400 text-gray-700"
                                                : isCorrect
                                                    ? "bg-green-500 border-green-700 text-white"
                                                    : "bg-red-500 border-red-700 text-white"
                                                }`}
                                        >
                                            {!isAttempted ? "⏳ SKIPPED" : isCorrect ? "✓ CORRECT" : "✗ WRONG"}
                                        </span>
                                    </div>
                                </div>

                                {/* Question Text */}
                                <div className="mb-4 md:mb-5 text-sm md:text-base font-bold text-black">
                                    <LatexRenderer>{question.text}</LatexRenderer>
                                </div>

                                {/* Question Image */}
                                {question.imageUrl && (
                                    <div className="mb-4">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img
                                            src={question.imageUrl.startsWith('http') ? question.imageUrl : question.imageUrl.startsWith('/') ? question.imageUrl : `/${question.imageUrl}`}
                                            alt="Question illustration"
                                            className="max-w-full max-h-[300px] rounded-lg border border-gray-200"
                                        />
                                    </div>
                                )}

                                {/* Options */}
                                <div className="space-y-2">
                                    {question.options.map((option: string, optIdx: number) => {
                                        const isUserSelection = userAnswer === optIdx;
                                        const isCorrectAnswer = question.correctAnswer === optIdx;

                                        let optionClass = "bg-white border-gray-300";
                                        if (isCorrectAnswer) {
                                            optionClass = "bg-green-100 border-green-500 border-2";
                                        } else if (isUserSelection && !isCorrect) {
                                            optionClass = "bg-red-100 border-red-500 border-2";
                                        }

                                        return (
                                            <div
                                                key={optIdx}
                                                className={`flex items-start gap-3 p-3 rounded-xl border-2 ${optionClass} ${isCorrectAnswer || isUserSelection ? "shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]" : ""}`}
                                            >
                                                <div
                                                    className={`w-7 h-7 rounded-full border-2 flex items-center justify-center font-black text-xs flex-shrink-0 mt-0.5 ${isCorrectAnswer
                                                        ? "bg-green-500 border-green-700 text-white"
                                                        : isUserSelection
                                                            ? "bg-red-500 border-red-700 text-white"
                                                            : "bg-white border-black/20 text-black/60"
                                                        }`}
                                                >
                                                    {String.fromCharCode(65 + optIdx)}
                                                </div>
                                                <div className="flex-1 text-sm font-bold text-black break-words">
                                                    <LatexRenderer>{option}</LatexRenderer>
                                                </div>
                                                <div className="flex flex-col gap-1 items-end mt-0.5">
                                                    {isCorrectAnswer && (
                                                        <span className="px-2 py-0.5 bg-green-500 text-white text-[10px] font-black uppercase rounded-full whitespace-nowrap">
                                                            ✓ Correct
                                                        </span>
                                                    )}
                                                    {isUserSelection && !isCorrect && (
                                                        <span className="px-2 py-0.5 bg-red-500 text-white text-[10px] font-black uppercase rounded-full whitespace-nowrap">
                                                            Your Answer
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </Card>
                        );
                    })}

                    {/* Show More / Load All */}
                    {test.questions.length > 10 && !showAllQuestions && (
                        <div className="text-center">
                            <button
                                onClick={() => setShowAllQuestions(true)}
                                className="px-6 py-3 bg-black text-white font-black uppercase text-xs rounded-xl border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)] hover:shadow-none transition-all"
                            >
                                Show All {test.questions.length} Questions
                            </button>
                        </div>
                    )}
                </div>
            )}


            {/* ─── TAB: LEADERBOARD ────────────────────────────────── */}
            {activeTab === 'leaderboard' && (
                <div className="max-w-6xl mx-auto px-4 py-6 md:py-8 space-y-4 md:space-y-6">

                    {/* User's Position Card */}
                    {performance?.userEntry && (
                        <Card className="p-5 md:p-6 border-3 border-blue-400 bg-gradient-to-r from-blue-50 to-indigo-50 shadow-[6px_6px_0px_0px_rgba(59,130,246,0.3)]">
                            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-blue-500 border-3 border-black flex items-center justify-center text-white font-black text-xl">
                                        #{performance.userEntry.rank}
                                    </div>
                                    <div>
                                        <p className="text-lg font-black text-black">Your Rank</p>
                                        <p className="text-sm font-bold text-black/50">
                                            {performance.userEntry.rank} out of {performance.totalAttemptees} students
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 text-center">
                                    <div className="px-4 py-2 bg-white rounded-xl border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                                        <div className="text-xl font-black" style={{ color: getPercentileColor(performance.percentile) }}>{performance.percentile}%</div>
                                        <div className="text-[9px] font-black text-black/40 uppercase">Percentile</div>
                                    </div>
                                    <div className="px-4 py-2 bg-white rounded-xl border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                                        <div className="text-xl font-black text-black">{performance.totalScore}/{performance.maxScore}</div>
                                        <div className="text-[9px] font-black text-black/40 uppercase">Score</div>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    )}

                    {/* Stats Bar */}
                    {performance && (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            <MiniStat label="Total Attempted" value={String(performance.totalAttemptees)} icon="👥" />
                            <MiniStat label="Average Score" value={String(performance.averageScore)} icon="📊" />
                            <MiniStat label="Highest Score" value={String(performance.highestScore)} icon="🔥" />
                            <MiniStat label="Your Score" value={`${performance.totalScore}`} icon="⭐" />
                        </div>
                    )}

                    {/* Top 10 Table */}
                    {performance && performance.leaderboard.length > 0 && (
                        <Card className="border-3 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] bg-white overflow-hidden">
                            <div className="bg-black text-white px-5 py-3 flex items-center justify-between">
                                <h3 className="font-black uppercase text-sm tracking-wider">🏆 Test Leaderboard</h3>
                                <span className="text-xs font-bold opacity-60">{performance.totalAttemptees} students</span>
                            </div>
                            <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
                                <table className="w-full text-left">
                                    <thead className="bg-gray-100 border-b-2 border-black sticky top-0 z-10">
                                        <tr>
                                            <th className="p-3 md:p-4 font-black text-xs uppercase tracking-wide text-gray-600">Rank</th>
                                            <th className="p-3 md:p-4 font-black text-xs uppercase tracking-wide text-gray-600">Student</th>
                                            <th className="p-3 md:p-4 font-black text-xs uppercase tracking-wide text-gray-600 text-right">Score</th>
                                            <th className="p-3 md:p-4 font-black text-xs uppercase tracking-wide text-gray-600 text-right hidden sm:table-cell">Accuracy</th>
                                            <th className="p-3 md:p-4 font-black text-xs uppercase tracking-wide text-gray-600 text-right hidden md:table-cell">Time</th>
                                            <th className="p-3 md:p-4 font-black text-xs uppercase tracking-wide text-gray-600 text-right hidden lg:table-cell">Percentile</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {performance.leaderboard.slice(0, 20).map((entry) => (
                                            <tr
                                                key={entry.userId}
                                                className={`${entry.isCurrentUser
                                                    ? 'bg-blue-50 border-l-4 border-blue-500'
                                                    : 'hover:bg-gray-50'
                                                    } transition-colors`}
                                            >
                                                <td className="p-3 md:p-4">
                                                    <div className={`
                                                        w-8 h-8 flex items-center justify-center rounded-full font-bold text-sm
                                                        ${entry.rank === 1 ? 'bg-yellow-100 text-yellow-700 border-2 border-yellow-400' :
                                                            entry.rank === 2 ? 'bg-gray-100 text-gray-700 border-2 border-gray-300' :
                                                                entry.rank === 3 ? 'bg-orange-100 text-orange-700 border-2 border-orange-300' :
                                                                    'text-gray-500'}
                                                    `}>
                                                        {entry.rank <= 3 ? ['🥇', '🥈', '🥉'][entry.rank - 1] : entry.rank}
                                                    </div>
                                                </td>
                                                <td className="p-3 md:p-4 font-bold text-black">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-7 h-7 rounded-full bg-gray-200 border border-gray-300 flex items-center justify-center text-[10px] font-bold text-gray-500">
                                                            {entry.userName.charAt(0).toUpperCase()}
                                                        </div>
                                                        <span className={entry.isCurrentUser ? 'text-blue-600' : ''}>
                                                            {entry.userName} {entry.isCurrentUser && <span className="text-xs text-blue-400">(You)</span>}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="p-3 md:p-4 font-black text-black text-right">
                                                    {entry.score}<span className="text-xs text-black/30">/{entry.totalMarks}</span>
                                                </td>
                                                <td className="p-3 md:p-4 font-bold text-gray-600 text-right hidden sm:table-cell">
                                                    {entry.accuracy}%
                                                </td>
                                                <td className="p-3 md:p-4 font-bold text-gray-600 text-right hidden md:table-cell">
                                                    {entry.timeTaken > 0 ? formatTime(entry.timeTaken) : '—'}
                                                </td>
                                                <td className="p-3 md:p-4 text-right hidden lg:table-cell">
                                                    <span className="px-2 py-1 rounded-full text-xs font-black" style={{
                                                        color: getPercentileColor(entry.percentile),
                                                        backgroundColor: getPercentileColor(entry.percentile) + '15',
                                                    }}>
                                                        {entry.percentile}%
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </Card>
                    )}
                </div>
            )}


            {/* ─── BOTTOM ACTION BAR ──────────────────────────────── */}
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t-4 border-black shadow-2xl z-50">
                <div className="max-w-6xl mx-auto px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-2">
                    <p className="text-xs font-bold text-black/50 uppercase tracking-wide text-center sm:text-left hidden sm:block">
                        {correctCount}/{totalQuestions} correct • Rank {performance?.rank || '—'}/{performance?.totalAttemptees || '—'}
                    </p>
                    <div className="flex gap-2 w-full sm:w-auto">
                        <Button
                            onClick={() => router.push("/dashboard/tests")}
                            variant="outline"
                            className="flex-1 sm:flex-none justify-center border-2 border-black text-black hover:bg-black hover:text-white font-black px-4 py-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-xs"
                        >
                            More Tests
                        </Button>
                        <Button
                            onClick={() => router.push("/dashboard")}
                            className="flex-1 sm:flex-none justify-center bg-primary border-2 border-black text-black hover:bg-black hover:text-primary font-black px-6 py-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-xs"
                        >
                            Dashboard →
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}


// ─── Sub Components ──────────────────────────────────

function ScoreCard({ icon, label, value, color, bgColor, subtext }: {
    icon: string; label: string; value: string; color: string; bgColor: string; subtext: string;
}) {
    return (
        <div
            className="rounded-xl border-2 border-black p-4 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] text-center transition-transform hover:scale-[1.02]"
            style={{ backgroundColor: bgColor }}
        >
            <div className="text-xl mb-1">{icon}</div>
            <div className="text-2xl md:text-3xl font-black" style={{ color }}>{value}</div>
            <div className="text-[10px] font-black uppercase tracking-widest text-black/50 mt-1">{label}</div>
            <div className="text-[10px] font-bold text-black/40 mt-1">{subtext}</div>
        </div>
    );
}

function PremiumScoreCard({ icon, label, value, max, unit, info, totalSecs }: {
    icon: React.ReactNode;
    label: string;
    value: string | number;
    max?: string;
    unit?: string;
    info: string;
    totalSecs?: number;
}) {
    return (
        <div className="bg-white rounded-2xl border border-gray-100 p-6 flex flex-col justify-between h-40 group hover:border-indigo-100 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    {icon}
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{label}</span>
                </div>
                <div className="relative group/tooltip">
                    <Info size={16} className="text-slate-300 cursor-help" />
                    <div className="absolute bottom-full right-0 mb-2 w-48 p-2 bg-slate-800 text-white text-[10px] rounded shadow-lg opacity-0 pointer-events-none group-hover/tooltip:opacity-100 transition-opacity z-10">
                        {info}
                    </div>
                </div>
            </div>
            <div className="mt-4 flex items-baseline gap-1">
                <span className="text-4xl font-black text-slate-900">{value}</span>
                {max && <span className="text-xl font-bold text-slate-300">/{max}</span>}
                {unit && <span className="text-xl font-bold text-slate-400">{unit}</span>}
            </div>
            {totalSecs !== undefined && totalSecs > 0 && totalSecs < 60 && (
                <div className="mt-1 text-[10px] font-bold text-slate-400">
                    {totalSecs} seconds
                </div>
            )}
        </div>
    );
}

function LegendItem({ color, label, value, total }: { color: string; label: string; value: number; total: number }) {
    const pct = total > 0 ? Math.round((value / total) * 100) : 0;
    return (
        <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full flex-shrink-0 border border-black" style={{ backgroundColor: color }}></span>
            <div className="flex-1">
                <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-black/70">{label}</span>
                    <span className="text-xs font-black text-black">{value} ({pct}%)</span>
                </div>
            </div>
        </div>
    );
}

function MetricBar({ label, value, max, color, suffix = '' }: { label: string; value: number; max: number; color: string; suffix?: string }) {
    const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
    return (
        <div>
            <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-bold text-black/50 uppercase">{label}</span>
                <span className="text-sm font-black text-black">{value}{suffix}{suffix !== '%' ? `/${max}` : ''}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5 border border-black/10 overflow-hidden">
                <div
                    className="h-full rounded-full transition-all duration-700 ease-out"
                    style={{ width: `${pct}%`, backgroundColor: color }}
                ></div>
            </div>
        </div>
    );
}

function MiniStat({ label, value, icon }: { label: string; value: string; icon: string }) {
    return (
        <div className="bg-white border-2 border-black rounded-xl p-3 text-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            <div className="text-lg">{icon}</div>
            <div className="text-xl font-black text-black">{value}</div>
            <div className="text-[9px] font-black uppercase tracking-widest text-black/40 mt-0.5">{label}</div>
        </div>
    );
}


// ─── Page Export ──────────────────────────────────
export default function TestReviewPage() {
    return (
        <Suspense fallback={
            <div className="flex flex-col items-center justify-center min-h-screen gap-4">
                <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-primary"></div>
                <p className="text-sm font-bold text-black/40 uppercase tracking-widest">Loading results...</p>
            </div>
        }>
            <TestReviewContent />
        </Suspense>
    );
}
