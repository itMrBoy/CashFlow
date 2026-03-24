import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Platform, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { X, ArrowRight, Calendar } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import { BrutaButton } from '@/components/ui/BrutaButton';
import { BrutaInput } from '@/components/ui/BrutaInput';
import { BrutaPill } from '@/components/ui/BrutaPill';
import { CircleButton } from '@/components/ui/CircleButton';
import { useStore } from '@/store/useStore';
import { cn } from '@/lib/utils';

const INCOME_CATS = ["工资", "礼金", "债务", "投资", "其他"];
const EXPENSE_CATS = ["房租", "餐饮", "交通", "购物", "视频VIP", "音乐VIP", "AI", "工具", "礼金", "债务", "其他"];
const ALL_CATS = Array.from(new Set([...INCOME_CATS, ...EXPENSE_CATS]));

const CATEGORY_STYLE: Record<string, { bg: string, shadow: string }> = {
  "房租": { bg: "#CCFF00", shadow: "bg-black" },
  "餐饮": { bg: "#FFE600", shadow: "bg-black" },
  "交通": { bg: "#5CE1E6", shadow: "bg-black" },
  "购物": { bg: "#FF4911", shadow: "bg-black" },
  "工资": { bg: "#CCFF00", shadow: "bg-black" },
  "礼金": { bg: "#B088F9", shadow: "bg-black" },
  "债务": { bg: "#5CE1E6", shadow: "bg-black" },
  "投资": { bg: "#FF4911", shadow: "bg-black" },
  "视频VIP": { bg: "#B088F9", shadow: "bg-black" },
  "音乐VIP": { bg: "#5CE1E6", shadow: "bg-black" },
  "AI": { bg: "#CCFF00", shadow: "bg-black" },
  "工具": { bg: "#B088F9", shadow: "bg-black" },
  "其他": { bg: "#5CE1E6", shadow: "bg-black" },
};

