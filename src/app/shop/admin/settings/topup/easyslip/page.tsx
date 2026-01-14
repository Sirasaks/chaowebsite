"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Loader2, CreditCard, Key, Check, Pencil } from "lucide-react";
import { THAI_BANKS } from "@/lib/thai-banks";
import Image from "next/image";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

export default function EasySlipSettingsPage() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [hasToken, setHasToken] = useState(false);
    const [isEditingToken, setIsEditingToken] = useState(false);
    const [newToken, setNewToken] = useState("");
    const [settings, setSettings] = useState({
        bank_transfer_enabled: false,
        bank_code: "",
        bank_account_number: "",
        bank_account_name: "",
    });

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            // Fetch payment settings
            const paymentRes = await fetch("/api/shop/admin/settings/payment");
            // Fetch API keys settings (now returns hasEasyslipToken flag)
            const keysRes = await fetch("/api/shop/admin/settings/keys");

            if (paymentRes.ok) {
                const paymentData = await paymentRes.json();
                setSettings({
                    bank_transfer_enabled: paymentData.bank_transfer_enabled === "true",
                    bank_code: paymentData.bank_code || "",
                    bank_account_number: paymentData.bank_account_number || "",
                    bank_account_name: paymentData.bank_account_name || "",
                });
            }

            if (keysRes.ok) {
                const keysData = await keysRes.json();
                setHasToken(keysData.hasEasyslipToken || false);
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
            // Save payment settings
            const paymentRes = await fetch("/api/shop/admin/settings/payment", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    bank_transfer_enabled: settings.bank_transfer_enabled,
                    bank_code: settings.bank_code,
                    bank_account_number: settings.bank_account_number,
                    bank_account_name: settings.bank_account_name,
                }),
            });

            // Save API keys only if user is editing and has provided a new token
            if (isEditingToken && newToken.trim()) {
                const keysRes = await fetch("/api/shop/admin/settings/keys", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        easyslip_access_token: newToken,
                    }),
                });

                if (keysRes.ok) {
                    setHasToken(true);
                    setIsEditingToken(false);
                    setNewToken("");
                }
            }

            if (paymentRes.ok) {
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

    const selectedBank = THAI_BANKS.find((b) => b.code === settings.bank_code);

    if (loading) {
        return null;
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold">ตั้งค่าเช็คสลิปธนาคาร (EasySlip)</h1>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* API Settings Card */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Key className="h-5 w-5 text-blue-500" />
                            ตั้งค่า API EasySlip
                        </CardTitle>
                        <CardDescription>
                            ตั้งค่า Access Token สำหรับตรวจสอบสลิปอัตโนมัติ (รับ Token ได้จาก{" "}
                            <a
                                href="https://developer.easyslip.com"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary underline"
                            >
                                developer.easyslip.com
                            </a>)
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="access_token" className="flex items-center gap-2">
                                <Key className="h-4 w-4" />
                                Access Token
                            </Label>

                            {!isEditingToken ? (
                                <div className="flex items-center gap-3">
                                    <div className="flex-1 flex items-center gap-2 px-3 py-2 bg-muted rounded-md border">
                                        <span className="font-mono text-muted-foreground">
                                            ••••••••••••••••
                                        </span>
                                        {hasToken && (
                                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                                <Check className="h-3 w-3 mr-1" />
                                                ตั้งค่าแล้ว
                                            </Badge>
                                        )}
                                        {!hasToken && (
                                            <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                                                ยังไม่ได้ตั้งค่า
                                            </Badge>
                                        )}
                                    </div>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setIsEditingToken(true)}
                                    >
                                        <Pencil className="h-4 w-4 mr-2" />
                                        {hasToken ? "เปลี่ยน Token" : "ตั้งค่า Token"}
                                    </Button>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    <Input
                                        id="access_token"
                                        type="password"
                                        placeholder="กรอก Access Token ใหม่"
                                        value={newToken}
                                        onChange={(e) => setNewToken(e.target.value)}
                                        autoFocus
                                    />
                                    <div className="flex gap-2">
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => {
                                                setIsEditingToken(false);
                                                setNewToken("");
                                            }}
                                        >
                                            ยกเลิก
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Bank Account Card */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <CreditCard className="h-5 w-5 text-green-500" />
                            ข้อมูลบัญชีธนาคาร
                        </CardTitle>
                        <CardDescription>
                            ข้อมูลบัญชีธนาคารสำหรับให้ลูกค้าโอนเงิน
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label>เปิดใช้งานการโอนเงินผ่านธนาคาร</Label>
                                <p className="text-sm text-muted-foreground">
                                    อนุญาตให้ลูกค้าเติมเงินด้วยการโอนเงินและส่งสลิป
                                </p>
                            </div>
                            <Switch
                                checked={settings.bank_transfer_enabled}
                                onCheckedChange={(checked) =>
                                    setSettings({ ...settings, bank_transfer_enabled: checked })
                                }
                            />
                        </div>

                        {/* Bank Selector with Logo */}
                        <div className="space-y-2">
                            <Label>เลือกธนาคาร</Label>
                            <Select
                                value={settings.bank_code}
                                onValueChange={(value) =>
                                    setSettings({ ...settings, bank_code: value })
                                }
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="เลือกธนาคาร">
                                        {selectedBank && (
                                            <div className="flex items-center gap-2">
                                                <Image
                                                    src={selectedBank.logo}
                                                    alt={selectedBank.name}
                                                    width={24}
                                                    height={24}
                                                    className="rounded"
                                                />
                                                <span>{selectedBank.name}</span>
                                            </div>
                                        )}
                                    </SelectValue>
                                </SelectTrigger>
                                <SelectContent>
                                    {THAI_BANKS.map((bank) => (
                                        <SelectItem key={bank.code} value={bank.code}>
                                            <div className="flex items-center gap-2">
                                                <Image
                                                    src={bank.logo}
                                                    alt={bank.name}
                                                    width={24}
                                                    height={24}
                                                    className="rounded"
                                                />
                                                <span>{bank.name}</span>
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="bank_account_number">เลขบัญชี</Label>
                            <Input
                                id="bank_account_number"
                                placeholder="xxx-x-xxxxx-x"
                                value={settings.bank_account_number}
                                onChange={(e) =>
                                    setSettings({ ...settings, bank_account_number: e.target.value })
                                }
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="bank_account_name">ชื่อบัญชี</Label>
                            <Input
                                id="bank_account_name"
                                placeholder="ชื่อ-นามสกุล"
                                value={settings.bank_account_name}
                                onChange={(e) =>
                                    setSettings({ ...settings, bank_account_name: e.target.value })
                                }
                            />
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

