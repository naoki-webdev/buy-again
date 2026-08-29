import * as ImagePicker from "expo-image-picker";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Image } from "expo-image";
import {
  KeyboardAvoidingView,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  ErrorText,
  Field,
  IconButton,
  PrimaryButton,
  RatingPicker,
  SecondaryButton,
} from "@/components/ui";
import { Colors, Radius, Spacing } from "@/constants/theme";
import {
  createEmptyDraft,
  validateProductDraft,
  type Product,
  type ProductDraft,
} from "@/domain/product";
import { getLocalizedErrorMessage, useTranslation } from "@/i18n";
import { useProductStore } from "@/store/product-store";
import { useProductDatabase } from "@/providers/database-provider";
import { deleteImageUri, persistImageUri } from "@/services/image-storage";

type ProductFormProps = {
  mode: "create" | "edit";
};

type ProductFormParams = {
  id?: string;
  barcode?: string;
  name?: string;
  brand?: string;
  imageUri?: string;
  source?: string;
};

export function ProductFormScreen({ mode }: ProductFormProps) {
  const db = useProductDatabase();
  const { t } = useTranslation();
  const params = useLocalSearchParams<ProductFormParams>();
  const products = useProductStore((state) => state.products);
  const add = useProductStore((state) => state.add);
  const update = useProductStore((state) => state.update);
  const getById = useProductStore((state) => state.getById);
  const productId = typeof params.id === "string" ? Number(params.id) : null;
  const initialProduct = products.find((product) => product.id === productId);
  const [loadedProduct, setLoadedProduct] = useState<Product | null>(null);
  const sourceProduct = initialProduct ?? loadedProduct;
  const originalImageUri = sourceProduct?.imageUri ?? null;
  const barcodeParam = getParamString(params.barcode);
  const nameParam = getParamString(params.name);
  const brandParam = getParamString(params.brand);
  const imageUriParam = getParamString(params.imageUri);
  const isAutoFilled =
    mode === "create" && getParamString(params.source) === "open-food-facts";
  const [draft, setDraft] = useState<ProductDraft>(() =>
    initialProduct
      ? {
          name: initialProduct.name,
          brand: initialProduct.brand,
          barcode: initialProduct.barcode ?? "",
          imageUri: initialProduct.imageUri,
          rating: initialProduct.rating,
          note: initialProduct.note,
        }
      : {
          ...createEmptyDraft(barcodeParam),
          name: nameParam,
          brand: brandParam,
          imageUri: imageUriParam || null,
        },
  );
  const [isLoading, setIsLoading] = useState(
    mode === "edit" && !initialProduct,
  );
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [photoPermissionBlocked, setPhotoPermissionBlocked] = useState(false);
  const saveInProgress = useRef(false);

  useEffect(() => {
    if (mode === "create" || initialProduct) {
      return;
    }

    if (productId === null || Number.isNaN(productId)) {
      return;
    }

    void getById(db, productId)
      .then((existingProduct) => {
        if (existingProduct) {
          setLoadedProduct(existingProduct);
          setDraft({
            name: existingProduct.name,
            brand: existingProduct.brand,
            barcode: existingProduct.barcode ?? "",
            imageUri: existingProduct.imageUri,
            rating: existingProduct.rating,
            note: existingProduct.note,
          });
        } else {
          setError(t("errors.product_not_found"));
        }
        setIsLoading(false);
      })
      .catch(() => {
        setError(t("errors.product_load_failed"));
        setIsLoading(false);
      });
  }, [db, getById, initialProduct, mode, productId, t]);

  const updateDraft = (changes: Partial<ProductDraft>) =>
    setDraft((current) => ({ ...current, ...changes }));

  const pickImage = async () => {
    try {
      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        setPhotoPermissionBlocked(!permission.canAskAgain);
        setError(t("errors.photo_permission"));
        return;
      }
      setPhotoPermissionBlocked(false);
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      if (!result.canceled) {
        const uri = result.assets[0]?.uri;
        if (uri) {
          updateDraft({ imageUri: uri });
        }
      }
    } catch {
      setError(t("errors.photo_select_failed"));
    }
  };

  const save = async () => {
    if (saveInProgress.current) {
      return;
    }
    const validationError = validateProductDraft(draft);
    if (validationError) {
      setError(t(`errors.${validationError}`));
      return;
    }
    if (mode === "edit" && productId === null) {
      setError(t("errors.product_not_found"));
      return;
    }

    saveInProgress.current = true;
    setIsSaving(true);
    setError(null);
    let newlyPersistedImageUri: string | null = null;
    let databaseSaveCompleted = false;
    try {
      const imageUri =
        draft.imageUri && draft.imageUri !== originalImageUri
          ? await persistImageUri(draft.imageUri)
          : draft.imageUri;
      newlyPersistedImageUri =
        imageUri && imageUri !== draft.imageUri ? imageUri : null;
      const draftToSave = { ...draft, imageUri };
      const saved =
        mode === "create"
          ? await add(db, draftToSave)
          : await update(db, productId as number, draftToSave);
      databaseSaveCompleted = true;
      if (newlyPersistedImageUri && originalImageUri) {
        await deleteImageUri(originalImageUri).catch(() => undefined);
      }
      router.replace(`/product/${saved.id}`);
    } catch (saveError) {
      if (newlyPersistedImageUri && !databaseSaveCompleted) {
        await deleteImageUri(newlyPersistedImageUri).catch(() => undefined);
      }
      setError(getLocalizedErrorMessage(saveError, t, "errors.save_failed"));
    } finally {
      saveInProgress.current = false;
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loading}>
        <Text style={styles.loadingText}>{t("form.loading")}</Text>
      </View>
    );
  }

  return (
    <SafeAreaView edges={["top", "bottom"]} style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.root}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.topBar}>
            <IconButton
              label={t("common.back")}
              glyph="‹"
              onPress={() => router.back()}
            />
            <Text style={styles.topBarTitle}>
              {mode === "create"
                ? t("form.create_title")
                : t("form.edit_title")}
            </Text>
            <View style={styles.topBarSpacer} />
          </View>

          <View style={styles.formIntro}>
            <Text style={styles.kicker}>
              {mode === "create"
                ? t("form.create_kicker")
                : t("form.edit_kicker")}
            </Text>
            <Text style={styles.title}>
              {mode === "create"
                ? t("form.create_heading")
                : t("form.edit_heading")}
            </Text>
            <Text style={styles.description}>
              {mode === "create"
                ? t("form.create_description")
                : t("form.edit_description")}
            </Text>
          </View>

          {isAutoFilled ? (
            <View style={styles.autoFillNotice}>
              <Text style={styles.autoFillTitle}>
                {t("form.auto_fill_title")}
              </Text>
              <Text style={styles.autoFillDescription}>
                {t("form.auto_fill_description")}
              </Text>
            </View>
          ) : null}

          <View style={styles.photoSection}>
            {draft.imageUri ? (
              <Image
                source={{ uri: draft.imageUri }}
                contentFit="cover"
                style={styles.photoPreview}
              />
            ) : (
              <View style={styles.photoPlaceholder}>
                <Text style={styles.photoGlyph}>▧</Text>
                <Text style={styles.photoPlaceholderText}>
                  {t("common.no_image")}
                </Text>
              </View>
            )}
            <SecondaryButton
              label={
                draft.imageUri ? t("form.image_change") : t("form.image_add")
              }
              glyph="▧"
              onPress={() => void pickImage()}
            />
          </View>

          <View style={styles.formFields}>
            <Field
              label={t("form.product_name")}
              placeholder={t("form.product_name_placeholder")}
              value={draft.name}
              onChangeText={(name) => updateDraft({ name })}
              autoFocus={mode === "create" && !isAutoFilled}
            />
            <Field
              label={t("form.barcode")}
              hint={t("common.optional")}
              placeholder={t("form.barcode_placeholder")}
              value={draft.barcode}
              onChangeText={(barcode) => updateDraft({ barcode })}
              keyboardType="number-pad"
            />
            <Field
              label={t("form.brand")}
              hint={t("common.optional")}
              placeholder={t("form.brand_placeholder")}
              value={draft.brand}
              onChangeText={(brand) => updateDraft({ brand })}
            />
            <View style={styles.ratingSection}>
              <Text style={styles.fieldLabel}>{t("form.rating")}</Text>
              <RatingPicker
                value={draft.rating}
                onChange={(rating) => updateDraft({ rating })}
              />
            </View>
            <Field
              label={t("form.note")}
              hint={t("common.optional")}
              placeholder={t("form.note_placeholder")}
              value={draft.note}
              onChangeText={(note) => updateDraft({ note })}
              multiline
            />
          </View>

          <ErrorText message={error} />
          {photoPermissionBlocked ? (
            <SecondaryButton
              label={t("form.photo_settings")}
              onPress={() => void Linking.openSettings()}
            />
          ) : null}
          <View style={styles.actions}>
            <PrimaryButton
              label={
                isSaving
                  ? t("form.saving")
                  : mode === "create"
                    ? t("form.register")
                    : t("form.save_changes")
              }
              onPress={() => void save()}
              disabled={isSaving}
            />
            <SecondaryButton
              label={t("common.cancel")}
              onPress={() => router.back()}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.background },
  root: { flex: 1, backgroundColor: Colors.background },
  content: {
    width: "100%",
    maxWidth: 720,
    alignSelf: "center",
    paddingHorizontal: Spacing.xl,
    paddingBottom: 42,
  },
  loading: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: { color: Colors.muted, fontSize: 14 },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  topBarTitle: { color: Colors.ink, fontSize: 15, fontWeight: "800" },
  topBarSpacer: { width: 42 },
  formIntro: { gap: 9, paddingBottom: 22 },
  kicker: {
    color: Colors.coral,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.2,
  },
  title: {
    color: Colors.ink,
    fontSize: 30,
    fontWeight: "800",
    letterSpacing: -1,
  },
  description: { color: Colors.muted, fontSize: 14, lineHeight: 21 },
  photoSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginBottom: 28,
  },
  photoPreview: { width: 92, height: 92, borderRadius: Radius.md },
  photoPlaceholder: {
    width: 92,
    height: 92,
    borderRadius: Radius.md,
    backgroundColor: Colors.forestSoft,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  photoGlyph: { color: Colors.forest, fontSize: 27 },
  photoPlaceholderText: {
    color: Colors.forest,
    fontSize: 11,
    fontWeight: "700",
  },
  formFields: { gap: 22 },
  fieldLabel: {
    color: Colors.ink,
    fontSize: 14,
    fontWeight: "800",
    marginBottom: 9,
  },
  ratingSection: { gap: 0 },
  actions: { gap: 10, marginTop: 26 },
  autoFillNotice: {
    borderRadius: Radius.md,
    backgroundColor: Colors.forestSoft,
    padding: 14,
    gap: 5,
    marginBottom: 22,
  },
  autoFillTitle: { color: Colors.forest, fontSize: 14, fontWeight: "800" },
  autoFillDescription: { color: Colors.muted, fontSize: 12, lineHeight: 18 },
});

function getParamString(value: string | string[] | undefined): string {
  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
}
