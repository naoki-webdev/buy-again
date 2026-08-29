export async function persistImageUri(uri: string): Promise<string> {
  return uri;
}

export async function deleteImageUri(_uri: string | null): Promise<void> {
  return Promise.resolve();
}
