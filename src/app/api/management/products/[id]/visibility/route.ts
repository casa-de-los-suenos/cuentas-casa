import { toggleProductVisibility } from "@/domains/products/data-access";
import { NextRequest, NextResponse } from "next/server";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const { visible } = await request.json();

    if (typeof visible !== "boolean") {
      return NextResponse.json(
        { message: "visible must be a boolean" },
        { status: 400 }
      );
    }

    const updated = await toggleProductVisibility(id, visible);
    return NextResponse.json(updated);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Internal error" }, { status: 500 });
  }
}
