import React from 'react';
import { Users, Star, Trophy } from 'lucide-react';

export const TrustBar = () => {
    const stats = [
        { label: "Trusted Students", value: "125+", icon: <Users className="w-5 h-5" /> },
        { label: "Syllabus Match", value: "90%", icon: <Trophy className="w-5 h-5" /> },
        { label: "Student Rating", value: "4.9/5", icon: <Star className="w-5 h-5" /> },
    ];

    const testimonials = [
        {
            text: "I cleared NCET on my first attempt thanks to their Mock Tests!",
            author: "Rahul S.",
            result: "Selected in GBU"
        },
        {
            text: "The AI strategy told me exactly what to study. Huge time saver!",
            author: "Priya M.",
            result: "98th Percentile"
        },
        {
            text: "Best NCET resource. The mock interface is exactly like the real NTA exam.",
            author: "Ankit K.",
            result: "Top Ranker"
        }
    ];

    return (
        <section className="bg-white py-20 border-b border-zinc-100">
            <div className="container mx-auto px-4">
                {/* Stats Row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-24">
                    {stats.map((stat, index) => (
                        <div key={index} className="flex items-center gap-6 bg-white p-6 rounded-3xl transition-all duration-300 hover:shadow-xl border border-zinc-50 shadow-sm group">
                            <div className="w-14 h-14 bg-zinc-50 text-primary rounded-2xl flex items-center justify-center border border-zinc-100 group-hover:bg-primary group-hover:text-black transition-colors">
                                {stat.icon}
                            </div>
                            <div className="text-left">
                                <div className="text-3xl font-black text-black leading-none mb-1 tracking-tighter">{stat.value}</div>
                                <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400">{stat.label}</div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Testimonials Header */}
                <div className="text-center mb-16">
                    <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-zinc-300 mb-4 divider-text">Student Success Stories</h3>
                    <h2 className="text-3xl md:text-4xl font-black text-black uppercase tracking-tighter italic">Trusted by the best</h2>
                </div>

                {/* Testimonials Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                    {testimonials.map((t, index) => (
                        <div key={index} className="bg-white border border-zinc-100 p-10 rounded-[2.5rem] relative group hover:shadow-2xl transition-all duration-500 shadow-sm">
                            <div className="absolute -top-3 left-10 bg-black text-primary text-[9px] font-black uppercase px-4 py-1.5 rounded-full tracking-widest">
                                {t.result}
                            </div>
                            <p className="text-zinc-600 font-medium text-lg mb-8 leading-relaxed italic">
                                "{t.text}"
                            </p>
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-zinc-100 rounded-full border border-zinc-200 overflow-hidden">
                                    <div className="w-full h-full bg-gradient-to-br from-zinc-200 to-zinc-300" />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-sm font-black uppercase tracking-wider text-black">{t.author}</span>
                                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Aspirant</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};
