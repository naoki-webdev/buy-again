import { Image } from "expo-image";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, View } from "react-native";

import {
  ErrorText,
  IconButton,
  LoadingState,
  RatingBadge,
  SecondaryButton,
} from "@/components/ui";
import { Colors, Radius, Spacing } from "@/constants/theme";
import { getRatingOption, type Product } from "@/domain/product";
import { useTranslation } from "@/i18n";
import { useProductDatabase } from "@/providers/database-provider";
import { deleteImageUri } from "@/services/image-storage";
import { useProductStore } from "@/store/product-store";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ProductDetailScreen() {
  const db = useProductDatabase();
  const { language, t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const products = useProductStore((state) => state.products);
  const getById = useProductStore((state) => state.getById);
  const remove = useProductStore((state) => state.remove);
  const showFlash = useProductStore((state) => state.showFlash);
  const storedProduct = products.find((item) => item.id === Number(id)) ?? null;
  const [loadedProduct, setLoadedProduct] = useState<Product | null>(null);
  const [lookupFinished, setLookupFinished] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const product = storedProduct ?? loadedProduct;
  const parsedId = typeof id === "string" ? Number(id) : Number.NaN;
  const isValidId = Number.isInteger(parsedId) && parsedId > 0;
  const isLoading = isValidId && product === null && !lookupFinished;

  useEffect(() => {
    if (!isValidId || storedProduct) {
      return;
    }
    const productId = parsedId;
    let isActive = true;
    void getById(db, productId)
      .then((loadedProduct) => {
        if (!isActive) {
          return;
        }
        setLoadedProduct(loadedProduct);
        setLookupFinished(true);
      })
      .catch(() => {
        if (!isActive) {
          return;
        }
        setLookupError(t("detail.load_failed"));
        setLookupFinished(true);
      });

    return () => {
      isActive = false;
    };
  }, [db, getById, isValidId, parsedId, storedProduct, t]);

  if (isLoading) {
    return <LoadingState />;
  }

  if (!product) {
    return (
      <SafeAreaView edges={["top", "bottom"]} style={styles.root}>
        <View style={styles.notFound}>
          <Text style={styles.notFoundTitle}>
            {lookupError ?? t("detail.not_found")}
          </Text>
          <SecondaryButton
            label={t("detail.back_to_products")}
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
    Alert.alert(t("detail.delete_title"), t("detail.delete_description"), [
      { text: t("common.cancel"), style: "cancel" },
      {
        text: t("common.delete"),
        style: "destructive",
        onPress: () =>
          void remove(db, product.id)
            .then(() => deleteImageUri(product.imageUri).catch(() => undefined))
            .then(() => {
              showFlash({
                type: "success",
                message: t("messages.product_deleted"),
              });
              router.replace("/products");
            })
            .catch(() => setDeleteError(t("detail.delete_failed"))),
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
            label={t("common.back")}
            glyph="‹"
            onPress={() => router.back()}
          />
          <Text style={styles.topBarTitle}>{t("detail.title")}</Text>
          <IconButton
            label={t("detail.edit_label")}
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
              ? t("detail.next_buy")
              : isAvoid
                ? t("detail.avoid_next")
                : t("detail.current_rating")}
          </Text>
          <RatingBadge rating={product.rating} large />
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoLabel}>{t("detail.note_label")}</Text>
          <Text style={[styles.note, !product.note && styles.mutedNote]}>
            {product.note || t("detail.no_note")}
          </Text>
        </View>

        <View style={styles.metaRow}>
          <View>
            <Text style={styles.metaLabel}>{t("detail.registered_at")}</Text>
            <Text style={styles.metaValue}>
              {formatDate(product.createdAt, language)}
            </Text>
          </View>
          {product.updatedAt !== product.createdAt ? (
            <View>
              <Text style={styles.metaLabel}>{t("detail.updated_at")}</Text>
              <Text style={styles.metaValue}>
                {formatDate(product.updatedAt, language)}
              </Text>
            </View>
          ) : null}
        </View>

        <View style={styles.actions}>
          <ErrorText message={deleteError} />
          <SecondaryButton
            label={t("detail.delete_product")}
            danger
            glyph="×"
            onPress={handleDelete}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function formatDate(value: string, language: "ja" | "en"): string {
  return new Intl.DateTimeFormat(language === "ja" ? "ja-JP" : "en-US", {
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
  productImage: { width: 142, height: 142, borderRadius: 18 },
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
