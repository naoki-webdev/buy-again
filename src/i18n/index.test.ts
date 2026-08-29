import { ProductError } from "@/domain/errors";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  detectSystemLanguage,
  getLocalizedErrorMessage,
  isLanguagePreference,
  LANGUAGE_PREFERENCE_KEY,
  loadLanguagePreference,
  saveLanguagePreference,
} from "@/i18n";

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

describe("language preference persistence", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("保存済みの言語設定を復元する", async () => {
    jest.mocked(AsyncStorage.getItem).mockResolvedValue("ja");

    await expect(loadLanguagePreference()).resolves.toBe("ja");
    expect(AsyncStorage.getItem).toHaveBeenCalledWith(LANGUAGE_PREFERENCE_KEY);
  });

  it("不正な保存値はsystemへ戻す", async () => {
    jest.mocked(AsyncStorage.getItem).mockResolvedValue("fr");

    await expect(loadLanguagePreference()).resolves.toBe("system");
  });

  it("言語設定をAsyncStorageへ保存する", async () => {
    jest.mocked(AsyncStorage.setItem).mockResolvedValue(undefined);

    await saveLanguagePreference("en");

    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      LANGUAGE_PREFERENCE_KEY,
      "en",
    );
  });
});

describe("product error localization", () => {
  it("エラーコードを表示言語の翻訳キーへ変換する", () => {
    const translate = (key: string) =>
      key === "errors.duplicate_barcode" ? "Duplicate barcode" : key;

    expect(
      getLocalizedErrorMessage(
        new ProductError("duplicate_barcode", "内部メッセージ"),
        translate,
        "errors.save_failed",
      ),
    ).toBe("Duplicate barcode");
  });
});

describe("language preference validation", () => {
  it("保存済み設定はsystem、ja、enだけを受け付ける", () => {
    expect(isLanguagePreference("system")).toBe(true);
    expect(isLanguagePreference("ja")).toBe(true);
    expect(isLanguagePreference("en")).toBe(true);
    expect(isLanguagePreference("fr")).toBe(false);
    expect(isLanguagePreference(null)).toBe(false);
  });
});
