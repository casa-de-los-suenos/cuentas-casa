"use client";

import { useProductDialog } from "@/providers/products/dialog";
import { Button } from "../ui/button";

export default function ProductDialogButton() {
  const { openForCreate } = useProductDialog();

  return (
    <Button variant="outline" onClick={openForCreate}>
      Agregar producto
    </Button>
  );
}
