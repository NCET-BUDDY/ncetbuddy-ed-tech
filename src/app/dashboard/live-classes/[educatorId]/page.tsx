"use client";

import { useEffect, useState } from "react";
import { getEducator, getFileViewUrl } from "@/lib/pocketbase-db";
import { Educator } from "@/types";
import { Button } from "@/components/ui/Button";
import { useParams } from "next/navigation";
import Link from "next/link";

interface YouTubeVideo {
    id: string;
    title: string;
    thumbnail: string;
    channelTitle: string;
    publishedAt?: string;
}

export default function EducatorLivePage() {
    const params = useParams();
    const educatorId = params.educatorId as string;

    const [loading, setLoading] = useState(true);
    const [educator, setEducator] = useState<Educator | null>(null);
    const [liveVideo, setLiveVideo] = useState<YouTubeVideo | null>(null);
    const [recentVideos, setRecentVideos] = useState<YouTubeVideo[]>([]);
    const [selectedVideo, setSelectedVideo] = useState<YouTubeVideo | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const loadData = async () => {
            if (!educatorId) return;
            setLoading(true);
            try {
                // 1. Get Educator
                const eduDoc = await getEducator(educatorId);
                if (!eduDoc) throw new Error("Educator not found");
                setEducator(eduDoc);

                // 2. Fetch YouTube Data if channel ID exists
                if (eduDoc.youtubeChannelId) {
                    // Fetch Live Status
                    try {
                        const liveRes = await fetch(`/api/youtube?action=live&channelId=${eduDoc.youtubeChannelId}`);
                        const liveData = await liveRes.json();
                        if (liveData.isLive && liveData.video) {
                            setLiveVideo(liveData.video);
                        }
                    } catch (e) {
                        console.error("Error fetching live status", e);
                    }

                    // Fetch Recent
                    try {
                        const recentRes = await fetch(`/api/youtube?action=recent&channelId=${eduDoc.youtubeChannelId}`);
                        const recentData = await recentRes.json();
                        if (recentData.videos) {
                            setRecentVideos(recentData.videos);
                        }
                    } catch (e) {
                        console.error("Error fetching recent videos", e);
                    }
                }

            } catch (err: any) {
                setError(err.message || "Error loading page.");
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [educatorId]);

    const getLogoUrl = (fileId?: string) => {
        if (!fileId) return null;
        try {
            return getFileViewUrl('images', fileId).toString();
        } catch {
            return null;
        }
    };

    if (loading) return (
        <div className="flex justify-center items-center py-20">
            <div className="w-12 h-12 border-4 border-primary border-t-black rounded-full animate-spin"></div>
        </div>
    );

    if (!educator) return <div className="p-10 text-center font-bold">Educator not found.</div>;

    const logoUrl = getLogoUrl(educator.logoFileId);

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-20">
            {/* Header Breadcrumb */}
            <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-black/50">
                <Link href="/dashboard/live-classes" className="hover:text-black hover:underline">Live Classes</Link>
                <span>/</span>
                <span className="text-black">{educator.name}</span>
            </div>

            {/* Brand Strip */}
            <div className="bg-white border-2 border-black rounded-2xl p-6 md:p-8 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center gap-6">
                <div className="w-20 h-20 md:w-24 md:h-24 rounded-2xl border-2 md:border-4 border-black overflow-hidden bg-gray-100 flex-shrink-0">
                    {logoUrl ? (
                        <img src={logoUrl} alt={educator.name} className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-primary font-black text-2xl">
                            {educator.name.substring(0, 2).toUpperCase()}
                        </div>
                    )}
                </div>
                <div>
                    <div className="text-xs font-black uppercase tracking-widest text-black/50 mb-1">Live Sessions by</div>
                    <h1 className="text-2xl md:text-4xl font-black uppercase italic tracking-tighter leading-none mb-2">{educator.name}</h1>
                    {!educator.youtubeChannelId && (
                        <span className="text-xs font-bold text-red-500 uppercase tracking-widest">
                            YouTube Channel Not Configured
                        </span>
                    )}
                </div>
            </div>

            {/* Content Sections */}
            {educator.youtubeChannelId ? (
                <div className="space-y-10">

                    {/* LIVE NOW SECTION */}
                    {liveVideo && (
                        <div className="space-y-4">
                            <h2 className="text-xl font-black uppercase tracking-tight flex items-center gap-2 text-red-600 animate-pulse">
                                <div className="w-3 h-3 rounded-full bg-red-600"></div>
                                Live Now
                            </h2>
                            <div
                                onClick={() => setSelectedVideo(liveVideo)}
                                className="group cursor-pointer bg-black/5 border-2 border-black rounded-2xl overflow-hidden relative shadow-md hover:shadow-lg transition-all"
                            >
                                <div className="aspect-video md:aspect-[21/9] bg-black relative">
                                    <img
                                        src={liveVideo.thumbnail.replace('mqdefault', 'maxresdefault')}
                                        alt={liveVideo.title}
                                        className="w-full h-full object-cover opacity-80 group-hover:opacity-60 transition-opacity"
                                    />
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="w-16 h-16 rounded-full bg-red-600 border-4 border-white flex items-center justify-center shadow-xl transform group-hover:scale-110 transition-transform">
                                            <div className="border-t-[10px] border-t-transparent border-l-[16px] border-l-white border-b-[10px] border-b-transparent ml-1"></div>
                                        </div>
                                    </div>
                                    <div className="absolute top-4 left-4 bg-red-600 text-white px-3 py-1 rounded text-xs font-black uppercase tracking-widest animate-pulse border border-white/20">
                                        LIVE
                                    </div>
                                </div>
                                <div className="p-4 md:p-6 bg-white">
                                    <h3 className="text-xl md:text-2xl font-black uppercase italic leading-tight">{liveVideo.title}</h3>
                                    <p className="text-sm font-bold text-gray-400 mt-2 uppercase tracking-wide">Click to join live stream</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* RECENT STREAMS SECTION */}
                    <div className="space-y-4">
                        <h2 className="text-xl font-black uppercase tracking-tight flex items-center gap-2">
                            Recent Live Sessions
                        </h2>
                        {recentVideos.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {recentVideos.filter(v => v.id !== liveVideo?.id).map((vid) => (
                                    <div
                                        key={vid.id}
                                        onClick={() => setSelectedVideo(vid)}
                                        className="group cursor-pointer bg-white border-2 border-black rounded-2xl overflow-hidden hover:shadow-[4px_4px_0px_0px_rgba(255,208,47,1)] transition-all transform hover:-translate-y-1"
                                    >
                                        <div className="aspect-video bg-black relative border-b-2 border-black">
                                            <img
                                                src={vid.thumbnail}
                                                alt={vid.title}
                                                className="w-full h-full object-cover group-hover:opacity-80 transition-opacity"
                                            />
                                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all scale-75 group-hover:scale-100">
                                                <div className="w-12 h-12 rounded-full bg-primary border-4 border-black flex items-center justify-center shadow-sm">
                                                    <div className="border-t-[8px] border-t-transparent border-l-[12px] border-l-black border-b-[8px] border-b-transparent ml-1"></div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="p-4">
                                            <h3 className="font-black text-black text-sm lg:text-base leading-tight uppercase tracking-tight line-clamp-2">{vid.title}</h3>
                                            <p className="text-[10px] font-bold text-gray-400 mt-2 uppercase tracking-widest">
                                                {vid.publishedAt ? new Date(vid.publishedAt).toLocaleDateString() : 'Recent'}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-10 opacity-50 font-bold uppercase border-2 border-dashed border-black/20 rounded-2xl">
                                No recent sessions found.
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                <div className="text-center py-20 border-2 border-dashed border-black rounded-3xl bg-gray-50">
                    <div className="text-4xl mb-4">📺</div>
                    <h3 className="font-black text-xl uppercase italic">Channel Unavailable</h3>
                    <p className="font-bold text-gray-400 mt-2">This educator hasn't linked a YouTube channel yet.</p>
                </div>
            )}

            {/* Video Player Modal */}
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
                                src={`https://www.youtube.com/embed/${selectedVideo.id}?autoplay=1`}
                                className="w-full h-full"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                            />
                        </div>
                        <div className="p-4 flex justify-between items-center bg-white border-t-4 border-black">
                            <div>
                                <h2 className="text-lg md:text-xl font-black uppercase italic line-clamp-1">{selectedVideo.title}</h2>
                                {selectedVideo === liveVideo && (
                                    <span className="text-xs font-black text-red-600 uppercase tracking-widest animate-pulse">● LIVE NOW</span>
                                )}
                            </div>
                            <Button onClick={() => setSelectedVideo(null)} className="bg-black text-white hover:bg-red-500 font-bold ml-4 whitespace-nowrap">CLOSE</Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
