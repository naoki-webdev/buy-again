import {
  createEmptyDraft,
  MAX_BRAND_LENGTH,
  MAX_NOTE_LENGTH,
  validateProductDraft,
} from "@/domain/product";

describe("product domain", () => {
  it("商品名が空の場合は拒否する", () => {
    expect(
      validateProductDraft({
        ...createEmptyDraft(),
        name: "   ",
      }),
    ).toBe("product_name_required");
  });

  it("商品名は120文字まで許容し、121文字を拒否する", () => {
    expect(
      validateProductDraft({
        ...createEmptyDraft(),
        name: "あ".repeat(120),
      }),
    ).toBeNull();
    expect(
      validateProductDraft({
        ...createEmptyDraft(),
        name: "あ".repeat(121),
      }),
    ).toBe("product_name_too_long");
  });

  it("数字以外のバーコード文字列を拒否する", () => {
    const draft = { ...createEmptyDraft(), name: "商品", barcode: "AB-123" };

    expect(validateProductDraft(draft)).toBe("barcode_digits_only");
  });

  it("ブランドは100文字まで、メモは2000文字まで許容する", () => {
    expect(
      validateProductDraft({
        ...createEmptyDraft(),
        name: "商品",
        brand: "あ".repeat(MAX_BRAND_LENGTH),
        note: "い".repeat(MAX_NOTE_LENGTH),
      }),
    ).toBeNull();

    expect(
      validateProductDraft({
        ...createEmptyDraft(),
        name: "商品",
        brand: "あ".repeat(MAX_BRAND_LENGTH + 1),
      }),
    ).toBe("brand_too_long");

    expect(
      validateProductDraft({
        ...createEmptyDraft(),
        name: "商品",
        note: "い".repeat(MAX_NOTE_LENGTH + 1),
      }),
    ).toBe("note_too_long");
  });

  it("手入力のバーコードは数字列を許容する", () => {
    expect(
      validateProductDraft({
        ...createEmptyDraft(),
        name: "商品",
        barcode: "123",
      }),
    ).toBeNull();
    expect(
      validateProductDraft({
        ...createEmptyDraft(),
        name: "商品",
        barcode: "999999999999999999999",
      }),
    ).toBeNull();
  });
});
