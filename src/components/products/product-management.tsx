"use client";

import { useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import ProductDialogProvider, {
  useProductDialog,
} from "@/providers/products/dialog";
import {
  ProductsProvider,
  useProducts,
  type ProductListItem,
} from "@/providers/products/state";
import ProductDialogForm from "@/components/products/product-dialog";
import { formatCOP } from "@/components/products/products-list";

interface ProductManagementProps {
  initialProducts: ProductListItem[];
}

export default function ProductManagement({
  initialProducts,
}: ProductManagementProps) {
  return (
    <ProductsProvider initialProducts={initialProducts}>
      <ProductDialogProvider>
        <ProductManagementContent />
        <ProductDialogForm />
      </ProductDialogProvider>
    </ProductsProvider>
  );
}

function ProductManagementContent() {
  const { products, removeProduct, updateProduct } = useProducts();
  const { openForCreate, openForEdit } = useProductDialog();

  const [deleteTarget, setDeleteTarget] = useState<ProductListItem | null>(
    null
  );
  const [isDeleting, setIsDeleting] = useState(false);

  const handleToggleVisibility = async (product: ProductListItem) => {
    const newVisible = !product.visible;

    updateProduct({ ...product, visible: newVisible });

    try {
      const response = await fetch(
        `/api/management/products/${product.id}/visibility`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ visible: newVisible }),
        }
      );

      if (!response.ok) {
        updateProduct({ ...product, visible: !newVisible });
        toast.error("Error al cambiar la visibilidad");
      }
    } catch {
      updateProduct({ ...product, visible: !newVisible });
      toast.error("Error al cambiar la visibilidad");
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);

    try {
      const response = await fetch(
        `/api/management/products/${deleteTarget.id}`,
        { method: "DELETE" }
      );

      if (!response.ok) {
        const body = await response.json().catch(() => null);
        if (response.status === 409) {
          toast.error(
            body?.message ??
              "No se puede eliminar, el producto tiene ventas asociadas"
          );
        } else {
          toast.error("Error al eliminar el producto");
        }
        return;
      }

      removeProduct(deleteTarget.id);
      toast.success("Producto eliminado correctamente");
    } catch {
      toast.error("Error al eliminar el producto");
    } finally {
      setIsDeleting(false);
      setDeleteTarget(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Gestión de productos</h1>
        <Button onClick={openForCreate}>Agregar producto</Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nombre</TableHead>
            <TableHead>Organización</TableHead>
            <TableHead>Variantes</TableHead>
            <TableHead>Visible</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                No hay productos registrados
              </TableCell>
            </TableRow>
          ) : (
            products.map(product => (
              <TableRow key={product.id}>
                <TableCell className="font-medium">{product.name}</TableCell>
                <TableCell>{product.organization}</TableCell>
                <TableCell>
                  <div className="flex flex-col gap-1">
                    {product.variants?.map(variant => (
                      <span key={variant.id} className="text-sm">
                        {variant.name} — {formatCOP(variant.unit_price)}
                      </span>
                    ))}
                  </div>
                </TableCell>
                <TableCell>
                  <Switch
                    checked={product.visible ?? true}
                    onCheckedChange={() => handleToggleVisibility(product)}
                  />
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => openForEdit(product)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setDeleteTarget(product)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={open => {
          if (!open) setDeleteTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará el producto{" "}
              <strong>{deleteTarget?.name}</strong> y todas sus variantes.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? "Eliminando..." : "Eliminar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
