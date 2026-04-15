"use client";

import { useEffect, useState } from "react";
import { getEducator, getFileViewUrl, getEducatorVideos } from "@/lib/pocketbase-db";
import { parseEducatorXml, EducatorCatalog } from "@/lib/xml-parser";
import { Educator, EducatorVideo } from "@/types";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { useParams } from "next/navigation";

export default function EducatorLibraryPage() {
    const params = useParams();
    const educatorId = params.educatorId as string;

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [educator, setEducator] = useState<Educator | null>(null);
    const [catalog, setCatalog] = useState<EducatorCatalog | null>(null);
    const [uploadedVideos, setUploadedVideos] = useState<EducatorVideo[]>([]);
    const [logoUrl, setLogoUrl] = useState<string | null>(null);
    const [selectedVideo, setSelectedVideo] = useState<any | null>(null);

    useEffect(() => {
        const loadData = async () => {
            if (!educatorId) return;
            setLoading(true);
            try {
                // 1. Get Educator
                const eduDoc = await getEducator(educatorId);
                if (!eduDoc) {
                    setError("Educator not found.");
                    return;
                }
                setEducator(eduDoc);

                // 2. Get Logo
                if (eduDoc.logoFileId) {
                    try {
                        const url = getFileViewUrl('images', eduDoc.logoFileId);
                        setLogoUrl(url.toString());
                    } catch (e) {
                        // ignore
                    }
                }

                // 3. Get Catalog
                if (eduDoc.catalogXmlFileId) {
                    const xmlUrl = getFileViewUrl('educator-xmls', eduDoc.catalogXmlFileId);
                    const res = await fetch(xmlUrl.toString());
                    if (!res.ok) throw new Error("Failed to load catalog.");
                    const xmlText = await res.text();
                    const parsed = parseEducatorXml(xmlText);
                    setCatalog(parsed);
                }

            } catch (err: any) {
                setError(err.message || "Error loading library.");
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [educatorId]);

    if (loading) {
        return (
            <div className="flex justify-center items-center py-20">
                <div className="w-12 h-12 border-4 border-primary border-t-black rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!educator) return <div className="p-10 text-center font-bold">Educator not found.</div>;

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-20">
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
                    <div className="text-xs font-black uppercase tracking-widest text-black/50 mb-1">Official Classes by</div>
                    <h1 className="text-2xl md:text-4xl font-black uppercase italic tracking-tighter leading-none mb-2">{educator.name}</h1>
                    <span className="inline-block px-3 py-1 bg-black text-white text-[10px] md:text-xs font-bold uppercase tracking-widest rounded-full">
                        Subject: {educator.subject}
                    </span>
                </div>
            </div>

            {/* Content Sections */}
            <div>
                <h2 className="text-xl font-black uppercase tracking-tight mb-6 flex items-center gap-2">
                    <span>📚</span> Playlists
                </h2>

                {catalog?.modules && catalog.modules.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {catalog.modules.map(mod => (
                            <Link
                                key={mod.id}
                                href={`/dashboard/videos/classes/${educatorId}/playlist/${mod.id}`}
                                className="group block bg-white border-2 border-black rounded-2xl overflow-hidden hover:shadow-[4px_4px_0px_0px_rgba(255,208,47,1)] transition-all transform hover:-translate-y-1"
                            >
                                <div className="h-32 bg-gray-100 border-b-2 border-black flex items-center justify-center relative overlow-hidden">
                                    {/* Placeholder Pattern */}
                                    <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle, #000 1px, transparent 1px)', backgroundSize: '10px 10px' }}></div>
                                    <div className="text-4xl">📺</div>
                                    <div className="absolute bottom-2 right-2 bg-black text-white text-[10px] font-bold px-2 py-1 rounded">
                                        {mod.videos.length} Videos
                                    </div>
                                </div>
                                <div className="p-5">
                                    <h3 className="font-black text-lg leading-tight uppercase tracking-tight group-hover:text-primary transition-colors">{mod.title}</h3>
                                    <p className="text-xs font-bold text-gray-400 mt-2 uppercase tracking-wide">View Full Playlist →</p>
                                </div>
                            </Link>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-10 opacity-50 font-bold uppercase">No playlists found.</div>
                )}
            </div>

            {/* Placeholder for Single Videos if we supported them separately */}
        </div>
    );
}
