"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { PYQ } from "@/types";
import { getPYQs, createPYQ, deletePYQ } from "@/lib/appwrite-db";

export default function PYQManagerPage() {
    const [pyqs, setPyqs] = useState<PYQ[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);

    // Form State
    const [title, setTitle] = useState("");
    const [subject, setSubject] = useState("");
    const [year, setYear] = useState(new Date().getFullYear());
    const [url, setUrl] = useState("");

    useEffect(() => {
        fetchPyqs();
    }, []);

    const fetchPyqs = async () => {
        try {
            const data = await getPYQs();
            setPyqs(data);
        } catch (error) {
            console.error("Error fetching PYQs:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleUpload = async () => {
        if (!title || !subject || !url) {
            alert("Please fill in all required fields.");
            return;
        }

        try {
            await createPYQ({
                title,
                subject,
                year: Number(year),
                url,
                createdAt: Math.floor(Date.now() / 1000)
            });
            alert("PYQ uploaded successfully!");
            setShowForm(false);
            fetchPyqs();
            // Reset form
            setTitle("");
            setSubject("");
            setUrl("");
        } catch (error) {
            console.error("Error uploading PYQ:", error);
            alert("Failed to upload PYQ.");
        }
    };

    const handleDelete = async (id: string) => {
        if (confirm("Are you sure you want to delete this PYQ?")) {
            try {
                await deletePYQ(id);
                fetchPyqs();
            } catch (error) {
                console.error("Error deleting PYQ:", error);
            }
        }
    };

    return (
        <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
                <h1>PYQ Manager</h1>
                <Button onClick={() => setShowForm(!showForm)}>
                    {showForm ? "Cancel" : "+ Upload New PYQ"}
                </Button>
            </div>

            {showForm && (
                <Card style={{ marginBottom: "2rem", border: "1px solid var(--primary)" }}>
                    <h3 style={{ marginBottom: "1.5rem" }}>Upload Previous Year Question</h3>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
                        <Input label="Title" placeholder="e.g. JEE Main 2023 Shift 1" value={title} onChange={(e) => setTitle(e.target.value)} />
                        <Input label="Subject" placeholder="e.g. Physics / All" value={subject} onChange={(e) => setSubject(e.target.value)} />
                        <Input label="Year" type="number" placeholder="2023" value={year} onChange={(e) => setYear(Number(e.target.value))} />
                        <Input label="PDF URL" placeholder="https://..." value={url} onChange={(e) => setUrl(e.target.value)} />
                    </div>
                    <div style={{ marginTop: "2rem", display: "flex", justifyContent: "flex-end" }}>
                        <Button onClick={handleUpload}>Upload PYQ</Button>
                    </div>
                </Card>
            )}

            <div style={{ display: "grid", gap: "1rem" }}>
                {pyqs.map((pyq) => (
                    <Card key={pyq.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div>
                            <h3 style={{ fontSize: "1.1rem" }}>{pyq.title}</h3>
                            <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>
                                {pyq.subject} • {pyq.year}
                            </p>
                        </div>
                        <div style={{ display: "flex", gap: "1rem" }}>
                            <Button variant="outline" onClick={() => window.open(pyq.url, '_blank')}>View PDF</Button>
                            <Button variant="secondary" style={{ backgroundColor: "var(--error)" }} onClick={() => pyq.id && handleDelete(pyq.id)}>
                                Delete
                            </Button>
                        </div>
                    </Card>
                ))}
                {!loading && pyqs.length === 0 && (
                    <div style={{ textAlign: "center", padding: "3rem", color: "var(--text-secondary)" }}>
                        No PYQs found. Upload one to get started.
                    </div>
                )}
            </div>
        </div>
    );
}
