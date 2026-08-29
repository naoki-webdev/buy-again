import { router } from "expo-router";
import { Linking, StyleSheet, Text, View } from "react-native";

import {
  AppHeader,
  IconButton,
  Screen,
  SecondaryButton,
} from "@/components/ui";
import { Colors, Radius, Spacing } from "@/constants/theme";
import { useTranslation } from "@/i18n";

const OPEN_FOOD_FACTS_URL = "https://world.openfoodfacts.org/";

export default function PrivacyScreen() {
  const { t } = useTranslation();

  return (
    <Screen scroll style={styles.content}>
      <AppHeader
        eyebrow={t("privacy.eyebrow")}
        title={t("privacy.title")}
        action={
          <IconButton
            label={t("common.back")}
            glyph="‹"
            onPress={() => router.back()}
          />
        }
      />

      <Text style={styles.intro}>{t("privacy.intro")}</Text>
      <PolicySection title={t("privacy.local_title")}>
        {t("privacy.local_body")}
      </PolicySection>
      <PolicySection title={t("privacy.network_title")}>
        {t("privacy.network_body")}
      </PolicySection>
      <PolicySection title={t("privacy.permissions_title")}>
        {t("privacy.permissions_body")}
      </PolicySection>
      <PolicySection title={t("privacy.security_title")}>
        {t("privacy.security_body")}
      </PolicySection>
      <PolicySection title={t("privacy.deletion_title")}>
        {t("privacy.deletion_body")}
      </PolicySection>
      <PolicySection title={t("privacy.third_party_title")}>
        {t("privacy.third_party_body")}
      </PolicySection>
      <PolicySection title={t("privacy.purchase_title")}>
        {t("privacy.purchase_body")}
      </PolicySection>
      <PolicySection title={t("privacy.contact_title")}>
        {t("privacy.contact_body")}
      </PolicySection>

      <View style={styles.attribution}>
        <Text style={styles.attributionTitle}>Open Food Facts</Text>
        <Text style={styles.attributionDescription}>
          {t("settings.attribution_description")}
        </Text>
        <SecondaryButton
          label={t("privacy.off_link")}
          glyph="↗"
          onPress={() =>
            void Linking.openURL(OPEN_FOOD_FACTS_URL).catch(() => undefined)
          }
        />
      </View>
    </Screen>
  );
}

function PolicySection({
  title,
  children,
}: {
  title: string;
  children: string;
}) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Text style={styles.sectionBody}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: 48 },
  intro: { color: Colors.ink, fontSize: 16, lineHeight: 25, marginBottom: 28 },
  section: { gap: 8, marginBottom: 24 },
  sectionTitle: { color: Colors.ink, fontSize: 18, fontWeight: "800" },
  sectionBody: { color: Colors.muted, fontSize: 14, lineHeight: 22 },
  attribution: {
    borderRadius: Radius.md,
    backgroundColor: Colors.forestSoft,
    padding: Spacing.lg,
    gap: 8,
  },
  attributionTitle: { color: Colors.forest, fontSize: 16, fontWeight: "800" },
  attributionDescription: { color: Colors.muted, fontSize: 13, lineHeight: 20 },
});
