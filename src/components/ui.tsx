import { Image } from "expo-image";
import { router } from "expo-router";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  type PressableProps,
  type StyleProp,
  type TextInputProps,
  type ViewStyle,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { ReactNode } from "react";

import { Colors, Radius, Spacing } from "@/constants/theme";
import {
  getRatingOption,
  type Product,
  type Rating,
  RATING_OPTIONS,
} from "@/domain/product";
import { useTranslation } from "@/i18n";

export function Screen({
  children,
  scroll = false,
  style,
}: {
  children: ReactNode;
  scroll?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  if (scroll) {
    return (
      <SafeAreaView edges={["top"]} style={styles.screen}>
        <ScrollView
          contentContainerStyle={[styles.scrollContent, style]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {children}
        </ScrollView>
      </SafeAreaView>
    );
  }
  return (
    <SafeAreaView edges={["top"]} style={[styles.screen, style]}>
      {children}
    </SafeAreaView>
  );
}

export function AppHeader({
  title,
  eyebrow,
  action,
}: {
  title: string;
  eyebrow?: string;
  action?: ReactNode;
}) {
  return (
    <View style={styles.header}>
      <View style={styles.headerText}>
        {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
        <Text style={styles.headerTitle}>{title}</Text>
      </View>
      {action}
    </View>
  );
}

export function LogoMark() {
  return (
    <View style={styles.logoRow}>
      <View style={styles.logoMark}>
        <Text style={styles.logoLetter}>r</Text>
      </View>
      <Text style={styles.logoText}>buy-again</Text>
    </View>
  );
}

export function IconButton({
  label,
  onPress,
  glyph = "×",
  style,
  ...props
}: PressableProps & {
  label: string;
  glyph?: string;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <Pressable
      {...props}
      onPress={onPress}
      accessibilityLabel={label}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.iconButton,
        style,
        pressed && styles.pressed,
      ]}
    >
      <Text style={styles.iconGlyph}>{glyph}</Text>
    </Pressable>
  );
}

export function PrimaryButton({
  label,
  onPress,
  glyph,
  disabled = false,
}: {
  label: string;
  onPress: () => void;
  glyph?: string;
  disabled?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.primaryButton,
        disabled && styles.disabled,
        pressed && !disabled && styles.primaryPressed,
      ]}
    >
      <Text style={styles.primaryLabel}>{label}</Text>
      {glyph ? <Text style={styles.primaryGlyph}>{glyph}</Text> : null}
    </Pressable>
  );
}

export function SecondaryButton({
  label,
  onPress,
  glyph,
  danger = false,
}: {
  label: string;
  onPress: () => void;
  glyph?: string;
  danger?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.secondaryButton,
        danger && styles.dangerButton,
        pressed && styles.pressed,
      ]}
    >
      {glyph ? (
        <Text style={[styles.secondaryGlyph, danger && styles.dangerText]}>
          {glyph}
        </Text>
      ) : null}
      <Text style={[styles.secondaryLabel, danger && styles.dangerText]}>
        {label}
      </Text>
    </Pressable>
  );
}

export function RatingBadge({
  rating,
  large = false,
}: {
  rating: Rating;
  large?: boolean;
}) {
  const { t } = useTranslation();
  const option = getRatingOption(rating);
  return (
    <View
      style={[
        styles.ratingBadge,
        { backgroundColor: option.backgroundColor },
        large && styles.largeRatingBadge,
      ]}
    >
      <View style={[styles.ratingDot, { backgroundColor: option.color }]} />
      <Text
        style={[
          styles.ratingBadgeText,
          { color: option.color },
          large && styles.largeRatingText,
        ]}
      >
        {t(option.labelKey)}
      </Text>
    </View>
  );
}

