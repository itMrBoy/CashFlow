import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Animated,
  LayoutAnimation,
  Platform,
  UIManager,
} from "react-native";

if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useStore } from "@/store/useStore";
import { getSubscriptions } from "@/lib/db";
import { Subscription } from "@/types/database";
import { BrutaCard } from "@/components/ui/BrutaCard";
import { cn } from "@/lib/utils";
import dayjs from "dayjs";
import { Smile } from "@/components/ui/Smile";
import { StatusEmoji } from "@/components/ui/StatusEmoji";
import { Ionicons } from "@expo/vector-icons";
import { ArrowLeft, Plus, ArrowUp, Pencil } from "lucide-react-native";
import { useScrollController } from "@/hooks/useScrollController";
import { BrutaFab } from "@/components/ui/BrutaFab";
import { SwipeableShatterRow } from "@/components/ui/SwipeableShatterRow";
import { CircleButton } from "@/components/ui/CircleButton";
import { deleteSubscription } from "@/lib/db";

const CATEGORY_COLORS: Record<string, string> = {
  视频VIP: "#FF4911",
  音乐VIP: "#B088F9",
  AI: "#5CE1E6",
  工具: "#FFE600",
  其他: "#CCFF00",
};

export default function SubscriptionsPage() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const triggerRefresh = useStore((state) => state.triggerRefresh);
  const refreshKey = useStore((state) => state.refreshKey);
  const globalEmojiStatus = useStore((state) => state.globalEmojiStatus);

  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const {
    fabAnim,
    topBtnAnim,
    showTopBtn,
    flatListRef,
    scrollToTop,
    scrollProps,
  } = useScrollController();

  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const toggleExpand = (id: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  useEffect(() => {
    loadSubscriptions();
  }, [refreshKey]);

  const loadSubscriptions = async () => {
    try {
      const data = await getSubscriptions();
      setSubscriptions(data);
    } catch (error) {
      console.error("Failed to load subscriptions:", error);
    } finally {
      setLoading(false);
    }
  };

  const monthlyAverage = useMemo(() => {
    return subscriptions.reduce((acc, sub) => {
      let monthlyAmount = sub.amount;
      if (sub.cycle === "quarterly") monthlyAmount = sub.amount / 3;
      if (sub.cycle === "yearly") monthlyAmount = sub.amount / 12;
      return acc + monthlyAmount;
    }, 0);
  }, [subscriptions]);

  const calculateNextPayment = (sub: Subscription) => {
    const today = dayjs().startOf("day");
    const firstDate = dayjs(sub.first_billing_date);

    if (today.isBefore(firstDate)) {
      return {
        date: firstDate,
        days: firstDate.diff(today, "day"),
      };
    }

    let nextDate = firstDate;
    const cycle = sub.cycle;

    while (nextDate.isBefore(today)) {
      if (cycle === "monthly") nextDate = nextDate.add(1, "month");
      else if (cycle === "quarterly") nextDate = nextDate.add(3, "month");
      else if (cycle === "yearly") nextDate = nextDate.add(1, "year");
    }

    return {
      date: nextDate,
      days: nextDate.diff(today, "day"),
    };
  };

  const monthlySum = useMemo(() => {
    const startOfMonth = dayjs().startOf("month");
    const endOfMonth = dayjs().endOf("month");

    return subscriptions.reduce((acc, sub) => {
      const firstDate = dayjs(sub.first_billing_date);
      if (firstDate.isAfter(endOfMonth)) return acc;

      let checkDate = firstDate;
      const cycle = sub.cycle;

      while (checkDate.isBefore(startOfMonth)) {
        if (cycle === "monthly") checkDate = checkDate.add(1, "month");
        else if (cycle === "quarterly") checkDate = checkDate.add(3, "month");
        else if (cycle === "yearly") checkDate = checkDate.add(1, "year");
      }

      const hasPaymentThisMonth = checkDate.isBefore(endOfMonth.add(1, "ms"));
      return hasPaymentThisMonth ? acc + sub.amount : acc;
    }, 0);
  }, [subscriptions]);

  const renderSubscriptionItem = ({ item }: { item: Subscription }) => {
    const nextPayment = calculateNextPayment(item);
    const isUrgent = nextPayment.days <= 5;

    const cycleText =
      item.cycle === "monthly"
        ? "月付"
        : item.cycle === "quarterly"
          ? "季付"
          : "年付";
    const categoryColor = CATEGORY_COLORS[item.category] || "#F4F4F0";
    const isExpanded = expandedIds.has(item.id);

    return (
      <SwipeableShatterRow
        onDelete={async () => {
          await deleteSubscription(item.id);
          triggerRefresh();
        }}
      >
        <BrutaCard
          bgClassName="bg-white"
          containerClassName="mb-4"
          className="flex-row items-center justify-between"
        >
          {/* Left Side: Info */}
          <View className="flex-1 justify-center pr-2">
            <View className="flex-row items-center gap-2 flex-wrap">
              <Text className="text-lg font-black text-black uppercase leading-tight">
                {item.name}
              </Text>
              {/* Cycle Pill */}
              <View className="bg-black px-1.5 py-0.5 border-[2px] border-black">
                <Text className="text-[10px] font-black text-white uppercase">
                  {cycleText}
                </Text>
              </View>

              <Text className="text-xs font-bold text-black/50 mt-1.5 uppercase">
                ¥{item.amount.toFixed(2)}
              </Text>
            </View>

            {/* Row 2: Date + Category */}
            <View className="flex-row items-center gap-3 mt-1.5">
              <Text className="text-[11px] text-[#999999] font-bold">
                {dayjs(item.first_billing_date).format("YYYY-MM-DD HH:mm:ss")}
              </Text>
              {item.category && (
                <View
                  style={{
                    backgroundColor: categoryColor,
                    elevation: 2,
                    shadowColor: "#000",
                    shadowOffset: { width: 2, height: 2 },
                    shadowOpacity: 1,
                    shadowRadius: 0,
                  }}
                  className="px-2 py-0.5 border-2 border-black rounded-[2px]"
                >
                  <Text className="text-[10px] font-black text-black uppercase">
                    {item.category}
                  </Text>
                </View>
              )}
            </View>

            {/* Note Display */}
            {item.note && (
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => toggleExpand(item.id)}
                className="mt-2"
              >
                <Text
                  numberOfLines={isExpanded ? 0 : 1}
                  className="text-xs text-[#666666] font-medium"
                >
                  {item.note}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Right Side: Days Box */}
          <View
            className={cn(
              "px-3 py-1.5 border-[3px] border-black flex-row items-center gap-1 shadow-[2px_2px_0px_#000]",
              isUrgent ? "bg-[#FF4911]" : "bg-white",
            )}
          >
            {isUrgent && (
              <Ionicons name="alert-circle" size={16} color="white" />
            )}
            <Text
              className={cn(
                "font-black text-xs",
                isUrgent ? "text-white" : "text-black",
              )}
            >
              {isUrgent
                ? `仅剩 ${nextPayment.days} 天`
                : `还有 ${nextPayment.days} 天`}
            </Text>
          </View>

          {/* Edit Button */}
          <TouchableOpacity
            onPress={() =>
              router.push({
                pathname: "/(modals)/add-subscription",
                params: { data: JSON.stringify(item) },
              })
            }
            className="w-8 h-8 bg-[#5CE1E6] border-2 border-black rounded-sm items-center justify-center ml-3 shadow-[2px_2px_0px_#000]"
          >
            <Pencil size={14} color="#000" strokeWidth={3} />
          </TouchableOpacity>
        </BrutaCard>
      </SwipeableShatterRow>
    );
  };

  return (
    <View className="flex-1 bg-[#F4F4F0]">
      {/* Top Bar */}
      <View
        style={{ paddingTop: insets.top + 24 }}
        className="px-6 pb-6 flex-row items-center justify-between"
      >
        <Text className="text-2xl font-black text-black uppercase tracking-tighter">
          订阅列表
        </Text>
        <StatusEmoji status={globalEmojiStatus} />
      </View>

      {/* Monthly Average Card - Fixed */}
      <View className="px-6 mb-6">
        <BrutaCard bgClassName="bg-[#5CE1E6]" className="p-6">
          <View className="flex-row justify-between items-end">
            <View className="flex-1">
              <Text className="text-[10px] font-black text-black uppercase opacity-60">
                每月平均订阅花费 (MONTHLY AVG)
              </Text>
              <Text className="text-[32px] font-black text-black mt-1">
                ¥{monthlyAverage.toFixed(2)}
              </Text>
            </View>
            <View className="items-end">
              <Text className="text-[10px] font-black text-black uppercase opacity-60">
                本月实际支出 (SUM)
              </Text>
              <Text className="text-2xl font-black text-black">
                ¥{monthlySum.toFixed(2)}
              </Text>
            </View>
          </View>
        </BrutaCard>
      </View>

      <FlatList
        ref={flatListRef}
        data={subscriptions}
        keyExtractor={(item) => item.id}
        renderItem={renderSubscriptionItem}
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
        {...scrollProps}
        ListEmptyComponent={
          <View className="py-20 items-center">
            <Text className="text-lg font-black text-[#999999] uppercase">
              {loading ? "加载中..." : "快来记一笔吧！！！ 💰"}
            </Text>
          </View>
        }
      />

      {/* Buttons */}
      <View
        pointerEvents="box-none"
        className="absolute right-6 bottom-10 gap-4 items-center"
      >
        {/* Back to Top */}
        <Animated.View
          style={{
            opacity: topBtnAnim,
            transform: [{ scale: topBtnAnim }],
          }}
          pointerEvents={showTopBtn ? "auto" : "none"}
        >
          <CircleButton
            onPress={scrollToTop}
            bgClassName="bg-[#5CE1E6]"
            icon={<ArrowUp size={28} color="#000" strokeWidth={3} />}
          />
        </Animated.View>

        {/* FAB */}
        <BrutaFab
          onPress={() => router.push("/(modals)/add-subscription")}
          animValue={fabAnim}
          bgClassName="bg-[#FF4911]"
          icon={<Plus size={32} color="#000" strokeWidth={4} />}
        />
      </View>
    </View>
  );
}
