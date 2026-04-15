import pb, { isPocketBaseConfigured } from "./pocketbase";
import { Test, Book, FormulaCard, Notification, PYQ, SiteSettings, UserProfile, TestResult, VideoClass, Educator, VideoProgress, Purchase, Payment, EducatorVideo, EducatorStats, UserEvent, UserAnalytics, TestRankEntry, TestPerformanceSummary, QuestionAnalysis, AdminTestAnalytics, ForumPost, ForumComment, ForumCategory, CarouselBanner } from "@/types";
import { cachedFetch, invalidateCache, invalidateCacheByPrefix, CacheKeys, CACHE_TTL } from "./pocketbase-cache";

// ═══════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════

const extractNumber = (val: unknown): number => {
    if (typeof val === 'number') return val;
    if (typeof val === 'string') return parseFloat(val) || 0;
    return 0;
};

const calculateEngagement = (totalTime: number, sessions: number): 'High' | 'Medium' | 'Low' => {
    const hours = totalTime / 3600;
    if (hours > 10 || sessions > 50) return 'High';
    if (hours > 2 || sessions > 10) return 'Medium';
    return 'Low';
};

/** Parse packed result data from answers field (preserves Appwrite-era data packing) */
const parsePackedResult = (doc: any) => {
    let answers: Record<string, any> = {};
    let questionTimes: Record<string, number> = {};
    let timeTaken = extractNumber(doc.timeTaken);

    try {
        const rawAnswers = typeof doc.answers === 'string' ? JSON.parse(doc.answers) : (doc.answers || {});
        if (rawAnswers && rawAnswers._isPacked) {
            answers = rawAnswers.answers || {};
            questionTimes = rawAnswers.questionTimes || {};
            if (timeTaken <= 0 && rawAnswers.timeTaken) {
                timeTaken = extractNumber(rawAnswers.timeTaken);
            }
        } else {
            answers = rawAnswers;
            try {
                questionTimes = typeof doc.questionTimes === 'string' ? JSON.parse(doc.questionTimes) : (doc.questionTimes || {});
            } catch (e) { questionTimes = {}; }
        }
    } catch (e) {
        answers = {};
    }

    if (timeTaken <= 0 && Object.keys(questionTimes).length > 0) {
        timeTaken = Object.values(questionTimes).reduce((sum: number, t: any) => sum + (extractNumber(t) || 0), 0);
    }

    return { answers, questionTimes, timeTaken };
};

/** Safely parse JSON that might be double-stringified */
const safeParseJSON = (val: any): any => {
    if (typeof val !== 'string') return val;
    try {
        let parsed = val;
        while (typeof parsed === 'string') {
            parsed = JSON.parse(parsed);
        }
        return parsed;
    } catch (e) {
        return val;
    }
};

// ═══════════════════════════════════════════════════════════════
// CAROUSEL BANNERS
// ═══════════════════════════════════════════════════════════════

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

// ═══════════════════════════════════════════════════════════════
// TESTS
// ═══════════════════════════════════════════════════════════════

export const getTests = async (): Promise<Test[]> => {
    if (!isPocketBaseConfigured()) return [];
    return cachedFetch(CacheKeys.tests(), async () => {
        try {
            const records = await pb.collection('tests').getFullList({
                sort: '-createdAt',
            });
            return records.map(doc => {
                let questions = safeParseJSON(doc.questions);
                let subjectAllocations = safeParseJSON(doc.subjectAllocations);
                return {
                    id: doc.id,
                    ...doc,
                    questions: Array.isArray(questions) ? questions : [],
                    subjectAllocations: Array.isArray(subjectAllocations) ? subjectAllocations : doc.isFullSyllabus ? subjectAllocations : undefined
                };
            }) as unknown as Test[];
        } catch (error) {
            console.error("Error fetching tests:", error);
            return [];
        }
    }, CACHE_TTL.STATIC);
};

export const getTestById = async (id: string): Promise<Test | null> => {
    if (!isPocketBaseConfigured()) return null;
    try {
        const doc = await pb.collection('tests').getOne(id);
        let questions = safeParseJSON(doc.questions);
        let subjectAllocations = safeParseJSON(doc.subjectAllocations);
        return {
            id: doc.id,
            ...doc,
            questions: Array.isArray(questions) ? questions : [],
            subjectAllocations: Array.isArray(subjectAllocations) ? subjectAllocations : doc.isFullSyllabus ? subjectAllocations : undefined
        } as unknown as Test;
    } catch (error) {
        console.error("Error fetching test:", error);
        return null;
    }
};

export const createTest = async (test: Omit<Test, "id">): Promise<{ id?: string, error?: string }> => {
    if (!isPocketBaseConfigured()) return { error: "PocketBase not configured" };
    try {
        const docData: any = {
            title: test.title,
            subject: test.subject || "General",
            duration: test.duration || 60,
            questions: JSON.stringify(test.questions),
            createdAt: Math.floor(Date.now() / 1000),
            createdBy: test.createdBy || "admin",
            isVisible: test.isVisible !== undefined ? test.isVisible : true,
        };

        if (test.status) docData.status = test.status;
        if (test.testType) docData.testType = test.testType;
        if (test.pyqSubject) docData.pyqSubject = test.pyqSubject;
        if (test.price !== undefined) docData.price = test.price;
        if (test.series) docData.series = test.series;
        if (test.isFullSyllabus !== undefined) docData.isFullSyllabus = test.isFullSyllabus;
        if (test.maxSubjectChoices !== undefined) docData.maxSubjectChoices = test.maxSubjectChoices;
        if (test.subjectAllocations) docData.subjectAllocations = JSON.stringify(test.subjectAllocations);

        const response = await pb.collection('tests').create(docData);
        invalidateCache(CacheKeys.tests());
        return { id: response.id };
    } catch (error: any) {
        console.error("Error in createTest:", error);
        return { error: error.message || "Unknown error in createTest" };
    }
};

export const deleteTest = async (testId: string): Promise<boolean> => {
    try {
        await pb.collection('tests').delete(testId);
        invalidateCache(CacheKeys.tests());
        return true;
    } catch (error) {
        console.error("Error deleting test:", error);
        return false;
    }
};

export const updateTest = async (testId: string, data: Partial<Test>): Promise<boolean> => {
    try {
        const { id, ...updateData } = data;
        // Stringify JSON fields if present
        const pbData: any = { ...updateData };
        if (pbData.questions && typeof pbData.questions !== 'string') {
            pbData.questions = JSON.stringify(pbData.questions);
        }
        if (pbData.subjectAllocations && typeof pbData.subjectAllocations !== 'string') {
            pbData.subjectAllocations = JSON.stringify(pbData.subjectAllocations);
        }
        await pb.collection('tests').update(testId, pbData);
        invalidateCache(CacheKeys.tests());
        return true;
    } catch (error) {
        console.error("Error updating test:", error);
        return false;
    }
};

// ═══════════════════════════════════════════════════════════════
// TEST RESULTS
// ═══════════════════════════════════════════════════════════════

