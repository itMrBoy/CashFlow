import React, { useEffect, useState, useMemo } from "react";
import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BrutaCard } from "@/components/ui/BrutaCard";
import { BrutaButton } from "@/components/ui/BrutaButton";
import { Smile } from "@/components/ui/Smile";
import { StatusEmoji } from "@/components/ui/StatusEmoji";
import { useRouter } from "expo-router";
import { useFabController } from "@/hooks/useFabController";
import { BrutaFab } from "@/components/ui/BrutaFab";
import { Plus, Calendar } from "lucide-react-native";
import { useStore, getRangeFromPeriod } from "@/store/useStore";
import { useShakeReset } from "@/hooks/useShakeReset";
import { getFilteredTotals, getSubscriptions } from "@/lib/db";
import dayjs from "dayjs";
import { Subscription } from "@/types/database";
import { cn } from "@/lib/utils";

// 辅助计算订阅在指定周期内的总额
const calculateSubscriptionsInRange = (
  subscriptions: Subscription[],
  start: string,
  end: string,
) => {
  const startDate = dayjs(start).startOf("day");
  const endDate = dayjs(end).endOf("day");

  return subscriptions.reduce((acc, sub) => {
    const firstDate = dayjs(sub.first_billing_date);
    if (firstDate.isAfter(endDate)) return acc;

    let nextDate = firstDate;
    const cycle = sub.cycle;

    let subTotal = 0;
    while (nextDate.isBefore(endDate.add(1, "ms"))) {
      if (nextDate.isAfter(startDate.subtract(1, "ms"))) {
        subTotal += sub.amount;
      }
      if (cycle === "monthly") nextDate = nextDate.add(1, "month");
      else if (cycle === "quarterly") nextDate = nextDate.add(3, "month");
      else if (cycle === "yearly") nextDate = nextDate.add(1, "year");
      else break;
    }
    return acc + subTotal;
  }, 0);
};

