import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ProductCard } from "./product-card";

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

interface RecommendedProductsProps {
    products: Product[];
    user?: any;
}

export function RecommendedProducts({ products, user }: RecommendedProductsProps) {
    if (products.length === 0) return null;

    return (
        <section className=" pb-8">
            <div className="mx-auto max-w-7xl px-4 ">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary bg-clip-text text-transparent">สินค้าแนะนำ</h2>
                    <Button asChild size="sm">
                        <Link href="/categories">ดูเพิ่มเติม →</Link>
                    </Button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {products.map((product) => (
                        <ProductCard key={product.id} product={product} user={user} />
                    ))}
                </div>
            </div>
        </section>
    );
}