export const saveTestResult = async (result: Partial<TestResult> & { correctCount?: number, incorrectCount?: number }) => {
    try {
        const { correctCount, incorrectCount, ...dataToSave } = result;

        // Pack analytics into answers field (preserving legacy compatibility)
        const packedAnswers = JSON.stringify({
            _isPacked: true,
            answers: dataToSave.answers,
            questionTimes: dataToSave.questionTimes,
            timeTaken: dataToSave.timeTaken
        });

        const docData: any = {
            userId: dataToSave.userId,
            testId: dataToSave.testId,
            score: dataToSave.score,
            totalQuestions: dataToSave.totalQuestions,
            answers: packedAnswers,
            completedAt: dataToSave.completedAt,
        };

        if (dataToSave.timeTaken !== undefined) {
            docData.timeTaken = dataToSave.timeTaken;
        }
        if (dataToSave.questionTimes) {
            docData.questionTimes = JSON.stringify(dataToSave.questionTimes);
        }

        await pb.collection('test_results').create(docData);

        // Update Daily Streak & Progress
        if (dataToSave.userId) {
            const questionsAttempted = dataToSave.totalQuestions || 0;
            await updateStreakAndDaily(dataToSave.userId, questionsAttempted);

            invalidateCache(CacheKeys.userTestResults(dataToSave.userId));
            invalidateCache(CacheKeys.leaderboardSummary(dataToSave.userId));
            invalidateCache(CacheKeys.leaderboard());
            invalidateCache(CacheKeys.dailyProgress(dataToSave.userId));
        }
    } catch (error) {
        console.error("Error saving test result:", error);
        throw error;
    }
};

