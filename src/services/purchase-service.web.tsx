import type { PropsWithChildren } from "react";

import {
  PurchaseContext,
  usePurchase as useSharedPurchase,
} from "./purchase-service.shared";

export function PurchaseProvider({ children }: PropsWithChildren) {
  return (
    <PurchaseContext.Provider
      value={{
        isAvailable: false,
        isUnlocked: false,
        isLoading: false,
        localizedPrice: null,
        error: null,
        purchaseUnlock: async () => undefined,
        restorePurchase: async () => undefined,
      }}
    >
      {children}
    </PurchaseContext.Provider>
  );
}

export const usePurchase = useSharedPurchase;
export {
  canCreateProduct,
  isUnlockProduct,
  MAX_FREE_PRODUCTS,
  PURCHASE_ENVIRONMENT,
  PURCHASE_PRODUCT_IDS_BY_ENV,
  PURCHASE_PRODUCT_IDS,
  getPurchaseErrorKey,
  isPurchaseCancelled,
} from "./purchase-service.shared";
