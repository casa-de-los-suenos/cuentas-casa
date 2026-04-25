import { db } from "@/db/client";
import { products, productVariants } from "./models";
import { asc, eq, sql, inArray } from "drizzle-orm";
import { ProductCreateInput, productVariantInput } from "./types";
import { saleItems } from "@/domains/sales/models/saleItem";

export async function createProduct(params: {
  organization: (typeof products)["organization"]["_"]["enumValues"][number];
  name: string;
}) {
  const [created] = await db
    .insert(products)
    .values({ organization: params.organization, name: params.name })
    .returning();
  return created;
}

export async function createProductVariant(params: {
  productId: string;
  name: string;
  unitPrice: string;
}) {
  const [created] = await db
    .insert(productVariants)
    .values({
      productId: params.productId,
      name: params.name,
      unitPrice: params.unitPrice,
    })
    .returning();
  return created;
}

export async function createProductWithVariants(params: ProductCreateInput) {
  const { organization, name, variants } = params;

  try {
    return await db.transaction(async transaction => {
      const [createdProduct] = await transaction
        .insert(products)
        .values({
          organization,
          name,
        })
        .returning();

      const createdVariants = await Promise.all(
        variants.map(async (variant: productVariantInput) => {
          const [createdVariant] = await transaction
            .insert(productVariants)
            .values({
              productId: createdProduct.id,
              name: variant.name,
              unitPrice: variant.unitPrice,
            })
            .returning();
          return createdVariant;
        })
      );

      return { ...createdProduct, variants: createdVariants };
    });
  } catch (error) {
    console.error(error);
    throw error;
  }
}

export async function getProductsWithVariants() {
  return db
    .select({
      id: products.id,
      organization: products.organization,
      name: products.name,
      visible: products.visible,
      createdAt: products.createdAt,
      updatedAt: products.updatedAt,
      variants: sql`json_agg(product_variants.*)`.as("variants"),
    })
    .from(products)
    .where(eq(products.visible, true))
    .leftJoin(productVariants, eq(products.id, productVariants.productId))
    .groupBy(products.id)
    .orderBy(asc(products.name));
}

export async function getAllProductsWithVariants() {
  return db
    .select({
      id: products.id,
      organization: products.organization,
      name: products.name,
      visible: products.visible,
      createdAt: products.createdAt,
      updatedAt: products.updatedAt,
      variants: sql`json_agg(product_variants.*)`.as("variants"),
    })
    .from(products)
    .leftJoin(productVariants, eq(products.id, productVariants.productId))
    .groupBy(products.id)
    .orderBy(asc(products.name));
}

export async function updateProductWithVariants(params: ProductCreateInput) {
  const { id: productId, organization, name, variants } = params;

  if (!productId) {
    throw new Error("Product id is required for update");
  }

  try {
    return await db.transaction(async transaction => {
      const [updatedProduct] = await transaction
        .update(products)
        .set({
          organization,
          name,
          updatedAt: new Date(),
        })
        .where(eq(products.id, productId))
        .returning();

      const existingVariants = await transaction
        .select({ id: productVariants.id })
        .from(productVariants)
        .where(eq(productVariants.productId, productId));

      const incomingVariantIds = variants
        .filter((variant: productVariantInput) => variant.id)
        .map((variant: productVariantInput) => variant.id as string);

      const variantsToDelete = existingVariants.filter(
        existing => !incomingVariantIds.includes(existing.id)
      );

      if (variantsToDelete.length > 0) {
        const deleteIds = variantsToDelete.map(variant => variant.id);
        const linkedSaleItems = await transaction
          .select({ id: saleItems.id })
          .from(saleItems)
          .where(inArray(saleItems.productVariantId, deleteIds))
          .limit(1);

        if (linkedSaleItems.length > 0) {
          throw new Error(
            "No se puede eliminar una variante que tiene ventas asociadas"
          );
        }

        await transaction
          .delete(productVariants)
          .where(inArray(productVariants.id, deleteIds));
      }

      const updatedVariants = await Promise.all(
        variants.map(async (variant: productVariantInput) => {
          if (variant.id) {
            const [updated] = await transaction
              .update(productVariants)
              .set({
                name: variant.name,
                unitPrice: String(variant.unitPrice),
                updatedAt: new Date(),
              })
              .where(eq(productVariants.id, variant.id))
              .returning();
            return updated;
          }

          const [created] = await transaction
            .insert(productVariants)
            .values({
              productId,
              name: variant.name,
              unitPrice: String(variant.unitPrice),
            })
            .returning();
          return created;
        })
      );

      return { ...updatedProduct, variants: updatedVariants };
    });
  } catch (error) {
    console.error(error);
    throw error;
  }
}

export async function deleteProduct(productId: string) {
  const variantIds = await db
    .select({ id: productVariants.id })
    .from(productVariants)
    .where(eq(productVariants.productId, productId));

  if (variantIds.length > 0) {
    const linkedSaleItems = await db
      .select({ id: saleItems.id })
      .from(saleItems)
      .where(
        inArray(
          saleItems.productVariantId,
          variantIds.map(variant => variant.id)
        )
      )
      .limit(1);

    if (linkedSaleItems.length > 0) {
      throw new Error(
        "No se puede eliminar el producto porque tiene ventas asociadas"
      );
    }
  }

  await db.transaction(async transaction => {
    await transaction
      .delete(productVariants)
      .where(eq(productVariants.productId, productId));

    await transaction.delete(products).where(eq(products.id, productId));
  });
}

export async function toggleProductVisibility(
  productId: string,
  visible: boolean
) {
  const [updated] = await db
    .update(products)
    .set({ visible, updatedAt: new Date() })
    .where(eq(products.id, productId))
    .returning();
  return updated;
}
