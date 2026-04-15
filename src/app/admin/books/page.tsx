"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Book } from "@/types";
import { getBooks, createBook, deleteBook, updateBook } from "@/lib/pocketbase-db";
import { FileText } from "lucide-react";

export default function BooksManagerPage() {
    const [books, setBooks] = useState<Book[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);

    // Form State
    const [title, setTitle] = useState("");
    const [subject, setSubject] = useState("");
    const [chapter, setChapter] = useState("");
    const [url, setUrl] = useState("");
    const [thumbnailColor, setThumbnailColor] = useState("#fbbf24"); // Default yellow

    useEffect(() => {
        fetchBooks();
    }, []);

    const fetchBooks = async () => {
        try {
            const data = await getBooks();
            setBooks(data);
        } catch (error) {
            console.error("Error fetching books:", error);
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
            await createBook({
                title,
                subject,
                chapter,
                url,
                thumbnailColor,
                isVisible: true,
                createdAt: Math.floor(Date.now() / 1000)
            });
            alert("Book uploaded successfully!");
            setShowForm(false);
            fetchBooks();
            // Reset form
            setTitle("");
            setSubject("");
            setChapter("");
            setUrl("");
        } catch (error) {
            console.error("Error uploading book:", error);
            alert("Failed to upload book.");
        }
    };

    const handleDelete = async (id: string) => {
        if (confirm("Are you sure you want to delete this book?")) {
            try {
                await deleteBook(id);
                fetchBooks();
            } catch (error) {
                console.error("Error deleting book:", error);
            }
        }
    };

    const toggleVisibility = async (book: Book) => {
        if (!book.id) return;
        try {
            await updateBook(book.id, {
                isVisible: !book.isVisible
            });
            fetchBooks();
        } catch (error) {
            console.error("Error updating visibility:", error);
        }
    };

    return (
        <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
                <h1>Books & Notes Manager</h1>
                <Button onClick={() => setShowForm(!showForm)}>
                    {showForm ? "Cancel" : "+ Upload New Note"}
                </Button>
            </div>

            {showForm && (
                <Card style={{ marginBottom: "2rem", border: "1px solid var(--primary)" }}>
                    <h3 style={{ marginBottom: "1.5rem" }}>Upload New Material</h3>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
                        <Input label="Title" placeholder="e.g. Physics Chapter 1 Notes" value={title} onChange={(e) => setTitle(e.target.value)} />
                        <Input label="Subject" placeholder="e.g. Physics" value={subject} onChange={(e) => setSubject(e.target.value)} />
                        <Input label="Chapter (Optional)" placeholder="e.g. Electrostatics" value={chapter} onChange={(e) => setChapter(e.target.value)} />
                        <Input label="File URL (PDF)" placeholder="https://..." value={url} onChange={(e) => setUrl(e.target.value)} />
                    </div>

                    <div style={{ marginTop: "1.5rem" }}>
                        <label style={{ display: "block", marginBottom: "0.5rem", color: "var(--text-secondary)" }}>Thumbnail Color</label>
                        <div style={{ display: "flex", gap: "1rem" }}>
                            {["#fbbf24", "#60a5fa", "#f472b6", "#34d399", "#a78bfa"].map((color) => (
                                <div
                                    key={color}
                                    onClick={() => setThumbnailColor(color)}
                                    style={{
                                        width: "40px",
                                        height: "40px",
                                        borderRadius: "50%",
                                        backgroundColor: color,
                                        cursor: "pointer",
                                        border: thumbnailColor === color ? "3px solid white" : "none"
                                    }}
                                />
                            ))}
                        </div>
                    </div>

                    <div style={{ marginTop: "2rem", display: "flex", justifyContent: "flex-end" }}>
                        <Button onClick={handleUpload}>Upload Material</Button>
                    </div>
                </Card>
            )}

            <div style={{ display: "grid", gap: "1rem" }}>
                {books.map((book) => (
                    <Card key={book.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                            <div style={{ width: "50px", height: "50px", borderRadius: "8px", backgroundColor: book.thumbnailColor, display: "flex", alignItems: "center", justifyContent: "center" }}>
                                <FileText size={24} color="white" />
                            </div>
                            <div>
                                <h3 style={{ fontSize: "1.1rem" }}>{book.title}</h3>
                                <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>
                                    {book.subject} • {book.chapter || "General"}
                                </p>
                            </div>
                        </div>

                        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                            <div
                                style={{
                                    padding: "0.25rem 0.75rem",
                                    borderRadius: "20px",
                                    backgroundColor: book.isVisible ? "rgba(52, 211, 153, 0.2)" : "rgba(255, 255, 255, 0.1)",
                                    color: book.isVisible ? "#34d399" : "var(--text-secondary)",
                                    fontSize: "0.85rem"
                                }}
                            >
                                {book.isVisible ? "Visible" : "Hidden"}
                            </div>
                            <Button variant="outline" onClick={() => toggleVisibility(book)}>
                                {book.isVisible ? "Hide" : "Show"}
                            </Button>
                            <Button variant="secondary" style={{ backgroundColor: "var(--error)" }} onClick={() => book.id && handleDelete(book.id)}>
                                Delete
                            </Button>
                        </div>
                    </Card>
                ))}

                {!loading && books.length === 0 && (
                    <div style={{ textAlign: "center", padding: "3rem", color: "var(--text-secondary)" }}>
                        No books or notes found. Upload one to get started.
                    </div>
                )}
            </div>
        </div>
    );
}
