import { Directory, File, Paths } from "expo-file-system";

const imageDirectory = new Directory(Paths.document, "product-images");

export async function persistImageUri(uri: string): Promise<string> {
  imageDirectory.create({ idempotent: true, intermediates: true });

  const source = new File(uri);
  const extension = source.extension || ".jpg";
  const destination = new File(
    imageDirectory,
    `product-${Date.now()}-${Math.random().toString(36).slice(2)}${extension}`,
  );
  await source.copy(destination);
  return destination.uri;
}
