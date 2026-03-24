import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, TouchableOpacity, Alert, KeyboardAvoidingView, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import DateTimePicker, {
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import Animated from "react-native-reanimated";
import { BrutaInput } from "@/components/ui/BrutaInput";
import { BrutaButton } from "@/components/ui/BrutaButton";
import { BrutaPill } from "@/components/ui/BrutaPill";
import { CloseButton } from "@/components/ui/CloseButton";
import { useStore } from "@/store/useStore";
import { insertTransaction, updateTransaction } from "@/lib/db";
import { cn } from "@/lib/utils";
import { useFormValidation } from "@/hooks/useFormValidation";
import dayjs from "dayjs";

const EXPENSE_CATEGORIES = [
  "餐饮",
  "交通",
  "购物",
  "娱乐",
  "房租",
  "礼金",
  "债务",
  "其他",
];
const INCOME_CATEGORIES = ["工资", "奖金", "投资", "礼金", "债务", "其他"];

// FieldContainer defined outside to prevent remounting and keyboard closing issues
const FieldContainer = ({
  label,
  field,
  children,
  hasError,
  shakeStyle,
}: {
  label: string;
  field: string;
  children: React.ReactNode;
  hasError: boolean;
  shakeStyle: any;
}) => {
  return (
    <Animated.View style={hasError ? shakeStyle : {}} className="gap-2">
      <Text
        className={cn(
          "font-bold text-xs uppercase",
          hasError ? "text-brand-orange" : "text-black",
        )}
      >
        {label} {hasError && "*"}
      </Text>
      <View
        className={cn(
          "rounded-md",
          hasError && "border-[3px] border-brand-orange bg-brand-orange/10 p-1",
        )}
      >
        {children}
      </View>
    </Animated.View>
  );
};

export default function AddRecordModal() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const triggerRefresh = useStore((state) => state.triggerRefresh);
  const { errors, validate, clearError, shakeStyle } = useFormValidation();

  const [type, setType] = useState<"expense" | "income">("expense");
  const [amount, setAmount] = useState("");
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("餐饮");
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [metadata, setMetadata] = useState("");
  const [note, setNote] = useState("");

  const params = useLocalSearchParams<{ data?: string }>();
  const isEdit = !!params.data;
  const initialData = isEdit ? JSON.parse(params.data!) : null;

  useEffect(() => {
    if (initialData) {
      setType(initialData.type);
      setAmount(initialData.amount.toString());
      setTitle(initialData.title);
      setCategory(initialData.category);
      setDate(new Date(initialData.date));
      setMetadata(initialData.metadata || "");
      setNote(initialData.note || "");
    }
  }, []);

  const categories =
    type === "expense" ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;

  // Clear errors when user interacts with fields
  useEffect(() => {
    if (amount) clearError("amount");
  }, [amount]);
  useEffect(() => {
    if (title) clearError("title");
  }, [title]);
  useEffect(() => {
    if (metadata) clearError("metadata");
  }, [metadata]);
  useEffect(() => {
    if (category) clearError("category");
  }, [category]);

  const handleDateChange = (
    event: DateTimePickerEvent,
    selectedDate?: Date,
  ) => {
    setShowDatePicker(false);
    if (selectedDate) {
      // Keep existing time when changing date
      const newDate = new Date(date);
      newDate.setFullYear(selectedDate.getFullYear());
      newDate.setMonth(selectedDate.getMonth());
      newDate.setDate(selectedDate.getDate());
      setDate(newDate);
    }
  };

  const handleTimeChange = (
    event: DateTimePickerEvent,
    selectedTime?: Date,
  ) => {
    setShowTimePicker(false);
    if (selectedTime) {
      // Keep existing date when changing time
      const newDate = new Date(date);
      newDate.setHours(selectedTime.getHours());
      newDate.setMinutes(selectedTime.getMinutes());
      newDate.setSeconds(selectedTime.getSeconds());
      setDate(newDate);
    }
  };

  const handleSave = async () => {
    const requiredFields = ["amount", "title", "category"];
    if (["礼金", "债务"].includes(category)) {
      requiredFields.push("metadata");
    }

    const isValid = validate(
      {
        type,
        amount,
        title,
        category,
        date,
        metadata,
      },
      requiredFields,
    );

    if (!isValid) return;

    if (isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      validate({ amount: "" }, ["amount"]);
      Alert.alert("错误", "请输入有效的金额");
      return;
    }

    try {
      const transaction = {
        id: isEdit ? initialData.id : Date.now().toString(),
        type,
        title,
        amount: parseFloat(amount),
        category,
        date: dayjs(date).format("YYYY-MM-DD HH:mm:ss"),
        metadata: ["礼金", "债务"].includes(category) ? metadata : "",
        note,
        created_at: isEdit ? initialData.created_at : new Date().toISOString(),
      };

      if (isEdit) {
        await updateTransaction(transaction);
      } else {
        await insertTransaction(transaction);
      }
      triggerRefresh();
      router.back();
    } catch (error) {
      console.error("Save failed:", error);
      Alert.alert("错误", "保存记录失败，请重试");
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === "ios" ? "padding" : "height"} 
      className="flex-1 bg-primary"
    >
      {/* Header */}
      <View
        style={{ paddingTop: insets.top + 16 }}
        className="flex-row items-center justify-between px-6 pb-4"
      >
        <Text className="text-xl font-black text-black uppercase">
          {isEdit ? "编辑流水记录 ✏️" : "记一笔流水 💰"}
        </Text>
        <CloseButton onPress={() => router.back()} />
      </View>

      <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
        <View className="gap-8 pb-12">
          {/* Tab Switcher */}
          <View className="flex-row gap-4">
            <TouchableOpacity
              onPress={() => {
                setType("expense");
                setCategory("餐饮");
              }}
              className={cn(
                "flex-1 h-12 items-center justify-center border-4 border-black",
                type === "expense" ? "bg-brand-green" : "bg-white",
              )}
            >
              <Text className="font-black text-sm uppercase">
                支出 (EXPENSE)
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                setType("income");
                setCategory("工资");
              }}
              className={cn(
                "flex-1 h-12 items-center justify-center border-4 border-black",
                type === "income" ? "bg-brand-green" : "bg-white",
              )}
            >
              <Text className="font-black text-sm uppercase">
                收入 (INCOME)
              </Text>
            </TouchableOpacity>
          </View>

          {/* Amount Input */}
          <FieldContainer
            label="金额 (AMOUNT)"
            field="amount"
            hasError={errors["amount"]}
            shakeStyle={shakeStyle}
          >
            <View className="relative">
              <View className="absolute left-6 top-0 bottom-0 justify-center z-10">
                <Text className="text-4xl font-black text-[#A3A3A3]">¥</Text>
              </View>
              <BrutaInput
                value={amount}
                onChangeText={setAmount}
                placeholder="0.00"
                keyboardType="numeric"
                className="text-3xl h-20 text-center font-black pr-6 pl-12"
                wrapperClassName="h-20 border-[4px]"
                shadowColor={errors["amount"] ? "bg-brand-orange" : "bg-black"}
              />
            </View>
          </FieldContainer>

          {/* Title Input */}
          <FieldContainer
            label="标题 (TITLE)"
            field="title"
            hasError={errors["title"]}
            shakeStyle={shakeStyle}
          >
            <BrutaInput
              value={title}
              onChangeText={setTitle}
              placeholder="输入备注或标题"
              shadowColor={errors["title"] ? "bg-brand-orange" : "bg-black"}
            />
          </FieldContainer>

          {/* Category Selection */}
          <FieldContainer
            label="分类 (CATEGORY)"
            field="category"
            hasError={errors["category"]}
            shakeStyle={shakeStyle}
          >
            <View className="flex-row flex-wrap gap-2">
              {categories.map((cat) => (
                <BrutaPill
                  key={cat}
                  label={cat}
                  isActive={category === cat}
                  onPress={() => setCategory(cat)}
                  activeBgColor="bg-brand-green"
                />
              ))}
            </View>
          </FieldContainer>

          {/* Conditional Field: 礼金/债务对象 */}
          {["礼金", "债务"].includes(category) && (
            <FieldContainer
              label="对象 (WHO)"
              field="metadata"
              hasError={errors["metadata"]}
              shakeStyle={shakeStyle}
            >
              <BrutaInput
                value={metadata}
                onChangeText={setMetadata}
                placeholder="礼金/债务对象（如：张三）"
                shadowColor={
                  errors["metadata"] ? "bg-brand-orange" : "bg-black"
                }
              />
            </FieldContainer>
          )}

          {/* Date & Time Picker */}
          <View className="flex-row gap-4">
            <View className="flex-1 gap-2">
              <Text className="font-bold text-xs uppercase text-black">
                日期 (DATE)
              </Text>
              <TouchableOpacity
                onPress={() => setShowDatePicker(true)}
                className="h-14 bg-white border-4 border-black rounded-md px-4 flex-row items-center justify-between"
                style={{
                  elevation: 4,
                  shadowColor: "#000",
                  shadowOffset: { width: 4, height: 4 },
                  shadowOpacity: 1,
                  shadowRadius: 0,
                }}
              >
                <Text className="font-bold text-base">
                  {date.toLocaleDateString()}
                </Text>
                <Text className="text-black font-black">EDIT</Text>
              </TouchableOpacity>
            </View>

            <View className="flex-1 gap-2">
              <Text className="font-bold text-xs uppercase text-black">
                时间 (TIME)
              </Text>
              <TouchableOpacity
                onPress={() => setShowTimePicker(true)}
                className="h-14 bg-white border-4 border-black rounded-md px-4 flex-row items-center justify-between"
                style={{
                  elevation: 4,
                  shadowColor: "#000",
                  shadowOffset: { width: 4, height: 4 },
                  shadowOpacity: 1,
                  shadowRadius: 0,
                }}
              >
                <Text className="font-bold text-base">
                  {date.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                    hour12: false,
                  })}
                </Text>
                <Text className="text-black font-black">EDIT</Text>
              </TouchableOpacity>
            </View>
          </View>

          {showDatePicker && (
            <DateTimePicker
              value={date}
              mode="date"
              display="default"
              onChange={handleDateChange}
            />
          )}

          {showTimePicker && (
            <DateTimePicker
              value={date}
              mode="time"
              display="default"
              onChange={handleTimeChange}
            />
          )}

          {/* Optional Note */}
          <View className="gap-2">
            <Text className="font-bold text-xs uppercase text-black">
              备注 (NOTE - OPTIONAL)
            </Text>
            <BrutaInput
              value={note}
              onChangeText={setNote}
              placeholder="补充说明..."
              multiline
              className="h-24 pt-4"
              wrapperClassName="h-24"
            />
          </View>
        </View>
      </ScrollView>

      {/* Save Button */}
      <View style={{ paddingBottom: insets.bottom + 24 }} className="px-6 pt-4">
        <BrutaButton
          title={isEdit ? "更新记录 (UPDATE)" : "保存记录 (SAVE)"}
          bgClassName="bg-black"
          textClassName="text-white"
          onPress={handleSave}
        />
      </View>
    </KeyboardAvoidingView>
  );
}
