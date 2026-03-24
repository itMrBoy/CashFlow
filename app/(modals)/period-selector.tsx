import React, { useState, useCallback } from "react";
import { View, Text, TouchableOpacity, ScrollView, Platform, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { CloseButton } from "@/components/ui/CloseButton";
import { BrutaPill } from "@/components/ui/BrutaPill";
import { BrutaButton } from "@/components/ui/BrutaButton";
import { useStore, Period } from "@/store/useStore";
import dayjs from "dayjs";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Calendar as CalendarIcon } from "lucide-react-native";

export default function PeriodSelectorModal() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { dashboardPeriod, activeFilters, setFilters, setDashboardPeriod } = useStore();

  const [localPeriod, setLocalPeriod] = useState<Period | 'custom'>(dashboardPeriod);
  const [startDate, setStartDate] = useState(
    activeFilters.dateRange?.start ? new Date(activeFilters.dateRange.start) : new Date()
  );
  const [endDate, setEndDate] = useState(
    activeFilters.dateRange?.end ? new Date(activeFilters.dateRange.end) : new Date()
  );

  const [showPicker, setShowPicker] = useState<'start' | 'end' | null>(null);

  const onConfirm = () => {
    let finalRange = null;
    let finalPeriod = localPeriod as Period;

    if (localPeriod === 'custom') {
      if (dayjs(startDate).isAfter(dayjs(endDate))) {
        Alert.alert("校验错误", "开始日期不能大于结束日期");
        return;
      }
      finalRange = {
        start: dayjs(startDate).format('YYYY-MM-DD'),
        end: dayjs(endDate).format('YYYY-MM-DD'),
      };
      finalPeriod = 'this_month'; // Default to a known period or handle custom in store
    } else {
      switch (localPeriod) {
        case 'this_month':
          finalRange = {
            start: dayjs().startOf('month').format('YYYY-MM-DD'),
            end: dayjs().endOf('month').format('YYYY-MM-DD'),
          };
          break;
        case 'last_month':
          finalRange = {
            start: dayjs().subtract(1, 'month').startOf('month').format('YYYY-MM-DD'),
            end: dayjs().subtract(1, 'month').endOf('month').format('YYYY-MM-DD'),
          };
          break;
        case 'last_30_days':
          finalRange = {
            start: dayjs().subtract(30, 'days').format('YYYY-MM-DD'),
            end: dayjs().format('YYYY-MM-DD'),
          };
          break;
        case 'this_year':
          finalRange = {
            start: dayjs().startOf('year').format('YYYY-MM-DD'),
            end: dayjs().endOf('year').format('YYYY-MM-DD'),
          };
          break;
      }
    }

    setDashboardPeriod(finalPeriod);
    router.back();
  };

  const renderQuickOption = (id: string, label: string, value: Period | 'custom') => (
    <BrutaPill
      key={id}
      label={label}
      isActive={localPeriod === value}
      onPress={() => setLocalPeriod(value)}
      containerClassName="mb-4 mr-3"
      activeBgColor="bg-brand-green"
      textClassName="text-sm px-2"
    />
  );

  return (
    <View className="flex-1 bg-[#F4F4F0]">
      {/* Header */}
      <View
        style={{ paddingTop: insets.top + 16 }}
        className="flex-row items-center justify-between px-6 pb-4"
      >
        <Text className="text-xl font-black text-black uppercase">
          选择周期 (PERIOD)
        </Text>
        <CloseButton onPress={() => router.back()} />
      </View>

      <ScrollView className="px-6 flex-1">
        <Text className="text-xs font-black text-black/40 uppercase mb-4 tracking-widest">快捷选项 (QUICK OPTIONS)</Text>
        <View className="flex-row flex-wrap mb-8">
          {renderQuickOption("HyqpX", "本月 (THIS MONTH)", "this_month")}
          {renderQuickOption("sfGnC", "上月 (LAST MONTH)", "last_month")}
          {renderQuickOption("HbvRK", "最近30天 (LAST 30 DAYS)", "last_30_days")}
          {renderQuickOption("TMo2u", "今年 (THIS YEAR)", "this_year")}
          {renderQuickOption("custom", "自定义 (CUSTOM)", "custom")}
        </View>

        {localPeriod === 'custom' && (
          <View className="mb-10">
            <Text className="text-xs font-black text-black/40 uppercase mb-4 tracking-widest">日期范围 (DATE RANGE)</Text>
            
            <View className="gap-6">
              {/* Start Date */}
              <TouchableOpacity 
                activeOpacity={0.8}
                onPress={() => setShowPicker('start')}
                className="relative"
              >
                <View className="absolute top-1 left-1 w-full h-full bg-black rounded-md" />
                <View className="bg-white border-4 border-black p-4 flex-row items-center justify-between rounded-md">
                   <View className="flex-row items-center gap-3">
                      <CalendarIcon size={20} color="#000" strokeWidth={3} />
                      <View>
                        <Text className="text-[10px] font-black text-black/40 uppercase">开始日期 (START)</Text>
                        <Text className="text-lg font-black text-black">{dayjs(startDate).format('YYYY-MM-DD')}</Text>
                      </View>
                   </View>
                </View>
              </TouchableOpacity>

              {/* End Date */}
              <TouchableOpacity 
                activeOpacity={0.8}
                onPress={() => setShowPicker('end')}
                className="relative"
              >
                <View className="absolute top-1 left-1 w-full h-full bg-black rounded-md" />
                <View className="bg-white border-4 border-black p-4 flex-row items-center justify-between rounded-md">
                   <View className="flex-row items-center gap-3">
                      <CalendarIcon size={20} color="#000" strokeWidth={3} />
                      <View>
                        <Text className="text-[10px] font-black text-black/40 uppercase">结束日期 (END)</Text>
                        <Text className="text-lg font-black text-black">{dayjs(endDate).format('YYYY-MM-DD')}</Text>
                      </View>
                   </View>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Footer Button (7l8i9) */}
      <View style={{ paddingBottom: insets.bottom + 20 }} className="px-6 pt-4 bg-[#F4F4F0]">
        <BrutaButton
          title="确认并加载 (CONFIRM & LOAD)"
          onPress={onConfirm}
          bgClassName="bg-black"
          textClassName="text-white"
        />
      </View>

      {/* Date Pickers */}
      {showPicker === 'start' && (
        <DateTimePicker
          value={startDate}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(event, date) => {
            setShowPicker(null);
            if (date) setStartDate(date);
          }}
        />
      )}
      {showPicker === 'end' && (
        <DateTimePicker
          value={endDate}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(event, date) => {
            setShowPicker(null);
            if (date) setEndDate(date);
          }}
        />
      )}
    </View>
  );
}
