import type { SQLiteBindValue, SQLiteRunResult } from "expo-sqlite";

import {
  createProduct,
  deleteProduct,
  findProductByBarcode,
  getProductById,
  listProducts,
  updateProduct,
  type ProductDatabase,
  type ProductRow,
} from "@/data/product-repository";

export {
  createProduct,
  deleteProduct,
  findProductByBarcode,
  getProductById,
  listProducts,
  updateProduct,
};
export type { ProductDatabase, ProductRow } from "@/data/product-repository";

export const DATABASE_VERSION = 3;

class WebProductDatabase implements ProductDatabase {
  private rows: ProductRow[] = readRows();
  private nextId =
    this.rows.reduce((highest, row) => Math.max(highest, row.id), 0) + 1;

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
      this.rows.push({
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
      this.persist();
      return { lastInsertRowId: id, changes: 1 };
    }

    if (source.includes("UPDATE products")) {
      const [name, brand, barcode, imageUri, rating, note, updatedAt, idValue] =
        params;
      const id = asNumber(idValue);
      const row = this.rows.find((item) => item.id === id);
      if (row) {
        Object.assign(row, {
          name: asString(name),
          brand: asString(brand),
          barcode: asNullableString(barcode),
          image_uri: asNullableString(imageUri),
          rating: asRating(rating),
          note: asString(note),
          updated_at: asString(updatedAt),
        });
        this.persist();
      }
      return { lastInsertRowId: 0, changes: row ? 1 : 0 };
    }

    const id = asNumber(params[0]);
    const before = this.rows.length;
    this.rows = this.rows.filter((row) => row.id !== id);
    this.persist();
    return { lastInsertRowId: 0, changes: before === this.rows.length ? 0 : 1 };
  }

  async getFirstAsync<T>(
    source: string,
    ...params: SQLiteBindValue[]
  ): Promise<T | null> {
    const row = source.includes("barcode")
      ? this.rows.find((item) => item.barcode === asString(params[0]))
      : this.rows.find((item) => item.id === asNumber(params[0]));
    return (row as T | undefined) ?? null;
  }

  async getAllAsync<T>(
    _source: string,
    ..._params: SQLiteBindValue[]
  ): Promise<T[]> {
    return [...this.rows].sort((left, right) => right.id - left.id) as T[];
  }

  private persist(): void {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem("buy-again-products", JSON.stringify(this.rows));
    }
  }
}

const webDatabase = new WebProductDatabase();

export function getWebDatabase(): ProductDatabase {
  return webDatabase;
}

export async function migrateDatabase(): Promise<void> {
  return Promise.resolve();
}

function readRows(): ProductRow[] {
  if (typeof localStorage === "undefined") {
    return [];
  }
  try {
    const raw: string | null = localStorage.getItem("buy-again-products");
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.filter(isProductRow).map((row) => ({
          ...row,
          brand: row.brand ?? "",
        }))
      : [];
  } catch {
    return [];
  }
}

function isProductRow(value: unknown): value is ProductRow {
  if (typeof value !== "object" || value === null) return false;
  const row = value as Partial<ProductRow>;
  return (
    typeof row.id === "number" &&
    typeof row.name === "string" &&
    typeof row.created_at === "string" &&
    typeof row.updated_at === "string"
  );
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
function asRating(value: SQLiteBindValue | undefined): ProductRow["rating"] {
  return value === "buy_again" ||
    value === "buy_if_cheap" ||
    value === "maybe" ||
    value === "never_again"
    ? value
    : "maybe";
}
