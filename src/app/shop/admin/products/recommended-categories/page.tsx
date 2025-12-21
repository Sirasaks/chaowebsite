"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { OrderingDialog } from "@/components/shop/admin/OrderingDialog";
import { HomeTableSkeleton } from "@/components/shop/admin/HomeTableSkeleton";

interface Category {
    id: number;
    name: string;
    image: string;
    slug: string;
    is_recommended: boolean;
    is_active?: boolean | number;
    display_order: number;
}

export default function RecommendedCategoriesPage() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const res = await axios.get("/api/shop/admin/categories");
            setCategories(res.data.categories);
        } catch (error) {
            console.error("Error fetching categories:", error);
            toast.error("Failed to load categories");
        } finally {
            setLoading(false);
        }
    };

    const handleSaveCategories = async (updatedItems: any[]) => {
        try {
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

            await fetchData();
            toast.success("Updated categories successfully");
        } catch (error) {
            console.error("Error saving categories:", error);
            toast.error("Failed to save changes");
            throw error;
        }
    };

    const recommendedCategories = categories
        .filter(c => c.is_recommended)
        .sort((a, b) => (a.display_order || 0) - (b.display_order || 0));

    const activeCategories = categories.filter(c => c.is_active === 1 || c.is_active === true || c.is_active === undefined);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold">จัดการหมวดหมู่แนะนำ</h1>
            </div>

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
        </div>
    );
}
