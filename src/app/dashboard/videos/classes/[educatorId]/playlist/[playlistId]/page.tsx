"use client";

import { useEffect, useState, useMemo } from "react";
import { getEducator, getFileViewUrl, getVideoProgress, updateVideoProgress } from "@/lib/pocketbase-db";
import { parseEducatorXml, EducatorCatalog, Module, Video } from "@/lib/xml-parser";
import { Educator } from "@/types";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/Button";
import { useParams } from "next/navigation";
import Link from "next/link";

export default function PlaylistPage() {
    const { user } = useAuth();
    const params = useParams();
    const educatorId = params.educatorId as string;
    const playlistId = params.playlistId as string;

    const [loading, setLoading] = useState(true);
    const [educator, setEducator] = useState<Educator | null>(null);
    const [moduleData, setModuleData] = useState<Module | null>(null);
    const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
    const [progressMap, setProgressMap] = useState<Record<string, boolean>>({});

    useEffect(() => {
        const loadData = async () => {
            if (!educatorId || !playlistId) return;
            setLoading(true);
            try {
                // 1. Get Educator
                const eduDoc = await getEducator(educatorId);
                if (!eduDoc) throw new Error("Educator not found");
                setEducator(eduDoc);

                // 2. Get XML & Find Module
                if (eduDoc.catalogXmlFileId) {
                    const xmlUrl = getFileViewUrl('educator-xmls', eduDoc.catalogXmlFileId);
                    const res = await fetch(xmlUrl.toString());
                    const xmlText = await res.text();
                    const parsed = parseEducatorXml(xmlText);

                    const foundModule = parsed?.modules.find(m => m.id === playlistId);
                    if (foundModule) {
                        setModuleData(foundModule);
                        // Auto-select first video
                        if (foundModule.videos.length > 0) {
                            setSelectedVideo(foundModule.videos[0]);
                        }
                    }
                }

                // 3. Get Progress (if user logged in)
                if (user) {
                    const prog = await getVideoProgress(user.$id, educatorId);
                    const pMap: Record<string, boolean> = {};
                    prog.forEach(p => { if (p.watched) pMap[p.videoId] = true; });
                    setProgressMap(pMap);
                }

            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [educatorId, playlistId, user]);

    // Actions
    const markAsWatched = async (vid: Video) => {
        if (!user || !educator) return;
        setProgressMap(prev => ({ ...prev, [vid.id]: true }));
        try {
            await updateVideoProgress(user.$id, educator.id, vid.id, true);
        } catch (e) { console.error(e); }
    };

    const handleNext = () => {
        if (!moduleData || !selectedVideo) return;
        const idx = moduleData.videos.findIndex(v => v.id === selectedVideo.id);
        if (idx >= 0 && idx < moduleData.videos.length - 1) {
            setSelectedVideo(moduleData.videos[idx + 1]);
        }
    };

    if (loading) return (
        <div className="flex justify-center items-center py-20">
            <div className="w-12 h-12 border-4 border-primary border-t-black rounded-full animate-spin"></div>
        </div>
    );

    if (!moduleData || !educator) return <div className="p-10 text-center font-bold">Playlist not found.</div>;

    return (
        <div className="space-y-6 pb-20 animate-in fade-in duration-500">
            {/* Header / Breadcrumb */}
            <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-black/50">
                <Link href="/dashboard/videos" className="hover:text-black hover:underline">Videos</Link>
                <span>/</span>
                <Link href={`/dashboard/videos/classes/${educatorId}`} className="hover:text-black hover:underline">{educator.name}</Link>
                <span>/</span>
                <span className="text-black">{moduleData.title}</span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8">
                {/* Right Column: Player (moved to top on mobile via order/flex, but grid-col-span-8 suggests it's main) */}
                {/* On Desktop: Player is Left or Right? User said: "click to play on right side or top". 
                    Let's put Player on RIGHT (col-span-8) and List on LEFT (col-span-4) provided current logic.
                    Actually, usually Playlist is on Right (sidebar) and Player on Left (main).
                    But my previous layout was Left: Accordion (List), Right: Player.
                    I'll stick to Player (Left/Main) and Playlist (Right/Sidebar) for better viewing experience?
                    Or adhere to previous: Left: List, Right: Player.
                    Let's do: Main Content (Player) = col-span-8. Sidebar (List) = col-span-4.
                */}

                {/* Video Player Area */}
                <div className="lg:col-span-8 space-y-4">
                    {selectedVideo ? (
                        <div className="bg-white border-2 md:border-4 border-black rounded-2xl md:rounded-3xl overflow-hidden shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] sticky top-24">
                            <div className="relative aspect-video bg-black">
                                <iframe
                                    key={selectedVideo.id} // Force re-render on change
                                    src={`https://www.youtube.com/embed/${selectedVideo.youtubeId}?modestbranding=1&rel=0&autoplay=1`}
                                    className="absolute inset-0 w-full h-full"
                                    allowFullScreen
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                />
                            </div>
                            <div className="p-6 md:p-8">
                                <div className="flex flex-col gap-4">
                                    <div className="flex justify-between items-start gap-4">
                                        <h1 className="text-xl md:text-2xl font-black uppercase italic leading-tight">{selectedVideo.title}</h1>
                                        {selectedVideo.duration && (
                                            <span className="py-1 px-2 bg-gray-100 border border-black rounded text-[10px] font-black uppercase tracking-widest whitespace-nowrap">
                                                {selectedVideo.duration}
                                            </span>
                                        )}
                                    </div>

                                    <div className="flex gap-3 pt-4 border-t border-black/10">
                                        <Button
                                            onClick={() => markAsWatched(selectedVideo)}
                                            disabled={progressMap[selectedVideo.id]}
                                            className={`flex-1 border-2 border-black font-black uppercase tracking-widest text-xs px-4 py-3 ${progressMap[selectedVideo.id] ? 'bg-green-100 text-green-800' : 'bg-white hover:bg-gray-100'}`}
                                        >
                                            {progressMap[selectedVideo.id] ? "✓ Watched" : "Mark Watched"}
                                        </Button>
                                        <Button
                                            onClick={handleNext}
                                            className="flex-1 bg-black text-white hover:bg-primary hover:text-black font-black uppercase tracking-widest text-xs px-6 py-3 border-2 border-black"
                                        >
                                            Next →
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="h-64 flex items-center justify-center border-4 border-dashed border-black/10 rounded-3xl">
                            Select a video
                        </div>
                    )}
                </div>

                {/* Playlist Sidebar */}
                <div className="lg:col-span-4 h-full">
                    <div className="bg-white border-2 border-black rounded-2xl overflow-hidden shadow-sm flex flex-col max-h-[calc(100vh-120px)] sticky top-24">
                        <div className="p-4 bg-gray-50 border-b-2 border-black">
                            <h3 className="font-black uppercase tracking-tight leading-none">{moduleData.title}</h3>
                            <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-1">
                                {Object.keys(progressMap).filter(id => moduleData.videos.some(v => v.id === id)).length} / {moduleData.videos.length} Completed
                            </div>
                        </div>
                        <div className="overflow-y-auto flex-1 p-0">
                            {moduleData.videos.map((vid, idx) => {
                                const isSelected = selectedVideo?.id === vid.id;
                                const isWatched = progressMap[vid.id];
                                return (
                                    <button
                                        key={vid.id}
                                        onClick={() => setSelectedVideo(vid)}
                                        className={`w-full flex items-start gap-3 p-4 text-left transition-colors border-b border-black/5 last:border-0 hover:bg-gray-50 ${isSelected ? 'bg-gray-100 ring-inset ring-2 ring-primary' : ''}`}
                                    >
                                        <span className="text-xs font-black text-gray-400 mt-1 w-4">{idx + 1}</span>
                                        <div className="flex-1">
                                            <div className={`text-sm font-bold leading-tight ${isSelected ? 'text-black' : 'text-gray-700'}`}>
                                                {vid.title}
                                            </div>
                                            <div className="flex items-center gap-2 mt-1">
                                                {vid.duration && <span className="text-[10px] font-mono text-gray-400">{vid.duration}</span>}
                                                {isWatched && <span className="text-[10px] font-bold text-green-600 uppercase tracking-widest">Completed</span>}
                                            </div>
                                        </div>
                                        {isSelected && <div className="w-2 h-2 rounded-full bg-black mt-1.5 shrink-0 animate-pulse"></div>}
                                    </button>
                                )
                            })}
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
