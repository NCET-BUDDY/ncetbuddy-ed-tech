import React from 'react';

export const StatsBar = () => {
    const stats = [
        { label: "ASPIRANTS JOINED", value: "200+" },
        { label: "SUCCESS RATE", value: "95%" },
        { label: "CURATED CONTENT", value: "EXPERT" },
        { label: "TOP COLLEGES", value: "100+" },
    ];

    return (
        <section className="bg-[#1E293B] py-6 border-y border-white/5">
            <div className="container mx-auto px-4">
                <div className="flex flex-wrap items-center justify-between gap-8 md:gap-4">
                    {stats.map((stat, index) => (
                        <div key={index} className="flex items-center gap-3 flex-1 justify-center min-w-[150px]">
                            <span className="text-2xl font-bold text-[#FBBF24] tracking-tighter">
                                {stat.value}
                            </span>
                            <span className="text-[10px] font-black text-zinc-400 tracking-[0.2em] uppercase">
                                {stat.label}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};
