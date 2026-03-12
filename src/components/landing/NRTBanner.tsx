"use client";

import React from 'react';
import { BarChart3, Users, Clock, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';

export const NRTBanner = () => {
    return (
        <section className="py-12 bg-white">
            <div className="container mx-auto px-4">
                <div className="relative max-w-6xl mx-auto rounded-[2.5rem] overflow-hidden bg-[#0F172A] border border-white/10 shadow-2xl">
                    {/* Background Decorative Gradient */}
                    <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-rose-500/10 to-transparent pointer-events-none" />
                    
                    <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center p-8 md:p-12 lg:p-16">
                        {/* Left Content */}
                        <div className="lg:col-span-7">
                            <div className="inline-flex items-center px-3 py-1 bg-yellow-400/10 border border-yellow-400/20 rounded-lg mb-6">
                                <span className="text-[10px] font-bold text-yellow-500 uppercase tracking-widest">
                                    Newly Launched
                                </span>
                            </div>

                            <h2 className="text-3xl md:text-5xl font-bold text-white mb-4 leading-tight">
                                NRT: NCET Ready Test – <br />
                                <span className="text-rose-500">The Ultimate Full Mock Exam</span>
                            </h2>

                            <p className="text-zinc-400 text-sm md:text-base max-w-xl mb-10 leading-relaxed">
                                Experience the real exam environment with our newly launched full-length mock test.
                            </p>

                            {/* Features */}
                            <div className="flex flex-wrap gap-6 md:gap-8 mb-10">
                                <div className="flex items-center gap-3">
                                    <div className="w-6 h-6 rounded-full bg-rose-500/20 flex items-center justify-center border border-rose-500/30">
                                        <Clock className="w-3.5 h-3.5 text-rose-500" />
                                    </div>
                                    <span className="text-sm font-medium text-white">160+ Questions</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="w-6 h-6 rounded-full bg-rose-500/20 flex items-center justify-center border border-rose-500/30">
                                        <BarChart3 className="w-3.5 h-3.5 text-rose-500" />
                                    </div>
                                    <span className="text-sm font-medium text-white">Detailed Analytics</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="w-6 h-6 rounded-full bg-rose-500/20 flex items-center justify-center border border-rose-500/30">
                                        <Users className="w-3.5 h-3.5 text-rose-500" />
                                    </div>
                                    <span className="text-sm font-medium text-white">All-India Ranking</span>
                                </div>
                            </div>

                            {/* CTA Section */}
                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 md:gap-10">
                                <Link href="/dashboard/tests">
                                    <Button className="px-8 py-6 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl flex items-center gap-2 group transition-all">
                                        Enroll in NRT Now
                                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                    </Button>
                                </Link>
                                <div>
                                    <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">
                                        Launch Offer
                                    </p>
                                    <p className="text-xl md:text-2xl font-bold text-white">
                                        Get Full Access at just <span className="text-yellow-400">₹249</span>
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Right Content: Visual */}
                        <div className="lg:col-span-5 relative flex justify-center lg:justify-end">
                            <div className="relative w-full max-w-[340px] animate-float">
                                {/* Saving Badge */}
                                <div className="absolute -top-4 -right-4 w-20 h-20 md:w-24 md:h-24 bg-yellow-400 rounded-full flex flex-col items-center justify-center shadow-lg border-4 border-[#0F172A] z-20 transform rotate-12">
                                    <span className="text-[10px] font-black text-[#0F172A] uppercase leading-none">Save</span>
                                    <span className="text-2xl md:text-3xl font-black text-[#0F172A]">60%</span>
                                </div>

                                {/* Tablet Wrapper */}
                                <div className="bg-white rounded-[2rem] p-2 shadow-2xl border-4 border-zinc-200 overflow-hidden">
                                    <div className="rounded-2xl w-full aspect-[3/4] overflow-hidden">
                                        <img 
                                            src="/nrt-dashboard.jpg" 
                                            alt="NRT Performance Dashboard" 
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                </div>

                                {/* Floating Elements decoration */}
                                <div className="absolute -bottom-6 -left-6 w-12 h-12 bg-rose-500/20 rounded-full blur-xl" />
                                <div className="absolute top-1/2 -right-8 w-16 h-16 bg-yellow-400/20 rounded-full blur-2xl" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <style jsx>{`
                @keyframes float {
                    0% { transform: translateY(0px); }
                    50% { transform: translateY(-10px); }
                    100% { transform: translateY(0px); }
                }
                .animate-float {
                    animation: float 4s ease-in-out infinite;
                }
            `}</style>
        </section>
    );
};
