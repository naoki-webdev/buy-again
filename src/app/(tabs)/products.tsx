import { router } from "expo-router";
import { useState } from "react";
import {
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
  IconButton,
  ProductCard,
} from "@/components/ui";
import { Colors, Radius, Spacing } from "@/constants/theme";
import { filterProducts, RATING_OPTIONS, type Rating } from "@/domain/product";
import { useProductStore } from "@/store/product-store";

export default function ProductsScreen() {
  const products = useProductStore((state) => state.products);
  const [query, setQuery] = useState("");
  const [rating, setRating] = useState<Rating | "all">("all");
  const filtered = filterProducts(products, query, rating);

  return (
    <SafeAreaView edges={["top"]} style={styles.root}>
      <View style={styles.content}>
        <AppHeader
          eyebrow={`${products.length} ITEMS`}
          title="商品一覧"
          action={
            <IconButton
              label="商品を登録する"
              glyph="＋"
              onPress={() => router.push("/add")}
            />
          }
        />
        <View style={styles.searchBox}>
          <Text style={styles.searchGlyph}>⌕</Text>
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="商品名で検索"
            placeholderTextColor={Colors.muted}
            style={styles.searchInput}
            returnKeyType="search"
          />
          {query ? (
            <Pressable
              onPress={() => setQuery("")}
              accessibilityLabel="検索をクリア"
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
            label="すべて"
            selected={rating === "all"}
            onPress={() => setRating("all")}
          />
          {RATING_OPTIONS.map((option) => (
            <FilterChip
              key={option.value}
              label={option.shortLabel}
              selected={rating === option.value}
              color={option.color}
              onPress={() => setRating(option.value)}
            />
          ))}
        </ScrollView>
        <Text style={styles.resultCount}>{filtered.length}件の記録</Text>
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
              title="最初の商品を登録しましょう"
              description="バーコードをスキャンするか、商品名を手入力して記録できます。"
              action={
                <Pressable
                  style={styles.emptyButton}
                  onPress={() => router.push("/add")}
                >
                  <Text style={styles.emptyButtonText}>商品を登録する ＋</Text>
                </Pressable>
              }
            />
          ) : (
            <EmptyState
              title="見つかりませんでした"
              description="検索語や評価フィルターを変えて試してください。"
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
  color = Colors.forest,
  onPress,
}: {
  label: string;
  selected: boolean;
  color?: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.filterChip,
        selected && { backgroundColor: color, borderColor: color },
        pressed && styles.pressed,
      ]}
    >
      {selected && label !== "すべて" ? (
        <View style={[styles.chipDot, { backgroundColor: Colors.white }]} />
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
    height: 36,
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    paddingHorizontal: 13,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
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
