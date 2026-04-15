"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useParams } from "next/navigation";
import { ForumPost, ForumComment as ForumCommentType } from "@/types";
import { getForumPostById, getForumComments, createForumComment, upvoteForumPost } from "@/lib/pocketbase-db";
import CommentCard from "@/components/forum/CommentCard";
import Link from "next/link";

const categoryConfig: Record<string, { label: string; icon: string; color: string }> = {
    'General': { label: 'General', icon: '💬', color: 'bg-blue-100 text-blue-800 border-blue-300' },
    'Doubt': { label: 'Doubt', icon: '❓', color: 'bg-red-100 text-red-800 border-red-300' },
    'Exam Update': { label: 'Exam Update', icon: '📢', color: 'bg-orange-100 text-orange-800 border-orange-300' },
    'Strategy': { label: 'Strategy', icon: '💡', color: 'bg-green-100 text-green-800 border-green-300' },
};

function timeAgo(timestamp: number): string {
    const now = Math.floor(Date.now() / 1000);
    const diff = now - timestamp;
    if (diff < 60) return 'just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
    return new Date(timestamp * 1000).toLocaleDateString();
}

export default function PostDetailPage() {
    const { user } = useAuth();
    const params = useParams();
    const postId = params.postId as string;

    const [post, setPost] = useState<ForumPost | null>(null);
    const [comments, setComments] = useState<ForumCommentType[]>([]);
    const [loading, setLoading] = useState(true);
    const [commentText, setCommentText] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const [postData, commentsData] = await Promise.all([
                    getForumPostById(postId), getForumComments(postId),
                ]);
                setPost(postData);
                setComments(commentsData);
            } catch (error) { console.error("Error loading post:", error); }
            finally { setLoading(false); }
        };
        if (postId) fetchData();
    }, [postId]);

    const handleSubmitComment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !commentText.trim() || !postId) return;
        setSubmitting(true);
        try {
            await createForumComment({
                postId, userId: user.$id, authorName: user.name || 'Anonymous',
                content: commentText.trim(),
            });
            setCommentText('');
            const updatedComments = await getForumComments(postId);
            setComments(updatedComments);
        } catch (error) { console.error("Error submitting comment:", error); }
        finally { setSubmitting(false); }
    };

    const handleUpvote = async () => {
        if (!post?.id) return;
        const newUpvotes = await upvoteForumPost(post.id);
        setPost(prev => prev ? { ...prev, upvotes: newUpvotes } : null);
    };

    if (loading) {
        return (
            <div className="pb-24 min-h-full animate-pulse">
                <div className="h-6 w-32 bg-gray-200 rounded-full mb-6" />
                <div className="p-1 rounded-3xl bg-gray-100">
                    <div className="bg-white rounded-[20px] p-6 border border-border space-y-4">
                        <div className="h-5 w-24 bg-gray-200 rounded-full" />
                        <div className="h-7 w-3/4 bg-gray-200 rounded-full" />
                        <div className="h-4 w-full bg-gray-200 rounded-full" />
                        <div className="h-4 w-2/3 bg-gray-200 rounded-full" />
                    </div>
                </div>
            </div>
        );
    }

    if (!post) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-4"><span className="text-4xl">😕</span></div>
                <h3 className="text-lg font-black text-black uppercase tracking-tight">Post not found</h3>
                <p className="text-sm text-secondary font-medium mt-1">This discussion may have been deleted.</p>
                <Link href="/dashboard/forum" className="mt-4 px-6 py-3 bg-primary border-2 border-black rounded-2xl font-black text-sm uppercase text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all">
                    ← Back to Forum
                </Link>
            </div>
        );
    }

    const cat = categoryConfig[post.category] || categoryConfig['General'];

    return (
        <div className="pb-24 min-h-full">
            <Link href="/dashboard/forum" className="inline-flex items-center gap-2 text-sm font-black text-black/50 hover:text-black uppercase tracking-tight mb-6 transition-colors group">
                <span className="group-hover:-translate-x-1 transition-transform">←</span> Back to Forum
            </Link>
            <div className="p-1 rounded-3xl bg-gray-100 mb-8">
                <div className="relative bg-card rounded-[20px] p-5 md:p-7 border border-border">
                    <div className="flex items-center justify-between mb-4">
                        <span className={`text-[10px] md:text-xs font-black uppercase tracking-wider px-3 py-1 rounded-full border ${cat.color}`}>{cat.icon} {cat.label}</span>
                        <span className="text-[10px] md:text-xs text-black/40 font-bold uppercase tracking-widest">{timeAgo(post.createdAt)}</span>
                    </div>
                    <h1 className="text-lg md:text-xl font-black text-black leading-snug mb-3">{post.title}</h1>
                    <p className="text-sm md:text-base text-black/70 font-medium leading-relaxed whitespace-pre-wrap">{post.content}</p>
                    <div className="flex items-center justify-between pt-5 mt-5 border-t border-border">
                        <div className="flex items-center gap-2.5">
                            <div className="w-9 h-9 rounded-full bg-primary/20 border-2 border-primary/30 flex items-center justify-center text-sm font-black text-black shadow-sm">{post.authorName?.charAt(0)?.toUpperCase() || '?'}</div>
                            <div>
                                <span className="text-sm font-black text-black block">{post.authorName || 'Anonymous'}</span>
                                <span className="text-[10px] text-black/40 font-bold uppercase tracking-widest">Author</span>
                            </div>
                        </div>
                        <button onClick={handleUpvote}
                            className="flex items-center gap-1.5 px-4 py-2 rounded-xl border-2 border-black/10 text-secondary hover:border-primary hover:bg-primary/10 hover:text-black transition-all font-bold text-sm active:scale-90">
                            <span>🔥</span>{post.upvotes}
                        </button>
                    </div>
                </div>
            </div>
            <div>
                <h2 className="text-sm font-black text-black uppercase tracking-widest mb-4 opacity-40">Comments ({comments.length})</h2>
                <form onSubmit={handleSubmitComment} className="mb-6">
                    <div className="flex gap-3">
                        <div className="w-9 h-9 rounded-full bg-primary/20 border-2 border-primary/30 flex items-center justify-center text-sm font-black text-black flex-shrink-0 shadow-sm">{user?.name?.charAt(0)?.toUpperCase() || '?'}</div>
                        <div className="flex-1">
                            <textarea value={commentText} onChange={(e) => setCommentText(e.target.value)} placeholder="Write a comment..." rows={2}
                                className="w-full px-4 py-3 rounded-xl border-2 border-black/10 bg-white text-black font-medium text-sm placeholder:text-black/30 focus:border-black focus:outline-none focus:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all resize-none" />
                            <div className="flex justify-end mt-2">
                                <button type="submit" disabled={submitting || !commentText.trim()}
                                    className="px-5 py-2.5 bg-black text-white font-black text-xs uppercase tracking-wider rounded-xl border-2 border-black hover:bg-primary hover:text-black transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed shadow-[3px_3px_0px_0px_rgba(255,208,47,1)] disabled:shadow-none">
                                    {submitting ? 'Posting...' : 'Reply'}
                                </button>
                            </div>
                        </div>
                    </div>
                </form>
                <div className="space-y-3">
                    {comments.length === 0 ? (
                        <div className="text-center py-10"><span className="text-3xl block mb-2">🤫</span><p className="text-sm font-bold text-secondary">No comments yet. Be the first to reply!</p></div>
                    ) : comments.map((comment) => (
                        <CommentCard key={comment.id} comment={comment} />
                    ))}
                </div>
            </div>
        </div>
    );
}
