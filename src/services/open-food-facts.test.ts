import {
  lookupOpenFoodFactsProduct,
  type OpenFoodFactsFetcher,
} from "@/services/open-food-facts";

describe("Open Food Facts service", () => {
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
      lookupOpenFoodFactsProduct(" 3017620422003 ", fetcher),
    ).resolves.toEqual({
      productName: "チョコスプレッド",
      brand: "Nutella, Ferrero",
      imageUri: "https://images.openfoodfacts.org/images/products/front.jpg",
    });
    expect(requestedUrl).toContain(
      "/api/v3/product/3017620422003?product_type=food",
    );
    expect(requestedUrl).toContain(
      "fields=product_name_ja%2Cproduct_name%2Cproduct_name_en%2Cbrands%2Cimage_front_url%2Cimage_url",
    );
    expect(requestedInit?.headers).toEqual({
      Accept: "application/json",
      "User-Agent": "buy-again/1.1 (https://github.com/naoki-webdev/buy-again)",
    });
  });

  it("商品が登録されていない場合はnullを返す", async () => {
    const fetcher: OpenFoodFactsFetcher = async () => ({
      ok: true,
      status: 200,
      json: async () => ({ status: "failure" }),
    });

    await expect(
      lookupOpenFoodFactsProduct("4900000000001", fetcher),
    ).resolves.toBeNull();
  });

  it("404はエラーにせずnullを返す", async () => {
    const fetcher: OpenFoodFactsFetcher = async () => ({
      ok: false,
      status: 404,
      json: async () => ({}),
    });

    await expect(
      lookupOpenFoodFactsProduct("4900000000001", fetcher),
    ).resolves.toBeNull();
  });

  it("日本語名を優先し、英語しかない場合は通常名を使う", async () => {
    const fetcher: OpenFoodFactsFetcher = async () => ({
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
    });

    await expect(
      lookupOpenFoodFactsProduct("4901002182663", fetcher),
    ).resolves.toEqual({
      productName: "Butter Chicken",
      brand: "Mandala",
      imageUri: null,
    });
  });

  it("数字以外のバーコードは外部検索しない", async () => {
    let called = false;
    const fetcher: OpenFoodFactsFetcher = async () => {
      called = true;
      return { ok: true, status: 200, json: async () => ({}) };
    };

    await expect(
      lookupOpenFoodFactsProduct("ABC-123", fetcher),
    ).resolves.toBeNull();
    expect(called).toBe(false);
  });
});
