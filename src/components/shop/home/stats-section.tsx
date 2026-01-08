"use client";

import { useState, useEffect } from "react";
import {
    Users,
    Package,
    CheckCircle,
    Coins
} from "lucide-react";
import { NumberTicker } from "@/components/ui/number-ticker";

interface StatsSectionProps {
    stats: {
        totalUsers: number;
        totalProducts: number;
        totalTopup: number;
        totalSold: number;
    };
}

export function StatsSection({ stats }: StatsSectionProps) {

    return (
        <section className="py-2">
            <div className="max-w-7xl mx-auto px-4">
                <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
                    <div className="group flex items-center justify-between rounded-lg p-4 md:p-6 shadow-sm hover:shadow-md transition-shadow bg-white backdrop-blur-sm border hover:border-primary">
                        <div>
                            <p className="text-sm font-medium text-slate-500">ผู้ใช้ทั้งหมด</p>
                            <p className="text-2xl md:text-3xl font-bold text-gradient-primary"><NumberTicker value={stats.totalUsers} /> <span className="text-sm font-normal text-slate-400">คน</span></p>
                        </div>
                        <div className="rounded-full bg-gradient-primary p-3 text-white shadow-md transition-all duration-500 group-hover:transform-[rotateY(360deg)]">
                            <Users className="h-6 w-6" />
                        </div>
                    </div>

                    <div className="group flex items-center justify-between rounded-lg p-4 md:p-6 shadow-sm hover:shadow-md transition-shadow bg-white backdrop-blur-sm border hover:border-primary">
                        <div>
                            <p className="text-sm font-medium text-slate-500">สินค้าทั้งหมด</p>
                            <p className="text-2xl md:text-3xl font-bold text-gradient-primary"><NumberTicker value={stats.totalProducts} /> <span className="text-sm font-normal text-slate-400">ชิ้น</span></p>
                        </div>
                        <div className="rounded-full bg-gradient-primary p-3 text-white shadow-md transition-all duration-500 group-hover:transform-[rotateY(360deg)]">
                            <Package className="h-6 w-6" />
                        </div>
                    </div>

                    <div className="group flex items-center justify-between rounded-lg p-4 md:p-6 shadow-sm hover:shadow-md transition-shadow bg-white backdrop-blur-sm border hover:border-primary">
                        <div>
                            <p className="text-sm font-medium text-slate-500">ยอดเติมเงิน</p>
                            <p className="text-2xl md:text-3xl font-bold text-gradient-primary"><NumberTicker value={Number(stats.totalTopup)} /> <span className="text-sm font-normal text-slate-400">บาท</span></p>
                        </div>
                        <div className="rounded-full bg-gradient-primary p-3 text-white shadow-md transition-all duration-500 group-hover:transform-[rotateY(360deg)]">
                            <Coins className="h-6 w-6" />
                        </div>
                    </div>

                    <div className="group flex items-center justify-between rounded-lg p-4 md:p-6 shadow-sm hover:shadow-md transition-shadow bg-white backdrop-blur-sm border hover:border-primary">
                        <div>
                            <p className="text-sm font-medium text-slate-500">ขายแล้ว</p>
                            <p className="text-2xl md:text-3xl font-bold text-gradient-primary"><NumberTicker value={stats.totalSold} /> <span className="text-sm font-normal text-slate-400">ชิ้น</span></p>
                        </div>
                        <div className="rounded-full bg-gradient-primary p-3 text-white shadow-md transition-all duration-500 group-hover:transform-[rotateY(360deg)]">
                            <CheckCircle className="h-6 w-6" />
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
