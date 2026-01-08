"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ProductPrice } from "./product-price";

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
    no_agent_discount?: boolean | number;
}

interface ProductCardProps {
    product: Product;
    user?: any;
}

export function ProductCard({ product, user }: ProductCardProps) {
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
            <div className="rounded-lg p-2.5 md:p-3 group hover:-translate-y-1 transition-all flex flex-col shadow-sm hover:shadow-lg bg-white backdrop-blur-sm border hover:border-primary">
                <Link href={`/products/${product.slug}`} className="grow">
                    <div className="w-full aspect-square mb-2 overflow-hidden rounded-lg relative bg-slate-100">
                        {/* Skeleton Loader */}
                        <img
                            src={product.image || "/placeholder-image.png"}
                            alt={product.name}
                            className="w-full h-full aspect-square rounded-lg object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                    </div>
                    <div className="flex flex-col">
                        <p className="font-medium w-full truncate">{product.name}</p>
                        <ProductPrice
                            price={product.price}
                            initialUser={user}
                            allowDiscount={!(product.no_agent_discount === 1 || product.no_agent_discount === true)}
                        />
                    </div>
                </Link>

                <Button asChild className="mt-2 w-full" size="sm">
                    <Link href={`/products/${product.slug}`}>สั่งซื้อสินค้า</Link>
                </Button>

                {product.type === 'form' ? (
                    <p className="text-center text-xs text-muted-foreground mt-3">ขายไปแล้ว {product.sold || 0} ชิ้น</p>
                ) : (
                    <p className="text-center text-xs text-muted-foreground mt-3">เหลือ {count} ชิ้น</p>
                )}
            </div>
        </div>
    );
}
