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
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Loader2, RefreshCcw, Save } from "lucide-react";
import { toast } from "sonner";
import { Product } from "@/lib/product-service";
import { AppTableSkeleton } from "@/components/shop/admin/AppTableSkeleton";

interface AdminProduct extends Omit<Product, 'category_id'> {
    is_auto_price: boolean;
    cost_price?: string;
    api_provider?: string;
    is_active?: boolean | number;
}

interface ProductRowProps {
    product: AdminProduct;
    globalAutoMode: boolean;
    savingId: number | null;
    onSavePrice: (product: AdminProduct, newPrice: string) => void;
    onToggleActive: (product: AdminProduct) => void;
}

const ProductRow = ({
    product,
    globalAutoMode,
    savingId,
    onSavePrice,
    onToggleActive
}: ProductRowProps) => {
    const [price, setPrice] = useState(product.price);

    // Sync local state with prop when product.price changes (e.g. after save or sync)
    useEffect(() => {
        setPrice(product.price);
    }, [product.price]);

    return (
        <TableRow className={!product.is_active ? 'opacity-50' : ''}>
            <TableCell className="font-medium w-[35%]">
                <div className="flex items-center gap-3">
                    <img src={product.image} alt={product.name} className="w-8 h-8 rounded object-cover" />
                    <div>
                        <div>{product.name}</div>
                        {!product.is_active && <span className="text-xs text-red-600">สินค้าไม่พร้อมใช้งาน</span>}
                    </div>
                </div>
            </TableCell>
            <TableCell className="text-center w-[12%]">
                {product.stock}
            </TableCell>
            <TableCell className="text-right text-muted-foreground w-[15%]">
                {product.cost_price ? `฿${product.cost_price}` : '-'}
            </TableCell>
            <TableCell className="text-center w-[13%]">
                <Switch
                    checked={product.is_active === 1 || product.is_active === true}
                    onCheckedChange={() => onToggleActive(product)}
                    disabled={savingId === product.id}
                />
            </TableCell>
            <TableCell className="text-right w-[25%]">
                {globalAutoMode ? (
                    <span className="text-green-600 font-medium">฿{product.price}</span>
                ) : (
                    <div className="flex justify-end items-center gap-2">
                        <Input
                            type="number"
                            className="w-28 text-right h-8"
                            value={price}
                            onChange={(e) => setPrice(e.target.value)}
                        />
                        <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8"
                            onClick={() => onSavePrice(product, price)}
                            disabled={savingId === product.id}
                        >
                            <Save className="h-4 w-4 text-muted-foreground hover:text-primary" />
                        </Button>
                    </div>
                )}
            </TableCell>
        </TableRow>
    );
};



interface ProductTableProps {
    provider: 'gafiw';
    products: AdminProduct[];
    loading: boolean;
    syncing: boolean;
    globalAutoMode: boolean;
    updatingMode: boolean;
    savingId: number | null;
    onSync: (provider: 'gafiw') => void;
    onGlobalModeChange: (checked: boolean) => void;
    onSavePrice: (product: AdminProduct, newPrice: string) => void;
    onToggleActive: (product: AdminProduct) => void;
}

