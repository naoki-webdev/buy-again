import type { SQLiteBindValue, SQLiteRunResult } from "expo-sqlite";

import {
  type ProductDatabase,
  type ProductRow,
} from "@/data/product-repository";
import type { ProductDraft, Rating } from "@/domain/product";
import { createProduct } from "@/data/product-repository";
import { useProductStore } from "@/store/product-store";

class MemoryProductDatabase implements ProductDatabase {
  private readonly rows = new Map<number, ProductRow>();
  private nextId = 1;

  async runAsync(
    source: string,
    ...params: SQLiteBindValue[]
  ): Promise<SQLiteRunResult> {
    if (source.includes("INSERT INTO products")) {
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
      const id = this.nextId++;
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
    const row = source.includes("barcode")
      ? Array.from(this.rows.values()).find(
          (item) => item.barcode === asString(params[0]),
        )
      : this.rows.get(asNumber(params[0]));
    return (row as T | undefined) ?? null;
  }

  async getAllAsync<T>(): Promise<T[]> {
    return Array.from(this.rows.values()).sort(
      (left, right) => right.id - left.id,
    ) as T[];
  }
}

class FailingProductDatabase implements ProductDatabase {
  async runAsync(): Promise<SQLiteRunResult> {
    throw new Error("database unavailable");
  }

  async getFirstAsync<T>(): Promise<T | null> {
    return null;
  }

  async getAllAsync<T>(): Promise<T[]> {
    throw new Error("database unavailable");
  }
}

const draft: ProductDraft = {
  name: "テスト商品",
  brand: "テストブランド",
  barcode: "4900000000001",
  imageUri: null,
  rating: "buy_again",
  note: "メモ",
};

describe("product store", () => {
  beforeEach(() => {
    useProductStore.setState({
      products: [],
      isHydrated: false,
      isLoading: false,
      error: null,
    });
  });

  it("hydrateでDBの記録を読み込み、CRUD後の状態を更新する", async () => {
    const db = new MemoryProductDatabase();
    const existing = await createProduct(db, draft);

    await useProductStore.getState().hydrate(db);
    expect(useProductStore.getState().products).toEqual([existing]);
    expect(useProductStore.getState().isHydrated).toBe(true);

    const added = await useProductStore.getState().add(db, {
      ...draft,
      barcode: "4900000000002",
      name: "追加商品",
    });
    expect(useProductStore.getState().products[0]).toEqual(added);

    const updated = await useProductStore.getState().update(db, added.id, {
      ...draft,
      barcode: "4900000000002",
      name: "更新商品",
      rating: "maybe",
    });
    expect(useProductStore.getState().products).toContainEqual(updated);

    await useProductStore.getState().remove(db, added.id);
    expect(useProductStore.getState().products).toEqual([existing]);
  });

  it("hydrate失敗時はエラー状態にする", async () => {
    await useProductStore.getState().hydrate(new FailingProductDatabase());

    expect(useProductStore.getState()).toMatchObject({
      isLoading: false,
      isHydrated: false,
      error: "database unavailable",
    });
  });
});

function asString(value: SQLiteBindValue | undefined): string {
  return typeof value === "string" ? value : "";
}

function asNullableString(value: SQLiteBindValue | undefined): string | null {
  return typeof value === "string" ? value : null;
}

function asNumber(value: SQLiteBindValue | undefined): number {
  return typeof value === "number" ? value : Number(value ?? 0);
}

function asRating(value: SQLiteBindValue | undefined): Rating {
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
