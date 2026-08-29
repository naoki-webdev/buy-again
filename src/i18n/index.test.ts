import { detectSystemLanguage } from "@/i18n";

jest.mock("@react-native-async-storage/async-storage", () => ({
  __esModule: true,
  default: {
    getItem: jest.fn(),
    setItem: jest.fn(),
  },
}));

describe("system language detection", () => {
  it("日本語の端末は日本語を選ぶ", () => {
    expect(detectSystemLanguage("ja")).toBe("ja");
  });

  it("日本語以外の端末は英語を選ぶ", () => {
    expect(detectSystemLanguage("en")).toBe("en");
    expect(detectSystemLanguage("zh")).toBe("en");
    expect(detectSystemLanguage(null)).toBe("en");
  });
});
