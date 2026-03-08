import { databases, storage, isAppwriteConfigured } from "./appwrite-student";
import { ID, Query, Models } from "appwrite";
import { Test, Book, FormulaCard, Notification, PYQ, SiteSettings, UserProfile, TestResult, VideoClass, Educator, VideoProgress, Purchase, Payment, EducatorVideo, EducatorStats, UserEvent, UserAnalytics, TestRankEntry, TestPerformanceSummary, QuestionAnalysis, AdminTestAnalytics, ForumPost, ForumComment, ForumCategory, CarouselBanner } from "@/types";

const DB_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || 'ncet-buddy-db';

// --- Carousel Banners ---
export const getBanners = async (): Promise<CarouselBanner[]> => {
    try {
        const response = await fetch('/api/admin/banners');
        if (!response.ok) throw new Error("Failed to fetch banners");
        return await response.json();
    } catch (error) {
        console.error("Error fetching banners:", error);
        return [];
    }
};

export const getActiveBanners = async (): Promise<CarouselBanner[]> => {
    try {
        const banners = await getBanners();
        return banners.filter(b => b.isActive).sort((a, b) => a.order - b.order);
    } catch (error) {
        console.error("Error fetching active banners:", error);
        return [];
    }
};

export const createBanner = async (banner: Omit<CarouselBanner, "id">) => {
    try {
        const response = await fetch('/api/admin/banners', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(banner)
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || "Failed to create banner");
        }
    } catch (error) {
        console.error("Error creating banner:", error);
        throw error;
    }
};

export const updateBanner = async (id: string, data: Partial<CarouselBanner>) => {
    try {
        const response = await fetch('/api/admin/banners', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, ...data })
        });
        if (!response.ok) throw new Error("Failed to update banner");
    } catch (error) {
        console.error("Error updating banner:", error);
        throw error;
    }
};

export const deleteBanner = async (id: string) => {
    try {
        const response = await fetch(`/api/admin/banners?id=${id}`, {
            method: 'DELETE'
        });
        if (!response.ok) throw new Error("Failed to delete banner");
    } catch (error) {
        console.error("Error deleting banner:", error);
        throw error;
    }
};

// --- Tests ---
export const getTests = async (): Promise<Test[]> => {
    if (!isAppwriteConfigured()) return [];
    try {
        const response = await databases.listDocuments(DB_ID, 'tests', [
            Query.limit(5000),
            Query.orderDesc('createdAt')
        ]);
        return response.documents.map(doc => {
            let questions = doc.questions;
            try {
                while (typeof questions === 'string') {
                    questions = JSON.parse(questions);
                }
            } catch (e) {
                console.error("Error parsing questions for test:", doc.$id, e);
                questions = [];
            }
            let subjectAllocations = doc.subjectAllocations;
            try {
                if (typeof subjectAllocations === 'string') {
                    subjectAllocations = JSON.parse(subjectAllocations);
                }
            } catch (e) {
                console.error("Error parsing subjectAllocations for test:", doc.$id, e);
                subjectAllocations = [];
            }

            return {
                id: doc.$id,
                ...doc,
                questions: Array.isArray(questions) ? questions : [],
                subjectAllocations: Array.isArray(subjectAllocations) ? subjectAllocations : doc.isFullSyllabus ? subjectAllocations : undefined
            };
        }) as unknown as Test[];
    } catch (error) {
        console.error("Error fetching tests:", error);
        return [];
    }
};

export const getTestById = async (id: string): Promise<Test | null> => {
    if (!isAppwriteConfigured()) return null;
    try {
        const doc = await databases.getDocument(
            DB_ID,
            'tests',
            id
        );
        let questions = doc.questions;
        try {
            while (typeof questions === 'string') {
                questions = JSON.parse(questions);
            }
        } catch (e) {
            console.error("Error parsing questions for test:", doc.$id, e);
            questions = [];
        }
        let subjectAllocations = doc.subjectAllocations;
        try {
            if (typeof subjectAllocations === 'string') {
                subjectAllocations = JSON.parse(subjectAllocations);
            }
        } catch (e) {
            console.error("Error parsing subjectAllocations for test:", doc.$id, e);
            subjectAllocations = [];
        }

        return {
            id: doc.$id,
            ...doc,
            questions: Array.isArray(questions) ? questions : [],
            subjectAllocations: Array.isArray(subjectAllocations) ? subjectAllocations : doc.isFullSyllabus ? subjectAllocations : undefined
        } as unknown as Test;
    } catch (error) {
        console.error("Error fetching test:", error);
        return null;
    }
};

export const createTest = async (test: Omit<Test, "id">): Promise<string | null> => {
    if (!isAppwriteConfigured()) return null;
    try {
        const { questions, subjectAllocations, ...restOfTest } = test;
        const response = await databases.createDocument(DB_ID, 'tests', ID.unique(), {
            ...restOfTest,
            questions: JSON.stringify(questions),
            subjectAllocations: subjectAllocations ? JSON.stringify(subjectAllocations) : undefined,
            createdAt: Math.floor(Date.now() / 1000),
            isVisible: test.isVisible !== undefined ? test.isVisible : true // Default to visible
        });
        return response.$id;
    } catch (error) {
        console.error("Error creating test:", error);
        return null;
    }
};

export const deleteTest = async (testId: string): Promise<boolean> => {
    try {
        await databases.deleteDocument(DB_ID, 'tests', testId);
        return true;
    } catch (error) {
        console.error("Error deleting test:", error);
        return false;
    }
};

export const updateTest = async (testId: string, data: Partial<Test>): Promise<boolean> => {
    try {
        const { id, ...updateData } = data; // Remove ID from payload if present
        await databases.updateDocument(DB_ID, 'tests', testId, updateData);
        return true;
    } catch (error) {
        console.error("Error updating test:", error);
        return false;
    }
};

export const saveTestResult = async (result: Partial<TestResult> & { correctCount?: number, incorrectCount?: number }) => {
    try {
        // 1. Prepare data
        const { correctCount, incorrectCount, ...dataToSave } = result; // Omit these two fields

        // Base data compliant with potentially outdated schema
        const baseDocData: any = {
            userId: dataToSave.userId,
            testId: dataToSave.testId,
            score: dataToSave.score,
            totalQuestions: dataToSave.totalQuestions,
            answers: JSON.stringify(dataToSave.answers),
            completedAt: dataToSave.completedAt,
        };

        // Enhanced data with new analytics fields
        const enhancedDocData: any = { ...baseDocData };
        if (dataToSave.timeTaken !== undefined) {
            enhancedDocData.timeTaken = dataToSave.timeTaken;
        }
        if (dataToSave.questionTimes) {
            enhancedDocData.questionTimes = JSON.stringify(dataToSave.questionTimes);
        }

        try {
            // Attempt to save with full analytics data
            await databases.createDocument(
                DB_ID,
                'test-results',
                ID.unique(),
                enhancedDocData
            );
        } catch (initialError: any) {
            // If schema validation fails (Attribute not found), fallback to basic save
            // Appwrite returns 400 for validation errors or unknown attributes
            if (initialError.code === 400 || (initialError.message && (initialError.message.includes('Attribute not found') || initialError.message.includes('unknown') || initialError.message.includes('Invalid document structure')))) {
                console.warn("Enhanced analytics fields likely missing in schema. Fallback to basic save.");
                await databases.createDocument(
                    DB_ID,
                    'test-results',
                    ID.unique(),
                    baseDocData
                );
            } else {
                throw initialError;
            }
        }

        // Note: We are no longer updating the 'users' collection here because the 
        // derived stats are calculated dynamically.

        // Update Daily Streak & Progress
        if (dataToSave.userId) {
            // We use totalQuestions as the metric for daily progress (questions solved)
            const questionsAttempted = dataToSave.totalQuestions || 0;
            // Actually saveTestResult is called after test completion.
            await updateStreakAndDaily(dataToSave.userId, questionsAttempted);
        }

    } catch (error) {
        console.error("Error saving test result:", error);
        throw error;
    }
};

export const getLeaderboard = async (limit: number = 10): Promise<UserProfile[]> => {
    if (!isAppwriteConfigured()) return [];
    try {
        // 1. Fetch all users (needed for names)
        // We fetch a larger limit to ensure we cover the active user base
        const usersResponse = await databases.listDocuments(DB_ID, 'users', [
            Query.limit(100)
        ]);
        const users = usersResponse.documents.map(doc => ({ uid: doc.$id, ...doc })) as unknown as UserProfile[];

        // 2. Fetch all test results
        // We fetch a large number to ensure we have the full history for accurate scoring
        const resultsResponse = await databases.listDocuments(DB_ID, 'test-results', [
            Query.limit(5000),
            Query.select(['userId', 'score']) // Optimize fetch to only needed fields if possible
        ]);

        // 3. Aggregate scores in memory
        const userStats = new Map<string, { totalScore: number, testsAttempted: number }>();

        resultsResponse.documents.forEach((doc: any) => {
            const uid = doc.userId;
            const current = userStats.get(uid) || { totalScore: 0, testsAttempted: 0 };
            userStats.set(uid, {
                totalScore: current.totalScore + (Number(doc.score) || 0),
                testsAttempted: current.testsAttempted + 1
            });
        });

        // 4. Merge stats into users and sort
        const leaderboard = users.map(user => {
            const stats = userStats.get(user.uid) || { totalScore: 0, testsAttempted: 0 };
            return {
                ...user,
                totalScore: stats.totalScore,
                testsAttempted: stats.testsAttempted
            };
        });

        // 5. Sort by Total Score (Descending)
        leaderboard.sort((a, b) => (b.totalScore || 0) - (a.totalScore || 0));

        // 6. Return top N
        return leaderboard.slice(0, limit);

    } catch (error) {
        console.error("Error fetching leaderboard:", error);
        return [];
    }
};

