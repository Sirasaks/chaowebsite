"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Save, ImageIcon } from "lucide-react";
import { toast } from "sonner";

interface QuickLink {
    image_url: string;
    link_url: string;
}

export default function QuickLinksSettings() {
    const [links, setLinks] = useState<QuickLink[]>([
        { image_url: "", link_url: "" },
        { image_url: "", link_url: "" },
        { image_url: "", link_url: "" },
        { image_url: "", link_url: "" },
    ]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchLinks();
    }, []);

    const fetchLinks = async () => {
        try {
            const res = await fetch("/api/shop/admin/quick-links");
            if (res.ok) {
                const data = await res.json();
                // Map existing data to our fixed 4 slots
                const mappedLinks = [0, 1, 2, 3].map((index) => {
                    const existing = data.find((d: any) => d.display_order === index + 1);
                    return {
                        image_url: existing?.image_url || "",
                        link_url: existing?.link_url || "",
                    };
                });
                setLinks(mappedLinks);
            }
        } catch (error) {
            console.error("Failed to fetch links", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await fetch("/api/shop/admin/quick-links/batch", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ links }),
            });

            if (res.ok) {
                toast.success("บันทึกปุ่มนำทางสำเร็จ");
            } else {
                toast.error("เกิดข้อผิดพลาดในการบันทึก");
            }
        } catch (error) {
            toast.error("เกิดข้อผิดพลาดในการบันทึก");
        } finally {
            setSaving(false);
        }
    };

    const updateLink = (index: number, field: keyof QuickLink, value: string) => {
        const newLinks = [...links];
        newLinks[index] = { ...newLinks[index], [field]: value };
        setLinks(newLinks);
    };

    if (loading) {
        return null;
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold">จัดการปุ่มนำทาง</h1>
                    <p className="text-muted-foreground text-sm mt-1">
                        จัดการปุ่มทางลัดที่แสดงบนหน้าแรกของเว็บไซต์ (4 ปุ่ม)
                    </p>
                </div>
            </div>

            <div className="space-y-6">
                {links.map((link, index) => (
                    <Card key={index}>
                        <CardHeader className="pb-4">
                            <CardTitle className="text-lg">ปุ่มนำทาง {index + 1}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>รูปปุ่มนำทาง</Label>
                                    <Input
                                        value={link.image_url}
                                        onChange={(e) => updateLink(index, "image_url", e.target.value)}
                                        placeholder="800x400 px (อัตราส่วน 2:1)"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>ลิงก์ไปยังหน้า</Label>
                                    <Input
                                        value={link.link_url}
                                        onChange={(e) => updateLink(index, "link_url", e.target.value)}
                                        placeholder="https://example.com/page"
                                    />
                                </div>
                            </div>
                            {link.image_url && (
                                <div className="mt-2 border rounded-lg overflow-hidden bg-slate-50 h-24 flex items-center justify-center">
                                    <img
                                        src={link.image_url}
                                        alt={`Preview ${index + 1}`}
                                        className="h-full object-contain"
                                        onError={(e) => {
                                            (e.target as HTMLImageElement).style.display = 'none';
                                        }}
                                    />
                                </div>
                            )}
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="flex justify-end">
                <Button onClick={handleSave} disabled={saving} className="min-w-[140px]">
                    {saving ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            กำลังบันทึก...
                        </>
                    ) : (
                        <>
                            <Save className="mr-2 h-4 w-4" />
                            บันทึกปุ่มนำทาง
                        </>
                    )}
                </Button>
            </div>
        </div>
    );
}
