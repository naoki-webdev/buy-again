import TestRenderer, { act } from "react-test-renderer";
import { useEffect } from "react";

import { PurchaseProvider } from "@/services/purchase-service.native";
import {
  PURCHASE_PRODUCT_IDS,
  usePurchase,
} from "@/services/purchase-service.shared";

const mockUseIAP = jest.fn();
const mockFinishTransaction = jest.fn();
const mockGetAvailablePurchases = jest.fn();

jest.mock("expo-iap", () => ({
  __esModule: true,
  finishTransaction: (...args: unknown[]) => mockFinishTransaction(...args),
  getAvailablePurchases: (...args: unknown[]) =>
    mockGetAvailablePurchases(...args),
  useIAP: (...args: unknown[]) => mockUseIAP(...args),
}));

jest.mock("@/i18n", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

type IapCallbacks = {
  onPurchaseError: (error: unknown) => void;
  onPurchaseSuccess: (purchase: { productId: string }) => Promise<void>;
};

type IapState = {
  availablePurchases: { productId: string }[];
  connected: boolean;
  fetchProducts: jest.Mock;
  getAvailablePurchases: jest.Mock;
  products: { id: string; displayPrice: string }[];
  requestPurchase: jest.Mock;
  restorePurchases: jest.Mock;
};

let callbacks: IapCallbacks;
let currentPurchaseState: ReturnType<typeof usePurchase> | null = null;
let renderer: TestRenderer.ReactTestRenderer | null = null;

function CapturePurchaseState() {
  const purchaseState = usePurchase();
  useEffect(() => {
    currentPurchaseState = purchaseState;
  }, [purchaseState]);
  return null;
}

function createIapState(): IapState {
  return {
    availablePurchases: [],
    connected: true,
    fetchProducts: jest.fn().mockResolvedValue(undefined),
    getAvailablePurchases: jest.fn().mockResolvedValue([]),
    products: [{ id: PURCHASE_PRODUCT_IDS.unlock, displayPrice: "¥980" }],
    requestPurchase: jest.fn().mockResolvedValue(undefined),
    restorePurchases: jest.fn().mockResolvedValue(undefined),
  };
}

async function renderProvider(iapState: IapState) {
  mockUseIAP.mockImplementation((options: IapCallbacks) => {
    callbacks = options;
    return iapState;
  });

  await act(async () => {
    renderer = TestRenderer.create(
      <PurchaseProvider>
        <CapturePurchaseState />
      </PurchaseProvider>,
    );
  });
}

describe("native purchase provider", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    currentPurchaseState = null;
    renderer = null;
  });

  afterEach(() => {
    if (renderer) {
      act(() => renderer?.unmount());
    }
  });

  it("購入確認後にだけアンロックし、トランザクションを完了する", async () => {
    const iapState = createIapState();
    mockFinishTransaction.mockResolvedValue(undefined);
    mockGetAvailablePurchases.mockResolvedValue([]);
    await renderProvider(iapState);

    await act(async () => {
      await callbacks.onPurchaseSuccess({
        productId: PURCHASE_PRODUCT_IDS.unlock,
      });
    });

    expect(mockFinishTransaction).toHaveBeenCalledWith({
      purchase: { productId: PURCHASE_PRODUCT_IDS.unlock },
      isConsumable: false,
    });
    expect(currentPurchaseState?.isUnlocked).toBe(true);
  });

  it("購入復元の成功をストアへ委譲する", async () => {
    const iapState = createIapState();
    await renderProvider(iapState);

    await act(async () => {
      await currentPurchaseState?.restorePurchase();
    });

    expect(iapState.restorePurchases).toHaveBeenCalledTimes(1);
    expect(currentPurchaseState?.error).toBeNull();
  });

  it("購入復元の失敗をエラー状態へ反映する", async () => {
    const iapState = createIapState();
    iapState.restorePurchases.mockRejectedValueOnce(new Error("offline"));
    await renderProvider(iapState);

    await act(async () => {
      await currentPurchaseState?.restorePurchase();
    });

    expect(currentPurchaseState?.error).toBe("purchase.restore_failed");
    expect(currentPurchaseState?.isLoading).toBe(false);
  });
});
