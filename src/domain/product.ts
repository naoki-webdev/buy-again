export type Rating = "buy_again" | "buy_if_cheap" | "maybe" | "never_again";

export type Product = {
  id: number;
  name: string;
  barcode: string | null;
  imageUri: string | null;
  rating: Rating;
  note: string;
  createdAt: string;
  updatedAt: string;
};

export type ProductDraft = {
  name: string;
  barcode: string;
  imageUri: string | null;
  rating: Rating;
  note: string;
};

export type RatingOption = {
  value: Rating;
  label: string;
  shortLabel: string;
  color: string;
  backgroundColor: string;
};

export const RATING_OPTIONS: readonly RatingOption[] = [
  {
    value: "buy_again",
    label: "また買う",
    shortLabel: "また買う",
    color: "#285243",
    backgroundColor: "#DCE8E0",
  },
  {
    value: "buy_if_cheap",
    label: "安ければ買う",
    shortLabel: "安ければ",
    color: "#C68B35",
    backgroundColor: "#F8ECCC",
  },
  {
    value: "maybe",
    label: "微妙",
    shortLabel: "微妙",
    color: "#60706B",
    backgroundColor: "#E3E8E4",
  },
  {
    value: "never_again",
    label: "二度と買わない",
    shortLabel: "避ける",
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

export function validateProductDraft(draft: ProductDraft): string | null {
  if (draft.name.trim().length === 0) {
    return "商品名を入力してください。";
  }
  if (draft.name.trim().length > 120) {
    return "商品名は120文字以内で入力してください。";
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
    const matchesQuery =
      normalizedQuery.length === 0 ||
      product.name.toLocaleLowerCase().includes(normalizedQuery);
    const matchesRating = rating === "all" || product.rating === rating;
    return matchesQuery && matchesRating;
  });
}

export function createEmptyDraft(barcode = ""): ProductDraft {
  return {
    name: "",
    barcode,
    imageUri: null,
    rating: "buy_again",
    note: "",
  };
}
