"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, Save, Palette } from "lucide-react";

interface ThemeSettings {
    site_icon: string;
    site_logo: string;
    site_background: string;
    primary_color: string;
    secondary_color: string;
}

export default function ThemeSettingsPage() {
    const [settings, setSettings] = useState<ThemeSettings>({
        site_icon: "",
        site_logo: "",
        site_background: "",
        primary_color: "#ea580c",
        secondary_color: "#8b5cf6",
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const res = await fetch("/api/shop/settings", { cache: "no-store" });
            if (res.ok) {
                const data = await res.json();
                setSettings({
                    site_icon: data.site_icon || "",
                    site_logo: data.site_logo || "",
                    site_background: data.site_background || "",
                    primary_color: data.primary_color || "#ea580c",
                    secondary_color: data.secondary_color || "#8b5cf6",
                });
            }
        } catch (error) {
            console.error("Failed to fetch settings:", error);
            toast.error("ไม่สามารถโหลดการตั้งค่าได้");
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await fetch("/api/shop/admin/settings", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(settings)
            });

            if (res.ok) {
                toast.success("บันทึกการตั้งค่าธีมเรียบร้อยแล้ว");
                window.location.reload();
            } else {
                throw new Error("Failed to save");
            }
        } catch (error) {
            console.error("Failed to save settings:", error);
            toast.error("เกิดข้อผิดพลาดในการบันทึก");
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
                <h1 className="text-2xl font-bold">จัดการ Theme</h1>
            </div>

            <div className="grid gap-6">
                {/* Logo and Icon */}
                <Card>
                    <CardHeader>
                        <CardTitle>โลโก้และไอคอน</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="site_logo">โลโก้เว็บไซต์ (URL)</Label>
                                <Input
                                    id="site_logo"
                                    value={settings.site_logo || ""}
                                    onChange={(e) => setSettings({ ...settings, site_logo: e.target.value })}
                                    placeholder="ไม่จำกัดขนาด (แนวนอน)"
                                />
                                {settings.site_logo && (
                                    <div className="mt-2 p-4 border rounded bg-slate-50 flex justify-center">
                                        <img src={settings.site_logo} alt="Logo Preview" className="h-12 object-contain" />
                                    </div>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="site_icon">ไอคอนเว็บไซต์ (Favicon URL)</Label>
                                <Input
                                    id="site_icon"
                                    value={settings.site_icon || ""}
                                    onChange={(e) => setSettings({ ...settings, site_icon: e.target.value })}
                                    placeholder="32x32 หรือ 64x64 px"
                                />
                                {settings.site_icon && (
                                    <div className="mt-2 p-4 border rounded bg-slate-50 flex justify-center">
                                        <img src={settings.site_icon} alt="Icon Preview" className="h-8 w-8 object-contain" />
                                    </div>
                                )}
                            </div>

                            <div className="space-y-2 md:col-span-2">
                                <Label htmlFor="site_background">รูปพื้นหลังเว็บไซต์ (Background URL)</Label>
                                <Input
                                    id="site_background"
                                    value={settings.site_background || ""}
                                    onChange={(e) => setSettings({ ...settings, site_background: e.target.value })}
                                    placeholder="1920x1080 px"
                                />
                                {settings.site_background && (
                                    <div className="mt-2 p-4 border rounded bg-slate-50 flex justify-center overflow-hidden h-40 relative">
                                        <img src={settings.site_background} alt="Background Preview" className="absolute inset-0 w-full h-full object-cover opacity-50" />
                                        <span className="relative z-10 font-bold text-lg">Preview Content</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Theme Colors */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Palette className="h-5 w-5" />
                            ธีมสี
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-start gap-6">
                            <div className="flex-1 grid grid-cols-2 gap-6">
                                {/* Primary Color */}
                                <div className="space-y-2">
                                    <Label htmlFor="primary_color">สีหลัก (Primary)</Label>
                                    <div className="flex gap-3 items-center">
                                        <Input
                                            id="primary_color"
                                            type="color"
                                            value={settings.primary_color || "#ea580c"}
                                            onChange={(e) => setSettings({ ...settings, primary_color: e.target.value })}
                                            className="w-16 h-10 p-1 cursor-pointer"
                                        />
                                        <Input
                                            value={settings.primary_color || ""}
                                            onChange={(e) => setSettings({ ...settings, primary_color: e.target.value })}
                                            className="flex-1 font-mono uppercase"
                                            maxLength={7}
                                        />
                                    </div>
                                </div>

                                {/* Secondary Color */}
                                <div className="space-y-2">
                                    <Label htmlFor="secondary_color">สีรอง (Secondary)</Label>
                                    <div className="flex gap-3 items-center">
                                        <Input
                                            id="secondary_color"
                                            type="color"
                                            value={settings.secondary_color || "#8b5cf6"}
                                            onChange={(e) => setSettings({ ...settings, secondary_color: e.target.value })}
                                            className="w-16 h-10 p-1 cursor-pointer"
                                        />
                                        <Input
                                            value={settings.secondary_color || ""}
                                            onChange={(e) => setSettings({ ...settings, secondary_color: e.target.value })}
                                            className="flex-1 font-mono uppercase"
                                            maxLength={7}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Preview Button */}
                            <div className="space-y-2">
                                <Label>ตัวอย่างสี</Label>
                                <div className="flex flex-col gap-2">
                                    <Button
                                        type="button"
                                        className="h-16 w-32"
                                        style={{
                                            background: `linear-gradient(135deg, ${settings.primary_color || "#ea580c"} 0%, ${settings.secondary_color || "#8b5cf6"} 100%)`,
                                            color: 'white'
                                        }}
                                    >
                                        Preview
                                    </Button>
                                    <p className="text-xs text-slate-500 text-center">Gradient</p>
                                </div>
                            </div>
                        </div>
                        <p className="text-xs text-slate-500 mt-4">สีเหล่านี้จะถูกนำไปใช้สร้าง Gradient ทั่วเว็บไซต์</p>
                    </CardContent>
                </Card>

                <div className="flex justify-end">
                    <Button type="button" onClick={handleSave} disabled={saving} className="bg-gradient-primary hover:opacity-90 text-white min-w-[120px]">
                        <Save className="mr-2 h-4 w-4" />
                        บันทึกการตั้งค่า
                    </Button>
                </div>
            </div>
        </div>
    );
}
