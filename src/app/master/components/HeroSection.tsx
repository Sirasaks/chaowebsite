"use client";

import { Button } from "@/components/ui/button";
import { ArrowRight, Zap, Shield, CreditCard } from "lucide-react";
import NextLink from "next/link";
import { useEffect, useState } from "react";

export function HeroSection() {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    return (
        <section className="relative min-h-[90vh] flex items-center overflow-hidden bg-gradient-to-b from-background to-muted/30">
            {/* Animated Background Grid */}
            <div className="absolute inset-0 pointer-events-none">
                {/* Grid Pattern */}
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#8882_1px,transparent_1px),linear-gradient(to_bottom,#8882_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_110%)]" />

                {/* Gradient Orbs */}
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/30 rounded-full blur-3xl animate-pulse" />
                <div className="absolute top-1/3 right-1/4 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
                <div className="absolute bottom-1/4 left-1/3 w-72 h-72 bg-blue-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
            </div>

            <div className="relative max-w-7xl mx-auto px-6 py-20 w-full">
                <div className="grid lg:grid-cols-2 gap-12 items-center">
                    {/* Left Content */}
                    <div className="text-center lg:text-left">
                        {/* Badge */}
                        <div
                            className={`inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-8 transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
                        >
                            <Zap className="w-4 h-4" />
                            <span>เปิดร้านได้ทันที ไม่ต้องเขียนโค้ด</span>
                        </div>

                        {/* Heading */}
                        <h1
                            className={`text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-foreground leading-tight transition-all duration-700 delay-100 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
                        >
                            สร้างร้านค้าออนไลน์
                            <br />
                            <span className="bg-gradient-to-r from-primary via-purple-500 to-pink-500 bg-clip-text text-transparent">
                                ขายได้ 24 ชั่วโมง
                            </span>
                        </h1>

                        {/* Description */}
                        <p
                            className={`mt-6 text-lg text-muted-foreground max-w-xl mx-auto lg:mx-0 leading-relaxed transition-all duration-700 delay-200 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
                        >
                            ระบบขายสินค้าดิจิทัลครบวงจร พร้อมระบบชำระเงินอัตโนมัติ
                            รองรับอั่งเปา, Verify Slip และส่งสินค้าทันทีหลังชำระเงิน
                        </p>

                        {/* CTA Buttons */}
                        <div
                            className={`mt-10 flex flex-col sm:flex-row gap-4 justify-center lg:justify-start transition-all duration-700 delay-300 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
                        >
                            <NextLink href="/register">
                                <Button size="lg" className="w-full sm:w-auto text-base px-8 bg-gradient-to-r from-primary to-purple-600 hover:opacity-90 hover:scale-105 transition-all shadow-lg shadow-primary/25">
                                    เริ่มต้นใช้งานฟรี
                                    <ArrowRight className="ml-2 h-4 w-4" />
                                </Button>
                            </NextLink>
                            <NextLink href="/shop">
                                <Button variant="outline" size="lg" className="w-full sm:w-auto text-base px-8 hover:scale-105 transition-all">
                                    ดูตัวอย่างร้านค้า
                                </Button>
                            </NextLink>
                        </div>

                        {/* Trust Badges */}
                        <div
                            className={`mt-12 flex flex-wrap gap-6 justify-center lg:justify-start text-sm text-muted-foreground transition-all duration-700 delay-500 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
                        >
                            <div className="flex items-center gap-2">
                                <Shield className="w-4 h-4 text-green-500" />
                                <span>ปลอดภัย 100%</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <CreditCard className="w-4 h-4 text-blue-500" />
                                <span>ชำระเงินอัตโนมัติ</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Zap className="w-4 h-4 text-yellow-500" />
                                <span>ส่งสินค้าทันที</span>
                            </div>
                        </div>
                    </div>

                    {/* Right - Stats Cards */}
                    <div
                        className={`relative lg:pl-12 transition-all duration-700 delay-400 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
                    >
                        <div className="grid grid-cols-2 gap-4">
                            {/* Stat Card 1 */}
                            <div className="bg-card border rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow">
                                <div className="text-4xl font-bold bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent">
                                    1,000+
                                </div>
                                <div className="text-sm text-muted-foreground mt-2">ร้านค้าไว้วางใจ</div>
                            </div>

                            {/* Stat Card 2 */}
                            <div className="bg-card border rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow">
                                <div className="text-4xl font-bold bg-gradient-to-r from-blue-500 to-cyan-500 bg-clip-text text-transparent">
                                    50K+
                                </div>
                                <div className="text-sm text-muted-foreground mt-2">รายการขาย/เดือน</div>
                            </div>

                            {/* Stat Card 3 */}
                            <div className="bg-card border rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow">
                                <div className="text-4xl font-bold bg-gradient-to-r from-green-500 to-emerald-500 bg-clip-text text-transparent">
                                    99.9%
                                </div>
                                <div className="text-sm text-muted-foreground mt-2">Uptime</div>
                            </div>

                            {/* Stat Card 4 */}
                            <div className="bg-card border rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow">
                                <div className="text-4xl font-bold bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">
                                    24/7
                                </div>
                                <div className="text-sm text-muted-foreground mt-2">ระบบทำงานตลอด</div>
                            </div>
                        </div>

                        {/* Floating Badge */}
                        <div className="absolute -top-4 -right-4 bg-primary text-primary-foreground px-4 py-2 rounded-full text-sm font-medium shadow-lg animate-bounce">
                            🎉 ฟรี 7 วัน
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Gradient */}
            <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-background to-transparent pointer-events-none" />
        </section>
    );
}
