import Link from "next/link";
import { Button } from "@/components/ui/Button";

export function Hero() {
    return (
        <section className="relative pt-20 md:pt-28 pb-16 md:pb-32 overflow-hidden bg-white">
            <div className="container mx-auto px-4 relative z-10">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                    {/* Left Column: Content */}
                    <div className="text-left">
                        {/* New Batch Badge */}
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-rose-50 border border-rose-100 rounded-lg mb-6">
                            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                            <span className="text-[10px] font-bold text-rose-500 uppercase tracking-widest">
                                New ITEP Batch 2026 Starting Soon
                            </span>
                        </div>

                        <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tighter text-black mb-6 md:mb-8 leading-[1.05]">
                            Master the NCET Exam with India's Most <span className="text-[#E11D48]">Trusted</span> Prep Buddy
                        </h1>

                        <p className="text-base md:text-lg text-zinc-500 font-medium max-w-xl mb-6 md:mb-10 leading-relaxed">
                            Empowering aspirants with expert-curated content, full-length mock tests, and previous year solutions designed for the ITEP entrance success.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-stretch sm:items-center">
                            <Link href="/dashboard" className="w-full sm:w-auto">
                                <Button className="w-full sm:w-auto px-6 sm:px-10 py-3 sm:py-7 bg-[#E11D48] hover:bg-[#BE123C] text-white font-bold rounded-xl text-base sm:text-lg flex items-center justify-center gap-2 sm:gap-3">
                                    Start Preparation <span className="text-xl sm:text-2xl">→</span>
                                </Button>
                            </Link>
                            <Link href="/#courses" className="w-full sm:w-auto">
                                <Button variant="outline" className="w-full sm:w-auto px-6 sm:px-10 py-3 sm:py-7 text-zinc-600 font-bold rounded-xl text-base sm:text-lg bg-zinc-50 border-zinc-100 hover:bg-white">
                                    Explore Courses
                                </Button>
                            </Link>
                            <Link
                                href="https://drive.google.com/file/d/1NiwzcyYH5ve9XSla6Fp5mO4bs6FlK_XD/view?usp=drivesdk"
                                target="_blank"
                                className="w-full sm:w-auto"
                            >
                                <Button variant="outline" className="w-full sm:w-auto px-6 sm:px-10 py-3 sm:py-7 text-rose-500 font-bold rounded-xl text-base sm:text-lg bg-white border-rose-200 hover:bg-rose-50 border-2">
                                    Download Priority Order
                                </Button>
                            </Link>
                        </div>
                    </div>

                    {/* Right Column: Illustration */}
                    <div className="relative flex justify-center lg:justify-end">
                        <div className="relative w-full max-w-[550px] aspect-square rounded-[3rem] overflow-hidden shadow-2xl ring-1 ring-black/5">
                            <img
                                src="/hero-student.jpg"
                                alt="Student preparing for NCET"
                                className="w-full h-full object-cover"
                            />
                            {/* Overlay to soften the image if needed */}
                            <div className="absolute inset-0 bg-gradient-to-tr from-rose-500/10 via-transparent to-transparent pointer-events-none" />
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
