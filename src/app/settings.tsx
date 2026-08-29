import { router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { AppHeader, IconButton, Screen } from "@/components/ui";
import { Colors, Radius, Spacing } from "@/constants/theme";
import { type LanguagePreference, useTranslation } from "@/i18n";

const LANGUAGE_OPTIONS: readonly LanguagePreference[] = ["system", "ja", "en"];

export default function SettingsScreen() {
  const { language, preference, setPreference, t } = useTranslation();
  const languageLabel =
    language === "ja" ? t("settings.japanese") : t("settings.english");

  return (
    <Screen scroll style={styles.content}>
      <AppHeader
        eyebrow={t("settings.eyebrow")}
        title={t("settings.title")}
        action={
          <IconButton
            label={t("common.back")}
            glyph="‹"
            onPress={() => router.back()}
          />
        }
      />

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t("settings.language_title")}</Text>
        <Text style={styles.sectionDescription}>
          {t("settings.language_description")}
        </Text>
        <Text style={styles.current}>
          {t("settings.current", { language: languageLabel })}
        </Text>

        <View style={styles.options}>
          {LANGUAGE_OPTIONS.map((option) => {
            const selected = preference === option;
            const optionCopy = getOptionCopy(option, t);
            return (
              <Pressable
                key={option}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
                onPress={() => void setPreference(option)}
                style={({ pressed }) => [
                  styles.option,
                  selected && styles.selectedOption,
                  pressed && styles.pressed,
                ]}
              >
                <View style={styles.optionCopy}>
                  <Text style={styles.optionLabel}>{optionCopy.label}</Text>
                  <Text style={styles.optionDescription}>
                    {optionCopy.description}
                  </Text>
                </View>
                <View style={[styles.radio, selected && styles.selectedRadio]}>
                  {selected ? <View style={styles.radioDot} /> : null}
                </View>
              </Pressable>
            );
          })}
        </View>
        <Text style={styles.note}>{t("settings.product_language_note")}</Text>
      </View>
    </Screen>
  );
}

function getOptionCopy(
  preference: LanguagePreference,
  t: ReturnType<typeof useTranslation>["t"],
): { label: string; description: string } {
  if (preference === "ja") {
    return {
      label: t("settings.japanese"),
      description: t("settings.japanese_description"),
    };
  }
  if (preference === "en") {
    return {
      label: t("settings.english"),
      description: t("settings.english_description"),
    };
  }
  return {
    label: t("settings.system"),
    description: t("settings.system_description"),
  };
}

const styles = StyleSheet.create({
  content: { paddingBottom: 48 },
  section: { gap: 12 },
  sectionTitle: { color: Colors.ink, fontSize: 20, fontWeight: "800" },
  sectionDescription: { color: Colors.muted, fontSize: 14, lineHeight: 21 },
  current: { color: Colors.forest, fontSize: 13, fontWeight: "800" },
  options: { gap: 10, marginTop: 4 },
  option: {
    minHeight: 78,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  selectedOption: {
    borderColor: Colors.forest,
    backgroundColor: Colors.forestSoft,
  },
  optionCopy: { flex: 1, gap: 4 },
  optionLabel: { color: Colors.ink, fontSize: 15, fontWeight: "800" },
  optionDescription: { color: Colors.muted, fontSize: 12, lineHeight: 18 },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  selectedRadio: { borderColor: Colors.forest },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.forest,
  },
  note: { color: Colors.muted, fontSize: 12, lineHeight: 18, marginTop: 4 },
  pressed: { opacity: 0.72 },
});
