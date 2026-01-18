"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { Loader2, Save, CreditCard } from "lucide-react";
import { THAI_BANKS } from "@/lib/thai-banks";

export function PaymentSettingsForm() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [settings, setSettings] = useState({
        bank_name: "",
        bank_account_number: "",
        bank_account_name: "",
        truemoney_phone: "",
        bank_transfer_enabled: true,
        truemoney_angpao_enabled: true,
    });

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const res = await fetch("/api/shop/admin/settings/payment");
                if (res.ok) {
                    const data = await res.json();
                    setSettings({
                        bank_name: data.bank_name || "",
                        bank_account_number: data.bank_account_number || "",
                        bank_account_name: data.bank_account_name || "",
                        truemoney_phone: data.truemoney_phone || "",
                        bank_transfer_enabled: data.bank_transfer_enabled !== "false",
                        truemoney_angpao_enabled: data.truemoney_angpao_enabled !== "false",
                    });
                }
            } catch (error) {
                console.error("Error fetching settings:", error);
                toast.error("ไม่สามารถโหลดข้อมูลการตั้งค่าได้");
            } finally {
                setLoading(false);
            }
        };

        fetchSettings();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await saveSettings();
    };

    const saveSettings = async () => {
        setSaving(true);

        try {
            const res = await fetch("/api/shop/admin/settings/payment", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(settings),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Failed to update settings");
            }

            toast.success(data.message);
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setSaving(false);
        }
    };

    const handleToggleChange = async (field: 'bank_transfer_enabled' | 'truemoney_angpao_enabled', checked: boolean) => {
        // Update state immediately
        setSettings(prev => ({ ...prev, [field]: checked }));

        // Auto-save
        setSaving(true);
        try {
            const updatedSettings = { ...settings, [field]: checked };
            const res = await fetch("/api/shop/admin/settings/payment", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(updatedSettings),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Failed to update settings");
            }

            toast.success(checked ? "เปิดใช้งานแล้ว" : "ปิดใช้งานแล้ว");
        } catch (error: any) {
            // Revert on error
            setSettings(prev => ({ ...prev, [field]: !checked }));
            toast.error(error.message);
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return null;
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <CreditCard className="h-5 w-5" />
                                ตั้งค่าบัญชีธนาคาร (ต้องใส่API Key)
                            </CardTitle>
                            <CardDescription>
                                ข้อมูลบัญชีธนาคารสำหรับให้ลูกค้าโอนเงิน (แสดงในหน้าเติมเงิน)
                            </CardDescription>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Switch
                                id="bank_transfer_enabled"
                                checked={settings.bank_transfer_enabled}
                                onCheckedChange={(checked) => handleToggleChange('bank_transfer_enabled', checked)}
                            />
                            <Label htmlFor="bank_transfer_enabled">เปิดใช้งาน</Label>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="bank_name">เลือกธนาคาร</Label>
                        <Select
                            value={settings.bank_name}
                            onValueChange={(value) => setSettings({ ...settings, bank_name: value })}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="เลือกธนาคาร" />
                            </SelectTrigger>
                            <SelectContent>
                                {THAI_BANKS.map((bank) => (
                                    <SelectItem key={bank.code} value={bank.name}>
                                        <div className="flex items-center gap-2">
                                            <div
                                                className="w-6 h-6 rounded-full overflow-hidden border border-slate-200 flex items-center justify-center bg-card text-card-foreground"
                                            >
                                                <img
                                                    src={bank.logo}
                                                    alt={bank.name}
                                                    className="w-full h-full object-cover"
                                                    onError={(e) => {
                                                        // Fallback if image fails
                                                        e.currentTarget.style.display = 'none';
                                                        e.currentTarget.parentElement!.style.backgroundColor = bank.color;
                                                    }}
                                                />
                                            </div>
                                            <span>{bank.name}</span>
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="bank_account_number">เลขที่บัญชี</Label>
                        <Input
                            id="bank_account_number"
                            placeholder="xxx-x-xxxxx-x"
                            value={settings.bank_account_number}
                            onChange={(e) => setSettings({ ...settings, bank_account_number: e.target.value })}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="bank_account_name">ชื่อบัญชี</Label>
                        <Input
                            id="bank_account_name"
                            placeholder="ชื่อ-นามสกุล เจ้าของบัญชี"
                            value={settings.bank_account_name}
                            onChange={(e) => setSettings({ ...settings, bank_account_name: e.target.value })}
                        />
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <CreditCard className="h-5 w-5 text-red-500" />
                                ตั้งค่า TrueMoney Wallet
                            </CardTitle>
                            <CardDescription>
                                ข้อมูลสำหรับรับเงินผ่านซองอั่งเปา TrueMoney
                            </CardDescription>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Switch
                                id="truemoney_angpao_enabled"
                                checked={settings.truemoney_angpao_enabled}
                                onCheckedChange={(checked) => handleToggleChange('truemoney_angpao_enabled', checked)}
                            />
                            <Label htmlFor="truemoney_angpao_enabled">เปิดใช้งาน</Label>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2">
                        <Label htmlFor="truemoney_phone">เบอร์ TrueMoney (สำหรับรับซองอั่งเปา)</Label>
                        <Input
                            id="truemoney_phone"
                            placeholder="08xxxxxxxx"
                            value={settings.truemoney_phone}
                            onChange={(e) => setSettings({ ...settings, truemoney_phone: e.target.value })}
                        />
                        <p className="text-xs text-muted-foreground">
                            เบอร์โทรศัพท์ที่ผูกกับบัญชี TrueMoney Wallet สำหรับรับเงินจากซองอั่งเปา
                        </p>
                    </div>
                </CardContent>
            </Card>

            <div className="flex justify-end">
                <Button type="submit" disabled={saving} className="min-w-[120px]">
                    <Save className="mr-2 h-4 w-4" />
                    บันทึกการตั้งค่า
                </Button>
            </div>
        </form>
    );
}
