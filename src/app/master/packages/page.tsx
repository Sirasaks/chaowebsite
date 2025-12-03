"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, Loader2, ShoppingBag } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface Product {
    id: number;
    name: string;
    price: string;
    duration_days: number;
    description: string;
}

export default function PackagesPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [purchasing, setPurchasing] = useState<number | null>(null);
    const { user } = useAuth();
    const router = useRouter();

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const res = await fetch("/api/master/products");
                if (res.ok) {
                    const data = await res.json();
                    setProducts(data);
                }
            } catch (error) {
                console.error("Failed to fetch products:", error);
                toast.error("ไม่สามารถโหลดข้อมูลแพ็คเกจได้");
            } finally {
                setLoading(false);
            }
        };
        fetchProducts();
    }, []);

    const handlePurchase = async (product: Product) => {
        if (!user) {
            router.push("/login?callbackUrl=/master/packages");
            return;
        }

        if (Number(user.credit) < Number(product.price)) {
            toast.error("เครดิตไม่เพียงพอ กรุณาเติมเงิน", {
                action: {
                    label: "เติมเงิน",
                    onClick: () => router.push("/topup")
                }
            });
            return;
        }

        if (!confirm(`ยืนยันการเช่าเว็บไซต์แพ็คเกจ ${product.name} ราคา ${Number(product.price).toFixed(2)} บาท?`)) {
            return;
        }

        setPurchasing(product.id);
        try {
            const res = await fetch("/api/master/orders", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ productId: product.id })
            });

            const data = await res.json();

            if (res.ok) {
                toast.success("สั่งซื้อสำเร็จ!");
                // Force reload to update credit in navbar
                window.location.href = "/master"; // Redirect to dashboard (future)
            } else {
                toast.error(data.error || "การสั่งซื้อล้มเหลว");
            }
        } catch (error) {
            console.error("Purchase error:", error);
            toast.error("เกิดข้อผิดพลาดในการเชื่อมต่อ");
        } finally {
            setPurchasing(null);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div className="container mx-auto py-12 px-4">
            <div className="text-center mb-12">
                <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    เลือกแพ็คเกจเช่าเว็บไซต์
                </h1>
                <p className="text-gray-600 text-lg">
                    เริ่มต้นธุรกิจของคุณได้ง่ายๆ ด้วยแพ็คเกจที่เหมาะสมกับคุณ
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                {products.map((product) => (
                    <Card key={product.id} className="flex flex-col hover:shadow-lg transition-shadow border-t-4 border-t-blue-500">
                        <CardHeader>
                            <CardTitle className="text-2xl">{product.name}</CardTitle>
                            <CardDescription>{product.description}</CardDescription>
                        </CardHeader>
                        <CardContent className="flex-grow">
                            <div className="mb-6">
                                <span className="text-4xl font-bold text-blue-600">฿{Number(product.price).toFixed(0)}</span>
                                <span className="text-gray-500"> / {product.duration_days} วัน</span>
                            </div>
                            <ul className="space-y-2">
                                <li className="flex items-center text-sm text-gray-600">
                                    <Check className="h-4 w-4 text-green-500 mr-2" />
                                    ระบบจัดการร้านค้าครบวงจร
                                </li>
                                <li className="flex items-center text-sm text-gray-600">
                                    <Check className="h-4 w-4 text-green-500 mr-2" />
                                    รองรับการเติมเงินอัตโนมัติ
                                </li>
                                <li className="flex items-center text-sm text-gray-600">
                                    <Check className="h-4 w-4 text-green-500 mr-2" />
                                    ทีมงานดูแลตลอดการใช้งาน
                                </li>
                            </ul>
                        </CardContent>
                        <CardFooter>
                            <Button
                                className="w-full bg-blue-600 hover:bg-blue-700"
                                onClick={() => handlePurchase(product)}
                                disabled={purchasing === product.id}
                            >
                                {purchasing === product.id ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        กำลังดำเนินการ...
                                    </>
                                ) : (
                                    <>
                                        <ShoppingBag className="mr-2 h-4 w-4" />
                                        เช่าเลย
                                    </>
                                )}
                            </Button>
                        </CardFooter>
                    </Card>
                ))}
            </div>
        </div>
    );
}
