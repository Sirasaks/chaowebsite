"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, ShoppingBag } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { RentWebDialog } from "@/components/master/RentWebDialog";
import { MasterProduct } from "@/lib/master-data-service";

interface ShopClientProps {
    products: MasterProduct[];
}

export function ShopClient({ products }: ShopClientProps) {
    const { user } = useAuth();
    const router = useRouter();

    // Dialog State
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<MasterProduct | null>(null);

    const handleRentClick = (product: MasterProduct) => {
        if (!user) {
            router.push("/login?callbackUrl=/shop");
            return;
        }
        setSelectedProduct(product);
        setIsDialogOpen(true);
    };

    return (
        <div className="container mx-auto py-10 px-4 max-w-4xl">
            <h1 className="text-3xl font-semibold text-center mb-8 bg-blue-600 bg-clip-text text-transparent">
                เลือกแพ็คเกจเช่าเว็บไซต์
            </h1>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
