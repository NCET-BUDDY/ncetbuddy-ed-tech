import React from 'react';
import { Clock } from 'lucide-react';

export const UrgencyBanner = () => {
    return (
        <div className="bg-[#FBBF24] py-3 px-4 sticky top-0 z-[100] overflow-hidden group">
            <div className="container mx-auto flex flex-col sm:flex-row items-center justify-center gap-4 text-center">
                <div className="flex items-center gap-2 text-zinc-900">
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-zinc-900 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-zinc-900"></span>
                    </span>
                    <p className="text-[10px] md:text-sm font-black uppercase tracking-[0.2em]">
                        NCET Buddy ! ATTEMPT YOUR FIRST MOCK NOW
                    </p>
                </div>

                <div className="flex items-center gap-4">
                    <div className="bg-black/10 px-3 py-1 rounded-full border border-black/5 flex items-center gap-2">
                        <Clock size={12} className="text-zinc-900" />
                        <span className="text-[10px] font-black text-zinc-900 uppercase tracking-widest">Only 12 Seats Left</span>
                    </div>
                </div>
            </div>
        </div>
    );
};
