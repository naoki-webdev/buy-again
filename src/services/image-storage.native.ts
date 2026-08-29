import { Directory, File, Paths } from "expo-file-system";

import { isOpenFoodFactsImageUri } from "@/services/open-food-facts";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

const imageDirectory = new Directory(Paths.document, "product-images");

export async function persistImageUri(uri: string): Promise<string> {
  if (isManagedImageUri(uri)) {
    return uri;
  }

  imageDirectory.create({ idempotent: true, intermediates: true });

  if (isRemoteImageUri(uri)) {
    if (!isOpenFoodFactsImageUri(uri)) {
      throw new Error("許可されていない画像URLです。");
    }
    await validateRemoteImage(uri);
    const destination = new File(
      imageDirectory,
      `product-${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`,
    );
    try {
      const downloaded = await File.downloadFileAsync(uri, destination);
      const info = downloaded.info();
      if (
        !info.exists ||
        (info.size !== undefined && info.size > MAX_IMAGE_BYTES)
      ) {
        if (downloaded.exists) {
          downloaded.delete();
        }
        throw new Error("画像サイズが大きすぎます。");
      }
      return downloaded.uri;
    } catch (error) {
      if (destination.exists) {
        destination.delete();
      }
      throw error;
    }
  }

  const source = new File(uri);
  const extension = source.extension || ".jpg";
  const destination = new File(
    imageDirectory,
    `product-${Date.now()}-${Math.random().toString(36).slice(2)}${extension}`,
  );
  try {
    await source.copy(destination);
  } catch (error) {
    if (destination.exists) {
      destination.delete();
    }
    throw error;
  }
  return destination.uri;
}

export async function deleteImageUri(uri: string | null): Promise<void> {
  if (!uri || !isManagedImageUri(uri)) {
    return;
  }

  const file = new File(uri);
  if (file.exists) {
    file.delete();
  }
}

function isManagedImageUri(uri: string): boolean {
  const directoryPrefix = imageDirectory.uri.endsWith("/")
    ? imageDirectory.uri
    : `${imageDirectory.uri}/`;
  return uri.startsWith(directoryPrefix);
}

function isRemoteImageUri(uri: string): boolean {
  return uri.startsWith("https://");
}

async function validateRemoteImage(uri: string): Promise<void> {
  try {
    const response = await fetch(uri, { method: "HEAD" });
    if (!response.ok) {
      return;
    }

    const contentType = response.headers.get("content-type");
    if (contentType && !contentType.toLowerCase().startsWith("image/")) {
      throw new Error("画像ではないファイルです。");
    }

    const contentLength = Number(response.headers.get("content-length"));
    if (Number.isFinite(contentLength) && contentLength > MAX_IMAGE_BYTES) {
      throw new Error("画像サイズが大きすぎます。");
    }
  } catch (error) {
    if (error instanceof Error && /画像/.test(error.message)) {
      throw error;
    }
  }
}
