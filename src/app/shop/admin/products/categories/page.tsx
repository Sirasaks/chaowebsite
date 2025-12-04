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
    DialogTrigger,
    DialogFooter,
} from "@/components/ui/dialog";
import { Loader2, Plus, Pencil, Trash2, List, Search, Save } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Category } from "@/lib/category-service";
import { CategoryTableSkeleton } from "@/components/shop/admin/CategoryTableSkeleton";

interface CategoryProduct {
    id: number;
    name: string;
    image: string;
    price: string;
    stock: number;
    sold: number;
    type: string;
    isSelected: boolean;
}

const CategoryProductsDialog = ({
    category,
    open,
    onOpenChange
}: {
    category: Category | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}) => {
    const [products, setProducts] = useState<CategoryProduct[]>([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [search, setSearch] = useState("");

    useEffect(() => {
        if (open && category) {
            fetchProducts();
        } else {
            setProducts([]);
            setSearch("");
        }
    }, [open, category]);

    const fetchProducts = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/shop/admin/categories/${category?.id}/products`);
            if (!res.ok) throw new Error("Failed to fetch products");
            const data = await res.json();
            setProducts(data.products);
        } catch (error) {
            console.error(error);
            toast.error("Failed to load products");
        } finally {
            setLoading(false);
        }
    };

    const handleToggle = (productId: number) => {
        setProducts(products.map(p =>
            p.id === productId ? { ...p, isSelected: !p.isSelected } : p
        ));
    };

    const handleSave = async () => {
        if (!category) return;
        setSaving(true);
        try {
            const selectedIds = products.filter(p => p.isSelected).map(p => p.id);
            const res = await fetch(`/api/shop/admin/categories/${category.id}/products`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ productIds: selectedIds }),
            });

            if (!res.ok) throw new Error("Failed to save");
            toast.success("บันทึกรายการสินค้าเรียบร้อย");
            onOpenChange(false);
        } catch (error) {
            toast.error("บันทึกไม่สำเร็จ");
        } finally {
            setSaving(false);
        }
    };

    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>จัดการสินค้าในหมวดหมู่: {category?.name}</DialogTitle>
                </DialogHeader>

                <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="ค้นหาสินค้า..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-8"
                    />
                </div>

                <div className="flex-1 overflow-y-auto border rounded-md p-2 space-y-1">
                    {loading ? (
                        <div className="flex justify-center p-8">
                            <Loader2 className="h-6 w-6 animate-spin" />
                        </div>
                    ) : filteredProducts.length === 0 ? (
                        <div className="text-center p-8 text-muted-foreground">ไม่พบสินค้า</div>
                    ) : (
                        filteredProducts.map(product => (
                            <div
                                key={product.id}
                                className={`flex items-center gap-3 p-2 rounded cursor-pointer border transition-all ${product.isSelected
                                    ? 'bg-gradient-primary text-white '
                                    : 'hover:bg-slate-50 '
                                    }`}
                                onClick={() => handleToggle(product.id)}
                            >
                                <div className={`w-5 h-5 rounded border flex items-center justify-center ${product.isSelected ? 'bg-white border-white' : 'border-slate-300'
                                    }`}>
                                    {product.isSelected && <div className="w-2.5 h-2.5 bg-gradient-primary rounded-sm" />}
                                </div>
                                <img src={product.image} alt={product.name} className="w-10 h-10 rounded object-cover bg-slate-100" />
                                <div className="flex-1">
                                    <div className="font-medium text-sm">{product.name}</div>
                                    <div className={`text-xs ${product.isSelected ? 'text-blue-100' : 'text-muted-foreground'}`}>
                                        ราคา: ฿{product.price} | ({product.type}) {product.type === 'form' ? `ขายไปแล้ว: ${product.sold} ชิ้น` : `คงเหลือ: ${product.stock}`}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                <DialogFooter>
                    <div className="flex-1 flex items-center text-sm text-muted-foreground">
                        เลือกแล้ว {products.filter(p => p.isSelected).length} รายการ
                    </div>
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>ยกเลิก</Button>
                    <Button onClick={handleSave} disabled={saving}>
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
                    is_active: newStatus
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

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold">จัดการหมวดหมู่สินค้า</h1>
                <Button onClick={handleAdd}>
                    <Plus className="mr-2 h-4 w-4" />
                    เพิ่มหมวดหมู่
                </Button>
            </div>

            {loading ? (
                <CategoryTableSkeleton />
            ) : (
                <div className="rounded-md border bg-white">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>รูปภาพ</TableHead>
                                <TableHead>ชื่อหมวดหมู่</TableHead>
                                <TableHead>url</TableHead>
                                <TableHead className="text-center">สถานะ</TableHead>
                                <TableHead className="text-right">จัดการ</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {categories.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
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
                                placeholder="https://example.com/image.png"
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

            <CategoryProductsDialog
                category={productDialogCategory}
                open={!!productDialogCategory}
                onOpenChange={(open) => !open && setProductDialogCategory(null)}
            />
        </div>
    );
}
