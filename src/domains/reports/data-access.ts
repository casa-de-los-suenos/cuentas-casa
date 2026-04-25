import { db } from "@/db/client";
import { sales } from "@/domains/sales/models/sale";
import { saleItems } from "@/domains/sales/models/saleItem";
import { products } from "@/domains/products/models/product";
import { productVariants } from "@/domains/products/models/productVariant";
import { and, gte, lt, eq, sum, count, desc, sql } from "drizzle-orm";

type DateRange = { startUtc: Date; endUtc: Date };

function soldAtInRange(range: DateRange) {
  return and(gte(sales.soldAt, range.startUtc), lt(sales.soldAt, range.endUtc));
}

export async function getTotalSold(range: DateRange): Promise<number> {
  const rows = await db
    .select({ totalSold: sum(saleItems.subtotalSnapshot) })
    .from(saleItems)
    .innerJoin(sales, eq(saleItems.saleId, sales.id))
    .where(soldAtInRange(range));

  return Number(rows[0]?.totalSold ?? 0);
}

export async function getSalesByOrg(range: DateRange) {
  const rows = await db
    .select({
      organization: saleItems.organization,
      totalSold: sum(saleItems.subtotalSnapshot),
    })
    .from(saleItems)
    .innerJoin(sales, eq(saleItems.saleId, sales.id))
    .where(soldAtInRange(range))
    .groupBy(saleItems.organization);

  return rows.map(row => ({
    organization: row.organization,
    totalSold: Number(row.totalSold ?? 0),
  }));
}

export async function getTransactionCount(range: DateRange): Promise<number> {
  const rows = await db
    .select({ total: count() })
    .from(sales)
    .where(soldAtInRange(range));

  return Number(rows[0]?.total ?? 0);
}

export async function getAverageTicket(range: DateRange): Promise<number> {
  const [totalSold, transactionCount] = await Promise.all([
    getTotalSold(range),
    getTransactionCount(range),
  ]);

  if (transactionCount === 0) return 0;
  return Math.round(totalSold / transactionCount);
}

export async function getSalesByPaymentMethod(range: DateRange) {
  const rows = await db
    .select({
      paymentMethod: sales.paymentMethod,
      transactionCount: count(),
      totalSold: sum(sales.totalAmount),
    })
    .from(sales)
    .where(soldAtInRange(range))
    .groupBy(sales.paymentMethod);

  return rows.map(row => ({
    paymentMethod: row.paymentMethod,
    transactionCount: Number(row.transactionCount ?? 0),
    totalSold: Number(row.totalSold ?? 0),
  }));
}

export async function getMostSoldProducts(range: DateRange, limit = 10) {
  const rows = await db
    .select({
      productName: products.name,
      variantName: productVariants.name,
      totalQuantity: sum(saleItems.quantity),
    })
    .from(saleItems)
    .innerJoin(sales, eq(saleItems.saleId, sales.id))
    .innerJoin(
      productVariants,
      eq(saleItems.productVariantId, productVariants.id)
    )
    .innerJoin(products, eq(productVariants.productId, products.id))
    .where(soldAtInRange(range))
    .groupBy(products.name, productVariants.name)
    .orderBy(desc(sql`sum(${saleItems.quantity})`))
    .limit(limit);

  return rows.map(row => ({
    productName: row.productName,
    variantName: row.variantName,
    totalQuantity: Number(row.totalQuantity ?? 0),
  }));
}

export async function getTopRevenueProducts(range: DateRange, limit = 10) {
  const rows = await db
    .select({
      productName: products.name,
      variantName: productVariants.name,
      totalRevenue: sum(saleItems.subtotalSnapshot),
    })
    .from(saleItems)
    .innerJoin(sales, eq(saleItems.saleId, sales.id))
    .innerJoin(
      productVariants,
      eq(saleItems.productVariantId, productVariants.id)
    )
    .innerJoin(products, eq(productVariants.productId, products.id))
    .where(soldAtInRange(range))
    .groupBy(products.name, productVariants.name)
    .orderBy(desc(sql`sum(${saleItems.subtotalSnapshot})`))
    .limit(limit);

  return rows.map(row => ({
    productName: row.productName,
    variantName: row.variantName,
    totalRevenue: Number(row.totalRevenue ?? 0),
  }));
}