export default function FilterSheet() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { activeFilters, setFilters, resetAllFilters } = useStore();

  const [tempFilters, setTempFilters] = useState({
    type: activeFilters.type,
    categories: [...activeFilters.categories],
    dateRange: activeFilters.dateRange ? { ...activeFilters.dateRange } : null,
  });

  const [showDatePicker, setShowDatePicker] = useState<{ type: 'start' | 'end' | null }>({ type: null });

  const toggleCategory = (cat: string) => {
    setTempFilters(prev => {
      const exists = prev.categories.includes(cat);
      if (exists) {
        return { ...prev, categories: prev.categories.filter(c => c !== cat) };
      } else {
        return { ...prev, categories: [...prev.categories, cat] };
      }
    });
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') setShowDatePicker({ type: null });
    
    if (selectedDate && showDatePicker.type) {
      const dateStr = selectedDate.toISOString().split('T')[0];
      setTempFilters(prev => ({
        ...prev,
        dateRange: {
          start: showDatePicker.type === 'start' ? dateStr : prev.dateRange?.start || dateStr,
          end: showDatePicker.type === 'end' ? dateStr : prev.dateRange?.end || dateStr,
        }
      }));
    }
  };

  const handleApply = () => {
    // Validation: Start Date must be <= End Date
    if (tempFilters.dateRange?.start && tempFilters.dateRange?.end) {
      if (tempFilters.dateRange.start > tempFilters.dateRange.end) {
        Alert.alert(
          "日期范围无效",
          "开始日期必须在结束日期之前，请重新选择。",
          [{ text: "好的", style: "cancel" }]
        );
        return;
      }
    }
    
    setFilters(tempFilters);
    router.back();
  };

  const handleReset = () => {
    resetAllFilters();
    router.back();
  };

  const TypeButton = ({ type, label }: { type: 'all' | 'income' | 'expense', label: string }) => {
    const isActive = tempFilters.type === type;
    
    const handlePress = () => {
      setTempFilters(prev => {
        // Prune selected categories when switching types
        const allowedCats = type === 'all' ? ALL_CATS : type === 'income' ? INCOME_CATS : EXPENSE_CATS;
        const prunedCategories = prev.categories.filter(cat => allowedCats.includes(cat));
        
        return { 
          ...prev, 
          type,
          categories: prunedCategories 
        };
      });
    };

    return (
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={handlePress}
        style={[
          styles.typeBtn,
          isActive && { backgroundColor: '#CCFF00' }
        ]}
      >
        <Text className="font-black text-sm uppercase text-black">{label}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <View className="flex-1 bg-primary">
      {/* Header */}
      <View
        style={{ paddingTop: insets.top + 16 }}
        className="flex-row items-center justify-between px-6 pb-4"
      >
        <Text className="text-xl font-black text-black uppercase">
          筛选账单 (FILTER)
        </Text>
        <CircleButton
          onPress={() => router.back()}
          bgClassName="bg-white"
          icon={<X size={24} color="#000" strokeWidth={3} />}
        />
      </View>

      <ScrollView 
        className="flex-1" 
        contentContainerStyle={{ padding: 24, paddingBottom: 150 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Type Section */}
        <View className="mb-10">
          <Text className="text-sm font-black text-black uppercase mb-4">收支类型 (TYPE)</Text>
          <View className="flex-row gap-4">
            <TypeButton type="all" label="全部" />
            <TypeButton type="expense" label="仅支出" />
            <TypeButton type="income" label="仅收入" />
          </View>
        </View>

        {/* Categories Section */}
        <View className="mb-10">
          <Text className="text-sm font-black text-black uppercase mb-4">分类 (CATEGORY)</Text>
          <View className="flex-row flex-wrap gap-3">
            {(tempFilters.type === 'all' ? ALL_CATS : tempFilters.type === 'income' ? INCOME_CATS : EXPENSE_CATS).map(cat => (
              <BrutaPill 
                key={cat}
                label={cat}
                isActive={tempFilters.categories.includes(cat)}
                onPress={() => toggleCategory(cat)}
                activeBgColor={CATEGORY_STYLE[cat]?.bg || "bg-brand-orange"}
                style={{ backgroundColor: tempFilters.categories.includes(cat) ? (CATEGORY_STYLE[cat]?.bg || '#FF4911') : '#FFFFFF' }}
                textClassName="text-[12px]"
                containerClassName="mb-1"
              />
            ))}
          </View>
        </View>

        {/* Date Range Section */}
        <View className="mb-10">
          <Text className="text-sm font-black text-black uppercase mb-4">日期范围 (DATE RANGE)</Text>
          <View className="flex-row items-center gap-4">
            <TouchableOpacity 
              activeOpacity={0.8}
              onPress={() => setShowDatePicker({ type: 'start' })}
              className="flex-1"
            >
              <BrutaInput 
                value={tempFilters.dateRange?.start || ''}
                placeholder="开始日期"
                editable={false}
                pointerEvents="none"
                leftIcon={<Calendar size={20} color="#000" strokeWidth={3} />}
              />
            </TouchableOpacity>
            
            <ArrowRight size={24} color="#000" strokeWidth={3} />
            
            <TouchableOpacity 
              activeOpacity={0.8}
              onPress={() => setShowDatePicker({ type: 'end' })}
              className="flex-1"
            >
              <BrutaInput 
                value={tempFilters.dateRange?.end || ''}
                placeholder="结束日期"
                editable={false}
                pointerEvents="none"
                leftIcon={<Calendar size={20} color="#000" strokeWidth={3} />}
              />
            </TouchableOpacity>
          </View>
        </View>

        {(showDatePicker.type || Platform.OS === 'ios') && showDatePicker.type && (
          <DateTimePicker
            value={new Date(
              showDatePicker.type === 'start' 
                ? (tempFilters.dateRange?.start || new Date()) 
                : (tempFilters.dateRange?.end || new Date())
            )}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={onDateChange}
          />
        )}
      </ScrollView>

      {/* Bottom Buttons */}
      <View 
        className="absolute bottom-0 left-0 right-0 bg-primary border-t-4 border-black p-6 flex-row gap-4"
        style={{ paddingBottom: insets.bottom + 24 }}
      >
        <BrutaButton 
          title="重置 (RESET)"
          bgClassName="bg-white"
          containerClassName="flex-1"
          onPress={handleReset}
        />
        <BrutaButton 
          title="应用筛选 (APPLY)"
          bgClassName="bg-black"
          containerClassName="flex-[1.5]"
          textClassName="text-white"
          onPress={handleApply}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  typeBtn: {
    flex: 1,
    height: 48,
    borderWidth: 4,
    borderColor: '#000',
    backgroundColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  }
});
