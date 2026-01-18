"use client";

import dynamic from "next/dynamic";
import { TopupHistoryTable } from "@/components/shop/admin/topup-history-table";
import { DashboardStats } from "@/components/shop/admin/dashboard-stats";

// Dynamic import for code splitting - recharts is a large library
const DashboardCharts = dynamic(
    () => import("@/components/shop/admin/dashboard-charts").then(mod => ({ default: mod.DashboardCharts })),
    {
        loading: () => (
            <div className="space-y-6">
                <div className="flex justify-end">
                    <div className="h-10 w-64 bg-muted animate-pulse rounded-lg" />
                </div>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="rounded-lg border bg-card p-6">
                            <div className="h-6 w-32 bg-muted animate-pulse rounded mb-4" />
                            <div className="h-64 bg-muted animate-pulse rounded" />
                        </div>
                    ))}
                </div>
            </div>
        ),
        ssr: false
    }
);

export default function AdminPage() {

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold">Admin Dashboard</h1>
            </div>

            <DashboardStats />

            <DashboardCharts />

            <TopupHistoryTable />
        </div>
    );
}
