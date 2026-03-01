"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
    Clock,
    FileText,
    MessageSquare,
    ChevronRight,
    TrendingUp,
    CheckCircle2,
    BookOpen,
    Video,
    FileSignature,
    Lock
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

// --- Test Card Component ---
export const TestEngineCard = ({ test, isPremium = false, isSectional = false }: any) => {
    return (
        <Card className="bg-white border-slate-100 shadow-sm p-4 rounded-3xl relative overflow-hidden group hover:shadow-md transition-all">
            <div className="flex justify-between items-start mb-4">
                <div className="flex gap-2">
                    {isPremium && (
                        <span className="bg-yellow-400 text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-1">
                            <span className="text-[8px]">★</span> PREMIUM
                        </span>
                    )}
                    {isSectional && (
                        <span className="bg-slate-100 text-slate-500 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-tighter">
                            Sectional
                        </span>
                    )}
                </div>
                {test.lastScore && (
                    <span className="text-[10px] font-bold text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded-full">
                        Last Score: {test.lastScore}%
                    </span>
                )}
            </div>

            <h3 className="text-sm md:text-base font-black text-slate-900 mb-2 leading-tight">
                {test.title}
            </h3>

            <div className="flex items-center gap-4 text-[11px] font-bold text-slate-400 mb-6">
                <div className="flex items-center gap-1">
                    <Clock size={12} className="text-rose-500" />
                    {test.duration} Mins
                </div>
                <div className="flex items-center gap-1">
                    <FileText size={12} className="text-rose-500" />
                    {test.questionsCount} Questions
                </div>
            </div>

            {test.isLocked ? (
                <div className="absolute top-4 right-4 text-slate-300">
                    <Lock size={16} />
                </div>
            ) : null}

            <Link href={test.href || '#'}>
                <Button className="w-full bg-rose-500 hover:bg-rose-600 text-white font-black rounded-xl py-5 shadow-lg shadow-rose-500/20 active:translate-y-0.5 transition-all text-sm uppercase tracking-tight">
                    Start Test
                </Button>
            </Link>
        </Card>
    );
};

// --- Mock Test Engine Section ---
export const MockTestEngine = ({ tests }: { tests: any[] }) => {
    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-rose-100 flex items-center justify-center text-rose-500">
                        <FileText size={18} />
                    </div>
                    <h2 className="text-lg md:text-xl font-black text-slate-900 tracking-tight">Mock Test Engine</h2>
                </div>
                <Link href="/dashboard/tests" className="group">
                    <Button variant="outline" className="text-xs font-black uppercase tracking-tight px-4 py-2 bg-rose-500 text-white border-none rounded-xl hover:bg-rose-600 shadow-md">
                        Go to Test Series <ChevronRight size={14} className="ml-1 group-hover:translate-x-0.5 transition-transform" />
                    </Button>
                </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {tests.slice(0, 2).map((test, idx) => (
                    <TestEngineCard
                        key={idx}
                        test={test}
                        isPremium={idx === 0}
                        isSectional={idx === 1}
                    />
                ))}
            </div>
        </div>
    );
};

