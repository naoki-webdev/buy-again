import {
  deleteImageUri,
  persistImageUri,
} from "@/services/image-storage.native";

const mockFiles = new Map<string, { size?: number }>();
const mockCopy = jest.fn();
const mockDownload = jest.fn();

jest.mock("expo-file-system", () => {
  class MockDirectory {
    readonly uri: string;

    constructor(parent: { uri: string } | string, name?: string) {
      const parentUri = typeof parent === "string" ? parent : parent.uri;
      this.uri = name ? `${parentUri}/${name}` : parentUri;
    }

    create(): void {
      // The native API creates the directory; the mock only needs its path.
    }
  }

  class MockFile {
    readonly uri: string;

    constructor(parent: { uri: string } | string, name?: string) {
      const parentUri = typeof parent === "string" ? parent : parent.uri;
      this.uri = name ? `${parentUri}/${name}` : parentUri;
    }

    get exists(): boolean {
      return mockFiles.has(this.uri);
    }

    get extension(): string {
      const extension = this.uri.match(/\.[^./]+$/)?.[0];
      return extension ?? "";
    }

    async copy(destination: MockFile): Promise<void> {
      await mockCopy(this, destination);
    }

    info(): { exists: boolean; size?: number } {
      const file = mockFiles.get(this.uri);
      return { exists: file !== undefined, size: file?.size };
    }

    delete(): void {
      mockFiles.delete(this.uri);
    }

    static async downloadFileAsync(
      _source: string,
      destination: MockFile,
    ): Promise<MockFile> {
      await mockDownload(destination);
      return destination;
    }
  }

  return {
    Directory: MockDirectory,
    File: MockFile,
    Paths: { document: { uri: "file:///documents" } },
  };
});

describe("native image storage", () => {
  beforeEach(() => {
    mockFiles.clear();
    mockCopy.mockReset();
    mockDownload.mockReset();
    mockCopy.mockImplementation(
      async (_source: { uri: string }, destination: { uri: string }) => {
        mockFiles.set(destination.uri, { size: 1024 });
      },
    );
    mockDownload.mockImplementation(async (destination: { uri: string }) => {
      mockFiles.set(destination.uri, { size: 1024 });
    });
  });

  it("端末画像を管理対象ディレクトリへコピーする", async () => {
    const persistedUri = await persistImageUri("file:///cache/photo.png");

    expect(persistedUri).toMatch(/^file:\/\/\/documents\/product-images\//);
    expect(persistedUri).toMatch(/\.png$/);
    expect(mockCopy).toHaveBeenCalledTimes(1);
    expect(mockFiles.has(persistedUri)).toBe(true);
  });

  it("既に管理対象の画像は再コピーしない", async () => {
    const managedUri = "file:///documents/product-images/existing.jpg";
    mockFiles.set(managedUri, { size: 1024 });

    await expect(persistImageUri(managedUri)).resolves.toBe(managedUri);
    expect(mockCopy).not.toHaveBeenCalled();
  });

  it("コピー失敗時は作成途中のファイルを残さない", async () => {
    mockCopy.mockRejectedValueOnce(new Error("copy failed"));

    const promise = persistImageUri("file:///cache/photo.jpg");
    await expect(promise).rejects.toThrow("copy failed");
    expect(
      Array.from(mockFiles.keys()).some((uri) =>
        uri.startsWith("file:///documents/product-images/"),
      ),
    ).toBe(false);
  });

  it("管理対象の画像だけ削除する", async () => {
    const managedUri = "file:///documents/product-images/remove.jpg";
    const externalUri = "file:///cache/keep.jpg";
    mockFiles.set(managedUri, { size: 1024 });
    mockFiles.set(externalUri, { size: 1024 });

    await deleteImageUri(managedUri);
    await deleteImageUri(externalUri);

    expect(mockFiles.has(managedUri)).toBe(false);
    expect(mockFiles.has(externalUri)).toBe(true);
  });

  it("Open Food Facts以外のリモート画像を保存しない", async () => {
    await expect(
      persistImageUri("https://example.com/not-an-off-image.jpg"),
    ).rejects.toThrow("許可されていない画像URLです。");
    expect(mockDownload).not.toHaveBeenCalled();
  });
});
