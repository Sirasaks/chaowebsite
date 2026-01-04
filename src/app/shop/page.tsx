import React from 'react'
import { HeroSection } from "@/components/shop/home/hero-section";
import { StatsSection } from "@/components/shop/home/stats-section";
import { QuickLinks } from "@/components/shop/home/quick-links";
import { RecommendedCategories } from "@/components/shop/home/recommended-categories";
import { RecommendedProducts } from "@/components/shop/home/recommended-products";
import { MarqueeSection } from "@/components/shop/home/marquee-section";
import { getHomepageData } from "@/lib/home-service";

import { getShopIdFromContext } from "@/lib/shop-helper";
import { getServerUser } from "@/lib/auth-service";

export const revalidate = 60; // Revalidate every 60 seconds (ISR)

export default async function page() {
  const shopId = await getShopIdFromContext();
  const { slideshow, stats, quickLinks, categories, products, announcement } = await getHomepageData(shopId || 0);
  const user = await getServerUser();

  return (
    <div className="min-h-screen pb-10">
      <HeroSection images={slideshow} />
      <MarqueeSection text={announcement} />
      <StatsSection stats={stats} />
      <QuickLinks links={quickLinks} />
      <RecommendedCategories categories={categories} />
      <RecommendedProducts products={products as any[]} user={user} />
    </div>
  );
}