// --- Community Discussion Section ---
export const CommunityDiscussion = ({ posts }: { posts: any[] }) => {
    return (
        <Card className="bg-white border-slate-100 shadow-sm rounded-3xl overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-50">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-500">
                        <MessageSquare size={18} />
                    </div>
                    <h2 className="text-lg font-black text-slate-900 tracking-tight">Community Discussion</h2>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto">
                {posts.map((post, idx) => (
                    <div key={idx} className={`p-5 flex gap-4 hover:bg-slate-50 transition-colors cursor-pointer ${idx !== posts.length - 1 ? 'border-b border-slate-50' : ''}`}>
                        <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 border-2 border-slate-100 shadow-sm">
                            <Image src={post.authorAvatar || "/student.png"} alt="Avatar" width={40} height={40} className="w-full h-full object-cover" />
                        </div>
                        <div className="space-y-1">
                            <h4 className="text-sm font-black text-slate-900 leading-tight line-clamp-2">
                                {post.title}
                            </h4>
                            <p className="text-[11px] text-slate-500 font-bold line-clamp-2 opacity-80 leading-relaxed">
                                {post.preview}
                            </p>
                            <div className="flex items-center gap-3 pt-1">
                                {post.hasExpertReply && (
                                    <span className="flex items-center gap-1 text-[9px] font-black text-rose-500 bg-rose-50 px-2 py-0.5 rounded-full uppercase">
                                        <CheckCircle2 size={10} /> Expert Reply
                                    </span>
                                )}
                                <span className="text-[9px] font-bold text-slate-400 uppercase">
                                    {post.repliesCount} Replies
                                </span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="p-4 border-t border-slate-50">
                <Link href="/dashboard/forum">
                    <Button variant="ghost" className="w-full text-sm font-black text-slate-500 hover:text-rose-500 transition-colors">
                        Join the Discussion
                    </Button>
                </Link>
            </div>
        </Card>
    );
};

// --- AI Smart Planner Section ---
import { PlannerTask } from '@/lib/appwrite-db';

export const AISmartPlanner = ({ task, onComplete }: { task: PlannerTask, onComplete?: () => void }) => {
    const handleAction = (e: React.MouseEvent) => {
        if (task.actionText === "Mark as Done" && onComplete) {
            e.preventDefault();
            onComplete();
        }
    };

    return (
        <Card className="bg-white border-slate-100 shadow-sm p-6 rounded-3xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 text-rose-500/10 group-hover:scale-110 transition-transform">
                <TrendingUp size={80} strokeWidth={4} />
            </div>

            <div className="flex items-center gap-2 mb-8">
                <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center text-orange-500">
                    <TrendingUp size={18} />
                </div>
                <h2 className="text-lg font-black text-slate-900 tracking-tight">AI Smart Planner</h2>
            </div>

            <div className="flex items-center gap-6 relative z-10">
                <div className="w-14 h-14 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-500 shadow-inner">
                    <Clock size={24} />
                </div>
                <div className="flex-1 space-y-4">
                    <div className="space-y-1">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{task.subtitle}</p>
                        <h3 className="text-base font-black text-slate-900 leading-tight">{task.title}</h3>
                    </div>

                    <div className="space-y-2">
                        <div className="flex justify-between items-end">
                            <span className="text-[10px] font-black text-slate-500 uppercase">Daily Goal: {task.progress}% Completed</span>
                        </div>
                        <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-rose-500 rounded-full transition-all duration-1000 ease-out"
                                style={{ width: `${task.progress}%` }}
                            />
                        </div>
                    </div>
                </div>

                <Link href={task.actionUrl} className="shrink-0" onClick={handleAction}>
                    <Button className="bg-rose-500 hover:bg-rose-600 text-white font-black rounded-xl px-4 py-6 shadow-lg shadow-rose-500/20 active:translate-y-0.5 transition-all text-[11px] uppercase tracking-tighter flex items-center gap-2">
                        <CheckCircle2 size={14} /> {task.actionText}
                    </Button>
                </Link>
            </div>
        </Card>
    );
};

// --- Performance Analytics Section ---
export const PerformanceAnalytics = ({ score, trend, history = [] }: { score: number, trend: number, history?: number[] }) => {
    // Dynamically generate smooth SVG path based on history
    const getPath = (data: number[]) => {
        if (!data || data.length < 2) return "M0 80 Q 50 75, 100 80 T 200 60 T 300 55 T 400 30 T 500 35";

        const max = Math.max(...data, 640);

        const points = data.map((val, i) => {
            const x = (i / (data.length - 1)) * 500;
            // Map to Y: 90 is bottom, 10 is top
            const y = 90 - ((val / max) * 80);
            return { x, y };
        });

        let d = `M ${points[0].x} ${points[0].y}`;
        for (let i = 1; i < points.length; i++) {
            const prev = points[i - 1];
            const curr = points[i];
            const cpX = (prev.x + curr.x) / 2;
            d += ` C ${cpX} ${prev.y}, ${cpX} ${curr.y}, ${curr.x} ${curr.y}`;
        }
        return d;
    };

    const fallBackHistory = [400, 420, 480, score || 642];
    const dataPoints = history.length > 1 ? history : fallBackHistory;
    const pathString = getPath(dataPoints);
    const fillPathString = `${pathString} L 500 100 L 0 100 Z`;
    return (
        <Card className="bg-white border-slate-100 shadow-sm p-6 rounded-3xl flex flex-col">
            <div className="flex justify-between items-center mb-6 md:mb-8">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-rose-100 flex items-center justify-center text-rose-500">
                        <TrendingUp size={18} />
                    </div>
                    <h2 className="text-lg font-black text-slate-900 tracking-tight">Analytics</h2>
                </div>
            </div>

            <div className="space-y-6">
                <div>
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-sm font-black text-slate-900">Score Trend</h3>
                        <div className="text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded-md border border-slate-100">
                            Last 30 Days ▾
                        </div>
                    </div>

                    {/* Improved Responsive SVG Trendline */}
                    <div className="h-24 w-full relative group bg-slate-50/50 rounded-xl p-2">
                        <svg
                            className="w-full h-full"
                            viewBox="0 0 500 100"
                            preserveAspectRatio="none"
                        >
                            <path
                                d={fillPathString}
                                fill="url(#gradient-fixed)"
                                fillOpacity="0.1"
                            />
                            <path
                                d={pathString}
                                fill="none"
                                stroke="#E11D48"
                                strokeWidth="3"
                                strokeLinecap="round"
                            />
                            <defs>
                                <linearGradient id="gradient-fixed" x1="0%" y1="0%" x2="0%" y2="100%">
                                    <stop offset="0%" stopColor="#E11D48" />
                                    <stop offset="100%" stopColor="transparent" />
                                </linearGradient>
                            </defs>
                        </svg>
                        <div className="flex justify-between px-1 mt-2 text-[8px] font-bold text-slate-300 uppercase tracking-tighter">
                            <span>Week 1</span>
                            <span>Week 2</span>
                            <span>Week 3</span>
                            <span>Current</span>
                        </div>
                    </div>
                </div>

                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 flex justify-between items-center">
                    <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Projected NCET Score</p>
                        <h4 className="text-2xl font-black text-slate-900">{score}</h4>
                    </div>
                    <div className="text-right">
                        <span className="text-[10px] font-black text-emerald-500">+{trend}%</span>
                    </div>
                </div>
            </div>
        </Card>
    );
};

import { Book, FormulaCard as DBFormulaCard, VideoClass } from '@/types';

// --- Resource Library Section ---
interface ResourceLibraryProps {
    books: Book[];
    formulaCards: DBFormulaCard[];
    videos: VideoClass[];
}

export const ResourceLibrary = ({ books, formulaCards, videos }: ResourceLibraryProps) => {
    const [activeTab, setActiveTab] = useState('video');

    const tabs = [
        { id: 'video', label: 'Video Lectures', icon: <Video size={16} /> },
        { id: 'notes', label: 'Notes & PDFs', icon: <FileText size={16} /> },
        { id: 'formula', label: 'Formula Sheets', icon: <FileSignature size={16} /> },
    ];

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-rose-100 flex items-center justify-center text-rose-500">
                    <BookOpen size={18} />
                </div>
                <h2 className="text-lg md:text-xl font-black text-slate-900 tracking-tight">Resource Library</h2>
            </div>

            <Card className="bg-white border-slate-100 shadow-sm rounded-3xl overflow-hidden">
                <div className="flex border-b border-slate-100 px-4 md:px-6 overflow-x-auto no-scrollbar scroll-smooth">
                    <div className="flex flex-nowrap min-w-full">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`
                                    flex items-center gap-2 px-4 md:px-6 py-4 text-[10px] md:text-xs font-black uppercase tracking-tight transition-all relative whitespace-nowrap flex-shrink-0 focus:outline-none
                                    ${activeTab === tab.id ? 'text-rose-500' : 'text-slate-400 hover:text-slate-600'}
                                `}
                            >
                                {tab.icon}
                                <span className="hidden sm:inline-block">{tab.label}</span>
                                <span className="sm:hidden">{tab.label.split(' ')[0]}</span>
                                {activeTab === tab.id && (
                                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-rose-500 rounded-t-full" />
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="p-4 md:p-6 bg-slate-50/30">
                    {/* Videos Tab */}
                    {activeTab === 'video' && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {videos && videos.length > 0 ? (
                                videos.slice(0, 3).map((video, idx) => (
                                    <a key={idx} href={video.url} target="_blank" rel="noopener noreferrer" className="group block h-full">
                                        <div className="bg-white border text-left border-slate-100 p-3 rounded-2xl shadow-sm hover:shadow-md hover:border-rose-100 transition-all h-full flex flex-col">
                                            <div className="aspect-video w-full bg-slate-100 rounded-xl mb-3 relative overflow-hidden flex-shrink-0">
                                                {video.thumbnailUrl ? (
                                                    <Image src={video.thumbnailUrl} alt={video.title} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-slate-300">
                                                        <Video size={32} />
                                                    </div>
                                                )}
                                                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                                                    <div className="w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center text-rose-500 opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all">
                                                        <Video size={16} className="ml-1" />
                                                    </div>
                                                </div>
                                            </div>
                                            <h4 className="text-xs font-bold text-slate-800 line-clamp-2 leading-tight flex-grow group-hover:text-rose-600 transition-colors">{video.title}</h4>
                                            {video.subject && (
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2 shrink-0">{video.subject}</p>
                                            )}
                                        </div>
                                    </a>
                                ))
                            ) : (
                                <div className="col-span-full flex flex-col items-center justify-center py-12 text-center text-slate-300">
                                    <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center mb-4 shadow-sm border border-slate-100">
                                        <Video size={24} />
                                    </div>
                                    <p className="text-sm font-bold uppercase tracking-widest leading-relaxed">No Recent Videos</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Notes Tab */}
                    {activeTab === 'notes' && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {books && books.length > 0 ? (
                                books.slice(0, 3).map((book, idx) => (
                                    <a key={idx} href={book.url} target="_blank" rel="noopener noreferrer" className="bg-white text-left border border-slate-100 p-4 rounded-2xl shadow-sm hover:shadow-md hover:border-emerald-100 hover:bg-emerald-50/30 transition-all group flex items-start gap-4 h-full">
                                        <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600 shrink-0 group-hover:scale-110 transition-transform">
                                            <FileText size={20} />
                                        </div>
                                        <div>
                                            <h4 className="text-xs font-bold text-slate-800 line-clamp-2 mb-1 leading-tight group-hover:text-emerald-700">{book.title}</h4>
                                            <p className="text-[10px] font-black text-slate-400 shrink-0 uppercase tracking-widest">{book.subject}</p>
                                        </div>
                                    </a>
                                ))
                            ) : (
                                <div className="col-span-full flex flex-col items-center justify-center py-12 text-center text-slate-300">
                                    <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center mb-4 shadow-sm border border-slate-100">
                                        <FileText size={24} />
                                    </div>
                                    <p className="text-sm font-bold uppercase tracking-widest leading-relaxed">No Notes Available</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Formula Tab */}
                    {activeTab === 'formula' && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {formulaCards && formulaCards.length > 0 ? (
                                formulaCards.slice(0, 3).map((card, idx) => (
                                    <a key={idx} href={card.url || '#'} target="_blank" rel="noopener noreferrer" className="bg-white text-left border border-slate-100 p-5 rounded-2xl shadow-sm hover:shadow-md hover:border-violet-100 hover:bg-violet-50/30 transition-all group flex flex-col h-full relative overflow-hidden">
                                        <div className="absolute -right-4 -top-4 w-16 h-16 bg-violet-50 rounded-full group-hover:scale-150 transition-transform duration-500" />
                                        <div className="flex items-center gap-3 mb-3 relative z-10">
                                            <div className="w-8 h-8 rounded-lg bg-violet-100 flex items-center justify-center text-violet-600 shrink-0">
                                                <FileSignature size={14} />
                                            </div>
                                            <p className="text-[10px] font-black text-slate-400 shrink-0 uppercase tracking-widest">{card.subject}</p>
                                        </div>
                                        <h4 className="text-sm font-bold text-slate-800 line-clamp-2 leading-tight group-hover:text-violet-700 relative z-10 flex-grow">{card.title}</h4>
                                    </a>
                                ))
                            ) : (
                                <div className="col-span-full flex flex-col items-center justify-center py-12 text-center text-slate-300">
                                    <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center mb-4 shadow-sm border border-slate-100">
                                        <FileSignature size={24} />
                                    </div>
                                    <p className="text-sm font-bold uppercase tracking-widest leading-relaxed">No Formula Sheets</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </Card>
        </div>
    );
};
