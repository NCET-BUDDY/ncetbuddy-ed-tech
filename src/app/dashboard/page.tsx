"use client";

import React from 'react';
import BannerCarousel from '@/components/dashboard/BannerCarousel';
import { useEffect, useState } from 'react';
import { getBooks, getFormulaCards, getTests, getForumPosts, getDailyProgress, getUserTestResults, getDynamicPlannerTask, PlannerTask, getVideoClasses, markTaskDone, getUserProfile, getUserPayments } from '@/lib/pocketbase-db';
import { Test, ForumPost, Book, FormulaCard, VideoClass, UserProfile } from '@/types';
import MentorshipModal from '@/components/mentorship/MentorshipModal';
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
    const [plannerData, setPlannerData] = useState<PlannerTask>({
        title: "Loading target...",
        subtitle: "Calculating next steps",
        actionText: "Wait",
        actionUrl: "#",
        progress: 0
    });
    const [analyticsData, setAnalyticsData] = useState({ score: 0, trend: 0 });
    const [loading, setLoading] = useState(true);
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [showMentorshipModal, setShowMentorshipModal] = useState(false);

    // Granular Loading States for improved perceived performance
    const [status, setStatus] = useState({
        user: true,
        tests: true,
        posts: true,
        planner: true,
        resources: true,
        analytics: true
    });

    // Resource Library States
    const [books, setBooks] = useState<Book[]>([]);
    const [formulaCards, setFormulaCards] = useState<FormulaCard[]>([]);
    const [videos, setVideos] = useState<VideoClass[]>([]);

    useEffect(() => {
        if (!user?.$id) return;

        const fetchInitialBatch = async () => {
            try {
                // Parallelize independent fetches
                const [
                    userProfile,
                    userPayments,
                    fetchedTests,
                    fetchedPosts,
                    testResults,
                    booksData,
                    formulaData,
                    videosData
                ] = await Promise.all([
                    getUserProfile(user.$id),
                    getUserPayments(user.$id),
                    getTests(),
                    getForumPosts(),
                    getUserTestResults(user.$id),
                    getBooks(),
                    getFormulaCards(),
                    getVideoClasses()
                ]);

                // 1. Process User Profile & Payments
                if (userProfile) {
                    setProfile(userProfile);
                    // Show mentorship modal if phone number is missing
                    const localPhone = localStorage.getItem(`mentorship_phone_${user.$id}`);
                    if (!userProfile.phoneNumber && !localPhone) {
                        setTimeout(() => setShowMentorshipModal(true), 1500);
                    }
                }
                const isAdmin = (userProfile as any)?.role === 'admin';
                const hasAnyNRTPurchase = userPayments?.some((p: any) => 
                    p.status === 'Credit' && (p.productName || "").toUpperCase().includes('NRT')
                );
                setStatus(prev => ({ ...prev, user: false }));

                // 2. Process Tests
                const processedTests = (fetchedTests.length > 0 ? fetchedTests : MOCK_TESTS)
                    .filter(t => {
                        const isNRT = t.title.toUpperCase().includes('NRT');
                        const isNRT1 = t.title.toUpperCase().includes('NRT 1');
                        const isNRTDemo = t.title.toUpperCase().includes('NRT DEMO');
                        const isProfileScience = (userProfile as any)?.stream === 'Science';
                        if (!isNRT) return true;
                        const isUnlocked = hasAnyNRTPurchase || isAdmin || (isNRTDemo && isProfileScience);
                        return isNRT1 || (isNRTDemo && isProfileScience) || isUnlocked;
                    })
                    .map(t => ({
                        ...t,
                        duration: t.duration || 180,
                        questionsCount: t.questions?.length || 0,
                        href: t.id.startsWith('demo-') ? `/dashboard/tests` : 
                              (t.title.toUpperCase().includes('NRT') ? `/dashboard/tests/attempt?id=${t.id}` : 
                              (t.testType === 'pyq' ? `/dashboard/tests/pyq/${t.pyqSubject || 'non-domain'}` : `/dashboard/tests/attempt?id=${t.id}`))
                    }));
                setTests(processedTests);
                setStatus(prev => ({ ...prev, tests: false }));

                // 3. Process Forum Posts
                const processedPosts = fetchedPosts.slice(0, 2).map(p => ({
                    title: p.title,
                    preview: p.content.substring(0, 100) + "...",
                    authorAvatar: "/student.png",
                    repliesCount: 12,
                    hasExpertReply: p.upvotes > 5
                }));
                setPosts(processedPosts.length > 0 ? processedPosts : [
                    { title: "Shortcut for finding Eigenvalues in 3x3 matrices?", preview: "I am consistently taking more than 5 minutes on...", authorAvatar: "/student.png", repliesCount: 12, hasExpertReply: true },
                    { title: "Important Organic Chemistry chapters?", preview: "Focus on reaction mechanisms or named...", authorAvatar: "/student.png", repliesCount: 5, hasExpertReply: false }
                ]);
                setStatus(prev => ({ ...prev, posts: false }));

                // 4. Process Resources
                setBooks(booksData);
                setFormulaCards(formulaData);
                const mappedVideos = videosData.map((v) => ({
                    id: v.id,
                    title: v.title,
                    url: v.url,
                    thumbnailUrl: v.thumbnailUrl || `https://img.youtube.com/vi/${v.url.split('v=')[1]?.split('&')[0]}/hqdefault.jpg`,
                    subject: v.subject || 'Lectures'
                }));
                setVideos(mappedVideos);
                setStatus(prev => ({ ...prev, resources: false }));

                // 5. Process Analytics (using pre-fetched testResults)
                if (testResults && testResults.length > 0) {
                    const latestTests = testResults.slice(0, 5);
                    let totalScore = 0;
                    let totalMaxScore = 0;
                    latestTests.forEach(tr => {
                        totalScore += tr.score || 0;
                        totalMaxScore += tr.totalQuestions ? tr.totalQuestions * 4 : 400;
                    });
                    const avgPercentage = totalMaxScore > 0 ? totalScore / totalMaxScore : 0;
                    const projectedScore = Math.round(avgPercentage * 640);

                    const prevTests = testResults.slice(5, 10);
                    let trend = 0;
                    if (prevTests.length > 0) {
                        let previousScore = 0;
                        let previousMaxScore = 0;
                        prevTests.forEach(tr => {
                            previousScore += tr.score || 0;
                            previousMaxScore += tr.totalQuestions ? tr.totalQuestions * 4 : 400;
                        });
                        const prevAvg = previousMaxScore > 0 ? previousScore / previousMaxScore : 0;
                        const prevProjected = Math.round(prevAvg * 640);
                        if (prevProjected > 0) {
                            trend = Math.round(((projectedScore - prevProjected) / prevProjected) * 100);
                        }
                    }
                    setAnalyticsData({ score: projectedScore, trend });
                }
                setStatus(prev => ({ ...prev, analytics: false }));

                // 6. Generate Planner Task (Dynamic based on results)
                const key = `completed_tasks_${user.$id}`;
                const stored = localStorage.getItem(key);
                const completed = stored ? JSON.parse(stored) : [];
                // Use the dependency-injected testResults to avoid another fetch
                const dynamicTask = await getDynamicPlannerTask(user.$id, completed, testResults);
                setPlannerData(dynamicTask);
                setStatus(prev => ({ ...prev, planner: false }));

            } catch (error) {
                console.error("Dashboard fetch error:", error);
                // Fail-safe defaults
                setTests(MOCK_TESTS.map(t => ({ ...t, questionsCount: 0 })));
            } finally {
                setLoading(false);
            }
        };

        fetchInitialBatch();
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
                        {status.tests ? (
                            <div className="space-y-4">
                                <div className="h-8 w-48 bg-slate-200 rounded-lg animate-pulse"></div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="h-48 bg-slate-100 rounded-3xl animate-pulse"></div>
                                    <div className="h-48 bg-slate-100 rounded-3xl animate-pulse"></div>
                                </div>
                            </div>
                        ) : (
                            <MockTestEngine tests={tests} />
                        )}

                        {/* AI Smart Planner */}
                        {status.planner ? (
                             <div className="h-32 bg-slate-100 rounded-3xl animate-pulse"></div>
                        ) : (
                            <AISmartPlanner
                            task={plannerData}
                            onComplete={async () => {
                                if (user?.$id) {
                                    await markTaskDone(user.$id, plannerData.title);
                                    // Refresh task
                                    const key = `completed_tasks_${user.$id}`;
                                    const stored = localStorage.getItem(key);
                                    const completed = stored ? JSON.parse(stored) : [];
                                    const newTask = await getDynamicPlannerTask(user.$id, completed);
                                    setPlannerData(newTask);
                                }
                            }}
                        />
                        )}

                        {/* Resource Library */}
                        {status.resources ? (
                             <div className="space-y-4">
                                 <div className="h-8 w-48 bg-slate-200 rounded-lg animate-pulse"></div>
                                 <div className="h-64 bg-slate-100 rounded-3xl animate-pulse"></div>
                             </div>
                        ) : (
                            <ResourceLibrary books={books} formulaCards={formulaCards} videos={videos} />
                        )}
                    </div>

                    {/* Right Column (4 slots) */}
                    <div className="lg:col-span-4 space-y-12">
                        {/* Community Discussion */}
                        {status.posts ? (
                            <div className="h-80 bg-slate-100 rounded-3xl animate-pulse"></div>
                        ) : (
                            <CommunityDiscussion posts={posts} />
                        )}

                        {/* Performance Analytics */}
                        {status.analytics ? (
                             <div className="h-64 bg-slate-100 rounded-3xl animate-pulse"></div>
                        ) : (
                            <PerformanceAnalytics score={analyticsData.score} trend={analyticsData.trend} />
                        )}
                    </div>
                </div>

                {/* Bottom Section removed duplicate library */}
            </div>

            {/* Mentorship Integration */}
            {showMentorshipModal && profile && (
                <MentorshipModal 
                    userProfile={profile}
                    onClose={() => setShowMentorshipModal(false)}
                    onUpdate={(updated) => {
                        setProfile(updated);
                        setShowMentorshipModal(false);
                    }}
                />
            )}
        </div>
    );
}
