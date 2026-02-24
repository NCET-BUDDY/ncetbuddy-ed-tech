import Link from "next/link";
import { Button } from "@/components/ui/Button";

export function Hero() {
    return (
        <section className="relative pt-44 pb-32 overflow-hidden bg-white">
            <div className="container mx-auto px-4 relative z-10">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                    {/* Left Column: Content */}
                    <div className="text-left">
                        {/* New Batch Badge */}
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-rose-50 border border-rose-100 rounded-lg mb-8">
                            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                            <span className="text-[10px] font-bold text-rose-500 uppercase tracking-widest">
                                New ITEP Batch 2026 Starting Soon
                            </span>
                        </div>

                        <h1 className="text-6xl md:text-7xl font-bold tracking-tighter text-black mb-8 leading-[1.05]">
                            Master the NCET Exam with India's Most <span className="text-[#E11D48]">Trusted</span> Prep Buddy
                        </h1>

                        <p className="text-lg text-zinc-500 font-medium max-w-xl mb-12 leading-relaxed">
                            Empowering aspirants with expert-curated content, full-length mock tests, and previous year solutions designed for the ITEP entrance success.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4 items-center">
                            <Link href="/dashboard" className="w-full sm:w-auto">
                                <Button className="w-full sm:w-auto px-10 py-7 bg-[#E11D48] hover:bg-[#BE123C] text-white font-bold rounded-xl text-lg flex items-center justify-center gap-3">
                                    Start Preparation <span className="text-2xl">→</span>
                                </Button>
                            </Link>
                            <Link href="/#courses" className="w-full sm:w-auto">
                                <Button variant="outline" className="w-full sm:w-auto px-10 py-7 text-zinc-600 font-bold rounded-xl text-lg bg-zinc-50 border-zinc-100 hover:bg-white">
                                    Explore Courses
                                </Button>
                            </Link>
                        </div>
                    </div>

                    {/* Right Column: Illustration */}
                    <div className="relative flex justify-center lg:justify-end">
                        <div className="relative w-full max-w-[550px] aspect-square bg-[#E8F3F1] rounded-[3rem] overflow-hidden shadow-2xl">
                            <img
                                src="/hero-illustration.png"
                                alt="Student Illustration"
                                className="w-full h-full object-contain p-8"
                            />
                            {/* Visual decorative elements if any from the image can be added here */}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
