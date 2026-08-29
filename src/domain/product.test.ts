import { createEmptyDraft, validateProductDraft } from "@/domain/product";

describe("product domain", () => {
  it("数字以外のバーコード文字列を拒否する", () => {
    const draft = { ...createEmptyDraft(), name: "商品", barcode: "AB-123" };

    expect(validateProductDraft(draft)).toBe(
      "バーコードは数字で入力してください。",
    );
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
