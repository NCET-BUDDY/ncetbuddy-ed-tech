"use client";

import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/Button";
import { getForumPosts, getForumComments, createForumComment } from "@/lib/appwrite-db";
import { ForumPost, ForumComment } from "@/types";
import { CreatePostModal } from "@/components/forum/CreatePostModal";
import { Plus, Search, Flame, Smile, Paperclip, Mic, MessageCircle, Lock, ArrowLeft } from "lucide-react";
import Image from "next/image";
import { Badge } from "@/components/ui/Badge";


// Extended type for UI specific fields if needed
interface UIForumPost extends ForumPost {
    isHot?: boolean;
    commentCount?: number;
}

export default function ForumPage() {
    const { user } = useAuth();
    const [posts, setPosts] = useState<UIForumPost[]>([]);
    const [selectedPost, setSelectedPost] = useState<UIForumPost | null>(null);
    const [comments, setComments] = useState<ForumComment[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingComments, setLoadingComments] = useState(false);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [newComment, setNewComment] = useState("");

    // Refs for scrolling
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const fetchPosts = async () => {
        setLoading(true);
        try {
            // Fetch all posts (removed category filter)
            const fetchedPosts = await getForumPosts();

            const uiPosts = fetchedPosts.map(post => ({
                ...post,
                isHot: post.upvotes > 5,
                commentCount: 0
            }));
            setPosts(uiPosts);
        } catch (error) {
            console.error("Error fetching posts:", error);
        } finally {
            setLoading(false);
        }
    };

    // Initial load
    useEffect(() => {
        fetchPosts();
    }, []);

    // Fetch comments when a post is selected
    useEffect(() => {
        if (selectedPost?.id) {
            setLoadingComments(true);
            getForumComments(selectedPost.id)
                .then(data => {
                    setComments(data);
                })
                .catch(err => console.error(err))
                .finally(() => setLoadingComments(false));
        }
    }, [selectedPost]);

    // Scroll to bottom when comments change or post changes
    useEffect(() => {
        if (selectedPost) {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }
    }, [comments, selectedPost]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newComment.trim() || !selectedPost || !user) return;

        const commentContent = newComment;
        setNewComment(""); // Optimistic clear

        try {
            await createForumComment({
                postId: selectedPost.id!,
                userId: user.$id,
                authorName: user.name || "Anonymous",
                content: commentContent
            });

            // Refresh comments
            const updatedComments = await getForumComments(selectedPost.id!);
            setComments(updatedComments);
        } catch (err) {
            console.error("Failed to send comment:", err);
            // Optionally restore text if failed
        }
    };

    const formatDate = (timestamp: number) => {
        const date = new Date(timestamp * 1000);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    return (
        // Wrapper with negative margin to counteract dashboard padding and fill height
        <div className="flex h-[calc(100vh-6rem)] md:h-[calc(100vh-5rem)] -m-4 md:-m-8 md:mt-[-2rem] bg-white overflow-hidden relative">
            <CreatePostModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onPostCreated={fetchPosts}
            />

            {/* Left Sidebar - Chat List */}
            <div className={`
                flex-col w-full md:w-[400px] border-r border-gray-200 bg-white z-10
                ${selectedPost ? 'hidden md:flex' : 'flex'}
            `}>
                {/* Header */}
                <div className="bg-[#f0f2f5] px-4 py-3 border-b border-gray-200 flex justify-between items-center h-16 shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gray-300 overflow-hidden">
                            {/* User Avatar Placeholder */}
                            <div className="w-full h-full flex items-center justify-center bg-gray-400 text-white font-bold">
                                {user?.name?.charAt(0) || 'U'}
                            </div>
                        </div>
                        <h1 className="font-bold text-gray-800">Discussions</h1>
                    </div>
                    <div className="flex gap-3">
                        <Button
                            onClick={() => setIsCreateModalOpen(true)}
                            className="bg-inherit hover:bg-black/10 text-black border-none shadow-none p-2 rounded-full w-10 h-10 flex items-center justify-center font-bold text-xl"
                            title="New Discussion"
                        >
                            <Plus size={22} />
                        </Button>
                    </div>
                </div>

                {/* Search Bar */}
                <div className="p-2 border-b border-gray-200 bg-white">
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Search or start new chat"
                            className="w-full bg-[#f0f2f5] rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#00a884]"
                        />
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">🔍</span>
                    </div>
                </div>

                {/* List of Chats */}
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    {loading ? (
                        <div className="flex items-center justify-center h-20 text-gray-400">Loading...</div>
                    ) : posts.length === 0 ? (
                        <div className="text-center p-8 text-gray-500">
                            No discussions yet. Start one!
                        </div>
                    ) : (
                        posts.map(post => (
                            <div
                                key={post.id}
                                onClick={() => setSelectedPost(post)}
                                className={`
                                    flex cursor-pointer p-3 border-b border-gray-100 hover:bg-[#f5f6f6] transition-colors
                                    ${selectedPost?.id === post.id ? 'bg-[#f0f2f5]' : 'bg-white'}
                                `}
                            >
                                {/* Avatar */}
                                <div className="shrink-0 mr-3">
                                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold text-lg">
                                        {post.authorName ? post.authorName.charAt(0).toUpperCase() : '?'}
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0 flex flex-col justify-center">
                                    <div className="flex justify-between items-baseline mb-1">
                                        <h3 className="text-gray-900 font-medium truncate text-base">
                                            {post.title}
                                        </h3>
                                        <span className="text-xs text-gray-500 whitespace-nowrap ml-2">
                                            {formatDate(post.createdAt)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <p className="text-gray-600 text-sm truncate pr-2 flex items-center gap-1">
                                            <span className="font-semibold text-gray-800">{post.authorName}</span>
                                            {post.category === 'Exam Update' && <Badge variant="admin" className="scale-[0.8] origin-left">Admin</Badge>}
                                            <span className="mx-1 text-gray-400">:</span>
                                            {post.content}
                                        </p>
                                        {post.isHot && (
                                            <span className="shrink-0 bg-red-500 text-white text-[10px] items-center justify-center flex h-4 w-4 rounded-full"><Flame size={10} /></span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Right Panel - Chat Area */}
            <div className={`
                flex-col flex-1 bg-[#efeae2] relative
                ${!selectedPost ? 'hidden md:flex' : 'flex'}
            `}>
                {/* Chat Background Pattern Overlay */}
                <div className="absolute inset-0 opacity-[0.06] pointer-events-none"
                    style={{ backgroundImage: "url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')" }}>
                </div>

                {selectedPost ? (
                    <>
                        {/* Header */}
                        <div className="bg-[#f0f2f5] px-4 py-3 border-b border-gray-200 flex items-center justify-between shrink-0 z-10 h-16">
                            <div className="flex items-center gap-4">
                                {/* Back Button (Mobile only) */}
                                <button
                                    onClick={() => setSelectedPost(null)}
                                    className="md:hidden text-2xl text-[#54656f]"
                                >
                                    <ArrowLeft size={22} />
                                </button>

                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold cursor-pointer">
                                    {selectedPost.authorName?.charAt(0).toUpperCase()}
                                </div>

                                <div className="flex flex-col cursor-pointer">
                                    <div className="flex items-center gap-2">
                                        <span className="text-gray-900 font-medium line-clamp-1">{selectedPost.title}</span>
                                        {selectedPost.category === 'Exam Update' && <Badge variant="admin">Verified Admin</Badge>}
                                    </div>
                                    <span className="text-xs text-gray-500">
                                        {selectedPost.authorName} • {selectedPost.category}
                                    </span>
                                </div>
                            </div>

                            <div className="flex items-center gap-4 text-[#54656f]">
                                <button title="Search" className="hidden sm:block"><Search size={20} /></button>
                                <button title="Menu">⋮</button>
                            </div>
                        </div>

                        {/* Messages List */}
                        <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-4 z-10 custom-scrollbar">

                            {/* Sticky Date/Info Divider (Optional) */}
                            <div className="flex justify-center mb-4">
                                <span className="bg-white/90 shadow-sm px-3 py-1 rounded-lg text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Discussion started
                                </span>
                            </div>

                            {/* The Original Post (as the first message) */}
                            <div className="flex flex-col space-y-1 max-w-[85%] md:max-w-[70%]">
                                <div className={`px-4 py-2 rounded-lg shadow-sm text-gray-900 rounded-tl-none
                                    ${selectedPost.category === 'Exam Update' ? 'bg-blue-50 border-l-4 border-blue-400' : 'bg-white'}
                                `}>
                                    <div className="flex items-center gap-2 mb-1">
                                        <div className="font-bold text-sm text-[#d97c2e]">{selectedPost.authorName}</div>
                                        {selectedPost.category === 'Exam Update' && <Badge variant="admin" className="scale-75 origin-left">Admin</Badge>}
                                    </div>
                                    <div className="whitespace-pre-wrap break-words text-sm md:text-base">
                                        {selectedPost.content}
                                    </div>
                                    <div className="text-[10px] text-gray-500 text-right mt-1 gap-1 flex justify-end items-center">
                                        {formatDate(selectedPost.createdAt)}
                                    </div>
                                </div>
                            </div>

                            {/* Comments */}
                            {comments.map((comment) => {
                                const isMe = comment.userId === user?.$id;
                                return (
                                    <div key={comment.id} className={`flex flex-col space-y-1 max-w-[85%] md:max-w-[70%] ${isMe ? 'self-end items-end' : 'self-start items-start'}`}>
                                        <div className={`px-4 py-2 rounded-lg shadow-sm text-gray-900 break-words text-sm md:text-base
                                            ${isMe
                                                ? 'bg-[#d9fdd3] rounded-tr-none'
                                                : comment.authorName === 'Admin' || comment.authorName.includes('Educator') || selectedPost.category === 'Exam Update'
                                                    ? 'bg-blue-50 border-l-4 border-blue-400 rounded-tl-none'
                                                    : 'bg-white rounded-tl-none'
                                            }
                                        `}>
                                            {!isMe && (
                                                <div className="flex items-center gap-2 mb-1">
                                                    <div className="font-bold text-sm text-[#d97c2e]">{comment.authorName}</div>
                                                    {(comment.authorName === 'Admin' || selectedPost.category === 'Exam Update') && (
                                                        <Badge variant="admin" className="scale-75 origin-left">Verified</Badge>
                                                    )}
                                                </div>
                                            )}
                                            <div className="whitespace-pre-wrap">{comment.content}</div>
                                            <div className="text-[10px] text-gray-500 text-right mt-1 flex justify-end items-center gap-1">
                                                {formatDate(comment.createdAt)}
                                                {isMe && <span className="text-blue-500">✓✓</span>}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}

                            {/* Loading Indicator for comments */}
                            {loadingComments && comments.length === 0 && (
                                <div className="flex justify-center py-4">
                                    <div className="w-6 h-6 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                                </div>
                            )}

                            {/* Invisible div to scroll to */}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input Area */}
                        <div className="bg-[#f0f2f5] px-4 py-3 flex items-center gap-4 z-10 shrink-0">
                            <button className="text-[#54656f] hidden sm:block"><Smile size={24} /></button>
                            <button className="text-[#54656f]"><Paperclip size={24} /></button>
                            <form className="flex-1 flex gap-2" onSubmit={handleSendMessage}>
                                <input
                                    type="text"
                                    value={newComment}
                                    onChange={(e) => setNewComment(e.target.value)}
                                    placeholder="Type a message"
                                    className="flex-1 py-3 px-4 rounded-lg border-none focus:outline-none focus:ring-1 focus:ring-white/50 text-sm md:text-base font-normal shadow-sm"
                                />
                                {newComment.trim() ? (
                                    <button
                                        type="submit"
                                        className="text-[#54656f] hover:text-[#00a884] transition-colors p-2"
                                    >
                                        <svg viewBox="0 0 24 24" height="24" width="24" preserveAspectRatio="xMidYMid meet" className="" version="1.1" x="0px" y="0px" enableBackground="new 0 0 24 24"><path fill="currentColor" d="M1.101,21.757L23.8,12.028L1.101,2.3l0.011,7.912l13.623,1.816L1.112,13.845 L1.101,21.757z"></path></svg>
                                    </button>
                                ) : (
                                    <button type="button" className="text-[#54656f] p-2">
                                        <Mic size={24} />
                                    </button>
                                )}
                            </form>
                        </div>
                    </>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-center p-8 z-10">
                        <div className="w-64 h-64 mb-8 opacity-90 relative">
                            {/* Replaced placeholder icon with provided forum image */}
                            <Image
                                src="/images/forum-community.jpg"
                                alt="Forum Community"
                                fill
                                className="object-contain"
                            />
                        </div>
                        <h2 className="text-3xl text-gray-800 font-light mb-4">NCET Buddy Web</h2>
                        <p className="text-gray-500 text-sm max-w-md">
                            Select a discussion to start chatting. <br />
                            Ask questions, share strategies, and connect with other students.
                        </p>
                        <div className="mt-8 text-xs text-gray-400 flex items-center gap-1">
                            <Lock size={12} /> End-to-end encrypted (just kidding, but it is secure!)
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
