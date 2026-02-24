import React from 'react';
import { CheckSquare, BookOpen, FileText } from 'lucide-react';
import Link from 'next/link';

export const FeaturesGrid = () => {
    const features = [
        {
            title: "Full Mock Tests",
            description: "Real exam-simulated environment with AIR rankings and detailed solution analysis for every question.",
            icon: <CheckSquare className="w-6 h-6 text-rose-500" />,
            link: "/dashboard/tests",
            linkText: "View Tests →"
        },
        {
            title: "PYQ Bank",
            description: "Topic-wise categorized previous year questions from 2018-2023 with step-by-step video solutions.",
            icon: <FileText className="w-6 h-6 text-rose-500" />,
            link: "/dashboard/tests/pyq",
            linkText: "Browse PYQs →",
            highlight: true
        },
        {
            title: "Comprehensive Notes",
            description: "Crystal clear concepts through high-quality PDFs curated by top faculty and industry veterans.",
            icon: <BookOpen className="w-6 h-6 text-rose-500" />,
            link: "/dashboard/notes",
            linkText: "Download Notes →"
        },
    ];

    return (
        <section className="py-24 bg-white">
            <div className="container mx-auto px-4">
                <div className="text-center mb-16">
                    <h2 className="text-4xl font-bold text-black mb-4">Our Core Preparation Features</h2>
                    <p className="text-zinc-500">Everything you need to crack the ITEP entrance on your first attempt.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                    {features.map((feature, index) => (
                        <div key={index} className={`relative p-8 rounded-2xl border transition-all duration-300 hover:shadow-xl group ${feature.highlight ? 'border-rose-500 bg-white' : 'border-zinc-100 bg-zinc-50/30'}`}>
                            {feature.highlight && (
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-1 bg-rose-500 rounded-b-full" />
                            )}
                            <div className="w-12 h-12 bg-rose-50 rounded-xl flex items-center justify-center mb-8 border border-rose-100">
                                {feature.icon}
                            </div>
                            <h3 className="text-xl font-bold text-black mb-4">{feature.title}</h3>
                            <p className="text-zinc-500 text-sm leading-relaxed mb-8">{feature.description}</p>
                            <Link href={feature.link} className="text-xs font-bold text-[#E11D48] hover:underline uppercase tracking-widest transition-all group-hover:gap-2 flex items-center">
                                {feature.linkText}
                            </Link>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};
