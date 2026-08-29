import type { TranslationKey } from "@/locales/types";

export type Rating = "buy_again" | "buy_if_cheap" | "maybe" | "never_again";

export type Product = {
  id: number;
  name: string;
  brand: string;
  barcode: string | null;
  imageUri: string | null;
  rating: Rating;
  note: string;
  createdAt: string;
  updatedAt: string;
};

export type ProductDraft = {
  name: string;
  brand: string;
  barcode: string;
  imageUri: string | null;
  rating: Rating;
  note: string;
};

export type ProductValidationError =
  | "product_name_required"
  | "product_name_too_long"
  | "brand_too_long"
  | "note_too_long"
  | "barcode_digits_only";

export const MAX_PRODUCT_NAME_LENGTH = 120;
export const MAX_BRAND_LENGTH = 100;
export const MAX_NOTE_LENGTH = 2000;

export type RatingOption = {
  value: Rating;
  labelKey: TranslationKey;
  shortLabelKey: TranslationKey;
  color: string;
  backgroundColor: string;
};

export const RATING_OPTIONS: readonly RatingOption[] = [
  {
    value: "buy_again",
    labelKey: "rating.buy_again.label",
    shortLabelKey: "rating.buy_again.short",
    color: "#285243",
    backgroundColor: "#DCE8E0",
  },
  {
    value: "buy_if_cheap",
    labelKey: "rating.buy_if_cheap.label",
    shortLabelKey: "rating.buy_if_cheap.short",
    color: "#C68B35",
    backgroundColor: "#F8ECCC",
  },
  {
    value: "maybe",
    labelKey: "rating.maybe.label",
    shortLabelKey: "rating.maybe.short",
    color: "#60706B",
    backgroundColor: "#E3E8E4",
  },
  {
    value: "never_again",
    labelKey: "rating.never_again.label",
    shortLabelKey: "rating.never_again.short",
    color: "#B9534C",
    backgroundColor: "#F5E0D8",
  },
];

export function getRatingOption(rating: Rating): RatingOption {
  return (
    RATING_OPTIONS.find((option) => option.value === rating) ??
    RATING_OPTIONS[2]
  );
}

export function validateProductDraft(
  draft: ProductDraft,
): ProductValidationError | null {
  if (draft.name.trim().length === 0) {
    return "product_name_required";
  }
  if (draft.name.trim().length > MAX_PRODUCT_NAME_LENGTH) {
    return "product_name_too_long";
  }
  if (draft.brand.trim().length > MAX_BRAND_LENGTH) {
    return "brand_too_long";
  }
  if (draft.note.trim().length > MAX_NOTE_LENGTH) {
    return "note_too_long";
  }
  const barcodeError = validateBarcode(draft.barcode);
  if (barcodeError) {
    return barcodeError;
  }
  return null;
}

export function validateBarcode(
  barcode: string,
): ProductValidationError | null {
  const normalizedBarcode = barcode.trim();
  if (normalizedBarcode.length > 0 && !/^\d+$/.test(normalizedBarcode)) {
    return "barcode_digits_only";
  }
  return null;
}

export function filterProducts(
  products: readonly Product[],
  query: string,
  rating: Rating | "all",
): Product[] {
  const normalizedQuery = query.trim().toLocaleLowerCase();
  return products.filter((product) => {
    const searchableText = [product.name, product.brand, product.barcode ?? ""]
      .join(" ")
      .toLocaleLowerCase();
    const matchesQuery =
      normalizedQuery.length === 0 || searchableText.includes(normalizedQuery);
    const matchesRating = rating === "all" || product.rating === rating;
    return matchesQuery && matchesRating;
  });
}

export function createEmptyDraft(barcode = ""): ProductDraft {
  return {
    name: "",
    brand: "",
    barcode,
    imageUri: null,
    rating: "buy_again",
    note: "",
  };
}
