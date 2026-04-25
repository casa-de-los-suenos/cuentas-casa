import { getAllProductsWithVariants } from "@/domains/products/data-access";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const allProducts = await getAllProductsWithVariants();
    return NextResponse.json(allProducts);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Internal error" }, { status: 500 });
  }
}
