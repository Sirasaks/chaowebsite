"use client";

import { Link } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import NextLink from "next/link";


export function HeroSection() {
    return (
        <section className="relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-20 left-1/4 w-72 h-72 bg-primary/20 rounded-full blur-3xl animate-pulse" />
                <div className="absolute top-40 right-1/4 w-96 h-96 bg-purple-400/20 rounded-full blur-3xl animate-pulse delay-1000" />
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full h-32 bg-gradient-to-t from-slate-50 to-transparent" />
            </div>

            <div className="relative max-w-5xl mx-auto px-6 py-32 text-center">
                <h1
                    className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-slate-900 leading-tight animate-appear"
                    style={{ animationDelay: '100ms' }}
                >
                    สร้างร้านค้าออนไลน์
                    <br />
                    <span className="bg-gradient-to-r from-primary via-purple-500 to-pink-500 bg-clip-text text-transparent">
                        ได้ในไม่กี่นาที
                    </span>
                </h1>

                <p
                    className="mt-6 text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed animate-appear"
                    style={{ animationDelay: '200ms' }}
                >
                    เปิดร้านขายไอดีเกม และสินค้าดิจิทัล
                    <br className="hidden md:block" />
                    พร้อมระบบส่งของอัตโนมัติ ดูแลคุณตลอด 24 ชั่วโมง
                </p>

                <div
                    className="mt-10 flex flex-col sm:flex-row gap-4 justify-center animate-appear"
                    style={{ animationDelay: '300ms' }}
                >
                    <NextLink href="/register">
                        <Button size="lg" className="w-full sm:w-auto text-base px-8 bg-gradient-to-r from-primary to-purple-500 hover:opacity-90 hover:scale-105 transition-all shadow-lg shadow-primary/25">
                            เริ่มต้นใช้งาน
                            <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                    </NextLink>
                    <NextLink href="/login">
                        <Button variant="outline" size="lg" className="w-full sm:w-auto text-base px-8 hover:scale-105 transition-all hover:bg-slate-50">
                            เข้าสู่ระบบ
                        </Button>
                    </NextLink>
                </div>

                <div
                    className="mt-20 flex justify-center gap-8 md:gap-16 text-center animate-appear"
                    style={{ animationDelay: '500ms' }}
                >
                    <div className="group cursor-default">
                        <div className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent group-hover:scale-110 transition-transform inline-block">1,000+</div>
                        <div className="text-sm text-slate-500 mt-2">ร้านค้าไว้วางใจ</div>
                    </div>
                    <div className="group cursor-default">
                        <div className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent group-hover:scale-110 transition-transform inline-block">50K+</div>
                        <div className="text-sm text-slate-500 mt-2">รายการขาย/เดือน</div>
                    </div>
                    <div className="group cursor-default">
                        <div className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent group-hover:scale-110 transition-transform inline-block">99.9%</div>
                        <div className="text-sm text-slate-500 mt-2">Uptime</div>
                    </div>
                </div>
            </div>
        </section>
    );
}
