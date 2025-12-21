"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Shield,
    Zap,
    CreditCard,
    HeadphonesIcon,
    ArrowRight,
    Store,
    BarChart3,
    Star,
    Rocket
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

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
        icon: BarChart3,
        title: "Dashboard ครบครัน",
        description: "ติดตามยอดขายและสถิติแบบ Real-time"
    },
    {
        icon: HeadphonesIcon,
        title: "ซัพพอร์ต 24 ชม.",
        description: "ทีมงานพร้อมช่วยเหลือตลอดเวลา"
    }
];

export default function MasterPage() {
    const [mounted, setMounted] = useState(false);
    const featuresSection = useScrollReveal();
    const howSection = useScrollReveal();
    const testimonialSection = useScrollReveal();

    // Wait for hydration before showing animations
    useEffect(() => {
        const timer = setTimeout(() => setMounted(true), 100);
        return () => clearTimeout(timer);
    }, []);

    return (
        <div className="min-h-screen bg-white">
            {/* Hero Section */}
            <section className="relative">
                <div className="max-w-5xl mx-auto px-6 py-32 text-center">
                    <div className={`transition-all duration-700 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
                        <Badge variant="secondary" className="mb-8">
                            แพลตฟอร์มสร้างร้านค้าออนไลน์
                        </Badge>
                    </div>

                    <h1
                        className={`text-5xl md:text-6xl font-bold tracking-tight text-slate-900 leading-tight transition-all duration-700 delay-100 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
                    >
                        สร้างร้านค้าออนไลน์
                        <br />
                        <span className="text-primary">ได้ในไม่กี่นาที</span>
                    </h1>

                    <p
                        className={`mt-6 text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed transition-all duration-700 delay-200 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
                    >
                        เปิดร้านขายไอดีเกม บัตรเติมเงิน และสินค้าดิจิทัล
                        พร้อมระบบส่งของอัตโนมัติ
                    </p>

                    <div className={`mt-10 flex gap-4 justify-center transition-all duration-700 delay-300 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
                        <Link href="/register">
                            <Button size="lg" className="text-base px-8 hover:scale-105 transition-transform">
                                เริ่มต้นใช้งาน
                                <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                        </Link>
                        <Link href="/login">
                            <Button variant="outline" size="lg" className="text-base px-8 hover:scale-105 transition-transform">
                                เข้าสู่ระบบ
                            </Button>
                        </Link>
                    </div>

                    <div className={`mt-16 flex justify-center gap-12 text-center transition-all duration-700 delay-500 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
                        <div className="group">
                            <div className="text-3xl font-bold text-slate-900 group-hover:text-primary transition-colors">1,000+</div>
                            <div className="text-sm text-slate-500 mt-1">ร้านค้า</div>
                        </div>
                        <div className="group">
                            <div className="text-3xl font-bold text-slate-900 group-hover:text-primary transition-colors">50K+</div>
                            <div className="text-sm text-slate-500 mt-1">รายการขาย/เดือน</div>
                        </div>
                        <div className="group">
                            <div className="text-3xl font-bold text-slate-900 group-hover:text-primary transition-colors">99.9%</div>
                            <div className="text-sm text-slate-500 mt-1">Uptime</div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
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

            {/* How It Works */}
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

            {/* Testimonials */}
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

            {/* CTA Section */}
            <section className="py-20 bg-slate-900">
                <div className="max-w-3xl mx-auto px-6 text-center">
                    <h2 className="text-3xl font-bold text-white mb-4">
                        พร้อมเริ่มต้นแล้วหรือยัง?
                    </h2>
                    <p className="text-lg text-slate-400 mb-8">
                        สมัครวันนี้ และเริ่มสร้างร้านค้าออนไลน์ของคุณได้ทันที
                    </p>
                    <div className="flex gap-4 justify-center">
                        <Link href="/register">
                            <Button size="lg" className="bg-white text-slate-900 hover:bg-slate-100 hover:scale-105 transition-all">
                                เริ่มต้นใช้งาน
                            </Button>
                        </Link>
                        <Link href="/login">
                            <Button variant="outline" size="lg" className="border-slate-600 text-white hover:bg-slate-800 hover:scale-105 transition-all">
                                เข้าสู่ระบบ
                            </Button>
                        </Link>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-8 border-t">
                <div className="max-w-5xl mx-auto px-6">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm">
                        <div className="font-semibold text-slate-900">ChaoWeb</div>
                        <div className="text-slate-500">© 2024 ChaoWeb. All rights reserved.</div>
                        <div className="flex gap-6 text-slate-500">
                            <Link href="/privacy" className="hover:text-slate-900 transition-colors">Privacy</Link>
                            <Link href="/terms" className="hover:text-slate-900 transition-colors">Terms</Link>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}
