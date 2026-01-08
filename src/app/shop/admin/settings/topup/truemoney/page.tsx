"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Loader2, Gift, Phone, Percent } from "lucide-react";

export default function TruemoneySettingsPage() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [settings, setSettings] = useState({
        truemoney_phone: "",
        truemoney_angpao_enabled: false,
        truemoney_fee_enabled: false,
    });

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const res = await fetch("/api/shop/admin/settings/payment");
            if (res.ok) {
                const data = await res.json();
                setSettings({
                    truemoney_phone: data.truemoney_phone || "",
                    truemoney_angpao_enabled: data.truemoney_angpao_enabled === "true",
                    truemoney_fee_enabled: data.truemoney_fee_enabled === "true",
                });
            }
        } catch (error) {
            console.error("Error fetching settings:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        try {
            const res = await fetch("/api/shop/admin/settings/payment", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    truemoney_phone: settings.truemoney_phone,
                    truemoney_angpao_enabled: settings.truemoney_angpao_enabled,
                    truemoney_fee_enabled: settings.truemoney_fee_enabled,
                }),
            });

            if (res.ok) {
                toast.success("บันทึกการตั้งค่าเรียบร้อยแล้ว");
            } else {
                toast.error("เกิดข้อผิดพลาดในการบันทึก");
            }
        } catch (error) {
            toast.error("เกิดข้อผิดพลาดในการเชื่อมต่อ");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return null;
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold">ตั้งค่า Truemoney อังเปา</h1>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Gift className="h-5 w-5 text-orange-500" />
                            Truemoney Angpao
                        </CardTitle>
                        <CardDescription>
                            ตั้งค่าการรับเติมเงินผ่าน Truemoney อังเปา
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label>เปิดใช้งาน Truemoney อังเปา</Label>
                                <p className="text-sm text-muted-foreground">
                                    อนุญาตให้ลูกค้าเติมเงินผ่านอังเปา
                                </p>
                            </div>
                            <Switch
                                checked={settings.truemoney_angpao_enabled}
                                onCheckedChange={(checked) =>
                                    setSettings({ ...settings, truemoney_angpao_enabled: checked })
                                }
                            />
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label className="flex items-center gap-2">
                                    <Percent className="h-4 w-4" />
                                    หักค่าธรรมเนียม 2.9%
                                </Label>
                                <p className="text-sm text-muted-foreground">
                                    หักค่าธรรมเนียม Truemoney 2.9% จากยอดเติมเงินของลูกค้า
                                </p>
                            </div>
                            <Switch
                                checked={settings.truemoney_fee_enabled}
                                onCheckedChange={(checked) =>
                                    setSettings({ ...settings, truemoney_fee_enabled: checked })
                                }
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="phone" className="flex items-center gap-2">
                                <Phone className="h-4 w-4" />
                                เบอร์โทรศัพท์รับอังเปา
                            </Label>
                            <Input
                                id="phone"
                                type="tel"
                                placeholder="0812345678"
                                value={settings.truemoney_phone}
                                onChange={(e) =>
                                    setSettings({ ...settings, truemoney_phone: e.target.value })
                                }
                            />
                            <p className="text-sm text-muted-foreground">
                                เบอร์โทรศัพท์ที่ลงทะเบียน Truemoney Wallet สำหรับรับอังเปา
                            </p>
                        </div>
                    </CardContent>
                </Card>

                <div className="flex justify-end">
                    <Button type="submit" disabled={saving} className="bg-gradient-primary hover:opacity-90 text-white min-w-[120px]">
                        {saving ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                กำลังบันทึก...
                            </>
                        ) : (
                            "บันทึกการตั้งค่า"
                        )}
                    </Button>
                </div>
            </form>
        </div>
    );
}
