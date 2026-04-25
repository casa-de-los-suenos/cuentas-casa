import { createProductWithVariants } from "@/domains/products/data-access";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { ProductCreateInputSchema } from "@/domains/products/product-schema";

export async function POST(request: NextRequest) {
  try {
    const raw = await request.json();
    const input = ProductCreateInputSchema.parse(raw);
    const product = await createProductWithVariants(input);
    return NextResponse.json(product);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: "Validation error", issues: error.flatten() },
        { status: 400 }
      );
    }
    console.error(error);
    return NextResponse.json({ message: "Internal error" }, { status: 500 });
  }
}
