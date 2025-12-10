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
import { getProductsByCategoryId } from "@/lib/product-service";
import { notFound } from "next/navigation";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/shop/home/product-card";

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
  // mergeRealTimeStock removed
  // products = await mergeRealTimeStock(products);

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
          {products.map((product) => (
            <ProductCard key={product.id} product={product as any} />
          ))}
        </div>
      )}
    </div>
  );
}
