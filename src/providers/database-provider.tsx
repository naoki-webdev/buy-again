import type { PropsWithChildren } from "react";

import type { ProductDatabase } from "@/data/product-repository";

export function DatabaseProvider({ children }: PropsWithChildren) {
  return children;
}

export function useProductDatabase(): ProductDatabase {
  throw new Error("Platform database provider is not configured.");
}
