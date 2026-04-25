import { db } from "@/db/client";
import { SaleInputSchema } from "./schemas/sale";
import { SaleInput } from "./types";
import { sales } from "./models/sale";
import { saleItems } from "./models/saleItem";

export async function createSale(saleInput: SaleInput) {
  const parsed = SaleInputSchema.parse(saleInput);

  try {
    const { sale, savedItems } = await db.transaction(async transaction => {
      const [sale] = await transaction
        .insert(sales)
        .values({
          paymentMethod: parsed.paymentMethod,
          totalAmount: parsed.totalAmount.toString(),
          totalItems: parsed.totalItems,
          soldAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      if (!sale) {
        throw new Error("Failed to create sale");
      }

      const savedItems = await Promise.all(
        parsed.saleItems.map(async item => {
          const [saleItem] = await transaction
            .insert(saleItems)
            .values({
              ...item,
              unitPriceSnapshot: item.unitPrice,
              subtotalSnapshot: item.subtotal,
              organization: item.organization,
              quantity: item.quantity,
              productVariantId: item.variantId,
              saleId: sale.id,
            })
            .returning();

          return saleItem;
        })
      );

      return { sale, savedItems };
    });

    return { sale, savedItems };
  } catch (error) {
    console.error(error);
    throw error;
  }
}