export function RatingPicker({
  value,
  onChange,
}: {
  value: Rating;
  onChange: (value: Rating) => void;
}) {
  const { t } = useTranslation();
  return (
    <View style={styles.ratingGrid}>
      {RATING_OPTIONS.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            style={({ pressed }) => [
              styles.ratingChoice,
              {
                borderColor: selected ? option.color : Colors.border,
                backgroundColor: selected
                  ? option.backgroundColor
                  : Colors.surface,
              },
              pressed && styles.pressed,
            ]}
          >
            <View
              style={[
                styles.ratingChoiceDot,
                { backgroundColor: option.color },
              ]}
            />
            <Text
              style={[
                styles.ratingChoiceText,
                selected && { color: option.color, fontWeight: "700" },
              ]}
            >
              {t(option.labelKey)}
            </Text>
            {selected ? (
              <Text style={[styles.checkmark, { color: option.color }]}>✓</Text>
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
}

export function ProductCard({
  product,
  compact = false,
}: {
  product: Product;
  compact?: boolean;
}) {
  const { t } = useTranslation();
  const option = getRatingOption(product.rating);
  return (
    <Pressable
      onPress={() => router.push(`/product/${product.id}`)}
      accessibilityRole="button"
      accessibilityLabel={`${product.brand ? `${product.brand}, ` : ""}${product.name}, ${t(option.labelKey)}`}
      style={({ pressed }) => [
        styles.productCard,
        compact && styles.compactProductCard,
        pressed && styles.cardPressed,
      ]}
    >
      <ProductThumbnail product={product} compact={compact} />
      <View style={styles.productCardBody}>
        <Text numberOfLines={1} style={styles.productName}>
          {product.name}
        </Text>
        {product.brand ? (
          <Text numberOfLines={1} style={styles.productBrand}>
            {product.brand}
          </Text>
        ) : null}
        <View style={styles.productMetaRow}>
          <RatingBadge rating={product.rating} />
          {product.barcode ? (
            <Text style={styles.barcodeText}>{product.barcode}</Text>
          ) : null}
        </View>
        {!compact && product.note ? (
          <Text numberOfLines={1} style={styles.productNote}>
            {product.note}
          </Text>
        ) : null}
      </View>
      <Text style={styles.chevron}>›</Text>
    </Pressable>
  );
}

export function ProductThumbnail({
  product,
  compact = false,
}: {
  product: Product;
  compact?: boolean;
}) {
  if (product.imageUri) {
    return (
      <Image
        source={{ uri: product.imageUri }}
        contentFit="cover"
        style={[styles.imageThumbnail, compact && styles.compactImageThumbnail]}
      />
    );
  }
  return (
    <View
      style={[
        styles.viewThumbnail,
        styles.thumbnailPlaceholder,
        { backgroundColor: optionBackground(product.rating) },
        compact && styles.compactViewThumbnail,
      ]}
    >
      <Text
        style={[
          styles.thumbnailInitial,
          { color: getRatingOption(product.rating).color },
        ]}
      >
        {product.name.trim().charAt(0).toUpperCase() || "・"}
      </Text>
    </View>
  );
}

function optionBackground(rating: Rating): string {
  return getRatingOption(rating).backgroundColor;
}

export function StatCard({
  value,
  label,
  color,
  glyph,
}: {
  value: number;
  label: string;
  color: string;
  glyph: string;
}) {
  return (
    <View style={styles.statCard}>
      <View style={[styles.statIcon, { backgroundColor: color }]}>
        <Text style={styles.statGlyph}>{glyph}</Text>
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

export function Field({
  label,
  hint,
  ...props
}: TextInputProps & { label: string; hint?: string }) {
  return (
    <View style={styles.fieldBlock}>
      <View style={styles.fieldLabelRow}>
        <Text style={styles.fieldLabel}>{label}</Text>
        {hint ? <Text style={styles.fieldHint}>{hint}</Text> : null}
      </View>
      <TextInput
        {...props}
        placeholderTextColor={Colors.muted}
        style={[
          styles.input,
          props.multiline && styles.multilineInput,
          props.style,
        ]}
      />
    </View>
  );
}

export function SectionTitle({
  title,
  action,
}: {
  title: string;
  action?: ReactNode;
}) {
  return (
    <View style={styles.sectionTitleRow}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {action}
    </View>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <View style={styles.emptyState}>
      <View style={styles.emptyIcon}>
        <Text style={styles.emptyIconText}>＋</Text>
      </View>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyDescription}>{description}</Text>
      {action}
    </View>
  );
}

export function LoadingState() {
  const { t } = useTranslation();
  return (
    <View style={styles.loadingState}>
      <Text style={styles.loadingText}>{t("common.loading")}</Text>
    </View>
  );
}

export function DatabaseErrorState({ onRetry }: { onRetry: () => void }) {
  const { t } = useTranslation();
  return (
    <SafeAreaView edges={["top", "bottom"]} style={styles.databaseErrorState}>
      <Text style={styles.databaseErrorTitle}>
        {t("database.load_failed_title")}
      </Text>
      <Text style={styles.databaseErrorDescription}>
        {t("database.load_failed_description")}
      </Text>
      <PrimaryButton label={t("common.retry")} onPress={onRetry} />
    </SafeAreaView>
  );
}

export function ErrorText({ message }: { message: string | null }) {
  return message ? <Text style={styles.errorText}>{message}</Text> : null;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  scrollContent: { paddingHorizontal: Spacing.xl, paddingBottom: 40 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  headerText: { gap: Spacing.xs },
  eyebrow: {
    color: Colors.muted,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1.1,
    textTransform: "uppercase",
  },
  headerTitle: {
    color: Colors.ink,
    fontSize: 32,
    fontWeight: "800",
    letterSpacing: -1.1,
  },
  logoRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  logoMark: {
    width: 30,
    height: 30,
    borderRadius: 11,
    backgroundColor: Colors.forest,
    alignItems: "center",
    justifyContent: "center",
  },
  logoLetter: {
    color: Colors.white,
    fontSize: 20,
    fontWeight: "800",
    fontStyle: "italic",
  },
  logoText: {
    color: Colors.ink,
    fontSize: 19,
    fontWeight: "800",
    letterSpacing: -0.4,
  },
  iconButton: {
    width: 42,
    height: 42,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.surface,
  },
  iconGlyph: {
    color: Colors.ink,
    fontSize: 24,
    lineHeight: 26,
    fontWeight: "300",
  },
  pressed: { opacity: 0.64 },
  primaryButton: {
    minHeight: 56,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.xl,
    backgroundColor: Colors.forest,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  primaryPressed: { transform: [{ scale: 0.985 }], opacity: 0.9 },
  disabled: { opacity: 0.45 },
  primaryLabel: { color: Colors.white, fontSize: 16, fontWeight: "800" },
  primaryGlyph: { color: Colors.white, fontSize: 23, fontWeight: "300" },
  secondaryButton: {
    minHeight: 50,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.lg,
    backgroundColor: Colors.surface,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
  },
  secondaryLabel: { color: Colors.ink, fontSize: 15, fontWeight: "700" },
  secondaryGlyph: { color: Colors.forest, fontSize: 20, fontWeight: "400" },
  dangerButton: { borderColor: "#EBCFC9" },
  dangerText: { color: Colors.danger },
  ratingBadge: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderRadius: Radius.pill,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  largeRatingBadge: { paddingHorizontal: 15, paddingVertical: 9, gap: 8 },
  ratingDot: { width: 7, height: 7, borderRadius: 4 },
  ratingBadgeText: { fontSize: 11, fontWeight: "800" },
  largeRatingText: { fontSize: 15 },
  ratingGrid: { gap: 10 },
  ratingChoice: {
    minHeight: 50,
    borderRadius: Radius.sm,
    borderWidth: 1.5,
    paddingHorizontal: Spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },
  ratingChoiceDot: { width: 10, height: 10, borderRadius: 5 },
  ratingChoiceText: {
    color: Colors.ink,
    fontSize: 14,
    fontWeight: "600",
    flex: 1,
  },
  checkmark: { fontSize: 18, fontWeight: "800" },
  productCard: {
    minHeight: 82,
    borderRadius: Radius.md,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  compactProductCard: { minHeight: 74 },
  cardPressed: { backgroundColor: "#F6F4ED", transform: [{ scale: 0.995 }] },
  imageThumbnail: { width: 62, height: 62, borderRadius: 12 },
  compactImageThumbnail: { width: 52, height: 52, borderRadius: 10 },
  viewThumbnail: { width: 62, height: 62, borderRadius: 12 },
  compactViewThumbnail: { width: 52, height: 52, borderRadius: 10 },
  thumbnailPlaceholder: { alignItems: "center", justifyContent: "center" },
  thumbnailInitial: { fontSize: 24, fontWeight: "800" },
  productCardBody: { flex: 1, gap: 8, minWidth: 0 },
  productName: { color: Colors.ink, fontSize: 16, fontWeight: "700" },
  productBrand: { color: Colors.muted, fontSize: 12 },
  productMetaRow: { flexDirection: "row", alignItems: "center", gap: 9 },
  barcodeText: {
    color: Colors.muted,
    fontSize: 11,
    fontVariant: ["tabular-nums"],
  },
  productNote: { color: Colors.muted, fontSize: 12 },
  chevron: {
    color: "#9AA19A",
    fontSize: 26,
    fontWeight: "300",
    paddingRight: 2,
  },
  statCard: {
    flex: 1,
    minHeight: 122,
    borderRadius: Radius.md,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 14,
    gap: 5,
  },
  statIcon: {
    width: 28,
    height: 28,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  statGlyph: { color: Colors.ink, fontSize: 14, fontWeight: "900" },
  statValue: {
    color: Colors.ink,
    fontSize: 27,
    fontWeight: "800",
    letterSpacing: -0.8,
  },
  statLabel: { color: Colors.muted, fontSize: 12, fontWeight: "600" },
  fieldBlock: { gap: 8 },
  fieldLabelRow: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
  },
  fieldLabel: { color: Colors.ink, fontSize: 14, fontWeight: "800" },
  fieldHint: { color: Colors.muted, fontSize: 12 },
  input: {
    minHeight: 52,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.sm,
    backgroundColor: Colors.surface,
    color: Colors.ink,
    paddingHorizontal: 14,
    fontSize: 16,
  },
  multilineInput: { minHeight: 116, paddingTop: 14, textAlignVertical: "top" },
  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    color: Colors.ink,
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: -0.3,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 48,
    paddingHorizontal: 24,
    gap: 12,
  },
  emptyIcon: {
    width: 60,
    height: 60,
    borderRadius: 22,
    backgroundColor: Colors.forestSoft,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  emptyIconText: { color: Colors.forest, fontSize: 30, fontWeight: "300" },
  emptyTitle: {
    color: Colors.ink,
    fontSize: 18,
    fontWeight: "800",
    textAlign: "center",
  },
  emptyDescription: {
    color: Colors.muted,
    fontSize: 14,
    lineHeight: 21,
    textAlign: "center",
    maxWidth: 290,
  },
  loadingState: { flex: 1, alignItems: "center", justifyContent: "center" },
  loadingText: { color: Colors.muted, fontSize: 14 },
  databaseErrorState: {
    ...StyleSheet.absoluteFill,
    zIndex: 10,
    elevation: 10,
    backgroundColor: Colors.background,
    alignItems: "center",
    justifyContent: "center",
    padding: 28,
    gap: 14,
  },
  databaseErrorTitle: { color: Colors.ink, fontSize: 19, fontWeight: "800" },
  databaseErrorDescription: {
    color: Colors.muted,
    fontSize: 14,
    lineHeight: 21,
    textAlign: "center",
    maxWidth: 310,
  },
  errorText: { color: Colors.danger, fontSize: 13, lineHeight: 19 },
});
