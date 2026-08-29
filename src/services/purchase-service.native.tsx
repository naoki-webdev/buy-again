import {
  finishTransaction as finishStoreTransaction,
  getAvailablePurchases as getStoreAvailablePurchases,
  useIAP,
  type Purchase,
} from "expo-iap";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from "react";

import { useTranslation } from "@/i18n";

import {
  isUnlockProduct,
  getPurchaseErrorKey,
  isPurchaseCancelled,
  PURCHASE_PRODUCT_IDS,
  PurchaseContext,
  type PurchaseContextValue,
} from "./purchase-service.shared";

export function PurchaseProvider({ children }: PropsWithChildren) {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recentlyConfirmedProductId, setRecentlyConfirmedProductId] = useState<
    string | null
  >(null);

  const handlePurchaseSuccess = useCallback(
    async (purchase: Purchase) => {
      if (!isUnlockProduct(purchase.productId)) {
        return;
      }

      try {
        // The entitlement is granted only after the store confirms the product
        // and the non-consumable transaction has been finished.
        await finishStoreTransaction({ purchase, isConsumable: false });
        setRecentlyConfirmedProductId(purchase.productId);
        await getStoreAvailablePurchases();
      } catch {
        setError(t(getPurchaseErrorKey("finish")));
      } finally {
        setIsLoading(false);
      }
    },
    [t],
  );

  const handlePurchaseError = useCallback(
    (purchaseError: unknown) => {
      if (!isPurchaseCancelled(purchaseError)) {
        setError(t(getPurchaseErrorKey("purchase")));
      }
      setIsLoading(false);
    },
    [t],
  );

  const handleIapError = useCallback(() => {
    setError(t(getPurchaseErrorKey("store")));
  }, [t]);

  const iap = useIAP({
    onPurchaseSuccess: handlePurchaseSuccess,
    onPurchaseError: handlePurchaseError,
    onError: handleIapError,
  });
  const {
    availablePurchases,
    connected,
    fetchProducts,
    getAvailablePurchases,
    products,
    requestPurchase,
    restorePurchases,
  } = iap;

  useEffect(() => {
    if (!connected) {
      return;
    }

    void fetchProducts({
      skus: [PURCHASE_PRODUCT_IDS.unlock],
      type: "in-app",
    }).catch(() => setError(t(getPurchaseErrorKey("store"))));
    void getAvailablePurchases().catch(() => undefined);
  }, [connected, fetchProducts, getAvailablePurchases, t]);

  const storePurchase = useCallback(async () => {
    setError(null);
    setIsLoading(true);
    try {
      await requestPurchase({
        request: {
          apple: { sku: PURCHASE_PRODUCT_IDS.unlock },
          google: { skus: [PURCHASE_PRODUCT_IDS.unlock] },
        },
        type: "in-app",
      });
    } catch (purchaseError) {
      handlePurchaseError(purchaseError);
    }
  }, [handlePurchaseError, requestPurchase]);

  const restorePurchase = useCallback(async () => {
    setError(null);
    setIsLoading(true);
    try {
      await restorePurchases();
    } catch {
      setError(t(getPurchaseErrorKey("restore")));
    } finally {
      setIsLoading(false);
    }
  }, [restorePurchases, t]);

  const storeProduct = products.find(
    (product) => product.id === PURCHASE_PRODUCT_IDS.unlock,
  );
  const isUnlocked =
    recentlyConfirmedProductId === PURCHASE_PRODUCT_IDS.unlock ||
    availablePurchases.some((purchase) => isUnlockProduct(purchase.productId));
  const value = useMemo<PurchaseContextValue>(
    () => ({
      isAvailable: connected,
      isUnlocked,
      isLoading,
      localizedPrice: storeProduct?.displayPrice ?? null,
      error,
      purchaseUnlock: storePurchase,
      restorePurchase,
    }),
    [
      error,
      connected,
      isLoading,
      isUnlocked,
      restorePurchase,
      storeProduct?.displayPrice,
      storePurchase,
    ],
  );

  return (
    <PurchaseContext.Provider value={value}>
      {children}
    </PurchaseContext.Provider>
  );
}

export { usePurchase } from "./purchase-service.shared";
export {
  canCreateProduct,
  isUnlockProduct,
  MAX_FREE_PRODUCTS,
  PURCHASE_PRODUCT_IDS,
  getPurchaseErrorKey,
  isPurchaseCancelled,
} from "./purchase-service.shared";
