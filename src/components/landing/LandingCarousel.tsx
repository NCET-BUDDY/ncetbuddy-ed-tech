"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { TrendingUp } from "lucide-react";

export const LandingCarousel = () => {
    const [activeIndex, setActiveIndex] = useState(0);
    const [isPaused, setIsPaused] = useState(false);
    const touchStartX = useRef(0);
    const touchEndX = useRef(0);

    const slides = [
        {
            id: "ace-exam",
            content: (
                <div className="flex flex-col items-center justify-center h-full px-4 max-w-6xl mx-auto text-center pt-20 pb-32">
                    <div className="inline-block px-6 py-2 bg-urgency-math text-white text-[11px] font-black uppercase tracking-[0.3em] mb-10 rounded-full shadow-2xl animate-bounce">
                        🔥 NCET 2026 Batch is LIVE
                    </div>
                    <h1 className="text-6xl md:text-8xl lg:text-9xl font-black tracking-tighter mb-10 leading-[0.85] text-white uppercase drop-shadow-2xl">
                        ACE <span className="text-accent-math italic">NCET</span> <br />
                        WITH CONFIDENCE
                    </h1>

                    <p className="text-xl md:text-2xl text-zinc-300 font-medium max-w-3xl mx-auto leading-tight mb-12">
                        Get into top <span className="text-white font-bold border-b-4 border-accent-math">ITEP Colleges</span> with India's most results-oriented prep platform.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-6 w-full justify-center items-center">
                        <Link
                            href="/login"
                            className="group relative w-full sm:w-auto px-12 py-6 bg-primary-math text-white font-black uppercase tracking-[0.2em] rounded-2xl transition-all hover:scale-105 active:scale-95 shadow-[0_20px_50px_rgba(51,94,234,0.3)] overflow-hidden"
                        >
                            <span className="relative z-10 flex items-center justify-center gap-3 text-lg">
                                View Test Series <TrendingUp size={20} />
                            </span>
                            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                        </Link>
                        <Link
                            href="/educator/login"
                            className="w-full sm:w-auto px-12 py-6 bg-white/10 backdrop-blur-md text-white border-2 border-white/20 font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-white hover:text-black transition-all text-lg"
                        >
                            Login to Course
                        </Link>
                    </div>

                    <div className="mt-16 text-zinc-500 font-black tracking-[0.4em] uppercase text-xs">
                        #NCETBoleTohNCETBuddy
                    </div>
                </div>
            )
        },
        {
            id: "ai-roadmap",
            content: (
                <div className="flex flex-col items-center justify-center h-full px-4 max-w-6xl mx-auto text-center pt-20 pb-32">
                    <h1 className="text-6xl md:text-8xl lg:text-9xl font-black tracking-tighter mb-10 leading-[0.85] text-white uppercase drop-shadow-2xl">
                        YOUR AI <br />
                        <span className="text-accent-math italic">SUCCESS</span> PATH
                    </h1>
                    <p className="text-xl md:text-2xl text-zinc-300 font-medium max-w-3xl mx-auto leading-tight mb-12">
                        Stop guessing what to study. Our AI identifies your weak areas and creates a daily plan just for you.
                    </p>
                    <Link
                        href="/login"
                        className="w-full sm:w-auto px-12 py-6 bg-primary-math text-white font-black uppercase tracking-[0.2em] rounded-2xl transition-all shadow-[0_20px_50px_rgba(51,94,234,0.3)] text-lg"
                    >
                        Start Prep Now 🚀
                    </Link>
                </div>
            )
        }
    ];

    useEffect(() => {
        if (isPaused) return;

        const interval = setInterval(() => {
            setActiveIndex((prev) => (prev + 1) % slides.length);
        }, 8000);

        return () => clearInterval(interval);
    }, [isPaused, slides.length]);

    // Swipe handling
    const handleTouchStart = (e: React.TouchEvent) => {
        setIsPaused(true);
        touchStartX.current = e.touches[0].clientX;
    };

    const handleTouchEnd = (e: React.TouchEvent) => {
        setIsPaused(false);
        touchEndX.current = e.changedTouches[0].clientX;
        const distance = touchStartX.current - touchEndX.current;

        if (Math.abs(distance) > 50) {
            if (distance > 0) {
                // Swipe Left -> Next Slide
                setActiveIndex((prev) => (prev + 1) % slides.length);
            } else {
                // Swipe Right -> Prev Slide
                setActiveIndex((prev) => (prev - 1 + slides.length) % slides.length);
            }
        }
    };

    return (
        <section
            className="relative h-screen min-h-[800px] bg-black flex flex-col overflow-hidden"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
        >
            {/* Background Image with Dark Overlay */}
            <div className="absolute inset-0 z-0">
                <img
                    src="/hero_background_study.png"
                    alt="Background"
                    className="w-full h-full object-cover opacity-40 mix-blend-luminosity scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/40 to-black/90 z-10" />
            </div>

            {/* Persistent Top Elements */}
            <div className="absolute top-12 left-0 right-0 z-50 flex justify-center pointer-events-none">
                <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl overflow-hidden shadow-2xl bg-white/10 backdrop-blur-xl border border-white/20 pointer-events-auto hover:rotate-6 transition-transform duration-500">
                    <img src="/logo.png" alt="NCET Buddy Logo" className="w-full h-full object-cover p-2" />
                </div>
            </div>

            {/* Carousel Content */}
            <div
                className="relative z-20 w-full h-full"
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
            >
                {slides.map((slide, index) => (
                    <div
                        key={slide.id}
                        className={`absolute inset-0 w-full h-full transition-all duration-1000 ease-in-out flex items-center justify-center ${index === activeIndex
                            ? "opacity-100 scale-100"
                            : "opacity-0 scale-95 pointer-events-none"
                            }`}
                    >
                        {slide.content}
                    </div>
                ))}
            </div>

            {/* Pagination Indicators */}
            <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex gap-4 z-40">
                {slides.map((_, index) => (
                    <button
                        key={index}
                        onClick={() => setActiveIndex(index)}
                        className={`h-1.5 rounded-full transition-all duration-500 ${index === activeIndex ? "w-10 bg-primary-math" : "w-4 bg-white/20 hover:bg-white/40"
                            }`}
                        aria-label={`Go to slide ${index + 1}`}
                    />
                ))}
            </div>
        </section>
    );
};
