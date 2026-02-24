"use client";

import React from 'react';
import { Navbar } from '@/components/landing/Navbar';
import { Footer } from '@/components/landing/Footer';
import { MapPin, GraduationCap, Building2, Search } from 'lucide-react';

export default function CollegesPage() {
    const colleges = [
        { name: "IIT Madras", location: "Chennai, Tamil Nadu", type: "IIT" },
        { name: "IIT Kharagpur", location: "Kharagpur, West Bengal", type: "IIT" },
        { name: "NIT Trichy", location: "Tiruchirappalli, Tamil Nadu", type: "NIT" },
        { name: "NIT Warangal", location: "Warangal, Telangana", type: "NIT" },
        { name: "RIE Bhubaneswar", location: "Bhubaneswar, Odisha", type: "RIE" },
        { name: "RIE Mysore", location: "Mysuru, Karnataka", type: "RIE" },
        { name: "RIE Ajmer", location: "Ajmer, Rajasthan", type: "RIE" },
        { name: "RIE Bhopal", location: "Bhopal, Madhya Pradesh", type: "RIE" },
        { name: "Central University of Haryana", location: "Mahendergarh, Haryana", type: "Central Univ" },
        { name: "Central University of Rajasthan", location: "Ajmer, Rajasthan", type: "Central Univ" },
    ];

    return (
        <main className="min-h-screen bg-white">
            <Navbar />

            <div className="pt-32 pb-24">
                <div className="container mx-auto px-4">
                    <div className="max-w-6xl mx-auto">
                        <div className="text-center mb-16">
                            <h1 className="text-5xl font-bold text-[#0F172A] mb-6">Participating Colleges</h1>
                            <p className="text-zinc-500 text-xl max-w-2xl mx-auto">Discover top-tier institutions offering the 4-year Integrated Teacher Education Programme via NCET.</p>
                            <div className="h-1.5 w-24 bg-[#fad776] mx-auto mt-8 rounded-full"></div>
                        </div>

                        <div className="relative mb-12">
                            <div className="flex items-center bg-zinc-50 border border-zinc-100 rounded-2xl px-6 py-4 max-w-2xl mx-auto focus-within:border-rose-500/50 transition-all shadow-sm">
                                <Search className="text-zinc-400 w-5 h-5 mr-4" />
                                <input
                                    type="text"
                                    placeholder="Search by college name or city..."
                                    className="bg-transparent border-none focus:ring-0 w-full text-[#0F172A] placeholder:text-zinc-400"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {colleges.map((college, index) => (
                                <div key={index} className="p-8 rounded-[2rem] border border-zinc-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 bg-white group">
                                    <div className="flex justify-between items-start mb-6">
                                        <div className="w-14 h-14 bg-rose-50 rounded-2xl flex items-center justify-center border border-rose-100 group-hover:bg-[#E11D48] transition-colors duration-300">
                                            <Building2 className="text-[#E11D48] w-7 h-7 group-hover:text-white transition-colors duration-300" />
                                        </div>
                                        <span className="px-4 py-1.5 bg-zinc-50 text-zinc-500 rounded-full text-xs font-bold uppercase tracking-widest border border-zinc-100">
                                            {college.type}
                                        </span>
                                    </div>
                                    <h3 className="text-xl font-bold text-[#0F172A] mb-2">{college.name}</h3>
                                    <div className="flex items-center text-zinc-400 text-sm font-medium">
                                        <MapPin className="w-4 h-4 mr-2" />
                                        {college.location}
                                    </div>
                                    <div className="mt-8 pt-6 border-t border-zinc-50">
                                        <button className="text-[#E11D48] font-bold text-sm hover:underline flex items-center">
                                            View Programs <GraduationCap className="ml-2 w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="mt-20 p-12 rounded-[2.5rem] bg-[#0F172A] text-white overflow-hidden relative">
                            <div className="relative z-10 text-center max-w-2xl mx-auto">
                                <h2 className="text-3xl font-bold mb-6">Can't find your college?</h2>
                                <p className="text-zinc-400 mb-8">NTA releases the final list of participating institutions every year before the registration starts. Stay tuned for the latest 2026 updates.</p>
                                <button className="bg-[#fad776] text-[#0F172A] px-10 py-4 rounded-xl font-bold hover:scale-105 transition-transform">
                                    Get Notified
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <Footer />
        </main>
    );
}
