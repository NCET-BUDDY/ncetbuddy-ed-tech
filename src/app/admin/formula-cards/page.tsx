"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { FormulaCard } from "@/types";
import { getFormulaCards, createFormulaCard, deleteFormulaCard, updateFormulaCard } from "@/lib/pocketbase-db";

export default function FormulaCardsManagerPage() {
    const [cards, setCards] = useState<FormulaCard[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);

    // Form State
    const [title, setTitle] = useState("");
    const [subject, setSubject] = useState("");
    const [chapter, setChapter] = useState("");
    const [content, setContent] = useState("");
    const [imageUrl, setImageUrl] = useState("");
    const [url, setUrl] = useState("");

    useEffect(() => {
        fetchCards();
    }, []);

    const fetchCards = async () => {
        try {
            const data = await getFormulaCards();
            setCards(data);
        } catch (error) {
            console.error("Error fetching cards:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async () => {
        if (!title || !subject || (!content && !imageUrl)) {
            alert("Please fill in title, subject, and either content or image URL.");
            return;
        }

        try {
            await createFormulaCard({
                title,
                subject,
                chapter,
                content,
                imageUrl,
                url,
                isVisible: true,
                createdAt: Math.floor(Date.now() / 1000)
            });
            alert("Formula Card created successfully!");
            setShowForm(false);
            fetchCards();
            // Reset form
            setTitle("");
            setSubject("");
            setChapter("");
            setContent("");
            setImageUrl("");
            setUrl("");
        } catch (error) {
            console.error("Error creating card:", error);
            alert("Failed to create card.");
        }
    };

    const handleDelete = async (id: string) => {
        if (confirm("Are you sure you want to delete this card?")) {
            try {
                await deleteFormulaCard(id);
                fetchCards();
            } catch (error) {
                console.error("Error deleting card:", error);
            }
        }
    };

    const toggleVisibility = async (card: FormulaCard) => {
        if (!card.id) return;
        try {
            await updateFormulaCard(card.id, {
                isVisible: !card.isVisible
            });
            fetchCards();
        } catch (error) {
            console.error("Error updating visibility:", error);
        }
    };

    return (
        <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
                <h1>Formula Cards Manager</h1>
                <Button onClick={() => setShowForm(!showForm)}>
                    {showForm ? "Cancel" : "+ Create New Card"}
                </Button>
            </div>

            {showForm && (
                <Card style={{ marginBottom: "2rem", border: "1px solid var(--primary)" }}>
                    <h3 style={{ marginBottom: "1.5rem" }}>Create New Formula Card</h3>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
                        <Input label="Title" placeholder="e.g. Newton's Laws" value={title} onChange={(e) => setTitle(e.target.value)} />
                        <Input label="Subject" placeholder="e.g. Physics" value={subject} onChange={(e) => setSubject(e.target.value)} />
                        <Input label="Chapter (Optional)" placeholder="e.g. Mechanics" value={chapter} onChange={(e) => setChapter(e.target.value)} />
                        <Input label="Image URL (Optional)" placeholder="https://..." value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} />
                        <Input label="External URL (Optional)" placeholder="https://..." value={url} onChange={(e) => setUrl(e.target.value)} />
                    </div>

                    <div style={{ marginTop: "1rem" }}>
                        <label style={{ display: "block", marginBottom: "0.5rem", color: "var(--text-secondary)" }}>Content / Formula (Text)</label>
                        <textarea
                            style={{ width: "100%", padding: "0.75rem", borderRadius: "8px", background: "var(--surface)", color: "white", border: "1px solid #333", minHeight: "100px" }}
                            placeholder="Enter formula or text content here..."
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                        />
                    </div>

                    <div style={{ marginTop: "2rem", display: "flex", justifyContent: "flex-end" }}>
                        <Button onClick={handleCreate}>Create Card</Button>
                    </div>
                </Card>
            )}

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "1.5rem" }}>
                {cards.map((card) => (
                    <Card key={card.id} style={{ display: "flex", flexDirection: "column", height: "100%" }}>
                        <div style={{ flex: 1 }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "1rem" }}>
                                <div>
                                    <h3 style={{ fontSize: "1.1rem", marginBottom: "0.25rem" }}>{card.title}</h3>
                                    <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}>{card.subject} • {card.chapter}</p>
                                </div>
                                <div
                                    style={{
                                        padding: "0.25rem 0.5rem",
                                        borderRadius: "4px",
                                        backgroundColor: card.isVisible ? "rgba(52, 211, 153, 0.2)" : "rgba(255, 255, 255, 0.1)",
                                        color: card.isVisible ? "#34d399" : "var(--text-secondary)",
                                        fontSize: "0.7rem"
                                    }}
                                >
                                    {card.isVisible ? "Visible" : "Hidden"}
                                </div>
                            </div>

                            {card.imageUrl && (
                                <div style={{ marginBottom: "1rem", borderRadius: "8px", overflow: "hidden", height: "150px", backgroundColor: "#000" }}>
                                    {/* Using img tag for external URLs for simplicity in admin panel */}
                                    <img src={card.imageUrl} alt={card.title} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                                </div>
                            )}

                            {card.content && (
                                <p style={{ fontSize: "0.9rem", color: "#e5e7eb", whiteSpace: "pre-wrap", marginBottom: "1rem" }}>
                                    {card.content}
                                </p>
                            )}

                            {card.url && (
                                <p style={{ fontSize: "0.8rem", color: "var(--primary)", marginTop: "0.5rem" }}>
                                    Link: <a href={card.url} target="_blank" rel="noreferrer" style={{ color: "var(--primary)", wordBreak: "break-all" }}>{card.url}</a>
                                </p>
                            )}
                        </div>

                        <div style={{ display: "flex", gap: "0.5rem", marginTop: "1rem", paddingTop: "1rem", borderTop: "1px solid rgba(255,255,255,0.1)" }}>
                            <Button variant="outline" style={{ flex: 1 }} onClick={() => toggleVisibility(card)}>
                                {card.isVisible ? "Hide" : "Show"}
                            </Button>
                            <Button variant="secondary" style={{ flex: 1, backgroundColor: "var(--error)" }} onClick={() => card.id && handleDelete(card.id)}>
                                Delete
                            </Button>
                        </div>
                    </Card>
                ))}
            </div>

            {
                !loading && cards.length === 0 && (
                    <div style={{ textAlign: "center", padding: "3rem", color: "var(--text-secondary)" }}>
                        No formula cards found. Create one to get started.
                    </div>
                )
            }
        </div >
    );
}
