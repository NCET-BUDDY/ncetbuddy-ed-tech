import React from 'react';

export const UniversityLogos = () => {
    const logos = [
        "RIE BBSR",
        "IIT ROPAR",
        "IIT JODHPUR",
        "NIT AGARTALA",
        "NIT TRICHY"
    ];

    return (
        <section className="py-20 border-t border-zinc-100 bg-white">
            <div className="container mx-auto px-4">
                <p className="text-center text-[10px] font-black text-zinc-400 uppercase tracking-[0.3em] mb-12">
                    TRUSTED BY TOPPERS AT TOP ITEP INSTITUTIONS
                </p>
                <div className="flex flex-wrap items-center justify-center gap-12 md:gap-20 opacity-40 grayscale hover:grayscale-0 transition-all duration-700">
                    {logos.map((logo, index) => (
                        <span key={index} className="text-2xl font-black text-zinc-800 tracking-tighter hover:text-black transition-colors">
                            {logo}
                        </span>
                    ))}
                </div>
            </div>
        </section>
    );
};
