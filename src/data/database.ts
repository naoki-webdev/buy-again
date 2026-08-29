import type { SQLiteDatabase } from "expo-sqlite";

import {
  createProduct,
  deleteProduct,
  findProductByBarcode,
  getProductById,
  listProducts,
  updateProduct,
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

export const DATABASE_VERSION = 2;

export async function migrateDatabase(db: SQLiteDatabase): Promise<void> {
  await db.withTransactionAsync(async () => {
    const versionRow = await db.getFirstAsync<{ user_version: number }>(
      "PRAGMA user_version",
    );
    const currentVersion = versionRow?.user_version ?? 0;

    if (currentVersion > DATABASE_VERSION) {
      throw new Error(
        `このアプリが対応していないデータベースバージョンです（${currentVersion}）。`,
      );
    }

    if (currentVersion < 1) {
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS products (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          barcode TEXT,
          image_uri TEXT,
          rating TEXT NOT NULL CHECK (rating IN ('buy_again', 'buy_if_cheap', 'maybe', 'never_again')),
          note TEXT NOT NULL DEFAULT '',
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL
        );
        CREATE INDEX IF NOT EXISTS idx_products_created_at ON products(created_at DESC);
      `);
    }

    if (currentVersion < 2) {
      await db.execAsync(`
        UPDATE products
        SET barcode = NULL
        WHERE barcode IS NOT NULL
          AND id < (
            SELECT MAX(duplicate.id)
            FROM products AS duplicate
            WHERE duplicate.barcode = products.barcode
          );
        DROP INDEX IF EXISTS idx_products_barcode;
        CREATE UNIQUE INDEX IF NOT EXISTS idx_products_barcode_unique
          ON products(barcode)
          WHERE barcode IS NOT NULL;
      `);
    }

    await db.execAsync(`PRAGMA user_version = ${DATABASE_VERSION}`);
  });
}
