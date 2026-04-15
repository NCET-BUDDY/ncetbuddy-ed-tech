"use client";

import { useEffect, useState } from "react";
import { account } from "@/lib/appwrite-educator";
import { useRouter } from "next/navigation";
import { Models } from "appwrite";
import { getEducatorStats, getEducatorVideos, createEducatorVideo, deleteEducatorVideo } from "@/lib/pocketbase-db";
import { EducatorStats, EducatorVideo } from "@/types";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export default function EducatorDashboard() {
    const router = useRouter();
    const [user, setUser] = useState<Models.User<Models.Preferences> | null>(null);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<EducatorStats>({ totalRevenue: 0, totalSales: 0, recentSales: [] });
    const [videos, setVideos] = useState<EducatorVideo[]>([]);

    // Video Form State
    const [newVideoUrl, setNewVideoUrl] = useState("");
    const [newVideoTitle, setNewVideoTitle] = useState("");
    const [videoTarget, setVideoTarget] = useState<"student" | "educator">("student"); // Assuming target audience if needed, or simple list
    const [addingVideo, setAddingVideo] = useState(false);

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const userData = await account.get();
                // const prefs = await account.getPrefs(); 
                // if (prefs.role !== "educator") ... (skip stricter check for now or implement if needed)

                setUser(userData);

                // Fetch Data
                // Note: userData.$id is the Auth ID. 
                // We use it as educatorId for videos and stats.
                const [fetchedStats, fetchedVideos] = await Promise.all([
                    getEducatorStats(userData.$id),
                    getEducatorVideos(userData.$id)
                ]);

                setStats(fetchedStats);
                setVideos(fetchedVideos);

            } catch (err) {
                console.error("Not authenticated", err);
                router.push("/educator/login");
            } finally {
                setLoading(false);
            }
        };

        checkAuth();
    }, [router]);

    const handleLogout = async () => {
        try {
            await account.deleteSession("current");
            router.push("/");
        } catch (err) {
            console.error("Logout failed", err);
        }
    };

    const handleAddVideo = async () => {
        if (!user || !newVideoUrl || !newVideoTitle) return;
        setAddingVideo(true);
        try {
            await createEducatorVideo({
                educatorId: user.$id,
                title: newVideoTitle,
                url: newVideoUrl,
                createdAt: Math.floor(Date.now() / 1000)
            });

            // Refresh videos
            const updatedVideos = await getEducatorVideos(user.$id);
            setVideos(updatedVideos);

            // Reset form
            setNewVideoTitle("");
            setNewVideoUrl("");
        } catch (error) {
            console.error("Failed to add video", error);
            alert("Failed to add video. Please try again.");
        } finally {
            setAddingVideo(false);
        }
    };

    const handleDeleteVideo = async (id: string) => {
        if (!confirm("Are you sure you want to delete this video?")) return;
        try {
            await deleteEducatorVideo(id);
            setVideos(videos.filter(v => v.id !== id));
        } catch (error) {
            console.error("Failed to delete video", error);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-black border-t-transparent"></div>
            </div>
        );
    }

    if (!user) return null;

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-7xl mx-auto space-y-8">

                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-center bg-white p-6 rounded-3xl border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] gap-4">
                    <div>
                        <h1 className="text-3xl font-black uppercase italic tracking-tighter">Educator Dashboard</h1>
                        <p className="font-bold opacity-60">Welcome back, {user.name}</p>
                    </div>
                    <div className="flex gap-4">
                        <button
                            onClick={() => window.open('/dashboard/tests', '_blank')}
                            className="px-6 py-2 bg-white text-black border-2 border-black rounded-xl font-bold uppercase hover:bg-gray-100 transition-colors"
                        >
                            View Student Portal
                        </button>
                        <button
                            onClick={handleLogout}
                            className="px-6 py-2 bg-black text-white rounded-xl font-bold uppercase hover:bg-red-600 transition-colors"
                        >
                            Logout
                        </button>
                    </div>
                </div>

                {/* Sales Analytics */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white p-6 rounded-3xl border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                        <h3 className="font-bold opacity-60 uppercase tracking-widest text-sm mb-2">Total Revenue</h3>
                        <p className="text-4xl font-black text-green-600">₹{stats.totalRevenue.toLocaleString()}</p>
                    </div>
                    <div className="bg-white p-6 rounded-3xl border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                        <h3 className="font-bold opacity-60 uppercase tracking-widest text-sm mb-2">Total Transactions</h3>
                        <p className="text-4xl font-black">{stats.totalSales}</p>
                    </div>
                    <div className="bg-white p-6 rounded-3xl border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                        <h3 className="font-bold opacity-60 uppercase tracking-widest text-sm mb-2">Recent Sale</h3>
                        {stats.recentSales.length > 0 ? (
                            <div>
                                <p className="text-xl font-bold">₹{stats.recentSales[0].amount}</p>
                                <p className="text-sm opacity-60">
                                    {new Date(stats.recentSales[0].createdAt * 1000).toLocaleDateString()}
                                </p>
                            </div>
                        ) : (
                            <p className="text-lg font-bold opacity-50">No sales yet</p>
                        )}
                    </div>
                </div>

                {/* Video Management Section */}
                <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.5fr] gap-8">

                    {/* Add Video Form */}
                    <div className="bg-white p-8 rounded-3xl border-2 border-black h-fit">
                        <h2 className="text-2xl font-black uppercase italic tracking-tighter mb-6">Add New Video</h2>
                        <div className="space-y-4">
                            <Input
                                label="Video Title"
                                placeholder="e.g., Chapter 1: Introduction"
                                value={newVideoTitle}
                                onChange={(e) => setNewVideoTitle(e.target.value)}
                            />
                            <Input
                                label="YouTube URL"
                                placeholder="https://youtube.com/watch?v=..."
                                value={newVideoUrl}
                                onChange={(e) => setNewVideoUrl(e.target.value)}
                            />
                            <Button
                                onClick={handleAddVideo}
                                isLoading={addingVideo}
                                disabled={!newVideoTitle || !newVideoUrl}
                                className="w-full bg-black text-white hover:bg-gray-800"
                            >
                                Publish Video
                            </Button>
                        </div>
                    </div>

                    {/* Video List */}
                    <div className="bg-white p-8 rounded-3xl border-2 border-black">
                        <h2 className="text-2xl font-black uppercase italic tracking-tighter mb-6">Your Videos</h2>
                        {videos.length === 0 ? (
                            <div className="text-center py-12 opacity-50 font-bold border-2 border-dashed border-gray-300 rounded-xl">
                                No videos uploaded yet.
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {videos.map((video) => (
                                    <div key={video.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 border border-gray-200 rounded-xl hover:border-black transition-colors bg-gray-50">
                                        <div className="mb-4 sm:mb-0">
                                            <h3 className="font-bold text-lg">{video.title}</h3>
                                            <a href={video.url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline truncate block max-w-xs">
                                                {video.url}
                                            </a>
                                            <span className="text-xs text-gray-400">
                                                Added: {new Date(video.createdAt * 1000).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <Button
                                            variant="outline"
                                            onClick={() => handleDeleteVideo(video.id)}
                                            className="text-red-600 border-red-200 hover:bg-red-50 hover:border-red-600"
                                        >
                                            Delete
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
}
