import {
  isOpenFoodFactsImageUri,
  lookupOpenFoodFactsProduct,
  mergeOpenFoodFactsSuggestion,
  type OpenFoodFactsFetcher,
} from "@/services/open-food-facts";
import type { ProductDraft } from "@/domain/product";

const emptyDraft: ProductDraft = {
  name: "",
  brand: "",
  barcode: "4900000000001",
  imageUri: null,
  rating: "buy_again",
  note: "",
};

describe("Open Food Facts service", () => {
  it("バーコードが変わった後に返った古い候補を反映しない", () => {
    const changedDraft = { ...emptyDraft, barcode: "4900000000002" };

    expect(
      mergeOpenFoodFactsSuggestion(changedDraft, "4900000000001", {
        productName: "古い商品",
        brand: "古いブランド",
        imageUri: "https://images.openfoodfacts.org/old.jpg",
      }),
    ).toBe(changedDraft);
  });

  it("同じバーコードの候補だけ空欄へ自動入力する", () => {
    expect(
      mergeOpenFoodFactsSuggestion(emptyDraft, "4900000000001", {
        productName: "商品名",
        brand: "ブランド",
        imageUri: "https://images.openfoodfacts.org/image.jpg",
      }),
    ).toMatchObject({
      name: "商品名",
      brand: "ブランド",
      imageUri: "https://images.openfoodfacts.org/image.jpg",
    });
  });

  it("許可されたOpen Food Facts画像ホストだけを受け付ける", () => {
    expect(
      isOpenFoodFactsImageUri(
        "https://images.openfoodfacts.org/images/products/front.jpg",
      ),
    ).toBe(true);
    expect(
      isOpenFoodFactsImageUri("https://static.openfoodfacts.org/product.jpg"),
    ).toBe(true);
    expect(isOpenFoodFactsImageUri("https://example.com/image.jpg")).toBe(
      false,
    );
    expect(
      isOpenFoodFactsImageUri("http://images.openfoodfacts.org/a.jpg"),
    ).toBe(false);
  });

  it("商品名、ブランド、画像を取得する", async () => {
    let requestedUrl = "";
    let requestedInit: RequestInit | undefined;
    const fetcher: OpenFoodFactsFetcher = async (url, init) => {
      requestedUrl = url;
      requestedInit = init;
      return {
        ok: true,
        status: 200,
        json: async () => ({
          status: "success",
          product: {
            product_name_ja: "チョコスプレッド",
            product_name: "Chocolate Spread",
            product_name_en: "Chocolate Spread",
            brands: "Nutella, Ferrero",
            image_front_url:
              "https://images.openfoodfacts.org/images/products/front.jpg",
          },
        }),
      };
    };

    await expect(
      lookupOpenFoodFactsProduct(" 3017620422003 ", "ja", fetcher),
    ).resolves.toEqual({
      productName: "チョコスプレッド",
      brand: "Nutella, Ferrero",
      imageUri: "https://images.openfoodfacts.org/images/products/front.jpg",
    });
    expect(requestedUrl).toContain(
      "/api/v3/product/3017620422003?product_type=food",
    );
    expect(requestedUrl).toContain("lc=ja");
    expect(requestedUrl).toContain(
      "fields=product_name_ja%2Cproduct_name%2Cproduct_name_en%2Cbrands%2Cimage_front_url%2Cimage_url",
    );
    expect(requestedInit?.headers).toEqual({
      Accept: "application/json",
      "User-Agent":
        "buy-again/1.0.0 (https://github.com/naoki-webdev/buy-again)",
    });
  });

  it("商品が登録されていない場合はnullを返す", async () => {
    const fetcher: OpenFoodFactsFetcher = async () => ({
      ok: true,
      status: 200,
      json: async () => ({ status: "failure" }),
    });

    await expect(
      lookupOpenFoodFactsProduct("4900000000001", "ja", fetcher),
    ).resolves.toBeNull();
  });

  it("404はエラーにせずnullを返す", async () => {
    const fetcher: OpenFoodFactsFetcher = async () => ({
      ok: false,
      status: 404,
      json: async () => ({}),
    });

    await expect(
      lookupOpenFoodFactsProduct("4900000000001", "ja", fetcher),
    ).resolves.toBeNull();
  });

  it("サーバーエラーは呼び出し元へ返す", async () => {
    const fetcher: OpenFoodFactsFetcher = async () => ({
      ok: false,
      status: 500,
      json: async () => ({}),
    });

    await expect(
      lookupOpenFoodFactsProduct("4900000000001", "ja", fetcher),
    ).rejects.toThrow("500");
  });

  it("不正なJSONは検索エラーとして返す", async () => {
    const fetcher: OpenFoodFactsFetcher = async () => ({
      ok: true,
      status: 200,
      json: async () => {
        throw new Error("invalid json");
      },
    });

    await expect(
      lookupOpenFoodFactsProduct("4900000000001", "ja", fetcher),
    ).rejects.toThrow("invalid json");
  });

  it("success_with_errorsでも取得できた商品情報を使う", async () => {
    const fetcher: OpenFoodFactsFetcher = async () => ({
      ok: true,
      status: 200,
      json: async () => ({
        status: "success_with_errors",
        product: { product_name_ja: "一部情報の商品" },
      }),
    });

    await expect(
      lookupOpenFoodFactsProduct("4900000000001", "ja", fetcher),
    ).resolves.toEqual({
      productName: "一部情報の商品",
      brand: null,
      imageUri: null,
    });
  });

  it("日本語表示では日本語名を優先する", async () => {
    const fetcher: OpenFoodFactsFetcher = async () => ({
      ok: true,
      status: 200,
      json: async () => ({
        status: "success",
        product: {
          product_name_ja: "バターチキンカレー",
          product_name: "Butter Chicken",
          product_name_en: "Butter Chicken",
          brands: "Mandala",
        },
      }),
    });

    await expect(
      lookupOpenFoodFactsProduct("4901002182663", "ja", fetcher),
    ).resolves.toMatchObject({ productName: "バターチキンカレー" });
  });

  it("英語表示では英語名を優先し、なければ通常名を使う", async () => {
    let requestedUrl = "";
    const fetcher: OpenFoodFactsFetcher = async (url) => {
      requestedUrl = url;
      return {
        ok: true,
        status: 200,
        json: async () => ({
          status: "success",
          product: {
            product_name: "Butter Chicken",
            product_name_en: "Butter Chicken",
            brands: "Mandala",
          },
        }),
      };
    };

    await expect(
      lookupOpenFoodFactsProduct("4901002182663", "en", fetcher),
    ).resolves.toEqual({
      productName: "Butter Chicken",
      brand: "Mandala",
      imageUri: null,
    });
    expect(requestedUrl).toContain("lc=en");
  });

  it("商品名を保存上限の120文字に切り詰める", async () => {
    const fetcher: OpenFoodFactsFetcher = async () => ({
      ok: true,
      status: 200,
      json: async () => ({
        status: "success",
        product: { product_name: "あ".repeat(121) },
      }),
    });

    await expect(
      lookupOpenFoodFactsProduct("4900000000001", "en", fetcher),
    ).resolves.toMatchObject({ productName: "あ".repeat(120) });
  });

  it("ブランドを保存上限の100文字に切り詰める", async () => {
    const fetcher: OpenFoodFactsFetcher = async () => ({
      ok: true,
      status: 200,
      json: async () => ({
        status: "success",
        product: { product_name: "商品", brands: "あ".repeat(101) },
      }),
    });

    await expect(
      lookupOpenFoodFactsProduct("4900000000001", "ja", fetcher),
    ).resolves.toMatchObject({ brand: "あ".repeat(100) });
  });

  it("呼び出し元のAbortSignalで検索を中断できる", async () => {
    const controller = new AbortController();
    const fetcher: OpenFoodFactsFetcher = async (_url, init) =>
      new Promise((_resolve, reject) => {
        init?.signal?.addEventListener("abort", () => {
          reject(new Error("aborted"));
        });
      });

    const lookup = lookupOpenFoodFactsProduct(
      "4901002182663",
      "ja",
      fetcher,
      controller.signal,
    );
    controller.abort();

    await expect(lookup).rejects.toThrow("aborted");
  });

  it("数字以外のバーコードは外部検索しない", async () => {
    let called = false;
    const fetcher: OpenFoodFactsFetcher = async () => {
      called = true;
      return { ok: true, status: 200, json: async () => ({}) };
    };

    await expect(
      lookupOpenFoodFactsProduct("ABC-123", "ja", fetcher),
    ).resolves.toBeNull();
    expect(called).toBe(false);
  });

  it("Open Food Facts以外の画像URLは保存候補にしない", async () => {
    const fetcher: OpenFoodFactsFetcher = async () => ({
      ok: true,
      status: 200,
      json: async () => ({
        status: "success",
        product: {
          product_name: "Test product",
          image_front_url: "https://example.com/untrusted-image.jpg",
        },
      }),
    });

    await expect(
      lookupOpenFoodFactsProduct("4901002182663", "en", fetcher),
    ).resolves.toEqual({
      productName: "Test product",
      brand: null,
      imageUri: null,
    });
  });
});
