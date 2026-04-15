"use client";

import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { useEffect, useState } from "react";
import { getTests, deleteTest } from "@/lib/pocketbase-db";
import { Test } from "@/types";

export default function AdminPYQsPage() {
    const [pyqs, setPyqs] = useState<Test[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchPYQs();
    }, []);

    const fetchPYQs = async () => {
        try {
            const data = await getTests();
            // Filter for tests with testType 'pyq' or undefined (legacy)
            // AND strictly exclude any test with 'NRT' in the title (always paid)
            const filteredPYQs = data.filter(t => {
                const isPYQType = !t.testType || t.testType === 'pyq';
                const isNRT = t.title.toUpperCase().includes('NRT');
                return isPYQType && !isNRT;
            });
            setPyqs(filteredPYQs);
        } catch (error) {
            console.error("Error fetching PYQs:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this PYQ?")) return;

        try {
            await deleteTest(id);
            setPyqs(pyqs.filter(p => p.id !== id));
        } catch (error) {
            console.error("Error deleting PYQ:", error);
            alert("Failed to delete PYQ");
        }
    };

    if (loading) return <div style={{ color: "white", padding: "2rem" }}>Loading PYQs...</div>;

    return (
        <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
                <h1>Manage PYQs (Interactive)</h1>
                <Link href="/admin/tests/create?type=pyq">
                    <Button>Create New PYQ</Button>
                </Link>
            </div>

            <div style={{ display: "grid", gap: "1.5rem" }}>
                {pyqs.length === 0 ? (
                    <p style={{ color: "var(--text-secondary)" }}>No interactive PYQs found. Create one to get started.</p>
                ) : (
                    pyqs.map((pyq) => (
                        <Card key={pyq.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <div>
                                <h3 style={{ fontSize: "1.2rem", marginBottom: "0.5rem" }}>{pyq.title}</h3>
                                <div style={{ color: "var(--text-secondary)" }}>
                                    <span>{pyq.duration} mins • {pyq.questions.length} Questions</span>
                                    <span style={{
                                        marginLeft: "10px",
                                        padding: "2px 8px",
                                        borderRadius: "4px",
                                        backgroundColor: 'rgba(16, 185, 129, 0.1)',
                                        color: '#10b981',
                                        fontSize: "0.8rem",
                                        fontWeight: "bold"
                                    }}>
                                        {pyq.pyqSubject || 'General'}
                                    </span>
                                </div>
                            </div>
                            <div style={{ display: "flex", gap: "0.5rem" }}>
                                <Link href={`/admin/tests/edit/${pyq.id}`}>
                                    <Button variant="outline">Edit</Button>
                                </Link>
                                <Button variant="secondary" style={{ backgroundColor: "var(--error)" }} onClick={() => pyq.id && handleDelete(pyq.id)}>Delete</Button>
                            </div>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
}
