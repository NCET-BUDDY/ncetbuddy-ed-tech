"use client";

import React from 'react';
import BannerCarousel from '@/components/dashboard/BannerCarousel';
import { useEffect, useState } from 'react';
import { getBooks, getFormulaCards, getTests, getForumPosts, getDailyProgress } from '@/lib/appwrite-db';
import { Test, ForumPost } from '@/types';
import {
    MockTestEngine,
    CommunityDiscussion,
    AISmartPlanner,
    PerformanceAnalytics,
    ResourceLibrary
} from '@/components/dashboard/DashboardWidgets';
import { useAuth } from '@/context/AuthContext';

const MOCK_TESTS: Test[] = [
    {
        id: 'demo-1',
        title: 'NCET Full Mock Test - 1',
        description: 'Complete mock test covering all sections',
        subject: 'Full Mock',
        duration: 180,
        questions: [],
        createdBy: 'admin',
        createdAt: Date.now(),
        isVisible: true,
        status: 'Published',
        testType: 'pyq',
        price: 0
    },
    {
        id: 'demo-2',
        title: 'NCET Language Section Test',
        description: 'Practice questions for Language section',
        subject: 'Languages',
        duration: 60,
        questions: [],
        createdBy: 'admin',
        createdAt: Date.now() - 86400000,
        isVisible: true,
        status: 'Published',
        testType: 'pyq',
        pyqSubject: 'languages',
        price: 0
    },
    {
        id: 'demo-3',
        title: 'NCET General Aptitude Mock',
        description: 'Test your general aptitude skills',
        subject: 'General',
        duration: 45,
        questions: [],
        createdBy: 'admin',
        createdAt: Date.now() - 172800000,
        isVisible: true,
        status: 'Published',
        testType: 'pyq',
        pyqSubject: 'non-domain',
        price: 0
    }
];

export default function DashboardPage() {
    const { user } = useAuth();
    const [tests, setTests] = useState<Test[]>([]);
    const [posts, setPosts] = useState<any[]>([]);
    const [plannerData, setPlannerData] = useState({ target: "2 Mock Tests & 1 Physics Chapter", progress: 65 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch Tests
                const fetchedTests = await getTests();
                const processedTests = (fetchedTests.length > 0 ? fetchedTests : MOCK_TESTS).map(t => ({
                    ...t,
                    duration: t.duration || 180,
                    questionsCount: t.questions?.length || 0,
                    href: t.id.startsWith('demo-') ? `/dashboard/tests` : (t.testType === 'pyq' ? `/dashboard/tests/pyq/${t.pyqSubject || 'non-domain'}` : `/dashboard/tests/attempt?id=${t.id}`)
                }));
                setTests(processedTests);

                // Fetch Forum Posts for Community Discussion
                const fetchedPosts = await getForumPosts();
                const processedPosts = fetchedPosts.slice(0, 2).map(p => ({
                    title: p.title,
                    preview: p.content.substring(0, 100) + "...",
                    authorAvatar: "/student.png",
                    repliesCount: 12, // Placeholder as we don't fetch count directly here cheaply
                    hasExpertReply: p.upvotes > 5
                }));
                setPosts(processedPosts.length > 0 ? processedPosts : [
                    { title: "Shortcut for finding Eigenvalues in 3x3 matrices?", preview: "I am consistently taking more than 5 minutes on...", authorAvatar: "/student.png", repliesCount: 12, hasExpertReply: true },
                    { title: "Important Organic Chemistry chapters?", preview: "Focus on reaction mechanisms or named...", authorAvatar: "/student.png", repliesCount: 5, hasExpertReply: false }
                ]);

                // Fetch Planner Data (derived from streak/daily progress if available)
                if (user?.$id) {
                    const progress = await getDailyProgress(user.$id);
                    if (progress) {
                        const percent = Math.round((progress.dailyProgress / progress.dailyGoalTarget) * 100);
                        setPlannerData({
                            target: `Complete ${progress.dailyGoalTarget} Daily Questions`,
                            progress: percent
                        });
                    }
                }

            } catch (error) {
                console.error("Failed to fetch dashboard data:", error);
                setTests(MOCK_TESTS.map(t => ({ ...t, questionsCount: 0, duration: 180 })));
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [user]);

    return (
        <div className="pb-24 animate-in fade-in slide-in-from-bottom-5 duration-700">
            <div className="space-y-10">
                {/* Promotional Carousel */}
                <div className="rounded-3xl overflow-hidden shadow-xl shadow-black/5">
                    <BannerCarousel />
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">

                    {/* Left Column (8 slots) */}
                    <div className="lg:col-span-8 space-y-12">
                        {/* Mock Test Engine */}
                        <MockTestEngine tests={tests} />

                        {/* AI Smart Planner */}
                        <AISmartPlanner target={plannerData.target} progress={plannerData.progress} />
                    </div>

                    {/* Right Column (4 slots) */}
                    <div className="lg:col-span-4 space-y-12">
                        {/* Community Discussion */}
                        <CommunityDiscussion posts={posts} />

                        {/* Performance Analytics */}
                        <PerformanceAnalytics score={642} trend={12} />
                    </div>
                </div>

                {/* Bottom Section - Full Width */}
                <ResourceLibrary />
            </div>
        </div>
    );
}
