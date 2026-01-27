import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface Category {
    id: number;
    name: string;
    slug: string;
    image: string;
}

interface RecommendedCategoriesProps {
    categories: Category[];
}

export function RecommendedCategories({ categories }: RecommendedCategoriesProps) {
    if (categories.length === 0) return null;

    return (
        <section className="pb-2">
            <div className="mx-auto max-w-7xl px-4 py-4">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-semibold bg-gradient-to-r from-primary to-primary bg-clip-text text-transparent">หมวดหมู่แนะนำ</h2>
                    <Button asChild size="sm">
                        <Link href="/categories">ดูเพิ่มเติม →</Link>
                    </Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {categories.map((category, index) => (
                        <div key={category.id}>
                            <Link href={`/categories/${category.slug}`} passHref>
                                <Card className="border-none rounded-lg overflow-hidden relative group h-48 cursor-pointer  hover:shadow-lg transition transform hover:-translate-y-1 flex flex-col p-0">
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
            </div>
        </section>
    );
}
