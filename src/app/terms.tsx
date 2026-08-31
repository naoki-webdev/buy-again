import { router } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

import { AppHeader, IconButton, Screen } from "@/components/ui";
import { Colors } from "@/constants/theme";
import { useTranslation } from "@/i18n";

export default function TermsScreen() {
  const { t } = useTranslation();

  return (
    <Screen scroll style={styles.content}>
      <AppHeader
        title={t("terms.title")}
        action={
          <IconButton
            label={t("common.back")}
            glyph="‹"
            onPress={() => router.back()}
          />
        }
      />
      <Text style={styles.intro}>{t("terms.intro")}</Text>
      <PolicySection title={t("terms.use_title")}>
        {t("terms.use_body")}
      </PolicySection>
      <PolicySection title={t("terms.storage_title")}>
        {t("terms.storage_body")}
      </PolicySection>
      <PolicySection title={t("terms.external_title")}>
        {t("terms.external_body")}
      </PolicySection>
      <PolicySection title={t("terms.purchase_title")}>
        {t("terms.purchase_body")}
      </PolicySection>
      <PolicySection title={t("terms.disclaimer_title")}>
        {t("terms.disclaimer_body")}
      </PolicySection>
      <PolicySection title={t("terms.changes_title")}>
        {t("terms.changes_body")}
      </PolicySection>
      <PolicySection title={t("terms.law_title")}>
        {t("terms.law_body")}
      </PolicySection>
      <PolicySection title={t("terms.contact_title")}>
        {t("terms.contact_body")}
      </PolicySection>
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
});
