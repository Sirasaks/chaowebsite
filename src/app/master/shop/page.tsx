
import { ShopClient } from "@/components/master/ShopClient";
import { getMasterProducts } from "@/lib/master-data-service";

// ISR: Revalidate every 1 hour for products that rarely change
export const revalidate = 3600;

export default async function PackagesPage() {
    const products = await getMasterProducts();

    return (
        <ShopClient products={products} />
    );
}
