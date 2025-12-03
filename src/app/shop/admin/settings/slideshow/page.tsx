"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Loader2, Plus, Trash2, Pencil } from "lucide-react";
import { toast } from "sonner";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";

interface SlideshowImage {
    id: number;
    image_url: string;
    display_order: number;
}

export default function SlideshowPage() {
    const [images, setImages] = useState<SlideshowImage[]>([]);
    const [loading, setLoading] = useState(true);
    const [newImageUrl, setNewImageUrl] = useState("");
    const [adding, setAdding] = useState(false);
    const [editingImage, setEditingImage] = useState<SlideshowImage | null>(null);
    const [updating, setUpdating] = useState(false);

    const fetchImages = async () => {
        try {
            const res = await fetch("/api/shop/slideshow");
            const data = await res.json();
            setImages(data);
        } catch (error) {
            console.error("Error fetching images:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchImages();
    }, []);

    const handleAddImage = async () => {
        if (!newImageUrl) return;
        setAdding(true);
        try {
            const res = await fetch("/api/shop/admin/slideshow", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ image_url: newImageUrl })
            });

            if (res.ok) {
                setNewImageUrl("");
                fetchImages();
                toast.success("เพิ่มรูปภาพสำเร็จ");
            } else {
                toast.error("เกิดข้อผิดพลาด");
            }
        } catch (error) {
            console.error("Error adding image:", error);
            toast.error("เกิดข้อผิดพลาด");
        } finally {
            setAdding(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm("คุณต้องการลบรูปภาพนี้ใช่หรือไม่?")) return;
        try {
            const res = await fetch(`/api/admin/slideshow?id=${id}`, {
                method: "DELETE"
            });

            if (res.ok) {
                fetchImages();
                toast.success("ลบรูปภาพสำเร็จ");
            }
        } catch (error) {
            console.error("Error deleting image:", error);
        }
    };

    const handleUpdate = async () => {
        if (!editingImage) return;
        setUpdating(true);
        try {
            const res = await fetch("/api/shop/admin/slideshow", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    id: editingImage.id,
                    image_url: editingImage.image_url,
                    display_order: editingImage.display_order
                })
            });

            if (res.ok) {
                fetchImages();
                setEditingImage(null);
                toast.success("อัพเดทข้อมูลสำเร็จ");
            } else {
                toast.error("เกิดข้อผิดพลาดในการอัพเดท");
            }
        } catch (error) {
            console.error("Error updating image:", error);
            toast.error("เกิดข้อผิดพลาด");
        } finally {
            setUpdating(false);
        }
    };

    if (loading) {
        return null;
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold">จัดการภาพสไลด์</h1>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>เพิ่มรูปภาพใหม่</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex gap-4">
                        <Input
                            placeholder="URL ของรูปภาพ (เช่น https://example.com/banner.jpg)"
                            value={newImageUrl}
                            onChange={(e) => setNewImageUrl(e.target.value)}
                        />
                        <Button onClick={handleAddImage} disabled={adding || !newImageUrl}>
                            <Plus className="h-4 w-4 mr-2" />
                            เพิ่มรูปภาพ
                        </Button>
                    </div>
                    {newImageUrl && (
                        <div className="mt-4 p-2 border rounded bg-slate-50">
                            <p className="text-xs text-slate-500 mb-2">ตัวอย่างรูปภาพ:</p>
                            <img src={newImageUrl} alt="Preview" className="h-40 object-contain mx-auto" />
                        </div>
                    )}
                </CardContent>
            </Card>

            <div className="space-y-4">
                {images.map((image) => (
                    <Card key={image.id} className="overflow-hidden">
                        <div className="flex items-center p-4 gap-4">
                            <div className="w-12 flex justify-center">
                                <span className="text-lg font-mono font-bold text-slate-400">#{image.display_order}</span>
                            </div>

                            <div className="h-24 w-40 bg-slate-100 rounded overflow-hidden flex-shrink-0 border">
                                <img src={image.image_url} alt={`Slide ${image.id}`} className="w-full h-full object-cover" />
                            </div>

                            <div className="flex-1 min-w-0">
                                <p className="text-sm text-slate-500 truncate">{image.image_url}</p>
                            </div>

                            <div className="flex gap-2">
                                <Dialog open={editingImage?.id === image.id} onOpenChange={(open) => !open && setEditingImage(null)}>
                                    <DialogTrigger asChild>
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            onClick={() => setEditingImage(image)}
                                        >
                                            <Pencil className="h-4 w-4" />
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                        <DialogHeader>
                                            <DialogTitle>แก้ไขรูปภาพ</DialogTitle>
                                            <DialogDescription>
                                                แก้ไข URL หรือลำดับการแสดงผลของรูปภาพ
                                            </DialogDescription>
                                        </DialogHeader>
                                        {editingImage && (
                                            <div className="grid gap-4 py-4">
                                                <div className="grid gap-2">
                                                    <Label htmlFor="url">URL รูปภาพ</Label>
                                                    <Input
                                                        id="url"
                                                        value={editingImage.image_url}
                                                        onChange={(e) => setEditingImage({ ...editingImage, image_url: e.target.value })}
                                                    />
                                                </div>
                                                <div className="grid gap-2">
                                                    <Label htmlFor="order">ลำดับการแสดงผล</Label>
                                                    <Input
                                                        id="order"
                                                        type="number"
                                                        value={editingImage.display_order}
                                                        onChange={(e) => setEditingImage({ ...editingImage, display_order: parseInt(e.target.value) || 0 })}
                                                    />
                                                </div>
                                            </div>
                                        )}
                                        <DialogFooter>
                                            <Button variant="outline" onClick={() => setEditingImage(null)}>ยกเลิก</Button>
                                            <Button onClick={handleUpdate} disabled={updating}>
                                                บันทึก
                                            </Button>
                                        </DialogFooter>
                                    </DialogContent>
                                </Dialog>

                                <Button
                                    variant="destructive"
                                    size="icon"
                                    onClick={() => handleDelete(image.id)}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </Card>
                ))}

                {images.length === 0 && (
                    <div className="text-center py-12 text-slate-500 bg-slate-50 rounded-lg border border-dashed">
                        ยังไม่มีรูปภาพสไลด์
                    </div>
                )}
            </div>
        </div>
    );
}