/**
 * Get leaderboard summary for privacy-focused display
 * Returns only the top performer (public) and current user's standing (private)
 * 
 * Percentile Calculation Rule:
 * - Only includes students who have attempted at least 1 test
 * - Percentile = (students with lower score / (total - 1)) * 100
 * - Uses competition ranking (tied scores get same rank)
 */
export const getLeaderboardSummary = async (currentUserId: string): Promise<{
    topPerformer: (UserProfile & { rank: number }) | null;
    userStanding: {
        rank: number;
        totalScore: number;
        testsAttempted: number;
        percentile: number;
        aheadOfPercent: number;
        totalParticipants: number;
        mockTestPerformances: { testId: string; title: string; score: number; obtainedAt: number }[];
        pyqPerformance: { totalScore: number; testsAttempted: number };
    } | null;
    totalParticipants: number;
}> => {
    if (!isAppwriteConfigured()) {
        return { topPerformer: null, userStanding: null, totalParticipants: 0 };
    }

    try {
        // 1. Fetch all users
        const usersResponse = await databases.listDocuments(DB_ID, 'users', [
            Query.limit(100)
        ]);
        const users = usersResponse.documents.map(doc => ({ uid: doc.$id, ...doc })) as unknown as UserProfile[];

        // 2. Fetch all test results
        const resultsResponse = await databases.listDocuments(DB_ID, 'test-results', [
            Query.limit(5000),
            // We need createdAt to show date in test-wise performance
            Query.select(['userId', 'score', 'testId', '$createdAt'])
        ]);

        // 2.1 Fetch all tests to determine type (Mock vs PYQ) and get Titles
        // We fetch only needed fields to optimize
        const testsResponse = await databases.listDocuments(DB_ID, 'tests', [
            Query.limit(1000),
            Query.select(['$id', 'title', 'testType'])
        ]);

        const testMetadata = new Map<string, { title: string, type: 'pyq' | 'educator' | undefined }>();
        testsResponse.documents.forEach((doc: any) => {
            testMetadata.set(doc.$id, { title: doc.title, type: doc.testType });
        });

        // 3. Aggregate scores per user
        interface UserStats {
            totalScore: number;
            testsAttempted: number; // Overall
            mockTests: { testId: string; title: string; score: number; obtainedAt: number }[];
            pyqTotalScore: number;
            pyqAttempts: number;
        }

        const userStats = new Map<string, UserStats>();

        resultsResponse.documents.forEach((doc: any) => {
            const uid = doc.userId;
            const score = Number(doc.score) || 0;
            const testId = doc.testId;
            const createdAt = new Date(doc.$createdAt).getTime(); // Timestamp

            const meta = testMetadata.get(testId);
            const isPyq = meta?.type === 'pyq';
            const testTitle = meta?.title || 'Unknown Test';

            const current = userStats.get(uid) || {
                totalScore: 0,
                testsAttempted: 0,
                mockTests: [],
                pyqTotalScore: 0,
                pyqAttempts: 0
            };

            // Update Overall
            current.totalScore += score;
            current.testsAttempted += 1;

            // Update Specifics
            if (isPyq) {
                current.pyqTotalScore += score;
                current.pyqAttempts += 1;
            } else {
                // Assume it's a Mock Test (educator or undefined)
                current.mockTests.push({
                    testId,
                    title: testTitle,
                    score,
                    obtainedAt: createdAt
                });
            }

            userStats.set(uid, current);
        });

        // 4. Build leaderboard with only users who attempted tests
        const leaderboard = users
            .map(user => {
                const stats = userStats.get(user.uid);
                if (!stats || stats.testsAttempted === 0) return null; // Exclude users with 0 attempts

                // Sort mock tests by date desc (most recent first)
                stats.mockTests.sort((a, b) => b.obtainedAt - a.obtainedAt);

                return {
                    ...user,
                    totalScore: stats.totalScore,
                    testsAttempted: stats.testsAttempted,
                    mockTestPerformances: stats.mockTests,
                    pyqPerformance: {
                        totalScore: stats.pyqTotalScore,
                        testsAttempted: stats.pyqAttempts
                    }
                };
            })
            .filter(Boolean) as (UserProfile & {
                totalScore: number;
                testsAttempted: number;
                mockTestPerformances: { testId: string; title: string; score: number; obtainedAt: number }[];
                pyqPerformance: { totalScore: number; testsAttempted: number };
            })[];

        // 5. Sort by total score (descending)
        leaderboard.sort((a, b) => (b.totalScore || 0) - (a.totalScore || 0));

        const totalParticipants = leaderboard.length;

        // 6. Get top performer (rank #1)
        const topPerformer = leaderboard.length > 0
            ? { ...leaderboard[0], rank: 1 }
            : null;

        // 7. Calculate current user's standing
        let userStanding = null;
        const userIndex = leaderboard.findIndex(u => u.uid === currentUserId);

        if (userIndex !== -1) {
            const userProfile = leaderboard[userIndex];
            const rank = userIndex + 1; // 1-based rank

            // Calculate percentile
            // "Ahead of X%" = users with lower score / (total - 1) * 100
            const usersWithLowerScore = leaderboard.filter(u => (u.totalScore || 0) < (userProfile.totalScore || 0)).length;

            let aheadOfPercent = 0;
            if (totalParticipants > 1) {
                aheadOfPercent = Math.floor((usersWithLowerScore / (totalParticipants - 1)) * 100);
            }

            userStanding = {
                rank,
                totalScore: userProfile.totalScore || 0,
                testsAttempted: userProfile.testsAttempted || 0,
                percentile: 100 - aheadOfPercent, // Traditional percentile (higher is better)
                aheadOfPercent, // For display: "ahead of X%"
                totalParticipants,
                mockTestPerformances: userProfile.mockTestPerformances,
                pyqPerformance: userProfile.pyqPerformance
            };
        }

        return {
            topPerformer,
            userStanding,
            totalParticipants
        };

    } catch (error) {
        console.error("Error fetching leaderboard summary:", error);
        return { topPerformer: null, userStanding: null, totalParticipants: 0 };
    }
};


export const getUserTestResults = async (userId: string): Promise<TestResult[]> => {
    if (!isAppwriteConfigured()) return [];
    try {
        const response = await databases.listDocuments(DB_ID, 'test-results', [
            Query.equal('userId', userId),
            Query.orderDesc('completedAt')
        ]);
        const results = response.documents.map(doc => ({
            id: doc.$id,
            ...doc,
            answers: typeof doc.answers === 'string' ? JSON.parse(doc.answers) : doc.answers,
            questionTimes: typeof doc.questionTimes === 'string' ? JSON.parse(doc.questionTimes) : doc.questionTimes
        })) as unknown as TestResult[];

        // Deduplicate: same testId, score, and minute window
        const seenKeys = new Set<string>();
        return results.filter(r => {
            const timeWindow = Math.floor(r.completedAt / 60);
            const key = `${r.testId}-${timeWindow}-${r.score}`;
            if (seenKeys.has(key)) return false;
            seenKeys.add(key);
            return true;
        });
    } catch (error) {
        console.error("Error fetching user test results:", error);
        return [];
    }
};

export interface PlannerTask {
    title: string;
    subtitle: string;
    actionText: string;
    actionUrl: string;
    progress: number;
}

export const getDynamicPlannerTask = async (userId: string, completedTasks: string[] = []): Promise<PlannerTask> => {
    try {
        const results = await getUserTestResults(userId);

        // Base case: No tests taken yet
        if (!results || results.length === 0) {
            return {
                title: "Take your First Diagnostic Mock",
                subtitle: "0% Completed",
                actionText: "Start Test",
                actionUrl: "/dashboard/tests",
                progress: 0
            };
        }

        const latestResult = results[0];
        const maxScore = latestResult.totalQuestions ? latestResult.totalQuestions * 4 : 400; // assumption
        const percentage = maxScore > 0 ? (latestResult.score / maxScore) * 100 : 0;

        // Fetch user's overall daily progress to still show bar completion 
        const daily = await getDailyProgress(userId);
        let dailyPercent = 0;
        if (daily && daily.dailyGoalTarget > 0) {
            dailyPercent = Math.min(Math.round((daily.dailyProgress / daily.dailyGoalTarget) * 100), 100);
        }

        // Generate dynamic task based on latest percentage
        if (percentage < 40 && !completedTasks.includes("Review Foundational Concepts")) {
            return {
                title: "Review Foundational Concepts",
                subtitle: `Scored ${Math.round(percentage)}% recently - Need revision!`,
                actionText: "Mark as Done",
                actionUrl: "/learning",
                progress: dailyPercent
            };
        } else if ((percentage < 75 || completedTasks.includes("Review Foundational Concepts")) && !completedTasks.includes("Practice Weak Sections")) {
            return {
                title: "Practice Weak Sections",
                subtitle: "Solidify your understanding",
                actionText: "Explore PYQs",
                actionUrl: "/dashboard/tests",
                progress: dailyPercent
            };
        } else {
            return {
                title: "Attempt Advanced Full Mock",
                subtitle: `Great score! (${Math.round(percentage)}%) Keep pushing.`,
                actionText: "Take Challenge",
                actionUrl: "/dashboard/tests",
                progress: dailyPercent
            };
        }
    } catch (error) {
        console.error("Error generating dynamic task:", error);
        return {
            title: "Continue Daily Practice",
            subtitle: "Keep your streak going",
            actionText: "Practice Now",
            actionUrl: "/dashboard/tests",
            progress: 0
        };
    }
};

