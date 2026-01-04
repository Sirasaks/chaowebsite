import DOMPurify from "isomorphic-dompurify";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { getProductBySlug, Product } from "@/lib/product-service";
import { ProductPurchaseForm } from "./purchase-form"; // Separate client component for interactivity
import { getServerUser } from "@/lib/auth-service";
import { getShopIdFromContext } from "@/lib/shop-helper";
import { ProductPrice } from "@/components/shop/home/product-price";

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ slug: string }>;
}

// -------------------- Product Description --------------------
function ProductDescription({ product, user }: { product: Product, user: any }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-3xl font-medium tracking-tight">{product.name}</CardTitle>
        <div className="pt-2">
          <ProductPrice price={Number(product.price)} textClassName="text-2xl" initialUser={user} />
        </div>
      </CardHeader>
      <CardContent>
        <div
          className="text-sm text-muted-foreground [&>a]:text-primary [&>a]:underline"
          style={{ lineHeight: 1.8 }}
          dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(product.description) }}
        />
      </CardContent>
    </Card>
  );
}

// -------------------- Main Page --------------------
export default async function ProductsPage({ params }: PageProps) {
  const { slug } = await params;
  const shopId = await getShopIdFromContext();

  // Strict Isolation: If we are in a shop route, we MUST have a shopId.
  // If context resolution fails, we should not default to global search.
  if (!shopId) {
    notFound();
  }

  const user = await getServerUser();
  let product = await getProductBySlug(slug, shopId);

  if (product) {
    product = { ...product, stock: 0 };
  }

  if (!product) {
    notFound();
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 md:py-8">
      <Breadcrumb className="mb-6">
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
            <BreadcrumbPage>{product.name}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:items-start">
        {/* Left: Product Image */}
        <Card className="md:sticky md:top-8 overflow-hidden p-0">
          <div className="aspect-square relative">
            <img
              src={product.image || "/placeholder-image.png"}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          </div>
        </Card>

        {/* Right: Description + Purchase */}
        <div className="flex flex-col gap-8">
          <ProductDescription product={product} user={user} />
          <ProductPurchaseForm product={product} initialUser={user} />
        </div>
      </div>
    </div>
  );
}
