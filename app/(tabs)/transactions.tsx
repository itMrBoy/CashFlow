import React, {
  useEffect,
  useState,
  useCallback,
  useRef,
  useMemo,
} from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  LayoutAnimation,
  Platform,
  UIManager,
  Animated as RNAnimated,
  ScrollView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusEmoji } from "@/components/ui/StatusEmoji";
import { useRouter } from "expo-router";
import {
  Utensils,
  Car,
  ShoppingBag,
  Gamepad2,
  Home,
  DollarSign,
  Gift,
  CreditCard as CardIcon,
  Search,
  Plus,
  ArrowUp,
  X,
  Pencil,
} from "lucide-react-native";
import { BrutaCard } from "@/components/ui/BrutaCard";
import { BrutaInput } from "@/components/ui/BrutaInput";
import { BrutaButton } from "@/components/ui/BrutaButton";
import { CircleButton } from "@/components/ui/CircleButton";
import {
  useStore,
  isDefaultDateRange,
  isInitialFilters,
} from "@/store/useStore";
import {
  getTransactions,
  getFilteredTotals,
  deleteTransaction,
} from "@/lib/db";
import { Transaction } from "@/types/database";
import { SwipeableShatterRow } from "@/components/ui/SwipeableShatterRow";
import { cn } from "@/lib/utils";
import dayjs from "dayjs";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolate,
} from "react-native-reanimated";
import { useFabController } from "@/hooks/useFabController";
import { BrutaFab } from "@/components/ui/BrutaFab";
import { useShakeReset } from "@/hooks/useShakeReset";

if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const CATEGORY_COLORS: Record<string, string> = {
  餐饮: "#FFE600",
  交通: "#5CE1E6",
  购物: "#FF4911",
  娱乐: "#B088F9",
  房租: "#CCFF00",
  工资: "#CCFF00",
  礼金: "#FFE600",
  债务: "#5CE1E6",
  其他: "#F4F4F0",
};

const CATEGORY_ICONS: Record<string, any> = {
  餐饮: Utensils,
  交通: Car,
  购物: ShoppingBag,
  娱乐: Gamepad2,
  房租: Home,
  工资: DollarSign,
  礼金: Gift,
  债务: CardIcon,
  其他: DollarSign,
};