const ProductTable = ({
    provider,
    products,
    loading,
    syncing,
    globalAutoMode,
    updatingMode,
    savingId,
    onSync,
    onGlobalModeChange,
    onSavePrice,
    onToggleActive,
}: ProductTableProps) => {
    const [showSyncConfirm, setShowSyncConfirm] = useState(false);

    const filteredProducts = products.filter(p => {
        const pProvider = p.api_provider || 'gafiw'; // Default to gafiw if null
        return pProvider === provider;
    });

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center bg-slate-50 p-4 rounded-lg border">
                <div className="flex items-center gap-4">
                    <span className="text-sm font-medium">โหมดราคา:</span>
                    <div className="flex items-center gap-2">
                        <span className={`text-sm ${!globalAutoMode ? 'font-bold text-primary' : 'text-muted-foreground'}`}>Custom (กำหนดเอง)</span>
                        <Switch
                            checked={globalAutoMode}
                            onCheckedChange={onGlobalModeChange}
                            disabled={updatingMode}
                        />
                        <span className={`text-sm ${globalAutoMode ? 'font-bold text-green-600' : 'text-muted-foreground'}`}>Auto (ราคาจาก API)</span>
                    </div>
                </div>
                <Button onClick={() => setShowSyncConfirm(true)} disabled={syncing} variant="outline" size="sm">
                    <RefreshCcw className="mr-2 h-4 w-4" />
                    Sync Gafiw
                </Button>
            </div>

            <AlertDialog open={showSyncConfirm} onOpenChange={setShowSyncConfirm}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>ยืนยันการ Sync ข้อมูล (โปรอ่านก่อนกดยืนยัน)</AlertDialogTitle>
                        <AlertDialogDescription>
                            จะเป็นการดึงรายการสินค้าใหม่ ราคาที่ custom ไว้จะเป็นราคาเริ่มต้นจาก API

                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
                        <AlertDialogAction onClick={() => {
                            setShowSyncConfirm(false);
                            onSync(provider);
                        }}>
                            ยืนยัน
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {loading ? (
                <AppTableSkeleton />
            ) : (
                <div className="rounded-md border bg-white">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[35%]">สินค้า</TableHead>
                                <TableHead className="text-center w-[12%]">คงเหลือ</TableHead>
                                <TableHead className="text-right w-[15%]">ต้นทุนจากเว็บ</TableHead>
                                <TableHead className="text-center w-[13%]">สถานะ</TableHead>
                                <TableHead className="text-right w-[25%]">ราคาขาย</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredProducts.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                                        ไม่พบสินค้า Gafiw
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredProducts.map((product) => (
                                    <ProductRow
                                        key={product.id}
                                        product={product}
                                        globalAutoMode={globalAutoMode}
                                        savingId={savingId}
                                        onSavePrice={onSavePrice}
                                        onToggleActive={onToggleActive}
                                    />
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            )}
        </div>
    );
};

export default function AdminAppsPage() {
    const [products, setProducts] = useState<AdminProduct[]>([]);
    const [loading, setLoading] = useState(true);
    const [syncing, setSyncing] = useState(false);
    const [savingId, setSavingId] = useState<number | null>(null);

    // Global price mode state (true = Auto, false = Custom)
    // We'll determine this based on the majority of products or default to Auto
    const [globalAutoMode, setGlobalAutoMode] = useState(true);
    const [updatingMode, setUpdatingMode] = useState(false);

    const fetchProducts = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/admin/products/list?type=api");
            if (!res.ok) throw new Error("Failed to fetch products");
            const data = await res.json();
            setProducts(data.products);

            // Determine initial global mode based on first product or default
            if (data.products.length > 0) {
                // If any product is custom, we might want to show custom, or just default to what the majority is
                // For simplicity, let's check if ALL are auto
                const allAuto = data.products.every((p: AdminProduct) => p.is_auto_price);
                setGlobalAutoMode(allAuto);
            }

        } catch (error) {
            console.error(error);
            toast.error("Failed to load products");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProducts();
    }, []);

    const handleSync = async (provider: 'gafiw') => {
        setSyncing(true);
        try {
            const endpoint = '/api/admin/gafiw/sync';
            const res = await fetch(endpoint, { method: "POST" });
            const data = await res.json();

            if (res.ok) {
                toast.success(data.message);
                fetchProducts(); // Refresh list
            } else {
                toast.error(data.message || "Sync failed");
            }
        } catch (error) {
            toast.error("เกิดข้อผิดพลาดในการ Sync");
        } finally {
            setSyncing(false);
        }
    };

    const handleGlobalModeChange = async (checked: boolean) => {
        setUpdatingMode(true);
        const oldProducts = [...products];

        // Optimistic update
        setGlobalAutoMode(checked);
        setProducts(products.map(p => ({ ...p, is_auto_price: checked })));

        try {
            // Get all visible product IDs (or all loaded products)
            const productIds = products.map(p => p.id);

            const res = await fetch("/api/admin/products/bulk-update", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    productIds,
                    updates: { is_auto_price: checked }
                }),
            });

            if (!res.ok) throw new Error("Failed to update mode");

            // Always re-fetch to ensure we have the correct prices (DB price for Custom, API price for Auto)
            fetchProducts();

        } catch (error) {
            setGlobalAutoMode(!checked); // Revert
            setProducts(oldProducts);
            toast.error("Failed to update price mode");
        } finally {
            setUpdatingMode(false);
        }
    };

    const handleSavePrice = async (product: AdminProduct, newPrice: string) => {
        if (!newPrice || newPrice === product.price) return; // No change

        setSavingId(product.id);
        try {
            const res = await fetch("/api/admin/products/update", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    productId: product.id,
                    is_auto_price: false, // Ensure it's custom mode
                    price: newPrice
                }),
            });

            if (!res.ok) throw new Error("Failed to save");

            toast.success("บันทึกราคาเรียบร้อย");
            setProducts(products.map(p => p.id === product.id ? { ...p, price: newPrice, is_auto_price: false } : p));

        } catch (error) {
            toast.error("บันทึกราคาไม่สำเร็จ");
        } finally {
            setSavingId(null);
        }
    };

    const handleToggleActive = async (product: AdminProduct) => {
        const newStatus = !product.is_active;

        // Optimistic update
        setProducts(products.map(p => p.id === product.id ? { ...p, is_active: newStatus } : p));

        try {
            const res = await fetch("/api/admin/products/toggle-active", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    productId: product.id,
                    is_active: newStatus
                }),
            });

            if (!res.ok) throw new Error("Failed to toggle status");

            toast.success(newStatus ? "เปิดใช้งานสินค้าแล้ว" : "ปิดใช้งานสินค้าแล้ว");

        } catch (error) {
            // Revert on error
            setProducts(products.map(p => p.id === product.id ? { ...p, is_active: !newStatus } : p));
            toast.error("เปลี่ยนสถานะไม่สำเร็จ");
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold">จัดการแอพพรีเมี่ยม (API Products)</h1>
                <Button onClick={fetchProducts} variant="outline" size="sm">
                    Refresh
                </Button>
            </div>

            <ProductTable
                provider="gafiw"
                products={products}
                loading={loading}
                syncing={syncing}
                globalAutoMode={globalAutoMode}
                updatingMode={updatingMode}
                savingId={savingId}
                onSync={handleSync}
                onGlobalModeChange={handleGlobalModeChange}
                onSavePrice={handleSavePrice}
                onToggleActive={handleToggleActive}
            />
        </div>
    );
}
