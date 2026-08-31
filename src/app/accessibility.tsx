import { router } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

import { AppHeader, IconButton, Screen } from "@/components/ui";
import { Colors } from "@/constants/theme";
import { useTranslation } from "@/i18n";

export default function AccessibilityScreen() {
  const { t } = useTranslation();

  return (
    <Screen scroll style={styles.content}>
      <AppHeader
        title={t("accessibility.title")}
        action={
          <IconButton
            label={t("common.back")}
            glyph="‹"
            onPress={() => router.back()}
          />
        }
      />
      <Text style={styles.intro}>{t("accessibility.intro")}</Text>
      <InfoSection title={t("accessibility.interaction_title")}>
        {t("accessibility.interaction_body")}
      </InfoSection>
      <InfoSection title={t("accessibility.alternative_title")}>
        {t("accessibility.alternative_body")}
      </InfoSection>
      <InfoSection title={t("accessibility.standard_title")}>
        {t("accessibility.standard_body")}
      </InfoSection>
      <InfoSection title={t("accessibility.contact_title")}>
        {t("accessibility.contact_body")}
      </InfoSection>
    </Screen>
  );
}

function InfoSection({ title, children }: { title: string; children: string }) {
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
