import Constants from "expo-constants";

const OPEN_FOOD_FACTS_API_URL =
  "https://world.openfoodfacts.org/api/v3/product";
const APP_VERSION = Constants.expoConfig?.version ?? "1.0.0";
const OPEN_FOOD_FACTS_USER_AGENT = `buy-again/${APP_VERSION} (https://github.com/naoki-webdev/buy-again)`;
const REQUEST_TIMEOUT_MS = 7000;

type OpenFoodFactsProductResponse = {
  product_name_ja?: unknown;
  product_name?: unknown;
  product_name_en?: unknown;
  brands?: unknown;
  image_front_url?: unknown;
  image_url?: unknown;
};

type OpenFoodFactsResponse = {
  ok: boolean;
  status: number;
  json: () => Promise<unknown>;
};

export type OpenFoodFactsFetcher = (
  url: string,
  init?: RequestInit,
) => Promise<OpenFoodFactsResponse>;

export type OpenFoodFactsProduct = {
  productName: string | null;
  brand: string | null;
  imageUri: string | null;
};

export type ProductLookupLanguage = "ja" | "en";

export async function lookupOpenFoodFactsProduct(
  barcode: string,
  language: ProductLookupLanguage = "en",
  fetcher: OpenFoodFactsFetcher = fetch,
  signal?: AbortSignal,
): Promise<OpenFoodFactsProduct | null> {
  const normalizedBarcode = barcode.trim();
  if (normalizedBarcode.length === 0 || !/^\d+$/.test(normalizedBarcode)) {
    return null;
  }

  const query = new URLSearchParams({
    product_type: "food",
    lc: language,
    fields:
      "product_name_ja,product_name,product_name_en,brands,image_front_url,image_url",
  });
  const url = `${OPEN_FOOD_FACTS_API_URL}/${encodeURIComponent(normalizedBarcode)}?${query.toString()}`;
  if (signal?.aborted) {
    return null;
  }

  const controller = new AbortController();
  const abortLookup = () => controller.abort();
  signal?.addEventListener("abort", abortLookup, { once: true });
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetcher(url, {
      headers: {
        Accept: "application/json",
        "User-Agent": OPEN_FOOD_FACTS_USER_AGENT,
      },
      signal: controller.signal,
    });

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error(
        `Open Food Factsの検索に失敗しました（${response.status}）。`,
      );
    }

    const payload: unknown = await response.json();
    return parseProductResponse(payload, language);
  } finally {
    clearTimeout(timeoutId);
    signal?.removeEventListener("abort", abortLookup);
  }
}

function parseProductResponse(
  payload: unknown,
  language: ProductLookupLanguage,
): OpenFoodFactsProduct | null {
  if (!isRecord(payload)) {
    return null;
  }

  const status = normalizeText(payload.status);
  if (status !== "success" && status !== "success_with_errors") {
    return null;
  }

  const product = isRecord(payload.product)
    ? (payload.product as OpenFoodFactsProductResponse)
    : null;
  if (!product) {
    return null;
  }

  const productName = selectProductName(product, language);
  const brand = normalizeText(product.brands);
  const imageUri = normalizeImageUri(
    product.image_front_url ?? product.image_url,
  );
  if (!productName && !brand && !imageUri) {
    return null;
  }

  return { productName, brand, imageUri };
}

function selectProductName(
  product: OpenFoodFactsProductResponse,
  language: ProductLookupLanguage,
): string | null {
  const candidates =
    language === "ja"
      ? [product.product_name_ja, product.product_name, product.product_name_en]
      : [
          product.product_name_en,
          product.product_name,
          product.product_name_ja,
        ];

  const productName = candidates.map(normalizeText).find(Boolean) ?? null;
  return productName ? productName.slice(0, 120).trim() : null;
}

function normalizeText(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : null;
}

function normalizeImageUri(value: unknown): string | null {
  const imageUri = normalizeText(value);
  return imageUri?.startsWith("https://") ? imageUri : null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
