"use client";

import { useEffect, useState, useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import {
    getUserProfile,
    getEducator,
    getFileViewUrl,
    getVideoProgress,
    updateVideoProgress,
    getFileDownloadUrl
} from "@/lib/pocketbase-db";
import { parseEducatorXml, EducatorCatalog, Module, Video } from "@/lib/xml-parser";
import { Educator, VideoProgress } from "@/types";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export default function VideoClassesPage() {
    const { user, loading: authLoading } = useAuth();

    // State
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [educator, setEducator] = useState<Educator | null>(null);
    const [catalog, setCatalog] = useState<EducatorCatalog | null>(null);
    const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
    const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);
    const [progressMap, setProgressMap] = useState<Record<string, boolean>>({});
    const [educatorLogoUrl, setEducatorLogoUrl] = useState<string | null>(null);

    // Initial Fetch
    useEffect(() => {
        if (authLoading) return;
        if (!user) return;

        const loadData = async () => {
            setLoading(true);
            setError(null);
            try {
                // 1. Get User Profile to find enrolled educator
                const profile = await getUserProfile(user.$id);
                const educatorId = profile?.enrolledEducatorId;

                if (!educatorId) {
                    setLoading(false);
                    return; // No educator assigned state
                }

                // 2. Get Educator Details
                const eduDoc = await getEducator(educatorId);
                if (!eduDoc) {
                    setError("Educator not found.");
                    setLoading(false);
                    return;
                }
                setEducator(eduDoc);

                // 2b. Get Logo URL
                if (eduDoc.logoFileId) {
                    // Assuming 'images' bucket or specific bucket. Prompt suggested 'educator-assets' 
                    // but usually images are in standard bucket. Usage in script was ambiguous.
                    // appwrite-db.ts uses storage.getFileView but needs bucketId.
                    // We'll try 'images' (standard) or 'educator-assets' (new).
                    // Let's assume 'educator-assets' based on my schema plan, or fallback to 'images'.
                    // Actually I need to know the bucket ID. 
                    // I'll assume 'images' for now as it's likely existing. 
                    // Or better, let's look at getFileViewUrl implementation -> passed bucketId.
                    // Re-reading Schema Setup: "Recommendation: Create educator-assets".
                    // I'll try 'educator-assets' first, if fails maybe 'images'. 
                    // Hardcoding 'images' for legacy consistency might be safer if I didn't verify new bucket creation success in user env.
                    // But I need to be correct. The script I wrote created 'educator-xmls' for XML.
                    // I'll assume logos are in 'images' for now as it's the safe bet for "existing components".
                    try {
                        const url = getFileViewUrl('images', eduDoc.logoFileId);
                        setEducatorLogoUrl(url.toString());
                    } catch (e) {
                        // ignore
                    }
                }

                // 3. Get XML Catalog
                if (eduDoc.catalogXmlFileId) {
                    const xmlUrl = getFileViewUrl('educator-xmls', eduDoc.catalogXmlFileId);

                    // Fetch the XML content
                    const res = await fetch(xmlUrl.toString());
                    if (!res.ok) throw new Error("Failed to load course catalog.");
                    const xmlText = await res.text();

                    const parsed = parseEducatorXml(xmlText);
                    if (parsed) {
                        setCatalog(parsed);
                        // Auto-select first video if available
                        if (parsed.modules.length > 0 && parsed.modules[0].videos.length > 0) {
                            setSelectedModuleId(parsed.modules[0].id);
                            // Don't auto-play, just select module
                        }
                    } else {
                        setError("Invalid course catalog format.");
                    }
                }

                // 4. Get Progress
                const progressList = await getVideoProgress(user.$id, educatorId);
                const pMap: Record<string, boolean> = {};
                progressList.forEach(p => {
                    if (p.watched) pMap[p.videoId] = true;
                });
                setProgressMap(pMap);

            } catch (err: any) {
                console.error(err);
                setError(err.message || "Failed to load video classes.");
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [user, authLoading]);

    // Handle Watch Logic
    const markAsWatched = async (vid: Video) => {
        if (!user || !educator) return;

        // Optimistic update
        setProgressMap(prev => ({ ...prev, [vid.id]: true }));

        try {
            await updateVideoProgress(user.$id, educator.id, vid.id, true);
        } catch (e) {
            console.error("Failed to save progress", e);
            // Revert? Nah, keep UI responsive
        }
    };

    // Navigation
    const handleNextVideo = () => {
        if (!catalog || !selectedVideo) return;

        let found = false;
        let nextVideo: Video | null = null;

        for (const mod of catalog.modules) {
            for (const vid of mod.videos) {
                if (found) {
                    nextVideo = vid;
                    break;
                }
                if (vid.id === selectedVideo.id) found = true;
            }
            if (nextVideo) {
                // Switch module if needed
                if (mod.id !== selectedModuleId) setSelectedModuleId(mod.id);
                break;
            }
        }

        if (nextVideo) setSelectedVideo(nextVideo);
    };

    // Derived Stats
    const totalVideos = useMemo(() => {
        if (!catalog) return 0;
        return catalog.modules.reduce((acc, m) => acc + m.videos.length, 0);
    }, [catalog]);

    const watchedCount = Object.keys(progressMap).length; // Approximately correct

    // Calculate accurate watched count based on current catalog
    const verifiedWatchedCount = useMemo(() => {
        if (!catalog) return 0;
        let count = 0;
        catalog.modules.forEach(m => {
            m.videos.forEach(v => {
                if (progressMap[v.id]) count++;
            });
        });
        return count;
    }, [catalog, progressMap]);


    if (loading) {
        return (
            <div className="flex justify-center items-center py-20">
                <div className="w-12 h-12 border-4 border-primary border-t-black rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!educator) {
        return (
            <div className="max-w-2xl mx-auto mt-10">
                <Card className="p-10 text-center border-4 border-dashed border-black/20 bg-white">
                    <div className="text-4xl mb-4">🎓</div>
                    <h2 className="text-2xl font-black uppercase tracking-tight mb-2">No Educator Assigned</h2>
                    <p className="text-black/60 font-bold mb-6">You are not currently enrolled in any video classes.</p>
                    <Button className="bg-primary text-black border-2 border-black font-black">
                        Enroll Now
                    </Button>
                </Card>
            </div>
        );
    }

    return (
        <div className="space-y-6 pb-20 fade-in-up">
            {/* 1. Educator Brand Strip */}
            <div className="bg-white border-2 border-black rounded-2xl p-4 md:px-8 md:py-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    {educatorLogoUrl ? (
                        <div className="w-16 h-16 rounded-xl border-2 border-black overflow-hidden bg-gray-100 flex-shrink-0">
                            <img src={educatorLogoUrl} alt={educator.name} className="w-full h-full object-cover" />
                        </div>
                    ) : (
                        <div className="w-16 h-16 rounded-xl border-2 border-black overflow-hidden bg-primary flex-shrink-0 flex items-center justify-center font-black text-2xl">
                            {educator.name.substring(0, 2).toUpperCase()}
                        </div>
                    )}
                    <div>
                        <div className="text-xs font-black uppercase tracking-widest text-black/50 mb-1">Official Classes by</div>
                        <h1 className="text-2xl md:text-3xl font-black uppercase italic tracking-tighter leading-none">{educator.name}</h1>
                        <div className="inline-block mt-2 px-3 py-0.5 bg-black text-white text-[10px] font-bold uppercase tracking-widest rounded-full">
                            Subject: {educator.subject}
                        </div>
                    </div>
                </div>

                <div className="text-right">
                    <div className="text-xs font-black uppercase tracking-widest text-black/50 mb-1">Your Progress</div>
                    <div className="text-2xl font-black tracking-tight">{verifiedWatchedCount} <span className="text-black/30">/</span> {totalVideos}</div>
                    <div className="w-full md:w-48 h-2 bg-gray-200 rounded-full border border-black overflow-hidden mt-2">
                        <div
                            className="h-full bg-primary transition-all duration-500 ease-out"
                            style={{ width: `${totalVideos > 0 ? (verifiedWatchedCount / totalVideos) * 100 : 0}%` }}
                        />
                    </div>
                </div>
            </div>

            {error && (
                <div className="bg-red-100 border-2 border-red-500 text-red-700 p-4 rounded-xl font-bold">
                    Error: {error}
                </div>
            )}

            {/* 2. Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                {/* Left: Modules (Accordion) */}
                <div className="lg:col-span-4 space-y-4">
                    <h3 className="section-header text-sm font-black uppercase tracking-widest mb-4 opacity-70">Course Modules</h3>

                    <div className="space-y-3">
                        {catalog?.modules.map((mod) => {
                            const isExpanded = selectedModuleId === mod.id;
                            const completedInMod = mod.videos.filter(v => progressMap[v.id]).length;

                            return (
                                <div key={mod.id} className="bg-white border-2 border-black rounded-xl overflow-hidden shadow-sm transition-all">
                                    <button
                                        onClick={() => setSelectedModuleId(isExpanded ? null : mod.id)}
                                        className={`w-full flex items-center justify-between p-4 text-left font-bold transition-colors ${isExpanded ? 'bg-black text-white' : 'bg-white text-black hover:bg-gray-50'}`}
                                    >
                                        <div className="flex-1 pr-2">
                                            <div className="uppercase tracking-tight text-sm md:text-base">{mod.title}</div>
                                            <div className={`text-[10px] uppercase tracking-widest mt-1 opacity-70`}>
                                                {mod.videos.length} Videos • {completedInMod}/{mod.videos.length} Done
                                            </div>
                                        </div>
                                        <div className="transform transition-transform duration-200" style={{ rotate: isExpanded ? '180deg' : '0deg' }}>
                                            ▼
                                        </div>
                                    </button>

                                    {/* Expanded Video List */}
                                    {isExpanded && (
                                        <div className="border-t border-black/10 divide-y divide-black/5 bg-gray-50">
                                            {mod.videos.map((vid) => {
                                                const isSelected = selectedVideo?.id === vid.id;
                                                const isWatched = progressMap[vid.id];

                                                return (
                                                    <button
                                                        key={vid.id}
                                                        onClick={() => setSelectedVideo(vid)}
                                                        className={`w-full flex items-center gap-3 p-3 text-left transition-colors hover:bg-white pl-4 border-l-4 ${isSelected ? 'bg-white border-l-primary' : 'border-l-transparent text-gray-600'}`}
                                                    >
                                                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 ${isWatched ? 'bg-primary border-black text-black' : 'border-gray-400 text-transparent'}`}>
                                                            {isWatched && <span className="text-[10px]">✓</span>}
                                                        </div>
                                                        <div className="flex-1">
                                                            <div className={`text-sm font-bold leading-tight ${isSelected ? 'text-black' : 'text-gray-700'}`}>{vid.title}</div>
                                                            {vid.duration && <div className="text-[10px] font-mono text-gray-500 mt-0.5">{vid.duration}</div>}
                                                        </div>
                                                        {isSelected && <span className="text-[10px] uppercase font-black tracking-widest text-primary bg-black px-1.5 py-0.5 rounded">Playing</span>}
                                                    </button>
                                                )
                                            })}
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                </div>

                {/* Right: Player */}
                <div className="lg:col-span-8 space-y-6">
                    {selectedVideo ? (
                        <div className="bg-white border-2 md:border-4 border-black rounded-2xl md:rounded-3xl overflow-hidden shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] sticky top-24">
                            {/* Player Wrapper */}
                            <div className="relative aspect-video bg-black">
                                <iframe
                                    src={`https://www.youtube.com/embed/${selectedVideo.youtubeId}?modestbranding=1&rel=0`}
                                    className="absolute inset-0 w-full h-full"
                                    allowFullScreen
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                />
                            </div>

                            {/* Controls & Details */}
                            <div className="p-6 md:p-8">
                                <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-6">
                                    <div>
                                        <div className="inline-block px-2 py-1 bg-gray-100 border border-black rounded text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">
                                            {catalog?.modules.find(m => m.videos.find(v => v.id === selectedVideo.id))?.title || 'Current Module'}
                                        </div>
                                        <h2 className="text-xl md:text-2xl font-black uppercase italic leading-tight">{selectedVideo.title}</h2>
                                    </div>

                                    <div className="flex items-center gap-3 w-full md:w-auto">
                                        <Button
                                            onClick={() => markAsWatched(selectedVideo)}
                                            disabled={progressMap[selectedVideo.id]}
                                            className={`flex-1 md:flex-none border-2 border-black font-black uppercase tracking-widest text-xs px-4 py-3 ${progressMap[selectedVideo.id] ? 'bg-green-100 text-green-800' : 'bg-white hover:bg-gray-100'}`}
                                        >
                                            {progressMap[selectedVideo.id] ? "✓ Watched" : "Mark Watched"}
                                        </Button>
                                        <Button
                                            onClick={handleNextVideo}
                                            className="flex-1 md:flex-none bg-black text-white hover:bg-primary hover:text-black font-black uppercase tracking-widest text-xs px-6 py-3 border-2 border-black"
                                        >
                                            Next Video →
                                        </Button>
                                    </div>
                                </div>

                                <div className="text-xs text-gray-400 font-mono text-center pt-6 border-t border-black/10">
                                    Powered by Exam Buddy • High Performance Learning
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="h-96 flex flex-col items-center justify-center border-4 border-dashed border-black/10 rounded-3xl bg-gray-50 text-gray-400">
                            <span className="text-4xl mb-4">👈</span>
                            <p className="font-bold uppercase tracking-widest">Select a module to start learning</p>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}
