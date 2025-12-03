"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { Loader2, TrendingUp, TrendingDown } from "lucide-react";
import { format } from "date-fns";
import { th } from "date-fns/locale";

interface ChartData {
    topup: Array<{ date: string; total: number }>;
    sales: Array<{ date: string; total: number }>;
    users: Array<{ date: string; count: number }>;
}

export function DashboardCharts() {
    const [data, setData] = useState<ChartData | null>(null);
    const [loading, setLoading] = useState(true);
    const [range, setRange] = useState<'week' | 'month' | 'year'>('week');

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const res = await fetch(`/api/admin/dashboard/charts?range=${range}`);
                if (res.ok) {
                    const chartData = await res.json();
                    setData(chartData);
                }
            } catch (error) {
                console.error("Error fetching chart data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [range]);

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="flex justify-end">
                    <div className="h-10 w-64 bg-muted animate-pulse rounded-lg" />
                </div>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {[1, 2, 3].map((i) => (
                        <Card key={i}>
                            <CardHeader>
                                <div className="h-6 w-32 bg-muted animate-pulse rounded" />
                            </CardHeader>
                            <CardContent>
                                <div className="h-64 bg-muted animate-pulse rounded" />
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        );
    }

    if (!data) return null;

    const chartConfig = {
        topup: {
            label: "ยอดเติมเงิน",
            color: "var(--primary)",
        },
        sales: {
            label: "ยอดขาย",
            color: "var(--primary)",
        },
        users: {
            label: "ผู้ใช้ใหม่",
            color: "var(--primary)",
        },
    };

    const formatDate = (dateStr: string) => {
        try {
            if (dateStr.startsWith('Week')) {
                return dateStr.replace('Week', 'สัปดาห์ที่');
            }
            if (range === 'year') return format(new Date(dateStr + '-01'), "MMM yy", { locale: th });
            return format(new Date(dateStr), "dd MMM", { locale: th });
        } catch {
            return dateStr;
        }
    };

    const calculateTrend = (data: any[], key: string) => {
        if (data.length < 2) return 0;
        const half = Math.floor(data.length / 2);
        const recent = data.slice(-half).reduce((sum, d) => sum + (d[key] || 0), 0);
        const previous = data.slice(0, half).reduce((sum, d) => sum + (d[key] || 0), 0);

        if (previous === 0) return recent > 0 ? 100 : 0;
        return ((recent - previous) / previous) * 100;
    };

    const topupTrend = calculateTrend(data.topup, 'total');
    const salesTrend = calculateTrend(data.sales, 'total');
    const usersTrend = calculateTrend(data.users, 'count');

    const calculateStats = (data: any[], key: string) => {
        const total = data.reduce((sum, d) => sum + (d[key] || 0), 0);
        const average = total / data.length || 0;
        return { total, average };
    };

    const topupStats = calculateStats(data.topup, 'total');
    const salesStats = calculateStats(data.sales, 'total');
    const usersStats = calculateStats(data.users, 'count');

    const getRangeLabel = () => {
        switch (range) {
            case 'week': return 'สัปดาห์นี้';
            case 'month': return 'เดือนนี้';
            case 'year': return 'ปีนี้';
            default: return '';
        }
    };

    const getStatsLabel = () => {
        switch (range) {
            case 'week': return 'ยอดรวม (สัปดาห์นี้)';
            case 'month': return 'ยอดรวม (เดือนนี้)';
            case 'year': return 'ยอดรวม (ปีนี้)';
            default: return '';
        }
    };

    const getAverageLabel = () => {
        switch (range) {
            case 'week': return 'เฉลี่ยต่อวัน';
            case 'month': return 'เฉลี่ยต่อวัน';
            case 'year': return 'เฉลี่ยต่อเดือน';
            default: return '';
        }
    };

    const rangeLabel = getRangeLabel();
    const statsLabel = getStatsLabel();
    const averageLabel = getAverageLabel();

    return (
        <div className="space-y-6">
            <div className="flex justify-end">
                <div className="bg-muted/50 p-1 rounded-lg inline-flex">
                    <button
                        onClick={() => setRange('week')}
                        className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${range === 'week'
                            ? 'bg-background text-foreground shadow-sm'
                            : 'text-muted-foreground hover:text-foreground'
                            }`}
                    >
                        รายสัปดาห์
                    </button>
                    <button
                        onClick={() => setRange('month')}
                        className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${range === 'month'
                            ? 'bg-background text-foreground shadow-sm'
                            : 'text-muted-foreground hover:text-foreground'
                            }`}
                    >
                        รายเดือน
                    </button>
                    <button
                        onClick={() => setRange('year')}
                        className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${range === 'year'
                            ? 'bg-background text-foreground shadow-sm'
                            : 'text-muted-foreground hover:text-foreground'
                            }`}
                    >
                        รายปี
                    </button>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {/* Revenue Chart */}
                <Card>
                    <CardHeader>
                        <CardTitle>ยอดเติมเงิน{range === 'year' ? 'รายปี' : range === 'month' ? 'รายเดือน' : range === 'week' ? 'รายสัปดาห์' : 'รายวัน'}</CardTitle>
                        <CardDescription>
                            <div className="flex items-center gap-2">
                                <span>{rangeLabel}</span>
                                {topupTrend !== 0 && (
                                    <span className={`flex items-center text-xs ${topupTrend > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                        {topupTrend > 0 ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                                        {Math.abs(topupTrend).toFixed(1)}%
                                    </span>
                                )}
                            </div>
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ChartContainer config={chartConfig} className="h-64 w-full">
                            <BarChart data={data.topup}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis
                                    dataKey="date"
                                    tickFormatter={formatDate}
                                    tickLine={false}
                                    axisLine={false}
                                />
                                <YAxis tickLine={false} axisLine={false} />
                                <ChartTooltip content={<ChartTooltipContent />} />
                                <Bar dataKey="total" fill="var(--color-topup)" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ChartContainer>
                    </CardContent>
                    <div className="p-4 border-t bg-muted/50">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="text-center">
                                <p className="text-xs text-muted-foreground">{statsLabel}</p>
                                <p className="text-lg font-bold">฿{topupStats.total.toLocaleString()}</p>
                            </div>
                            <div className="text-center">
                                <p className="text-xs text-muted-foreground">{averageLabel}</p>
                                <p className="text-lg font-bold">฿{topupStats.average.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                            </div>
                        </div>
                    </div>
                </Card>

                {/* Users Chart */}
                <Card>
                    <CardHeader>
                        <CardTitle>ผู้ใช้ใหม่{range === 'year' ? 'รายปี' : range === 'month' ? 'รายเดือน' : range === 'week' ? 'รายสัปดาห์  ' : 'รายวัน'}</CardTitle>
                        <CardDescription>
                            <div className="flex items-center gap-2">
                                <span>{rangeLabel}</span>
                                {usersTrend !== 0 && (
                                    <span className={`flex items-center text-xs ${usersTrend > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                        {usersTrend > 0 ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                                        {Math.abs(usersTrend).toFixed(1)}%
                                    </span>
                                )}
                            </div>
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ChartContainer config={chartConfig} className="h-64 w-full">
                            <BarChart data={data.users}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis
                                    dataKey="date"
                                    tickFormatter={formatDate}
                                    tickLine={false}
                                    axisLine={false}
                                />
                                <YAxis tickLine={false} axisLine={false} />
                                <ChartTooltip content={<ChartTooltipContent />} />
                                <Bar dataKey="count" fill="var(--color-users)" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ChartContainer>
                    </CardContent>
                    <div className="p-4 border-t bg-muted/50">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="text-center">
                                <p className="text-xs text-muted-foreground">{statsLabel}</p>
                                <p className="text-lg font-bold">{usersStats.total.toLocaleString()} คน</p>
                            </div>
                            <div className="text-center">
                                <p className="text-xs text-muted-foreground">{averageLabel}</p>
                                <p className="text-lg font-bold">{usersStats.average.toLocaleString(undefined, { maximumFractionDigits: 1 })} คน</p>
                            </div>
                        </div>
                    </div>
                </Card>

                {/* Sales Chart */}
                <Card>
                    <CardHeader>
                        <CardTitle>ยอดขาย{range === 'year' ? 'รายปี' : range === 'month' ? 'รายเดือน' : range === 'week' ? 'รายสัปดาห์' : 'รายวัน'}</CardTitle>
                        <CardDescription>
                            <div className="flex items-center gap-2">
                                <span>{rangeLabel}</span>
                                {salesTrend !== 0 && (
                                    <span className={`flex items-center text-xs ${salesTrend > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                        {salesTrend > 0 ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                                        {Math.abs(salesTrend).toFixed(1)}%
                                    </span>
                                )}
                            </div>
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ChartContainer config={chartConfig} className="h-64 w-full">
                            <BarChart data={data.sales}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis
                                    dataKey="date"
                                    tickFormatter={formatDate}
                                    tickLine={false}
                                    axisLine={false}
                                />
                                <YAxis tickLine={false} axisLine={false} />
                                <ChartTooltip content={<ChartTooltipContent />} />
                                <Bar dataKey="total" fill="var(--color-sales)" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ChartContainer>
                    </CardContent>
                    <div className="p-4 border-t bg-muted/50">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="text-center">
                                <p className="text-xs text-muted-foreground">{statsLabel}</p>
                                <p className="text-lg font-bold">฿{salesStats.total.toLocaleString()}</p>
                            </div>
                            <div className="text-center">
                                <p className="text-xs text-muted-foreground">{averageLabel}</p>
                                <p className="text-lg font-bold">฿{salesStats.average.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                            </div>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
}
