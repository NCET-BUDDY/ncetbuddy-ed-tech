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
        <Card className="bg-white border-slate-100 shadow-sm rounded-3xl overflow-hidden flex flex-col h-full">
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
export const AISmartPlanner = ({ target, progress }: { target: string, progress: number }) => {
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
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Today's Target</p>
                        <h3 className="text-base font-black text-slate-900">{target}</h3>
                    </div>

                    <div className="space-y-2">
                        <div className="flex justify-between items-end">
                            <span className="text-[10px] font-black text-slate-500 uppercase">{progress}% Completed</span>
                        </div>
                        <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-rose-500 rounded-full transition-all duration-1000 ease-out"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                    </div>
                </div>

                <Button className="bg-rose-500 hover:bg-rose-600 text-white font-black rounded-xl px-4 py-6 shadow-lg shadow-rose-500/20 active:translate-y-0.5 transition-all text-[11px] uppercase tracking-tighter flex items-center gap-2">
                    <CheckCircle2 size={14} /> Mark as Done
                </Button>
            </div>
        </Card>
    );
};

// --- Performance Analytics Section ---
export const PerformanceAnalytics = ({ score, trend }: { score: number, trend: number }) => {
    return (
        <Card className="bg-white border-slate-100 shadow-sm p-6 rounded-3xl h-full flex flex-col">
            <div className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-rose-100 flex items-center justify-center text-rose-500">
                        <TrendingUp size={18} />
                    </div>
                    <h2 className="text-lg font-black text-slate-900 tracking-tight">Performance Analytics</h2>
                </div>
            </div>

            <div className="flex-1 grid grid-cols-1 gap-6">
                <div>
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-sm font-black text-slate-900">Score Trend</h3>
                        <div className="text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded-md border border-slate-100">
                            Last 30 Days ▾
                        </div>
                    </div>

                    {/* Simple SVG Trendline to match design */}
                    <div className="h-24 w-full relative group">
                        <svg className="w-full h-full overflow-visible" preserveAspectRatio="none">
                            <path
                                d="M0 80 Q 50 75, 100 80 T 200 60 T 300 55 T 400 30 T 500 35 L 500 100 L 0 100 Z"
                                fill="url(#gradient)"
                                fillOpacity="0.1"
                            />
                            <path
                                d="M0 80 Q 50 75, 100 80 T 200 60 T 300 55 T 400 30 T 500 35"
                                fill="none"
                                stroke="#E11D48"
                                strokeWidth="3"
                                strokeLinecap="round"
                            />
                            <defs>
                                <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
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

                        {/* Tooltip dot */}
                        <div className="absolute top-[35px] right-[5%] w-3 h-3 bg-rose-500 rounded-full border-2 border-white shadow-md cursor-pointer hover:scale-125 transition-transform" />
                    </div>
                </div>

                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 flex justify-between items-center mt-auto">
                    <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Projected NCET Score</p>
                        <h4 className="text-2xl font-black text-slate-900">{score}</h4>
                    </div>
                    <div className="text-right">
                        <span className="text-[10px] font-black text-emerald-500">+{trend}% vs last week</span>
                    </div>
                </div>
            </div>
        </Card>
    );
};

// --- Resource Library Section ---
export const ResourceLibrary = () => {
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
                <div className="flex border-b border-slate-100 px-6 overflow-x-auto no-scrollbar">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`
                                flex items-center gap-2 px-6 py-4 text-xs font-black uppercase tracking-tight transition-all relative whitespace-nowrap
                                ${activeTab === tab.id ? 'text-rose-500' : 'text-slate-400 hover:text-slate-600'}
                            `}
                        >
                            {tab.icon}
                            {tab.label}
                            {activeTab === tab.id && (
                                <div className="absolute bottom-0 left-0 right-0 h-1 bg-rose-500 rounded-t-full" />
                            )}
                        </button>
                    ))}
                </div>

                <div className="p-8">
                    {/* Placeholder for tab content - in reality this would fetch existing data */}
                    <div className="flex flex-col items-center justify-center py-12 text-center text-slate-300">
                        <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center mb-4">
                            <BookOpen size={24} />
                        </div>
                        <p className="text-sm font-bold uppercase tracking-widest leading-relaxed">
                            Loading your {activeTab === 'video' ? 'lectures' : activeTab === 'notes' ? 'documents' : 'materials'}...
                        </p>
                    </div>
                </div>
            </Card>
        </div>
    );
};