export const getUserTestResults = async (userId: string): Promise<TestResult[]> => {
    if (!isPocketBaseConfigured()) return [];
    return cachedFetch(CacheKeys.userTestResults(userId), async () => {
        try {
            const records = await pb.collection('test_results').getFullList({
                filter: `userId = '${userId}'`,
                sort: '-completedAt',
            });
            const results = records.map(doc => {
                const { answers, questionTimes, timeTaken } = parsePackedResult(doc);
                return {
                    id: doc.id,
                    ...doc,
                    answers,
                    questionTimes,
                    timeTaken
                };
            }) as unknown as TestResult[];

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
    }, CACHE_TTL.USER);
};

// ═══════════════════════════════════════════════════════════════
// LEADERBOARD
// ═══════════════════════════════════════════════════════════════

export const getLeaderboard = async (limit: number = 10): Promise<UserProfile[]> => {
    if (!isPocketBaseConfigured()) return [];
    return cachedFetch(CacheKeys.leaderboard(), async () => {
        try {
            const usersRecords = await pb.collection('users').getFullList({ batch: 100 });
            const users = usersRecords.map(doc => ({ uid: doc.id, ...doc })) as unknown as UserProfile[];

            const resultsRecords = await pb.collection('test_results').getFullList({
                fields: 'userId,score',
                batch: 200,
            });

            const userStats = new Map<string, { totalScore: number, testsAttempted: number }>();
            resultsRecords.forEach((doc: any) => {
                const uid = doc.userId;
                const current = userStats.get(uid) || { totalScore: 0, testsAttempted: 0 };
                userStats.set(uid, {
                    totalScore: current.totalScore + (Number(doc.score) || 0),
                    testsAttempted: current.testsAttempted + 1
                });
            });

            const leaderboard = users.map(user => {
                const stats = userStats.get(user.uid) || { totalScore: 0, testsAttempted: 0 };
                return { ...user, totalScore: stats.totalScore, testsAttempted: stats.testsAttempted };
            });

            leaderboard.sort((a, b) => (b.totalScore || 0) - (a.totalScore || 0));
            return leaderboard.slice(0, limit);
        } catch (error) {
            console.error("Error fetching leaderboard:", error);
            return [];
        }
    }, CACHE_TTL.AGGREGATE);
};

/**
 * Get leaderboard summary for privacy-focused display.
 * Returns only the top performer (public) and current user's standing (private).
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
    if (!isPocketBaseConfigured()) {
        return { topPerformer: null, userStanding: null, totalParticipants: 0 };
    }

    return cachedFetch(CacheKeys.leaderboardSummary(currentUserId), async () => {
        try {
            const usersRecords = await pb.collection('users').getFullList({ batch: 100 });
            const users = usersRecords.map(doc => ({ uid: doc.id, ...doc })) as unknown as UserProfile[];

            const resultsRecords = await pb.collection('test_results').getFullList({
                fields: 'userId,score,testId,created',
                batch: 200,
            });

            const testsRecords = await pb.collection('tests').getFullList({
                fields: 'id,title,testType',
                batch: 200,
            });

            const testMetadata = new Map<string, { title: string, type: 'pyq' | 'educator' | undefined }>();
            testsRecords.forEach((doc: any) => {
                testMetadata.set(doc.id, { title: doc.title, type: doc.testType });
            });

            interface UserStats {
                totalScore: number;
                testsAttempted: number;
                mockTests: { testId: string; title: string; score: number; obtainedAt: number }[];
                pyqTotalScore: number;
                pyqAttempts: number;
            }

            const userStats = new Map<string, UserStats>();

            resultsRecords.forEach((doc: any) => {
                const uid = doc.userId;
                const score = Number(doc.score) || 0;
                const testId = doc.testId;
                const createdAt = new Date(doc.created).getTime();

                const meta = testMetadata.get(testId);
                const isPyq = meta?.type === 'pyq';
                const testTitle = meta?.title || 'Unknown Test';

                const current = userStats.get(uid) || {
                    totalScore: 0, testsAttempted: 0,
                    mockTests: [], pyqTotalScore: 0, pyqAttempts: 0
                };

                current.totalScore += score;
                current.testsAttempted += 1;

                if (isPyq) {
                    current.pyqTotalScore += score;
                    current.pyqAttempts += 1;
                } else {
                    current.mockTests.push({ testId, title: testTitle, score, obtainedAt: createdAt });
                }

                userStats.set(uid, current);
            });

            const leaderboard = users
                .map(user => {
                    const stats = userStats.get(user.uid);
                    if (!stats || stats.testsAttempted === 0) return null;
                    stats.mockTests.sort((a, b) => b.obtainedAt - a.obtainedAt);
                    return {
                        ...user,
                        totalScore: stats.totalScore,
                        testsAttempted: stats.testsAttempted,
                        mockTestPerformances: stats.mockTests,
                        pyqPerformance: { totalScore: stats.pyqTotalScore, testsAttempted: stats.pyqAttempts }
                    };
                })
                .filter(Boolean) as any[];

            leaderboard.sort((a: any, b: any) => (b.totalScore || 0) - (a.totalScore || 0));

            const totalParticipants = leaderboard.length;
            const topPerformer = leaderboard.length > 0 ? { ...leaderboard[0], rank: 1 } : null;

            let userStanding = null;
            const userIndex = leaderboard.findIndex((u: any) => u.uid === currentUserId);

            if (userIndex !== -1) {
                const userProfile = leaderboard[userIndex];
                const rank = userIndex + 1;
                const usersWithLowerScore = leaderboard.filter((u: any) => (u.totalScore || 0) < (userProfile.totalScore || 0)).length;
                let aheadOfPercent = 0;
                if (totalParticipants > 1) {
                    aheadOfPercent = Math.floor((usersWithLowerScore / (totalParticipants - 1)) * 100);
                }

                userStanding = {
                    rank,
                    totalScore: userProfile.totalScore || 0,
                    testsAttempted: userProfile.testsAttempted || 0,
                    percentile: 100 - aheadOfPercent,
                    aheadOfPercent,
                    totalParticipants,
                    mockTestPerformances: userProfile.mockTestPerformances,
                    pyqPerformance: userProfile.pyqPerformance
                };
            }

            return { topPerformer, userStanding, totalParticipants };
        } catch (error) {
            console.error("Error fetching leaderboard summary:", error);
            return { topPerformer: null, userStanding: null, totalParticipants: 0 };
        }
    }, CACHE_TTL.AGGREGATE);
};

// ═══════════════════════════════════════════════════════════════
// PLANNER / DYNAMIC TASK
// ═══════════════════════════════════════════════════════════════

export interface PlannerTask {
    title: string;
    subtitle: string;
    actionText: string;
    actionUrl: string;
    progress: number;
}

export const getDynamicPlannerTask = async (userId: string, completedTasks: string[] = [], preFetchedResults?: TestResult[]): Promise<PlannerTask> => {
    try {
        const results = preFetchedResults || await getUserTestResults(userId);

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
        const maxScore = latestResult.totalQuestions ? latestResult.totalQuestions * 4 : 400;
        const percentage = maxScore > 0 ? (latestResult.score / maxScore) * 100 : 0;

        const daily = await getDailyProgress(userId);
        let dailyPercent = 0;
        if (daily && daily.dailyGoalTarget > 0) {
            dailyPercent = Math.min(Math.round((daily.dailyProgress / daily.dailyGoalTarget) * 100), 100);
        }

        if (percentage < 40 && !completedTasks.includes("Review Foundational Concepts")) {
            return { title: "Review Foundational Concepts", subtitle: `Scored ${Math.round(percentage)}% recently - Need revision!`, actionText: "Mark as Done", actionUrl: "/learning", progress: dailyPercent };
        } else if ((percentage < 75 || completedTasks.includes("Review Foundational Concepts")) && !completedTasks.includes("Practice Weak Sections")) {
            return { title: "Practice Weak Sections", subtitle: "Solidify your understanding", actionText: "Explore PYQs", actionUrl: "/dashboard/tests", progress: dailyPercent };
        } else {
            return { title: "Attempt Advanced Full Mock", subtitle: `Great score! (${Math.round(percentage)}%) Keep pushing.`, actionText: "Take Challenge", actionUrl: "/dashboard/tests", progress: dailyPercent };
        }
    } catch (error) {
        console.error("Error generating dynamic task:", error);
        return { title: "Continue Daily Practice", subtitle: "Keep your streak going", actionText: "Practice Now", actionUrl: "/dashboard/tests", progress: 0 };
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

    if (isPocketBaseConfigured()) {
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

// ═══════════════════════════════════════════════════════════════
// BOOKS / NOTES
// ═══════════════════════════════════════════════════════════════

export const getBooks = async (): Promise<Book[]> => {
    if (!isPocketBaseConfigured()) return [];
    return cachedFetch(CacheKeys.books(), async () => {
        try {
            const records = await pb.collection('books').getFullList({ sort: '-createdAt' });
            return records.map(doc => ({ id: doc.id, ...doc })) as unknown as Book[];
        } catch (error) {
            console.error("Error fetching books:", error);
            return [];
        }
    }, CACHE_TTL.STATIC);
};

export const createBook = async (book: Omit<Book, "id">) => {
    try {
        await pb.collection('books').create(book);
        invalidateCache(CacheKeys.books());
    } catch (error) {
        console.error("Error creating book:", error);
        throw error;
    }
};

export const deleteBook = async (id: string) => {
    try {
        await pb.collection('books').delete(id);
        invalidateCache(CacheKeys.books());
    } catch (error) {
        console.error("Error deleting book:", error);
        throw error;
    }
};

export const updateBook = async (id: string, data: Partial<Book>) => {
    try {
        await pb.collection('books').update(id, data);
        invalidateCache(CacheKeys.books());
    } catch (error) {
        console.error("Error updating book:", error);
        throw error;
    }
};

// ═══════════════════════════════════════════════════════════════
// FORMULA CARDS
// ═══════════════════════════════════════════════════════════════

export const getFormulaCards = async (): Promise<FormulaCard[]> => {
    if (!isPocketBaseConfigured()) return [];
    return cachedFetch(CacheKeys.formulaCards(), async () => {
        try {
            const records = await pb.collection('formula_cards').getFullList({ sort: '-createdAt' });
            return records.map(doc => ({ id: doc.id, ...doc })) as unknown as FormulaCard[];
        } catch (error) {
            console.error("Error fetching formula cards:", error);
            return [];
        }
    }, CACHE_TTL.STATIC);
};

export const createFormulaCard = async (card: Omit<FormulaCard, "id">) => {
    try {
        await pb.collection('formula_cards').create(card);
        invalidateCache(CacheKeys.formulaCards());
    } catch (error) {
        console.error("Error creating formula card:", error);
        throw error;
    }
};

export const deleteFormulaCard = async (id: string) => {
    try {
        await pb.collection('formula_cards').delete(id);
        invalidateCache(CacheKeys.formulaCards());
    } catch (error) {
        console.error("Error deleting formula card:", error);
        throw error;
    }
};

export const updateFormulaCard = async (id: string, data: Partial<FormulaCard>) => {
    try {
        await pb.collection('formula_cards').update(id, data);
        invalidateCache(CacheKeys.formulaCards());
    } catch (error) {
        console.error("Error updating formula card:", error);
        throw error;
    }
};

// ═══════════════════════════════════════════════════════════════
// PYQs
// ═══════════════════════════════════════════════════════════════

export const getPYQs = async (): Promise<PYQ[]> => {
    if (!isPocketBaseConfigured()) return [];
    return cachedFetch('pyqs_list', async () => {
        try {
            const records = await pb.collection('pyqs').getFullList({ sort: '-year' });
            return records.map(doc => ({ id: doc.id, ...doc })) as unknown as PYQ[];
        } catch (error) {
            console.error("Error fetching PYQs:", error);
            return [];
        }
    }, CACHE_TTL.STATIC);
};

export const createPYQ = async (pyq: Omit<PYQ, "id">) => {
    try {
        await pb.collection('pyqs').create(pyq);
    } catch (error) {
        console.error("Error creating PYQ:", error);
        throw error;
    }
};

export const deletePYQ = async (id: string) => {
    try {
        await pb.collection('pyqs').delete(id);
    } catch (error) {
        console.error("Error deleting PYQ:", error);
        throw error;
    }
};

// ═══════════════════════════════════════════════════════════════
// USERS
// ═══════════════════════════════════════════════════════════════

export const getUsers = async (): Promise<UserProfile[]> => {
    if (!isPocketBaseConfigured()) return [];
    return cachedFetch('users_list', async () => {
        try {
            const records = await pb.collection('users').getFullList({ sort: '-created', batch: 200 });
            return records.map(doc => ({ uid: doc.id, ...doc })) as unknown as UserProfile[];
        } catch (error) {
            console.error("Error fetching users:", error);
            return [];
        }
    }, CACHE_TTL.USER);
};

export const updateUser = async (uid: string, data: Partial<UserProfile>): Promise<{ success: boolean; error?: string }> => {
    if (!isPocketBaseConfigured()) return { success: false, error: "PocketBase not configured" };
    try {
        await pb.collection('users').update(uid, data);
        return { success: true };
    } catch (error: any) {
        console.error("Error in updateUser:", error);
        return { success: false, error: error.message || "Unknown error" };
    }
};

// ═══════════════════════════════════════════════════════════════
// NOTIFICATIONS
// ═══════════════════════════════════════════════════════════════

export const getNotifications = async (): Promise<Notification[]> => {
    if (!isPocketBaseConfigured()) return [];
    return cachedFetch(CacheKeys.notifications(), async () => {
        try {
            const records = await pb.collection('notifications').getFullList({ sort: '-createdAt' });
            return records.map(doc => ({ id: doc.id, ...doc })) as unknown as Notification[];
        } catch (error) {
            console.error("Error fetching notifications:", error);
            return [];
        }
    }, CACHE_TTL.SOCIAL);
};

export const createNotification = async (notification: Omit<Notification, "id">) => {
    try {
        await pb.collection('notifications').create(notification);
    } catch (error) {
        console.error("Error creating notification:", error);
        throw error;
    }
};

// ═══════════════════════════════════════════════════════════════
// SETTINGS
// ═══════════════════════════════════════════════════════════════

export const getSettings = async (): Promise<SiteSettings | null> => {
    if (!isPocketBaseConfigured()) return null;
    try {
        const doc = await pb.collection('settings').getOne('global');
        return doc as unknown as SiteSettings;
    } catch (error) {
        return null;
    }
};

export const saveSettings = async (settings: SiteSettings) => {
    try {
        try {
            await pb.collection('settings').update('global', settings as any);
        } catch (e) {
            await pb.collection('settings').create({ id: 'global', ...settings } as any);
        }
    } catch (error) {
        console.error("Error saving settings:", error);
        throw error;
    }
};

// ═══════════════════════════════════════════════════════════════
// VIDEO CLASSES
// ═══════════════════════════════════════════════════════════════

export const getVideoClasses = async (): Promise<VideoClass[]> => {
    if (!isPocketBaseConfigured()) return [];
    return cachedFetch(CacheKeys.videoClasses(), async () => {
        try {
            const records = await pb.collection('videos').getFullList({ sort: '-createdAt' });
            return records.map(doc => ({ id: doc.id, ...doc })) as unknown as VideoClass[];
        } catch (error) {
            console.error("Error fetching video classes:", error);
            return [];
        }
    }, CACHE_TTL.STATIC);
};

export const createVideoClass = async (video: Omit<VideoClass, "id">) => {
    try {
        await pb.collection('videos').create({
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
        await pb.collection('videos').delete(videoId);
    } catch (error) {
        console.error("Error deleting video class:", error);
        throw error;
    }
};

// ═══════════════════════════════════════════════════════════════
// EDUCATORS
// ═══════════════════════════════════════════════════════════════

export const getEducator = async (id: string): Promise<Educator | null> => {
    if (!isPocketBaseConfigured()) return null;
    try {
        const doc = await pb.collection('educators').getOne(id);
        return { id: doc.id, ...doc } as unknown as Educator;
    } catch (error) {
        console.error("Error fetching educator:", error);
        return null;
    }
};

export const getAllEducators = async (): Promise<Educator[]> => {
    if (!isPocketBaseConfigured()) return [];
    try {
        const records = await pb.collection('educators').getFullList({ sort: 'name' });
        return records.map(doc => ({ id: doc.id, ...doc })) as unknown as Educator[];
    } catch (error: any) {
        if (error?.status === 404) {
            console.warn("Educators collection missing. Please create it in PocketBase.");
            return [];
        }
        console.error("Error fetching all educators:", error);
        return [];
    }
};

// ═══════════════════════════════════════════════════════════════
// ANALYTICS / SESSIONS
// ═══════════════════════════════════════════════════════════════

export const createUserSession = async (userId: string, deviceInfo?: string): Promise<string | null> => {
    if (!isPocketBaseConfigured()) return null;
    try {
        const response = await pb.collection('sessions').create({
            userId,
            startTime: Math.floor(Date.now() / 1000),
            deviceInfo: deviceInfo || 'unknown'
        });
        return response.id;
    } catch (error) {
        return null;
    }
};

export const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
    if (!isPocketBaseConfigured()) return null;
    return cachedFetch(CacheKeys.userProfile(userId), async () => {
        try {
            // Try user_profiles first (preferred), then fallback to users
            try {
                const doc = await pb.collection('user_profiles').getOne(userId);
                return { uid: doc.id, ...doc } as unknown as UserProfile;
            } catch (e) {
                const doc = await pb.collection('users').getOne(userId);
                return { uid: doc.id, ...doc } as unknown as UserProfile;
            }
        } catch (error) {
            console.error("Error fetching user profile:", error);
            return null;
        }
    }, CACHE_TTL.USER);
};

export const getVideoProgress = async (studentId: string, educatorId: string): Promise<VideoProgress[]> => {
    if (!isPocketBaseConfigured()) return [];
    try {
        const records = await pb.collection('video_progress').getFullList({
            filter: `studentId = '${studentId}' && educatorId = '${educatorId}'`,
        });
        return records.map(doc => ({ ...doc })) as unknown as VideoProgress[];
    } catch (error) {
        console.error("Error fetching video progress:", error);
        return [];
    }
};

export const updateVideoProgress = async (studentId: string, educatorId: string, videoId: string, watched: boolean) => {
    if (!isPocketBaseConfigured()) return;
    try {
        const records = await pb.collection('video_progress').getFullList({
            filter: `studentId = '${studentId}' && educatorId = '${educatorId}' && videoId = '${videoId}'`,
        });

        const data = {
            studentId, educatorId, videoId, watched,
            updatedAt: new Date().toISOString()
        } as any;

        if (records.length > 0) {
            await pb.collection('video_progress').update(records[0].id, data);
        } else {
            await pb.collection('video_progress').create(data);
        }
    } catch (error) {
        console.error("Error updating video progress:", error);
        throw error;
    }
};

export const getFileViewUrl = (bucketId: string, fileId: string) => {
    // In PocketBase, files are attached to records. This is a compatibility shim.
    // You'll need to adapt file access to use pb.files.getUrl(record, filename) instead.
    return `${process.env.NEXT_PUBLIC_POCKETBASE_URL}/api/files/${bucketId}/${fileId}`;
};

export const getFileDownloadUrl = (bucketId: string, fileId: string) => {
    return `${process.env.NEXT_PUBLIC_POCKETBASE_URL}/api/files/${bucketId}/${fileId}?download=1`;
};

// ═══════════════════════════════════════════════════════════════
// PURCHASES (PAYMENTS)
// ═══════════════════════════════════════════════════════════════

export const createPurchase = async (purchase: Omit<Purchase, "id" | "createdAt">): Promise<string | null> => {
    if (!isPocketBaseConfigured()) return null;
    try {
        const response = await pb.collection('purchases').create({
            ...purchase,
            createdAt: Math.floor(Date.now() / 1000)
        });
        return response.id;
    } catch (error) {
        console.error("Error creating purchase record:", error);
        return null;
    }
};

export const updatePurchaseStatus = async (purchaseId: string, status: 'pending' | 'completed' | 'failed', paymentId?: string) => {
    try {
        const data: any = { status };
        if (paymentId) data.paymentId = paymentId;
        await pb.collection('purchases').update(purchaseId, data);
    } catch (error) {
        console.error("Error updating purchase status:", error);
        throw error;
    }
};

export const getPurchaseByPaymentRequestId = async (paymentRequestId: string): Promise<Purchase | null> => {
    if (!isPocketBaseConfigured()) return null;
    try {
        const records = await pb.collection('purchases').getFullList({
            filter: `paymentRequestId = '${paymentRequestId}'`,
            batch: 1,
        });
        if (records.length === 0) return null;
        return { id: records[0].id, ...records[0] } as unknown as Purchase;
    } catch (error) {
        console.error("Error fetching purchase by payment request ID:", error);
        return null;
    }
};

export const getUserPurchases = async (userId: string): Promise<Purchase[]> => {
    if (!isPocketBaseConfigured()) return [];
    try {
        const records = await pb.collection('purchases').getFullList({
            filter: `userId = '${userId}'`,
            sort: '-createdAt',
        });
        return records.map(doc => ({ id: doc.id, ...doc })) as unknown as Purchase[];
    } catch (error) {
        console.error("Error fetching user purchases:", error);
        return [];
    }
};

export const hasUserPurchasedTest = async (userId: string, testId: string): Promise<boolean> => {
    if (!isPocketBaseConfigured()) return false;
    try {
        const records = await pb.collection('purchases').getFullList({
            filter: `userId = '${userId}' && testId = '${testId}' && status = 'completed'`,
            batch: 1,
        });
        return records.length > 0;
    } catch (error) {
        console.error("Error checking test purchase:", error);
        return false;
    }
};

export const hasCompletedAnyPurchase = async (userId: string): Promise<boolean> => {
    if (!isPocketBaseConfigured()) return false;
    try {
        try {
            const profile = await getUserProfile(userId);
            if (profile?.premiumStatus) return true;
        } catch (e) {
            console.error("Failed to check premium status", e);
        }

        const records = await pb.collection('purchases').getFullList({
            filter: `userId = '${userId}' && status = 'completed'`,
            batch: 1,
        });
        return records.length > 0;
    } catch (error) {
        console.error("Error checking any purchase:", error);
        return false;
    }
};

// ═══════════════════════════════════════════════════════════════
// NEW PAYMENTS SYSTEM
// ═══════════════════════════════════════════════════════════════

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
    if (!isPocketBaseConfigured()) return [];
    try {
        const records = await pb.collection('payments').getFullList({
            filter: `userId = '${userId}'`,
            sort: '-createdAt',
        });
        return records.map(doc => ({ id: doc.id, ...doc })) as unknown as Payment[];
    } catch (error) {
        console.error("Error fetching user payments:", error);
        return [];
    }
};

// ═══════════════════════════════════════════════════════════════
// EDUCATOR PORTAL
// ═══════════════════════════════════════════════════════════════

export const getEducatorVideos = async (educatorId: string): Promise<EducatorVideo[]> => {
    if (!isPocketBaseConfigured()) return [];
    try {
        const records = await pb.collection('educator_videos').getFullList({
            filter: `educatorId = '${educatorId}'`,
            sort: '-createdAt',
        });
        return records.map(doc => ({ id: doc.id, ...doc })) as unknown as EducatorVideo[];
    } catch (error) {
        console.error("Error fetching educator videos:", error);
        return [];
    }
};

export const getAllEducatorVideos = async (): Promise<EducatorVideo[]> => {
    if (!isPocketBaseConfigured()) return [];
    try {
        const records = await pb.collection('educator_videos').getList(1, 20, {
            sort: '-createdAt',
        });
        return records.items.map(doc => ({ id: doc.id, ...doc })) as unknown as EducatorVideo[];
    } catch (error) {
        console.error("Error fetching all educator videos:", error);
        return [];
    }
};

export const createEducatorVideo = async (video: Omit<EducatorVideo, "id">) => {
    try {
        await pb.collection('educator_videos').create(video);
    } catch (error) {
        console.error("Error creating educator video:", error);
        throw error;
    }
};

export const deleteEducatorVideo = async (id: string) => {
    try {
        await pb.collection('educator_videos').delete(id);
    } catch (error) {
        console.error("Error deleting educator video:", error);
        throw error;
    }
};

export const getEducatorStats = async (educatorId: string): Promise<EducatorStats> => {
    if (!isPocketBaseConfigured()) return { totalRevenue: 0, totalSales: 0, recentSales: [] };
    try {
        const records = await pb.collection('purchases').getFullList({
            filter: `status = 'completed'`,
            sort: '-createdAt',
            batch: 100,
        });
        const purchases = records.map(doc => ({ id: doc.id, ...doc })) as unknown as Purchase[];
        const totalSales = records.length;
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
    if (!isPocketBaseConfigured()) return;
    try {
        const endTime = Math.floor(Date.now() / 1000);
        const session = await pb.collection('sessions').getOne(sessionId);
        const startTime = typeof session.startTime === 'string'
            ? parseInt(session.startTime)
            : (session.startTime || endTime);

        const duration = Math.max(0, endTime - startTime);
        await pb.collection('sessions').update(sessionId, { endTime, duration });

        await updateUserAnalytics(session.userId, {
            lastActive: endTime,
            totalTime: duration,
            sessionCount: 1
        });
    } catch (error) {
        // Silent fail for analytics
    }
};

export const logUserEvent = async (event: Omit<UserEvent, "$id" | "timestamp">) => {
    if (!isPocketBaseConfigured()) return;
    try {
        await pb.collection('events').create({
            ...event,
            timestamp: Math.floor(Date.now() / 1000)
        });

        const updates: any = { lastActive: Math.floor(Date.now() / 1000) };
        if (event.eventType === 'test_start') {
            updates.testsAttempted = 1;
        }
        if (event.eventType === 'page_visit' || event.eventType === 'test_start') {
            await updateUserAnalytics(event.userId, updates);
        }
    } catch (error) {
        // Silent fail for analytics
    }
};

// ═══════════════════════════════════════════════════════════════
// USER ANALYTICS (private helpers)
// ═══════════════════════════════════════════════════════════════

const updateUserAnalytics = async (userId: string, updates: {
    totalTime?: number,
    lastActive?: number,
    sessionCount?: number,
    testsAttempted?: number
}) => {
    try {
        let analyticsDoc: any = null;
        try {
            const records = await pb.collection('user_analytics').getFullList({
                filter: `userId = '${userId}'`,
                batch: 1,
            });
            if (records.length > 0) {
                analyticsDoc = records[0];
            }
        } catch (e) { /* Ignore */ }

        if (analyticsDoc) {
            const currentTotalTime = extractNumber(analyticsDoc.totalTime);
            const currentSessions = extractNumber(analyticsDoc.sessions);
            const currentTests = extractNumber(analyticsDoc.testsAttempted);

            const newTotalTime = currentTotalTime + (updates.totalTime || 0);
            const newSessions = currentSessions + (updates.sessionCount || 0);

            await pb.collection('user_analytics').update(analyticsDoc.id, {
                totalTime: newTotalTime,
                lastActive: updates.lastActive || analyticsDoc.lastActive,
                sessions: newSessions,
                testsAttempted: currentTests + (updates.testsAttempted || 0),
                engagementLevel: calculateEngagement(newTotalTime, newSessions)
            });
        } else {
            const newTotalTime = updates.totalTime || 0;
            const newSessions = updates.sessionCount || 0;

            await pb.collection('user_analytics').create({
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
        // Silent fail for analytics
    }
};

export const getAllUserAnalytics = async (): Promise<UserAnalytics[]> => {
    if (!isPocketBaseConfigured()) return [];
    try {
        const usersRecords = await pb.collection('users').getFullList({ batch: 200 });
        const users = usersRecords;

        const resultsRecords = await pb.collection('test_results').getFullList({
            sort: '-completedAt',
            batch: 200,
        });
        const allResults = resultsRecords;

        const resultsByUser = new Map<string, any[]>();
        allResults.forEach((doc: any) => {
            const arr = resultsByUser.get(doc.userId) || [];
            arr.push(doc);
            resultsByUser.set(doc.userId, arr);
        });

        let analyticsMap = new Map<string, any>();
        try {
            const analyticsRecords = await pb.collection('user_analytics').getFullList({ batch: 200 });
            analyticsRecords.forEach((doc: any) => {
                analyticsMap.set(doc.userId, doc);
            });
        } catch (e) {
            // user_analytics collection might not exist
        }

        const analytics: UserAnalytics[] = users.map((user: any) => {
            const userId = user.id;
            const userResults = resultsByUser.get(userId) || [];
            const existingAnalytics = analyticsMap.get(userId);

            const uniqueTests = new Set(userResults.map((r: any) => r.testId));
            const testsAttempted = uniqueTests.size;

            const totalTime = userResults.reduce((sum: number, r: any) => {
                return sum + extractNumber(r.timeTaken);
            }, 0);

            const lastActive = userResults.length > 0
                ? Math.max(...userResults.map((r: any) => extractNumber(r.completedAt)))
                : extractNumber(user.created ? Math.floor(new Date(user.created).getTime() / 1000) : 0);

            const sessions = userResults.length;
            const engagementLevel = calculateEngagement(totalTime, sessions);
            const mostUsedFeature = testsAttempted > 0 ? 'Mock Tests' : 'General';

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
                email: user.email || '',
                displayName: user.displayName || user.email?.split('@')[0] || 'Unknown',
            } as UserAnalytics;
        });

        return analytics
            .filter(a => a.testsAttempted > 0 || a.sessions > 0)
            .sort((a, b) => b.lastActive - a.lastActive);
    } catch (error) {
        console.error("Error fetching all analytics", error);
        return [];
    }
};

