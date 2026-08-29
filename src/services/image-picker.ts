import type {
  ImagePickerErrorResult,
  ImagePickerResult,
} from "expo-image-picker";

type ImagePickerResponse = ImagePickerResult | ImagePickerErrorResult | null;

export function getSelectedImageUri(
  result: ImagePickerResponse,
): string | null {
  if (!result || !("canceled" in result) || result.canceled) {
    return null;
  }

  return result.assets[0]?.uri ?? null;
}
