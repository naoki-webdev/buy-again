import { createContext, useContext } from "react";

import type { TranslationKey } from "@/locales/types";

export const MAX_FREE_PRODUCTS = 20;

export const PURCHASE_PRODUCT_IDS = {
  unlock: "com.naokiwebdev.buyagain.unlock",
} as const;

export type PurchaseContextValue = {
  isAvailable: boolean;
  isUnlocked: boolean;
  isLoading: boolean;
  localizedPrice: string | null;
  error: string | null;
  purchaseUnlock: () => Promise<void>;
  restorePurchase: () => Promise<void>;
};

export const PurchaseContext = createContext<PurchaseContextValue | null>(null);

export function usePurchase(): PurchaseContextValue {
  const context = useContext(PurchaseContext);
  if (!context) {
    throw new Error("usePurchase must be used within PurchaseProvider");
  }
  return context;
}

export function canCreateProduct(
  productCount: number,
  isUnlocked: boolean,
): boolean {
  return isUnlocked || productCount < MAX_FREE_PRODUCTS;
}

export function isUnlockProduct(productId: string | null | undefined): boolean {
  return productId === PURCHASE_PRODUCT_IDS.unlock;
}

export type PurchaseFailureKind = "purchase" | "restore" | "finish" | "store";

export function isPurchaseCancelled(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    (error as { code?: string }).code === "user-cancelled"
  );
}

export function getPurchaseErrorKey(kind: PurchaseFailureKind): TranslationKey {
  return kind === "store"
    ? "purchase.store_unavailable"
    : `purchase.${kind}_failed`;
}