export const markTaskDone = async (userId: string, taskTitle: string) => {
    if (typeof window !== 'undefined') {
        const key = `completed_tasks_${userId}`;
        const stored = localStorage.getItem(key);
        const completed = stored ? JSON.parse(stored) : [];
        if (!completed.includes(taskTitle)) {
            completed.push(taskTitle);
            localStorage.setItem(key, JSON.stringify(completed));
        }
    }

    // Log event for backend tracking if configured
    if (isAppwriteConfigured()) {
        try {
            await logUserEvent({
                userId: userId,
                eventType: 'other',
                metadata: JSON.stringify({ action: 'planner_task_complete', taskTitle })
            });
        } catch (e) {
            console.error("Failed to log planner task completion:", e);
        }
    }
};

// --- Books / Notes ---
export const getBooks = async (): Promise<Book[]> => {
    if (!isAppwriteConfigured()) return [];
    try {
        const response = await databases.listDocuments(DB_ID, 'books', [
            Query.limit(5000),
            Query.orderDesc('createdAt')
        ]);
        return response.documents.map(doc => ({ id: doc.$id, ...doc })) as unknown as Book[];
    } catch (error) {
        console.error("Error fetching books:", error);
        return [];
    }
};

export const createBook = async (book: Omit<Book, "id">) => {
    try {
        await databases.createDocument(DB_ID, 'books', ID.unique(), book);
    } catch (error) {
        console.error("Error creating book:", error);
        throw error;
    }
};

export const deleteBook = async (id: string) => {
    try {
        await databases.deleteDocument(DB_ID, 'books', id);
    } catch (error) {
        console.error("Error deleting book:", error);
        throw error;
    }
};

export const updateBook = async (id: string, data: Partial<Book>) => {
    try {
        await databases.updateDocument(DB_ID, 'books', id, data);
    } catch (error) {
        console.error("Error updating book:", error);
        throw error;
    }
};

// --- Formula Cards ---
export const getFormulaCards = async (): Promise<FormulaCard[]> => {
    if (!isAppwriteConfigured()) return [];
    try {
        const response = await databases.listDocuments(DB_ID, 'formula_cards', [
            Query.limit(5000),
            Query.orderDesc('createdAt')
        ]);
        return response.documents.map(doc => ({ id: doc.$id, ...doc })) as unknown as FormulaCard[];
    } catch (error) {
        console.error("Error fetching formula cards:", error);
        return [];
    }
};

export const createFormulaCard = async (card: Omit<FormulaCard, "id">) => {
    try {
        await databases.createDocument(DB_ID, 'formula_cards', ID.unique(), card);
    } catch (error) {
        console.error("Error creating formula card:", error);
        throw error;
    }
};

export const deleteFormulaCard = async (id: string) => {
    try {
        await databases.deleteDocument(DB_ID, 'formula_cards', id);
    } catch (error) {
        console.error("Error deleting formula card:", error);
        throw error;
    }
};

export const updateFormulaCard = async (id: string, data: Partial<FormulaCard>) => {
    try {
        await databases.updateDocument(DB_ID, 'formula_cards', id, data);
    } catch (error) {
        console.error("Error updating formula card:", error);
        throw error;
    }
};

// --- PYQs ---
export const getPYQs = async (): Promise<PYQ[]> => {
    if (!isAppwriteConfigured()) return [];
    try {
        const response = await databases.listDocuments(DB_ID, 'pyqs', [
            Query.limit(5000),
            Query.orderDesc('year')
        ]);
        return response.documents.map(doc => ({ id: doc.$id, ...doc })) as unknown as PYQ[];
    } catch (error) {
        console.error("Error fetching PYQs:", error);
        return [];
    }
};

export const createPYQ = async (pyq: Omit<PYQ, "id">) => {
    try {
        await databases.createDocument(DB_ID, 'pyqs', ID.unique(), pyq);
    } catch (error) {
        console.error("Error creating PYQ:", error);
        throw error;
    }
};

export const deletePYQ = async (id: string) => {
    try {
        await databases.deleteDocument(DB_ID, 'pyqs', id);
    } catch (error) {
        console.error("Error deleting PYQ:", error);
        throw error;
    }
};

// --- Users ---
export const getUsers = async (): Promise<UserProfile[]> => {
    if (!isAppwriteConfigured()) return [];
    try {
        const response = await databases.listDocuments(DB_ID, 'users', [
            Query.limit(5000),
            Query.orderDesc('$createdAt')
        ]);
        return response.documents.map(doc => ({ uid: doc.$id, ...doc })) as unknown as UserProfile[];
    } catch (error) {
        console.error("Error fetching users:", error);
        return [];
    }
};

export const updateUser = async (uid: string, data: Partial<UserProfile>) => {
    try {
        // Update 'users' collection (Legacy/Primary)
        await databases.updateDocument(DB_ID, 'users', uid, data);

        // Try updating 'user_profiles' as well (New/Preferred)
        try {
            await databases.updateDocument(DB_ID, 'user_profiles', uid, data);
        } catch (e: any) {
            // Ignore if document not found in user_profiles
            if (e.code !== 404) {
                console.warn("Failed to update user_profiles mirror:", e);
            }
        }
    } catch (error) {
        console.error("Error updating user:", error);
        throw error;
    }
};

// --- Notifications ---
export const getNotifications = async (): Promise<Notification[]> => {
    if (!isAppwriteConfigured()) return [];
    try {
        const response = await databases.listDocuments(DB_ID, 'notifications', [
            Query.limit(5000),
            Query.orderDesc('createdAt')
        ]);
        return response.documents.map(doc => ({ id: doc.$id, ...doc })) as unknown as Notification[];
    } catch (error) {
        console.error("Error fetching notifications:", error);
        return [];
    }
};

export const createNotification = async (notification: Omit<Notification, "id">) => {
    try {
        await databases.createDocument(DB_ID, 'notifications', ID.unique(), notification);
    } catch (error) {
        console.error("Error creating notification:", error);
        throw error;
    }
};

// --- Settings ---
export const getSettings = async (): Promise<SiteSettings | null> => {
    if (!isAppwriteConfigured()) return null;
    try {
        const doc = await databases.getDocument(
            DB_ID,
            'settings',
            'global'
        );
        return doc as unknown as SiteSettings;
    } catch (error) {
        return null;
    }
};

export const saveSettings = async (settings: SiteSettings) => {
    try {
        try {
            await databases.updateDocument(
                DB_ID,
                'settings',
                'global',
                settings as any
            );
        } catch (e) {
            await databases.createDocument(
                DB_ID,
                'settings',
                'global',
                settings as any
            );
        }
    } catch (error) {
        console.error("Error saving settings:", error);
        throw error;
    }
};

// --- Video Classes ---
export const getVideoClasses = async (): Promise<VideoClass[]> => {
    if (!isAppwriteConfigured()) return [];
    try {
        const response = await databases.listDocuments(DB_ID, 'videos', [
            Query.limit(5000),
            Query.orderDesc('createdAt')
        ]);
        return response.documents.map(doc => ({ id: doc.$id, ...doc })) as unknown as VideoClass[];
    } catch (error) {
        console.error("Error fetching video classes:", error);
        return [];
    }
};

export const createVideoClass = async (video: Omit<VideoClass, "id">) => {
    try {
        await databases.createDocument(DB_ID, 'videos', ID.unique(), {
            ...video,
            createdAt: video.createdAt || Math.floor(Date.now() / 1000)
        });
    } catch (error) {
        console.error("Error creating video class:", error);
        throw error;
    }
};

export const deleteVideoClass = async (videoId: string) => {
    try {
        await databases.deleteDocument(DB_ID, 'videos', videoId);
    } catch (error) {
        console.error("Error deleting video class:", error);
        throw error;
    }
};

// --- Educator Video System (New) ---

export const getEducator = async (id: string): Promise<Educator | null> => {
    if (!isAppwriteConfigured()) return null;
    try {
        const doc = await databases.getDocument(DB_ID, 'educators', id);
        return { id: doc.$id, ...doc } as unknown as Educator;
    } catch (error) {
        console.error("Error fetching educator:", error);
        return null;
    }
};

// --- Analytics ---

export const createUserSession = async (userId: string, deviceInfo?: string): Promise<string | null> => {
    if (!isAppwriteConfigured()) return null;
    try {
        const response = await databases.createDocument(DB_ID, 'sessions', ID.unique(), {
            userId,
            startTime: Math.floor(Date.now() / 1000),
            deviceInfo: deviceInfo || 'unknown'
        });
        return response.$id;
    } catch (error) {
        // console.error("Error creating session:", error); // Silent fail for analytics
        return null;
    }
};

export const getAllEducators = async (): Promise<Educator[]> => {
    if (!isAppwriteConfigured()) return [];
    try {
        const response = await databases.listDocuments(DB_ID, 'educators', [
            Query.orderAsc('name')
        ]);
        return response.documents.map(doc => ({ id: doc.$id, ...doc })) as unknown as Educator[];
    } catch (error: any) {
        // Suppress "Collection not found" error to avoid UI toast, just return empty list
        if (error?.code === 404 || error?.message?.includes('not found')) {
            console.warn("Educators collection missing. Please run setup script.");
            return [];
        }
        console.error("Error fetching all educators:", error);
        return [];
    }
};

export const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
    if (!isAppwriteConfigured()) return null;
    try {
        // First try 'user_profiles' (preferred)
        try {
            const doc = await databases.getDocument(DB_ID, 'user_profiles', userId);
            return { uid: doc.$id, ...doc } as unknown as UserProfile;
        } catch (e) {
            // Fallback to 'users' if legacy or not migrated
            const doc = await databases.getDocument(DB_ID, 'users', userId);
            return { uid: doc.$id, ...doc } as unknown as UserProfile;
        }
    } catch (error) {
        console.error("Error fetching user profile:", error);
        return null;
    }
};

