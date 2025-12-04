"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CreditCard, Users, DollarSign } from "lucide-react";

interface Stats {
    totalTopup: number;
    totalUsers: number;
    totalSales: number;
}

export function DashboardStats() {
    const [stats, setStats] = useState<Stats | null>(null);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await fetch("/api/shop/admin/stats");
                if (res.ok) {
                    const data = await res.json();
                    setStats(data);
                }
            } catch (error) {
                console.error("Failed to fetch stats:", error);
            }
        };

        fetchStats();
    }, []);

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                        ยอดเติมเงินทั้งหมด
                    </CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">
                        ฿{stats?.totalTopup ? Number(stats.totalTopup).toLocaleString() : "0"}
                    </div>
                    <p className="text-xs text-muted-foreground">
                        +จากประวัติการเติมเงิน
                    </p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                        ผู้ใช้งานทั้งหมด
                    </CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">
                        {stats?.totalUsers ? stats.totalUsers.toLocaleString() : "0"}
                    </div>
                    <p className="text-xs text-muted-foreground">
                        บัญชีผู้ใช้ในระบบ
                    </p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                        ยอดขายทั้งหมด
                    </CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">
                        ฿{stats?.totalSales ? Number(stats.totalSales).toLocaleString() : "0"}
                    </div>
                    <p className="text-xs text-muted-foreground">
                        จากรายการสั่งซื้อที่สำเร็จ
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
