"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { VideoClass } from "@/types";
import { getVideoClasses, createVideoClass, deleteVideoClass } from "@/lib/pocketbase-db";

import { useAuth } from "@/context/AuthContext";

export default function AdminVideosPage() {
    const { user } = useAuth();
    const [videos, setVideos] = useState<VideoClass[]>([]);
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState({
        title: "",
        description: "",
        url: "",
        duration: 0,
        subject: "General"
    });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchVideos();
    }, []);

    const fetchVideos = async () => {
        try {
            const data = await getVideoClasses();
            setVideos(data);
        } catch (error) {
            console.error("Error fetching videos:", error);
        } finally {
            setLoading(false);
        }
    };

    const extractYouTubeVideoId = (url: string): string | null => {
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
        const match = url.match(regExp);
        return (match && match[2].length === 11) ? match[2] : null;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!user) {
            setError("You must be logged in to add videos.");
            return;
        }

        const videoId = extractYouTubeVideoId(formData.url);
        if (!videoId) {
            setError("Invalid YouTube URL. Please enter a valid YouTube video link.");
            return;
        }

        const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;

        setSaving(true);
        try {
            await createVideoClass({
                title: formData.title,
                description: formData.description || "No description",
                url: formData.url,
                duration: formData.duration || 0,
                videoId: videoId,
                subject: formData.subject,
                authorId: user.$id,
                thumbnailUrl: thumbnailUrl,
            });

            setFormData({ title: "", description: "", url: "", duration: 0, subject: "General" });
            fetchVideos();
            alert("Video added successfully!");
        } catch (error: any) {
            console.error("Error adding video:", error);
            let msg = error.message || "Failed to add video. Check console for details.";
            if (msg.includes("Attribute") || msg.includes("structure") || error.code === 400) {
                msg += " (Hint: You may need to update your database schema. Run 'node scripts/setup-schema.js')";
            }
            setError(msg);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (videoId: string) => {
        if (!confirm("Are you sure you want to delete this video?")) return;

        try {
            await deleteVideoClass(videoId);
            setVideos(videos.filter(v => v.id !== videoId));
        } catch (error) {
            console.error("Error deleting video:", error);
            alert("Failed to delete video.");
        }
    };

    return (
        <div>
            <h1 style={{ marginBottom: "2rem" }}>Video Classes</h1>

            {/* Add Video Form */}
            <Card style={{ marginBottom: "2rem", padding: "1.5rem" }}>
                <h2 style={{ marginBottom: "1.5rem" }}>Add New Video</h2>
                {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
                        <strong className="font-bold">Error: </strong>
                        <span className="block sm:inline">{error}</span>
                    </div>
                )}
                <form onSubmit={handleSubmit}>
                    <div style={{ display: "grid", gap: "1rem", marginBottom: "1rem" }}>
                        <Input
                            label="Video Title"
                            placeholder="e.g., Class 1: Introduction to Physics"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            required
                        />

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                            <select
                                className="w-full px-3 py-2 border rounded-md"
                                value={formData.subject}
                                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                            >
                                <option value="General">General</option>
                                <option value="Physics">Physics</option>
                                <option value="Chemistry">Chemistry</option>
                                <option value="Maths">Maths</option>
                            </select>
                        </div>

                        <Input
                            label="Duration (minutes)"
                            type="number"
                            placeholder="e.g., 45"
                            value={formData.duration || ""}
                            onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) || 0 })}
                            required
                        />
                        <Input
                            label="YouTube URL"
                            placeholder="https://www.youtube.com/watch?v=..."
                            value={formData.url}
                            onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                            required
                        />
                        <Input
                            label="Description (Optional)"
                            placeholder="Brief description of the video content"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        />
                    </div>
                    <Button type="submit" disabled={saving}>
                        {saving ? "Adding..." : "Add Video"}
                    </Button>
                </form>
            </Card>

            {/* Video List */}
            <h2 style={{ marginBottom: "1rem" }}>Existing Videos ({videos.length})</h2>
            <div style={{ display: "grid", gap: "1rem" }}>
                {loading ? (
                    <p style={{ color: "var(--text-secondary)" }}>Loading videos...</p>
                ) : videos.length === 0 ? (
                    <Card style={{ textAlign: "center", padding: "2rem" }}>
                        <p style={{ color: "var(--text-secondary)" }}>No videos added yet.</p>
                    </Card>
                ) : (
                    videos.map((video) => {
                        const videoId = extractYouTubeVideoId(video.url);
                        return (
                            <Card key={video.id} style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
                                <img
                                    src={`https://img.youtube.com/vi/${videoId}/mqdefault.jpg`}
                                    alt={video.title}
                                    style={{ width: "160px", height: "90px", objectFit: "cover", borderRadius: "8px" }}
                                />
                                <div style={{ flex: 1 }}>
                                    <h3 style={{ marginBottom: "0.25rem" }}>{video.title}</h3>
                                    <div className="flex items-center gap-2 text-sm text-gray-500">
                                        <span className="bg-gray-100 px-2 py-0.5 rounded text-xs font-semibold uppercase">{video.subject || 'General'}</span>
                                        <span>•</span>
                                        <span>{video.duration} min</span>
                                    </div>
                                    {video.description && (
                                        <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", marginTop: "0.5rem" }}>
                                            {video.description}
                                        </p>
                                    )}
                                </div>
                                <Button
                                    variant="secondary"
                                    style={{ backgroundColor: "var(--error)" }}
                                    onClick={() => handleDelete(video.id!)}
                                >
                                    Delete
                                </Button>
                            </Card>
                        );
                    })
                )}
            </div>
        </div>
    );
}
