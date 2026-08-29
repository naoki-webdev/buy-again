import { createEmptyDraft, validateProductDraft } from "@/domain/product";

describe("product domain", () => {
  it("JAN、EAN、UPC以外のバーコード文字列を拒否する", () => {
    const draft = { ...createEmptyDraft(), name: "商品", barcode: "AB-123" };

    expect(validateProductDraft(draft)).toBe(
      "バーコードは数字で入力してください。",
    );
  });
});
