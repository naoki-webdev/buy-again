import type { SQLiteBindValue, SQLiteRunResult } from "expo-sqlite";

import type { Product, ProductDraft } from "@/domain/product";

export type ProductDatabase = {
  runAsync: (
    source: string,
    ...params: SQLiteBindValue[]
  ) => Promise<SQLiteRunResult>;
  getFirstAsync: <T>(
    source: string,
    ...params: SQLiteBindValue[]
  ) => Promise<T | null>;
  getAllAsync: <T>(
    source: string,
    ...params: SQLiteBindValue[]
  ) => Promise<T[]>;
};

export type ProductRow = {
  id: number;
  name: string;
  barcode: string | null;
  image_uri: string | null;
  rating: Product["rating"];
  note: string;
  created_at: string;
  updated_at: string;
};

function toProduct(row: ProductRow): Product {
  return {
    id: row.id,
    name: row.name,
    barcode: row.barcode,
    imageUri: row.image_uri,
    rating: row.rating,
    note: row.note,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function listProducts(db: ProductDatabase): Promise<Product[]> {
  const rows = await db.getAllAsync<ProductRow>(
    "SELECT * FROM products ORDER BY datetime(created_at) DESC, id DESC",
  );
  return rows.map(toProduct);
}

export async function getProductById(
  db: ProductDatabase,
  id: number,
): Promise<Product | null> {
  const row = await db.getFirstAsync<ProductRow>(
    "SELECT * FROM products WHERE id = ?",
    id,
  );
  return row ? toProduct(row) : null;
}

export async function findProductByBarcode(
  db: ProductDatabase,
  barcode: string,
): Promise<Product | null> {
  const normalizedBarcode = barcode.trim();
  if (normalizedBarcode.length === 0) {
    return null;
  }
  const row = await db.getFirstAsync<ProductRow>(
    "SELECT * FROM products WHERE barcode = ? ORDER BY datetime(created_at) DESC LIMIT 1",
    normalizedBarcode,
  );
  return row ? toProduct(row) : null;
}

export async function createProduct(
  db: ProductDatabase,
  draft: ProductDraft,
): Promise<Product> {
  const barcode = draft.barcode.trim();
  await ensureBarcodeIsAvailable(db, barcode);
  const now = new Date().toISOString();
  let result: SQLiteRunResult;
  try {
    result = await db.runAsync(
      `INSERT INTO products (name, barcode, image_uri, rating, note, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      draft.name.trim(),
      barcode || null,
      draft.imageUri,
      draft.rating,
      draft.note.trim(),
      now,
      now,
    );
  } catch (error) {
    throw normalizeWriteError(error);
  }
  const product = await getProductById(db, result.lastInsertRowId);
  if (!product) {
    throw new Error("商品を登録できませんでした。");
  }
  return product;
}

export async function updateProduct(
  db: ProductDatabase,
  id: number,
  draft: ProductDraft,
): Promise<Product> {
  const barcode = draft.barcode.trim();
  await ensureBarcodeIsAvailable(db, barcode, id);
  const now = new Date().toISOString();
  try {
    await db.runAsync(
      `UPDATE products
       SET name = ?, barcode = ?, image_uri = ?, rating = ?, note = ?, updated_at = ?
       WHERE id = ?`,
      draft.name.trim(),
      barcode || null,
      draft.imageUri,
      draft.rating,
      draft.note.trim(),
      now,
      id,
    );
  } catch (error) {
    throw normalizeWriteError(error);
  }
  const product = await getProductById(db, id);
  if (!product) {
    throw new Error("商品が見つかりません。");
  }
  return product;
}

export async function deleteProduct(
  db: ProductDatabase,
  id: number,
): Promise<void> {
  await db.runAsync("DELETE FROM products WHERE id = ?", id);
}

async function ensureBarcodeIsAvailable(
  db: ProductDatabase,
  barcode: string,
  exceptId?: number,
): Promise<void> {
  if (barcode.length === 0) {
    return;
  }

  const existing = await findProductByBarcode(db, barcode);
  if (existing && existing.id !== exceptId) {
    throw new Error(
      "このバーコードの商品はすでに登録されています。既存の記録を編集してください。",
    );
  }
}

function normalizeWriteError(error: unknown): Error | unknown {
  if (
    error instanceof Error &&
    /unique constraint failed: products\.barcode/i.test(error.message)
  ) {
    return new Error(
      "このバーコードの商品はすでに登録されています。既存の記録を編集してください。",
    );
  }
  return error;
}
