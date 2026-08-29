import type { SQLiteBindValue, SQLiteRunResult } from "expo-sqlite";

import {
  createProduct,
  deleteProduct,
  findProductByBarcode,
  getProductById,
  updateProduct,
  type ProductDatabase,
  type ProductRow,
} from "@/data/database";
import {
  filterProducts,
  type Product,
  type ProductDraft,
} from "@/domain/product";

class FakeProductDatabase implements ProductDatabase {
  private readonly rows = new Map<number, ProductRow>();
  private nextId = 1;

  async runAsync(
    source: string,
    ...params: SQLiteBindValue[]
  ): Promise<SQLiteRunResult> {
    if (source.includes("INSERT INTO products")) {
      const id = this.nextId++;
      const [
        name,
        brand,
        barcode,
        imageUri,
        rating,
        note,
        createdAt,
        updatedAt,
      ] = params;
      this.rows.set(id, {
        id,
        name: asString(name),
        brand: asString(brand),
        barcode: asNullableString(barcode),
        image_uri: asNullableString(imageUri),
        rating: asRating(rating),
        note: asString(note),
        created_at: asString(createdAt),
        updated_at: asString(updatedAt),
      });
      return { lastInsertRowId: id, changes: 1 };
    }

    if (source.includes("UPDATE products")) {
      const [name, brand, barcode, imageUri, rating, note, updatedAt, idValue] =
        params;
      const id = asNumber(idValue);
      const current = this.rows.get(id);
      if (current) {
        this.rows.set(id, {
          ...current,
          name: asString(name),
          brand: asString(brand),
          barcode: asNullableString(barcode),
          image_uri: asNullableString(imageUri),
          rating: asRating(rating),
          note: asString(note),
          updated_at: asString(updatedAt),
        });
      }
      return { lastInsertRowId: 0, changes: current ? 1 : 0 };
    }

    const id = asNumber(params[0]);
    const changes = this.rows.delete(id) ? 1 : 0;
    return { lastInsertRowId: 0, changes };
  }

  async getFirstAsync<T>(
    source: string,
    ...params: SQLiteBindValue[]
  ): Promise<T | null> {
    if (source.includes("barcode")) {
      const barcode = asString(params[0]);
      return (
        (Array.from(this.rows.values()).find(
          (row) => row.barcode === barcode,
        ) as T | undefined) ?? null
      );
    }
    const row = this.rows.get(asNumber(params[0]));
    return (row as T | undefined) ?? null;
  }

  async getAllAsync<T>(
    _source: string,
    ..._params: SQLiteBindValue[]
  ): Promise<T[]> {
    return Array.from(this.rows.values()).sort(
      (left, right) => right.id - left.id,
    ) as T[];
  }
}

const draft: ProductDraft = {
  name: "試す商品",
  brand: "試すブランド",
  barcode: "4900000000001",
  imageUri: null,
  rating: "buy_again",
  note: "メモ",
};

describe("product repository", () => {
  it("商品を登録できる", async () => {
    const db = new FakeProductDatabase();
    const created = await createProduct(db, draft);

    expect(created.name).toBe("試す商品");
    expect(created.brand).toBe("試すブランド");
    expect(created.barcode).toBe("4900000000001");
    expect(created.rating).toBe("buy_again");
  });

  it("商品を編集できる", async () => {
    const db = new FakeProductDatabase();
    const created = await createProduct(db, draft);

    const updated = await updateProduct(db, created.id, {
      ...draft,
      name: "編集した商品",
      brand: "編集したブランド",
      rating: "maybe",
    });
    expect(updated.name).toBe("編集した商品");
    expect(updated.brand).toBe("編集したブランド");
    expect(updated.rating).toBe("maybe");
  });

  it("商品を削除できる", async () => {
    const db = new FakeProductDatabase();
    const created = await createProduct(db, draft);

    await deleteProduct(db, created.id);
    expect(await getProductById(db, created.id)).toBeNull();
  });

  it("バーコードから既存商品を検索できる", async () => {
    const db = new FakeProductDatabase();
    const created = await createProduct(db, draft);

    const found = await findProductByBarcode(db, " 4900000000001 ");

    expect(found?.id).toBe(created.id);
    expect(await findProductByBarcode(db, "4900999999999")).toBeNull();
  });

  it("評価フィルタで商品を絞り込める", () => {
    const products: Product[] = [
      makeProduct(1, "また買う商品", "buy_again"),
      makeProduct(2, "避ける商品", "never_again"),
      makeProduct(3, "微妙な商品", "maybe"),
    ];

    expect(
      filterProducts(products, "", "never_again").map(
        (product) => product.name,
      ),
    ).toEqual(["避ける商品"]);
    expect(
      filterProducts(products, "また", "all").map((product) => product.id),
    ).toEqual([1]);
  });

  it("商品名、ブランド、バーコードを検索できる", () => {
    const product = {
      ...makeProduct(1, "バターチキンカレー", "buy_again"),
      brand: "Mandala",
      barcode: "4901002182663",
    };

    expect(filterProducts([product], "mandala", "all")).toEqual([product]);
    expect(filterProducts([product], "4901002182663", "all")).toEqual([
      product,
    ]);
  });

  it("同じバーコードの商品登録を拒否する", async () => {
    const db = new FakeProductDatabase();
    await createProduct(db, draft);

    await expect(
      createProduct(db, { ...draft, name: "重複した商品" }),
    ).rejects.toMatchObject({ code: "duplicate_barcode" });
  });

  it("編集時も他の商品と同じバーコードを登録できない", async () => {
    const db = new FakeProductDatabase();
    await createProduct(db, draft);
    const secondProduct = await createProduct(db, {
      ...draft,
      name: "別の商品",
      barcode: "4900000000002",
    });

    await expect(
      updateProduct(db, secondProduct.id, {
        ...draft,
        name: "更新後の商品",
      }),
    ).rejects.toMatchObject({ code: "duplicate_barcode" });
  });
});

function makeProduct(
  id: number,
  name: string,
  rating: Product["rating"],
): Product {
  return {
    id,
    name,
    brand: "",
    barcode: null,
    imageUri: null,
    rating,
    note: "",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  };
}

function asString(value: SQLiteBindValue | undefined): string {
  return typeof value === "string" ? value : "";
}

function asNullableString(value: SQLiteBindValue | undefined): string | null {
  return typeof value === "string" ? value : null;
}

function asNumber(value: SQLiteBindValue | undefined): number {
  return typeof value === "number" ? value : Number(value ?? 0);
}

function asRating(value: SQLiteBindValue | undefined): Product["rating"] {
  if (
    value === "buy_again" ||
    value === "buy_if_cheap" ||
    value === "maybe" ||
    value === "never_again"
  ) {
    return value;
  }
  return "maybe";
}
