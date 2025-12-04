import React from "react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { getShopIdFromContext } from "@/lib/shop-helper";
import { getCategoryBySlug } from "@/lib/category-service";
import { getProductsByCategoryId, mergeRealTimeStock } from "@/lib/product-service";
import { notFound } from "next/navigation";

import Link from "next/link";
import { Button } from "@/components/ui/button";

export const dynamic = 'force-dynamic';
export const revalidate = 60; // Revalidate every 60 seconds (ISR)

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function CategoryPage({ params }: PageProps) {
  const { slug } = await params;
  const shopId = await getShopIdFromContext();
  const category = await getCategoryBySlug(slug, shopId || 0);

  if (!category) {
    notFound();
  }

  let products = await getProductsByCategoryId(category.id);
  products = await mergeRealTimeStock(products);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <Breadcrumb className="mb-4">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/">หน้าแรก</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="/categories">หมวดหมู่</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{category.name}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Title */}
      <h1 className="text-3xl font-bold mb-6">{category.name}</h1>

      {/* Products */}
      {products.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground border rounded-lg bg-muted/10">
          <p>ยังไม่มีสินค้าในหมวดหมู่นี้</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {products.map((product, index) => {
            let count = 0;
            if (product.type === 'api') {
              count = product.stock ?? 0;
            } else {
              count = product.account
                ? product.account.split("\n").filter(Boolean).length
                : 0;
            }

            return (
              <div key={product.id}>
                <div className="rounded-lg p-2.5 md:p-3 group hover:-translate-y-1 transition-all flex flex-col shadow-sm hover:shadow-md bg-card/50 backdrop-blur-sm border hover:border-primary">
                  <Link href={`/products/${product.slug}`} className="grow">
                    <div className="w-full aspect-square mb-2 overflow-hidden rounded-lg">

                      <img
                        src={product.image || "/placeholder-image.png"}
                        alt={product.name}
                        className="w-full h-full aspect-square rounded-lg object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>


                    <p className=" font-medium w-full truncate">{product.name}</p>
                    <p className=" font-medium  text-gradient-primary">{product.price} บาท</p>
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
          })}
        </div>
      )}
    </div>
  );
}
