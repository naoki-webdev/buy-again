const OPEN_FOOD_FACTS_API_URL =
  "https://world.openfoodfacts.org/api/v3/product";
const OPEN_FOOD_FACTS_USER_AGENT =
  "buy-again/1.1 (https://github.com/naoki-webdev/buy-again)";
const REQUEST_TIMEOUT_MS = 7000;

type OpenFoodFactsProductResponse = {
  product_name?: unknown;
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

export async function lookupOpenFoodFactsProduct(
  barcode: string,
  fetcher: OpenFoodFactsFetcher = fetch,
): Promise<OpenFoodFactsProduct | null> {
  const normalizedBarcode = barcode.trim();
  if (normalizedBarcode.length === 0 || !/^\d+$/.test(normalizedBarcode)) {
    return null;
  }

  const query = new URLSearchParams({
    product_type: "food",
    lc: "ja",
    fields: "product_name,brands,image_front_url,image_url",
  });
  const url = `${OPEN_FOOD_FACTS_API_URL}/${encodeURIComponent(normalizedBarcode)}?${query.toString()}`;
  const controller = new AbortController();
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
    return parseProductResponse(payload);
  } finally {
    clearTimeout(timeoutId);
  }
}

export function buildSuggestedProductName(
  productName: string | null,
  brand: string | null,
): string {
  const normalizedProductName = normalizeText(productName);
  const normalizedBrand = normalizeText(brand)?.split(",")[0]?.trim() ?? "";

  if (!normalizedProductName) {
    return normalizedBrand.slice(0, 120);
  }
  if (!normalizedBrand) {
    return normalizedProductName.slice(0, 120);
  }

  const lowerProductName = normalizedProductName.toLocaleLowerCase();
  const lowerBrand = normalizedBrand.toLocaleLowerCase();
  if (
    lowerProductName === lowerBrand ||
    lowerProductName.startsWith(`${lowerBrand} `)
  ) {
    return normalizedProductName.slice(0, 120);
  }

  return `${normalizedBrand} ${normalizedProductName}`.slice(0, 120).trim();
}

function parseProductResponse(payload: unknown): OpenFoodFactsProduct | null {
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

  const productName = normalizeText(product.product_name);
  const brand = normalizeText(product.brands);
  const imageUri = normalizeImageUri(
    product.image_front_url ?? product.image_url,
  );
  if (!productName && !brand && !imageUri) {
    return null;
  }

  return { productName, brand, imageUri };
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
