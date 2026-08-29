import { parseWebProductRows } from "@/data/database.web";

describe("web product row parsing", () => {
  it("全フィールドを検証し、旧形式の任意列は安全な初期値にする", () => {
    const rows = parseWebProductRows(
      JSON.stringify([
        {
          id: 3,
          name: "商品",
          brand: "ブランド",
          barcode: null,
          image_uri: null,
          rating: "buy_again",
          note: "メモ",
          created_at: "2026-08-30T00:00:00.000Z",
          updated_at: "2026-08-30T00:00:00.000Z",
        },
        {
          id: 2,
          name: "旧商品",
          rating: "maybe",
          created_at: "2026-08-29T00:00:00.000Z",
          updated_at: "2026-08-29T00:00:00.000Z",
        },
        {
          id: "不正",
          name: "読み込まない",
          rating: "maybe",
          created_at: "2026-08-29T00:00:00.000Z",
          updated_at: "2026-08-29T00:00:00.000Z",
        },
        {
          id: 1,
          name: "不正な評価",
          rating: "unknown",
          created_at: "2026-08-29T00:00:00.000Z",
          updated_at: "2026-08-29T00:00:00.000Z",
        },
      ]),
    );

    expect(rows).toEqual([
      expect.objectContaining({ id: 3, brand: "ブランド", note: "メモ" }),
      expect.objectContaining({
        id: 2,
        brand: "",
        barcode: null,
        image_uri: null,
        note: "",
      }),
    ]);
  });

  it("壊れたJSONや不正な日付は読み込まない", () => {
    expect(parseWebProductRows("not-json")).toEqual([]);
    expect(
      parseWebProductRows(
        JSON.stringify({
          id: 1,
          name: "商品",
          rating: "maybe",
          created_at: "not-a-date",
          updated_at: "2026-08-30T00:00:00.000Z",
        }),
      ),
    ).toEqual([]);
  });
});
