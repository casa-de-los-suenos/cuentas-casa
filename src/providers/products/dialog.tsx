"use client";

import { ProductCreateInput } from "@/domains/products/types";
import { createContext, useContext, useState } from "react";
import { toast } from "sonner";
import { useProducts, type ProductListItem } from "./state";

type DialogMode = "create" | "edit";

type ProductDialogContextValue = {
  open: boolean;
  mode: DialogMode;
  editingProduct: ProductCreateInput | null;
  changeOpen: (open: boolean) => void;
  openForCreate: () => void;
  openForEdit: (product: ProductListItem) => void;
  saveProduct: (values: ProductCreateInput) => Promise<void>;
};

const ProductDialogContext = createContext<ProductDialogContextValue>({
  open: false,
  mode: "create",
  editingProduct: null,
  changeOpen: () => {},
  openForCreate: () => {},
  openForEdit: () => {},
  saveProduct: () => Promise.resolve(),
});

const ProductDialogProvider = ({ children }: { children: React.ReactNode }) => {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<DialogMode>("create");
  const [editingProduct, setEditingProduct] =
    useState<ProductCreateInput | null>(null);
  const { addProduct, updateProduct } = useProducts();

  const changeOpen = (next: boolean) => {
    setOpen(next);
    if (!next) {
      setEditingProduct(null);
      setMode("create");
    }
  };

  const openForCreate = () => {
    setMode("create");
    setEditingProduct(null);
    setOpen(true);
  };

  const openForEdit = (product: ProductListItem) => {
    setMode("edit");
    setEditingProduct({
      id: product.id,
      organization:
        product.organization as ProductCreateInput["organization"],
      name: product.name,
      variants: product.variants.map(variant => ({
        id: variant.id,
        name: variant.name,
        unitPrice:
          typeof variant.unit_price === "string"
            ? Number(variant.unit_price)
            : variant.unit_price,
      })),
    });
    setOpen(true);
  };

  const handleCreate = async (values: ProductCreateInput) => {
    const response = await fetch("/api/products", {
      method: "POST",
      body: JSON.stringify(values),
    });

    if (!response.ok) {
      toast.error("Error al crear el producto");
      return;
    }

    const created = (await response.json()) as {
      id: string;
      organization: string;
      name: string;
      variants: Array<{ id: string; name: string; unitPrice: string }>;
    };

    addProduct({
      id: created.id,
      organization: created.organization,
      name: created.name,
      variants: created.variants.map(createdVariant => ({
        id: createdVariant.id,
        name: createdVariant.name,
        unit_price: createdVariant.unitPrice,
      })),
    });

    toast.success("Producto creado correctamente");
    changeOpen(false);
  };

  const handleUpdate = async (values: ProductCreateInput) => {
    if (!values.id) return;

    const response = await fetch(`/api/management/products/${values.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });

    if (!response.ok) {
      const body = await response.json().catch(() => null);
      toast.error(body?.message ?? "Error al actualizar el producto");
      return;
    }

    const updated = (await response.json()) as {
      id: string;
      organization: string;
      name: string;
      visible: boolean;
      variants: Array<{ id: string; name: string; unitPrice: string }>;
    };

    updateProduct({
      id: updated.id,
      organization: updated.organization,
      name: updated.name,
      visible: updated.visible,
      variants: updated.variants.map(updatedVariant => ({
        id: updatedVariant.id,
        name: updatedVariant.name,
        unit_price: updatedVariant.unitPrice,
      })),
    });

    toast.success("Producto actualizado correctamente");
    changeOpen(false);
  };

  const saveProduct = async (values: ProductCreateInput) => {
    if (mode === "edit") {
      await handleUpdate(values);
    } else {
      await handleCreate(values);
    }
  };

  return (
    <ProductDialogContext.Provider
      value={{
        open,
        mode,
        editingProduct,
        changeOpen,
        openForCreate,
        openForEdit,
        saveProduct,
      }}
    >
      {children}
    </ProductDialogContext.Provider>
  );
};

export const useProductDialog = () => {
  const context = useContext(ProductDialogContext);
  if (!context) {
    throw new Error(
      "useProductDialog must be used within a ProductDialogProvider"
    );
  }
  return context;
};

export default ProductDialogProvider;
