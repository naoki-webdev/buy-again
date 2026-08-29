export type ProductErrorCode =
  "duplicate_barcode" | "product_not_found" | "register_failed";

export class ProductError extends Error {
  readonly code: ProductErrorCode;

  constructor(code: ProductErrorCode, message: string) {
    super(message);
    this.name = "ProductError";
    this.code = code;
  }
}
