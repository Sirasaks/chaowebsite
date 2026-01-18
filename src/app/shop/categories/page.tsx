import React from "react";
import Link from "next/link";

import { Card } from "@/components/ui/card";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { getShopIdFromContext } from "@/lib/shop-helper";
import { getAllCategories } from "@/lib/category-service";

export const dynamic = 'force-dynamic';
export const revalidate = 60; // Revalidate every 60 seconds (ISR)

import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'หมวดหมู่สินค้า',
  description: 'เลือกซื้อสินค้าจากหมวดหมู่ต่างๆ',
};

export default async function CategoriesPage() {
  const shopId = await getShopIdFromContext();
  const categories = await getAllCategories(shopId || 0);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <Breadcrumb className="mb-4">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/">หน้าแรก</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>หมวดหมู่</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <h1 className="text-3xl font-bold mb-8 tracking-tight bg-gradient-to-r from-primary to-primary bg-clip-text text-transparent">หมวดหมู่สินค้า</h1>

      {categories.length === 0 ? (
        <p className="text-center text-muted-foreground">
          ยังไม่มีหมวดหมู่สินค้าในขณะนี้
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {categories.map((category, index) => (
            <div key={category.id}>
              <Link href={`/categories/${category.slug}`} passHref>
                <Card className="border-none rounded-lg overflow-hidden relative group h-48 cursor-pointer shadow hover:shadow-lg transition transform hover:-translate-y-1 flex flex-col p-0">
                  <img
                    src={category.image || "/placeholder-image.png"}
                    alt={category.name}
                    className="w-full h-full object-cover"
                  />
                </Card>
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