export const getVideoProgress = async (studentId: string, educatorId: string): Promise<VideoProgress[]> => {
    if (!isAppwriteConfigured()) return [];
    try {
        const response = await databases.listDocuments(DB_ID, 'video_progress', [
            Query.equal('studentId', studentId),
            Query.equal('educatorId', educatorId)
        ]);
        return response.documents.map(doc => ({ ...doc })) as unknown as VideoProgress[];
    } catch (error) {
        console.error("Error fetching video progress:", error);
        return [];
    }
};

export const updateVideoProgress = async (studentId: string, educatorId: string, videoId: string, watched: boolean) => {
    if (!isAppwriteConfigured()) return;
    try {
        // Check if exists
        const result = await databases.listDocuments(DB_ID, 'video_progress', [
            Query.equal('studentId', studentId),
            Query.equal('educatorId', educatorId),
            Query.equal('videoId', videoId)
        ]);

        const data = {
            studentId,
            educatorId,
            videoId,
            watched,
            updatedAt: new Date().toISOString() // Using string format as Appwrite handles it
        } as any;

        if (result.documents.length > 0) {
            // Update
            await databases.updateDocument(DB_ID, 'video_progress', result.documents[0].$id, data);
        } else {
            // Create
            await databases.createDocument(DB_ID, 'video_progress', ID.unique(), data);
        }
    } catch (error) {
        console.error("Error updating video progress:", error);
        throw error;
    }
};

export const getFileViewUrl = (bucketId: string, fileId: string) => {
    return storage.getFileView(bucketId, fileId);
};

export const getFileDownloadUrl = (bucketId: string, fileId: string) => {
    return storage.getFileDownload(bucketId, fileId);
};

// --- Purchases (Payment) ---

export const createPurchase = async (purchase: Omit<Purchase, "id" | "createdAt">): Promise<string | null> => {
    if (!isAppwriteConfigured()) return null;
    try {
        const response = await databases.createDocument(DB_ID, 'purchases', ID.unique(), {
            ...purchase,
            createdAt: Math.floor(Date.now() / 1000)
        });
        return response.$id;
    } catch (error) {
        console.error("Error creating purchase record:", error);
        return null;
    }
};

export const updatePurchaseStatus = async (purchaseId: string, status: 'pending' | 'completed' | 'failed', paymentId?: string) => {
    try {
        const data: any = { status };
        if (paymentId) data.paymentId = paymentId;

        await databases.updateDocument(DB_ID, 'purchases', purchaseId, data);
    } catch (error) {
        console.error("Error updating purchase status:", error);
        throw error;
    }
};

export const getPurchaseByPaymentRequestId = async (paymentRequestId: string): Promise<Purchase | null> => {
    if (!isAppwriteConfigured()) return null;
    try {
        const response = await databases.listDocuments(DB_ID, 'purchases', [
            Query.equal('paymentRequestId', paymentRequestId),
            Query.limit(1)
        ]);
        if (response.documents.length === 0) return null;
        return { id: response.documents[0].$id, ...response.documents[0] } as unknown as Purchase;
    } catch (error) {
        console.error("Error fetching purchase by payment request ID:", error);
        return null;
    }
};

export const getUserPurchases = async (userId: string): Promise<Purchase[]> => {
    if (!isAppwriteConfigured()) return [];
    try {
        const response = await databases.listDocuments(DB_ID, 'purchases', [
            Query.equal('userId', userId),
            Query.orderDesc('createdAt')
        ]);
        return response.documents.map(doc => ({ id: doc.$id, ...doc })) as unknown as Purchase[];
    } catch (error) {
        console.error("Error fetching user purchases:", error);
        return [];
    }
};

export const hasUserPurchasedTest = async (userId: string, testId: string): Promise<boolean> => {
    if (!isAppwriteConfigured()) return false;
    try {
        const response = await databases.listDocuments(DB_ID, 'purchases', [
            Query.equal('userId', userId),
            Query.equal('testId', testId),
            Query.equal('status', 'completed')
        ]);
        return response.documents.length > 0;
    } catch (error) {
        console.error("Error checking test purchase:", error);
        return false;
    }
};

// Check if user has made ANY completed purchase (for premium features)
export const hasCompletedAnyPurchase = async (userId: string): Promise<boolean> => {
    if (!isAppwriteConfigured()) return false;
    try {
        try {
            const profile = await getUserProfile(userId);
            if (profile?.premiumStatus) return true;
        } catch (e) {
            console.error("Failed to check premium status", e);
        }

        const response = await databases.listDocuments(DB_ID, 'purchases', [
            Query.equal('userId', userId),
            Query.equal('status', 'completed'),
            Query.limit(1)
        ]);
        return response.documents.length > 0;
    } catch (error) {
        console.error("Error checking any purchase:", error);
        return false;
    }
};

// --- New Payments System ---

