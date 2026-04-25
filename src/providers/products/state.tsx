"use client";

import { createContext, useContext, useMemo, useState } from "react";

export type ProductVariantListItem = {
  id: string;
  name: string;
  unit_price: string | number;
};

export type ProductListItem = {
  id: string;
  organization: string;
  name: string;
  visible?: boolean;
  variants: ProductVariantListItem[];
};

type ProductsContextValue = {
  products: ProductListItem[];
  setProducts: React.Dispatch<React.SetStateAction<ProductListItem[]>>;
  addProduct: (created: ProductListItem) => void;
  updateProduct: (updated: ProductListItem) => void;
  removeProduct: (productId: string) => void;
};

const ProductsContext = createContext<ProductsContextValue | null>(null);

export function ProductsProvider({
  children,
  initialProducts,
}: {
  children: React.ReactNode;
  initialProducts: ProductListItem[];
}) {
  const [products, setProducts] = useState<ProductListItem[]>(initialProducts);

  const addProduct = (created: ProductListItem) => {
    setProducts(prevProducts => [created, ...prevProducts]);
  };

  const updateProduct = (updated: ProductListItem) => {
    setProducts(prevProducts =>
      prevProducts.map(product =>
        product.id === updated.id ? updated : product
      )
    );
  };

  const removeProduct = (productId: string) => {
    setProducts(prevProducts =>
      prevProducts.filter(product => product.id !== productId)
    );
  };

  const value = useMemo<ProductsContextValue>(
    () => ({ products, setProducts, addProduct, updateProduct, removeProduct }),
    [products]
  );

  return (
    <ProductsContext.Provider value={value}>
      {children}
    </ProductsContext.Provider>
  );
}

export function useProducts() {
  const ctx = useContext(ProductsContext);
  if (!ctx) {
    throw new Error("useProducts must be used within a ProductsProvider");
  }
  return ctx;
}
