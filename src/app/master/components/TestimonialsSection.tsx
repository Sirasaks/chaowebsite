"use client";

import { useRef, useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Star } from "lucide-react";

function useScrollReveal() {
    const ref = useRef<HTMLDivElement>(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                }
            },
            { threshold: 0.1 }
        );

        if (ref.current) {
            observer.observe(ref.current);
        }

        return () => observer.disconnect();
    }, []);

    return { ref, isVisible };
}

export function TestimonialsSection() {
    const testimonialSection = useScrollReveal();

    return (
        <section className="py-24 bg-slate-50" ref={testimonialSection.ref}>
            <div className="max-w-5xl mx-auto px-6">
                <div className={`text-center mb-16 transition-all duration-700 ${testimonialSection.isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
                    <h2 className="text-3xl font-bold text-slate-900">ลูกค้าพูดถึงเรา</h2>
                </div>

                <div className="grid md:grid-cols-3 gap-6">
                    {[
                        { name: "คุณเอก", role: "GameShop", content: "ใช้งานง่ายมาก สร้างร้านได้ภายใน 5 นาที" },
                        { name: "คุณแพร", role: "ผู้ขายไอดีเกม", content: "ระบบเสถียรมาก ไม่เคยล่มเลย ซัพพอร์ตตอบไว" },
                        { name: "คุณบอส", role: "TopupCenter", content: "รายได้เพิ่มขึ้น 200% หลังจากเปลี่ยนมาใช้" }
                    ].map((item, index) => (
                        <div
                            key={index}
                            className={`transition-all duration-700 ${testimonialSection.isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
                            style={{ transitionDelay: `${index * 100}ms` }}
                        >
                            <Card className="border-0 shadow-sm hover:shadow-lg transition-shadow">
                                <CardContent className="pt-6">
                                    <div className="flex gap-0.5 mb-3">
                                        {[...Array(5)].map((_, i) => (
                                            <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                        ))}
                                    </div>
                                    <p className="text-slate-600 text-sm mb-4">"{item.content}"</p>
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium text-sm">
                                            {item.name.charAt(3)}
                                        </div>
                                        <div>
                                            <div className="font-medium text-sm text-slate-900">{item.name}</div>
                                            <div className="text-xs text-slate-500">{item.role}</div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