function SummaryBar({
  totals,
}: {
  totals: { income: number; expense: number };
}) {
  const [widthInfo, setWidthInfo] = useState({
    container: 0,
    income: 0,
    expense: 0,
    balance: 0,
  });
  const balanceValue = totals.income - totals.expense;
  const isBadge = useSharedValue(0); // 0: Normal, 1: Badge Mode

  useEffect(() => {
    const totalContentWidth =
      widthInfo.income + widthInfo.expense + widthInfo.balance;
    const padding = 48; // px-6 * 2

    if (widthInfo.container > 0 && totalContentWidth > 0) {
      const freeSpace = widthInfo.container - padding - totalContentWidth;
      // When spacing between elements is small, fly to corner
      if (freeSpace < 20) {
        isBadge.value = withSpring(1);
      } else {
        isBadge.value = withSpring(0);
      }
    }
  }, [widthInfo, totals]);

  const balanceStyle = useAnimatedStyle(() => {
    return {
      opacity: 1 - isBadge.value,
      transform: [{ scale: 1 - isBadge.value }],
    };
  });

  const badgeStyle = useAnimatedStyle(() => {
    const scale = isBadge.value;
    const rotate = isBadge.value * 15;
    return {
      opacity: isBadge.value,
      transform: [
        { scale: withSpring(scale, { damping: 10, stiffness: 100 }) },
        { rotate: `${rotate}deg` },
        { translateY: interpolate(isBadge.value, [0, 1], [30, 0]) }, // Fly from inside to corner
        { translateX: interpolate(isBadge.value, [0, 1], [-50, 0]) },
      ],
    };
  });

  return (
    <View pointerEvents="box-none" className="px-6 mb-8 mt-2 relative">
      <BrutaCard
        onLayout={(e) => {
          const { width } = e.nativeEvent.layout;
          setWidthInfo((v) => ({ ...v, container: width }));
        }}
        bgClassName="bg-brand-yellow"
        className="flex-row justify-between items-center px-6 py-4 border-[3px]"
      >
        <View
          onLayout={(e) => {
            const { width } = e.nativeEvent.layout;
            setWidthInfo((v) => ({ ...v, income: width }));
          }}
          className="items-start"
        >
          <Text className="text-[10px] font-black text-black uppercase opacity-60">
            收入
          </Text>
          <Text className="text-xl font-black text-black">
            +
            {totals.income.toLocaleString(undefined, {
              minimumFractionDigits: 2,
            })}
          </Text>
        </View>

        <View
          onLayout={(e) => {
            const { width } = e.nativeEvent.layout;
            setWidthInfo((v) => ({ ...v, expense: width }));
          }}
          className="items-start"
        >
          <Text className="text-[10px] font-black text-black uppercase opacity-60">
            支出
          </Text>
          <Text className="text-xl font-black text-black">
            -
            {totals.expense.toLocaleString(undefined, {
              minimumFractionDigits: 2,
            })}
          </Text>
        </View>

        <Animated.View
          onLayout={(e) => {
            const { width } = e.nativeEvent.layout;
            setWidthInfo((v) => ({ ...v, balance: width }));
          }}
          style={[balanceStyle, { alignItems: "flex-start" }]}
        >
          <Text className="text-[10px] font-black text-black uppercase opacity-60">
            结余
          </Text>
          <Text className="text-xl font-black text-black">
            {balanceValue.toLocaleString(undefined, {
              minimumFractionDigits: 2,
            })}
          </Text>
        </Animated.View>
      </BrutaCard>

      {/* FLYING BADGE */}
      <Animated.View
        style={[
          badgeStyle,
          { position: "absolute", top: -15, right: 10, zIndex: 10 },
        ]}
      >
        <BrutaCard
          bgClassName={balanceValue >= 0 ? "bg-[#00B800]" : "bg-[#FF0000]"}
          className="px-4 py-2 items-center justify-center border-4"
        >
          <View className="items-center">
            <Text className="text-[10px] font-black text-white uppercase mb-1">
              结余
            </Text>
            <Text className="text-xl font-black text-white">
              {balanceValue.toLocaleString(undefined, {
                minimumFractionDigits: 2,
              })}
            </Text>
          </View>
        </BrutaCard>
      </Animated.View>
    </View>
  );
}

