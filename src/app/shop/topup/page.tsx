"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Gift, CreditCard } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function TopupPage() {
    const [settings, setSettings] = useState({
        bank_transfer_enabled: "true",
        truemoney_angpao_enabled: "true",
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const res = await fetch("/api/shop/settings/payment");
                if (res.ok) {
                    const data = await res.json();
                    setSettings({
                        bank_transfer_enabled: data.bank_transfer_enabled ?? "true",
                        truemoney_angpao_enabled: data.truemoney_angpao_enabled ?? "true",
                    });
                }
            } catch (error) {
                console.error("Error fetching payment settings:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchSettings();
    }, []);

    if (loading) {
        return null;
    }

    return (
        <div className="container mx-auto py-10 px-4 max-w-4xl">
            <h1 className="text-3xl font-bold text-center mb-8 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                เลือกช่องทางการเติมเงิน
            </h1>

            <div className="grid md:grid-cols-2 gap-6">
                {settings.truemoney_angpao_enabled === "true" && (
                    <Link href="/topup/angpao" className="group">
                        <Card className="h-full hover:shadow-xl transition-all duration-300 border-2 hover:border-red-200 cursor-pointer bg-gradient-to-br from-red-50 to-white">
                            <CardHeader className="text-center pb-2">
                                <div className="mx-auto w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                                    <Gift className="w-10 h-10 text-red-600" />
                                </div>
                                <CardTitle className="text-xl font-bold text-red-600">
                                    TrueMoney Wallet (อั่งเปา)
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="text-center">
                                <span className="inline-block px-3 py-1 rounded-full bg-green-100 text-green-700 text-sm font-medium mb-2">
                                    0% ไม่มีค่าธรรมเนียม
                                </span>
                                <p className="text-muted-foreground text-sm mt-2">
                                    เติมเงินด้วยซองอั่งเปา TrueMoney<br />
                                    สะดวก รวดเร็ว ยอดเข้าทันที
                                </p>
                            </CardContent>
                        </Card>
                    </Link>
                )}

                {settings.bank_transfer_enabled === "true" && (
                    <Link href="/topup/slip" className="group">
                        <Card className="h-full hover:shadow-xl transition-all duration-300 border-2 hover:border-primary/20 cursor-pointer bg-gradient-to-br from-slate-50 to-white">
                            <CardHeader className="text-center pb-2">
                                <div className="mx-auto w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                                    <CreditCard className="w-10 h-10 text-slate-600" />
                                </div>
                                <CardTitle className="text-xl font-bold text-slate-800">
                                    ธนาคาร (เช็คสลิป)
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="text-center">
                                <span className="inline-block px-3 py-1 rounded-full bg-green-100 text-green-700 text-sm font-medium mb-2">
                                    0% ไม่มีค่าธรรมเนียม
                                </span>
                                <p className="text-muted-foreground text-sm mt-2">
                                    โอนเงินผ่านธนาคารและอัพโหลดสลิป<br />
                                    ตรวจสอบอัตโนมัติ 24 ชม.
                                </p>
                            </CardContent>
                        </Card>
                    </Link>
                )}
            </div>
        </div>
    );
}
