"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, Save } from "lucide-react";


interface SiteSettings {
    site_title: string;
    site_description: string;
    site_icon: string;
    site_logo: string;
    site_background: string;
    primary_color: string;
    secondary_color: string;
    contact_link: string;
    announcement_text?: string;
}

export default function SettingsPage() {
    const [settings, setSettings] = useState<SiteSettings>({
        site_title: "",
        site_description: "",
        site_icon: "",
        site_logo: "",
        site_background: "",
        primary_color: "#ea580c",
        secondary_color: "#8b5cf6",
        contact_link: "",
        announcement_text: ""
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
                setSettings(data);
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
                toast.success("บันทึกการตั้งค่าเรียบร้อยแล้ว");
                // Force reload to apply changes globally
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
                <h1 className="text-2xl font-bold">ตั้งค่าเว็บไซต์</h1>
            </div>

            <div className="grid gap-6">
                {/* General Settings */}
                <Card>
                    <CardHeader>
                        <CardTitle>ข้อมูลทั่วไป</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="site_title">ชื่อเว็บไซต์ (Title)</Label>
                            <Input
                                id="site_title"
                                value={settings.site_title || ""}
                                onChange={(e) => setSettings({ ...settings, site_title: e.target.value })}
                                placeholder="My Shop V4"
                            />
                            <p className="text-xs text-slate-500">ชื่อที่จะแสดงบนแถบ Browser</p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="site_description">คำอธิบายร้านค้า (SEO Description)</Label>
                            <textarea
                                id="site_description"
                                value={settings.site_description || ""}
                                onChange={(e) => setSettings({ ...settings, site_description: e.target.value })}
                                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                placeholder="ร้านค้าออนไลน์ที่ดีที่สุด..."
                            />
                            <p className="text-xs text-slate-500">คำอธิบายสั้นๆ เกี่ยวกับร้านค้าของคุณ สำหรับการทำ SEO</p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="announcement_text">ข้อความประกาศ (Announcement Marquee)</Label>
                            <Input
                                id="announcement_text"
                                value={settings.announcement_text || ""}
                                onChange={(e) => setSettings({ ...settings, announcement_text: e.target.value })}
                                placeholder="ยินดีต้อนรับสู่ร้านค้าของเรา โปรโมชั่นพิเศษ..."
                            />
                            <p className="text-xs text-slate-500">ข้อความวิ่งที่จะแสดงบนหน้าเว็บไซต์ (เว้นว่างหากไม่ต้องการแสดง)</p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="contact_link">ลิงก์ติดต่อเรา (Contact Link)</Label>
                            <Input
                                id="contact_link"
                                value={settings.contact_link || ""}
                                onChange={(e) => setSettings({ ...settings, contact_link: e.target.value })}
                                placeholder="https://line.me/ti/p/~yourline หรือ https://facebook.com/yourpage"
                            />
                            <p className="text-xs text-slate-500">ลิงก์ภายนอกสำหรับการติดต่อ (เช่น LINE, Facebook, หรือเว็บไซต์อื่น)</p>
                        </div>
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
