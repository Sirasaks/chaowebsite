"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Clock, Calendar, AlertTriangle, ExternalLink, Store, Globe, Sparkles } from "lucide-react";

interface SubscriptionInfo {
    name: string;
    subdomain: string;
    expireDate: string;
    createdAt: string;
}

interface TimeLeft {
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
}

export default function SubscriptionPage() {
    const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);
    const [loading, setLoading] = useState(true);
    const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(null);

    useEffect(() => {
        fetchSubscription();
    }, []);

    useEffect(() => {
        if (!subscription) return;

        const calculateTimeLeft = () => {
            const expireTime = new Date(subscription.expireDate).getTime();
            const now = new Date().getTime();
            const difference = expireTime - now;

            if (difference <= 0) {
                return { days: 0, hours: 0, minutes: 0, seconds: 0 };
            }

            return {
                days: Math.floor(difference / (1000 * 60 * 60 * 24)),
                hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
                minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
                seconds: Math.floor((difference % (1000 * 60)) / 1000)
            };
        };

        setTimeLeft(calculateTimeLeft());

        const timer = setInterval(() => {
            setTimeLeft(calculateTimeLeft());
        }, 1000);

        return () => clearInterval(timer);
    }, [subscription]);

    const fetchSubscription = async () => {
        try {
            const res = await fetch("/api/shop/admin/subscription");
            if (res.ok) {
                const data = await res.json();
                setSubscription(data);
            }
        } catch (error) {
            console.error("Failed to fetch subscription:", error);
        } finally {
            setLoading(false);
        }
    };

    const isExpired = timeLeft && timeLeft.days === 0 && timeLeft.hours === 0 && timeLeft.minutes === 0 && timeLeft.seconds === 0;
    const isWarning = timeLeft && timeLeft.days <= 7 && !isExpired;

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!subscription) {
        return (
            <div className="text-center py-8">
                <p className="text-muted-foreground">ไม่พบข้อมูลการเช่า</p>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Header with Status */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                        สถานะการเช่าเว็บไซต์
                    </h1>
                    <p className="text-muted-foreground mt-1">ตรวจสอบระยะเวลาการใช้งานเว็บไซต์ของคุณ</p>
                </div>
                <Badge
                    variant={isExpired ? "destructive" : isWarning ? "warning" : "success"}
                    className="text-sm px-4 py-2 h-auto"
                >
                    <Sparkles className="h-4 w-4 mr-2" />
                    {isExpired ? "หมดอายุแล้ว" : isWarning ? "ใกล้หมดอายุ" : "Active"}
                </Badge>
            </div>

            {/* Main Countdown Card */}
            <Card className={`overflow-hidden ${isExpired ? "border-destructive border-2" : isWarning ? "border-yellow-500 border-2" : "border-primary/20"}`}>
                <div className={`h-2 w-full ${isExpired ? "bg-destructive" : isWarning ? "bg-yellow-500" : "bg-gradient-to-r from-primary to-purple-600"}`} />
                <CardHeader className="text-center pb-2">
                    <CardTitle className="flex items-center justify-center gap-2 text-xl">
                        <Clock className="h-6 w-6 text-primary" />
                        เวลาที่เหลือก่อนหมดอายุ
                    </CardTitle>
                </CardHeader>
                <CardContent className="pt-2">
                    {isExpired ? (
                        <div className="text-center py-12">
                            <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-destructive/10 mb-6">
                                <AlertTriangle className="h-12 w-12 text-destructive" />
                            </div>
                            <p className="text-3xl font-bold text-destructive">เว็บไซต์หมดอายุแล้ว</p>
                            <p className="text-muted-foreground mt-3 text-lg">กรุณาต่ออายุเพื่อใช้งานต่อ</p>
                        </div>
                    ) : timeLeft && (
                        <div className="grid grid-cols-4 gap-4 md:gap-6 py-6">
                            {/* Days */}
                            <div className="relative group">
                                <div className="absolute inset-0 bg-gradient-to-br from-primary to-purple-600 rounded-2xl blur-lg opacity-30 group-hover:opacity-50 transition-opacity" />
                                <div className="relative bg-gradient-to-br from-primary to-purple-600 text-white rounded-2xl p-4 md:p-6 text-center shadow-lg">
                                    <div className="text-4xl md:text-6xl font-bold tracking-tight">{timeLeft.days}</div>
                                    <div className="text-sm md:text-base opacity-80 mt-1 font-medium">วัน</div>
                                </div>
                            </div>

                            {/* Hours */}
                            <div className="relative group">
                                <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl blur-lg opacity-30 group-hover:opacity-50 transition-opacity" />
                                <div className="relative bg-gradient-to-br from-blue-500 to-cyan-500 text-white rounded-2xl p-4 md:p-6 text-center shadow-lg">
                                    <div className="text-4xl md:text-6xl font-bold tracking-tight">{timeLeft.hours.toString().padStart(2, '0')}</div>
                                    <div className="text-sm md:text-base opacity-80 mt-1 font-medium">ชั่วโมง</div>
                                </div>
                            </div>

                            {/* Minutes */}
                            <div className="relative group">
                                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-2xl blur-lg opacity-30 group-hover:opacity-50 transition-opacity" />
                                <div className="relative bg-gradient-to-br from-emerald-500 to-teal-500 text-white rounded-2xl p-4 md:p-6 text-center shadow-lg">
                                    <div className="text-4xl md:text-6xl font-bold tracking-tight">{timeLeft.minutes.toString().padStart(2, '0')}</div>
                                    <div className="text-sm md:text-base opacity-80 mt-1 font-medium">นาที</div>
                                </div>
                            </div>

                            {/* Seconds */}
                            <div className="relative group">
                                <div className="absolute inset-0 bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl blur-lg opacity-30 group-hover:opacity-50 transition-opacity" />
                                <div className="relative bg-gradient-to-br from-amber-500 to-orange-500 text-white rounded-2xl p-4 md:p-6 text-center shadow-lg">
                                    <div className="text-4xl md:text-6xl font-bold tracking-tight animate-pulse">{timeLeft.seconds.toString().padStart(2, '0')}</div>
                                    <div className="text-sm md:text-base opacity-80 mt-1 font-medium">วินาที</div>
                                </div>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Shop Info Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="hover:shadow-lg transition-shadow">
                    <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <Store className="h-5 w-5 text-primary" />
                            ข้อมูลร้านค้า
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                            <span className="text-muted-foreground">ชื่อร้าน</span>
                            <span className="font-semibold">{subscription.name}</span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                            <span className="text-muted-foreground">Subdomain</span>
                            <span className="font-semibold text-primary">{subscription.subdomain}</span>
                        </div>
                    </CardContent>
                </Card>

                <Card className="hover:shadow-lg transition-shadow">
                    <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <Calendar className="h-5 w-5 text-primary" />
                            ระยะเวลา
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                            <span className="text-muted-foreground">วันที่เริ่มใช้งาน</span>
                            <span className="font-semibold">{new Date(subscription.createdAt).toLocaleDateString("th-TH", { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                            <span className="text-muted-foreground">วันหมดอายุ</span>
                            <span className={`font-semibold ${isExpired ? "text-destructive" : isWarning ? "text-yellow-600" : "text-emerald-600"}`}>
                                {new Date(subscription.expireDate).toLocaleDateString("th-TH", { year: 'numeric', month: 'long', day: 'numeric' })}
                            </span>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Warning/Expired Alert */}
            {(isExpired || isWarning) && (
                <Card className={`${isExpired ? "border-destructive bg-destructive/5" : "border-yellow-500 bg-yellow-50"}`}>
                    <CardContent className="py-6">
                        <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
                            <div className={`p-3 rounded-full ${isExpired ? "bg-destructive/10" : "bg-yellow-100"}`}>
                                <AlertTriangle className={`h-8 w-8 ${isExpired ? "text-destructive" : "text-yellow-600"}`} />
                            </div>
                            <div className="flex-1">
                                <p className={`font-bold text-lg ${isExpired ? "text-destructive" : "text-yellow-800"}`}>
                                    {isExpired ? "⚠️ เว็บไซต์ของคุณหมดอายุแล้ว" : "⏰ เว็บไซต์ของคุณใกล้หมดอายุ"}
                                </p>
                                <p className={`mt-1 ${isExpired ? "text-destructive/80" : "text-yellow-700"}`}>
                                    กรุณาติดต่อผู้ดูแลระบบหรือไปที่หน้าหลักเพื่อต่ออายุเว็บไซต์ของคุณ
                                </p>
                            </div>
                            <Button
                                className={isExpired ? "bg-destructive hover:bg-destructive/90" : "bg-yellow-600 hover:bg-yellow-700"}
                                asChild
                            >
                                <a href="https://chaoweb.site" target="_blank" rel="noopener noreferrer">
                                    <ExternalLink className="mr-2 h-4 w-4" />
                                    ต่ออายุเลย
                                </a>
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Website Link */}
            <Card className="bg-gradient-to-r from-primary/5 to-purple-500/5 border-primary/20">
                <CardContent className="py-6">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="p-3 rounded-full bg-primary/10">
                                <Globe className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                                <p className="font-medium">เว็บไซต์ของคุณ</p>
                                <p className="text-sm text-muted-foreground">{subscription.subdomain}.chaoweb.site</p>
                            </div>
                        </div>
                        <Button variant="outline" asChild>
                            <a href={`/`} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="mr-2 h-4 w-4" />
                                เปิดเว็บไซต์
                            </a>
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
