"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { getBooks, getFormulaCards } from "@/lib/pocketbase-db";
import { Book, FormulaCard } from "@/types";

export default function NotesPage() {
    const [notes, setNotes] = useState<Book[]>([]);
    const [formulas, setFormulas] = useState<FormulaCard[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch Books/Notes
                const booksData = await getBooks();
                setNotes(booksData);

                // Fetch Formula Cards
                const formulaData = await getFormulaCards();
                setFormulas(formulaData);
            } catch (error) {
                console.error("Error fetching study materials:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    if (loading) return <div className="p-8 text-foreground font-bold">Loading study materials...</div>;

    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-5 duration-500">
            <div>
                <h1 className="text-3xl font-black text-foreground">Study Materials</h1>
                <p className="text-foreground font-bold opacity-70">Access curated notes and formula sheets</p>
            </div>

            <section>
                <div className="flex items-center gap-3 mb-6">
                    <div className="h-8 w-2 bg-primary rounded-full"></div>
                    <h2 className="text-xl font-black text-foreground uppercase tracking-widest">Notes</h2>
                </div>
                {notes.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {notes.map((note) => (
                            <Card key={note.id} className="hover:border-primary transition-all border-2 border-black shadow-lg">
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center text-2xl border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                                        📄
                                    </div>
                                    <div>
                                        <h3 className="font-black text-foreground leading-tight">{note.title}</h3>
                                        <p className="text-foreground font-bold text-xs uppercase opacity-60 tracking-tighter">{note.subject}</p>
                                    </div>
                                </div>
                                <a href={note.url} target="_blank" rel="noopener noreferrer">
                                    <Button className="w-full bg-black text-white hover:bg-primary hover:text-black font-black border-2 border-black transition-all">
                                        Open PDF
                                    </Button>
                                </a>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <Card className="border-2 border-dashed border-black bg-white p-12 text-center">
                        <p className="text-foreground font-bold">No notes available yet.</p>
                    </Card>
                )}
            </section>

            <section>
                <div className="flex items-center gap-3 mb-6">
                    <div className="h-8 w-2 bg-black rounded-full"></div>
                    <h2 className="text-xl font-black text-foreground uppercase tracking-widest">Formula Cards</h2>
                </div>
                {formulas.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {formulas.map((formula) => (
                            <Card key={formula.id} className="hover:border-primary transition-all border-2 border-black shadow-lg flex flex-col h-full">
                                <div className="flex-1">
                                    <h3 className="text-lg font-black text-foreground mb-4">{formula.title}</h3>
                                    {formula.content && <p className="text-foreground font-medium mb-4 text-sm opacity-80 whitespace-pre-wrap">{formula.content}</p>}
                                    {formula.imageUrl && (
                                        <div
                                            className={`mb-4 rounded-xl overflow-hidden border-2 border-black ${formula.url ? 'cursor-pointer group/img' : ''}`}
                                            onClick={() => formula.url && window.open(formula.url, '_blank')}
                                        >
                                            <img src={formula.imageUrl} alt={formula.title} className="w-full h-auto object-cover transition-transform group-hover/img:scale-105" />
                                        </div>
                                    )}
                                </div>
                                {formula.url && (
                                    <div className="mt-auto pt-4">
                                        <a href={formula.url} target="_blank" rel="noopener noreferrer">
                                            <Button className="w-full bg-primary text-black hover:bg-black hover:text-white font-black border-2 border-black transition-all">
                                                VIEW FULL SHEET
                                            </Button>
                                        </a>
                                    </div>
                                )}
                            </Card>
                        ))}
                    </div>
                ) : (
                    <Card className="border-2 border-dashed border-black bg-white p-12 text-center">
                        <p className="text-foreground font-bold">No formula cards available yet.</p>
                    </Card>
                )}
            </section>
        </div>
    );
}
