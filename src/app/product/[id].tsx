import { Image } from "expo-image";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import {
  ErrorText,
  IconButton,
  LoadingState,
  RatingBadge,
  SecondaryButton,
} from "@/components/ui";
import { Colors, Radius, Spacing } from "@/constants/theme";
import { getRatingOption, type Product } from "@/domain/product";
import { useProductStore } from "@/store/product-store";
import { useProductDatabase } from "@/providers/database-provider";
import { SafeAreaView } from "react-native-safe-area-context";
import { deleteImageUri } from "@/services/image-storage";

export default function ProductDetailScreen() {
  const db = useProductDatabase();
  const { id } = useLocalSearchParams<{ id: string }>();
  const products = useProductStore((state) => state.products);
  const getById = useProductStore((state) => state.getById);
  const remove = useProductStore((state) => state.remove);
  const storedProduct = products.find((item) => item.id === Number(id)) ?? null;
  const [loadedProduct, setLoadedProduct] = useState<Product | null>(null);
  const [lookupFinished, setLookupFinished] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const product = storedProduct ?? loadedProduct;
  const isValidId = typeof id === "string" && !Number.isNaN(Number(id));
  const isLoading = isValidId && product === null && !lookupFinished;

  useEffect(() => {
    const productId = Number(id);
    if (Number.isNaN(productId) || storedProduct) {
      return;
    }
    void getById(db, productId)
      .then((loadedProduct) => {
        setLoadedProduct(loadedProduct);
        setLookupFinished(true);
      })
      .catch(() => {
        setLookupError("商品を読み込めませんでした。");
        setLookupFinished(true);
      });
  }, [db, getById, id, storedProduct]);

  if (isLoading) {
    return <LoadingState />;
  }

  if (!product) {
    return (
      <SafeAreaView edges={["top", "bottom"]} style={styles.root}>
        <View style={styles.notFound}>
          <Text style={styles.notFoundTitle}>
            {lookupError ?? "商品が見つかりません"}
          </Text>
          <SecondaryButton
            label="商品一覧へ戻る"
            onPress={() => router.replace("/products")}
          />
        </View>
      </SafeAreaView>
    );
  }

  const option = getRatingOption(product.rating);
  const isPositive = product.rating === "buy_again";
  const isAvoid = product.rating === "never_again";

  const handleDelete = () => {
    Alert.alert("この商品を削除しますか？", "削除した記録は元に戻せません。", [
      { text: "キャンセル", style: "cancel" },
      {
        text: "削除する",
        style: "destructive",
        onPress: () =>
          void remove(db, product.id)
            .then(() => deleteImageUri(product.imageUri).catch(() => undefined))
            .then(() => router.replace("/products"))
            .catch(() => setDeleteError("商品を削除できませんでした。")),
      },
    ]);
  };

  return (
    <SafeAreaView edges={["top", "bottom"]} style={styles.root}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topBar}>
          <IconButton
            label="前の画面に戻る"
            glyph="‹"
            onPress={() => router.back()}
          />
          <Text style={styles.topBarTitle}>商品詳細</Text>
          <IconButton
            label="商品を編集する"
            glyph="✎"
            onPress={() => router.push(`/product/edit/${product.id}`)}
          />
        </View>

        <View style={styles.productHero}>
          {product.imageUri ? (
            <Image
              source={{ uri: product.imageUri }}
              contentFit="cover"
              style={styles.productImage}
            />
          ) : (
            <View
              style={[
                styles.productImage,
                styles.imagePlaceholder,
                { backgroundColor: option.backgroundColor },
              ]}
            >
              <Text style={[styles.imageInitial, { color: option.color }]}>
                {product.name.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
          <Text style={styles.productName}>{product.name}</Text>
          {product.brand ? (
            <Text style={styles.brand}>{product.brand}</Text>
          ) : null}
          {product.barcode ? (
            <Text style={styles.barcode}>{product.barcode}</Text>
          ) : null}
        </View>

        <View
          style={[
            styles.outcomeCard,
            { backgroundColor: option.backgroundColor },
          ]}
        >
          <Text style={[styles.outcomeEyebrow, { color: option.color }]}>
            {isPositive
              ? "次に買うなら"
              : isAvoid
                ? "次は避ける"
                : "いまの評価"}
          </Text>
          <Text style={[styles.outcomeText, { color: option.color }]}>
            {option.label}
          </Text>
          <RatingBadge rating={product.rating} large />
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoLabel}>メモ</Text>
          <Text style={[styles.note, !product.note && styles.mutedNote]}>
            {product.note || "メモはまだありません。"}
          </Text>
        </View>

        <View style={styles.metaRow}>
          <View>
            <Text style={styles.metaLabel}>登録日</Text>
            <Text style={styles.metaValue}>
              {formatDate(product.createdAt)}
            </Text>
          </View>
          <View>
            <Text style={styles.metaLabel}>更新日</Text>
            <Text style={styles.metaValue}>
              {formatDate(product.updatedAt)}
            </Text>
          </View>
        </View>

        <View style={styles.actions}>
          <ErrorText message={deleteError} />
          <Pressable
            onPress={() => router.push(`/product/edit/${product.id}`)}
            style={({ pressed }) => [
              styles.editButton,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.editButtonText}>この記録を編集する</Text>
            <Text style={styles.editGlyph}>✎</Text>
          </Pressable>
          <SecondaryButton
            label="この商品を削除"
            danger
            glyph="×"
            onPress={handleDelete}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  content: {
    width: "100%",
    maxWidth: 720,
    alignSelf: "center",
    paddingHorizontal: Spacing.xl,
    paddingBottom: 44,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: Spacing.lg,
    paddingBottom: 26,
  },
  topBarTitle: { color: Colors.ink, fontSize: 15, fontWeight: "800" },
  productHero: { alignItems: "center", gap: 10, paddingBottom: 24 },
  productImage: { width: 142, height: 142, borderRadius: 42 },
  imagePlaceholder: { alignItems: "center", justifyContent: "center" },
  imageInitial: { fontSize: 52, fontWeight: "800" },
  productName: {
    color: Colors.ink,
    fontSize: 28,
    fontWeight: "800",
    textAlign: "center",
    letterSpacing: -0.8,
  },
  brand: { color: Colors.muted, fontSize: 14, fontWeight: "600" },
  barcode: {
    color: Colors.muted,
    fontSize: 12,
    fontVariant: ["tabular-nums"],
    letterSpacing: 0.5,
  },
  outcomeCard: {
    borderRadius: Radius.lg,
    padding: 20,
    gap: 9,
    marginBottom: 14,
  },
  outcomeEyebrow: { fontSize: 12, fontWeight: "800", letterSpacing: 1 },
  outcomeText: { fontSize: 31, fontWeight: "800", letterSpacing: -1 },
  infoCard: {
    borderRadius: Radius.md,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 18,
    gap: 10,
  },
  infoLabel: {
    color: Colors.muted,
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.6,
  },
  note: { color: Colors.ink, fontSize: 16, lineHeight: 24 },
  mutedNote: { color: Colors.muted },
  metaRow: {
    flexDirection: "row",
    gap: 40,
    paddingVertical: 20,
    paddingHorizontal: 2,
  },
  metaLabel: {
    color: Colors.muted,
    fontSize: 11,
    fontWeight: "700",
    marginBottom: 4,
  },
  metaValue: { color: Colors.ink, fontSize: 13, fontWeight: "700" },
  actions: { gap: 10, marginTop: 4 },
  editButton: {
    minHeight: 56,
    borderRadius: Radius.md,
    backgroundColor: Colors.forest,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 10,
  },
  editButtonText: { color: Colors.white, fontSize: 15, fontWeight: "800" },
  editGlyph: { color: Colors.white, fontSize: 18 },
  pressed: { opacity: 0.7 },
  notFound: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: "center",
    justifyContent: "center",
    gap: 18,
    padding: 24,
  },
  notFoundTitle: { color: Colors.ink, fontSize: 18, fontWeight: "800" },
});
