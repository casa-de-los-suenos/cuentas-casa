import {
  updateProductWithVariants,
  deleteProduct,
} from "@/domains/products/data-access";
import { ProductCreateInputSchema } from "@/domains/products/product-schema";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

type RouteContext = { params: Promise<{ id: string }> };

export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const raw = await request.json();
    const input = ProductCreateInputSchema.parse({ ...raw, id });
    const updated = await updateProductWithVariants(input);
    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: "Validation error", issues: error.flatten() },
        { status: 400 }
      );
    }
    if (error instanceof Error && error.message.includes("ventas asociadas")) {
      return NextResponse.json({ message: error.message }, { status: 409 });
    }
    console.error(error);
    return NextResponse.json({ message: "Internal error" }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    await deleteProduct(id);
    return NextResponse.json({ message: "Producto eliminado" });
  } catch (error) {
    if (error instanceof Error && error.message.includes("ventas asociadas")) {
      return NextResponse.json({ message: error.message }, { status: 409 });
    }
    console.error(error);
    return NextResponse.json({ message: "Internal error" }, { status: 500 });
  }
}
