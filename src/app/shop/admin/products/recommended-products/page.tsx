"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { OrderingDialog } from "@/components/shop/admin/OrderingDialog";
import { HomeTableSkeleton } from "@/components/shop/admin/HomeTableSkeleton";

interface Product {
    id: number;
    name: string;
    image: string;
    price: number;
    is_recommended: boolean;
    is_active?: boolean | number;
    category_id: number;
    account: string;
    display_order: number;
}

export default function RecommendedProductsPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const res = await axios.get("/api/shop/admin/products/list");
            setProducts(res.data.products);
        } catch (error) {
            console.error("Error fetching products:", error);
            toast.error("Failed to load products");
        } finally {
            setLoading(false);
        }
    };

    const handleSaveProducts = async (updatedItems: any[]) => {
        try {
            await Promise.all(updatedItems.map(item =>
                axios.put("/api/shop/admin/products", {
                    id: item.id,
                    is_recommended: item.is_recommended,
                    display_order: item.display_order
                })
            ));

            await fetchData();
            toast.success("Updated products successfully");
        } catch (error) {
            console.error("Error saving products:", error);
            toast.error("Failed to save changes");
            throw error;
        }
    };

    const recommendedProducts = products
        .filter(p => p.is_recommended)
        .sort((a, b) => (a.display_order || 0) - (b.display_order || 0));

    const activeProducts = products.filter(p => p.is_active === 1 || p.is_active === true);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold">จัดการสินค้าแนะนำ</h1>
            </div>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>สินค้าแนะนำ (Recommended Products)</CardTitle>
                    <OrderingDialog
                        title="จัดการสินค้าแนะนำ"
                        items={activeProducts}
                        onSave={handleSaveProducts}
                        trigger={
                            <Button className="bg-gradient-primary hover:opacity-90 text-white">
                                จัดการลำดับการแสดงผล
                            </Button>
                        }
                    />
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <HomeTableSkeleton />
                    ) : (
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-[80px]">Order</TableHead>
                                        <TableHead>Image</TableHead>
                                        <TableHead>Name</TableHead>
                                        <TableHead>Price</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {recommendedProducts.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                                                ยังไม่มีสินค้าแนะนำ
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        recommendedProducts.map((product, index) => (
                                            <TableRow key={product.id}>
                                                <TableCell className="font-medium text-center">{index + 1}</TableCell>
                                                <TableCell>
                                                    {product.image && (
                                                        <div className="relative h-10 w-10 overflow-hidden rounded-md">
                                                            <img
                                                                src={product.image}
                                                                alt={product.name}
                                                                className="w-full h-full object-cover"
                                                            />
                                                        </div>
                                                    )}
                                                </TableCell>
                                                <TableCell>{product.name}</TableCell>
                                                <TableCell>฿{product.price}</TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
