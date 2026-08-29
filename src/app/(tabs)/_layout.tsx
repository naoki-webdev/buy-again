import { Tabs } from "expo-router";
import { Text } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Colors } from "@/constants/theme";
import { useTranslation } from "@/i18n";

function TabIcon({ glyph, focused }: { glyph: string; focused: boolean }) {
  return (
    <Text
      style={{
        color: focused ? Colors.forest : "#A5AAA4",
        fontSize: 22,
        fontWeight: focused ? "800" : "400",
      }}
    >
      {glyph}
    </Text>
  );
}

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.forest,
        tabBarInactiveTintColor: "#A5AAA4",
        tabBarLabelStyle: { fontSize: 11, fontWeight: "700", marginBottom: 4 },
        tabBarStyle: {
          height: 70 + insets.bottom,
          paddingTop: 8,
          paddingBottom: Math.max(insets.bottom, 4),
          borderTopColor: Colors.border,
          backgroundColor: Colors.surface,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t("tabs.home"),
          tabBarIcon: ({ focused }) => <TabIcon glyph="⌂" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="products"
        options={{
          title: t("tabs.products"),
          tabBarIcon: ({ focused }) => <TabIcon glyph="☷" focused={focused} />,
        }}
      />
    </Tabs>
  );
}
