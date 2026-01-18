"use client";

import { useRef, useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
    Shield,
    Zap,
    CreditCard,
    Store,
    Palette,
    Smartphone
} from "lucide-react";

// Scroll Reveal Hook
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

const features = [
    {
        icon: Store,
        title: "สร้างร้านค้าได้ทันที",
        description: "เปิดร้านขายสินค้าดิจิทัลได้ภายในไม่กี่นาที"
    },
    {
        icon: CreditCard,
        title: "ชำระเงินหลายช่องทาง",
        description: "PromptPay, สลิปธนาคาร, ซองอั่งเปา"
    },
    {
        icon: Shield,
        title: "ปลอดภัยและมั่นคง",
        description: "ระบบรักษาความปลอดภัยมาตรฐานสูง"
    },
    {
        icon: Zap,
        title: "ส่งสินค้าอัตโนมัติ",
        description: "จัดส่งไอดีและรหัสทันทีหลังชำระเงิน"
    },
    {
        icon: Smartphone,
        title: "รองรับทุกหน้าจอ",
        description: "Responsive Design แสดงผลสวยงามทุกอุปกรณ์"
    },
    {
        icon: Palette,
        title: "ปรับแต่งได้อิสระ",
        description: "No-Code ตั้งค่าร้านค้าได้ง่าย ไม่ต้องเขียนโค้ด"
    }
];

export function FeaturesSection() {
    const featuresSection = useScrollReveal();

    return (
        <section className="py-24 bg-slate-50" ref={featuresSection.ref}>
            <div className="max-w-6xl mx-auto px-6">
                <div className={`text-center mb-16 transition-all duration-700 ${featuresSection.isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
                    <h2 className="text-3xl font-bold text-slate-900">ทำไมต้องเลือกเรา</h2>
                    <p className="mt-3 text-lg text-slate-600">ฟีเจอร์ครบครันที่จะช่วยให้ธุรกิจของคุณเติบโต</p>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {features.map((feature, index) => (
                        <div
                            key={index}
                            className={`transition-all duration-700 ${featuresSection.isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
                            style={{ transitionDelay: `${index * 100}ms` }}
                        >
                            <Card className="border-0 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                                <CardHeader className="pb-3">
                                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                                        <feature.icon className="h-5 w-5 text-primary" />
                                    </div>
                                    <CardTitle className="text-lg">{feature.title}</CardTitle>
                                    <CardDescription>{feature.description}</CardDescription>
                                </CardHeader>
                            </Card>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
