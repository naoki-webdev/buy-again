import {
  CameraView,
  useCameraPermissions,
  type BarcodeScanningResult,
} from "expo-camera";
import { router } from "expo-router";
import { useRef, useState } from "react";
import {
  Linking,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ErrorText, PrimaryButton } from "@/components/ui";
import { Colors, Radius, Spacing } from "@/constants/theme";
import { validateBarcode } from "@/domain/product";
import { useTranslation } from "@/i18n";
import { useProductDatabase } from "@/providers/database-provider";
import { lookupOpenFoodFactsProduct } from "@/services/open-food-facts";
import { useProductStore } from "@/store/product-store";

export default function ScanScreen() {
  const db = useProductDatabase();
  const insets = useSafeAreaInsets();
  const { language, t } = useTranslation();
  const findByBarcode = useProductStore((state) => state.findByBarcode);
  const [permission, requestPermission] = useCameraPermissions();
  const [manualBarcode, setManualBarcode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isFinding, setIsFinding] = useState(false);
  const [hasScanned, setHasScanned] = useState(false);
  const lookupInProgress = useRef(false);

  const lookup = async (barcode: string) => {
    const normalizedBarcode = barcode.trim();
    if (normalizedBarcode.length === 0 || lookupInProgress.current) {
      if (normalizedBarcode.length === 0) {
        setError(t("errors.barcode_required"));
      }
      return;
    }
    const barcodeError = validateBarcode(normalizedBarcode);
    if (barcodeError) {
      setError(t(`errors.${barcodeError}`));
      return;
    }
    lookupInProgress.current = true;
    setHasScanned(true);
    setIsFinding(true);
    setError(null);
    try {
      const existing = await findByBarcode(db, normalizedBarcode);
      if (existing) {
        router.replace(`/product/${existing.id}`);
      } else {
        let externalProduct = null;
        try {
          externalProduct = await lookupOpenFoodFactsProduct(
            normalizedBarcode,
            language,
          );
        } catch {
          externalProduct = null;
        }

        router.replace({
          pathname: "/add",
          params: {
            barcode: normalizedBarcode,
            ...(externalProduct?.productName
              ? { name: externalProduct.productName }
              : {}),
            ...(externalProduct?.brand ? { brand: externalProduct.brand } : {}),
            ...(externalProduct?.imageUri
              ? { imageUri: externalProduct.imageUri }
              : {}),
            ...(externalProduct ? { source: "open-food-facts" } : {}),
          },
        });
      }
    } catch {
      setHasScanned(false);
      setError(t("errors.lookup_failed"));
    } finally {
      lookupInProgress.current = false;
      setIsFinding(false);
    }
  };

  const handleBarcodeScanned = ({ data }: BarcodeScanningResult) => {
    void lookup(data);
  };

  return (
    <View style={styles.root}>
      <View style={styles.cameraArea}>
        {permission?.granted ? (
          <CameraView
            style={StyleSheet.absoluteFill}
            facing="back"
            barcodeScannerSettings={{
              barcodeTypes: ["ean13", "ean8", "upc_a", "upc_e"],
            }}
            onBarcodeScanned={hasScanned ? undefined : handleBarcodeScanned}
          />
        ) : (
          <View style={styles.permissionPanel}>
            <Text style={styles.permissionIcon}>⌕</Text>
            <Text style={styles.permissionTitle}>
              {t("scan.permission_title")}
            </Text>
            <Text style={styles.permissionDescription}>
              {t("scan.permission_description")}
            </Text>
            {permission ? (
              <PrimaryButton
                label={
                  permission.canAskAgain
                    ? t("scan.allow_camera")
                    : t("scan.open_settings")
                }
                onPress={() =>
                  void (permission.canAskAgain
                    ? requestPermission()
                    : Linking.openSettings())
                }
              />
            ) : (
              <Text style={styles.permissionDescription}>
                {t("scan.preparing_camera")}
              </Text>
            )}
          </View>
        )}
        {permission?.granted ? (
          <View style={[styles.overlay, { paddingBottom: insets.bottom + 30 }]}>
            <View style={[styles.scanHeader, { paddingTop: insets.top + 12 }]}>
              <Pressable
                onPress={() => router.back()}
                accessibilityLabel={t("scan.close")}
                accessibilityRole="button"
                style={styles.closeButton}
              >
                <Text style={styles.closeGlyph}>×</Text>
              </Pressable>
              <Text style={styles.scanHeaderTitle}>{t("scan.title")}</Text>
              <View style={styles.headerSpacer} />
            </View>
            <View style={styles.focusArea}>
              <View style={[styles.corner, styles.cornerTopLeft]} />
              <View style={[styles.corner, styles.cornerTopRight]} />
              <View style={[styles.corner, styles.cornerBottomLeft]} />
              <View style={[styles.corner, styles.cornerBottomRight]} />
              <View style={styles.scanLine} />
            </View>
            <Text style={styles.helperText}>{t("scan.helper")}</Text>
          </View>
        ) : null}
      </View>

      <View style={[styles.manualArea, { paddingBottom: insets.bottom + 24 }]}>
        <View style={styles.manualHeading}>
          <View>
            <Text style={styles.manualEyebrow}>{t("scan.manual_eyebrow")}</Text>
            <Text style={styles.manualTitle}>{t("scan.manual_title")}</Text>
          </View>
          <Text style={styles.manualArrow}>↓</Text>
        </View>
        <View style={styles.manualInputRow}>
          <TextInput
            value={manualBarcode}
            onChangeText={setManualBarcode}
            placeholder={t("scan.barcode_placeholder")}
            placeholderTextColor={Colors.muted}
            style={styles.manualInput}
            keyboardType="number-pad"
            returnKeyType="search"
            onSubmitEditing={() => void lookup(manualBarcode)}
          />
          <Pressable
            onPress={() => void lookup(manualBarcode)}
            accessibilityLabel={t("scan.search")}
            accessibilityRole="button"
            style={({ pressed }) => [
              styles.searchButton,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.searchButtonGlyph}>→</Text>
          </Pressable>
        </View>
        <ErrorText message={error} />
        {isFinding ? (
          <Text style={styles.findingText}>{t("scan.finding")}</Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  cameraArea: { flex: 1, backgroundColor: "#18221D", overflow: "hidden" },
  permissionPanel: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 34,
    gap: 14,
  },
  permissionIcon: { color: "#B9D4C3", fontSize: 58, fontWeight: "200" },
  permissionTitle: {
    color: Colors.white,
    fontSize: 21,
    fontWeight: "800",
    textAlign: "center",
  },
  permissionDescription: {
    color: "#C2D0C7",
    fontSize: 14,
    lineHeight: 21,
    textAlign: "center",
    maxWidth: 300,
  },
  overlay: {
    ...StyleSheet.absoluteFill,
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.xl,
    paddingBottom: 30,
  },
  scanHeader: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 22,
  },
  closeButton: {
    width: 42,
    height: 42,
    borderRadius: 15,
    backgroundColor: "rgba(0,0,0,0.28)",
    alignItems: "center",
    justifyContent: "center",
  },
  closeGlyph: { color: Colors.white, fontSize: 26, fontWeight: "300" },
  scanHeaderTitle: { color: Colors.white, fontSize: 15, fontWeight: "800" },
  headerSpacer: { width: 42 },
  focusArea: {
    width: "88%",
    maxWidth: 330,
    aspectRatio: 1.55,
    position: "relative",
    justifyContent: "center",
  },
  corner: {
    width: 28,
    height: 28,
    borderColor: "#D8F1DE",
    position: "absolute",
  },
  cornerTopLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderTopLeftRadius: 8,
  },
  cornerTopRight: {
    top: 0,
    right: 0,
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderTopRightRadius: 8,
  },
  cornerBottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderBottomLeftRadius: 8,
  },
  cornerBottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderBottomRightRadius: 8,
  },
  scanLine: {
    height: 2,
    width: "88%",
    alignSelf: "center",
    backgroundColor: "#F08B67",
  },
  helperText: {
    color: "#E0EAE3",
    fontSize: 13,
    fontWeight: "600",
    backgroundColor: "rgba(0,0,0,0.3)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Radius.pill,
  },
  manualArea: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: Radius.lg,
    borderTopRightRadius: Radius.lg,
    paddingHorizontal: Spacing.xl,
    paddingTop: 22,
    paddingBottom: 24,
    gap: 12,
  },
  manualHeading: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  manualEyebrow: {
    color: Colors.coral,
    fontSize: 10,
    letterSpacing: 1.2,
    fontWeight: "800",
    marginBottom: 5,
  },
  manualTitle: { color: Colors.ink, fontSize: 20, fontWeight: "800" },
  manualArrow: { color: Colors.forest, fontSize: 22 },
  manualInputRow: { flexDirection: "row", gap: 9 },
  manualInput: {
    flex: 1,
    minHeight: 52,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.sm,
    paddingHorizontal: 14,
    color: Colors.ink,
    fontSize: 15,
    backgroundColor: Colors.background,
  },
  searchButton: {
    width: 54,
    minHeight: 52,
    borderRadius: Radius.sm,
    backgroundColor: Colors.forest,
    alignItems: "center",
    justifyContent: "center",
  },
  searchButtonGlyph: { color: Colors.white, fontSize: 25, fontWeight: "300" },
  pressed: { opacity: 0.7 },
  findingText: { color: Colors.muted, fontSize: 13 },
});
