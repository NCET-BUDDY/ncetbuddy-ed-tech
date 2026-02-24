"use client";

import React from 'react';
import { Navbar } from '@/components/landing/Navbar';
import { Footer } from '@/components/landing/Footer';
import { BookOpen, Target, Award, Users } from 'lucide-react';

export default function AboutPage() {
    return (
        <main className="min-h-screen bg-white">
            <Navbar />

            <div className="pt-32 pb-24">
                <div className="container mx-auto px-4">
                    <div className="max-w-4xl mx-auto">
                        <div className="text-center mb-16">
                            <h1 className="text-5xl font-bold text-[#0F172A] mb-6">About NCET Exam</h1>
                            <p className="text-zinc-500 text-xl max-w-2xl mx-auto">Everything you need to know about the National Common Entrance Test for ITEP programs.</p>
                            <div className="h-1.5 w-24 bg-[#fad776] mx-auto mt-8 rounded-full"></div>
                        </div>

                        <div className="prose prose-lg max-w-none text-zinc-600 space-y-12">
                            <section className="bg-zinc-50 p-10 rounded-[2.5rem] border border-zinc-100">
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="w-12 h-12 bg-rose-50 rounded-xl flex items-center justify-center">
                                        <Award className="text-[#E11D48] w-6 h-6" />
                                    </div>
                                    <h2 className="text-3xl font-bold text-[#0F172A] m-0">What is NCET?</h2>
                                </div>
                                <p>
                                    The National Common Entrance Test (NCET) is a national-level examination conducted by the National Testing Agency (NTA) for admission to the 4-Year Integrated Teacher Education Programme (ITEP) in various Central/State Universities and Institutions including IITs, NITs, RIEs, and Government Colleges.
                                </p>
                            </section>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="p-8 rounded-[2rem] border border-zinc-100 hover:shadow-lg transition-all">
                                    <div className="w-12 h-12 bg-[#fad776]/20 rounded-xl flex items-center justify-center mb-6">
                                        <Target className="text-[#0F172A] w-6 h-6" />
                                    </div>
                                    <h3 className="text-xl font-bold text-[#0F172A] mb-4">Exam Purpose</h3>
                                    <p className="text-sm">To identify and nurture future educators by providing a standardized entry point for professional teaching degrees right after Class 12.</p>
                                </div>
                                <div className="p-8 rounded-[2rem] border border-zinc-100 hover:shadow-lg transition-all">
                                    <div className="w-12 h-12 bg-rose-50 rounded-xl flex items-center justify-center mb-6">
                                        <Users className="text-[#E11D48] w-6 h-6" />
                                    </div>
                                    <h3 className="text-xl font-bold text-[#0F172A] mb-4">Eligibility</h3>
                                    <p className="text-sm">Candidates who have passed Class 12 or equivalent examination from a recognized board are eligible to apply for NCET.</p>
                                </div>
                            </div>

                            <section>
                                <h2 className="text-3xl font-bold text-[#0F172A] mb-6">ITEP Advantage</h2>
                                <p className="mb-6">
                                    The Integrated Teacher Education Programme (ITEP) is a flagship program of NCTE under NEP 2020. It allows students to save one year by completing their graduation and B.Ed. in four years instead of the traditional five years (3 years Graduation + 2 years B.Ed.).
                                </p>
                                <ul className="list-disc pl-6 space-y-4">
                                    <li>Dual-major bachelor's degree (BA.BEd / BSc.BEd / BCom.BEd).</li>
                                    <li>In-depth focus on pedagogical skills from day one.</li>
                                    <li>Exposure to multidisciplinary education environments.</li>
                                    <li>Direct path to a teaching career in secondary, middle, or foundational stages.</li>
                                </ul>
                            </section>
                        </div>
                    </div>
                </div>
            </div>

            <Footer />
        </main>
    );
}
