"use client";

import { useState, useEffect, useCallback } from "react";
import { getActiveBanners } from "@/lib/pocketbase-db";
import { CarouselBanner } from "@/types";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function BannerCarousel() {
    const [banners, setBanners] = useState<CarouselBanner[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isHovered, setIsHovered] = useState(false);

    useEffect(() => {
        const fetchBanners = async () => {
            const data = await getActiveBanners();
            setBanners(data);
        };
        fetchBanners();
    }, []);

    const nextSlide = useCallback(() => {
        if (banners.length === 0) return;
        setCurrentIndex((prevIndex) => (prevIndex + 1) % banners.length);
    }, [banners.length]);

    const prevSlide = useCallback(() => {
        if (banners.length === 0) return;
        setCurrentIndex((prevIndex) => (prevIndex - 1 + banners.length) % banners.length);
    }, [banners.length]);

    // Auto-advance
    useEffect(() => {
        if (isHovered || banners.length <= 1) return;

        const interval = setInterval(() => {
            nextSlide();
        }, 5000); // Change banner every 5 seconds

        return () => clearInterval(interval);
    }, [isHovered, banners.length, nextSlide]);

    if (banners.length === 0) {
        return null;
    }

    return (
        <div
            className="relative w-full overflow-hidden rounded-2xl md:rounded-3xl shadow-lg"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            style={{ aspectRatio: '3/1', maxHeight: '400px' }} // Approximate banner aspect ratio
        >
            {/* Slides container */}
            <div
                className="flex transition-transform duration-500 ease-in-out h-full"
                style={{ transform: `translateX(-${currentIndex * 100}%)` }}
            >
                {banners.map((banner) => (
                    <div key={banner.id} className="min-w-full h-full relative cursor-pointer">
                        {banner.linkUrl ? (
                            <Link href={banner.linkUrl} target={banner.linkUrl.startsWith('http') ? "_blank" : "_self"}>
                                <img
                                    src={banner.imageUrl}
                                    alt={banner.title}
                                    className="w-full h-full object-cover"
                                />
                            </Link>
                        ) : (
                            <img
                                src={banner.imageUrl}
                                alt={banner.title}
                                className="w-full h-full object-cover"
                            />
                        )}
                    </div>
                ))}
            </div>

            {/* Navigation Arrows (visible on hover or on larger screens implicitly) */}
            {banners.length > 1 && (
                <>
                    <button
                        onClick={prevSlide}
                        className={`absolute left-2 md:left-4 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white p-2 rounded-full backdrop-blur-sm transition-opacity duration-300 ${isHovered ? 'opacity-100' : 'opacity-0 md:opacity-100'}`}
                        aria-label="Previous banner"
                    >
                        <ChevronLeft size={24} />
                    </button>
                    <button
                        onClick={nextSlide}
                        className={`absolute right-2 md:right-4 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white p-2 rounded-full backdrop-blur-sm transition-opacity duration-300 ${isHovered ? 'opacity-100' : 'opacity-0 md:opacity-100'}`}
                        aria-label="Next banner"
                    >
                        <ChevronRight size={24} />
                    </button>
                </>
            )}

            {/* Dot Indicators */}
            {banners.length > 1 && (
                <div className="absolute bottom-3 md:bottom-5 left-1/2 -translate-x-1/2 flex gap-2 z-10">
                    {banners.map((_, index) => (
                        <button
                            key={index}
                            onClick={() => setCurrentIndex(index)}
                            className={`w-2 h-2 rounded-full transition-all duration-300 ${index === currentIndex
                                    ? 'bg-white w-6'
                                    : 'bg-white/50 hover:bg-white/80'
                                }`}
                            aria-label={`Go to slide ${index + 1}`}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
