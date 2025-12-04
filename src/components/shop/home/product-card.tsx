"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Product {
    id: number;
    name: string;
    slug: string;
    image: string;
    price: number;
    description: string;
    type: string;
    stock?: number;
    account?: string;
    sold?: number;
}

interface ProductCardProps {
    product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
    const [isImageLoading, setIsImageLoading] = useState(true);
    const imgRef = useRef<HTMLImageElement>(null);

    useEffect(() => {
        // Check if image is already loaded (cached)
        if (imgRef.current?.complete) {
            setIsImageLoading(false);
        }
    }, []);

    let count = 0;
    if (product.type === 'api') {
        count = product.stock ?? 0;
    } else {
        count = product.account
            ? product.account.split("\n").filter(Boolean).length
            : 0;
    }

    return (
        <div>
            <div className="rounded-lg p-2.5 md:p-3 group hover:-translate-y-1 transition-all flex flex-col shadow-sm hover:shadow-md bg-card/50 backdrop-blur-sm border hover:border-primary">
                <Link href={`/products/${product.slug}`} className="grow">
                    <div className="w-full aspect-square mb-2 overflow-hidden rounded-lg relative bg-slate-100">
                        {/* Skeleton Loader */}
                        <img
                            src={product.image || "/placeholder-image.png"}
                            alt={product.name}
                            className="w-full h-full aspect-square rounded-lg object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                    </div>
                    <p className="font-medium w-full truncate">{product.name}</p>
                    <p className="font-medium text-gradient-primary">{product.price} บาท</p>
                </Link>

                <Button asChild className="mt-2 w-full" size="sm">
                    <Link href={`/products/${product.slug}`}>สั่งซื้อสินค้า</Link>
                </Button>

                {product.type === 'form' ? (
                    <p className="text-center text-xs text-muted-foreground mt-1">ขายไปแล้ว {product.sold || 0} ชิ้น</p>
                ) : (
                    <p className="text-center text-xs text-muted-foreground mt-1">เหลือ {count} ชิ้น</p>
                )}
            </div>
        </div>
    );
}
