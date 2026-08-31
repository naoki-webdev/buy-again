import {
  canCreateProduct,
  getPurchaseErrorKey,
  isPurchaseCancelled,
  isUnlockProduct,
  MAX_FREE_PRODUCTS,
  PURCHASE_ENVIRONMENT,
  PURCHASE_PRODUCT_IDS_BY_ENV,
  PURCHASE_PRODUCT_IDS,
} from "@/services/purchase-service.shared";

describe("purchase entitlement rules", () => {
  it("無料版は20件未満なら新規登録できる", () => {
    expect(canCreateProduct(MAX_FREE_PRODUCTS - 1, false)).toBe(true);
    expect(canCreateProduct(MAX_FREE_PRODUCTS, false)).toBe(false);
  });

  it("アンロック済みなら件数に関係なく新規登録できる", () => {
    expect(canCreateProduct(MAX_FREE_PRODUCTS, true)).toBe(true);
    expect(canCreateProduct(1000, true)).toBe(true);
  });

  it("購入商品IDは買い切り商品のみを認識する", () => {
    expect(isUnlockProduct(PURCHASE_PRODUCT_IDS.unlock)).toBe(true);
    expect(isUnlockProduct("com.example.subscription")).toBe(false);
    expect(isUnlockProduct(null)).toBe(false);
  });

  it("購入キャンセルを失敗として通知しない", () => {
    expect(isPurchaseCancelled({ code: "user-cancelled" })).toBe(true);
    expect(isPurchaseCancelled({ code: "service-error" })).toBe(false);
    expect(getPurchaseErrorKey("purchase")).toBe("purchase.purchase_failed");
    expect(getPurchaseErrorKey("restore")).toBe("purchase.restore_failed");
    expect(getPurchaseErrorKey("store")).toBe("purchase.store_unavailable");
  });

  it("テスト用と本番用の商品IDを分離する", () => {
    expect(PURCHASE_PRODUCT_IDS_BY_ENV.test.unlock).toBe(
      "com.naokiwebdev.buyagain.unlock.test",
    );
    expect(PURCHASE_PRODUCT_IDS_BY_ENV.production.unlock).toBe(
      "com.naokiwebdev.buyagain.unlock",
    );
    expect(PURCHASE_PRODUCT_IDS.unlock).toBe(
      PURCHASE_PRODUCT_IDS_BY_ENV[PURCHASE_ENVIRONMENT].unlock,
    );
  });
});
