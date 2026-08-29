import { DefaultTheme, Stack, ThemeProvider } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect, type PropsWithChildren } from "react";

import { DatabaseErrorState } from "@/components/ui";
import { I18nProvider } from "@/i18n";
import {
  DatabaseProvider,
  useProductDatabase,
} from "@/providers/database-provider";
import { useProductStore } from "@/store/product-store";

SplashScreen.preventAutoHideAsync();

function AppDataLoader({ children }: PropsWithChildren) {
  const db = useProductDatabase();
  const hydrate = useProductStore((state) => state.hydrate);
  const isHydrated = useProductStore((state) => state.isHydrated);
  const error = useProductStore((state) => state.error);

  useEffect(() => {
    void hydrate(db);
  }, [db, hydrate]);

  useEffect(() => {
    if (isHydrated || error) {
      void SplashScreen.hideAsync();
    }
  }, [error, isHydrated]);

  if (error) {
    return <DatabaseErrorState onRetry={() => void hydrate(db)} />;
  }

  if (!isHydrated) {
    return null;
  }

  return children;
}

export default function RootLayout() {
  return (
    <I18nProvider>
      <ThemeProvider value={DefaultTheme}>
        <DatabaseProvider>
          <AppDataLoader>
            <StatusBar style="dark" />
            <Stack
              screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: "#F7F5EF" },
              }}
            >
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="scan" options={{ presentation: "modal" }} />
              <Stack.Screen name="add" />
              <Stack.Screen name="settings" />
              <Stack.Screen name="privacy" />
              <Stack.Screen name="product/[id]" />
              <Stack.Screen name="product/edit/[id]" />
            </Stack>
          </AppDataLoader>
        </DatabaseProvider>
      </ThemeProvider>
    </I18nProvider>
  );
}
