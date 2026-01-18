"use client";

import { useRef, useState, useEffect } from "react";
import { Store, Rocket, Zap } from "lucide-react";

// Scroll Reveal Hook (Duplicated heavily to avoid complex shared hook extraction for now, kept simple)
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

export function HowItWorksSection() {
    const howSection = useScrollReveal();

    return (
        <section className="py-24" ref={howSection.ref}>
            <div className="max-w-4xl mx-auto px-6">
                <div className={`text-center mb-16 transition-all duration-700 ${howSection.isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
                    <h2 className="text-3xl font-bold text-slate-900">เริ่มต้นง่ายๆ 3 ขั้นตอน</h2>
                </div>

                <div className="grid md:grid-cols-3 gap-8">
                    {[
                        { step: "1", title: "สมัครสมาชิก", desc: "ลงทะเบียนฟรี ใช้เวลาไม่ถึง 1 นาที", icon: Rocket },
                        { step: "2", title: "ตั้งค่าร้านค้า", desc: "เพิ่มสินค้า ตั้งราคา เลือกธีม", icon: Store },
                        { step: "3", title: "เริ่มขายได้เลย", desc: "แชร์ลิงก์ร้าน รอรับออเดอร์", icon: Zap }
                    ].map((item, index) => (
                        <div
                            key={index}
                            className={`text-center transition-all duration-700 ${howSection.isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
                            style={{ transitionDelay: `${index * 150}ms` }}
                        >
                            <div className="w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center mx-auto mb-4 text-lg font-bold hover:scale-110 transition-transform">
                                {item.step}
                            </div>
                            <h3 className="text-xl font-semibold text-slate-900 mb-2">{item.title}</h3>
                            <p className="text-slate-600">{item.desc}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
