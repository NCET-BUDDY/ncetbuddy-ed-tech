"use client";

import React from 'react';
import { Navbar } from '@/components/landing/Navbar';
import { Footer } from '@/components/landing/Footer';
import { HelpCircle, Mail, MessageCircle, FileText, ChevronRight } from 'lucide-react';

export default function HelpPage() {
    const faqs = [
        { q: "How do I access the mock tests?", a: "Once you sign up and log in, you can access all your active mock tests from the 'Mock Tests' tab in your dashboard." },
        { q: "Are the notes downloadable?", a: "Yes, our comprehensive notes are available in PDF format and can be downloaded for offline study from the 'Notes' section." },
        { q: "What should I do if my payment fails?", a: "In case of payment failure while the amount is deducted, please wait for 24 hours. If it's not credited back or updated in our dashboard, email us at connect@ncetbuddy.in." },
        { q: "How is AIR ranking calculated?", a: "All India Rank is calculated based on your performance relative to all other aspirants who have taken the same mock test on our platform." },
    ];

    return (
        <main className="min-h-screen bg-white">
            <Navbar />

            <div className="pt-32 pb-24">
                <div className="container mx-auto px-4">
                    <div className="max-w-4xl mx-auto">
                        <div className="text-center mb-16">
                            <h1 className="text-5xl font-bold text-[#0F172A] mb-6">Help Center</h1>
                            <p className="text-zinc-500 text-xl max-w-2xl mx-auto">Found a doubt? We're here to help you get the most out of NCETBuddy.</p>
                            <div className="h-1.5 w-24 bg-[#fad776] mx-auto mt-8 rounded-full"></div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-20">
                            <div className="p-8 rounded-[2rem] border border-zinc-100 bg-zinc-50 flex flex-col items-center text-center">
                                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center mb-6 shadow-sm">
                                    <Mail className="text-[#E11D48] w-6 h-6" />
                                </div>
                                <h3 className="font-bold text-[#0F172A] mb-2">Email Support</h3>
                                <p className="text-xs text-zinc-500 mb-4">Response within 24h</p>
                                <a href="mailto:connect@ncetbuddy.in" className="text-sm font-bold text-[#E11D48] hover:underline">connect@ncetbuddy.in</a>
                            </div>
                            <div className="p-8 rounded-[2rem] border border-zinc-100 bg-zinc-50 flex flex-col items-center text-center">
                                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center mb-6 shadow-sm">
                                    <MessageCircle className="text-[#E11D48] w-6 h-6" />
                                </div>
                                <h3 className="font-bold text-[#0F172A] mb-2">WhatsApp</h3>
                                <p className="text-xs text-zinc-500 mb-4">Fastest response</p>
                                <button className="text-sm font-bold text-[#E11D48] hover:underline">Chat with us</button>
                            </div>
                            <div className="p-8 rounded-[2rem] border border-zinc-100 bg-zinc-50 flex flex-col items-center text-center">
                                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center mb-6 shadow-sm">
                                    <FileText className="text-[#E11D48] w-6 h-6" />
                                </div>
                                <h3 className="font-bold text-[#0F172A] mb-2">Documentation</h3>
                                <p className="text-xs text-zinc-500 mb-4">User guides</p>
                                <button className="text-sm font-bold text-[#E11D48] hover:underline">Read Guides</button>
                            </div>
                        </div>

                        <section>
                            <h2 className="text-3xl font-bold text-[#0F172A] mb-10 flex items-center">
                                <HelpCircle className="mr-4 text-rose-500" /> Frequently Asked Questions
                            </h2>
                            <div className="space-y-4">
                                {faqs.map((faq, index) => (
                                    <details key={index} className="group p-6 border border-zinc-100 rounded-[2rem] hover:border-rose-200 transition-colors">
                                        <summary className="flex items-center justify-between font-bold text-[#0F172A] cursor-pointer list-none">
                                            {faq.q}
                                            <ChevronRight className="w-5 h-5 text-zinc-400 group-open:rotate-90 transition-transform" />
                                        </summary>
                                        <p className="mt-4 text-zinc-500 leading-relaxed pl-0">
                                            {faq.a}
                                        </p>
                                    </details>
                                ))}
                            </div>
                        </section>
                    </div>
                </div>
            </div>

            <Footer />
        </main>
    );
}
