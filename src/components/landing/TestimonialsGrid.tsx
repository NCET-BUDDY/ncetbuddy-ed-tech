import React from 'react';
import { ExternalLink } from 'lucide-react';
import Link from 'next/link';

export const TestimonialsGrid = () => {
    const testimonials = [
        {
            name: "Nikita",
            goal: "ASPIRANT 2026",
            text: "The mock tests on NCETBuddy were the game changer for me. They accurately reflected the real exam's difficulty and pressure.",
            avatar: "/avatars/nikita.png"
        },
        {
            name: "Rocky",
            goal: "ASPIRANT 2026",
            text: "The AI study planner personalized my entire schedule. It knew exactly when I needed to focus on my weak subjects.",
            avatar: "/avatars/rocky.png"
        },
        {
            name: "Devil",
            goal: "ASPIRANT 2026",
            text: "The in-depth analysis of my test performance was incredible. It broke down my speed and accuracy like nothing else.",
            avatar: "/avatars/devil.png"
        },
    ];

    return (
        <section className="py-24 bg-white">
            <div className="container mx-auto px-4">
                <div className="flex justify-between items-end mb-16">
                    <div>
                        <h2 className="text-4xl font-bold text-black mb-4">Student Satisfaction Reviews</h2>
                        <p className="text-zinc-500">Hear from the Students who are doing great prepartion</p>
                    </div>
                    <Link href="/success-stories" className="text-[#E11D48] font-bold flex items-center gap-2 hover:underline">
                        View All Stories <ExternalLink size={18} />
                    </Link>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {testimonials.map((t, index) => (
                        <div key={index} className="bg-zinc-50/50 p-8 rounded-2xl border border-zinc-100 hover:shadow-lg transition-all">
                            <div className="flex items-center gap-4 mb-6">
                                <div className="w-12 h-12 rounded-full bg-zinc-200 overflow-hidden">
                                    {/* Placeholder for avatar */}
                                    <div className="w-full h-full bg-slate-300" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-black">{t.name}</h4>
                                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{t.goal}</p>
                                </div>
                            </div>
                            <p className="text-zinc-600 text-sm leading-relaxed italic">
                                "{t.text}"
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};
