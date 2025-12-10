import React from 'react';
import { Megaphone } from 'lucide-react';

interface MarqueeSectionProps {
    text: string;
}

export const MarqueeSection = ({ text }: MarqueeSectionProps) => {
    if (!text) return null;

    return (
        <section className="py-2">
            <div className="max-w-7xl mx-auto px-4">
                <div className="bg-white/80 backdrop-blur-md border rounded-lg shadow-sm p-1.5 flex items-center overflow-hidden">
                    <div className="bg-gradient-primary text-white px-4 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap z-10 shrink-0 flex items-center gap-2 shadow-sm">
                        <Megaphone className="w-4 h-4 animate-pulse" />
                        อัพเดตข่าวสาร
                    </div>
                    <div className="overflow-hidden w-full relative h-7 flex items-center ml-2 mask-linear-fade">
                        <div className="absolute min-w-full animate-marquee text-sm font-medium text-slate-700" style={{ animationDuration: '20s' }}>
                            {text}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};
