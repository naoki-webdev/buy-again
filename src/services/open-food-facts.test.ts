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
});
