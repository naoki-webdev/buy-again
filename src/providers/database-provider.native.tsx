import { SQLiteProvider, useSQLiteContext } from "expo-sqlite";
import { useEffect, useState, type PropsWithChildren } from "react";
import * as SplashScreen from "expo-splash-screen";

import { DatabaseErrorState } from "@/components/ui";
import { migrateDatabase } from "@/data/database";
import type { ProductDatabase } from "@/data/product-repository";

export function DatabaseProvider({ children }: PropsWithChildren) {
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (error) {
      void SplashScreen.hideAsync();
    }
  }, [error]);

  if (error) {
    return <DatabaseErrorState onRetry={() => setError(null)} />;
  }

  return (
    <SQLiteProvider
      databaseName="buy-again.db"
      onInit={migrateDatabase}
      onError={setError}
    >
      {children}
    </SQLiteProvider>
  );
}

export function useProductDatabase(): ProductDatabase {
  return useSQLiteContext();
}
