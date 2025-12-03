import React from 'react'
import { HeroSection } from "@/components/shop/home/hero-section";
import { StatsSection } from "@/components/shop/home/stats-section";
import { QuickLinks } from "@/components/shop/home/quick-links";
import { RecommendedCategories } from "@/components/shop/home/recommended-categories";
import { RecommendedProducts } from "@/components/shop/home/recommended-products";
import { getHomepageData } from "@/lib/home-service";

export const revalidate = 60; // Revalidate every 60 seconds (ISR)

export default async function page() {
  const { slideshow, stats, quickLinks, categories, products } = await getHomepageData();

  return (
    <div className="min-h-screen pb-10">
      <HeroSection images={slideshow} />
      <StatsSection stats={stats} />
      <QuickLinks links={quickLinks} />
      <RecommendedCategories categories={categories} />
      <RecommendedProducts products={products as any[]} />
    </div>
  );
}
