import AsyncStorage from "@react-native-async-storage/async-storage";
import { getLocales } from "expo-localization";
import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { AppState } from "react-native";

import { translations } from "@/locales/generated";
import type { TranslationKey } from "@/locales/types";
import { ProductError } from "@/domain/errors";

export type AppLanguage = "ja" | "en";
export type LanguagePreference = "system" | AppLanguage;
export type TranslationValues = Record<string, string | number>;
export type { TranslationKey } from "@/locales/types";
export type Translate = (
  key: TranslationKey,
  values?: TranslationValues,
) => string;

type TranslationNode = {
  [key: string]: string | TranslationNode;
};

type I18nContextValue = {
  language: AppLanguage;
  preference: LanguagePreference;
  setPreference: (preference: LanguagePreference) => Promise<void>;
  t: Translate;
};

export const LANGUAGE_PREFERENCE_KEY = "buy-again.language-preference";
const I18nContext = createContext<I18nContextValue | null>(null);

export async function loadLanguagePreference(): Promise<LanguagePreference> {
  const storedPreference = await AsyncStorage.getItem(LANGUAGE_PREFERENCE_KEY);
  return isLanguagePreference(storedPreference) ? storedPreference : "system";
}

export async function saveLanguagePreference(
  preference: LanguagePreference,
): Promise<void> {
  await AsyncStorage.setItem(LANGUAGE_PREFERENCE_KEY, preference);
}

export function I18nProvider({ children }: PropsWithChildren) {
  const [preference, setPreferenceState] =
    useState<LanguagePreference>("system");
  const [deviceLanguage, setDeviceLanguage] =
    useState<AppLanguage>(getDeviceLanguage());
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let isMounted = true;
    void loadLanguagePreference()
      .then((storedPreference) => {
        if (isMounted && isLanguagePreference(storedPreference)) {
          setPreferenceState(storedPreference);
        }
      })
      .catch(() => undefined)
      .finally(() => {
        if (isMounted) {
          setIsReady(true);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        setDeviceLanguage(getDeviceLanguage());
      }
    });
    return () => subscription.remove();
  }, []);

  const language = preference === "system" ? deviceLanguage : preference;
  const t = useCallback<Translate>(
    (key, values) => translate(language, key, values),
    [language],
  );
  const setPreference = useCallback(
    async (nextPreference: LanguagePreference) => {
      const previousPreference = preference;
      setPreferenceState(nextPreference);
      try {
        await saveLanguagePreference(nextPreference);
      } catch {
        setPreferenceState(previousPreference);
        throw new Error("言語設定を保存できませんでした。");
      }
    },
    [preference],
  );
  const contextValue = useMemo(
    () => ({ language, preference, setPreference, t }),
    [language, preference, setPreference, t],
  );

  if (!isReady) {
    return null;
  }

  return (
    <I18nContext.Provider value={contextValue}>{children}</I18nContext.Provider>
  );
}

export function useTranslation(): I18nContextValue {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error("useTranslation must be used within I18nProvider");
  }
  return context;
}

export function detectSystemLanguage(
  languageCode?: string | null,
): AppLanguage {
  return languageCode?.toLowerCase() === "ja" ? "ja" : "en";
}

export function getLocalizedErrorMessage(
  error: unknown,
  t: Translate,
  fallbackKey: TranslationKey,
): string {
  if (!(error instanceof Error)) {
    return t(fallbackKey);
  }

  if (error instanceof ProductError) {
    return t(`errors.${error.code}`);
  }

  if (error.message.includes("すでに登録されています")) {
    return t("errors.duplicate_barcode");
  }
  if (error.message === "商品を登録できませんでした。") {
    return t("errors.register_failed");
  }
  if (error.message === "商品が見つかりません。") {
    return t("errors.product_not_found");
  }
  return t(fallbackKey);
}

function getDeviceLanguage(): AppLanguage {
  return detectSystemLanguage(getLocales()[0]?.languageCode);
}

function translate(
  language: AppLanguage,
  key: TranslationKey,
  values?: TranslationValues,
): string {
  const selected = translations[language] as unknown as TranslationNode;
  const english = translations.en as unknown as TranslationNode;
  const template =
    resolveTranslation(selected, key) ??
    resolveTranslation(english, key) ??
    key;
  return values ? interpolate(template, values) : template;
}

function resolveTranslation(
  source: TranslationNode,
  key: TranslationKey,
): string | undefined {
  let current: string | TranslationNode = source;
  for (const segment of key.split(".")) {
    if (typeof current === "string") {
      return undefined;
    }
    current = current[segment];
    if (current === undefined) {
      return undefined;
    }
  }
  return typeof current === "string" ? current : undefined;
}

function interpolate(template: string, values: TranslationValues): string {
  return template.replace(/\{([^{}]+)\}/g, (placeholder, name: string) => {
    const value = values[name];
    return value === undefined ? placeholder : String(value);
  });
}

export function isLanguagePreference(
  value: string | null,
): value is LanguagePreference {
  return value === "system" || value === "ja" || value === "en";
}
