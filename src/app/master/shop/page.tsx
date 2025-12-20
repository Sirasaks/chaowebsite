"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, Loader2, ShoppingBag } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { RentWebDialog } from "@/components/master/RentWebDialog";

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
    const { user } = useAuth();
    const router = useRouter();

    // Dialog State
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

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

    const handleRentClick = (product: Product) => {
        if (!user) {
            router.push("/login?callbackUrl=/master/packages");
            return;
        }
        setSelectedProduct(product);
        setIsDialogOpen(true);
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
                                onClick={() => handleRentClick(product)}
                            >
                                <ShoppingBag className="mr-2 h-4 w-4" />
                                เช่าเลย
                            </Button>
                        </CardFooter>
                    </Card>
                ))}
            </div>

            {/* Rent Dialog */}
            {selectedProduct && user && (
                <RentWebDialog
                    isOpen={isDialogOpen}
                    onClose={() => setIsDialogOpen(false)}
                    packagePrice={Number(selectedProduct.price)}
                    packageName={selectedProduct.name}
                    userCredit={Number(user.credit)}
                />
            )}
        </div>
    );
}
