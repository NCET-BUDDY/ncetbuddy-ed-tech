"use client";

import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { useEffect, useState } from "react";
import { getTests, deleteTest, updateTest } from "@/lib/appwrite-db";
import { Test } from "@/types";

export default function AdminTestsPage() {
    const [tests, setTests] = useState<Test[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingTest, setEditingTest] = useState<Test | null>(null);

    useEffect(() => {
        fetchTests();
    }, []);

    const fetchTests = async () => {
        try {
            const data = await getTests();
            const educatorTests = data.filter(t => t.testType === 'educator');
            setTests(educatorTests);
        } catch (error) {
            console.error("Error fetching tests:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this test?")) return;

        try {
            await deleteTest(id);
            setTests(tests.filter(t => t.id !== id));
        } catch (error) {
            console.error("Error deleting test:", error);
            alert("Failed to delete test");
        }
    };

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingTest || !editingTest.id) return;

        try {
            const success = await updateTest(editingTest.id, {
                price: editingTest.price,
                status: editingTest.status,
                series: editingTest.series, // Enable editing stream
                maxSubjectChoices: editingTest.maxSubjectChoices
            });

            if (success) {
                setTests(tests.map(t => t.id === editingTest.id ? editingTest : t));
                setEditingTest(null);
            } else {
                alert("Failed to update test");
            }
        } catch (error) {
            console.error("Error updating test", error);
            alert("Error updating test");
        }
    };

    if (loading) return <div style={{ color: "white", padding: "2rem" }}>Loading tests...</div>;

    return (
        <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
                <h1>Manage Tests</h1>
                <Link href="/admin/tests/create">
                    <Button>Create New Test</Button>
                </Link>
            </div>

            <div style={{ display: "grid", gap: "1.5rem" }}>
                {tests.length === 0 ? (
                    <p style={{ color: "var(--text-secondary)" }}>No tests found. Create one to get started.</p>
                ) : (
                    tests.map((test) => (
                        <Card key={test.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <div>
                                <h3 style={{ fontSize: "1.2rem", marginBottom: "0.5rem" }}>{test.title}</h3>
                                <div style={{ color: "var(--text-secondary)" }}>
                                    <span>{test.duration} mins • {test.questions.length} Questions</span>
                                    <span style={{
                                        marginLeft: "10px",
                                        padding: "2px 8px",
                                        borderRadius: "4px",
                                        backgroundColor: test.status === 'Published' ? '#10b98120' : '#fbbf2420',
                                        color: test.status === 'Published' ? '#10b981' : '#fbbf24',
                                        fontSize: "0.8rem",
                                        fontWeight: "bold"
                                    }}>
                                        {test.status || 'Published'}
                                    </span>
                                    <span style={{ marginLeft: "10px", fontWeight: "bold" }}>
                                        {test.price ? `₹${test.price}` : 'Free'}
                                    </span>
                                </div>
                            </div>
                            <div style={{ display: "flex", gap: "0.5rem" }}>
                                <Button variant="outline" onClick={() => setEditingTest(test)}>Edit</Button>
                                <Button variant="secondary" style={{ backgroundColor: "var(--error)" }} onClick={() => test.id && handleDelete(test.id)}>Delete</Button>
                            </div>
                        </Card>
                    ))
                )}
            </div>

            {/* Edit Modal */}
            {editingTest && (
                <div style={{
                    position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: "rgba(0,0,0,0.8)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 100
                }}>
                    <Card style={{ width: "100%", maxWidth: "500px", position: "relative" }}>
                        <h2 style={{ marginBottom: "1.5rem" }}>Edit Test</h2>
                        <form onSubmit={handleUpdate} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                            <div>
                                <label style={{ display: "block", marginBottom: "0.5rem" }}>Title</label>
                                <input
                                    type="text"
                                    value={editingTest.title}
                                    disabled
                                    style={{ width: "100%", padding: "0.5rem", borderRadius: "0.5rem", backgroundColor: "#f3f4f6", border: "1px solid #d1d5db" }}
                                />
                                <small style={{ color: "gray" }}>Title cannot be changed here.</small>
                            </div>

                            <div>
                                <label style={{ display: "block", marginBottom: "0.5rem" }}>Price (₹)</label>
                                <input
                                    type="number"
                                    min="0"
                                    value={editingTest.price || 0}
                                    onChange={(e) => setEditingTest({ ...editingTest, price: Number(e.target.value) })}
                                    style={{ width: "100%", padding: "0.5rem", borderRadius: "0.5rem", border: "1px solid #d1d5db" }}
                                />
                            </div>

                            <div>
                                <label style={{ display: "block", marginBottom: "0.5rem" }}>Stream / Domain</label>
                                <select
                                    value={editingTest.series || ''}
                                    onChange={(e) => setEditingTest({ ...editingTest, series: e.target.value })}
                                    style={{ width: "100%", padding: "0.5rem", borderRadius: "0.5rem", border: "1px solid #d1d5db" }}
                                >
                                    <option value="">None / General</option>
                                    <option value="Science">Science</option>
                                    <option value="Humanities">Humanities</option>
                                    <option value="Commerce">Commerce</option>
                                </select>
                            </div>

                            <div>
                                <label style={{ display: "block", marginBottom: "0.5rem" }}>Max Subject Choices (Optional)</label>
                                <input
                                    type="number"
                                    value={editingTest.maxSubjectChoices || ''}
                                    onChange={(e) => setEditingTest({ ...editingTest, maxSubjectChoices: parseInt(e.target.value) || undefined })}
                                    placeholder="e.g. 3 for Humanities"
                                    style={{ width: "100%", padding: "0.5rem", borderRadius: "0.5rem", border: "1px solid #d1d5db" }}
                                />
                                <p style={{ fontSize: "0.75rem", color: "#666", marginTop: "0.25rem" }}>
                                    If set, students must pick this many subjects from the test's allocations.
                                </p>
                            </div>

                            <div>
                                <label style={{ display: "block", marginBottom: "0.5rem" }}>Status</label>
                                <select
                                    value={editingTest.status || 'Published'}
                                    onChange={(e) => setEditingTest({ ...editingTest, status: e.target.value as 'Draft' | 'Published' | 'Archived' })}
                                    style={{ width: "100%", padding: "0.5rem", borderRadius: "0.5rem", border: "1px solid #d1d5db" }}
                                >
                                    <option value="Published">Published</option>
                                    <option value="Draft">Draft (Hidden)</option>
                                    <option value="Archived">Archived</option>
                                </select>
                            </div>

                            <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
                                <Button type="submit" style={{ flex: 1 }}>Save Changes</Button>
                                <Button type="button" variant="outline" onClick={() => setEditingTest(null)} style={{ flex: 1 }}>Cancel</Button>
                            </div>
                        </form>
                    </Card>
                </div>
            )}
        </div>
    );
}
