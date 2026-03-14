"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import styles from "./TestEngine.module.css";
import { useRouter } from "next/navigation";
import { getTestById, saveTestResult, hasUserPaidForProduct } from "@/lib/appwrite-db";
import { useAuth } from "@/context/AuthContext";
import { Test } from "@/types";
import { LatexRenderer } from "@/components/ui/LatexRenderer";
import { useAnalytics } from "@/context/AnalyticsContext";
import { Lock } from "lucide-react";

interface TestEngineProps {
    testId: string;
}

export const TestEngine: React.FC<TestEngineProps> = ({ testId }) => {
    const router = useRouter();
    const { user } = useAuth();
    const { trackEvent } = useAnalytics();
    const [test, setTest] = useState<Test | null>(null);
    const [loading, setLoading] = useState(true);
    const [hasAccess, setHasAccess] = useState(false);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState<Record<number, number>>({});
    const [markedForReview, setMarkedForReview] = useState<Set<number>>(new Set());
    const [visited, setVisited] = useState<Set<number>>(new Set([0]));
    const [timeLeft, setTimeLeft] = useState(0);
    const [hasStarted, setHasStarted] = useState(false);
    const [isSidebarVisible, setIsSidebarVisible] = useState(true);
    const [activeSubject, setActiveSubject] = useState<string>("");
    const [selectedSubjects, setSelectedSubjects] = useState<Set<string>>(new Set());
    // Time tracking
    const [questionTimes, setQuestionTimes] = useState<Record<number, number>>({});
    const [questionStartTime, setQuestionStartTime] = useState<number>(0);
    const [testStartTime, setTestStartTime] = useState<number>(0);

    useEffect(() => {
        const fetchTestAndCheckAccess = async () => {
            if (!testId || !user) {
                setLoading(false);
                return;
            }

            const data = await getTestById(testId);
            if (data) {
                setTest(data);
                setTimeLeft(data.duration * 60);

                // Payment check logic
                if (data.price && data.price > 0) {
                    // Check if they own the specific Series Bundle, falling back to the individual test name if not part of a series
                    const productNameToCheck = data.series ? data.series : data.title;
                    const hasPaid = await hasUserPaidForProduct(user.$id, productNameToCheck);
                    setHasAccess(hasPaid);
                } else {
                    // Free tests (or PYQs) are always accessible
                    setHasAccess(true);
                }
            }
            setLoading(false);
        };
        fetchTestAndCheckAccess();
    }, [testId, user]);

    const isFullSyllabus = test?.isFullSyllabus && test?.subjectAllocations && test.subjectAllocations.length > 0;

    // Modified Selection Logic for Humanities and Science
    const allAvailableSubjects = test?.subjectAllocations?.map(a => a.subject) || [];
    const maxChoices = test?.maxSubjectChoices || (isFullSyllabus && allAvailableSubjects.length > 3 ? 3 : 1);
    
    // Legacy support for Maths vs Biology (Science)
    const hasMaths = allAvailableSubjects.find(s => s.toLowerCase().includes("math"));
    const hasBiology = allAvailableSubjects.find(s => s.toLowerCase().includes("bio"));
    const isScienceFullMock = isFullSyllabus && hasMaths && hasBiology && allAvailableSubjects.length <= 5;

    const requiresSelection = isFullSyllabus && (test?.maxSubjectChoices || isScienceFullMock);

    // Active allocations based on selection
    const activeAllocations = test?.subjectAllocations?.filter(a => 
        !requiresSelection || selectedSubjects.has(a.subject)
    ) || [];

    useEffect(() => {
        if (isFullSyllabus && test?.questions[currentQuestionIndex]?.subject) {
            const currentSubj = test.questions[currentQuestionIndex].subject;
            if (currentSubj !== activeSubject && (selectedSubjects.has(currentSubj as string) || !requiresSelection)) {
                setActiveSubject(currentSubj as string);
            }
        } else if (isFullSyllabus && activeAllocations && activeAllocations.length > 0 && !activeSubject) {
            setActiveSubject(activeAllocations[0].subject);
        }
    }, [currentQuestionIndex, isFullSyllabus, test, activeSubject, activeAllocations, selectedSubjects, requiresSelection]);

    const getSubjectQuestionIndices = (subject: string) => {
        if (!test) return [];
        return test.questions.map((q, idx) => q.subject === subject ? idx : -1).filter(idx => idx !== -1);
    };

    const currentPaletteIndices = isFullSyllabus && activeSubject
        ? getSubjectQuestionIndices(activeSubject)
        : test?.questions.map((_, i) => i) || [];

    const validGlobalIndices = test
        ? test.questions.map((q, idx) => {
            if (!requiresSelection) return idx;
            return q.subject && selectedSubjects.has(q.subject) ? idx : -1;
        }).filter(idx => idx !== -1)
        : [];

    const calculateScore = () => {
        if (!test) return 0;
        let score = 0;
        test.questions.forEach((q, index) => {
            if (requiresSelection && (!q.subject || !selectedSubjects.has(q.subject))) return;

            if (answers[index] === q.correctAnswer) {
                score += 4;
            } else if (answers[index] !== undefined) {
                score -= 1;
            }
        });
        return score;
    };

    // Flush time for current question before submitting or switching
    const flushCurrentQuestionTime = () => {
        if (questionStartTime > 0) {
            const now = Date.now();
            const elapsed = Math.round((now - questionStartTime) / 1000);
            setQuestionTimes(prev => ({
                ...prev,
                [currentQuestionIndex]: (prev[currentQuestionIndex] || 0) + elapsed
            }));
            setQuestionStartTime(now);
            return elapsed;
        }
        return 0;
    };

    const handleSubmit = async () => {
        if (!test || !user) return;
        const score = calculateScore();

        // Calculate final question times (flush current)
        const finalQuestionTimes = { ...questionTimes };
        if (questionStartTime > 0) {
            const elapsed = Math.round((Date.now() - questionStartTime) / 1000);
            finalQuestionTimes[currentQuestionIndex] = (finalQuestionTimes[currentQuestionIndex] || 0) + elapsed;
        }

        const totalTimeTaken = testStartTime > 0 ? Math.round((Date.now() - testStartTime) / 1000) : 0;
        const totalValidQuestions = validGlobalIndices.length > 0 ? validGlobalIndices.length : test.questions.length;

        const result = {
            userId: user.$id,
            testId: testId,
            score: score,
            totalQuestions: totalValidQuestions,
            answers: answers,
            completedAt: Math.floor(Date.now() / 1000),
            timeTaken: totalTimeTaken,
            questionTimes: finalQuestionTimes,
        };

        try {
            await saveTestResult(result);
            trackEvent('test_complete', `/dashboard/tests/${testId}`, `Score: ${score}/${test.questions.length * 4}`);

            // Store answers and question times in sessionStorage for review page
            sessionStorage.setItem(`test_answers_${testId}`, JSON.stringify(answers));
            sessionStorage.setItem(`test_questionTimes_${testId}`, JSON.stringify(finalQuestionTimes));
            sessionStorage.setItem(`test_timeTaken_${testId}`, String(totalTimeTaken));

            // Redirect to review page with score info
            router.push(`/dashboard/tests/review?testId=${testId}&score=${score}&total=${totalValidQuestions}`);
        } catch (error) {
            console.error("Error submitting test:", error);
            alert("Error submitting test. Please try again.");
        }
    };

    // Strict Mode Logic
    const handleViolation = () => {
        if (!hasStarted) return;
        alert("Action Prohibited! You exited full screen or switched tabs. The test will be auto-submitted.");
        handleSubmit();
    };

    const enterFullScreen = () => {
        const elem = document.documentElement;
        if (elem.requestFullscreen) {
            elem.requestFullscreen().catch(err => {
                console.error("Error attempting to enable full-screen mode:", err.message);
            });
        }
    };

    const startTest = () => {
        setHasStarted(true);
        setTestStartTime(Date.now());
        setQuestionStartTime(Date.now());
        enterFullScreen();
        trackEvent('test_start', `/dashboard/tests/${testId}`, test?.title);
    };

    useEffect(() => {
        if (!hasStarted) return;

        const handleFullScreenChange = () => {
            if (!document.fullscreenElement) {
                handleViolation();
            }
        };

        const handleVisibilityChange = () => {
            if (document.hidden) {
                handleViolation();
            }
        };

        const handleResize = () => {
            // Optional: Check if window size is significantly reduced
            // NTA usually just cares about Full Screen, but let's be strict if window isn't maximized-ish
            if (window.innerHeight < screen.height * 0.9 || window.innerWidth < screen.width * 0.9) {
                // Often redundant with fullscreen check, but added for safety
            }
        };

        document.addEventListener("fullscreenchange", handleFullScreenChange);
        document.addEventListener("visibilitychange", handleVisibilityChange);
        window.addEventListener("resize", handleResize);

        // Prevent right click
        const handleContextMenu = (e: MouseEvent) => e.preventDefault();
        document.addEventListener("contextmenu", handleContextMenu);

        return () => {
            document.removeEventListener("fullscreenchange", handleFullScreenChange);
            document.removeEventListener("visibilitychange", handleVisibilityChange);
            window.removeEventListener("resize", handleResize);
            document.removeEventListener("contextmenu", handleContextMenu);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [hasStarted]);

    // Timer only runs if started
    useEffect(() => {
        if (!test || !hasStarted || timeLeft <= 0) return;
        const timer = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 0) {
                    clearInterval(timer);
                    handleSubmit();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, [test, hasStarted, timeLeft]);

    const handleOptionSelect = (optionIndex: number) => {
        setAnswers((prev) => ({
            ...prev,
            [currentQuestionIndex]: optionIndex
        }));
    };

    const handleNext = () => {
        if (test) {
            flushCurrentQuestionTime();
            const currIdxInValid = validGlobalIndices.indexOf(currentQuestionIndex);
            if (currIdxInValid >= 0 && currIdxInValid < validGlobalIndices.length - 1) {
                const nextIndex = validGlobalIndices[currIdxInValid + 1];
                setCurrentQuestionIndex(nextIndex);
                setVisited((prev) => new Set(prev).add(nextIndex));
            }
        }
    };

    const handlePrev = () => {
        if (test) {
            flushCurrentQuestionTime();
            const currIdxInValid = validGlobalIndices.indexOf(currentQuestionIndex);
            if (currIdxInValid > 0) {
                const prevIndex = validGlobalIndices[currIdxInValid - 1];
                setCurrentQuestionIndex(prevIndex);
                setVisited((prev) => new Set(prev).add(prevIndex));
            }
        }
    };

    const handleSaveAndNext = () => {
        // Just move next, answer is already in state if selected
        flushCurrentQuestionTime();
        if (test) {
            const currIdxInValid = validGlobalIndices.indexOf(currentQuestionIndex);
            if (currIdxInValid >= 0 && currIdxInValid < validGlobalIndices.length - 1) {
                const nextIndex = validGlobalIndices[currIdxInValid + 1];
                setCurrentQuestionIndex(nextIndex);
                setVisited((prev) => new Set(prev).add(nextIndex));
            }
        }
    };

    const handleClearResponse = () => {
        setAnswers((prev) => {
            const newAnswers = { ...prev };
            delete newAnswers[currentQuestionIndex];
            return newAnswers;
        });
    };

    const handleMarkForReviewAndNext = () => {
        flushCurrentQuestionTime();
        setMarkedForReview((prev) => new Set(prev).add(currentQuestionIndex));
        if (test) {
            const currIdxInValid = validGlobalIndices.indexOf(currentQuestionIndex);
            if (currIdxInValid >= 0 && currIdxInValid < validGlobalIndices.length - 1) {
                const nextIndex = validGlobalIndices[currIdxInValid + 1];
                setCurrentQuestionIndex(nextIndex);
                setVisited((prev) => new Set(prev).add(nextIndex));
            }
        }
    };

    const jumpToQuestion = (index: number) => {
        flushCurrentQuestionTime();
        setCurrentQuestionIndex(index);
        setVisited((prev) => new Set(prev).add(index));
    };

    const formatTime = (seconds: number) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const getPaletteClass = (index: number) => {
        let className = "";
        const isAnswered = answers[index] !== undefined;
        const isMarked = markedForReview.has(index);
        const isVisited = visited.has(index);

        if (isAnswered && isMarked) className = styles.markedAnswered;
        else if (isMarked) className = styles.marked;
        else if (isAnswered) className = styles.answered;
        else if (isVisited && !isAnswered) className = styles.notAnswered;
        else className = styles.notVisited;

        if (index === currentQuestionIndex) {
            className += ` ${styles.active}`;
        }
        return className;
    };

    if (loading) return <div className="p-8 text-black bg-white min-h-screen text-center flex items-center justify-center font-bold text-xl">Loading test...</div>;
    if (!test) return <div className="p-8 text-black bg-white min-h-screen text-center flex items-center justify-center font-bold text-xl">Test not found.</div>;

    if (!hasAccess) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4">
                <div className="bg-card p-8 rounded-xl shadow-lg max-w-md w-full text-center border-2 border-border space-y-6">
                    <Lock className="w-16 h-16 mx-auto text-primary" />
                    <h2 className="text-2xl font-bold text-foreground">Premium Test</h2>
                    <p className="text-foreground/70">
                        This is an official educator mock test. You need to purchase the <strong>{test.series || test.title}</strong> pass to access this.
                    </p>
                    <Button
                        onClick={() => router.push('/dashboard/tests')}
                        className="w-full bg-primary text-black font-bold h-12"
                    >
                        View Purchase Options
                    </Button>
                </div>
            </div>
        );
    }

    if (!hasStarted) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
                <div className="bg-white p-8 rounded-lg shadow-lg max-w-2xl w-full">
                    <h1 className="text-2xl font-bold mb-4 text-center">{test.title} - Instructions</h1>
                    <ul className="list-disc pl-6 space-y-2 mb-6 text-gray-700">
                        <li>The clock will be set at the server. The countdown timer at the top right corner of screen will display the remaining time available for you to complete the examination.</li>
                        <li>The examination will end by itself when the timer reaches zero. You will not be required to end or submit your examination.</li>
                        <li><strong>Strict Mode:</strong> This test is proctored. Switching tabs, minimizing the window, or exiting full screen will result in <strong>immediate auto-submission</strong>.</li>
                        <li>Please ensure you have a stable internet connection.</li>
                    </ul>

                    {requiresSelection && (
                        <div className="mb-6 p-4 border border-blue-200 bg-blue-50 rounded-lg">
                            <h3 className="font-semibold text-lg mb-3">Select your domain subjects ({selectedSubjects.size}/{maxChoices}):</h3>
                            <p className="text-sm text-gray-600 mb-4">
                                {maxChoices === 1 
                                    ? "Please select the subject you wish to attempt. The other will be omitted." 
                                    : `Please select exactly ${maxChoices} subjects you wish to attempt from the list below.`}
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {allAvailableSubjects.map((subject) => (
                                    <label key={subject} className={`flex items-center gap-2 cursor-pointer bg-white px-4 py-3 rounded border transition-colors ${selectedSubjects.has(subject) ? 'border-primary bg-primary/5' : 'hover:border-blue-400'}`}>
                                        <input
                                            type="checkbox"
                                            checked={selectedSubjects.has(subject)}
                                            onChange={() => {
                                                const newSelection = new Set(selectedSubjects);
                                                if (newSelection.has(subject)) {
                                                    newSelection.delete(subject);
                                                } else {
                                                    if (newSelection.size < maxChoices) {
                                                        newSelection.add(subject);
                                                    } else if (maxChoices === 1) {
                                                        newSelection.clear();
                                                        newSelection.add(subject);
                                                    }
                                                }
                                                setSelectedSubjects(newSelection);
                                            }}
                                            className="w-5 h-5 text-blue-600"
                                        />
                                        <span className="font-medium">{subject}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="flex justify-center">
                        <Button
                            variant="primary"
                            style={{ backgroundColor: "#FFD02F", color: "black", fontSize: '1.2rem', padding: '10px 30px', opacity: requiresSelection && selectedSubjects.size < maxChoices ? 0.5 : 1 }}
                            onClick={startTest}
                            disabled={!!(requiresSelection && selectedSubjects.size < maxChoices)}
                        >
                            {requiresSelection && selectedSubjects.size < maxChoices ? `Select ${maxChoices} subjects to begin` : "I am ready to begin"}
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    const currentQuestion = test.questions[currentQuestionIndex];

    return (
        <div className={styles.container}>
            {/* Header */}
            <div className={styles.header}>
                <div className={styles.headerLeft}>
                    {test.title}
                </div>
                <div className={styles.headerRight}>
                    {/* Hamburger Menu for Mobile */}
                    <button
                        className={styles.hamburgerBtn}
                        onClick={() => setIsSidebarVisible(!isSidebarVisible)}
                        aria-label="Toggle Question Palette"
                    >
                        <div className={styles.hamburgerLine}></div>
                        <div className={styles.hamburgerLine}></div>
                        <div className={styles.hamburgerLine}></div>
                    </button>
                    <div className={styles.candidateInfo}>
                        <div className={styles.candidateImg}></div>
                        <span>{user?.name || "Candidate Name"}</span>
                    </div>
                </div>
            </div>

            <div className={styles.body}>
                {/* Main Question Area */}
                <div className={styles.mainArea}>
                    {isFullSyllabus && activeAllocations && (
                        <div style={{ display: 'flex', borderBottom: '1px solid #ddd', backgroundColor: '#f9f9f9', overflowX: 'auto' }}>
                            {activeAllocations.map(alloc => (
                                <button
                                    key={alloc.subject}
                                    style={{
                                        padding: '10px 20px',
                                        border: 'none',
                                        backgroundColor: activeSubject === alloc.subject ? '#fff' : 'transparent',
                                        borderTop: activeSubject === alloc.subject ? '3px solid #007bff' : '3px solid transparent',
                                        fontWeight: activeSubject === alloc.subject ? 'bold' : 'normal',
                                        cursor: 'pointer',
                                        whiteSpace: 'nowrap'
                                    }}
                                    onClick={() => {
                                        setActiveSubject(alloc.subject);
                                        const firstIdx = getSubjectQuestionIndices(alloc.subject)[0];
                                        if (firstIdx !== undefined) jumpToQuestion(firstIdx);
                                    }}
                                >
                                    {alloc.subject}
                                </button>
                            ))}
                        </div>
                    )}
                    <div className={styles.questionHeader}>
                        <div className={styles.sectionBar}>
                            Section: {isFullSyllabus ? activeSubject : (test.subject || "General")}
                        </div>
                        <div style={{ fontWeight: 'bold', color: '#d9534f' }}>
                            Marks: +4, -1
                        </div>
                    </div>

                    <div className={styles.scrollableContent}>
                        <div className={styles.questionText}>
                            <h3 style={{ marginBottom: "10px", fontWeight: "bold" }}>
                                Question {isFullSyllabus ? (currentPaletteIndices.indexOf(currentQuestionIndex) + 1) : (currentQuestionIndex + 1)}:
                            </h3>
                            <LatexRenderer>{currentQuestion.text}</LatexRenderer>
                            {currentQuestion.imageUrl && (
                                <div style={{ marginTop: "1rem", marginBottom: "1rem" }}>
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                        src={
                                            currentQuestion.imageUrl.startsWith('http')
                                                ? currentQuestion.imageUrl
                                                : currentQuestion.imageUrl.startsWith('/')
                                                    ? currentQuestion.imageUrl
                                                    : `/${currentQuestion.imageUrl}`
                                        }
                                        alt="Question detailed view"
                                        style={{ maxWidth: "100%", maxHeight: "400px", borderRadius: "4px", border: "1px solid #ddd" }}
                                    />
                                </div>
                            )}
                        </div>

                        <div className={styles.options}>
                            {currentQuestion.options.map((option, index) => (
                                <label key={index} className={styles.option}>
                                    <input
                                        type="radio"
                                        name={`question-${currentQuestionIndex}`}
                                        checked={answers[currentQuestionIndex] === index}
                                        onChange={() => handleOptionSelect(index)}
                                    />
                                    <span>
                                        <LatexRenderer>{option}</LatexRenderer>
                                    </span>
                                </label>
                            ))}
                        </div>
                    </div>

                    <div className={styles.footer}>
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <button className={`${styles.actionBtn} ${styles.btnDanger}`} onClick={handleClearResponse}>
                                Clear Response
                            </button>
                            <button className={`${styles.actionBtn} ${styles.btnReview}`} onClick={handleMarkForReviewAndNext}>
                                Mark for Review & Next
                            </button>
                        </div>
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <button
                                className={styles.actionBtn}
                                onClick={handlePrev}
                                disabled={validGlobalIndices.indexOf(currentQuestionIndex) === 0}
                            >
                                Back
                            </button>
                            <button
                                className={`${styles.actionBtn} ${styles.btnPrimary}`}
                                onClick={handleSaveAndNext}
                            >
                                Save & Next
                            </button>
                        </div>
                    </div>
                </div>

                {/* Sidebar (Palette) - Collapsible */}
                {isSidebarVisible && (
                    <div className={styles.sidebar}>
                        <div className={styles.timerBox}>
                            Time Left: <span className={styles.timerText}>{formatTime(timeLeft)}</span>
                        </div>

                        <div className={styles.userProfile} style={{ padding: '1rem', borderBottom: '1px solid #ccc', backgroundColor: '#fff' }}>
                            <div className={styles.userAvatar}>{user?.name?.[0] || "U"}</div>
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <span style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>{user?.name || "Candidate"}</span>
                                <span style={{ fontSize: '0.8rem', color: '#666' }}>{user?.email}</span>
                            </div>
                        </div>

                        <div className={styles.legend}>
                            <div className={styles.legendItem}>
                                <div className={`${styles.legendIcon} ${styles.statusNotVisited}`} style={{ border: '1px solid #ccc' }}></div>
                                <span>Not Visited</span>
                            </div>
                            <div className={styles.legendItem}>
                                <div className={`${styles.legendIcon} ${styles.statusNotAnswered}`}>0</div>
                                <span>Not Answered</span>
                            </div>
                            <div className={styles.legendItem}>
                                <div className={`${styles.legendIcon} ${styles.answered}`}>0</div>
                                <span>Answered</span>
                            </div>
                            <div className={styles.legendItem}>
                                <div className={`${styles.legendIcon} ${styles.marked}`}>0</div>
                                <span>Marked for Review</span>
                            </div>
                            <div className={styles.legendItem} style={{ gridColumn: '1 / -1' }}>
                                <div className={`${styles.legendIcon} ${styles.markedAnswered}`} style={{ position: 'relative' }}>
                                    0<span style={{ position: 'absolute', bottom: '-2px', right: '-2px', background: '#5cb85c', width: '8px', height: '8px', borderRadius: '50%' }}></span>
                                </div>
                                <span>Ans & Marked for Review</span>
                            </div>
                        </div>

                        <div className={styles.paletteHeader}>
                            Question Palette
                        </div>

                        <div className={styles.paletteArea}>
                            <div className={styles.paletteGrid}>
                                {currentPaletteIndices.map((globalIndex, localIndex) => (
                                    <button
                                        key={globalIndex}
                                        className={`${styles.pBtn} ${getPaletteClass(globalIndex)}`}
                                        onClick={() => jumpToQuestion(globalIndex)}
                                    >
                                        {isFullSyllabus ? localIndex + 1 : globalIndex + 1}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className={styles.submitBtnContainer}>
                            <button className={styles.fullSubmitBtn} onClick={handleSubmit}>
                                Submit Test
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