export const getActiveUsersCount = async (): Promise<number> => {
    if (!isPocketBaseConfigured()) return 0;
    try {
        const oneDayAgo = Math.floor(Date.now() / 1000) - (24 * 60 * 60);
        const records = await pb.collection('user_analytics').getFullList({
            filter: `lastActive >= ${oneDayAgo}`,
            batch: 200,
        });
        return records.length;
    } catch (error) {
        console.error("Error fetching active users count", error);
        return 0;
    }
};

// Legacy alias
export type TestLeaderboardEntry = TestRankEntry;

// ═══════════════════════════════════════════════════════════════
// ENHANCED TEST RANKING ENGINE
// ═══════════════════════════════════════════════════════════════

export const getTestLeaderboard = async (testId: string, currentUserId?: string): Promise<{ leaderboard: TestRankEntry[], userRank: TestRankEntry | null }> => {
    if (!isPocketBaseConfigured()) return { leaderboard: [], userRank: null };
    try {
        const resultsRecords = await pb.collection('test_results').getFullList({
            filter: `testId = '${testId}'`,
            batch: 200,
        });

        if (resultsRecords.length === 0) {
            return { leaderboard: [], userRank: null };
        }

        let testDoc: any = null;
        try {
            testDoc = await pb.collection('tests').getOne(testId);
        } catch (e) { /* ignore */ }
        const totalQuestionsFromTest = testDoc?.questions
            ? (typeof testDoc.questions === 'string' ? JSON.parse(testDoc.questions) : testDoc.questions).length
            : 0;

        // Deduplicate users - keep BEST score
        const userBestResults = new Map<string, any>();
        resultsRecords.forEach((doc: any) => {
            const existing = userBestResults.get(doc.userId);
            if (!existing) {
                userBestResults.set(doc.userId, doc);
            } else {
                if (doc.score > existing.score) {
                    userBestResults.set(doc.userId, doc);
                } else if (doc.score === existing.score) {
                    const docTime = extractNumber(doc.timeTaken);
                    const existingTime = extractNumber(existing.timeTaken);
                    if (docTime > 0 && existingTime > 0 && docTime < existingTime) {
                        userBestResults.set(doc.userId, doc);
                    }
                }
            }
        });

        let sortedResults = Array.from(userBestResults.values());
        sortedResults.sort((a, b) => {
            if (b.score !== a.score) return b.score - a.score;
            const timeA = extractNumber(a.timeTaken);
            const timeB = extractNumber(b.timeTaken);
            if (timeA > 0 && timeB > 0) return timeA - timeB;
            return 0;
        });

        const totalParticipants = sortedResults.length;

        // Fetch user names
        const userIds = sortedResults.map(r => r.userId);
        const userMap = new Map<string, string>();
        const chunkSize = 50;
        for (let i = 0; i < userIds.length; i += chunkSize) {
            const chunk = userIds.slice(i, i + chunkSize);
            if (chunk.length === 0) continue;
            try {
                const filterStr = chunk.map(id => `id = '${id}'`).join(' || ');
                const usersRecords = await pb.collection('users').getFullList({
                    filter: filterStr,
                });
                usersRecords.forEach((u: any) => {
                    userMap.set(u.id, u.name || u.displayName || 'Student');
                });
            } catch (e) {
                console.error("Error fetching users batch:", e);
            }
        }

        // Competition ranking + percentile
        const leaderboard: TestRankEntry[] = [];
        let currentRank = 1;

        for (let i = 0; i < sortedResults.length; i++) {
            const doc = sortedResults[i];
            const totalQ = doc.totalQuestions || totalQuestionsFromTest;
            const maxScore = totalQ * 4;

            const { answers, questionTimes, timeTaken } = parsePackedResult(doc);
            const answeredCount = Object.keys(answers).length;
            const correctCount = Math.max(0, Math.round((doc.score + answeredCount) / 5));
            const incorrectCount = answeredCount - correctCount;
            const unattempted = totalQ - answeredCount;

            currentRank = i + 1;

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

export const getTestPerformanceSummary = async (testId: string, currentUserId: string): Promise<TestPerformanceSummary | null> => {
    if (!isPocketBaseConfigured()) return null;
    try {
        const { leaderboard, userRank } = await getTestLeaderboard(testId, currentUserId);
        if (leaderboard.length === 0) return null;

        let testTitle = 'Test';
        try {
            const testDoc = await pb.collection('tests').getOne(testId);
            testTitle = testDoc.title || 'Test';
        } catch (e) { /* ignore */ }

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

// ═══════════════════════════════════════════════════════════════
// QUESTION-LEVEL ANALYSIS
// ═══════════════════════════════════════════════════════════════

const globalStatsCache = new Map<string, { analysis: any[], questions: any[], timestamp: number }>();
const GLOBAL_STATS_TTL = 5 * 60 * 1000;

export const getQuestionLevelAnalysis = async (testId: string, userAnswers: Record<number, number>, questionTimes?: Record<number, number>): Promise<QuestionAnalysis[]> => {
    if (!isPocketBaseConfigured()) return [];
    try {
        const cached = globalStatsCache.get(testId);
        let globalCorrectPercents: Record<number, number> = {};
        let questions: any[] = [];

        if (cached && (Date.now() - cached.timestamp < GLOBAL_STATS_TTL)) {
            cached.analysis.forEach(item => {
                globalCorrectPercents[item.questionIndex] = item.globalCorrectPercent;
            });
            questions = cached.questions;
        } else {
            const testDoc = await pb.collection('tests').getOne(testId);
            let parsedQuestions = safeParseJSON(testDoc.questions);
            if (!Array.isArray(parsedQuestions)) parsedQuestions = [];
            questions = parsedQuestions;

            const resultsRecords = await pb.collection('test_results').getFullList({
                filter: `testId = '${testId}'`,
                fields: 'answers',
                batch: 200,
            });

            const questionStats = new Map<number, { correct: number, total: number }>();
            resultsRecords.forEach((doc: any) => {
                const { answers: ans } = parsePackedResult(doc);
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

            questions.forEach((_: any, idx: number) => {
                const stats = questionStats.get(idx) || { correct: 0, total: 0 };
                globalCorrectPercents[idx] = stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0;
            });

            const cacheData = questions.map((q: any, idx: number) => ({
                questionIndex: idx,
                globalCorrectPercent: globalCorrectPercents[idx],
                questionText: q.text || '',
                correctAnswer: q.correctAnswer
            }));
            globalStatsCache.set(testId, { analysis: cacheData, questions, timestamp: Date.now() });
        }

        return questions.map((q: any, idx: number) => {
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

// ═══════════════════════════════════════════════════════════════
// ADMIN TEST ANALYTICS
// ═══════════════════════════════════════════════════════════════

export const getAdminTestAnalytics = async (testId: string): Promise<AdminTestAnalytics | null> => {
    if (!isPocketBaseConfigured()) return null;
    try {
        const testDoc = await pb.collection('tests').getOne(testId);
        let questions = safeParseJSON(testDoc.questions);
        if (!Array.isArray(questions)) questions = [];
        const totalQ = questions.length;

        const resultsRecords = await pb.collection('test_results').getFullList({
            filter: `testId = '${testId}'`,
            batch: 200,
        });

        const docs = resultsRecords;
        if (docs.length === 0) {
            return {
                testId, testTitle: testDoc.title || 'Test', totalAttemptees: 0,
                averageScore: 0, highestScore: 0, lowestScore: 0, medianScore: 0,
                averageTimeTaken: 0, scoreDistribution: [], questionSuccessRates: [], dropOffPoints: [],
            };
        }

        const scores = docs.map((d: any) => d.score || 0).sort((a: number, b: number) => a - b);
        const sum = scores.reduce((a: number, b: number) => a + b, 0);
        const avg = Math.round(sum / scores.length);
        const median = scores.length % 2 === 0
            ? Math.round((scores[scores.length / 2 - 1] + scores[scores.length / 2]) / 2)
            : scores[Math.floor(scores.length / 2)];

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

        const maxScore = totalQ * 4;
        const bucketSize = Math.max(1, Math.ceil(maxScore / 8));
        const distribution: { range: string; count: number }[] = [];
        for (let i = -totalQ; i <= maxScore; i += bucketSize) {
            const lo = i;
            const hi = Math.min(i + bucketSize - 1, maxScore);
            const count = scores.filter((s: number) => s >= lo && s <= hi).length;
            if (count > 0 || lo >= 0) {
                distribution.push({ range: `${lo} - ${hi}`, count });
            }
        }

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

        const dropOffPoints: { questionIndex: number; dropCount: number }[] = [];
        for (let i = 1; i < totalQ; i++) {
            const drop = questionAttemptCount[i - 1] - questionAttemptCount[i];
            if (drop > 0) {
                dropOffPoints.push({ questionIndex: i, dropCount: drop });
            }
        }
        dropOffPoints.sort((a, b) => b.dropCount - a.dropCount);

        return {
            testId, testTitle: testDoc.title || 'Test', totalAttemptees: docs.length,
            averageScore: avg, highestScore: Math.max(...scores), lowestScore: Math.min(...scores),
            medianScore: median, averageTimeTaken: avgTime, scoreDistribution: distribution,
            questionSuccessRates, dropOffPoints: dropOffPoints.slice(0, 10),
        };
    } catch (error) {
        console.error("Error getting admin test analytics:", error);
        return null;
    }
};

export const getAllTestResults = async (): Promise<TestResult[]> => {
    if (!isPocketBaseConfigured()) return [];
    try {
        const records = await pb.collection('test_results').getFullList({
            sort: '-completedAt',
            batch: 200,
        });
        return records.map(doc => ({
            id: doc.id,
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

// ═══════════════════════════════════════════════════════════════
// ADMIN: STUDENT PERFORMANCE
// ═══════════════════════════════════════════════════════════════

export interface StudentPerformanceData {
    userId: string;
    userName: string;
    email: string;
    testsAttempted: number;
    overallScore: number;
    averageAccuracy: number;
    testPerformances: {
        testId: string; testTitle: string; subject: string; score: number; maxScore: number;
        rank: number; totalAttemptees: number; accuracy: number; timeTaken: number;
        completedAt: number; correctCount: number; incorrectCount: number; unattempted: number;
    }[];
    sectionWise: { section: string; totalQuestions: number; correctCount: number; accuracy: number; }[];
    weakSections: string[];
}

export const getAdminStudentPerformance = async (): Promise<StudentPerformanceData[]> => {
    if (!isPocketBaseConfigured()) return [];
    try {
        const usersRecords = await pb.collection('users').getFullList({ batch: 200 });
        const users = usersRecords;

        const resultsRecords = await pb.collection('test_results').getFullList({
            sort: '-completedAt', batch: 200,
        });
        const allResults = resultsRecords;

        const testsRecords = await pb.collection('tests').getFullList({ batch: 200 });
        const testsMap = new Map<string, any>();
        testsRecords.forEach((doc: any) => {
            let questions = safeParseJSON(doc.questions);
            if (!Array.isArray(questions)) questions = [];
            testsMap.set(doc.id, {
                title: doc.title || 'Unknown Test',
                subject: doc.subject || doc.pyqSubject || 'General',
                questions,
            });
        });

        const resultsByTest = new Map<string, any[]>();
        allResults.forEach((doc: any) => {
            const arr = resultsByTest.get(doc.testId) || [];
            arr.push(doc);
            resultsByTest.set(doc.testId, arr);
        });

        // Pre-compute ranks per test
        const testRanks = new Map<string, Map<string, { rank: number; total: number }>>();
        resultsByTest.forEach((results, testId) => {
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

        const resultsByUser = new Map<string, any[]>();
        allResults.forEach((doc: any) => {
            const arr = resultsByUser.get(doc.userId) || [];
            arr.push(doc);
            resultsByUser.set(doc.userId, arr);
        });

        const studentPerformances: StudentPerformanceData[] = [];

        users.forEach((user: any) => {
            const userId = user.id;
            const userResults = resultsByUser.get(userId);
            if (!userResults || userResults.length === 0) return;

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

                let answers: Record<string, number> = {};
                try {
                    answers = typeof result.answers === 'string' ? JSON.parse(result.answers) : (result.answers || {});
                } catch (e) { answers = {}; }

                const answeredCount = Object.keys(answers).length;
                const correctCount = Math.max(0, Math.round((result.score + answeredCount) / 5));
                const incorrectCount = answeredCount - correctCount;
                const unattempted = totalQ - answeredCount;
                const accuracy = answeredCount > 0 ? Math.round((correctCount / answeredCount) * 100) : 0;

                const rankInfo = testRanks.get(result.testId)?.get(userId);

                testPerformances.push({
                    testId: result.testId, testTitle: testMeta.title, subject: testMeta.subject,
                    score: result.score || 0, maxScore, rank: rankInfo?.rank || 0,
                    totalAttemptees: rankInfo?.total || 0, accuracy,
                    timeTaken: extractNumber(result.timeTaken), completedAt: result.completedAt || 0,
                    correctCount, incorrectCount, unattempted,
                });

                const section = testMeta.subject || 'General';
                const existing = sectionStats.get(section) || { total: 0, correct: 0 };
                existing.total += totalQ;
                existing.correct += correctCount;
                sectionStats.set(section, existing);
            });

            testPerformances.sort((a, b) => b.completedAt - a.completedAt);

            const sectionWise: StudentPerformanceData['sectionWise'] = [];
            sectionStats.forEach((stats, section) => {
                sectionWise.push({
                    section, totalQuestions: stats.total, correctCount: stats.correct,
                    accuracy: stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0,
                });
            });
            sectionWise.sort((a, b) => a.accuracy - b.accuracy);

            const weakSections = sectionWise.filter(s => s.accuracy < 50).map(s => s.section);
            const overallScore = testPerformances.reduce((sum, t) => sum + t.score, 0);
            const avgAccuracy = testPerformances.length > 0
                ? Math.round(testPerformances.reduce((sum, t) => sum + t.accuracy, 0) / testPerformances.length)
                : 0;

            studentPerformances.push({
                userId,
                userName: user.displayName || user.name || 'Student',
                email: user.email || '',
                testsAttempted: testPerformances.length,
                overallScore, averageAccuracy: avgAccuracy,
                testPerformances, sectionWise, weakSections,
            });
        });

        studentPerformances.sort((a, b) => b.testsAttempted - a.testsAttempted);
        return studentPerformances;
    } catch (error) {
        console.error("Error fetching admin student performance:", error);
        return [];
    }
};

// ═══════════════════════════════════════════════════════════════
// STREAK & DAILY GOAL
// ═══════════════════════════════════════════════════════════════

export const getDailyProgress = async (userId: string): Promise<{ streak: number; lastActiveDate: string; dailyGoal: string; dailyProgress: number; dailyGoalTarget: number }> => {
    let pbResult = { streak: 0, lastActiveDate: '', dailyGoal: 'Solve 5 Questions', dailyProgress: 0, dailyGoalTarget: 5 };

    if (isPocketBaseConfigured()) {
        try {
            const user = await getUserProfile(userId);
            if (user) {
                pbResult = {
                    streak: user.streak || 0,
                    lastActiveDate: user.lastActiveDate || '',
                    dailyGoal: user.dailyGoal || 'Solve 5 Questions',
                    dailyProgress: user.dailyProgress || 0,
                    dailyGoalTarget: user.dailyGoalTarget || 5
                };
            }
        } catch (error) {
            console.error("Error fetching daily progress:", error);
        }
    }

    // Check LocalStorage for fresher data (Optimistic UI)
    if (typeof window !== 'undefined') {
        try {
            const stored = localStorage.getItem(`streak_${userId}`);
            if (stored) {
                const parsed = JSON.parse(stored);
                const today = new Date().toISOString().split('T')[0];
                if (parsed.lastActiveDate === today || (pbResult.lastActiveDate && parsed.lastActiveDate > pbResult.lastActiveDate)) {
                    return {
                        ...pbResult,
                        streak: parsed.streak || pbResult.streak,
                        lastActiveDate: parsed.lastActiveDate || pbResult.lastActiveDate,
                        dailyProgress: parsed.dailyProgress || pbResult.dailyProgress
                    };
                }
            }
        } catch (err) { /* ignore */ }
    }

    return pbResult;
};

export const updateStreakAndDaily = async (userId: string, progressIncrement: number = 0) => {
    if (!isPocketBaseConfigured()) return;
    try {
        const user = await getUserProfile(userId);
        if (!user) return;

        const today = new Date().toISOString().split('T')[0];
        const lastActive = user.lastActiveDate;

        let streak = user.streak || 0;
        let dailyProgress = user.dailyProgress || 0;

        if (lastActive !== today) {
            dailyProgress = 0;
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const yesterdayStr = yesterday.toISOString().split('T')[0];

            if (lastActive === yesterdayStr) {
                streak += 1;
            } else {
                streak = 1;
            }
        }

        dailyProgress += progressIncrement;

        // Optimistic LS update
        if (typeof window !== 'undefined') {
            try {
                localStorage.setItem(`streak_${userId}`, JSON.stringify({ streak, lastActiveDate: today, dailyProgress }));
            } catch (err) { /* ignore */ }
        }

        try {
            await updateUser(userId, { streak, lastActiveDate: today, dailyProgress });
        } catch (dbError) {
            console.error("Backend streak update failed:", dbError);
        }

        return { streak, dailyProgress };
    } catch (error) {
        console.error("Error calculating streak/daily:", error);
    }
};

export const setUserDailyGoal = async (userId: string, target: number, goalText: string) => {
    if (!isPocketBaseConfigured()) return;
    try {
        await updateUser(userId, { dailyGoal: goalText, dailyGoalTarget: target });
    } catch (error) {
        console.error("Error setting daily goal:", error);
    }
};

// ═══════════════════════════════════════════════════════════════
// DISCUSSION FORUM
// ═══════════════════════════════════════════════════════════════

export const getForumPosts = async (category?: ForumCategory): Promise<ForumPost[]> => {
    if (!isPocketBaseConfigured()) return [];
    try {
        const options: any = { sort: '-createdAt', batch: 50 };
        if (category) {
            options.filter = `category = '${category}'`;
        }
        const records = await pb.collection('forum_posts').getFullList(options);
        return records.map(doc => ({ id: doc.id, ...doc })) as unknown as ForumPost[];
    } catch (error) { console.error("Error fetching forum posts:", error); return []; }
};

export const getForumPostById = async (id: string): Promise<ForumPost | null> => {
    if (!isPocketBaseConfigured()) return null;
    try {
        const doc = await pb.collection('forum_posts').getOne(id);
        return { id: doc.id, ...doc } as unknown as ForumPost;
    } catch (error) { console.error("Error fetching forum post:", error); return null; }
};

export const createForumPost = async (post: Omit<ForumPost, 'id' | 'createdAt' | 'upvotes' | 'views'>): Promise<string | null> => {
    if (!isPocketBaseConfigured()) return null;
    try {
        const response = await pb.collection('forum_posts').create({
            userId: post.userId, authorName: post.authorName,
            title: post.title, content: post.content, category: post.category,
            upvotes: 0, views: 0, createdAt: Math.floor(Date.now() / 1000),
        });
        return response.id;
    } catch (error) { console.error("Error creating forum post:", error); throw error; }
};

export const deleteForumPost = async (postId: string): Promise<boolean> => {
    try { await pb.collection('forum_posts').delete(postId); return true; }
    catch (error) { console.error("Error deleting forum post:", error); return false; }
};

export const upvoteForumPost = async (postId: string): Promise<number> => {
    try {
        const doc = await pb.collection('forum_posts').getOne(postId);
        const newUpvotes = (Number(doc.upvotes) || 0) + 1;
        await pb.collection('forum_posts').update(postId, { upvotes: newUpvotes });
        return newUpvotes;
    } catch (error) { console.error("Error upvoting forum post:", error); return 0; }
};

export const getForumComments = async (postId: string): Promise<ForumComment[]> => {
    if (!isPocketBaseConfigured()) return [];
    try {
        const records = await pb.collection('forum_comments').getFullList({
            filter: `postId = '${postId}'`,
            sort: 'createdAt',
            batch: 100,
        });
        return records.map(doc => ({ id: doc.id, ...doc })) as unknown as ForumComment[];
    } catch (error) { console.error("Error fetching forum comments:", error); return []; }
};

export const createForumComment = async (comment: Omit<ForumComment, 'id' | 'createdAt'>): Promise<string | null> => {
    if (!isPocketBaseConfigured()) return null;
    try {
        const response = await pb.collection('forum_comments').create({
            postId: comment.postId, userId: comment.userId, authorName: comment.authorName,
            content: comment.content, createdAt: Math.floor(Date.now() / 1000),
        });
        return response.id;
    } catch (error) { console.error("Error creating forum comment:", error); return null; }
};
