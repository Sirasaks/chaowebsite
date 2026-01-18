"use client";

import { useEffect, useState } from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Loader2, Plus, Pencil, Trash2, List, Save, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Category } from "@/lib/category-service";

// Extend Category interface locally if needed, but checking usage
// Since it's imported, I should check the source file or just cast it. 
// However, the state uses Category[].
// Let's modify the file where Category is defined.
import { CategoryTableSkeleton } from "@/components/shop/admin/CategoryTableSkeleton";
import { ReorderDialog } from "@/components/shop/admin/ReorderDialog";
import axios from "axios";

// Helper for Product Reorder Dialog
const CategoryProductsReorder = ({
    category,
    open,
    onOpenChange
}: {
    category: Category | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}) => {
    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (open && category) {
            fetchProducts();
        } else {
            setProducts([]);
        }
    }, [open, category]);

    const fetchProducts = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/shop/admin/categories/${category?.id}/products`);
            if (!res.ok) throw new Error("Failed to fetch products");
            const data = await res.json();
            setProducts(data.products.sort((a: any, b: any) => (a.display_order || 0) - (b.display_order || 0)));
        } catch (error) {
            console.error(error);
            toast.error("ไม่สามารถโหลดรายการสินค้าได้");
        } finally {
            setLoading(false);
        }
    };

    const moveUp = (index: number) => {
        if (index === 0) return;
        const newItems = [...products];
        [newItems[index - 1], newItems[index]] = [newItems[index], newItems[index - 1]];
        setProducts(newItems);
    };

    const moveDown = (index: number) => {
        if (index === products.length - 1) return;
        const newItems = [...products];
        [newItems[index], newItems[index + 1]] = [newItems[index + 1], newItems[index]];
        setProducts(newItems);
    };

    const handleSave = async () => {
        if (!category) return;
        setSaving(true);
        try {
            const productOrders = products.map((p, index) => ({
                id: p.id,
                display_order: index
            }));

            const res = await fetch(`/api/shop/admin/categories/${category.id}/products`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ productOrders }),
            });

            if (!res.ok) throw new Error("Failed to save");
            toast.success("บันทึกลำดับสินค้าเรียบร้อย");
            onOpenChange(false);
        } catch (error) {
            console.error(error);
            toast.error("บันทึกไม่สำเร็จ");
        } finally {
            setSaving(false);
        }
    };

    if (!open) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl h-[80vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>จัดเรียงสินค้าในหมวดหมู่: {category?.name}</DialogTitle>
                </DialogHeader>

                {loading ? (
                    <div className="flex-1 flex items-center justify-center">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                ) : products.length === 0 ? (
                    <div className="flex-1 flex items-center justify-center text-muted-foreground">
                        ไม่มีสินค้าในหมวดหมู่นี้
                    </div>
                ) : (
                    <div className="flex-1 overflow-y-auto p-2 space-y-2 border rounded-md bg-slate-50">
                        {products.map((item, index) => (
                            <div key={item.id} className="flex items-center gap-2 p-2 bg-card text-card-foreground border rounded shadow-sm">
                                <div className="text-slate-400 font-bold w-6 text-center">{index + 1}</div>

                                {item.image ? (
                                    <div className="relative w-10 h-10 rounded overflow-hidden bg-slate-200 shrink-0">
                                        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                                    </div>
                                ) : (
                                    <div className="w-10 h-10 rounded bg-slate-200 flex items-center justify-center text-[10px] text-slate-500 shrink-0">No Img</div>
                                )}

                                <span className="text-sm font-medium flex-1">{item.name}</span>

                                <div className="flex items-center gap-1">
                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        className="h-7 w-7 hover:bg-slate-100"
                                        disabled={index === 0}
                                        onClick={() => moveUp(index)}
                                    >
                                        <ArrowUp className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        className="h-7 w-7 hover:bg-slate-100"
                                        disabled={index === products.length - 1}
                                        onClick={() => moveDown(index)}
                                    >
                                        <ArrowDown className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                <DialogFooter className="mt-4 flex-shrink-0">
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>ยกเลิก</Button>
                    <Button onClick={handleSave} disabled={saving || products.length === 0}>
                        {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                        บันทึก
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default function AdminCategoriesPage() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [currentCategory, setCurrentCategory] = useState<Partial<Category>>({});
    const [saving, setSaving] = useState(false);

    // State for managing products dialog
    const [productDialogCategory, setProductDialogCategory] = useState<Category | null>(null);

    const fetchCategories = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/shop/admin/categories");
            if (!res.ok) throw new Error("Failed to fetch categories");
            const data = await res.json();
            setCategories(data.categories);
        } catch (error) {
            console.error(error);
            toast.error("Failed to load categories");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCategories();
    }, []);

    const handleAdd = () => {
        setIsEditing(false);
        setCurrentCategory({});
        setIsDialogOpen(true);
    };

    const handleEdit = (category: Category) => {
        setIsEditing(true);
        setCurrentCategory(category);
        setIsDialogOpen(true);
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Are you sure you want to delete this category?")) return;

        try {
            const res = await fetch(`/api/shop/admin/categories?id=${id}`, {
                method: "DELETE",
            });
            const data = await res.json();

            if (!res.ok) throw new Error(data.error || "Delete failed");

            toast.success("Category deleted");
            fetchCategories();
        } catch (error: any) {
            toast.error(error.message);
        }
    };

    const handleSave = async () => {
        if (saving) return; // ป้องกัน double submission

        if (!currentCategory.name) {
            toast.error("Name is required");
            return;
        }

        setSaving(true);
        try {
            const method = isEditing ? "PUT" : "POST";
            const res = await fetch("/api/shop/admin/categories", {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(currentCategory),
            });

            const data = await res.json();

            if (!res.ok) throw new Error(data.error || "Save failed");

            toast.success(isEditing ? "Category updated" : "Category created");
            setIsDialogOpen(false);
            fetchCategories();
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setSaving(false);
        }
    };

    const handleToggleStatus = async (category: Category) => {
        try {
            const newStatus = category.is_active === 1 || category.is_active === true ? 0 : 1;
            const res = await fetch("/api/shop/admin/categories", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    id: category.id,
                    name: category.name,
                    slug: category.slug,
                    image: category.image,
                    is_active: newStatus,
                    no_agent_discount: category.no_agent_discount
                }),
            });

            if (!res.ok) throw new Error("Failed to update category status");

            toast.success(newStatus === 1 ? "เปิดใช้งานหมวดหมู่แล้ว" : "ปิดใช้งานหมวดหมู่แล้ว");
            await fetchCategories();
        } catch (error) {
            console.error(error);
            toast.error("Failed to update category status");
        }
    };

    const handleToggleDiscount = async (category: Category) => {
        try {
            // Logic: if currently no_agent_discount is true (disabled), new value is false (enabled)
            // If currently no_agent_discount is false (enabled), new value is true (disabled)
            const newNoDiscount = !category.no_agent_discount;
            const res = await fetch("/api/shop/admin/categories", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    id: category.id,
                    name: category.name,
                    slug: category.slug,
                    image: category.image,
                    is_active: category.is_active,
                    no_agent_discount: newNoDiscount
                }),
            });

            if (!res.ok) throw new Error("Failed to update discount setting");

            toast.success(newNoDiscount ? "ปิดราคานายหน้าแล้ว" : "เปิดราคานายหน้าแล้ว");
            await fetchCategories();
        } catch (error) {
            console.error(error);
            toast.error("Failed to update discount setting");
        }
    };

    const handleReorderCategories = async (updatedItems: any[]) => {
        try {
            await Promise.all(updatedItems.map(item =>
                axios.put("/api/shop/admin/categories", {
                    id: item.id,
                    name: item.name,
                    slug: item.slug,
                    image: item.image,
                    is_recommended: item.is_recommended, // preserve existing
                    is_active: item.is_active, // preserve existing
                    display_order: item.display_order
                })
            ));
            await fetchCategories();
            // Success toast is handled by dialog
        } catch (error) {
            console.error(error);
            throw error;
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold">จัดการหมวดหมู่สินค้า</h1>
                <div className="flex gap-2">
                    <ReorderDialog
                        title="จัดเรียงหมวดหมู่"
                        items={categories}
                        onSave={handleReorderCategories}
                        trigger={
                            <Button variant="outline">
                                <ArrowUpDown className="mr-2 h-4 w-4" />
                                จัดเรียง
                            </Button>
                        }
                    />
                    <Button onClick={handleAdd}>
                        <Plus className="mr-2 h-4 w-4" />
                        เพิ่มหมวดหมู่
                    </Button>
                </div>
            </div>

            {loading ? (
                <CategoryTableSkeleton />
            ) : (
                <div className="rounded-md border bg-card text-card-foreground">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>รูปภาพ</TableHead>
                                <TableHead>ชื่อหมวดหมู่</TableHead>
                                <TableHead>url</TableHead>
                                <TableHead className="text-center">ราคานายหน้า</TableHead>
                                <TableHead className="text-center">สถานะ</TableHead>
                                <TableHead className="text-right">จัดการ</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {categories.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                                        ไม่พบหมวดหมู่
                                    </TableCell>
                                </TableRow>
                            ) : (
                                categories.map((category) => (
                                    <TableRow key={category.id}>
                                        <TableCell>
                                            <div className="w-10 h-10 rounded overflow-hidden bg-muted">
                                                {category.image ? (
                                                    <img src={category.image} alt={category.name} className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">No Img</div>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell className="font-medium">{category.name}</TableCell>
                                        <TableCell className="text-muted-foreground">{category.slug}</TableCell>
                                        <TableCell className="text-center">
                                            <div className="flex justify-center">
                                                <Switch
                                                    checked={!category.no_agent_discount}
                                                    onCheckedChange={() => handleToggleDiscount(category)}
                                                    className="data-[state=checked]:bg-green-500"
                                                />
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <div className="flex justify-center">
                                                <Switch
                                                    checked={category.is_active === 1 || category.is_active === true}
                                                    onCheckedChange={() => handleToggleStatus(category)}
                                                />
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => setProductDialogCategory(category)}
                                                    className="h-8"
                                                >
                                                    <List className="mr-2 h-3 w-3" />
                                                    จัดการสินค้า
                                                </Button>
                                                <Button variant="ghost" size="icon" onClick={() => handleEdit(category)}>
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                                <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => handleDelete(category.id)}>
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            )}

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{isEditing ? "แก้ไขหมวดหมู่" : "เพิ่มหมวดหมู่ใหม่"}</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="name">ชื่อหมวดหมู่</Label>
                            <Input
                                id="name"
                                value={currentCategory.name || ""}
                                onChange={(e) => setCurrentCategory({ ...currentCategory, name: e.target.value })}
                                placeholder="เช่น Netflix, Youtube Premium"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="slug">url ห้ามเป็นภาษาไทยและเว้นวรรคเด็ดขาด</Label>
                            <Input
                                id="slug"
                                value={currentCategory.slug || ""}
                                onChange={(e) => setCurrentCategory({ ...currentCategory, slug: e.target.value })}
                                placeholder="เช่น netflix, youtube-premium"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="image">รูปภาพ (URL)</Label>
                            <Input
                                id="image"
                                value={currentCategory.image || ""}
                                onChange={(e) => setCurrentCategory({ ...currentCategory, image: e.target.value })}
                                placeholder="800x450 px (อัตราส่วน 16:9)"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={saving}>ยกเลิก</Button>
                        <Button onClick={handleSave} disabled={saving}>
                            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                            บันทึก
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <CategoryProductsReorder
                category={productDialogCategory}
                open={!!productDialogCategory}
                onOpenChange={(open) => !open && setProductDialogCategory(null)}
            />
        </div>
    );
}
