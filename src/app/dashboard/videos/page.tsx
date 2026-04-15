"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { getAllEducators, getUserProfile, getFileViewUrl } from "@/lib/pocketbase-db";
import { Educator } from "@/types";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import Link from "next/link";

// General Videos Data (Hardcoded as requested)
const GENERAL_VIDEOS = [
    {
        id: "gen_1",
        title: "NCET Updates & Guidance",
        youtubeId: "-mlBgihzbg8", // Parsed from url
        url: "https://youtu.be/-mlBgihzbg8?si=T43TUF-QZbwOPxRX",
        duration: "10 min" // Placeholder
    },
    {
        id: "gen_2",
        title: "Important Announcements",
        youtubeId: "f3aBbTVwIjA",
        url: "https://youtu.be/f3aBbTVwIjA?si=LLJuVKGPu1ihTxuJ",
        duration: "15 min"
    },
    {
        id: "gen_3",
        title: "Exam Strategy",
        youtubeId: "w_iv_jBgmxE",
        url: "https://youtu.be/w_iv_jBgmxE?si=XxAOvDhAEn7ToC0O",
        duration: "12 min"
    },
    {
        id: "manual-NnyjilWraUE",
        title: "NCET ITEP 2026 Roadmap | Best Strategy for Every Student",
        youtubeId: "NnyjilWraUE",
        url: "https://youtu.be/NnyjilWraUE",
        duration: "15 min"
    }
];

