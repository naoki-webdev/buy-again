import { getSelectedImageUri } from "@/services/image-picker";

describe("image picker result", () => {
  it("成功結果から最初の画像URIを返す", () => {
    expect(
      getSelectedImageUri({
        canceled: false,
        assets: [
          {
            uri: "file:///cache/photo.jpg",
            width: 100,
            height: 100,
            assetId: null,
            fileName: null,
            fileSize: 100,
            type: "image",
            exif: null,
            base64: null,
            duration: null,
            mimeType: "image/jpeg",
          },
        ],
      }),
    ).toBe("file:///cache/photo.jpg");
  });

  it("キャンセル、エラー、未取得結果はURIを返さない", () => {
    expect(getSelectedImageUri({ canceled: true, assets: null })).toBeNull();
    expect(
      getSelectedImageUri({ code: "ERR", message: "picker failed" }),
    ).toBeNull();
    expect(getSelectedImageUri(null)).toBeNull();
  });
});
