"use client";

import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { LatexRenderer } from "@/components/ui/LatexRenderer";
import { useState, useEffect } from "react";
import { getTestById } from "@/lib/appwrite-db";
import { useRouter, useParams } from "next/navigation";
import { Test, Question } from "@/types";
import { databases } from "@/lib/appwrite-student";

const DB_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || '69c84948001622ba05f7';

export default function EditTestPage() {
    const router = useRouter();
    const params = useParams();
    const testId = params.id as string;

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [testData, setTestData] = useState<Partial<Test>>({
        title: "",
        subject: "General",
        duration: 60,
        series: "",
        testType: "pyq",
        pyqSubject: "non-domain",
        price: 0
    });
    const [questions, setQuestions] = useState<Omit<Question, "id">[]>([]);

    useEffect(() => {
        const fetchTest = async () => {
            if (!testId) return;
            try {
                const test = await getTestById(testId);
                if (test) {
                    setTestData({
                        title: test.title,
                        subject: test.subject || "General",
                        duration: test.duration,
                        series: test.series || "",
                        testType: test.testType || "pyq",
                        pyqSubject: test.pyqSubject || "non-domain",
                        price: test.price || 0
                    });
                    setQuestions(test.questions.map(q => ({
                        text: q.text,
                        options: q.options,
                        correctAnswer: q.correctAnswer
                    })));
                }
            } catch (error) {
                console.error("Error fetching test:", error);
                alert("Failed to load test");
            } finally {
                setLoading(false);
            }
        };
        fetchTest();
    }, [testId]);

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

    const handleSave = async () => {
        if (!testData.title) {
            alert("Please enter a test title");
            return;
        }

        setSaving(true);
        try {
            await databases.updateDocument(DB_ID, 'tests', testId, {
                title: testData.title,
                subject: testData.subject || "General",
                duration: testData.duration || 60,
                series: testData.series || undefined,
                testType: testData.testType || 'pyq',
                pyqSubject: testData.pyqSubject || 'non-domain',
                price: (testData.price !== undefined && !isNaN(Number(testData.price))) ? Number(testData.price) : 0,
                questions: JSON.stringify(questions.map((q, i) => ({ ...q, id: `q-${i + 1}` })))
            });
            alert("Test updated successfully!");
            router.push("/admin/tests");
        } catch (error) {
            console.error("Error updating test:", error);
            alert("Failed to update test.");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <div style={{ padding: "2rem", color: "white" }}>Loading test...</div>;
    }

    return (
        <div style={{ maxWidth: "800px", margin: "0 auto" }}>
            <h1 style={{ marginBottom: "2rem" }}>Edit Test</h1>

            <Card style={{ marginBottom: "2rem" }}>
                <h3 style={{ marginBottom: "1rem" }}>Test Details</h3>
                <Input
                    label="Test Title"
                    value={testData.title}
                    onChange={(e) => setTestData({ ...testData, title: e.target.value })}
                />
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                    <div style={{ marginTop: "1rem" }}>
                        <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.9rem", color: "var(--text-secondary)" }}>Subject</label>
                        <select
                            value={testData.subject || "General"}
                            onChange={(e) => setTestData({ ...testData, subject: e.target.value })}
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
                    <div style={{ marginTop: "1rem" }}>
                        <Input
                            label="Duration (minutes)"
                            type="number"
                            value={testData.duration}
                            onChange={(e) => setTestData({ ...testData, duration: parseInt(e.target.value) })}
                        />
                    </div>
                </div>

                <div style={{ marginTop: "1rem" }}>
                    <Input
                        label="Price (₹)"
                        type="number"
                        value={testData.price}
                        onChange={(e) => setTestData({ ...testData, price: parseInt(e.target.value) })}
                        placeholder="Enter 0 for free"
                    />
                </div>
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
                        {/* Preserve custom series name if it exists and isn't one of the defaults */}
                        {testData.series && !["", "Science", "Humanities", "Commerce"].includes(testData.series) && (
                            <option value={testData.series}>{testData.series} (Custom/Legacy)</option>
                        )}
                        <option value="">None / General Mock</option>
                        <option value="Science">Science Domain</option>
                        <option value="Humanities">Humanities Domain</option>
                        <option value="Commerce">Commerce Domain</option>
                    </select>
                    <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginTop: "0.25rem" }}>
                        Select the target domain to group this test. Paying for one test in this domain unlocks all others.
                    </p>
                </div>

                <div style={{ marginTop: "1rem" }}>
                    <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.9rem", color: "var(--text-secondary)" }}>Test Type (Categorization)</label>
                    <select
                        value={testData.testType || "pyq"}
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
                        <option value="pyq">PYQ (Platform Owned - Free)</option>
                        <option value="educator">Educator (Premium - Paid)</option>
                    </select>
                    <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginTop: "0.25rem" }}>
                        <strong>Educator</strong> tests show up in the premium Mock Tests section. <strong>PYQ</strong> tests show up in the free section.
                    </p>
                </div>

                {testData.testType === 'pyq' && (
                    <div style={{ marginTop: "1rem" }}>
                        <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.9rem", color: "var(--text-secondary)" }}>PYQ Subject Category</label>
                        <select
                            value={testData.pyqSubject || "non-domain"}
                            onChange={(e) => setTestData({ ...testData, pyqSubject: e.target.value as any })}
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
                            <option value="languages">Languages</option>
                            <option value="humanities">Humanities</option>
                            <option value="science">Science</option>
                            <option value="commerce">Commerce</option>
                            <option value="non-domain">Non-Domain (Aptitude/GK)</option>
                        </select>
                    </div>
                )}
            </Card>

            <h3 style={{ marginBottom: "1rem" }}>Questions ({questions.length})</h3>
            {questions.map((q, qIndex) => (
                <Card key={qIndex} style={{ marginBottom: "1rem" }}>
                    <h4 style={{ marginBottom: "1rem" }}>Question {qIndex + 1}</h4>
                    <Input
                        label="Question Text"
                        value={q.text}
                        onChange={(e) => updateQuestion(qIndex, "text", e.target.value)}
                    />
                    {q.text && (
                        <div className="mt-2 p-3 bg-gray-50 rounded-md border border-gray-200">
                            <p className="text-xs text-gray-500 mb-1">Preview:</p>
                            <LatexRenderer>{q.text}</LatexRenderer>
                        </div>
                    )}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginTop: "1rem" }}>
                        {q.options.map((opt, oIndex) => (
                            <div key={oIndex}>
                                <Input
                                    label={`Option ${String.fromCharCode(65 + oIndex)}`}
                                    value={opt}
                                    onChange={(e) => updateOption(qIndex, oIndex, e.target.value)}
                                    placeholder={`Option ${String.fromCharCode(65 + oIndex)} (supports LaTeX)`}
                                />
                                {opt && (
                                    <div className="mt-2 p-3 bg-gray-50 rounded-md border border-gray-200">
                                        <p className="text-xs text-gray-500 mb-1">Preview:</p>
                                        <LatexRenderer>{opt}</LatexRenderer>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                    <div style={{ marginTop: "1rem" }}>
                        <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.9rem", color: "var(--text-secondary)" }}>Correct Answer</label>
                        <select
                            value={q.correctAnswer}
                            onChange={(e) => updateQuestion(qIndex, "correctAnswer", parseInt(e.target.value))}
                            style={{
                                padding: "0.5rem",
                                borderRadius: "6px",
                                border: "1px solid var(--border)",
                                backgroundColor: "var(--bg-secondary)",
                                color: "var(--text-primary)"
                            }}
                        >
                            <option value={0}>Option A</option>
                            <option value={1}>Option B</option>
                            <option value={2}>Option C</option>
                            <option value={3}>Option D</option>
                        </select>
                    </div>
                </Card>
            ))}

            <div style={{ display: "flex", gap: "1rem", marginTop: "2rem" }}>
                <Button variant="outline" onClick={() => router.push("/admin/tests")}>Cancel</Button>
                <Button onClick={handleSave} disabled={saving}>
                    {saving ? "Saving..." : "Save Changes"}
                </Button>
            </div>
        </div>
    );
}
