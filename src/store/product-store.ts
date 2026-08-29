import { create } from "zustand";

import {
  createProduct,
  deleteProduct,
  findProductByBarcode,
  getProductById,
  listProducts,
  updateProduct,
  type ProductDatabase,
} from "@/data/database";
import type { Product, ProductDraft } from "@/domain/product";

type ProductStore = {
  products: Product[];
  flashMessage: FlashMessage | null;
  isHydrated: boolean;
  isLoading: boolean;
  error: string | null;
  showFlash: (flashMessage: FlashMessage) => void;
  clearFlash: () => void;
  hydrate: (db: ProductDatabase) => Promise<void>;
  add: (db: ProductDatabase, draft: ProductDraft) => Promise<Product>;
  update: (
    db: ProductDatabase,
    id: number,
    draft: ProductDraft,
  ) => Promise<Product>;
  remove: (db: ProductDatabase, id: number) => Promise<void>;
  findByBarcode: (
    db: ProductDatabase,
    barcode: string,
  ) => Promise<Product | null>;
  getById: (db: ProductDatabase, id: number) => Promise<Product | null>;
};

export type FlashMessage = {
  type: "success" | "error";
  message: string;
};

export const useProductStore = create<ProductStore>((set) => ({
  products: [],
  flashMessage: null,
  isHydrated: false,
  isLoading: false,
  error: null,
  showFlash: (flashMessage) => set({ flashMessage }),
  clearFlash: () => set({ flashMessage: null }),
  hydrate: async (db) => {
    set({ isLoading: true, isHydrated: false, error: null });
    try {
      const products = await listProducts(db);
      set({ products, isHydrated: true, isLoading: false });
    } catch (error) {
      set({
        isLoading: false,
        error:
          error instanceof Error ? error.message : "読み込みに失敗しました。",
      });
    }
  },
  add: async (db, draft) => {
    const product = await createProduct(db, draft);
    set((state) => ({ products: [product, ...state.products], error: null }));
    return product;
  },
  update: async (db, id, draft) => {
    const product = await updateProduct(db, id, draft);
    set((state) => ({
      products: state.products.map((item) => (item.id === id ? product : item)),
      error: null,
    }));
    return product;
  },
  remove: async (db, id) => {
    await deleteProduct(db, id);
    set((state) => ({
      products: state.products.filter((item) => item.id !== id),
      error: null,
    }));
  },
  findByBarcode: async (db, barcode) => findProductByBarcode(db, barcode),
  getById: async (db, id) => getProductById(db, id),
}));
