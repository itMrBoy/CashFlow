import { Tabs } from "expo-router";
import { View, TouchableOpacity } from "react-native";
import { LayoutDashboard, List, CreditCard, Settings } from "lucide-react-native";
import { cn } from "../../lib/utils";

function CustomTabBar({ state, descriptors, navigation }: any) {
  return (
    <View className="flex-row h-[88px] bg-white border-t-4 border-black px-6 pt-4 pb-8 justify-between">
      {state.routes.map((route: any, index: number) => {
        const isFocused = state.index === index;

        const onPress = () => {
          const event = navigation.emit({
            type: "tabPress",
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name, route.params);
          }
        };

        let Icon = LayoutDashboard;
        if (route.name === "transactions") Icon = List;
        if (route.name === "subscriptions") Icon = CreditCard;
        if (route.name === "settings") Icon = Settings;

        return (
          <TouchableOpacity
            key={route.key}
            onPress={onPress}
            className="flex-1 items-center gap-2"
            activeOpacity={1}
          >
            {/* Indicator */}
            <View
              className={cn(
                "w-8 h-1",
                isFocused ? "bg-black" : "bg-transparent",
              )}
            />
            {/* Icon */}
            <Icon
              size={28}
              color="#000000"
              strokeWidth={isFocused ? 3 : 2}
              style={{ opacity: isFocused ? 1 : 0.5 }}
            />
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="transactions" />
      <Tabs.Screen name="subscriptions" />
      <Tabs.Screen name="settings" />
    </Tabs>
  );
}
