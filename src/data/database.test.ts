import type {
  SQLiteBindParams,
  SQLiteBindValue,
  SQLiteVariadicBindParams,
} from "expo-sqlite";

import {
  DATABASE_VERSION,
  migrateDatabase,
  type MigrationDatabase,
} from "@/data/database";

type LegacyProduct = {
  id: number;
  barcode: string | null;
};

class MigrationDatabaseStub implements MigrationDatabase {
  private version = 1;
  private rows: LegacyProduct[] = [
    { id: 1, barcode: "4900000000001" },
    { id: 2, barcode: "4900000000001" },
    { id: 3, barcode: "4900000000002" },
  ];
  private hasUniqueBarcodeIndex = false;

  async withTransactionAsync(task: () => Promise<void>): Promise<void> {
    await task();
  }

  getFirstAsync<T>(
    _source: string,
    _params: SQLiteBindParams,
  ): Promise<T | null>;
  getFirstAsync<T>(
    _source: string,
    ..._params: SQLiteVariadicBindParams
  ): Promise<T | null>;
  async getFirstAsync<T>(
    _source: string,
    _paramsOrFirst?: SQLiteBindParams | SQLiteBindValue,
    ..._params: SQLiteVariadicBindParams
  ): Promise<T | null> {
    return { user_version: this.version } as T;
  }

  async execAsync(source: string): Promise<void> {
    if (source.includes("UPDATE products")) {
      const latestIdByBarcode = new Map<string, number>();
      for (const row of this.rows) {
        if (row.barcode) {
          latestIdByBarcode.set(
            row.barcode,
            Math.max(latestIdByBarcode.get(row.barcode) ?? 0, row.id),
          );
        }
      }
      this.rows = this.rows.map((row) =>
        row.barcode && row.id < (latestIdByBarcode.get(row.barcode) ?? 0)
          ? { ...row, barcode: null }
          : row,
      );
    }

    if (source.includes("CREATE UNIQUE INDEX")) {
      const barcodes = this.rows.flatMap((row) =>
        row.barcode ? [row.barcode] : [],
      );
      if (new Set(barcodes).size !== barcodes.length) {
        throw new Error("UNIQUE constraint failed: products.barcode");
      }
      this.hasUniqueBarcodeIndex = true;
    }

    if (source.includes("PRAGMA user_version =")) {
      this.version = DATABASE_VERSION;
    }
  }

  getProduct(id: number): LegacyProduct | undefined {
    return this.rows.find((row) => row.id === id);
  }

  getVersion(): number {
    return this.version;
  }

  insertBarcode(barcode: string): void {
    if (
      this.hasUniqueBarcodeIndex &&
      this.rows.some((row) => row.barcode === barcode)
    ) {
      throw new Error("UNIQUE constraint failed: products.barcode");
    }
    this.rows.push({ id: 4, barcode });
  }
}

describe("database migration", () => {
  it("v1の重複バーコードを整理してv2の一意制約を有効にする", async () => {
    const db = new MigrationDatabaseStub();

    await migrateDatabase(db);

    expect(db.getVersion()).toBe(DATABASE_VERSION);
    expect(db.getProduct(1)?.barcode).toBeNull();
    expect(db.getProduct(2)?.barcode).toBe("4900000000001");
    expect(db.getProduct(3)?.barcode).toBe("4900000000002");
    expect(() => db.insertBarcode("4900000000001")).toThrow(
      "UNIQUE constraint failed",
    );
  });
});
