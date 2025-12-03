"use client";

import { TopupHistoryTable } from "@/components/shop/admin/topup-history-table";
import { DashboardStats } from "@/components/shop/admin/dashboard-stats";
import { DashboardCharts } from "@/components/shop/admin/dashboard-charts";

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
