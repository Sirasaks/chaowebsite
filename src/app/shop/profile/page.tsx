"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, User, ShoppingBag, Wallet, Calendar, Mail, Clock, CreditCard } from "lucide-react";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import Link from "next/link";


interface UserProfile {
    user: {
        id: number;
        username: string;
        email: string;
        role: string;
        credit: string;
        created_at: string;
    };
    stats: {
        totalOrders: number;
        totalSpent: string;
        totalTopups: number;
        totalTopupAmount: string;
    };
    recentOrders: any[];
    recentTopups: any[];
}

export default function ProfilePage() {
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const res = await fetch("/api/shop/profile");
                if (res.ok) {
                    const data = await res.json();
                    setProfile(data);
                }
            } catch (error) {
                console.error("Error fetching profile:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, []);

    if (loading) {
        return (
            <div className="max-w-7xl mx-auto px-4 py-8 space-y-8 animate-pulse">
                {/* Header Skeleton */}
                <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                    <div className="h-24 w-24 rounded-full bg-muted" />
                    <div className="space-y-2">
                        <div className="h-8 w-48 bg-muted rounded" />
                        <div className="h-4 w-32 bg-muted rounded" />
                        <div className="h-4 w-40 bg-muted rounded" />
                    </div>
                </div>
                {/* Stats Skeleton */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="h-32 bg-muted rounded-xl" />
                    ))}
                </div>
                {/* Recent Activity Skeleton */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="h-64 bg-muted rounded-xl" />
                    <div className="h-64 bg-muted rounded-xl" />
                </div>
            </div>
        );
    }

    if (!profile) {
        return (
            <div className="flex h-screen items-center justify-center flex-col gap-4">
                <p className="text-muted-foreground">ไม่พบข้อมูลผู้ใช้</p>
                <Button asChild>
                    <Link href="/login">เข้าสู่ระบบ</Link>
                </Button>
            </div>
        );
    }

    const { user, stats, recentOrders, recentTopups } = profile;

    return (
        <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                <Avatar className="h-24 w-24 border-4 border-white shadow-lg">
                    <AvatarImage src="" />
                    <AvatarFallback className="bg-gradient-primary text-white text-3xl font-bold">
                        {user.username.charAt(0).toUpperCase()}
                    </AvatarFallback>
                </Avatar>
                <div className="space-y-1">
                    <h1 className="text-3xl font-bold">{user.username}</h1>
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <Mail className="h-4 w-4" />
                        <span>{user.email || "ไม่ระบุอีเมล"}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span>สมัครเมื่อ {format(new Date(user.created_at), "d MMM yyyy", { locale: th })}</span>
                    </div>
                    <div className="pt-2">
                        <Badge variant={user.role === 'admin' || user.role === 'owner' ? 'destructive' : 'secondary'}>
                            {user.role.toUpperCase()}
                        </Badge>
                    </div>
                </div>
                <div className="ml-auto flex gap-2">
                    <Button asChild variant="outline">
                        <Link href="/settings">ตั้งค่าบัญชี</Link>
                    </Button>
                    {user.role === 'owner' && (
                        <Button asChild>
                            <Link href="/admin">จัดการระบบ</Link>
                        </Button>
                    )}
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">เครดิตคงเหลือ</CardTitle>
                        <Wallet className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-gradient-primary">฿{parseFloat(user.credit).toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground">พร้อมใช้งาน</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">ยอดใช้จ่ายรวม</CardTitle>
                        <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">฿{parseFloat(stats.totalSpent).toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground">จาก {stats.totalOrders} รายการสั่งซื้อ</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">ยอดเติมเงินรวม</CardTitle>
                        <CreditCard className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">฿{parseFloat(stats.totalTopupAmount).toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground">จาก {stats.totalTopups} รายการเติมเงิน</p>
                    </CardContent>
                </Card>
            </div>


            {/* Recent Activity Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Recent Orders */}
                <Card className="h-full">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <ShoppingBag className="h-5 w-5" />
                            รายการสั่งซื้อล่าสุด
                        </CardTitle>
                        <CardDescription>5 รายการล่าสุดที่คุณทำรายการ</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {recentOrders.length === 0 ? (
                                <p className="text-center text-muted-foreground py-4">ไม่มีรายการสั่งซื้อ</p>
                            ) : (
                                recentOrders.map((order: any) => (
                                    <div key={order.id} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                                        <div className="space-y-1">
                                            <p className="font-medium line-clamp-1">{order.product_name}</p>
                                            <p className="text-xs text-muted-foreground">
                                                {format(new Date(order.created_at), "d MMM yy HH:mm", { locale: th })}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold">฿{(parseFloat(order.price) * order.quantity).toLocaleString()}</p>
                                            <Badge variant="outline" className="text-[10px] h-5">
                                                {order.status}
                                            </Badge>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                        {recentOrders.length > 0 && (
                            <Button variant="link" className="w-full mt-4" asChild>
                                <Link href="/history">ดูทั้งหมด</Link>
                            </Button>
                        )}
                    </CardContent>
                </Card>

                {/* Recent Top-ups */}
                <Card className="h-full">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Wallet className="h-5 w-5" />
                            รายการเติมเงินล่าสุด
                        </CardTitle>
                        <CardDescription>5 รายการล่าสุดที่คุณทำรายการ</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {recentTopups.length === 0 ? (
                                <p className="text-center text-muted-foreground py-4">ไม่มีรายการเติมเงิน</p>
                            ) : (
                                recentTopups.map((topup: any) => (
                                    <div key={topup.id} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                                        <div className="space-y-1">
                                            <p className="font-medium font-mono text-sm">{topup.trans_ref}</p>
                                            <p className="text-xs text-muted-foreground">
                                                {format(new Date(topup.created_at), "d MMM yy HH:mm", { locale: th })}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold text-green-600">+฿{parseFloat(topup.amount).toLocaleString()}</p>
                                            <Badge variant={topup.status === 'completed' ? 'default' : 'secondary'} className="text-[10px] h-5">
                                                {topup.status}
                                            </Badge>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                        {recentTopups.length > 0 && (
                            <Button variant="link" className="w-full mt-4" asChild>
                                <Link href="/topup-history">ดูทั้งหมด</Link>
                            </Button>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
