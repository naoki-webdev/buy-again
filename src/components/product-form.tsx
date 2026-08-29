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
  MAX_BRAND_LENGTH,
  MAX_NOTE_LENGTH,
  MAX_PRODUCT_NAME_LENGTH,
  validateProductDraft,
  type Product,
  type ProductDraft,
} from "@/domain/product";
import { getLocalizedErrorMessage, useTranslation } from "@/i18n";
import { useProductStore } from "@/store/product-store";
import { useProductDatabase } from "@/providers/database-provider";
import { deleteImageUri, persistImageUri } from "@/services/image-storage";
import { lookupOpenFoodFactsProduct } from "@/services/open-food-facts";

type ProductFormProps = {
  mode: "create" | "edit";
};

type ProductFormParams = {
  id?: string;
  barcode?: string;
  lookup?: string;
};

export function ProductFormScreen({ mode }: ProductFormProps) {
  const db = useProductDatabase();
  const { language, t } = useTranslation();
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
  const isValidProductId =
    productId !== null && Number.isInteger(productId) && productId > 0;
  const shouldLookupExternal =
    mode === "create" &&
    getParamString(params.lookup) === "open-food-facts" &&
    barcodeParam.length > 0;
  const [lookupLanguage] = useState(language);
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
        },
  );
  const [isLoading, setIsLoading] = useState(
    mode === "edit" && !initialProduct && isValidProductId,
  );
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(() =>
    mode === "edit" && !initialProduct && !isValidProductId
      ? t("errors.product_not_found")
      : null,
  );
  const [photoPermissionBlocked, setPhotoPermissionBlocked] = useState(false);
  const [isExternalLookupFinished, setIsExternalLookupFinished] =
    useState(!shouldLookupExternal);
  const [hasAutoFilled, setHasAutoFilled] = useState(false);
  const saveInProgress = useRef(false);
  const isLookingUpExternal = shouldLookupExternal && !isExternalLookupFinished;

  useEffect(() => {
    if (mode === "create" || initialProduct) {
      return;
    }

    if (!isValidProductId) {
      return;
    }

    let isActive = true;
    void getById(db, productId)
      .then((existingProduct) => {
        if (!isActive) {
          return;
        }
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
        if (!isActive) {
          return;
        }
        setError(t("errors.product_load_failed"));
        setIsLoading(false);
      });

    return () => {
      isActive = false;
    };
  }, [db, getById, initialProduct, isValidProductId, mode, productId, t]);

  useEffect(() => {
    if (!shouldLookupExternal) {
      return;
    }

    const controller = new AbortController();
    let isActive = true;

    void lookupOpenFoodFactsProduct(
      barcodeParam,
      lookupLanguage,
      fetch,
      controller.signal,
    )
      .then((externalProduct) => {
        if (!isActive || !externalProduct) {
          return;
        }
        setDraft((current) => ({
          ...current,
          ...(current.name.trim().length === 0 && externalProduct.productName
            ? { name: externalProduct.productName }
            : {}),
          ...(current.brand.trim().length === 0 && externalProduct.brand
            ? { brand: externalProduct.brand }
            : {}),
          ...(current.imageUri === null && externalProduct.imageUri
            ? { imageUri: externalProduct.imageUri }
            : {}),
        }));
        setHasAutoFilled(true);
      })
      .catch(() => undefined)
      .finally(() => {
        if (isActive) {
          setIsExternalLookupFinished(true);
        }
      });

    return () => {
      isActive = false;
      controller.abort();
    };
  }, [barcodeParam, lookupLanguage, shouldLookupExternal]);

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
    if (mode === "edit" && !isValidProductId) {
      setError(t("errors.product_not_found"));
      return;
    }

    saveInProgress.current = true;
    setIsSaving(true);
    setError(null);
    let newlyPersistedImageUri: string | null = null;
    let databaseSaveCompleted = false;
    try {
      let imageUri = draft.imageUri;
      if (draft.imageUri && draft.imageUri !== originalImageUri) {
        try {
          imageUri = await persistImageUri(draft.imageUri);
        } catch (imageError) {
          if (!isRemoteImageUri(draft.imageUri)) {
            throw imageError;
          }
          imageUri = null;
        }
      }
      newlyPersistedImageUri =
        imageUri && imageUri !== draft.imageUri ? imageUri : null;
      const draftToSave = { ...draft, imageUri };
      const saved =
        mode === "create"
          ? await add(db, draftToSave)
          : await update(db, productId as number, draftToSave);
      databaseSaveCompleted = true;
      if (originalImageUri && originalImageUri !== imageUri) {
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

          {isLookingUpExternal ? (
            <View style={styles.autoFillNotice}>
              <Text style={styles.autoFillTitle}>{t("form.lookup_title")}</Text>
              <Text style={styles.autoFillDescription}>
                {t("form.lookup_description")}
              </Text>
            </View>
          ) : null}

          {hasAutoFilled ? (
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
            <View style={styles.photoActions}>
              <SecondaryButton
                label={
                  draft.imageUri ? t("form.image_change") : t("form.image_add")
                }
                glyph="▧"
                onPress={() => void pickImage()}
              />
              {draft.imageUri ? (
                <SecondaryButton
                  label={t("form.image_remove")}
                  glyph="×"
                  danger
                  onPress={() => updateDraft({ imageUri: null })}
                />
              ) : null}
            </View>
          </View>

          <View style={styles.formFields}>
            <Field
              label={t("form.product_name")}
              placeholder={t("form.product_name_placeholder")}
              value={draft.name}
              onChangeText={(name) => updateDraft({ name })}
              maxLength={MAX_PRODUCT_NAME_LENGTH}
              autoFocus={
                mode === "create" && !hasAutoFilled && !isLookingUpExternal
              }
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
              maxLength={MAX_BRAND_LENGTH}
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
              maxLength={MAX_NOTE_LENGTH}
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
  photoActions: { flex: 1, gap: 8 },
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

function isRemoteImageUri(uri: string): boolean {
  return uri.startsWith("https://");
}
