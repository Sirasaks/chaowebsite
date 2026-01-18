"use client";

import { useState, useEffect } from "react";
import {
    ChevronLeft,
    ChevronRight,
} from "lucide-react";

interface SlideshowImage {
    id: number;
    image_url: string;
    display_order: number;
}

interface HeroSectionProps {
    images: SlideshowImage[];
}

export function HeroSection({ images }: HeroSectionProps) {
    const [currentSlide, setCurrentSlide] = useState(0);

    useEffect(() => {
        if (images.length <= 1) return;
        const interval = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % images.length);
        }, 5000);
        return () => clearInterval(interval);
    }, [images.length]);

    const nextSlide = () => {
        setCurrentSlide((prev) => (prev + 1) % images.length);
    };

    const prevSlide = () => {
        setCurrentSlide((prev) => (prev - 1 + images.length) % images.length);
    };

    return (
        <section className="pt-8 py-2">
            <div className="max-w-7xl mx-auto px-4">
                {/* Slideshow / Banner */}
                {images.length > 0 ? (
                    <div className="relative overflow-hidden rounded-lg shadow-sm aspect-3/1 md:aspect-4/1 bg-slate-100">
                        <div className="relative w-full h-full group">
                            {images.map((image, index) => (
                                <div
                                    key={image.id}
                                    className={`absolute inset-0 transition-opacity duration-500 ease-in-out ${index === currentSlide ? "opacity-100 z-10" : "opacity-0 z-0"
                                        }`}
                                >
                                    <img
                                        src={image.image_url}
                                        alt={`Slide ${index + 1}`}
                                        className="w-full h-full object-cover"
                                        loading={index === 0 ? "eager" : "lazy"}
                                        // @ts-ignore
                                        fetchPriority={index === 0 ? "high" : "auto"}
                                        decoding={index === 0 ? "sync" : "async"}
                                    />
                                </div>
                            ))}

                            {/* Navigation Buttons */}
                            {images.length > 1 && (
                                <>
                                    <button
                                        onClick={prevSlide}
                                        className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <ChevronLeft className="h-6 w-6" />
                                    </button>
                                    <button
                                        onClick={nextSlide}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <ChevronRight className="h-6 w-6" />
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                ) : null}
            </div>
        </section>
    );
}
