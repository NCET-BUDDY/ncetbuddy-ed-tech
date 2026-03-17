"use client";

import React from 'react';
import BannerCarousel from '@/components/dashboard/BannerCarousel';
import { useEffect, useState } from 'react';
import { getBooks, getFormulaCards, getTests, getForumPosts, getDailyProgress, getUserTestResults, getDynamicPlannerTask, PlannerTask, getVideoClasses, markTaskDone, getUserProfile } from '@/lib/appwrite-db';
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

    // Resource Library States
    const [books, setBooks] = useState<Book[]>([]);
    const [formulaCards, setFormulaCards] = useState<FormulaCard[]>([]);
    const [videos, setVideos] = useState<VideoClass[]>([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch User Profile
                if (user?.$id) {
                    const userProfile = await getUserProfile(user.$id);
                    if (userProfile) {
                        setProfile(userProfile);
                        // Show mentorship modal if phone number is missing (check both DB and localStorage)
                        const localPhone = localStorage.getItem(`mentorship_phone_${user.$id}`);
                        if (!userProfile.phoneNumber && !localPhone) {
                            // Small delay for better UX
                            setTimeout(() => setShowMentorshipModal(true), 2000);
                        }
                    }
                }

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

                // Fetch Planner Data (Dynamic based on test results)
                if (user?.$id) {
                    const key = `completed_tasks_${user.$id}`;
                    const stored = localStorage.getItem(key);
                    const completed = stored ? JSON.parse(stored) : [];
                    const dynamicTask = await getDynamicPlannerTask(user.$id, completed);
                    setPlannerData(dynamicTask);

                    // Fetch Performance Analytics
                    try {
                        const testResults = await getUserTestResults(user.$id);
                        if (testResults && testResults.length > 0) {
                            // Calculate projected score based on recent performance
                            // Total NCET score is 640
                            const latestTests = testResults.slice(0, 5); // Average of last 5 tests
                            let totalScore = 0;
                            let totalMaxScore = 0;

                            latestTests.forEach(tr => {
                                totalScore += tr.score || 0;
                                totalMaxScore += tr.totalQuestions ? tr.totalQuestions * 4 : 400; // Roughly assuming 4 marks per question
                            });

                            const avgPercentage = totalMaxScore > 0 ? totalScore / totalMaxScore : 0;
                            const projectedScore = Math.round(avgPercentage * 640);

                            // Calculate trend vs previous set of tests
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
                    } catch (err) {
                        console.error("Failed to fetch test results for analytics:", err);
                    }
                }

                // Fetch Resource Library Items
                const [booksData, formulaData, videosData] = await Promise.all([
                    getBooks(),
                    getFormulaCards(),
                    getVideoClasses()
                ]);

                setBooks(booksData);
                setFormulaCards(formulaData);

                // Map local EducatorVideos to match the VideoClass interface expected by ResourceLibrary if needed, 
                // but getAllEducatorVideos actually returns `EducatorVideo` which is mostly compatible.
                // We'll safely map it to match UI expectations.
                const mappedVideos = videosData.map((v) => ({
                    id: v.id,
                    title: v.title,
                    url: v.url,
                    thumbnailUrl: v.thumbnailUrl || `https://img.youtube.com/vi/${v.url.split('v=')[1]?.split('&')[0]}/hqdefault.jpg`,
                    subject: v.subject || 'Lectures'
                }));
                setVideos(mappedVideos);

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

                        {/* Resource Library */}
                        <ResourceLibrary books={books} formulaCards={formulaCards} videos={videos} />
                    </div>

                    {/* Right Column (4 slots) */}
                    <div className="lg:col-span-4 space-y-12">
                        {/* Community Discussion */}
                        <CommunityDiscussion posts={posts} />

                        {/* Performance Analytics */}
                        <PerformanceAnalytics score={analyticsData.score} trend={analyticsData.trend} />
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
