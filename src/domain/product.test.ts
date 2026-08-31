import {
  createEmptyDraft,
  MAX_BRAND_LENGTH,
  MAX_NOTE_LENGTH,
  RATING_OPTIONS,
  validateProductDraft,
} from "@/domain/product";
import { Colors } from "@/constants/theme";

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

  it("主要な補助文字と評価ラベルのコントラストを確保する", () => {
    expect(
      getContrastRatio(Colors.muted, Colors.background),
    ).toBeGreaterThanOrEqual(4.5);
    for (const option of RATING_OPTIONS) {
      expect(
        getContrastRatio(option.color, option.backgroundColor),
      ).toBeGreaterThanOrEqual(4.5);
    }
  });
});

function getContrastRatio(foreground: string, background: string): number {
  const foregroundLuminance = getRelativeLuminance(foreground);
  const backgroundLuminance = getRelativeLuminance(background);
  return (
    (Math.max(foregroundLuminance, backgroundLuminance) + 0.05) /
    (Math.min(foregroundLuminance, backgroundLuminance) + 0.05)
  );
}

function getRelativeLuminance(color: string): number {
  const channels = color
    .slice(1)
    .match(/../g)
    ?.map((channel) => Number.parseInt(channel, 16) / 255);
  if (!channels || channels.length !== 3) {
    throw new Error(`Invalid color: ${color}`);
  }
  const linear = channels.map((channel) =>
    channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4,
  );
  return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
}
