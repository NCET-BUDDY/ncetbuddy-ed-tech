"use client";

import { useState } from "react";
import { Dialog } from "@headlessui/react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { createForumPost } from "@/lib/appwrite-db";
import { useAuth } from "@/context/AuthContext";

interface CreatePostModalProps {
    isOpen: boolean;
    onClose: () => void;
    onPostCreated: () => void;
}

export function CreatePostModal({ isOpen, onClose, onPostCreated }: CreatePostModalProps) {
    const { user } = useAuth();
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [category, setCategory] = useState("General");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        setLoading(true);
        try {
            await createForumPost({
                userId: user.$id,
                authorName: user.name || "Anonymous",
                title,
                content,
                category: category as any,
            });
            onPostCreated();
            onClose();
            // Reset form
            setTitle("");
            setContent("");
            setCategory("General");
        } catch (error) {
            console.error("Failed to create post:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onClose={onClose} className="relative z-50">
            {/* The backdrop, rendered as a fixed sibling to the panel container */}
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" aria-hidden="true" />

            {/* Full-screen container to center the panel */}
            <div className="fixed inset-0 flex items-center justify-center p-4">
                <Dialog.Panel className="mx-auto w-full max-w-lg rounded-2xl border-4 border-black bg-white p-8 shadow-[8px_8px_0px_0px_rgba(255,208,47,1)] relative overflow-hidden">

                    <div className="absolute top-0 right-0 p-4 opacity-10 font-black text-9xl pointer-events-none -z-0 rotate-12">
                        ✍️
                    </div>

                    <Dialog.Title className="text-2xl font-black uppercase italic tracking-tighter mb-6 relative z-10">Start a Discussion</Dialog.Title>

                    <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
                        <div>
                            <label className="block text-xs font-black uppercase tracking-widest mb-2 opacity-60">Topic Category</label>
                            <div className="flex gap-2 flex-wrap">
                                {["General", "Doubt", "Strategy", "Exam Update"].map(cat => (
                                    <button
                                        key={cat}
                                        type="button"
                                        onClick={() => setCategory(cat)}
                                        className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider border-2 transition-all flex items-center gap-2
                                            ${category === cat
                                                ? "bg-black text-white border-black transform -translate-y-1 shadow-[4px_4px_0px_0px_rgba(255,208,47,1)]"
                                                : "bg-white text-black/40 border-black/10 hover:border-black hover:text-black"
                                            }`}
                                    >
                                        {cat}
                                        {cat === 'Exam Update' && <Badge variant="admin" className="scale-75 origin-right">Official</Badge>}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-black uppercase tracking-widest mb-2 opacity-60">Title</label>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="What's on your mind?"
                                className="w-full bg-gray-50 border-2 border-black/10 rounded-xl px-4 py-3 font-bold focus:border-black focus:outline-none transition-colors"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-black uppercase tracking-widest mb-2 opacity-60">Content</label>
                            <textarea
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                placeholder="Share your thoughts, doubts, or strategies..."
                                rows={5}
                                className="w-full bg-gray-50 border-2 border-black/10 rounded-xl px-4 py-3 font-medium focus:border-black focus:outline-none transition-colors resize-none"
                                required
                            />
                        </div>

                        <div className="flex justify-end gap-4 pt-4">
                            <Button type="button" onClick={onClose} variant="outline" className="border-2 border-black font-bold uppercase tracking-widest">
                                Cancel
                            </Button>
                            <Button type="submit" disabled={loading} className="bg-primary text-black font-black uppercase tracking-widest border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all">
                                {loading ? "Posting..." : "Post Now 🚀"}
                            </Button>
                        </div>
                    </form>
                </Dialog.Panel>
            </div>
        </Dialog>
    );
}
