import { Directory, File, Paths } from "expo-file-system";

const imageDirectory = new Directory(Paths.document, "product-images");

export async function persistImageUri(uri: string): Promise<string> {
  if (isManagedImageUri(uri)) {
    return uri;
  }

  imageDirectory.create({ idempotent: true, intermediates: true });

  if (isRemoteImageUri(uri)) {
    const destination = new File(
      imageDirectory,
      `product-${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`,
    );
    try {
      const downloaded = await File.downloadFileAsync(uri, destination);
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
