import React from 'react';
import { TrendingUp, Users, Award } from 'lucide-react';

export const ResultsStats = () => {
    return (
        <section className="py-24 bg-white overflow-hidden">
            <div className="container mx-auto px-4">
                <div className="text-center mb-20">
                    <h2 className="text-4xl md:text-6xl font-black text-black uppercase tracking-tighter italic mb-6">
                        Results that <span className="text-primary-math">Speak for Themselves</span>
                    </h2>
                    <p className="text-xl text-zinc-600 font-medium max-w-3xl mx-auto">
                        Trusted by thousands of serious NCET aspirants across India. Our data-driven methodology ensures you stay ahead of the curve.
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                    {/* Left: Stats Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div className="bg-zinc-50 p-8 rounded-[2rem] border border-zinc-100 hover:shadow-xl transition-all duration-500 group">
                            <div className="w-12 h-12 bg-primary-math/10 text-primary-math rounded-xl flex items-center justify-center mb-6 group-hover:bg-primary-math group-hover:text-white transition-colors">
                                <Award size={24} />
                            </div>
                            <div className="text-5xl font-black text-black mb-2 tracking-tighter font-mono">1,250+</div>
                            <div className="text-sm font-bold text-zinc-400 uppercase tracking-widest">99+ Percentilers</div>
                        </div>

                        <div className="bg-zinc-50 p-8 rounded-[2rem] border border-zinc-100 hover:shadow-xl transition-all duration-500 group">
                            <div className="w-12 h-12 bg-accent-math/20 text-black rounded-xl flex items-center justify-center mb-6 group-hover:bg-accent-math transition-colors">
                                <Users size={24} />
                            </div>
                            <div className="text-5xl font-black text-black mb-2 tracking-tighter font-mono">45,000+</div>
                            <div className="text-sm font-bold text-zinc-400 uppercase tracking-widest">Active Students</div>
                        </div>

                        <div className="bg-zinc-50 p-8 rounded-[2rem] border border-zinc-100 hover:shadow-xl transition-all duration-500 group">
                            <div className="w-12 h-12 bg-urgency-math/10 text-urgency-math rounded-xl flex items-center justify-center mb-6 group-hover:bg-urgency-math group-hover:text-white transition-colors">
                                <TrendingUp size={24} />
                            </div>
                            <div className="text-5xl font-black text-black mb-2 tracking-tighter font-mono">92%</div>
                            <div className="text-sm font-bold text-zinc-400 uppercase tracking-widest">Success Rate</div>
                        </div>

                        <div className="bg-zinc-50 p-8 rounded-[2rem] border border-zinc-100 bg-black text-white hover:shadow-2xl transition-all duration-500">
                            <div className="text-3xl font-black mb-4 leading-tight uppercase italic">
                                Join the <span className="text-accent-math">Elite League</span>
                            </div>
                            <p className="text-zinc-400 text-sm mb-6">
                                Start your journey to the top ITEP colleges today.
                            </p>
                            <button className="w-full py-4 bg-primary-math text-white font-bold rounded-xl hover:bg-white hover:text-black transition-all uppercase tracking-widest text-xs">
                                Enroll Now
                            </button>
                        </div>
                    </div>

                    {/* Right: Map/Visual Authority */}
                    <div className="relative">
                        <div className="absolute inset-0 bg-primary-math/5 rounded-[3rem] -rotate-3 blur-3xl" />
                        <div className="relative bg-white border border-zinc-100 p-8 rounded-[3rem] shadow-2xl overflow-hidden aspect-square flex items-center justify-center">
                            {/* Representative India Map Mockup using SVG icons and dots */}
                            <div className="relative w-full h-full flex items-center justify-center">
                                <div className="text-zinc-100 select-none">
                                    <svg viewBox="0 0 200 200" className="w-full h-full fill-current">
                                        <path d="M100 20 L120 40 L140 30 L160 50 L150 80 L170 110 L160 140 L130 150 L100 180 L70 150 L40 140 L30 110 L50 80 L40 50 L60 30 L80 40 Z" />
                                    </svg>
                                </div>
                                {/* Pulsing location dots */}
                                <div className="absolute top-1/4 left-1/2 w-3 h-3 bg-primary-math rounded-full animate-ping" />
                                <div className="absolute top-1/3 left-1/3 w-2 h-2 bg-primary-math rounded-full animate-pulse" />
                                <div className="absolute bottom-1/3 right-1/4 w-3 h-3 bg-primary-math rounded-full animate-ping" />
                                <div className="absolute top-1/2 right-1/3 w-2 h-2 bg-primary-math rounded-full animate-pulse" />
                                <div className="absolute bottom-1/4 left-1/2 w-4 h-4 bg-primary-math rounded-full animate-ping" />

                                <div className="absolute inset-x-0 bottom-12 text-center px-8">
                                    <div className="inline-block px-4 py-1 bg-black text-white text-[10px] font-black uppercase tracking-widest rounded-full mb-4">
                                        Student Distribution
                                    </div>
                                    <h3 className="text-2xl font-black text-black uppercase tracking-tighter">
                                        Pan-India Presence
                                    </h3>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};
