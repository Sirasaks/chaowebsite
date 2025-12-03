"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { OrderingDialog } from "@/components/shop/admin/OrderingDialog";

interface Category {
    id: number;
    name: string;
    image: string;
    slug: string;
    is_recommended: boolean;
    is_active?: boolean | number;
    display_order: number;
}

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

import { HomeTableSkeleton } from "@/components/shop/admin/HomeTableSkeleton";

export default function AdminHomePage() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [catsRes, prodsRes] = await Promise.all([
                axios.get("/api/shop/admin/categories"),
                axios.get("/api/shop/admin/products/list")
            ]);
            setCategories(catsRes.data.categories);
            setProducts(prodsRes.data.products);
        } catch (error) {
            console.error("Error fetching data:", error);
            toast.error("Failed to load data");
        } finally {
            setLoading(false);
        }
    };

    const handleSaveCategories = async (updatedItems: any[]) => {
        try {
            // Update all items in parallel
            await Promise.all(updatedItems.map(item =>
                axios.put("/api/shop/admin/categories", {
                    id: item.id,
                    name: item.name,
                    slug: item.slug,
                    image: item.image,
                    is_recommended: item.is_recommended,
                    display_order: item.display_order
                })
            ));

            // Refresh data
            await fetchData();
            toast.success("Updated categories successfully");
        } catch (error) {
            console.error("Error saving categories:", error);
            toast.error("Failed to save changes");
            throw error; // Propagate to dialog to stop loading state
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

    // Filter and sort for display
    const recommendedCategories = categories
        .filter(c => c.is_recommended)
        .sort((a, b) => (a.display_order || 0) - (b.display_order || 0));

    const recommendedProducts = products
        .filter(p => p.is_recommended)
        .sort((a, b) => (a.display_order || 0) - (b.display_order || 0));

    // Filter out inactive items for the ordering dialog
    const activeCategories = categories.filter(c => c.is_active === 1 || c.is_active === true || c.is_active === undefined);
    const activeProducts = products.filter(p => p.is_active === 1 || p.is_active === true);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold">จัดการหน้าแรก</h1>
            </div>

            <Tabs defaultValue="categories" className="w-full">
                <TabsList className="mb-4">
                    <TabsTrigger value="categories">หมวดหมู่แนะนำ</TabsTrigger>
                    <TabsTrigger value="products">สินค้าแนะนำ</TabsTrigger>
                </TabsList>

                <TabsContent value="categories">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle>หมวดหมู่แนะนำ (Recommended Categories)</CardTitle>
                            <OrderingDialog
                                title="จัดการหมวดหมู่แนะนำ"
                                items={activeCategories}
                                onSave={handleSaveCategories}
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
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {recommendedCategories.length === 0 ? (
                                                <TableRow>
                                                    <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                                                        ยังไม่มีหมวดหมู่แนะนำ
                                                    </TableCell>
                                                </TableRow>
                                            ) : (
                                                recommendedCategories.map((category, index) => (
                                                    <TableRow key={category.id}>
                                                        <TableCell className="font-medium text-center">{index + 1}</TableCell>
                                                        <TableCell>
                                                            {category.image && (
                                                                <div className="relative h-10 w-10 overflow-hidden rounded-md">
                                                                    <img
                                                                        src={category.image}
                                                                        alt={category.name}
                                                                        className="w-full h-full object-cover"
                                                                    />
                                                                </div>
                                                            )}
                                                        </TableCell>
                                                        <TableCell>{category.name}</TableCell>
                                                    </TableRow>
                                                ))
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="products">
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
                </TabsContent>
            </Tabs>
        </div>
    );
}
