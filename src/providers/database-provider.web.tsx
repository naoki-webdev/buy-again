import type { PropsWithChildren } from "react";

import { getWebDatabase } from "@/data/database.web";
import type { ProductDatabase } from "@/data/product-repository";

export function DatabaseProvider({ children }: PropsWithChildren) {
  return children;
}

export function useProductDatabase(): ProductDatabase {
  return getWebDatabase();
}
