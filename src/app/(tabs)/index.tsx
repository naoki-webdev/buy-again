import { router } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  AppHeader,
  EmptyState,
  IconButton,
  LoadingState,
  LogoMark,
  PrimaryButton,
  ProductCard,
  SectionTitle,
  StatCard,
} from "@/components/ui";
import { Colors, Radius, Spacing } from "@/constants/theme";
import { useTranslation } from "@/i18n";
import { useProductStore } from "@/store/product-store";

export default function HomeScreen() {
  const products = useProductStore((state) => state.products);
  const isHydrated = useProductStore((state) => state.isHydrated);
  const { t } = useTranslation();

  if (!isHydrated) {
    return <LoadingState />;
  }

  const buyAgainCount = products.filter(
    (product) => product.rating === "buy_again",
  ).length;
  const neverAgainCount = products.filter(
    (product) => product.rating === "never_again",
  ).length;

  return (
    <SafeAreaView edges={["top"]} style={styles.root}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.content}>
          <AppHeader
            title=""
            action={
              <View style={styles.homeHeader}>
                <LogoMark />
                <IconButton
                  label={t("home.list_label")}
                  glyph="☷"
                  onPress={() => router.push("/products")}
                />
                <IconButton
                  label={t("home.settings_label")}
                  glyph="⚙"
                  onPress={() => router.push("/settings")}
                />
              </View>
            }
          />

          <View style={styles.intro}>
            <Text style={styles.kicker}>{t("home.kicker")}</Text>
            <Text style={styles.title}>{t("home.title")}</Text>
            <Text style={styles.subtitle}>{t("home.subtitle")}</Text>
          </View>

          <Pressable
            onPress={() => router.push("/scan")}
            accessibilityRole="button"
            style={({ pressed }) => [
              styles.scanCard,
              pressed && styles.scanPressed,
            ]}
          >
            <View style={styles.scanCardCopy}>
              <Text style={styles.scanEyebrow}>{t("home.quick_check")}</Text>
              <Text style={styles.scanTitle}>{t("home.scan")}</Text>
              <Text style={styles.scanDescription}>
                {t("home.scan_description")}
              </Text>
            </View>
            <View style={styles.scanIcon}>
              <Text style={styles.scanGlyph}>⌕</Text>
            </View>
          </Pressable>

          <View style={styles.manualAction}>
            <PrimaryButton
              label={t("home.manual_add")}
              glyph="＋"
              onPress={() => router.push("/add")}
            />
          </View>

          <View style={styles.statsRow}>
            <StatCard
              value={buyAgainCount}
              label={t("home.buy_again_count")}
              color={Colors.forestSoft}
              glyph="↻"
            />
            <StatCard
              value={neverAgainCount}
              label={t("home.never_again_count")}
              color={Colors.coralSoft}
              glyph="×"
            />
          </View>

          <View style={styles.recentSection}>
            <SectionTitle
              title={t("home.recent")}
              action={
                products.length > 0 ? (
                  <Pressable onPress={() => router.push("/products")}>
                    <Text style={styles.linkText}>{t("home.view_all")}</Text>
                  </Pressable>
                ) : null
              }
            />
            {products.length === 0 ? (
              <EmptyState
                title={t("home.empty_title")}
                description={t("home.empty_description")}
                action={
                  <PrimaryButton
                    label={t("home.first_add")}
                    glyph="＋"
                    onPress={() => router.push("/add")}
                  />
                }
              />
            ) : (
              <View style={styles.productList}>
                {products.slice(0, 3).map((product) => (
                  <ProductCard key={product.id} product={product} compact />
                ))}
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  content: {
    width: "100%",
    maxWidth: 920,
    alignSelf: "center",
    paddingHorizontal: Spacing.xl,
    paddingBottom: 104,
  },
  scrollContent: { paddingBottom: 24 },
  homeHeader: { flexDirection: "row", alignItems: "center", gap: 18 },
  intro: { paddingTop: 8, paddingBottom: 24, gap: 10 },
  kicker: {
    color: Colors.coral,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.25,
  },
  title: {
    color: Colors.ink,
    fontSize: 38,
    lineHeight: 44,
    fontWeight: "800",
    letterSpacing: -1.7,
  },
  subtitle: {
    color: Colors.muted,
    fontSize: 15,
    lineHeight: 23,
    fontWeight: "500",
  },
  scanCard: {
    minHeight: 154,
    borderRadius: Radius.lg,
    backgroundColor: Colors.forest,
    padding: 22,
    flexDirection: "row",
    alignItems: "center",
    overflow: "hidden",
  },
  scanPressed: { opacity: 0.9, transform: [{ scale: 0.99 }] },
  scanCardCopy: { flex: 1, gap: 8 },
  scanEyebrow: {
    color: "#A8C6B2",
    fontSize: 10,
    letterSpacing: 1.4,
    fontWeight: "800",
  },
  scanTitle: {
    color: Colors.white,
    fontSize: 21,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  scanDescription: {
    color: "#C5D7CB",
    fontSize: 13,
    lineHeight: 19,
    maxWidth: 205,
  },
  scanIcon: {
    width: 72,
    height: 72,
    borderRadius: 28,
    backgroundColor: "#3D6A58",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 12,
  },
  scanGlyph: {
    color: Colors.white,
    fontSize: 45,
    fontWeight: "200",
    lineHeight: 55,
  },
  manualAction: { marginTop: 12 },
  statsRow: { flexDirection: "row", gap: 12, marginTop: 20 },
  recentSection: { marginTop: 30 },
  productList: { gap: 10 },
  linkText: { color: Colors.forest, fontSize: 13, fontWeight: "800" },
});
