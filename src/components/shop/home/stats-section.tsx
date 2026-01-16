"use client";

import { useState } from "react";

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

interface StatCardProps {
    label: string;
    value: number;
    unit: string;
    icon: React.ReactNode;
}

function StatCard({ label, value, unit, icon }: StatCardProps) {
    return (
        <div className="group relative flex items-center justify-between rounded-lg p-4 md:p-6 shadow-sm hover:shadow-lg transition-all duration-300 bg-white backdrop-blur-sm border-none overflow-hidden cursor-pointer">
            {/* Expanding Circle Background */}
            <div className="absolute right-4 md:right-6 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-gradient-primary transition-all duration-500 ease-out group-hover:scale-[12] group-hover:opacity-100 z-0" />

            {/* Content */}
            <div className="relative z-10">
                <p className="text-sm font-medium group-hover:text-white transition-colors duration-300">
                    {label}
                </p>
                <div className="flex items-baseline gap-1">
                    <span className="text-2xl md:text-3xl font-bold text-gradient-primary-hoverable">
                        <NumberTicker value={value} />
                    </span>
                    <span className="text-sm font-normal group-hover:text-white transition-colors duration-300">
                        {unit}
                    </span>
                </div>
            </div>

            {/* Icon */}
            <div className="relative z-10 rounded-full group-hover:scale-200 p-3 text-white transition-all duration-300">
                {icon}
            </div>
        </div>
    );
}

export function StatsSection({ stats }: StatsSectionProps) {
    return (
        <section className="py-2">
            <div className="max-w-7xl mx-auto px-4">
                <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
                    <StatCard
                        label="ผู้ใช้ทั้งหมด"
                        value={stats.totalUsers}
                        unit="คน"
                        icon={<Users className="h-6 w-6" />}
                    />
                    <StatCard
                        label="สินค้าทั้งหมด"
                        value={stats.totalProducts}
                        unit="ชิ้น"
                        icon={<Package className="h-6 w-6" />}
                    />
                    <StatCard
                        label="ยอดเติมเงิน"
                        value={Number(stats.totalTopup)}
                        unit="บาท"
                        icon={<Coins className="h-6 w-6" />}
                    />
                    <StatCard
                        label="ขายแล้ว"
                        value={stats.totalSold}
                        unit="ชิ้น"
                        icon={<CheckCircle className="h-6 w-6" />}
                    />
                </div>
            </div>
        </section>
    );
}

