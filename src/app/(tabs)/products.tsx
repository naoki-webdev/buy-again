import { router, useIsFocused } from "expo-router";
import { useEffect, useState } from "react";
import {
  AccessibilityInfo,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  AppHeader,
  EmptyState,
  FlashMessageBanner,
  IconButton,
  ProductCard,
} from "@/components/ui";
import { Colors, Radius, Spacing } from "@/constants/theme";
import { filterProducts, RATING_OPTIONS, type Rating } from "@/domain/product";
import { useTranslation } from "@/i18n";
import { useProductStore } from "@/store/product-store";

export default function ProductsScreen() {
  const products = useProductStore((state) => state.products);
  const flashMessage = useProductStore((state) => state.flashMessage);
  const clearFlash = useProductStore((state) => state.clearFlash);
  const { t } = useTranslation();
  const isFocused = useIsFocused();
  const [query, setQuery] = useState("");
  const [rating, setRating] = useState<Rating | "all">("all");
  const filtered = filterProducts(products, query, rating);

  useEffect(() => {
    if (isFocused && flashMessage) {
      AccessibilityInfo.announceForAccessibility(flashMessage.message);
    }

    if (!isFocused || !flashMessage) {
      return;
    }

    const timeoutId = setTimeout(clearFlash, 2500);
    return () => clearTimeout(timeoutId);
  }, [clearFlash, flashMessage, isFocused]);

  return (
    <SafeAreaView edges={["top"]} style={styles.root}>
      <View style={styles.content}>
        <AppHeader
          eyebrow={t(
            products.length === 1
              ? "products.item_count_one"
              : "products.item_count_other",
            { count: products.length },
          )}
          title={t("products.title")}
          action={
            <IconButton
              label={t("products.add_label")}
              glyph="＋"
              onPress={() => router.push("/add")}
            />
          }
        />
        {flashMessage ? (
          <FlashMessageBanner
            type={flashMessage.type}
            message={flashMessage.message}
          />
        ) : null}
        <View style={styles.searchBox}>
          <Text style={styles.searchGlyph}>⌕</Text>
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder={t("products.search_placeholder")}
            placeholderTextColor={Colors.muted}
            style={styles.searchInput}
            returnKeyType="search"
            accessibilityLabel={t("products.search_placeholder")}
          />
          {query ? (
            <Pressable
              onPress={() => setQuery("")}
              accessibilityRole="button"
              accessibilityLabel={t("products.clear_search")}
              hitSlop={8}
            >
              <Text style={styles.clearText}>×</Text>
            </Pressable>
          ) : null}
        </View>
        <ScrollView
          horizontal
          style={styles.filterScroll}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
        >
          <FilterChip
            label={t("products.all")}
            selected={rating === "all"}
            showDot={false}
            onPress={() => setRating("all")}
          />
          {RATING_OPTIONS.map((option) => (
            <FilterChip
              key={option.value}
              label={t(option.shortLabelKey)}
              selected={rating === option.value}
              color={option.color}
              onPress={() => setRating(option.value)}
            />
          ))}
        </ScrollView>
        <Text style={styles.resultCount}>
          {t(
            filtered.length === 1
              ? "products.result_count_one"
              : "products.result_count_other",
            { count: filtered.length },
          )}
        </Text>
        <ScrollView
          style={styles.listScroll}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.list}
        >
          {filtered.length > 0 ? (
            filtered.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))
          ) : products.length === 0 ? (
            <EmptyState
              title={t("products.empty_title")}
              description={t("products.empty_description")}
              action={
                <Pressable
                  style={styles.emptyButton}
                  onPress={() => router.push("/add")}
                  accessibilityRole="button"
                  accessibilityLabel={t("products.add_label")}
                >
                  <Text style={styles.emptyButtonText}>
                    {t("products.add_label")} ＋
                  </Text>
                </Pressable>
              }
            />
          ) : (
            <EmptyState
              title={t("products.no_results_title")}
              description={t("products.no_results_description")}
            />
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

function FilterChip({
  label,
  selected,
  showDot = true,
  color = Colors.forest,
  onPress,
}: {
  label: string;
  selected: boolean;
  showDot?: boolean;
  color?: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected }}
      style={({ pressed }) => [
        styles.filterChip,
        selected && { backgroundColor: color, borderColor: color },
        pressed && styles.pressed,
      ]}
    >
      {showDot ? (
        <View
          style={[styles.chipDotSlot, selected && styles.chipDotSlotVisible]}
        >
          <View style={[styles.chipDot, { backgroundColor: Colors.white }]} />
        </View>
      ) : null}
      <Text style={[styles.filterText, selected && styles.selectedFilterText]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  content: {
    flex: 1,
    width: "100%",
    maxWidth: 920,
    alignSelf: "center",
    paddingHorizontal: Spacing.xl,
    paddingBottom: 94,
  },
  searchBox: {
    minHeight: 52,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.sm,
    backgroundColor: Colors.surface,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    gap: 10,
  },
  searchGlyph: { color: Colors.forest, fontSize: 23, lineHeight: 25 },
  searchInput: { flex: 1, color: Colors.ink, fontSize: 15, minHeight: 50 },
  clearText: { color: Colors.muted, fontSize: 22, paddingHorizontal: 2 },
  filterScroll: { flexGrow: 0 },
  filterRow: { gap: 8, paddingVertical: 16 },
  filterChip: {
    minHeight: 44,
    minWidth: 72,
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    paddingHorizontal: 13,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flexShrink: 0,
  },
  chipDotSlot: { width: 6, height: 6, opacity: 0 },
  chipDotSlotVisible: { opacity: 1 },
  chipDot: { width: 6, height: 6, borderRadius: 3 },
  filterText: { color: Colors.muted, fontSize: 12, fontWeight: "700" },
  selectedFilterText: { color: Colors.white },
  pressed: { opacity: 0.7 },
  resultCount: {
    color: Colors.muted,
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 10,
  },
  listScroll: { flex: 1 },
  list: { gap: 10, paddingBottom: 30 },
  emptyButton: {
    minHeight: 48,
    borderRadius: Radius.md,
    backgroundColor: Colors.forest,
    justifyContent: "center",
    paddingHorizontal: 18,
  },
  emptyButtonText: { color: Colors.white, fontSize: 14, fontWeight: "800" },
});
