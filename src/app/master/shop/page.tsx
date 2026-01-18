
import { ShopClient } from "@/components/master/ShopClient";
import { getMasterProducts } from "@/lib/master-data-service";

export const dynamic = 'force-dynamic';
export const revalidate = 3600;

export default async function PackagesPage() {
    const products = await getMasterProducts();

    return (
        <ShopClient products={products} />
    );
}