export default function Dashboard() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { fabAnim, fabScrollProps } = useFabController();
  const { refreshKey, dashboardPeriod, setGlobalEmojiStatus, globalEmojiStatus, setFilters, setDashboardPeriod } = useStore();

  const [totals, setTotals] = useState({ income: 0, expense: 0 });
  const [fixedExpense, setFixedExpense] = useState(0);
  const [loading, setLoading] = useState(true);

  useShakeReset(() => {
    setDashboardPeriod('this_month');
  }, dashboardPeriod !== 'this_month');

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      setLoading(true);
      const range = getRangeFromPeriod(dashboardPeriod);
      const transTotals = await getFilteredTotals({
        type: 'all',
        categories: [],
        dateRange: range,
        searchQuery: ''
      });
      setTotals(transTotals);

      const subs = await getSubscriptions();
      const fixed = calculateSubscriptionsInRange(
        subs,
        range.start,
        range.end,
      );
      setFixedExpense(fixed);
    } catch (error) {
      console.error("Fetch dashboard data failed:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [refreshKey, dashboardPeriod]);

  const availableBalance = useMemo(() => {
    return totals.income - totals.expense - fixedExpense;
  }, [totals, fixedExpense]);

  const progressPercent = useMemo(() => {
    const totalSpent = totals.expense + fixedExpense;
    if (totals.income === 0) return totalSpent > 0 ? 100 : 0;
    return Math.min(100, (totalSpent / totals.income) * 100);
  }, [totals, fixedExpense]);

  const emojiStatus = useMemo(() => {
    if (availableBalance < 0) return 'angry';
    if (progressPercent >= 70) return 'bad';
    return 'smile';
  }, [availableBalance, progressPercent]);

  useEffect(() => {
    setGlobalEmojiStatus(emojiStatus);
  }, [emojiStatus, setGlobalEmojiStatus]);

  const progressColor = useMemo(() => {
    const totalSpent = totals.expense + fixedExpense;
    if (totals.income === 0 && totalSpent > 0) return "bg-[#FF4911]";
    const ratio = totals.income > 0 ? totalSpent / totals.income : 0;

    if (ratio >= 1) return "bg-[#FF4911]"; // 示警红
    if (ratio >= 0.3) return "bg-brand-yellow"; // 暖色系
    return "bg-brand-blue"; // 浅色系 (冰川蓝)
  }, [totals, fixedExpense]);

  const periodLabel = useMemo(() => {
    switch (dashboardPeriod) {
      case "this_month":
        return "本月 (THIS MONTH)";
      case "last_month":
        return "上月 (LAST MONTH)";
      case "last_30_days":
        return "最近30天 (LAST 30 DAYS)";
      case "this_year":
        return "今年 (THIS YEAR)";
      default:
        return "选择周期";
    }
  }, [dashboardPeriod]);

  return (
    <View className="flex-1 bg-[#F4F4F0]">
      {/* Header */}
      <View
        style={{ paddingTop: insets.top + 24 }}
        className="px-6 pb-6 flex-row items-center justify-between"
      >
        <Text className="text-2xl font-black text-black uppercase tracking-tighter">
          数据看板
        </Text>
        <StatusEmoji status={emojiStatus} />
      </View>

      <ScrollView
        className="flex-1 px-6"
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
        {...fabScrollProps}
      >
        {/* Period Switcher Button (Qq1Rv) */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => router.push("/(modals)/period-selector")}
          className="mb-8"
        >
          <View className="relative">
            <View className="absolute top-1 left-1 w-full h-full bg-black rounded-sm" />
            <View className="bg-white border-[3px] border-black px-4 py-3 flex-row items-center justify-between rounded-sm">
              <View className="flex-row items-center gap-2">
                <Calendar size={20} color="#000" strokeWidth={3} />
                <Text className="text-sm font-black uppercase text-black">
                  {periodLabel}
                </Text>
              </View>
              <Text className="text-black font-black">▼</Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* Core Calculation Area (n9NUT) */}
        <View className="gap-6">
          {/* Main Card: Available Balance */}
          <BrutaCard bgClassName="bg-white" className="p-6">
            <Text className="text-[10px] font-black text-black/50 uppercase tracking-widest mb-1">
              当前结余 (AVAILABLE)
            </Text>
            <Text className="text-[42px] font-black text-black leading-none mb-6">
              ¥
              {availableBalance.toLocaleString(undefined, {
                minimumFractionDigits: 2,
              })}
            </Text>

            {/* Progress Bar */}
            <View className="gap-2">
              <View className="flex-row justify-between items-end">
                <View className="flex-row items-center gap-2">
                  <Text className="text-[10px] font-black text-black uppercase">
                    支出占比 (SPENDING)
                  </Text>
                  <Text className="text-[10px] font-black text-black/60 uppercase">
                    ¥
                    {(totals.expense + fixedExpense).toLocaleString(undefined, {
                      maximumFractionDigits: 0,
                    })}{" "}
                    / ¥
                    {totals.income.toLocaleString(undefined, {
                      maximumFractionDigits: 0,
                    })}
                  </Text>
                </View>
                <Text className="text-xs font-black text-black">
                  {progressPercent.toFixed(0)}%
                </Text>
              </View>
              <View className="h-7 w-full border-[3px] border-black bg-white rounded-sm overflow-hidden">
                <View
                  style={{ width: `${progressPercent}%` }}
                  className={cn(
                    "h-full border-r-[3px] border-black",
                    progressColor,
                  )}
                />
              </View>
            </View>
          </BrutaCard>

          {/* Compact Data Cards Overlay */}
          <View className="gap-4">
            {/* Total Income Card - Full Width, Slimmer */}
            <BrutaCard
              bgClassName="bg-brand-green"
              className="flex-row justify-between items-center py-4 px-6"
            >
              <Text className="text-xs font-black text-black uppercase opacity-60">
                总收入 (INCOME)
              </Text>
              <Text className="text-xl font-black text-black">
                +¥
                {totals.income.toLocaleString(undefined, {
                  maximumFractionDigits: 0,
                })}
              </Text>
            </BrutaCard>

            <View className="flex-row gap-4">
              {/* Total Expenses Card - Ice Blue for outgoing flow */}
              <BrutaCard
                bgClassName="bg-brand-blue"
                containerClassName="flex-1"
                className="justify-between p-4 min-h-[100px]"
              >
                <Text className="text-[10px] font-black text-black uppercase opacity-60">
                  总支出 (TOTAL EXP)
                </Text>
                <Text className="text-xl font-black text-black">
                  -¥
                  {(totals.expense + fixedExpense).toLocaleString(undefined, {
                    maximumFractionDigits: 0,
                  })}
                </Text>
              </BrutaCard>

              {/* Fixed Expenses Card - Yellow for static/warning */}
              <BrutaCard
                bgClassName="bg-brand-yellow"
                containerClassName="flex-1"
                className="justify-between p-4 min-h-[100px]"
              >
                <Text className="text-[10px] font-black text-black uppercase opacity-60">
                  订阅支出 (FIXED)
                </Text>
                <Text className="text-xl font-black text-black">
                  -¥
                  {fixedExpense.toLocaleString(undefined, {
                    maximumFractionDigits: 0,
                  })}
                </Text>
              </BrutaCard>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View className="mt-8 gap-4">
          <BrutaButton
            title="历史账单 (HISTORY)"
            bgClassName="bg-white"
            onPress={() => {
              const range = getRangeFromPeriod(dashboardPeriod);
              setFilters({ dateRange: range });
              router.push("/(tabs)/transactions");
            }}
          />
          <BrutaButton
            title="管理订阅 (SUBSCRIPTIONS)"
            bgClassName="bg-white"
            onPress={() => router.push("/(tabs)/subscriptions")}
          />
        </View>
      </ScrollView>

      {/* FAB - Adjusted position to avoid overlap with tab bar */}
      <View className="absolute right-6 bottom-10">
        <BrutaFab
          onPress={() => router.push("/(modals)/add-record")}
          animValue={fabAnim}
          bgClassName="bg-brand-orange"
          icon={<Plus size={32} color="#000" strokeWidth={4} />}
        />
      </View>
    </View>
  );
}
