"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Trash2, Edit, Plus, Save, MoreVertical, ExternalLink, ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

interface QuickLink {
    id: number;
    title: string;
    image_url: string;
    link_url: string;
    is_external: boolean;
    display_order: number;
}

export default function QuickLinksSettings() {
    const [links, setLinks] = useState<QuickLink[]>([]);
    const [loading, setLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [currentLink, setCurrentLink] = useState<Partial<QuickLink>>({});

    useEffect(() => {
        fetchLinks();
    }, []);

    const fetchLinks = async () => {
        try {
            const res = await fetch("/api/admin/quick-links");
            if (res.ok) {
                const data = await res.json();
                setLinks(data);
            }
        } catch (error) {
            console.error("Failed to fetch links", error);
            toast.error("ไม่สามารถโหลดข้อมูลได้");
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!currentLink.title || !currentLink.link_url) {
            toast.error("กรุณากรอกชื่อและลิงก์");
            return;
        }

        try {
            const method = currentLink.id ? "PUT" : "POST";
            const res = await fetch("/api/admin/quick-links", {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(currentLink),
            });

            if (res.ok) {
                toast.success(currentLink.id ? "อัปเดตข้อมูลสำเร็จ" : "เพิ่มข้อมูลสำเร็จ");
                setIsDialogOpen(false);
                setCurrentLink({});
                fetchLinks();
            } else {
                toast.error("เกิดข้อผิดพลาด");
            }
        } catch (error) {
            toast.error("เกิดข้อผิดพลาดในการบันทึก");
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm("คุณต้องการลบรายการนี้ใช่หรือไม่?")) return;

        try {
            const res = await fetch(`/api/admin/quick-links?id=${id}`, {
                method: "DELETE",
            });

            if (res.ok) {
                toast.success("ลบข้อมูลสำเร็จ");
                fetchLinks();
            } else {
                toast.error("เกิดข้อผิดพลาด");
            }
        } catch (error) {
            toast.error("เกิดข้อผิดพลาดในการลบ");
        }
    };

    const openAddDialog = () => {
        setCurrentLink({ display_order: links.length + 1, is_external: false });
        setIsDialogOpen(true);
    };

    const openEditDialog = (link: QuickLink) => {
        setCurrentLink(link);
        setIsDialogOpen(true);
    };

    return (
        <div className="space-y-8 p-8 max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">จัดการปุ่มทางลัด</h1>
                    <p className="text-muted-foreground mt-1">
                        จัดการเมนูทางลัดที่แสดงบนหน้าแรกของเว็บไซต์
                    </p>
                </div>
                <Button onClick={openAddDialog} size="lg" className="shadow-sm">
                    <Plus className="mr-2 h-5 w-5" /> เพิ่มปุ่มใหม่
                </Button>
            </div>

            {loading ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="h-48 bg-muted/50 rounded-xl animate-pulse" />
                    ))}
                </div>
            ) : links.length === 0 ? (
                <div className="text-center py-20 border-2 border-dashed rounded-xl bg-muted/10">
                    <div className="flex justify-center mb-4">
                        <div className="p-4 bg-muted rounded-full">
                            <Plus className="h-8 w-8 text-muted-foreground" />
                        </div>
                    </div>
                    <h3 className="text-lg font-medium">ยังไม่มีปุ่มทางลัด</h3>
                    <p className="text-muted-foreground mb-6">เริ่มต้นด้วยการสร้างปุ่มทางลัดใหม่</p>
                    <Button onClick={openAddDialog} variant="outline">
                        สร้างปุ่มแรกของคุณ
                    </Button>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {links.map((link) => (
                        <Card key={link.id} className="group overflow-hidden border-0 shadow-md hover:shadow-xl transition-all duration-300 bg-white/50 backdrop-blur-sm">
                            <div className="aspect-2/1 relative overflow-hidden bg-slate-100">
                                {link.image_url ? (
                                    <img
                                        src={link.image_url}
                                        alt={link.title}
                                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                                        <ImageIcon className="h-10 w-10 opacity-20" />
                                    </div>
                                )}
                                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="secondary" size="icon" className="h-8 w-8 rounded-full shadow-sm">
                                                <MoreVertical className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuLabel>จัดการ</DropdownMenuLabel>
                                            <DropdownMenuItem onClick={() => openEditDialog(link)}>
                                                <Edit className="mr-2 h-4 w-4" /> แก้ไข
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem
                                                onClick={() => handleDelete(link.id)}
                                                className="text-red-600 focus:text-red-600"
                                            >
                                                <Trash2 className="mr-2 h-4 w-4" /> ลบ
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                                <div className="absolute top-2 left-2 flex gap-1">
                                    <Badge variant="secondary" className="bg-white/90 backdrop-blur text-xs font-normal shadow-sm">
                                        ลำดับ {link.display_order}
                                    </Badge>
                                    {link.is_external && (
                                        <Badge variant="secondary" className="bg-white/90 backdrop-blur text-xs font-normal shadow-sm">
                                            <ExternalLink className="h-3 w-3 mr-1" /> ภายนอก
                                        </Badge>
                                    )}
                                </div>
                            </div>
                            <CardContent className="p-4">
                                <h3 className="font-semibold text-lg truncate mb-1">{link.title}</h3>
                                <p className="text-sm text-muted-foreground truncate font-mono bg-muted/50 p-1 rounded px-2">
                                    {link.link_url}
                                </p>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>{currentLink.id ? "แก้ไขปุ่มทางลัด" : "เพิ่มปุ่มทางลัดใหม่"}</DialogTitle>
                        <DialogDescription>
                            กรอกข้อมูลรายละเอียดของปุ่มทางลัดที่ต้องการแสดงผล
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-6 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="title">ชื่อปุ่ม (Title)</Label>
                            <Input
                                id="title"
                                value={currentLink.title || ""}
                                onChange={(e) => setCurrentLink({ ...currentLink, title: e.target.value })}
                                placeholder="เช่น สั่งซื้อสินค้า"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="url">ลิงก์ปลายทาง (URL)</Label>
                            <Input
                                id="url"
                                value={currentLink.link_url || ""}
                                onChange={(e) => setCurrentLink({ ...currentLink, link_url: e.target.value })}
                                placeholder="/categories หรือ https://..."
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="image">รูปภาพ (Image URL)</Label>
                            <div className="flex gap-4 items-start">
                                <div className="flex-1">
                                    <Input
                                        id="image"
                                        value={currentLink.image_url || ""}
                                        onChange={(e) => setCurrentLink({ ...currentLink, image_url: e.target.value })}
                                        placeholder="https://example.com/image.jpg"
                                    />
                                </div>
                                <div className="h-10 w-20 rounded border bg-muted flex items-center justify-center overflow-hidden shrink-0">
                                    {currentLink.image_url ? (
                                        <img src={currentLink.image_url} alt="Preview" className="h-full w-full object-cover" />
                                    ) : (
                                        <ImageIcon className="h-4 w-4 text-muted-foreground" />
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="order">ลำดับการแสดงผล</Label>
                                <Input
                                    id="order"
                                    type="number"
                                    value={currentLink.display_order || 0}
                                    onChange={(e) => setCurrentLink({ ...currentLink, display_order: parseInt(e.target.value) })}
                                />
                            </div>
                            <div className="flex items-center justify-between border rounded-lg p-3">
                                <div className="space-y-0.5">
                                    <Label className="text-base">ลิงก์ภายนอก</Label>
                                    <div className="text-[10px] text-muted-foreground">
                                        เปิดในแท็บใหม่
                                    </div>
                                </div>
                                <Switch
                                    checked={currentLink.is_external || false}
                                    onCheckedChange={(checked) => setCurrentLink({ ...currentLink, is_external: checked })}
                                />
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                            ยกเลิก
                        </Button>
                        <Button onClick={handleSave}>
                            บันทึกข้อมูล
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
