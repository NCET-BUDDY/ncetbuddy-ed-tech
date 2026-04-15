"use client";

import { useEffect, useState } from "react";
import { getAllEducators, getFileViewUrl } from "@/lib/pocketbase-db";
import { Educator } from "@/types";
import Link from "next/link";

export default function LiveClassesHub() {
    const [educators, setEducators] = useState<Educator[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchEducators = async () => {
            setLoading(true);
            try {
                const data = await getAllEducators();
                // Filter only educators who have a youtubeChannelId (optional, but good practice if we want to only show "live ready" educators)
                // For now user said "If no educators configured yet: Show empty state", implies we show all or just those with channels.
                // Re-reading prompt: "Clicking a tile opens that educator’s live classes library".
                // Better to show all for now, or maybe only those with channels if we want to be strict.
                // Let's filter client side or just show all and handle "no channel configured" on the individual page.
                // Prompt says: "If no educators configured yet: Show an empty state". 
                // I will show all fetched educators.
                setEducators(data);
            } catch (error) {
                console.error("Failed to load educators", error);
            } finally {
                setLoading(false);
            }
        };
        fetchEducators();
    }, []);

    const getLogoUrl = (fileId: string) => {
        try {
            return getFileViewUrl('images', fileId).toString();
        } catch {
            return null;
        }
    };

    return (
        <div className="space-y-6 md:space-y-10 animate-in fade-in duration-500 pb-20 md:pb-0">
            {/* Header */}
            <div>
                <h1 className="text-2xl md:text-3xl font-black text-black uppercase tracking-tight italic">Live Classes</h1>
                <p className="text-sm md:text-base text-black font-bold opacity-60">
                    Choose an educator to follow live sessions
                </p>
                <p className="text-[10px] md:text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Powered by YouTube Embed</p>
            </div>

            {/* Educator Grid */}
            <div>
                {loading ? (
                    <div className="flex justify-center py-20">
                        <div className="w-10 h-10 border-4 border-primary border-t-black rounded-full animate-spin"></div>
                    </div>
                ) : educators.length === 0 ? (
                    <div className="text-center py-20 opacity-50 font-bold uppercase tracking-widest">
                        No educators published yet.
                    </div>
                ) : (
                    <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6 md:gap-8">
                        {educators.map((edu) => {
                            const logoUrl = edu.logoFileId ? getLogoUrl(edu.logoFileId) : null;
                            return (
                                <Link
                                    href={`/dashboard/live-classes/${edu.id}`}
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
        </div>
    );
}
