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
import { useProductStore } from "@/store/product-store";

export default function HomeScreen() {
  const products = useProductStore((state) => state.products);
  const isHydrated = useProductStore((state) => state.isHydrated);

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
                  label="商品一覧を開く"
                  glyph="☷"
                  onPress={() => router.push("/products")}
                />
              </View>
            }
          />

          <View style={styles.intro}>
            <Text style={styles.kicker}>YOUR TASTE, REMEMBERED</Text>
            <Text style={styles.title}>もう迷わない、{"\n"}買い物メモ。</Text>
            <Text style={styles.subtitle}>
              買ってよかったものも、{"\n"}もう買わないものも、次の買い物へ。
            </Text>
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
              <Text style={styles.scanEyebrow}>QUICK CHECK</Text>
              <Text style={styles.scanTitle}>バーコードをスキャン</Text>
              <Text style={styles.scanDescription}>
                登録済みなら、評価とメモをすぐ確認。
              </Text>
            </View>
            <View style={styles.scanIcon}>
              <Text style={styles.scanGlyph}>⌕</Text>
            </View>
          </Pressable>

          <View style={styles.manualAction}>
            <PrimaryButton
              label="商品を手動登録"
              glyph="＋"
              onPress={() => router.push("/add")}
            />
          </View>

          <View style={styles.statsRow}>
            <StatCard
              value={buyAgainCount}
              label="また買う"
              color={Colors.forestSoft}
              glyph="↻"
            />
            <StatCard
              value={neverAgainCount}
              label="二度と買わない"
              color={Colors.coralSoft}
              glyph="×"
            />
          </View>

          <View style={styles.recentSection}>
            <SectionTitle
              title="最近登録した商品"
              action={
                products.length > 0 ? (
                  <Pressable onPress={() => router.push("/products")}>
                    <Text style={styles.linkText}>すべて見る ›</Text>
                  </Pressable>
                ) : null
              }
            />
            {products.length === 0 ? (
              <EmptyState
                title="まだ商品がありません"
                description="まずは、最近買ったものをひとつ記録してみましょう。"
                action={
                  <PrimaryButton
                    label="最初の商品を登録"
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
