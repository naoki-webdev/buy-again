import { translations } from "@/locales/generated";

describe("locale data", () => {
  it("日本語と英語の翻訳キーが一致する", () => {
    expect(getLeafKeys(translations.ja)).toEqual(getLeafKeys(translations.en));
  });
});

function getLeafKeys(value: unknown, prefix = ""): string[] {
  if (typeof value === "string") {
    return prefix.length > 0 ? [prefix] : [];
  }
  if (!isRecord(value)) {
    return [];
  }

  return Object.entries(value).flatMap(([key, child]) =>
    getLeafKeys(child, prefix.length > 0 ? `${prefix}.${key}` : key),
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
