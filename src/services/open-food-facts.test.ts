import {
  buildSuggestedProductName,
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
            product_name: "Nutella",
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
      productName: "Nutella",
      brand: "Nutella, Ferrero",
      imageUri: "https://images.openfoodfacts.org/images/products/front.jpg",
    });
    expect(requestedUrl).toContain(
      "/api/v3/product/3017620422003?product_type=food",
    );
    expect(requestedUrl).toContain(
      "fields=product_name%2Cbrands%2Cimage_front_url%2Cimage_url",
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

  it("ブランドと商品名を登録用の商品名にまとめる", () => {
    expect(buildSuggestedProductName("チョコレート", "メーカー")).toBe(
      "メーカー チョコレート",
    );
    expect(buildSuggestedProductName("Nutella", "Nutella, Ferrero")).toBe(
      "Nutella",
    );
    expect(buildSuggestedProductName(null, "メーカー")).toBe("メーカー");
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
