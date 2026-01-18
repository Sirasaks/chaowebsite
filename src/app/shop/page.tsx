import React, { Suspense } from 'react'
import dynamic from 'next/dynamic';
import { HeroSection } from "@/components/shop/home/hero-section";

const StatsSection = dynamic(() => import("@/components/shop/home/stats-section").then(mod => mod.StatsSection));
const QuickLinks = dynamic(() => import("@/components/shop/home/quick-links").then(mod => mod.QuickLinks));
const RecommendedCategories = dynamic(() => import("@/components/shop/home/recommended-categories").then(mod => mod.RecommendedCategories));
const RecommendedProducts = dynamic(() => import("@/components/shop/home/recommended-products").then(mod => mod.RecommendedProducts));
const MarqueeSection = dynamic(() => import("@/components/shop/home/marquee-section").then(mod => mod.MarqueeSection));

import {
  getShopSlideshow,
  getShopStats,
  getQuickLinks,
  getRecommendedCategories,
  getRecommendedProducts,
  getAnnouncement
} from "@/lib/home-service";

import { getShopIdFromContext } from "@/lib/shop-helper";
import { getServerUser } from "@/lib/auth-service";

// Skeletons removed as requested
// function SectionSkeleton... removed

// --- Async Wrappers for Suspense ---

async function HeroWrapper({ shopId }: { shopId: number }) {
  const slideshow = await getShopSlideshow(shopId);
  return <HeroSection images={slideshow} />;
}

async function MarqueeWrapper({ shopId }: { shopId: number }) {
  const text = await getAnnouncement(shopId);
  if (!text) return null;
  return <MarqueeSection text={text} />;
}

async function StatsWrapper({ shopId }: { shopId: number }) {
  const stats = await getShopStats(shopId);
  return <StatsSection stats={stats} />;
}

async function QuickLinksWrapper({ shopId }: { shopId: number }) {
  const links = await getQuickLinks(shopId);
  return <QuickLinks links={links} />;
}

async function CategoriesWrapper({ shopId }: { shopId: number }) {
  const categories = await getRecommendedCategories(shopId);
  return <RecommendedCategories categories={categories} />;
}

async function ProductsWrapper({ shopId }: { shopId: number }) {
  const products = await getRecommendedProducts(shopId);
  const user = await getServerUser(); // This might also need suspense if it's slow, but usually auth is fast or verified in middleware
  return <RecommendedProducts products={products as any[]} user={user} />;
}

export default async function Page() {
  const shopId = await getShopIdFromContext();
  const safeShopId = shopId || 0;

  return (
    <div className="min-h-screen pb-10">
      <Suspense fallback={null}>
        <HeroWrapper shopId={safeShopId} />
      </Suspense>

      <Suspense fallback={null}>
        <MarqueeWrapper shopId={safeShopId} />
      </Suspense>

      <Suspense fallback={null}>
        <StatsWrapper shopId={safeShopId} />
      </Suspense>

      <Suspense fallback={null}>
        <QuickLinksWrapper shopId={safeShopId} />
      </Suspense>

      <Suspense fallback={null}>
        <CategoriesWrapper shopId={safeShopId} />
      </Suspense>

      <Suspense fallback={null}>
        <ProductsWrapper shopId={safeShopId} />
      </Suspense>
    </div>
  );
}
