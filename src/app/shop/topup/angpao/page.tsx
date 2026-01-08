"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, AlertCircle, ChevronLeft, Gift, Percent } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function TopupAngpaoPage() {
    const { user, setUser } = useAuth();
    const [voucherUrl, setVoucherUrl] = useState("");
    const [loading, setLoading] = useState(false);
    const [checking, setChecking] = useState(true);
    const [feeEnabled, setFeeEnabled] = useState(false);
    const router = useRouter();

    useEffect(() => {
        const checkEnabled = async () => {
            try {
                const res = await fetch("/api/shop/settings/payment");
                if (res.ok) {
                    const data = await res.json();
                    if (data.truemoney_angpao_enabled === "false") {
                        toast.error("ช่องทางการเติมเงินนี้ปิดปรับปรุง");
                        router.push("/topup");
                        return;
                    }
                    setFeeEnabled(data.truemoney_fee_enabled === "true");
                    setChecking(false);
                } else {
                    setChecking(false);
                }
            } catch (error) {
                console.error("Error checking settings:", error);
                setChecking(false);
            }
        };
        checkEnabled();
    }, [router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (loading) return; // ป้องกัน double submission

        if (!voucherUrl) {
            toast.error("กรุณากรอกลิงก์ซองอั่งเปา");
            return;
        }

        if (!voucherUrl.includes("gift.truemoney.com")) {
            toast.error("ลิงก์ซองอั่งเปาไม่ถูกต้อง");
            return;
        }

        setLoading(true);
        try {
            const res = await fetch("/api/shop/topup/angpao", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ voucherUrl }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "เกิดข้อผิดพลาดในการเติมเงิน");
            }

            toast.success(`เติมเงินสำเร็จ! ได้รับ ${data.amount} เครดิต`);

            // Update user credit locally
            if (user) {
                setUser({ ...user, credit: Number(user.credit || 0) + Number(data.amount) });
            }

            setVoucherUrl("");
        } catch (error: any) {
            console.error(error);
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    if (checking) {
        return null;
    }

    return (
        <div className="container mx-auto py-10 px-4 max-w-md ">
            <Link href="/topup" className="flex items-center text-sm text-muted-foreground hover:text-primary mb-4 transition-colors">
                <ChevronLeft className="w-4 h-4 mr-1" />
                ย้อนกลับ
            </Link>

            <Card className="border shadow-lg bg-white backdrop-blur-sm">
                <CardHeader className="text-center">
                    <div className="mx-auto w-16 h-16  rounded-full flex items-center justify-center mb-4">
                        <Gift className="w-8 h-8 text-primary " />
                    </div>
                    <CardTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                        TrueMoney Wallet (อั่งเปา)
                    </CardTitle>
                    <CardDescription>
                        สร้างซองอั่งเปาแล้วนำลิงก์มากรอกเพื่อเติมเครดิต
                    </CardDescription>
                    {feeEnabled && (
                        <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-orange-100 text-orange-700 text-sm font-medium">
                            <Percent className="w-4 h-4" />
                            หักค่าธรรมเนียม 2.9% จากยอดเติมเงิน
                        </div>
                    )}
                </CardHeader>
                <CardContent className="space-y-6">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="voucherUrl">ลิงก์อั่งเปา / Share Link</Label>
                            <Input
                                id="voucherUrl"
                                placeholder="https://gift.truemoney.com/campaign/?v=..."
                                value={voucherUrl}
                                onChange={(e) => setVoucherUrl(e.target.value)}
                                disabled={loading}
                            />
                            <p className="text-xs text-muted-foreground">
                                ต้องเป็นลิงก์อั่งเปาที่ได้รับจากการแชร์ของผู้ใช้งานเท่านั้น
                            </p>
                        </div>

                        <Button type="submit" className="w-full  text-white" disabled={loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            เติมเงิน
                        </Button>
                    </form>

                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex gap-3 items-start">
                        <AlertCircle className="h-5 w-5 text-yellow-600 shrink-0 mt-0.5" />
                        <div className="text-sm text-yellow-800">
                            <p className="font-semibold mb-1">ข้อแนะนำ</p>
                            <ul className="list-disc list-inside space-y-1 text-xs">
                                <li>สร้างซองอั่งเปาแบบ "แบ่งจำนวนเงินเท่ากัน"</li>
                                <li>กรอกจำนวนเงินที่ต้องการเติม</li>
                                <li>ตั้งค่าจำนวนคนรับซองเป็น 1 คน</li>
                            </ul>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
