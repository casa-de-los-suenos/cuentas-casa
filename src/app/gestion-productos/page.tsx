import { getAllProductsWithVariants } from "@/domains/products/data-access";
import ProductManagement from "@/components/products/product-management";
import type { ProductListItem } from "@/providers/products/state";

export const dynamic = "force-dynamic";

export default async function GestionProductosPage() {
  const allProducts = (await getAllProductsWithVariants()) as ProductListItem[];

  return (
    <main className="font-sans min-h-screen p-5">
      <ProductManagement initialProducts={allProducts} />
    </main>
  );
}