export default function SimpleVideosPage() {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState<"General" | "Classes">("General");
    const [educators, setEducators] = useState<Educator[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedVideo, setSelectedVideo] = useState<any | null>(null);

    useEffect(() => {
        const fetchEducators = async () => {
            setLoading(true);
            try {
                const allEducators = await getAllEducators();

                // Highlight enrolled educator
                if (user) {
                    const profile = await getUserProfile(user.$id);
                    const enrolledId = profile?.enrolledEducatorId;

                    if (enrolledId) {
                        allEducators.sort((a, b) => {
                            if (a.id === enrolledId) return -1;
                            if (b.id === enrolledId) return 1;
                            return 0; // Keep existing order (alphabetical)
                        });
                    }
                }

                setEducators(allEducators);
            } catch (error) {
                console.error("Failed to load educators", error);
            } finally {
                setLoading(false);
            }
        };

        if (activeTab === "Classes") {
            fetchEducators();
        }
    }, [activeTab, user]);

    const getLogoUrl = (fileId: string) => {
        try {
            return getFileViewUrl('images', fileId).toString();
        } catch {
            return null;
        }
    };

    const handleVideoSelect = (vid: any) => {
        setSelectedVideo(vid);
    };

    return (
        <div className="space-y-6 md:space-y-10 animate-in fade-in duration-500 pb-20 md:pb-0">
            {/* Header */}
            <div>
                <h1 className="text-2xl md:text-3xl font-black text-black uppercase tracking-tight italic">Simple Videos</h1>
                <p className="text-sm md:text-base text-black font-bold opacity-60">
                    {activeTab === "General"
                        ? "Updates about NCET exam & important announcements"
                        : "Educator-specific videos by subject"}
                </p>
            </div>

            {/* Tabs */}
            <div className="flex gap-4 border-b-2 border-black/10 pb-1">
                <button
                    onClick={() => setActiveTab("General")}
                    className={`pb-2 px-2 text-sm md:text-base font-black uppercase tracking-widest transition-all ${activeTab === "General"
                        ? "border-b-4 border-primary text-black translate-y-0.5"
                        : "text-gray-400 hover:text-black border-transparent"
                        }`}
                >
                    General
                </button>
                <button
                    onClick={() => setActiveTab("Classes")}
                    className={`pb-2 px-2 text-sm md:text-base font-black uppercase tracking-widest transition-all ${activeTab === "Classes"
                        ? "border-b-4 border-primary text-black translate-y-0.5"
                        : "text-gray-400 hover:text-black border-transparent"
                        }`}
                >
                    Classes
                </button>
            </div>

            {/* Tab Content */}
            {activeTab === "General" && (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                        {GENERAL_VIDEOS.map((vid) => (
                            <div
                                key={vid.id}
                                className="group relative bg-white border-2 md:border-4 border-black rounded-2xl md:rounded-3xl overflow-hidden hover:shadow-[4px_4px_0px_0px_rgba(255,208,47,1)] md:hover:shadow-[8px_8px_0px_0px_rgba(255,208,47,1)] transition-all cursor-pointer transform hover:-translate-y-1 active:scale-95"
                                onClick={() => handleVideoSelect(vid)}
                            >
                                <div className="aspect-video bg-black relative border-b-2 md:border-b-4 border-black">
                                    <img
                                        src={`https://img.youtube.com/vi/${vid.youtubeId}/hqdefault.jpg`}
                                        alt={vid.title}
                                        className="w-full h-full object-cover group-hover:opacity-40 transition-opacity"
                                    />
                                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all scale-75 group-hover:scale-100">
                                        <div className="w-12 h-12 rounded-full bg-primary border-4 border-black flex items-center justify-center shadow-sm">
                                            <div className="border-t-[8px] border-t-transparent border-l-[12px] border-l-black border-b-[8px] border-b-transparent ml-1"></div>
                                        </div>
                                    </div>
                                </div>
                                <div className="p-4">
                                    <h3 className="font-black text-black text-lg leading-tight uppercase tracking-tight line-clamp-2">{vid.title}</h3>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {activeTab === "Classes" && (
                <div>
                    {loading ? (
                        <div className="flex justify-center py-20">
                            <div className="w-10 h-10 border-4 border-primary border-t-black rounded-full animate-spin"></div>
                        </div>
                    ) : educators.length === 0 ? (
                        <div className="text-center py-20 opacity-50 font-bold uppercase tracking-widest">
                            No educators published yet. Check back soon.
                        </div>
                    ) : (
                        <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6 md:gap-8">
                            {educators.map((edu) => {
                                const logoUrl = edu.logoFileId ? getLogoUrl(edu.logoFileId) : null;
                                return (
                                    <Link
                                        href={`/dashboard/videos/classes/${edu.id}`}
                                        key={edu.id}
                                        className="flex flex-col items-center group"
                                    >
                                        <div className="w-20 h-20 md:w-24 md:h-24 rounded-2xl md:rounded-3xl border-2 md:border-4 border-black overflow-hidden bg-gray-100 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] group-hover:shadow-[4px_4px_0px_0px_rgba(255,208,47,1)] transition-all transform group-hover:-translate-y-1 mb-3">
                                            {logoUrl ? (
                                                <img src={logoUrl} alt={edu.name} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center bg-primary text-2xl font-black">
                                                    {edu.name.substring(0, 2).toUpperCase()}
                                                </div>
                                            )}
                                        </div>
                                        <div className="text-center">
                                            <div className="font-black text-xs md:text-sm uppercase tracking-tight leading-tight group-hover:text-primary transition-colors">{edu.name}</div>
                                            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">{edu.subject}</div>
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* Video Player Modal (Reused) */}
            {selectedVideo && (
                <div
                    className="fixed inset-0 bg-black/90 backdrop-blur-md z-[100] flex items-center justify-center p-4 md:p-6"
                    onClick={() => setSelectedVideo(null)}
                >
                    <div
                        className="w-full max-w-5xl bg-white rounded-2xl md:rounded-3xl overflow-hidden border-2 md:border-4 border-black shadow-lg"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="aspect-video relative bg-black">
                            <iframe
                                src={`https://www.youtube.com/embed/${selectedVideo.youtubeId}?autoplay=1`}
                                className="w-full h-full"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                            />
                        </div>
                        <div className="p-4 flex justify-between items-center bg-white border-t-4 border-black">
                            <h2 className="text-xl font-black uppercase italic">{selectedVideo.title}</h2>
                            <Button onClick={() => setSelectedVideo(null)} className="bg-black text-white hover:bg-red-500 font-bold">CLOSE</Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