export const hasUserPaidForProduct = async (userId: string, productName: string): Promise<boolean> => {
    try {
        const baseUrl = typeof window !== 'undefined'
            ? window.location.origin
            : process.env.NEXT_PUBLIC_APP_URL || (process.env.NEXT_PUBLIC_VERCEL_URL ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}` : 'http://localhost:3000');

        const url = new URL('/api/user/check-payment', baseUrl);
        url.searchParams.append('userId', userId);
        url.searchParams.append('productName', productName);

        const response = await fetch(url.toString(), { cache: 'no-store' });
        if (!response.ok) return false;

        const data = await response.json();
        return data.hasAccess || false;
    } catch (error) {
        console.error("Error checking product payment:", error);
        return false;
    }
};

export const getUserPayments = async (userId: string): Promise<Payment[]> => {
    if (!isAppwriteConfigured()) return [];
    try {
        const response = await databases.listDocuments(DB_ID, 'payments', [
            Query.equal('userId', userId),
            Query.orderDesc('createdAt')
        ]);
        return response.documents.map(doc => ({ id: doc.$id, ...doc })) as unknown as Payment[];
    } catch (error) {
        console.error("Error fetching user payments:", error);
        return [];
    }
};


// --- Educator Portal Functions ---

export const getEducatorVideos = async (educatorId: string): Promise<EducatorVideo[]> => {
    if (!isAppwriteConfigured()) return [];
    try {
        const response = await databases.listDocuments(DB_ID, 'educator_videos', [
            Query.equal('educatorId', educatorId),
            Query.orderDesc('createdAt')
        ]);
        return response.documents.map(doc => ({ id: doc.$id, ...doc })) as unknown as EducatorVideo[];
    } catch (error) {
        console.error("Error fetching educator videos:", error);
        return [];
    }
};

export const getAllEducatorVideos = async (): Promise<EducatorVideo[]> => {
    if (!isAppwriteConfigured()) return [];
    try {
        const response = await databases.listDocuments(DB_ID, 'educator_videos', [
            Query.orderDesc('createdAt'),
            Query.limit(20) // Limit for dashboard performance
        ]);
        return response.documents.map(doc => ({ id: doc.$id, ...doc })) as unknown as EducatorVideo[];
    } catch (error) {
        console.error("Error fetching all educator videos:", error);
        return [];
    }
};

export const createEducatorVideo = async (video: Omit<EducatorVideo, "id">) => {
    try {
        await databases.createDocument(DB_ID, 'educator_videos', ID.unique(), video);
    } catch (error) {
        console.error("Error creating educator video:", error);
        throw error;
    }
};

export const deleteEducatorVideo = async (id: string) => {
    try {
        await databases.deleteDocument(DB_ID, 'educator_videos', id);
    } catch (error) {
        console.error("Error deleting educator video:", error);
        throw error;
    }
};

export const getEducatorStats = async (educatorId: string): Promise<EducatorStats> => {
    if (!isAppwriteConfigured()) return { totalRevenue: 0, totalSales: 0, recentSales: [] };

    try {
        // Fetch ALL completed purchases (Simulating single-educator platform for MVP)
        const response = await databases.listDocuments(DB_ID, 'purchases', [
            Query.equal('status', 'completed'),
            Query.orderDesc('createdAt'),
            Query.limit(100)
        ]);

        const purchases = response.documents.map(doc => ({ id: doc.$id, ...doc })) as unknown as Purchase[];
        const totalSales = response.total;
        const totalRevenue = purchases.reduce((sum, p) => sum + (p.amount || 0), 0);

        return {
            totalRevenue,
            totalSales,
            recentSales: purchases.slice(0, 5)
        };
    } catch (error) {
        console.error("Error fetching educator stats:", error);
        return { totalRevenue: 0, totalSales: 0, recentSales: [] };
    }
};

export const endUserSession = async (sessionId: string) => {
    if (!isAppwriteConfigured()) return;
    try {
        const endTime = Math.floor(Date.now() / 1000);
        const session = await databases.getDocument(DB_ID, 'sessions', sessionId);

        const startTime = typeof session.startTime === 'string'
            ? parseInt(session.startTime)
            : (session.startTime || endTime);

        const duration = Math.max(0, endTime - startTime);

        await databases.updateDocument(DB_ID, 'sessions', sessionId, {
            endTime,
            duration
        });

        await updateUserAnalytics(session.userId, {
            lastActive: endTime,
            totalTime: duration,
            sessionCount: 1
        });

    } catch (error) {
        // console.error("Error ending session:", error);
    }
};

export const logUserEvent = async (event: Omit<UserEvent, "$id" | "timestamp">) => {
    if (!isAppwriteConfigured()) return;
    try {
        await databases.createDocument(DB_ID, 'events', ID.unique(), {
            ...event,
            timestamp: Math.floor(Date.now() / 1000)
        });

        const updates: any = { lastActive: Math.floor(Date.now() / 1000) };
        if (event.eventType === 'test_start') {
            updates.testsAttempted = 1;
        }
        // Only update stats for significant events to reduce writes
        if (event.eventType === 'page_visit' || event.eventType === 'test_start') {
            await updateUserAnalytics(event.userId, updates);
        }

    } catch (error) {
        // console.error("Error logging event:", error);
    }
};

const extractNumber = (val: unknown): number => {
    if (typeof val === 'number') return val;
    if (typeof val === 'string') return parseFloat(val) || 0;
    return 0;
}

const calculateEngagement = (totalTime: number, sessions: number): 'High' | 'Medium' | 'Low' => {
    const hours = totalTime / 3600;
    if (hours > 10 || sessions > 50) return 'High';
    if (hours > 2 || sessions > 10) return 'Medium';
    return 'Low';
}

const updateUserAnalytics = async (userId: string, updates: {
    totalTime?: number,
    lastActive?: number,
    sessionCount?: number,
    testsAttempted?: number
}) => {
    try {
        let analyticsDoc: (Models.Document & UserAnalytics) | null = null;
        try {
            const response = await databases.listDocuments(DB_ID, 'user_analytics', [
                Query.equal('userId', userId),
                Query.limit(1)
            ]);
            if (response.documents.length > 0) {
                analyticsDoc = response.documents[0] as unknown as (Models.Document & UserAnalytics);
            }
        } catch (e) {
            // Ignore
        }

        if (analyticsDoc) {
            const currentTotalTime = extractNumber(analyticsDoc.totalTime);
            const currentSessions = extractNumber(analyticsDoc.sessions);
            const currentTests = extractNumber(analyticsDoc.testsAttempted);

            const newTotalTime = currentTotalTime + (updates.totalTime || 0);
            const newSessions = currentSessions + (updates.sessionCount || 0);

            await databases.updateDocument(DB_ID, 'user_analytics', analyticsDoc.$id, {
                totalTime: newTotalTime,
                lastActive: updates.lastActive || analyticsDoc.lastActive,
                sessions: newSessions,
                testsAttempted: currentTests + (updates.testsAttempted || 0),
                engagementLevel: calculateEngagement(newTotalTime, newSessions)
            });
        } else {
            const newTotalTime = updates.totalTime || 0;
            const newSessions = updates.sessionCount || 0;

            await databases.createDocument(DB_ID, 'user_analytics', ID.unique(), {
                userId,
                totalTime: newTotalTime,
                lastActive: updates.lastActive || Math.floor(Date.now() / 1000),
                sessions: newSessions,
                testsAttempted: updates.testsAttempted || 0,
                engagementLevel: calculateEngagement(newTotalTime, newSessions),
                mostUsedFeature: 'General'
            });
        }
    } catch (error) {
        // console.error("Error updating user analytics:", error);
    }
}

export const getAllUserAnalytics = async (): Promise<UserAnalytics[]> => {
    if (!isAppwriteConfigured()) return [];
    try {
        // 1. Fetch all users
        const usersResponse = await databases.listDocuments(DB_ID, 'users', [
            Query.limit(5000)
        ]);
        const users = usersResponse.documents;

        // 2. Fetch all test results
        const resultsResponse = await databases.listDocuments(DB_ID, 'test-results', [
            Query.limit(5000),
            Query.orderDesc('completedAt')
        ]);
        const allResults = resultsResponse.documents;

        // 3. Group test results by userId
        const resultsByUser = new Map<string, any[]>();
        allResults.forEach((doc: any) => {
            const arr = resultsByUser.get(doc.userId) || [];
            arr.push(doc);
            resultsByUser.set(doc.userId, arr);
        });

        // 4. Also try to fetch from user_analytics for any existing tracking data
        let analyticsMap = new Map<string, any>();
        try {
            const analyticsResponse = await databases.listDocuments(DB_ID, 'user_analytics', [
                Query.limit(5000)
            ]);
            analyticsResponse.documents.forEach((doc: any) => {
                analyticsMap.set(doc.userId, doc);
            });
        } catch (e) {
            // user_analytics collection might not exist, that's okay
        }

        // 5. Build analytics for each user
        const analytics: UserAnalytics[] = users.map((user: any) => {
            const userId = user.$id;
            const userResults = resultsByUser.get(userId) || [];
            const existingAnalytics = analyticsMap.get(userId);

            // Test count (deduplicated by testId — count unique tests taken)
            const uniqueTests = new Set(userResults.map((r: any) => r.testId));
            const testsAttempted = uniqueTests.size;

            // Total time spent on tests (sum of timeTaken from all results)
            const totalTime = userResults.reduce((sum: number, r: any) => {
                return sum + extractNumber(r.timeTaken);
            }, 0);

            // Last active: most recent test completedAt, or user creation time
            const lastActive = userResults.length > 0
                ? Math.max(...userResults.map((r: any) => extractNumber(r.completedAt)))
                : extractNumber(user.$createdAt ? Math.floor(new Date(user.$createdAt).getTime() / 1000) : 0);

            // Sessions: each test attempt counts as a session
            const sessions = userResults.length;

            // Engagement level: based on tests and time
            const engagementLevel = calculateEngagement(totalTime, sessions);

            // Most used feature
            const mostUsedFeature = testsAttempted > 0 ? 'Mock Tests' : 'General';

            // Merge with existing analytics data if any (prefer real tracking data)
            const mergedTotalTime = existingAnalytics ? Math.max(extractNumber(existingAnalytics.totalTime), totalTime) : totalTime;
            const mergedSessions = existingAnalytics ? Math.max(extractNumber(existingAnalytics.sessions), sessions) : sessions;
            const mergedLastActive = existingAnalytics ? Math.max(extractNumber(existingAnalytics.lastActive), lastActive) : lastActive;
            const mergedTests = existingAnalytics ? Math.max(extractNumber(existingAnalytics.testsAttempted), testsAttempted) : testsAttempted;

            return {
                userId,
                totalTime: mergedTotalTime,
                lastActive: mergedLastActive,
                mostUsedFeature: existingAnalytics?.mostUsedFeature || mostUsedFeature,
                testsAttempted: mergedTests,
                engagementLevel: calculateEngagement(mergedTotalTime, mergedSessions),
                sessions: mergedSessions,
                // Extra fields for the UI
                email: user.email || '',
                displayName: user.displayName || user.email?.split('@')[0] || 'Unknown',
            } as UserAnalytics;
        });

        // Sort by last active (most recent first), filter out users with no activity
        return analytics
            .filter(a => a.testsAttempted > 0 || a.sessions > 0)
            .sort((a, b) => b.lastActive - a.lastActive);
    } catch (error) {
        console.error("Error fetching all analytics", error);
        return [];
    }
}

export const getActiveUsersCount = async (): Promise<number> => {
    if (!isAppwriteConfigured()) return 0;
    try {
        const oneDayAgo = Math.floor(Date.now() / 1000) - (24 * 60 * 60);
        const response = await databases.listDocuments(DB_ID, 'user_analytics', [
            Query.limit(5000),
            Query.greaterThanEqual('lastActive', oneDayAgo)
        ]);
        return response.total; // Appwrite returns a 'total' property we can use even if we don't need the docs
    } catch (error) {
        console.error("Error fetching active users count", error);
        return 0;
    }
}

// Legacy alias for backward compatibility
export type TestLeaderboardEntry = TestRankEntry;

/**
 * Enhanced Test Ranking Engine
 * - Competition ranking (ties get same rank)
 * - Tie-breaking by time taken (less time = better)
 * - Percentile calculation per-test
 * - Only considers users who attempted this specific test
 */
export const getTestLeaderboard = async (testId: string, currentUserId?: string): Promise<{ leaderboard: TestRankEntry[], userRank: TestRankEntry | null }> => {
    if (!isAppwriteConfigured()) return { leaderboard: [], userRank: null };
    try {
        // 1. Fetch ALL test results for this test
        const resultsResponse = await databases.listDocuments(DB_ID, 'test-results', [
            Query.equal('testId', testId),
            Query.limit(5000)
        ]);

        if (resultsResponse.documents.length === 0) {
            return { leaderboard: [], userRank: null };
        }

        // 2. Get the test info for totalQuestions / maxScore
        let testDoc: any = null;
        try {
            testDoc = await databases.getDocument(DB_ID, 'tests', testId);
        } catch (e) { /* ignore */ }
        const totalQuestionsFromTest = testDoc?.questions
            ? (typeof testDoc.questions === 'string' ? JSON.parse(testDoc.questions) : testDoc.questions).length
            : 0;

        // 3. Deduplicate users - keep BEST score; tie-break by less time
        const userBestResults = new Map<string, any>();
        resultsResponse.documents.forEach((doc: any) => {
            const existing = userBestResults.get(doc.userId);
            if (!existing) {
                userBestResults.set(doc.userId, doc);
            } else {
                // Higher score wins
                if (doc.score > existing.score) {
                    userBestResults.set(doc.userId, doc);
                } else if (doc.score === existing.score) {
                    // Same score → less time wins
                    const docTime = extractNumber(doc.timeTaken);
                    const existingTime = extractNumber(existing.timeTaken);
                    if (docTime > 0 && existingTime > 0 && docTime < existingTime) {
                        userBestResults.set(doc.userId, doc);
                    }
                }
            }
        });

        // 4. Sort: Score DESC, then timeTaken ASC
        let sortedResults = Array.from(userBestResults.values());
        sortedResults.sort((a, b) => {
            if (b.score !== a.score) return b.score - a.score;
            const timeA = extractNumber(a.timeTaken);
            const timeB = extractNumber(b.timeTaken);
            if (timeA > 0 && timeB > 0) return timeA - timeB;
            return 0;
        });

        const totalParticipants = sortedResults.length;

        // 5. Fetch user names
        const userIds = sortedResults.map(r => r.userId);
        const userMap = new Map<string, string>();
        const chunkSize = 50;
        for (let i = 0; i < userIds.length; i += chunkSize) {
            const chunk = userIds.slice(i, i + chunkSize);
            if (chunk.length === 0) continue;
            try {
                const usersResponse = await databases.listDocuments(DB_ID, 'users', [
                    Query.equal('$id', chunk)
                ]);
                usersResponse.documents.forEach((u: any) => {
                    userMap.set(u.$id, u.name || u.displayName || 'Student');
                });
            } catch (e) {
                console.error("Error fetching users batch:", e);
            }
        }

        // 6. Competition ranking + percentile calculation
        const leaderboard: TestRankEntry[] = [];
        let currentRank = 1;

        for (let i = 0; i < sortedResults.length; i++) {
            const doc = sortedResults[i];
            const totalQ = doc.totalQuestions || totalQuestionsFromTest;
            const maxScore = totalQ * 4;

            // Time calculation with fallback
            let timeTaken = extractNumber(doc.timeTaken);
            if (timeTaken <= 0 && doc.questionTimes) {
                try {
                    const qTimes = typeof doc.questionTimes === 'string'
                        ? JSON.parse(doc.questionTimes)
                        : doc.questionTimes;
                    if (qTimes && typeof qTimes === 'object') {
                        timeTaken = Object.values(qTimes).reduce((sum: number, t: any) => sum + (extractNumber(t) || 0), 0);
                    }
                } catch (e) { /* ignore */ }
            }

            // Parse answers and questionTimes
            let answers: Record<string, number> = {};
            let questionTimes: Record<string, number> = {};
            try {
                answers = typeof doc.answers === 'string' ? JSON.parse(doc.answers) : (doc.answers || {});
            } catch (e) { answers = {}; }
            try {
                questionTimes = typeof doc.questionTimes === 'string' ? JSON.parse(doc.questionTimes) : (doc.questionTimes || {});
            } catch (e) { questionTimes = {}; }

            const answeredCount = Object.keys(answers).length;
            // Score = correct*4 - incorrect*1, so: correct = (score + incorrect) / 4 and incorrect = answered - correct
            // But simpler: correct = count where answer matches correctAnswer... we don't have correctAnswers here
            // Approximate from score: if score = correct*4 - (answered - correct)*1 = 5*correct - answered
            // correct = (score + answered) / 5
            const correctCount = Math.max(0, Math.round((doc.score + answeredCount) / 5));
            const incorrectCount = answeredCount - correctCount;
            const unattempted = totalQ - answeredCount;

            // Consecutive ranking: strictly incremental (1, 2, 3...)
            currentRank = i + 1;

            // Percentile: % of students who scored LESS than this user
            const studentsBelow = sortedResults.filter(r => r.score < doc.score).length;
            const percentile = totalParticipants > 1
                ? Math.round((studentsBelow / totalParticipants) * 10000) / 100
                : 100;

            leaderboard.push({
                rank: currentRank,
                userId: doc.userId,
                userName: userMap.get(doc.userId) || 'Unknown User',
                score: doc.score,
                totalMarks: maxScore,
                correctCount,
                incorrectCount,
                unattempted,
                accuracy: answeredCount > 0 ? Math.round((correctCount / answeredCount) * 100) : 0,
                percentile,
                timeTaken,
                isCurrentUser: doc.userId === currentUserId,
                answers: doc.userId === currentUserId ? (answers as any) : undefined,
                questionTimes: doc.userId === currentUserId ? (questionTimes as any) : undefined,
            });
        }

        const userRank = leaderboard.find(e => e.userId === currentUserId) || null;

        return { leaderboard, userRank };

    } catch (error) {
        console.error("Error fetching test leaderboard:", error);
        return { leaderboard: [], userRank: null };
    }
};


/**
 * Get complete test performance summary for a user
 * Used on the post-test result/review page
 */
export const getTestPerformanceSummary = async (testId: string, currentUserId: string): Promise<TestPerformanceSummary | null> => {
    if (!isAppwriteConfigured()) return null;
    try {
        const { leaderboard, userRank } = await getTestLeaderboard(testId, currentUserId);

        if (leaderboard.length === 0) return null;

        // Get test details
        let testTitle = 'Test';
        try {
            const testDoc = await databases.getDocument(DB_ID, 'tests', testId);
            testTitle = testDoc.title || 'Test';
        } catch (e) { /* ignore */ }

        // Compute aggregate stats
        const scores = leaderboard.map(e => e.score);
        const averageScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
        const highestScore = Math.max(...scores);

        return {
            testId,
            testTitle,
            totalScore: userRank?.score || 0,
            maxScore: userRank?.totalMarks || leaderboard[0]?.totalMarks || 0,
            rank: userRank?.rank || 0,
            totalAttemptees: leaderboard.length,
            percentile: userRank?.percentile || 0,
            correctCount: userRank?.correctCount || 0,
            incorrectCount: userRank?.incorrectCount || 0,
            unattemptedCount: userRank?.unattempted || 0,
            accuracy: userRank?.accuracy || 0,
            timeTaken: userRank?.timeTaken || 0,
            averageScore,
            highestScore,
            leaderboard,
            userEntry: userRank,
            answers: userRank?.answers,
            questionTimes: userRank?.questionTimes,
        };
    } catch (error) {
        console.error("Error getting test performance summary:", error);
        return null;
    }
};


// Simple in-memory cache for global stats to improve performance
const globalStatsCache = new Map<string, { analysis: any[], timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Get question-level analysis for a specific test attempt
 * Computes global success rates by analyzing all submissions
 */
export const getQuestionLevelAnalysis = async (testId: string, userAnswers: Record<number, number>, questionTimes?: Record<number, number>): Promise<QuestionAnalysis[]> => {
    if (!isAppwriteConfigured()) return [];
    try {
        // Check cache first
        const cached = globalStatsCache.get(testId);
        let globalCorrectPercents: Record<number, number> = {};

        if (cached && (Date.now() - cached.timestamp < CACHE_TTL)) {
            cached.analysis.forEach(item => {
                globalCorrectPercents[item.questionIndex] = item.globalCorrectPercent;
            });
        } else {
            // Get test data
            const testDoc = await databases.getDocument(DB_ID, 'tests', testId);
            let questions = testDoc.questions;
            try {
                while (typeof questions === 'string') questions = JSON.parse(questions);
            } catch (e) { questions = []; }
            if (!Array.isArray(questions)) questions = [];

            // Fetch results for global stats (limit to 1000 for performance)
            const resultsResponse = await databases.listDocuments(DB_ID, 'test-results', [
                Query.equal('testId', testId),
                Query.limit(1000),
                Query.select(['answers']) // Only fetch what we need
            ]);

            // Calculate per-question success rates
            const questionStats = new Map<number, { correct: number, total: number }>();
            resultsResponse.documents.forEach((doc: any) => {
                let ans: Record<string, number> = {};
                try {
                    ans = typeof doc.answers === 'string' ? JSON.parse(doc.answers) : (doc.answers || {});
                } catch (e) { return; }

                questions.forEach((_: any, qIdx: number) => {
                    const stats = questionStats.get(qIdx) || { correct: 0, total: 0 };
                    if (ans[qIdx.toString()] !== undefined || ans[qIdx] !== undefined) {
                        stats.total++;
                        const userAns = ans[qIdx.toString()] ?? ans[qIdx];
                        if (userAns === questions[qIdx].correctAnswer) {
                            stats.correct++;
                        }
                    }
                    questionStats.set(qIdx, stats);
                });
            });

            // Prepare global percents for cache and final return
            questions.forEach((_: any, idx: number) => {
                const stats = questionStats.get(idx) || { correct: 0, total: 0 };
                globalCorrectPercents[idx] = stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0;
            });

            // Store in cache (simplified analysis)
            const cacheData = questions.map((q: any, idx: number) => ({
                questionIndex: idx,
                globalCorrectPercent: globalCorrectPercents[idx],
                questionText: q.text || '',
                correctAnswer: q.correctAnswer
            }));
            globalStatsCache.set(testId, { analysis: cacheData, timestamp: Date.now() });
        }

        // Fetch test data again for fresh return if not in cache (or just use cached logic)
        const testDoc = await databases.getDocument(DB_ID, 'tests', testId);
        let questions = testDoc.questions;
        try {
            while (typeof questions === 'string') questions = JSON.parse(questions);
        } catch (e) { questions = []; }

        // Build final analysis with user-specific data
        return (questions as any[]).map((q: any, idx: number) => {
            const userAnswer = userAnswers[idx];
            const correctAnswer = q.correctAnswer;
            let status: 'correct' | 'incorrect' | 'skipped' = 'skipped';
            if (userAnswer !== undefined) {
                status = userAnswer === correctAnswer ? 'correct' : 'incorrect';
            }

            return {
                questionIndex: idx,
                questionText: q.text || '',
                userAnswer,
                correctAnswer,
                status,
                timeSpent: questionTimes?.[idx] || 0,
                globalCorrectPercent: globalCorrectPercents[idx] || 0,
            };
        });
    } catch (error) {
        console.error("Error getting question-level analysis:", error);
        return [];
    }
};


/**
 * Admin: Get comprehensive test analytics
 * Includes score distribution, question success rates, drop-off analysis
 */
export const getAdminTestAnalytics = async (testId: string): Promise<AdminTestAnalytics | null> => {
    if (!isAppwriteConfigured()) return null;
    try {
        // Get test info
        const testDoc = await databases.getDocument(DB_ID, 'tests', testId);
        let questions = testDoc.questions;
        try {
            while (typeof questions === 'string') questions = JSON.parse(questions);
        } catch (e) { questions = []; }
        if (!Array.isArray(questions)) questions = [];

        const totalQ = questions.length;

        // Get all results
        const resultsResponse = await databases.listDocuments(DB_ID, 'test-results', [
            Query.equal('testId', testId),
            Query.limit(5000)
        ]);

        const docs = resultsResponse.documents;
        if (docs.length === 0) {
            return {
                testId,
                testTitle: testDoc.title || 'Test',
                totalAttemptees: 0,
                averageScore: 0,
                highestScore: 0,
                lowestScore: 0,
                medianScore: 0,
                averageTimeTaken: 0,
                scoreDistribution: [],
                questionSuccessRates: [],
                dropOffPoints: [],
            };
        }

        // Score stats
        const scores = docs.map((d: any) => d.score || 0).sort((a: number, b: number) => a - b);
        const sum = scores.reduce((a: number, b: number) => a + b, 0);
        const avg = Math.round(sum / scores.length);
        const median = scores.length % 2 === 0
            ? Math.round((scores[scores.length / 2 - 1] + scores[scores.length / 2]) / 2)
            : scores[Math.floor(scores.length / 2)];

        // Time stats
        const times = docs.map((d: any) => {
            let time = extractNumber(d.timeTaken);
            if (time === 0 && d.questionTimes) {
                try {
                    const qTimes = typeof d.questionTimes === 'string' ? JSON.parse(d.questionTimes) : d.questionTimes;
                    time = Object.values(qTimes).reduce((sum: number, t: any) => sum + (extractNumber(t)), 0);
                } catch (e) { /* ignore */ }
            }
            return time;
        }).filter((t: number) => t > 0);
        const avgTime = times.length > 0 ? Math.round(times.reduce((a: number, b: number) => a + b, 0) / times.length) : 0;

        // Score distribution (buckets)
        const maxScore = totalQ * 4;
        const bucketSize = Math.max(1, Math.ceil(maxScore / 8)); // 8 buckets
        const distribution: { range: string; count: number }[] = [];
        for (let i = -totalQ; i <= maxScore; i += bucketSize) {
            const lo = i;
            const hi = Math.min(i + bucketSize - 1, maxScore);
            const count = scores.filter((s: number) => s >= lo && s <= hi).length;
            if (count > 0 || lo >= 0) {
                distribution.push({ range: `${lo} - ${hi}`, count });
            }
        }

        // Question success rates
        const questionSuccessRates: { questionIndex: number; correctPercent: number }[] = [];
        const questionAttemptCount: number[] = new Array(totalQ).fill(0);

        questions.forEach((_: any, qIdx: number) => {
            let correctCount = 0;
            let attemptCount = 0;

            docs.forEach((doc: any) => {
                let ans: Record<string, number> = {};
                try {
                    ans = typeof doc.answers === 'string' ? JSON.parse(doc.answers) : (doc.answers || {});
                } catch (e) { return; }

                const userAns = ans[qIdx.toString()] ?? ans[qIdx];
                if (userAns !== undefined) {
                    attemptCount++;
                    if (userAns === questions[qIdx].correctAnswer) {
                        correctCount++;
                    }
                }
            });

            questionAttemptCount[qIdx] = attemptCount;
            questionSuccessRates.push({
                questionIndex: qIdx,
                correctPercent: attemptCount > 0 ? Math.round((correctCount / attemptCount) * 100) : 0,
            });
        });

        // Drop-off points: questions where significantly fewer students attempted
        const dropOffPoints: { questionIndex: number; dropCount: number }[] = [];
        for (let i = 1; i < totalQ; i++) {
            const drop = questionAttemptCount[i - 1] - questionAttemptCount[i];
            if (drop > 0) {
                dropOffPoints.push({ questionIndex: i, dropCount: drop });
            }
        }
        dropOffPoints.sort((a, b) => b.dropCount - a.dropCount);

        return {
            testId,
            testTitle: testDoc.title || 'Test',
            totalAttemptees: docs.length,
            averageScore: avg,
            highestScore: Math.max(...scores),
            lowestScore: Math.min(...scores),
            medianScore: median,
            averageTimeTaken: avgTime,
            scoreDistribution: distribution,
            questionSuccessRates,
            dropOffPoints: dropOffPoints.slice(0, 10), // Top 10 drop-off points
        };
    } catch (error) {
        console.error("Error getting admin test analytics:", error);
        return null;
    }
};


/**
 * Get all test results for computing admin-level stats across all tests
 */
export const getAllTestResults = async (): Promise<TestResult[]> => {
    if (!isAppwriteConfigured()) return [];
    try {
        const response = await databases.listDocuments(DB_ID, 'test-results', [
            Query.limit(5000),
            Query.orderDesc('completedAt')
        ]);
        return response.documents.map(doc => ({
            id: doc.$id,
            ...doc,
            answers: typeof doc.answers === 'string' ? JSON.parse(doc.answers) : doc.answers,
            questionTimes: typeof doc.questionTimes === 'string' ? JSON.parse(doc.questionTimes) : doc.questionTimes,
            timeTaken: extractNumber(doc.timeTaken),
        })) as unknown as TestResult[];
    } catch (error) {
        console.error("Error fetching all test results:", error);
        return [];
    }
};

// --- Admin: Student Performance for Mentorship ---

export interface StudentPerformanceData {
    userId: string;
    userName: string;
    email: string;
    testsAttempted: number;
    overallScore: number;
    averageAccuracy: number;
    testPerformances: {
        testId: string;
        testTitle: string;
        subject: string;
        score: number;
        maxScore: number;
        rank: number;
        totalAttemptees: number;
        accuracy: number;
        timeTaken: number;
        completedAt: number;
        correctCount: number;
        incorrectCount: number;
        unattempted: number;
    }[];
    sectionWise: {
        section: string;
        totalQuestions: number;
        correctCount: number;
        accuracy: number;
    }[];
    weakSections: string[];
}

export const getAdminStudentPerformance = async (): Promise<StudentPerformanceData[]> => {
    if (!isAppwriteConfigured()) return [];
    try {
        // 1. Fetch all users
        const usersResponse = await databases.listDocuments(DB_ID, 'users', [
            Query.limit(500)
        ]);
        const users = usersResponse.documents;

        // 2. Fetch all test results
        const resultsResponse = await databases.listDocuments(DB_ID, 'test-results', [
            Query.limit(5000),
            Query.orderDesc('completedAt')
        ]);
        const allResults = resultsResponse.documents;

        // 3. Fetch all tests (for titles, subjects, questions)
        const testsResponse = await databases.listDocuments(DB_ID, 'tests', [
            Query.limit(1000)
        ]);
        const testsMap = new Map<string, any>();
        testsResponse.documents.forEach((doc: any) => {
            let questions = doc.questions;
            try {
                while (typeof questions === 'string') questions = JSON.parse(questions);
            } catch (e) { questions = []; }
            if (!Array.isArray(questions)) questions = [];
            testsMap.set(doc.$id, {
                title: doc.title || 'Unknown Test',
                subject: doc.subject || doc.pyqSubject || 'General',
                questions,
            });
        });

        // 4. Group results by testId for ranking
        const resultsByTest = new Map<string, any[]>();
        allResults.forEach((doc: any) => {
            const arr = resultsByTest.get(doc.testId) || [];
            arr.push(doc);
            resultsByTest.set(doc.testId, arr);
        });

        // Pre-compute ranks per test (sorted by score DESC, timeTaken ASC)
        const testRanks = new Map<string, Map<string, { rank: number; total: number }>>();
        resultsByTest.forEach((results, testId) => {
            // Deduplicate: keep best score per user for this test
            const bestPerUser = new Map<string, any>();
            results.forEach(r => {
                const existing = bestPerUser.get(r.userId);
                if (!existing || r.score > existing.score) {
                    bestPerUser.set(r.userId, r);
                } else if (r.score === existing.score) {
                    const t1 = extractNumber(r.timeTaken);
                    const t2 = extractNumber(existing.timeTaken);
                    if (t1 > 0 && t2 > 0 && t1 < t2) bestPerUser.set(r.userId, r);
                }
            });

            const sorted = Array.from(bestPerUser.values()).sort((a, b) => {
                if (b.score !== a.score) return b.score - a.score;
                return extractNumber(a.timeTaken) - extractNumber(b.timeTaken);
            });

            const rankMap = new Map<string, { rank: number; total: number }>();
            let currentRank = 1;
            sorted.forEach((doc, i) => {
                if (i > 0) {
                    const prev = sorted[i - 1];
                    if (doc.score !== prev.score) currentRank = i + 1;
                }
                rankMap.set(doc.userId, { rank: currentRank, total: sorted.length });
            });
            testRanks.set(testId, rankMap);
        });

        // 5. Group results by user
        const resultsByUser = new Map<string, any[]>();
        allResults.forEach((doc: any) => {
            const arr = resultsByUser.get(doc.userId) || [];
            arr.push(doc);
            resultsByUser.set(doc.userId, arr);
        });

        // 6. Build per-user performance data
        const studentPerformances: StudentPerformanceData[] = [];

        users.forEach((user: any) => {
            const userId = user.$id;
            const userResults = resultsByUser.get(userId);
            if (!userResults || userResults.length === 0) return; // Skip users with no tests

            const testPerformances: StudentPerformanceData['testPerformances'] = [];
            const sectionStats = new Map<string, { total: number; correct: number }>();

            const bestAttempts = new Map<string, any>();
            userResults.forEach((r: any) => {
                const existing = bestAttempts.get(r.testId);
                if (!existing || r.score > existing.score) {
                    bestAttempts.set(r.testId, r);
                } else if (r.score === existing.score) {
                    const t1 = extractNumber(r.timeTaken);
                    const t2 = extractNumber(existing.timeTaken);
                    if (t1 > 0 && t2 > 0 && t1 < t2) bestAttempts.set(r.testId, r);
                }
            });

            Array.from(bestAttempts.values()).forEach((result: any) => {
                const testMeta = testsMap.get(result.testId);
                if (!testMeta) return;

                const questions = testMeta.questions;
                const totalQ = questions.length || result.totalQuestions || 0;
                const maxScore = totalQ * 4;

                // Parse answers
                let answers: Record<string, number> = {};
                try {
                    answers = typeof result.answers === 'string' ? JSON.parse(result.answers) : (result.answers || {});
                } catch (e) { answers = {}; }

                const answeredCount = Object.keys(answers).length;
                const correctCount = Math.max(0, Math.round((result.score + answeredCount) / 5));
                const incorrectCount = answeredCount - correctCount;
                const unattempted = totalQ - answeredCount;
                const accuracy = answeredCount > 0 ? Math.round((correctCount / answeredCount) * 100) : 0;

                // Get rank for this test
                const rankInfo = testRanks.get(result.testId)?.get(userId);

                testPerformances.push({
                    testId: result.testId,
                    testTitle: testMeta.title,
                    subject: testMeta.subject,
                    score: result.score || 0,
                    maxScore,
                    rank: rankInfo?.rank || 0,
                    totalAttemptees: rankInfo?.total || 0,
                    accuracy,
                    timeTaken: extractNumber(result.timeTaken),
                    completedAt: result.completedAt || 0,
                    correctCount,
                    incorrectCount,
                    unattempted,
                });

                // Section-wise: use test subject as the section
                const section = testMeta.subject || 'General';
                const existing = sectionStats.get(section) || { total: 0, correct: 0 };
                existing.total += totalQ;
                existing.correct += correctCount;
                sectionStats.set(section, existing);
            });

            // Sort test performances by date (newest first)
            testPerformances.sort((a, b) => b.completedAt - a.completedAt);

            // Build section-wise array
            const sectionWise: StudentPerformanceData['sectionWise'] = [];
            sectionStats.forEach((stats, section) => {
                sectionWise.push({
                    section,
                    totalQuestions: stats.total,
                    correctCount: stats.correct,
                    accuracy: stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0,
                });
            });
            sectionWise.sort((a, b) => a.accuracy - b.accuracy);

            // Identify weak sections (accuracy < 50%)
            const weakSections = sectionWise
                .filter(s => s.accuracy < 50)
                .map(s => s.section);

            // Overall stats
            const overallScore = testPerformances.reduce((sum, t) => sum + t.score, 0);
            const avgAccuracy = testPerformances.length > 0
                ? Math.round(testPerformances.reduce((sum, t) => sum + t.accuracy, 0) / testPerformances.length)
                : 0;

            studentPerformances.push({
                userId,
                userName: user.displayName || user.name || 'Student',
                email: user.email || '',
                testsAttempted: testPerformances.length,
                overallScore,
                averageAccuracy: avgAccuracy,
                testPerformances,
                sectionWise,
                weakSections,
            });
        });

        // Sort: most tests attempted first
        studentPerformances.sort((a, b) => b.testsAttempted - a.testsAttempted);

        return studentPerformances;

    } catch (error) {
        console.error("Error fetching admin student performance:", error);
        return [];
    }
};

// --- Streak & Daily Goal ---

export const getDailyProgress = async (userId: string): Promise<{ streak: number; lastActiveDate: string; dailyGoal: string; dailyProgress: number; dailyGoalTarget: number }> => {
    let appwriteResult = { streak: 0, lastActiveDate: '', dailyGoal: 'Solve 5 Questions', dailyProgress: 0, dailyGoalTarget: 5 };

    // Try Appwrite
    if (isAppwriteConfigured()) {
        try {
            const user = await getUserProfile(userId);
            if (user) {
                appwriteResult = {
                    streak: user.streak || 0,
                    lastActiveDate: user.lastActiveDate || '',
                    dailyGoal: user.dailyGoal || 'Solve 5 Questions',
                    dailyProgress: user.dailyProgress || 0,
                    dailyGoalTarget: user.dailyGoalTarget || 5
                };
            }
        } catch (error) {
            console.error("Error fetching daily progress (Appwrite):", error);
        }
    }

    // Check LocalStorage for fresher data (Optimistic UI)
    if (typeof window !== 'undefined') {
        try {
            const stored = localStorage.getItem(`streak_${userId}`);
            if (stored) {
                const parsed = JSON.parse(stored);
                // Simple merge: prefer LS if date matches today or is more recent
                const today = new Date().toISOString().split('T')[0];
                if (parsed.lastActiveDate === today || (appwriteResult.lastActiveDate && parsed.lastActiveDate > appwriteResult.lastActiveDate)) {
                    // Check if LS data seems more "advanced" (higher progress)?
                    // For now, let's prioritize LS for streak/progress since update might have failed on backend.
                    return {
                        ...appwriteResult,
                        streak: parsed.streak || appwriteResult.streak,
                        lastActiveDate: parsed.lastActiveDate || appwriteResult.lastActiveDate,
                        dailyProgress: parsed.dailyProgress || appwriteResult.dailyProgress
                    };
                }
            }
        } catch (err) { /* ignore */ }
    }

    return appwriteResult;
};

export const updateStreakAndDaily = async (userId: string, progressIncrement: number = 0) => {
    if (!isAppwriteConfigured()) return;
    try {
        const user = await getUserProfile(userId);
        if (!user) return;

        const today = new Date().toISOString().split('T')[0];
        const lastActive = user.lastActiveDate;

        let streak = user.streak || 0;
        let dailyProgress = user.dailyProgress || 0;

        // If logic runs on a new day
        if (lastActive !== today) {
            dailyProgress = 0; // Reset progress

            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const yesterdayStr = yesterday.toISOString().split('T')[0];

            if (lastActive === yesterdayStr) {
                streak += 1;
            } else {
                streak = 1; // Reset or start new
            }
        }

        dailyProgress += progressIncrement;

        // Always update LocalStorage (Optimistic / Fallback)
        if (typeof window !== 'undefined') {
            try {
                localStorage.setItem(`streak_${userId}`, JSON.stringify({ streak, lastActiveDate: today, dailyProgress }));
            } catch (err) { /* ignore */ }
        }

        // Try to update backend (might fail if schema/permissions are missing)
        try {
            await updateUser(userId, {
                streak,
                lastActiveDate: today,
                dailyProgress
            });
        } catch (dbError) {
            console.error("Backend streak update failed (Schema/permissions issue?):", dbError);
            // We suppress the error because LS update succeeded, so user sees progress.
        }

        return { streak, dailyProgress };
    } catch (error) {
        console.error("Error calculating streak/daily:", error);
    }
};

export const setUserDailyGoal = async (userId: string, target: number, goalText: string) => {
    if (!isAppwriteConfigured()) return;
    try {
        await updateUser(userId, {
            dailyGoal: goalText,
            dailyGoalTarget: target
        });
    } catch (error) {
        console.error("Error setting daily goal:", error);
    }
};

// --- Discussion Forum ---

export const getForumPosts = async (category?: ForumCategory): Promise<ForumPost[]> => {
    if (!isAppwriteConfigured()) return [];
    try {
        const queries: string[] = [Query.orderDesc('createdAt'), Query.limit(50)];
        if (category) queries.push(Query.equal('category', category));
        const response = await databases.listDocuments(DB_ID, 'forum_posts', queries);
        return response.documents.map(doc => ({
            id: doc.$id, ...doc,
        })) as unknown as ForumPost[];
    } catch (error) { console.error("Error fetching forum posts:", error); return []; }
};

export const getForumPostById = async (id: string): Promise<ForumPost | null> => {
    if (!isAppwriteConfigured()) return null;
    try {
        const doc = await databases.getDocument(DB_ID, 'forum_posts', id);
        return { id: doc.$id, ...doc } as unknown as ForumPost;
    } catch (error) { console.error("Error fetching forum post:", error); return null; }
};

export const createForumPost = async (post: Omit<ForumPost, 'id' | 'createdAt' | 'upvotes' | 'views'>): Promise<string | null> => {
    if (!isAppwriteConfigured()) return null;
    try {
        const response = await databases.createDocument(DB_ID, 'forum_posts', ID.unique(), {
            userId: post.userId, authorName: post.authorName,
            title: post.title, content: post.content, category: post.category,
            upvotes: 0, views: 0, createdAt: Math.floor(Date.now() / 1000),
        });
        return response.$id;
    } catch (error) { console.error("Error creating forum post:", error); throw error; }
};

export const deleteForumPost = async (postId: string): Promise<boolean> => {
    try { await databases.deleteDocument(DB_ID, 'forum_posts', postId); return true; }
    catch (error) { console.error("Error deleting forum post:", error); return false; }
};

export const upvoteForumPost = async (postId: string): Promise<number> => {
    try {
        const doc = await databases.getDocument(DB_ID, 'forum_posts', postId);
        const newUpvotes = (Number(doc.upvotes) || 0) + 1;
        await databases.updateDocument(DB_ID, 'forum_posts', postId, { upvotes: newUpvotes });
        return newUpvotes;
    } catch (error) { console.error("Error upvoting forum post:", error); return 0; }
};

export const getForumComments = async (postId: string): Promise<ForumComment[]> => {
    if (!isAppwriteConfigured()) return [];
    try {
        const response = await databases.listDocuments(DB_ID, 'forum_comments', [
            Query.equal('postId', postId), Query.orderAsc('createdAt'), Query.limit(100)
        ]);
        return response.documents.map(doc => ({
            id: doc.$id, ...doc,
        })) as unknown as ForumComment[];
    } catch (error) { console.error("Error fetching forum comments:", error); return []; }
};

export const createForumComment = async (comment: Omit<ForumComment, 'id' | 'createdAt'>): Promise<string | null> => {
    if (!isAppwriteConfigured()) return null;
    try {
        const response = await databases.createDocument(DB_ID, 'forum_comments', ID.unique(), {
            postId: comment.postId, userId: comment.userId, authorName: comment.authorName,
            content: comment.content, createdAt: Math.floor(Date.now() / 1000),
        });
        return response.$id;
    } catch (error) { console.error("Error creating forum comment:", error); return null; }
};

