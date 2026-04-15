"use client";

import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { LatexRenderer } from "@/components/ui/LatexRenderer";
import { useState } from "react";
import { createTest } from "@/lib/pocketbase-db";
import { useAuth } from "@/context/AuthContext";
import { useRouter, useSearchParams } from "next/navigation";
import { Test, Question, PYQSubject } from "@/types";

export default function CreateTestPage() {
    const { user } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();
    const typeFromUrl = searchParams.get('type');

    const [loading, setLoading] = useState(false);
    const [testData, setTestData] = useState<Partial<Test>>({
        title: "",
        description: "",
        duration: 60,
        subject: "General",
        questions: [],
        testType: typeFromUrl === 'pyq' ? 'pyq' : (typeFromUrl === 'mock' ? 'educator' : 'pyq'), // Default to PYQ
        pyqSubject: 'non-domain', // Default PYQ subject
        price: 0, // Default free
        status: 'Published', // Default published
        isFullSyllabus: false,
        subjectAllocations: [],
        series: "" // Series bundle this test belongs to
    });
    const [questions, setQuestions] = useState<Omit<Question, "id">[]>([
        { text: "", options: ["", "", "", ""], correctAnswer: 0, subject: "General" }
    ]);

    // For Full Syllabus allocations
    const [newSubjectName, setNewSubjectName] = useState("");
    const [newSubjectCount, setNewSubjectCount] = useState<number | "">("");

    // Admin UI States
    const [activeAdminSubject, setActiveAdminSubject] = useState<string>("General");
    const [expandedQuestionIndex, setExpandedQuestionIndex] = useState<number | null>(0);

    const handleAddSubjectAllocation = () => {
        if (!newSubjectName || !newSubjectCount) return;
        const count = Number(newSubjectCount);
        if (count <= 0) return;

        const currentAllocations = testData.subjectAllocations || [];
        setTestData({
            ...testData,
            subjectAllocations: [...currentAllocations, { subject: newSubjectName, count }]
        });
        setNewSubjectName("");
        setNewSubjectCount("");
    };

    const handleRemoveSubjectAllocation = (index: number) => {
        const currentAllocations = testData.subjectAllocations || [];
        const newAllocations = [...currentAllocations];
        newAllocations.splice(index, 1);
        setTestData({
            ...testData,
            subjectAllocations: newAllocations
        });
    };

    const generateFullSyllabusQuestions = () => {
        if (!testData.subjectAllocations || testData.subjectAllocations.length === 0) {
            alert("Please add at least one subject allocation first.");
            return;
        }

        if (questions.length > 1 || (questions.length === 1 && questions[0].text !== "")) {
            if (!confirm("This will overwrite your existing questions. Are you sure?")) return;
        }

        const newQuestions: Omit<Question, "id">[] = [];
        testData.subjectAllocations.forEach(alloc => {
            for (let i = 0; i < alloc.count; i++) {
                newQuestions.push({
                    text: "",
                    options: ["", "", "", ""],
                    correctAnswer: 0,
                    subject: alloc.subject
                });
            }
        });
        setQuestions(newQuestions);
        if (testData.subjectAllocations.length > 0) {
            setActiveAdminSubject(testData.subjectAllocations[0].subject);
        }
    };

    const addQuestion = () => {
        const targetSubject = testData.isFullSyllabus ? activeAdminSubject : testData.subject || "General";
        setQuestions([...questions, { text: "", options: ["", "", "", ""], correctAnswer: 0, subject: targetSubject }]);
        setExpandedQuestionIndex(questions.length); // Open the newly added question
    };

    const removeQuestion = (index: number) => {
        const newQuestions = [...questions];
        newQuestions.splice(index, 1);
        setQuestions(newQuestions);
    };

    const updateQuestion = (index: number, field: keyof Omit<Question, "id">, value: any) => {
        const newQuestions = [...questions];
        newQuestions[index] = { ...newQuestions[index], [field]: value };
        setQuestions(newQuestions);
    };

    const updateOption = (qIndex: number, oIndex: number, value: string) => {
        const newQuestions = [...questions];
        const newOptions = [...newQuestions[qIndex].options];
        newOptions[oIndex] = value;
        newQuestions[qIndex].options = newOptions;
        setQuestions(newQuestions);
    };

    const handlePublish = async () => {
        if (!testData.title) {
            alert("Please enter a test title");
            return;
        }

        setLoading(true);
        const result = await createTest({
            title: testData.title,
            subject: testData.subject || "General",
            duration: testData.duration || 60,
            questions: questions.map((q, i) => ({ ...q, id: `q-${i + 1}` })),
            createdAt: Math.floor(Date.now() / 1000),
            createdBy: user?.$id || "admin",
            testType: testData.testType || 'pyq',
            pyqSubject: testData.testType === 'pyq' ? testData.pyqSubject : undefined,
            price: testData.price || 0,
            status: testData.status || 'Published',
            isFullSyllabus: testData.isFullSyllabus || false,
            subjectAllocations: testData.isFullSyllabus ? testData.subjectAllocations : undefined,
            series: testData.series ? testData.series : undefined,
            maxSubjectChoices: testData.maxSubjectChoices,
            isVisible: true
        } as any);

        if (result.id) {
            alert("Test published successfully!");
            router.push(testData.testType === 'pyq' ? "/admin/pyqs" : "/admin/tests");
        } else {
            alert("Failed to publish test: " + (result.error || "Unknown Error"));
        }
        setLoading(false);
    };

    return (
        <div style={{ maxWidth: "800px", margin: "0 auto" }}>
            <h1 style={{ marginBottom: "2rem" }}>Create New Test</h1>

            <Card style={{ marginBottom: "2rem" }}>
                <h3 style={{ marginBottom: "1rem" }}>Test Details</h3>
                <Input
                    label="Test Title"
                    placeholder="e.g., NCET Full Mock 1"
                    value={testData.title}
                    onChange={(e) => setTestData({ ...testData, title: e.target.value })}
                />
                <Input
                    label="Duration (minutes)"
                    type="number"
                    placeholder="180"
                    value={testData.duration}
                    onChange={(e) => setTestData({ ...testData, duration: Number(e.target.value) })}
                />
                {/* Series/Domain Selection */}
                {testData.testType === 'educator' ? (
                    <div style={{ marginTop: "1rem", marginBottom: "1rem" }}>
                        <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.9rem", color: "var(--text-secondary)" }}>NRT Target Domain (Series Bundle)</label>
                        <select
                            value={testData.series || ""}
                            onChange={(e) => setTestData({ ...testData, series: e.target.value })}
                            style={{
                                width: "100%",
                                padding: "0.75rem",
                                borderRadius: "8px",
                                border: "1px solid var(--border)",
                                backgroundColor: "var(--bg-secondary)",
                                color: "var(--text-primary)",
                                fontSize: "1rem"
                            }}
                        >
                            <option value="">None / General Mock</option>
                            <option value="Science">Science Domain</option>
                            <option value="Humanities">Humanities Domain</option>
                            <option value="Commerce">Commerce Domain</option>
                        </select>
                        <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginTop: "0.25rem" }}>
                            Select the target domain to group this test. Paying for one test in this domain unlocks all others.
                        </p>
                    </div>
                ) : (
                    <>
                        <Input
                            label="Series Bundle Name (Optional)"
                            placeholder="e.g., NCET Ready Test"
                            value={testData.series || ""}
                            onChange={(e) => setTestData({ ...testData, series: e.target.value })}
                        />
                        <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginTop: "0.25rem", marginBottom: "1rem" }}>
                            If this is part of a series pack, enter the series name exactly. Buying one series unlocks all tests with this identical name.
                        </p>
                    </>
                )}

                {/* Test Type Selection */}
                <div style={{ marginTop: "1rem" }}>
                    <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.9rem", color: "var(--text-secondary)" }}>Test Type</label>
                    <select
                        value={testData.testType || 'pyq'}
                        onChange={(e) => setTestData({ ...testData, testType: e.target.value as 'pyq' | 'educator' })}
                        style={{
                            width: "100%",
                            padding: "0.75rem",
                            borderRadius: "8px",
                            border: "1px solid var(--border)",
                            backgroundColor: "var(--bg-secondary)",
                            color: "var(--text-primary)",
                            fontSize: "1rem"
                        }}
                    >
                        <option value="pyq">PYQ (Platform-Owned, Free)</option>
                        <option value="educator">Educator Mock Test (Premium)</option>
                    </select>
                </div>

                {/* PYQ Subject - Only show if testType is 'pyq' */}
                {testData.testType === 'pyq' && (
                    <div style={{ marginTop: "1rem" }}>
                        <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.9rem", color: "var(--text-secondary)" }}>PYQ Subject Category</label>
                        <select
                            value={testData.pyqSubject || 'non-domain'}
                            onChange={(e) => setTestData({ ...testData, pyqSubject: e.target.value as PYQSubject })}
                            style={{
                                width: "100%",
                                padding: "0.75rem",
                                borderRadius: "8px",
                                border: "1px solid var(--border)",
                                backgroundColor: "var(--bg-secondary)",
                                color: "var(--text-primary)",
                                fontSize: "1rem"
                            }}
                        >
                            <option value="languages">Languages (English, Hindi, etc.)</option>
                            <option value="humanities">Humanities (History, Geography, etc.)</option>
                            <option value="science">Science (Physics, Chemistry, Biology)</option>
                            <option value="commerce">Commerce (Economics, Accounts, etc.)</option>
                            <option value="non-domain">Non-Domain (General Knowledge, Aptitude)</option>
                        </select>
                    </div>
                )}

                <div style={{ marginTop: "1rem" }}>
                    <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.9rem", color: "var(--text-secondary)" }}>Subject (Optional)</label>
                    <select
                        value={testData.subject || "General"}
                        onChange={(e) => {
                            const isFullMock = e.target.value === "Full Mock";
                            setTestData({
                                ...testData,
                                subject: e.target.value,
                                isFullSyllabus: isFullMock
                            });
                        }}
                        style={{
                            width: "100%",
                            padding: "0.75rem",
                            borderRadius: "8px",
                            border: "1px solid var(--border)",
                            backgroundColor: "var(--bg-secondary)",
                            color: "var(--text-primary)",
                            fontSize: "1rem"
                        }}
                    >
                        <option value="General">General</option>
                        <option value="Physics">Physics</option>
                        <option value="Chemistry">Chemistry</option>
                        <option value="Maths">Mathematics</option>
                        <option value="Full Mock">Full Mock Test</option>
                    </select>
                </div>

                {/* Full Syllabus Allocations */}
                {testData.isFullSyllabus && (
                    <div style={{ marginTop: "1rem", padding: "1rem", border: "1px dashed var(--border)", borderRadius: "8px" }}>
                        <h4 style={{ marginBottom: "1rem" }}>Subject Allocations for Full Syllabus</h4>

                        {(testData.subjectAllocations || []).map((alloc, idx) => (
                            <div key={idx} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem", padding: "0.5rem", backgroundColor: "var(--bg-secondary)", borderRadius: "4px" }}>
                                <span>{alloc.subject} ({alloc.count} questions)</span>
                                <Button variant="outline" style={{ color: "var(--error)", borderColor: "var(--error)", padding: "0.25rem 0.5rem", fontSize: "0.8rem" }} onClick={() => handleRemoveSubjectAllocation(idx)}>Remove</Button>
                            </div>
                        ))}

                        <div style={{ display: "flex", gap: "1rem", marginTop: "1rem", alignItems: "flex-end" }}>
                            <div style={{ flex: 1 }}>
                                <Input
                                    label="Subject Name"
                                    placeholder="e.g., Physics"
                                    value={newSubjectName}
                                    onChange={(e) => setNewSubjectName(e.target.value)}
                                />
                            </div>
                            <div style={{ flex: 1 }}>
                                <Input
                                    label="Question Count"
                                    type="number"
                                    placeholder="e.g., 30"
                                    value={newSubjectCount}
                                    onChange={(e) => setNewSubjectCount(e.target.value ? Number(e.target.value) : "")}
                                />
                            </div>
                            <Button variant="secondary" onClick={handleAddSubjectAllocation}>
                                Add
                            </Button>
                        </div>

                        <div style={{ marginTop: "1rem" }}>
                            <Button variant="outline" onClick={generateFullSyllabusQuestions} style={{ width: "100%" }}>
                                Generate Question Forms based on Allocations
                            </Button>
                        </div>
                    </div>
                )}

                {/* Price Field - Only for Educator Tests */}
                {testData.testType === 'educator' && (
                    <div style={{ marginTop: "1rem" }}>
                        <Input
                            label="Price (₹)"
                            type="number"
                            placeholder="0"
                            value={testData.price || 0}
                            onChange={(e) => setTestData({ ...testData, price: Number(e.target.value) })}
                        />
                        <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginTop: "0.25rem" }}>
                            Set to 0 for free tests. Students will need to purchase if price &gt; 0.
                        </p>
                    </div>
                )}

                {/* Publish Status */}
                <div style={{ marginTop: "1rem" }}>
                    <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.9rem", color: "var(--text-secondary)" }}>Status</label>
                    <select
                        value={testData.status || 'Published'}
                        onChange={(e) => setTestData({ ...testData, status: e.target.value as 'Draft' | 'Published' | 'Archived' })}
                        style={{
                            width: "100%",
                            padding: "0.75rem",
                            borderRadius: "8px",
                            border: "1px solid var(--border)",
                            backgroundColor: "var(--bg-secondary)",
                            color: "var(--text-primary)",
                            fontSize: "1rem"
                        }}
                    >
                        <option value="Published">Published (Visible to Students)</option>
                        <option value="Draft">Draft (Hidden)</option>
                    </select>
                </div>

                {/* Max Subject Choices Selection */}
                <div style={{ marginTop: "1rem" }}>
                    <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.9rem", color: "var(--text-secondary)" }}>Max Subject Choices (Optional)</label>
                    <input
                        type="number"
                        placeholder="e.g. 3 for Humanities"
                        value={testData.maxSubjectChoices || ""}
                        onChange={(e) => setTestData({ ...testData, maxSubjectChoices: parseInt(e.target.value) || undefined })}
                        style={{
                            width: "100%",
                            padding: "0.75rem",
                            borderRadius: "8px",
                            border: "1px solid var(--border)",
                            backgroundColor: "var(--bg-secondary)",
                            color: "var(--text-primary)",
                            fontSize: "1rem"
                        }}
                    />
                    <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginTop: "0.25rem" }}>
                        If set, students must pick this many subjects from the allocations before starting.
                    </p>
                </div>
            </Card>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                <h3 style={{ marginBottom: 0 }}>Questions</h3>
                <div style={{ display: "flex", gap: "1rem" }}>
                    <Button variant="outline" onClick={() => {
                        const template = [
                            {
                                text: "Sample Question? (Supports LaTeX: $E=mc^2$)",
                                imageUrl: "https://example.com/image.png",
                                options: ["Option A", "Option B", "Option C", "Option D"],
                                correctAnswer: 0
                            }
                        ];
                        const blob = new Blob([JSON.stringify(template, null, 2)], { type: "application/json" });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement("a");
                        a.href = url;
                        a.download = "questions_template.json";
                        a.click();
                        URL.revokeObjectURL(url);
                    }}>
                        Download Template
                    </Button>
                    <div style={{ position: "relative" }}>
                        <Button variant="secondary" onClick={() => document.getElementById("json-upload")?.click()}>
                            Import JSON
                        </Button>
                        <input
                            id="json-upload"
                            type="file"
                            accept=".json"
                            style={{ display: "none" }}
                            onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;

                                const reader = new FileReader();
                                reader.onload = (event) => {
                                    try {
                                        const json = JSON.parse(event.target?.result as string);
                                        if (Array.isArray(json)) {
                                            // Validate basic structure
                                            const isValid = json.every(q => q.text && Array.isArray(q.options) && typeof q.correctAnswer === 'number');
                                            if (isValid) {
                                                setQuestions(json);
                                                alert(`Successfully loaded ${json.length} questions!`);
                                            } else {
                                                alert("Invalid JSON format. Please use the template.");
                                            }
                                        } else {
                                            alert("JSON must be an array of questions.");
                                        }
                                    } catch (err) {
                                        alert("Error parsing JSON file.");
                                    }
                                };
                                reader.readAsText(file);
                                // Reset value so same file can be selected again
                                e.target.value = '';
                            }}
                        />
                    </div>
                </div>
            </div>

            {/* Admin Subject Tabs */}
            {testData.isFullSyllabus && testData.subjectAllocations && testData.subjectAllocations.length > 0 && (
                <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', marginBottom: '1.5rem', overflowX: 'auto' }}>
                    {testData.subjectAllocations.map(alloc => (
                        <button
                            key={alloc.subject}
                            style={{
                                padding: '10px 20px',
                                border: 'none',
                                backgroundColor: activeAdminSubject === alloc.subject ? 'var(--bg-secondary)' : 'transparent',
                                borderTop: activeAdminSubject === alloc.subject ? '3px solid var(--primary)' : '3px solid transparent',
                                fontWeight: activeAdminSubject === alloc.subject ? 'bold' : 'normal',
                                color: activeAdminSubject === alloc.subject ? 'var(--text-primary)' : 'var(--text-secondary)',
                                cursor: 'pointer',
                                whiteSpace: 'nowrap'
                            }}
                            onClick={() => {
                                setActiveAdminSubject(alloc.subject);
                                setExpandedQuestionIndex(null); // Close accordion on switch
                            }}
                            type="button"
                        >
                            {alloc.subject}
                        </button>
                    ))}
                </div>
            )}

            {/* Questions List (Filtered & Accordion) */}
            {questions.map((q, qIndex) => {
                // Filter logic
                if (testData.isFullSyllabus && q.subject !== activeAdminSubject) return null;

                const isExpanded = expandedQuestionIndex === qIndex;

                return (
                    <Card key={qIndex} style={{ marginBottom: "1rem" }}>
                        {/* Accordion Header */}
                        <div
                            style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", paddingBottom: isExpanded ? "1rem" : "0", borderBottom: isExpanded ? "1px solid var(--border)" : "none" }}
                            onClick={() => setExpandedQuestionIndex(isExpanded ? null : qIndex)}
                        >
                            <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                                <h4 style={{ margin: 0 }}>Question {qIndex + 1}</h4>
                                {q.text ? (
                                    <span style={{ fontSize: "0.9rem", color: "var(--text-secondary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "400px" }}>
                                        {q.text}
                                    </span>
                                ) : (
                                    <span style={{ fontSize: "0.9rem", color: "var(--action)", fontStyle: "italic" }}>
                                        Empty Question
                                    </span>
                                )}
                            </div>

                            <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                                {q.subject && !testData.isFullSyllabus && (
                                    <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)", backgroundColor: "var(--bg-secondary)", padding: "0.2rem 0.5rem", borderRadius: "4px" }}>
                                        {q.subject}
                                    </span>
                                )}
                                <span style={{ transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}>
                                    ▼
                                </span>
                            </div>
                        </div>

                        {/* Accordion Body */}
                        {isExpanded && (
                            <div style={{ paddingTop: "1rem" }}>
                                <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "1rem" }}>
                                    <Button
                                        variant="outline"
                                        style={{ color: "var(--error)", borderColor: "var(--error)", padding: "0.25rem 0.5rem", fontSize: "0.8rem" }}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            removeQuestion(qIndex);
                                        }}
                                        type="button"
                                    >
                                        Remove Question
                                    </Button>
                                </div>

                                <div style={{ marginBottom: "1rem" }}>
                                    <Input
                                        label="Question Text"
                                        placeholder="Enter question here (supports LaTeX e.g., $E=mc^2$)"
                                        value={q.text}
                                        onChange={(e) => updateQuestion(qIndex, "text", e.target.value)}
                                    />
                                    {q.text && (
                                        <div style={{ marginTop: "0.5rem", padding: "0.75rem", background: "var(--bg-secondary)", borderRadius: "8px", border: "1px solid var(--border)" }}>
                                            <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: "0.25rem" }}>Preview:</p>
                                            <LatexRenderer>{q.text}</LatexRenderer>
                                        </div>
                                    )}
                                </div>

                                <Input
                                    label="Image URL (Optional)"
                                    placeholder="https://example.com/image.png"
                                    value={q.imageUrl || ""}
                                    onChange={(e) => updateQuestion(qIndex, "imageUrl", e.target.value)}
                                />

                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginTop: "1rem" }}>
                                    {q.options.map((opt: string, oIndex: number) => (
                                        <div key={oIndex}>
                                            <Input
                                                label={`Option ${String.fromCharCode(65 + oIndex)}`}
                                                placeholder={`Option ${oIndex + 1}`}
                                                value={opt}
                                                onChange={(e) => updateOption(qIndex, oIndex, e.target.value)}
                                            />
                                            {opt && (
                                                <div style={{ marginTop: "0.25rem", padding: "0.5rem", background: "var(--bg-secondary)", borderRadius: "6px", border: "1px solid var(--border)" }}>
                                                    <p style={{ fontSize: "0.7rem", color: "var(--text-secondary)", marginBottom: "0.1rem" }}>Preview:</p>
                                                    <LatexRenderer>{opt}</LatexRenderer>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>

                                <div style={{ marginTop: "1rem" }}>
                                    <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.9rem", color: "var(--text-secondary)" }}>Correct Option</label>
                                    <select
                                        style={{ padding: "0.75rem", borderRadius: "8px", background: "var(--surface)", color: "white", border: "1px solid #333", width: "100%" }}
                                        value={q.correctAnswer}
                                        onChange={(e) => updateQuestion(qIndex, "correctAnswer", Number(e.target.value))}
                                    >
                                        <option value={0}>Option A</option>
                                        <option value={1}>Option B</option>
                                        <option value={2}>Option C</option>
                                        <option value={3}>Option D</option>
                                    </select>
                                </div>
                            </div>
                        )}
                    </Card>
                );
            })}

            <div style={{ display: "flex", gap: "1rem", marginBottom: "4rem" }}>
                <Button variant="secondary" onClick={addQuestion} style={{ flex: 1 }}>+ Add Question</Button>
                <Button variant="primary" style={{ flex: 1 }} onClick={handlePublish} disabled={loading}>
                    {loading ? "Publishing..." : "Publish Test"}
                </Button>
            </div>
        </div>
    );
}
