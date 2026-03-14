export interface Question {
    id: string;
    text: string;
    imageUrl?: string;
    options: string[];
    correctAnswer: number;
    subject?: string; // e.g., "Physics", "Chemistry" for full syllabus mock tests
}

export type PYQSubject = 'languages' | 'humanities' | 'science' | 'commerce' | 'non-domain';

export interface Test {
    id: string;
    title: string;
    description?: string;
    subject?: string;
    duration: number; // in minutes
    questions: Question[];
    createdBy: string;
    createdAt: number;
    isVisible: boolean;
    status?: 'Draft' | 'Published' | 'Archived';
    // Business model distinction
    testType?: 'pyq' | 'educator'; // PYQ = platform-owned free content, Educator = educator-owned premium content
    pyqSubject?: 'languages' | 'humanities' | 'science' | 'commerce' | 'non-domain'; // For PYQ categorization
    price?: number; // Cost of the test in INR (0 for free)
    series?: string; // Series bundle this test belongs to, unlocking it if purchased

    // Full Syllabus feature
    isFullSyllabus?: boolean;
    maxSubjectChoices?: number; // e.g., for Humanities: 3
    subjectAllocations?: { subject: string; count: number }[];
}

export interface Purchase {
    id: string;
    userId: string;
    testId: string;
    paymentId?: string; // Instamojo Payment ID (available after success)
    paymentRequestId: string; // Instamojo Payment Request ID
    amount: number;
    status: 'pending' | 'completed' | 'failed';
    productName?: string; // Product name for the new payment system
    createdAt: number;
}

export interface Payment {
    id?: string;
    userId: string;
    paymentId: string;
    paymentRequestId: string;
    amount: number;
    status: string;
    productName: string;
    createdAt: number;
}

export interface TestResult {
    id?: string;
    userId: string;
    testId: string;
    score: number;
    totalQuestions: number;
    answers: Record<number, number>; // question index -> selected option index
    completedAt: number;
    timeTaken?: number; // total time in seconds
    questionTimes?: Record<number, number>; // question index -> time spent in seconds
}

export interface TestRankEntry {
    rank: number;
    userId: string;
    userName: string;
    score: number;
    totalMarks: number;
    correctCount: number;
    incorrectCount: number;
    unattempted: number;
    accuracy: number; // percentage
    percentile: number;
    timeTaken: number; // seconds
    isCurrentUser: boolean;
    answers?: Record<number, number>;
    questionTimes?: Record<number, number>;
}

export interface TestPerformanceSummary {
    testId: string;
    testTitle: string;
    totalScore: number;
    maxScore: number;
    rank: number;
    totalAttemptees: number;
    percentile: number;
    correctCount: number;
    incorrectCount: number;
    unattemptedCount: number;
    accuracy: number;
    timeTaken: number;
    averageScore: number;
    highestScore: number;
    leaderboard: TestRankEntry[];
    userEntry: TestRankEntry | null;
    answers?: Record<number, number>;
    questionTimes?: Record<number, number>;
}

export interface QuestionAnalysis {
    questionIndex: number;
    questionText: string;
    userAnswer: number | undefined;
    correctAnswer: number;
    status: 'correct' | 'incorrect' | 'skipped';
    timeSpent: number; // seconds
    globalCorrectPercent: number; // % of students who got it right
}

export interface AdminTestAnalytics {
    testId: string;
    testTitle: string;
    totalAttemptees: number;
    averageScore: number;
    highestScore: number;
    lowestScore: number;
    medianScore: number;
    averageTimeTaken: number;
    scoreDistribution: { range: string; count: number }[];
    questionSuccessRates: { questionIndex: number; correctPercent: number }[];
    dropOffPoints: { questionIndex: number; dropCount: number }[];
}

export interface Book {
    id?: string;
    title: string;
    subject: string;
    chapter?: string;
    url: string;
    thumbnailColor: string;
    isVisible: boolean;
    createdAt?: number;
}

export interface FormulaCard {
    id?: string;
    title: string;
    subject: string;
    chapter?: string;
    content?: string; // Text content
    imageUrl?: string; // Image URL
    url?: string; // External link
    isVisible: boolean;
    createdAt?: number;
}

export interface UserProfile {
    uid: string;
    email: string;
    displayName?: string;
    role: 'user' | 'admin';
    premiumStatus: boolean;
    isBanned?: boolean;
    enrolledEducatorId?: string;
    totalScore?: number;
    testsAttempted?: number;
    stats?: {
        testsAttempted: number;
        booksViewed: number;
        streak: number;
    };
    streak?: number;
    lastActiveDate?: string; // YYYY-MM-DD
    dailyGoal?: string;
    dailyProgress?: number;
    dailyGoalTarget?: number;
    createdAt?: number;
}

export interface Notification {
    id?: string;
    title: string;
    message: string;
    type: 'info' | 'alert' | 'success';
    createdAt: number;
}

export interface PYQ {
    id?: string;
    title: string;
    subject: string;
    year: number;
    url: string;
    createdAt: number;
}

export interface SiteSettings {
    bannerText: string;
    primaryColor: string;
    contactEmail: string;
    showBanner: boolean;
}

export interface VideoClass {
    id?: string;
    videoId?: string;
    title: string;
    description?: string;
    url: string;  // YouTube URL
    duration?: number;
    authorId?: string;
    subject?: string;
    thumbnailUrl?: string;
    createdAt?: string | number;  // datetime or timestamp
}

export interface Educator {
    id: string; // Document ID
    name: string;
    subject: string;
    logoFileId?: string;
    catalogXmlFileId?: string;
    youtubeChannelId?: string;
}

export interface VideoProgress {
    studentId: string;
    educatorId: string;
    videoId: string;
    watched: boolean;
    lastTimestamp?: number;
    updatedAt?: number | string;
}

export interface EducatorVideo {
    id: string;
    educatorId: string;
    title: string;
    url: string; // YouTube URL
    createdAt: number;
}

export interface EducatorStats {
    totalRevenue: number;
    totalSales: number;
    recentSales: Purchase[];
}

export interface UserSession {
    $id?: string;
    userId: string;
    startTime: number;
    endTime?: number;
    duration?: number;
    deviceInfo?: string;
    ipAddress?: string;
}

export interface UserEvent {
    $id?: string;
    userId: string;
    eventType: 'login' | 'page_visit' | 'test_start' | 'test_complete' | 'video_watch' | 'other';
    pageName?: string;
    metadata?: string; // JSON string
    timestamp: number;
}

export interface UserAnalytics { // Aggregated stats for a user
    userId: string;
    totalTime: number; // in seconds
    lastActive: number;
    mostUsedFeature: string;
    testsAttempted: number;
    engagementLevel: 'High' | 'Medium' | 'Low';
    sessions: number;
}

export type ForumCategory = 'General' | 'Doubt' | 'Exam Update' | 'Strategy';

export interface ForumPost {
    id?: string;
    userId: string;
    authorName: string;
    title: string;
    content: string;
    category: ForumCategory;
    upvotes: number;
    views: number;
    createdAt: number;
}

export interface ForumComment {
    id?: string;
    postId: string;
    userId: string;
    authorName: string;
    content: string;
    createdAt: number;
}

export interface CarouselBanner {
    id?: string;
    title: string;
    imageUrl: string;
    linkUrl?: string; // Optional click destination
    isActive: boolean;
    order: number;
    createdAt: number;
}
