import Link from "next/link";
import { Twitter, Youtube, Instagram } from "lucide-react";

export const Footer = () => {
    return (
        <footer className="bg-[#0F172A] pt-24 pb-12 border-t border-white/5">
            <div className="container mx-auto px-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-12 mb-20">
                    {/* Brand Column */}
                    <div className="col-span-2 md:col-span-1">
                        <Link href="/" className="flex items-center gap-2 mb-8">
                            <div className="w-8 h-8 rounded-lg overflow-hidden border border-white/10">
                                <img src="/logo.png" alt="NCETBuddy" className="w-full h-full object-cover" />
                            </div>
                            <span className="text-xl font-bold tracking-tighter text-white">
                                NCET<span className="text-[#E11D48]">Buddy</span>
                            </span>
                        </Link>
                        <p className="text-zinc-500 text-sm leading-relaxed max-w-xs mb-8">
                            India's most specialized preparation platform for the National Common Entrance Test (NCET) for ITEP programs.
                        </p>
                        <div className="flex items-center gap-4">
                            <Link href="#" className="p-2 bg-white/5 rounded-full hover:bg-white/10 transition-colors">
                                <Twitter size={18} className="text-white" />
                            </Link>
                            <Link href="https://www.youtube.com/@NCETBuddy" target="_blank" className="p-2 bg-white/5 rounded-full hover:bg-white/10 transition-colors">
                                <Youtube size={18} className="text-white" />
                            </Link>
                            <Link href="#" className="p-2 bg-white/5 rounded-full hover:bg-white/10 transition-colors">
                                <Instagram size={18} className="text-white" />
                            </Link>
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h4 className="text-white font-bold mb-8 uppercase text-xs tracking-[0.2em]">Quick Links</h4>
                        <ul className="space-y-4">
                            <li><Link href="/mock-tests" className="text-zinc-500 hover:text-white transition-colors text-sm font-medium">Full Mock Tests</Link></li>
                            <li><Link href="/pyqs" className="text-zinc-500 hover:text-white transition-colors text-sm font-medium">Previous Year Papers</Link></li>
                            <li><Link href="/notes" className="text-zinc-500 hover:text-white transition-colors text-sm font-medium">Free Study Material</Link></li>
                            <li><Link href="/notifications" className="text-zinc-500 hover:text-white transition-colors text-sm font-medium">Exam Notifications</Link></li>
                        </ul>
                    </div>

                    {/* Resources */}
                    <div>
                        <h4 className="text-white font-bold mb-8 uppercase text-sm tracking-[0.2em]">Resources</h4>
                        <ul className="space-y-6">
                            <li><Link href="/about" className="text-zinc-400 hover:text-white transition-colors text-lg font-medium">About NCET Exam</Link></li>
                            <li><Link href="/colleges" className="text-white hover:text-white transition-colors text-lg font-bold">ITEP Participating Colleges</Link></li>
                            <li><Link href="/syllabus" className="text-zinc-400 hover:text-white transition-colors text-lg font-medium">Syllabus & Pattern</Link></li>
                            <li><Link href="/preparation" className="text-zinc-400 hover:text-white transition-colors text-lg font-medium">Preparation Strategy</Link></li>
                        </ul>
                    </div>

                    {/* Support */}
                    <div>
                        <h4 className="text-white font-bold mb-8 uppercase text-sm tracking-[0.2em]">Support</h4>
                        <ul className="space-y-6">
                            <li><Link href="/contact" className="text-zinc-400 hover:text-white transition-colors text-lg font-medium">Contact Us</Link></li>
                            <li><Link href="/privacy" className="text-zinc-400 hover:text-white transition-colors text-lg font-medium">Privacy Policy</Link></li>
                            <li><Link href="/terms" className="text-zinc-400 hover:text-white transition-colors text-lg font-medium">Terms of Service</Link></li>
                            <li><Link href="/help" className="text-zinc-400 hover:text-white transition-colors text-lg font-medium">Help Center</Link></li>
                        </ul>
                    </div>
                </div>

                <div className="py-12 text-center">
                    <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white" style={{ fontFamily: "Dancing Script, cursive" }}>
                        #The Best Platform for NCET Prep.
                        <span className="block w-32 h-1 bg-[#E11D48] mx-auto mt-3"></span>
                    </h2>
                </div>

                <div className="pt-12 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
                    <p className="text-zinc-600 text-[10px] font-bold uppercase tracking-widest">
                        © 2024 NCETBUDDY.IN • ALL RIGHTS RESERVED.
                    </p>
                    <p className="text-zinc-600 text-[10px] font-bold uppercase tracking-widest">
                        MADE FOR FUTURE EDUCATORS
                    </p>
                </div>
            </div>
        </footer>
    );
};
