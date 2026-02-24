"use client";

import React from 'react';
import { Navbar } from '@/components/landing/Navbar';
import { Footer } from '@/components/landing/Footer';
import { Lightbulb, Rocket, Zap, BrainCircuit } from 'lucide-react';

export default function PreparationPage() {
    const steps = [
        { title: "Understand the Blueprint", desc: "Start by thoroughly analyzing the previous year questions (PYQs) to understand the weightage of different topics and the difficulty level.", icon: <BrainCircuit className="w-6 h-6" /> },
        { title: "Concepts First", desc: "Build a strong foundation using our chapter-wise notes. Don't rush into mock tests until your basics are clear for at least 60% of the syllabus.", icon: <Lightbulb className="w-6 h-6" /> },
        { title: "Daily Practice", desc: "Consistency is key. Dedicate at least 2 hours daily to solving domain-specific problems and practicing English comprehension.", icon: <Zap className="w-6 h-6" /> },
        { title: "Simulate & Analyze", desc: "Take full-length mock tests every weekend in an exam-like environment. Spend double the time analyzing your mistakes as you did taking the test.", icon: <Rocket className="w-6 h-6" /> },
    ];

    return (
        <main className="min-h-screen bg-white">
            <Navbar />

            <div className="pt-32 pb-24">
                <div className="container mx-auto px-4">
                    <div className="max-w-4xl mx-auto">
                        <div className="text-center mb-16">
                            <h1 className="text-5xl font-bold text-[#0F172A] mb-6">Preparation Strategy</h1>
                            <p className="text-zinc-500 text-xl max-w-2xl mx-auto">A data-driven roadmap to help you secure a seat in India's top ITEP institutions.</p>
                            <div className="h-1.5 w-24 bg-[#fad776] mx-auto mt-8 rounded-full"></div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-20">
                            {steps.map((step, index) => (
                                <div key={index} className="p-10 rounded-[2.5rem] border border-zinc-100 bg-[#0F172A] text-white hover:shadow-2xl hover:shadow-rose-500/10 transition-all duration-300">
                                    <div className="w-14 h-14 bg-rose-500 rounded-2xl flex items-center justify-center mb-8 shadow-lg shadow-rose-500/20">
                                        {step.icon}
                                    </div>
                                    <h3 className="text-2xl font-bold mb-4">{step.title}</h3>
                                    <p className="text-zinc-400 leading-relaxed">{step.desc}</p>
                                </div>
                            ))}
                        </div>

                        <section className="bg-zinc-50 p-12 rounded-[3rem] border border-zinc-100">
                            <h2 className="text-3xl font-bold text-[#0F172A] mb-8">Expert Tip for 2026</h2>
                            <p className="text-lg text-zinc-600 leading-relaxed mb-6">
                                With the increasing competition for IIT and NIT ITEP programs, "General Awareness" and "Teaching Aptitude" are becoming the real differentiators. Most students score well in Language and Domain subjects, but lose ranks in these two sections. We recommend starting your Teaching Aptitude preparation early to build the right mindset.
                            </p>
                            <div className="flex gap-4">
                                <button className="bg-[#E11D48] text-white px-8 py-4 rounded-xl font-bold hover:bg-[#BE123C] transition-colors">
                                    Start Full Prep
                                </button>
                                <button className="bg-white border border-zinc-200 text-[#0F172A] px-8 py-4 rounded-xl font-bold hover:bg-zinc-100 transition-colors">
                                    Explore Free PYQs
                                </button>
                            </div>
                        </section>
                    </div>
                </div>
            </div>

            <Footer />
        </main>
    );
}
