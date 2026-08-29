import Constants from "expo-constants";

import {
  MAX_BRAND_LENGTH,
  MAX_PRODUCT_NAME_LENGTH,
  type ProductDraft,
} from "@/domain/product";

const OPEN_FOOD_FACTS_API_URL =
  "https://world.openfoodfacts.org/api/v3/product";
const APP_VERSION = Constants.expoConfig?.version ?? "1.0.0";
const OPEN_FOOD_FACTS_USER_AGENT = `buy-again/${APP_VERSION} (https://github.com/naoki-webdev/buy-again)`;
const REQUEST_TIMEOUT_MS = 7000;
const OPEN_FOOD_FACTS_IMAGE_HOSTS = new Set([
  "images.openfoodfacts.org",
  "static.openfoodfacts.org",
]);

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

export function mergeOpenFoodFactsSuggestion(
  draft: ProductDraft,
  requestedBarcode: string,
  product: OpenFoodFactsProduct,
): ProductDraft {
  if (draft.barcode.trim() !== requestedBarcode.trim()) {
    return draft;
  }

  return {
    ...draft,
    ...(draft.name.trim().length === 0 && product.productName
      ? { name: product.productName }
      : {}),
    ...(draft.brand.trim().length === 0 && product.brand
      ? { brand: product.brand }
      : {}),
    ...(draft.imageUri === null && product.imageUri
      ? { imageUri: product.imageUri }
      : {}),
  };
}

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

export function isOpenFoodFactsImageUri(uri: string): boolean {
  try {
    const parsed = new URL(uri);
    return (
      parsed.protocol === "https:" &&
      OPEN_FOOD_FACTS_IMAGE_HOSTS.has(parsed.hostname.toLowerCase())
    );
  } catch {
    return false;
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
  const brand = truncateText(normalizeText(product.brands), MAX_BRAND_LENGTH);
  const imageUri =
    normalizeImageUri(product.image_front_url) ??
    normalizeImageUri(product.image_url);
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
  return truncateText(productName, MAX_PRODUCT_NAME_LENGTH);
}

function normalizeText(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : null;
}

function truncateText(value: string | null, maxLength: number): string | null {
  if (!value) {
    return null;
  }
  return value.slice(0, maxLength).trim() || null;
}

function normalizeImageUri(value: unknown): string | null {
  const imageUri = normalizeText(value);
  return imageUri && isOpenFoodFactsImageUri(imageUri) ? imageUri : null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