export default function TransactionsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const {
    refreshKey,
    activeFilters,
    setSearchQuery,
    clearSpecificFilter,
    triggerRefresh,
    resetAllFilters,
  } = useStore();

  useShakeReset(() => {
    resetAllFilters();
  }, !isInitialFilters(activeFilters));

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [totals, setTotals] = useState({ income: 0, expense: 0 });
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const emojiStatus = useMemo(() => {
    const balance = totals.income - totals.expense;
    if (balance < 0) return "angry";
    const ratio =
      totals.income > 0
        ? totals.expense / totals.income
        : totals.expense > 0
          ? 1
          : 0;
    if (ratio >= 0.7) return "bad";
    return "smile";
  }, [totals]);

  const { fabAnim, fabScrollProps, animateFab } = useFabController();
  const topBtnAnim = useRef(new RNAnimated.Value(0)).current;
  const flatListRef = useRef<FlatList>(null);
  const scrollY = useRef(0);
  const [showTopBtn, setShowTopBtn] = useState(false);

  const animateButtons = useCallback(
    (show: boolean) => {
      const isBeyondFirstPage = scrollY.current > 10;

      // Animate FAB using the centralized logic
      animateFab(show);

      // Animation for Back to Top Button
      RNAnimated.spring(topBtnAnim, {
        toValue: show && isBeyondFirstPage ? 1 : 0,
        useNativeDriver: true,
        friction: 8,
        tension: 40,
      }).start();

      // Ensure pointerEvents state matches visibility
      if (show && isBeyondFirstPage) {
        setShowTopBtn(true);
      } else {
        setShowTopBtn(false);
      }
    },
    [animateFab, topBtnAnim],
  );

  const handleScroll = (event: any) => {
    const offset = event.nativeEvent.contentOffset.y;
    scrollY.current = offset;
    // We don't necessarily toggle showTopBtn here because that would trigger re-renders
    // just to check condition during scroll. animateButtons will handle final state.
  };

  const scrollToTop = () => {
    flatListRef.current?.scrollToOffset({
      offset: 0,
      animated: true,
    });
  };

  const fetchTotals = async () => {
    const data = await getFilteredTotals(activeFilters);
    setTotals(data);
  };

  const loadData = async (reset = false) => {
    if (loading) return;
    setLoading(true);

    const newPage = reset ? 0 : page;
    const limit = 50;
    const offset = newPage * limit;

    try {
      const data = await getTransactions(activeFilters, limit, offset);
      if (reset) {
        setTransactions(data);
        setPage(1);
      } else {
        setTransactions((prev) => [...prev, ...data]);
        setPage(newPage + 1);
      }
      setHasMore(data.length === limit);
    } catch (error) {
      console.error("Load transactions failed:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTotals();
    loadData(true);
  }, [refreshKey, activeFilters]);

  const toggleExpand = (id: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Neo-Brutalism Filter Pill Component
  const FilterPill = ({
    label,
    onRemove,
    color = "#FFFFFF",
  }: {
    label: string;
    onRemove: () => void;
    color?: string;
  }) => {
    // Random rotation between -3 and 3 degrees
    const rotate = useRef(`${(Math.random() * 6 - 3).toFixed(1)}deg`).current;

    return (
      <View style={{ transform: [{ rotate }] }} className="mr-3 mb-2">
        <View className="absolute bg-black w-full h-full translate-x-1 translate-y-1 rounded-[2px]" />
        <View
          style={{ backgroundColor: color }}
          className="flex-row items-center border-[3px] border-black px-3 py-1.5 rounded-[2px] bg-white"
        >
          <Text className="text-[10px] font-black uppercase text-black mr-2">
            {label}
          </Text>
          <TouchableOpacity onPress={onRemove}>
            <X size={14} color="#000" strokeWidth={4} />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderActiveFilters = () => {
    const pills = [];

    if (activeFilters.type !== "all") {
      pills.push({
        id: "type",
        label: activeFilters.type === "income" ? "仅收入" : "仅支出",
        color: "#CCFF00",
        onRemove: () => clearSpecificFilter("type"),
      });
    }

    activeFilters.categories.forEach((cat) => {
      pills.push({
        id: `cat-${cat}`,
        label: cat,
        color: CATEGORY_COLORS[cat] || "#FFFFFF",
        onRemove: () => {
          const nextCats = activeFilters.categories.filter((c) => c !== cat);
          useStore.getState().setFilters({ categories: nextCats });
        },
      });
    });

    if (
      activeFilters.dateRange &&
      !isDefaultDateRange(activeFilters.dateRange)
    ) {
      pills.push({
        id: "date",
        label: `${activeFilters.dateRange.start} → ${activeFilters.dateRange.end}`,
        color: "#5CE1E6",
        onRemove: () => clearSpecificFilter("dateRange"),
      });
    }

    if (pills.length === 0) return null;

    return (
      <View className="px-6 mb-4">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="flex-row"
        >
          {pills.map((p) => (
            <FilterPill
              key={p.id}
              label={p.label}
              onRemove={p.onRemove}
              color={p.color}
            />
          ))}
        </ScrollView>
      </View>
    );
  };

  const renderItem = useCallback(
    ({ item }: { item: Transaction }) => {
      const Icon = CATEGORY_ICONS[item.category] || DollarSign;
      const isExpanded = expandedIds.has(item.id);
      const categoryColor = CATEGORY_COLORS[item.category] || "#FFFFFF";

      return (
        <SwipeableShatterRow
          onDelete={async () => {
            await deleteTransaction(item.id);
            triggerRefresh();
          }}
        >
          <BrutaCard bgClassName="bg-white" containerClassName="mb-6">
            <View className="flex-row items-start">
              {/* Icon Section */}
              <View
                style={{ backgroundColor: categoryColor }}
                className="w-14 h-14 border-4 border-black items-center justify-center mr-4 shadow-[2px_2px_0px_#000]"
              >
                <Icon size={28} color="#000000" strokeWidth={3} />
              </View>

              {/* Main Info */}
              <View className="flex-1">
                {/* Row 1: Title + Object */}
                <View className="flex-row items-end gap-2 pr-2">
                  <Text className="text-base font-black text-black uppercase leading-tight">
                    {item.title}
                  </Text>
                  {item.metadata && (
                    <Text className="text-xs font-bold text-[#666666] leading-tight mb-0.5">
                      {item.metadata}
                    </Text>
                  )}
                </View>

                {/* Row 2: Date + Category */}
                <View className="flex-row items-center gap-3 mt-1">
                  <Text className="text-[11px] text-[#999999] font-bold">
                    {dayjs(item.date).format("YYYY-MM-DD HH:mm:ss")}
                  </Text>
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
                </View>

                {/* Row 3: Expandable Note */}
                {item.note && (
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => toggleExpand(item.id)}
                    className="mt-1"
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

              {/* Amount Section - Moved to top-right to avoid overlap */}
              <View className="ml-2 items-end pt-1">
                <Text
                  className={cn(
                    "text-lg font-black",
                    item.type === "income" ? "text-[#00B800]" : "text-black",
                  )}
                >
                  {item.type === "income" ? "+" : "-"}
                  {item.amount.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </Text>
                <TouchableOpacity
                  onPress={() =>
                    router.push({
                      pathname: "/(modals)/add-record",
                      params: { data: JSON.stringify(item) },
                    })
                  }
                  className="w-8 h-8 bg-[#5CE1E6] border-2 border-black rounded-sm items-center justify-center mt-2 shadow-[2px_2px_0px_#000]"
                >
                  <Pencil size={14} color="#000" strokeWidth={3} />
                </TouchableOpacity>
              </View>
            </View>
          </BrutaCard>
        </SwipeableShatterRow>
      );
    },
    [expandedIds, triggerRefresh],
  );

  return (
    <View className="flex-1 bg-primary">
      {/* Header Area */}
      <View style={{ paddingTop: insets.top + 24 }} className="px-6 pb-6 gap-6">
        <View className="flex-row items-center justify-between">
          <Text className="text-2xl font-black text-black uppercase tracking-tighter">
            流水列表
          </Text>
          <StatusEmoji status={emojiStatus} />
        </View>

        {/* Search & Filter */}
        <View className="flex-row gap-4">
          <BrutaInput
            value={activeFilters.searchQuery}
            onChangeText={setSearchQuery}
            placeholder="搜索记录..."
            containerClassName="flex-1"
            leftIcon={<Search size={20} color="#000" strokeWidth={3} />}
          />
          <BrutaButton
            title="筛选"
            bgClassName="bg-[#5CE1E6]"
            containerClassName="w-[100px]"
            textClassName="text-sm font-black"
            onPress={() => router.push("/(modals)/filter-sheet")}
          />
        </View>
      </View>

      {/* Filter Pills Area */}
      {renderActiveFilters()}

      {/* Month Summary Bar */}
      <SummaryBar totals={totals} />

      {/* Transactions List */}
      <FlatList
        ref={flatListRef}
        data={transactions}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 120 }}
        onEndReached={() => hasMore && loadData()}
        onEndReachedThreshold={0.5}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        {...fabScrollProps}
        onScrollBeginDrag={(e) => {
          animateButtons(false);
          fabScrollProps.onScrollBeginDrag();
        }}
        onScrollEndDrag={(e) => {
          animateButtons(true);
          fabScrollProps.onScrollEndDrag();
        }}
        onMomentumScrollBegin={(e) => {
          animateButtons(false);
          fabScrollProps.onMomentumScrollBegin();
        }}
        onMomentumScrollEnd={(e) => {
          animateButtons(true);
          fabScrollProps.onMomentumScrollEnd();
        }}
        ListEmptyComponent={
          loading ? (
            <View className="py-20 items-center">
              <Text className="text-lg font-black text-[#000] uppercase animation-pulse">
                加载中...
              </Text>
            </View>
          ) : (
            <View className="py-20 items-center">
              <Text className="text-lg font-black text-[#999999] uppercase">
                快来记一笔吧！！！💰
              </Text>
            </View>
          )
        }
      />

      {/* Buttons */}
      <View
        pointerEvents="box-none"
        className="absolute right-6 bottom-10 gap-4 items-center"
      >
        {/* Back to Top */}
        <RNAnimated.View
          style={{
            opacity: topBtnAnim,
            transform: [{ scale: topBtnAnim }],
            pointerEvents: showTopBtn ? "auto" : "none",
          }}
        >
          <CircleButton
            onPress={scrollToTop}
            bgClassName="bg-brand-blue"
            icon={<ArrowUp size={28} color="#000" strokeWidth={3} />}
          />
        </RNAnimated.View>

        {/* FAB */}
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
