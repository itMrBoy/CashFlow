import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
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
import { insertSubscription, insertTransaction, updateSubscription } from "@/lib/db";
import { cn } from "@/lib/utils";
import { useFormValidation } from "@/hooks/useFormValidation";
import dayjs from "dayjs";
import { Subscription } from "@/types/database";
import { Calendar } from "lucide-react-native";

const BILLING_CYCLES = [
  { label: "月付", value: "monthly" },
  { label: "季付", value: "quarterly" },
  { label: "年付", value: "yearly" },
];

const CATEGORIES = ["视频VIP", "音乐VIP", "AI", "工具", "其他"];

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

const BrutaSwitch = ({
  value,
  onValueChange,
}: {
  value: boolean;
  onValueChange: (v: boolean) => void;
}) => (
  <TouchableOpacity
    activeOpacity={1}
    onPress={() => onValueChange(!value)}
    className={cn(
      "w-16 h-8 rounded-full border-[3px] border-black flex-row items-center px-1",
      value ? "bg-[#CCFF00]" : "bg-white",
    )}
  >
    <View
      className={cn(
        "w-5 h-5 rounded-full border-[3px] border-black bg-white",
        value ? "ml-auto" : "mr-auto",
      )}
    />
  </TouchableOpacity>
);

export default function AddSubscriptionModal() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const triggerRefresh = useStore((state) => state.triggerRefresh);
  const { errors, validate, clearError, shakeStyle } = useFormValidation();

  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [cycle, setCycle] = useState("monthly");
  const [category, setCategory] = useState("视频VIP");
  const [firstBillingDate, setFirstBillingDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [syncToTransaction, setSyncToTransaction] = useState(true);
  const [note, setNote] = useState("");

  const params = useLocalSearchParams<{ data?: string }>();
  const isEdit = !!params.data;
  const initialData = isEdit ? JSON.parse(params.data!) : null;

  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setAmount(initialData.amount.toString());
      setCycle(initialData.cycle);
      setCategory(initialData.category);
      setFirstBillingDate(new Date(initialData.first_billing_date));
      setNote(initialData.note || "");
      // For editing, we disable "Sync to Transaction" by default to prevent duplication
      // unless we implement a logic to find and update the linked transaction.
      // For now, let's just make it clear.
      setSyncToTransaction(false);
    }
  }, []);

  // Clear errors when user interacts with fields
  useEffect(() => {
    if (name) clearError("name");
  }, [name]);
  useEffect(() => {
    if (amount) clearError("amount");
  }, [amount]);

  const handleDateChange = (
    event: DateTimePickerEvent,
    selectedDate?: Date,
  ) => {
    setShowDatePicker(false);
    if (selectedDate) {
      const newDate = new Date(firstBillingDate);
      newDate.setFullYear(selectedDate.getFullYear());
      newDate.setMonth(selectedDate.getMonth());
      newDate.setDate(selectedDate.getDate());
      setFirstBillingDate(newDate);
    }
  };

  const handleTimeChange = (
    event: DateTimePickerEvent,
    selectedTime?: Date,
  ) => {
    setShowTimePicker(false);
    if (selectedTime) {
      const newDate = new Date(firstBillingDate);
      newDate.setHours(selectedTime.getHours());
      newDate.setMinutes(selectedTime.getMinutes());
      newDate.setSeconds(selectedTime.getSeconds());
      setFirstBillingDate(newDate);
    }
  };

  const handleSave = async () => {
    const isValid = validate(
      { name, amount, cycle, category, firstBillingDate },
      ["name", "amount", "cycle", "category"],
    );

    if (!isValid) return;

    if (isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      Alert.alert("Error", "Please enter a valid amount");
      return;
    }

    if (dayjs(firstBillingDate).isAfter(dayjs().endOf("month"))) {
      Alert.alert("错误", "订阅起始日期不能超过本月月底");
      return;
    }

    try {
      const subscriptionId = Date.now().toString();
      const subscription: Subscription = {
        id: isEdit ? initialData.id : subscriptionId,
        name,
        amount: parseFloat(amount),
        cycle,
        first_billing_date: dayjs(firstBillingDate).format(
          "YYYY-MM-DD HH:mm:ss",
        ),
        category,
        note,
        created_at: isEdit ? initialData.created_at : new Date().toISOString(),
      };

      if (isEdit) {
        await updateSubscription(subscription);
      } else {
        await insertSubscription(subscription);
      }

      if (syncToTransaction && !isEdit) { // Only sync for new subscriptions
        await insertTransaction({
          id: (Date.now() + 1).toString(),
          type: "expense",
          title: name,
          amount: parseFloat(amount),
          category: category,
          date: dayjs(firstBillingDate).format("YYYY-MM-DD HH:mm:ss"),
          metadata: "订阅",
          note: note,
          created_at: new Date().toISOString(),
        });
      }

      triggerRefresh();
      router.back();
    } catch (error) {
      console.error("Save failed:", error);
      Alert.alert("Error", "Failed to save subscription");
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === "ios" ? "padding" : "height"} 
      className="flex-1 bg-[#F4F4F0]"
    >
      {/* Header */}
      <View
        style={{ paddingTop: insets.top + 16 }}
        className="flex-row items-center justify-between px-6 pb-4"
      >
        <Text className="text-xl font-black text-black uppercase">
          {isEdit ? "编辑我的订阅 ✏️" : "又花了一笔 🔈"}
        </Text>
        <CloseButton onPress={() => router.back()} />
      </View>

      <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
        <View className="gap-[24px] pb-[100px]">
          {/* SERVICE NAME */}
          <FieldContainer
            label="服务名称 (SERVICE)"
            field="name"
            hasError={errors["name"]}
            shakeStyle={shakeStyle}
          >
            <BrutaInput
              value={name}
              onChangeText={setName}
              placeholder="服务名称 (e.g. Netflix)"
              shadowColor={errors["name"] ? "bg-brand-orange" : "bg-black"}
            />
          </FieldContainer>

          {/* AMOUNT */}
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

          {/* BILLING CYCLE */}
          <FieldContainer
            label="周期 (CYCLE)"
            field="cycle"
            hasError={errors["cycle"]}
            shakeStyle={shakeStyle}
          >
            <View className="flex-row gap-4">
              {BILLING_CYCLES.map((item) => (
                <TouchableOpacity
                  key={item.value}
                  onPress={() => setCycle(item.value)}
                  className={cn(
                    "flex-1 h-12 border-[4px] border-black items-center justify-center rounded-sm shadow-[4px_4px_0px_#000]",
                    cycle === item.value ? "bg-[#CCFF00]" : "bg-white",
                  )}
                >
                  <Text className="font-black text-[14px] uppercase">
                    {item.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </FieldContainer>

          {/* FIRST BILLING DATE & TIME */}
          <View className="flex-row gap-4">
            <View className="flex-1 gap-2">
              <Text className="font-bold text-xs uppercase text-black">
                首次结算日 (DATE)
              </Text>
              <TouchableOpacity
                onPress={() => setShowDatePicker(true)}
                className="h-14 bg-white border-[4px] border-black rounded-md px-4 flex-row items-center justify-between shadow-[4px_4px_0px_#000]"
              >
                <Text className="font-bold text-base">
                  {firstBillingDate.toLocaleDateString()}
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
                className="h-14 bg-white border-[4px] border-black rounded-md px-4 flex-row items-center justify-between shadow-[4px_4px_0px_#000]"
              >
                <Text className="font-bold text-base">
                  {firstBillingDate.toLocaleTimeString([], {
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
              value={firstBillingDate}
              mode="date"
              display="default"
              onChange={handleDateChange}
              maximumDate={dayjs().endOf("month").toDate()}
            />
          )}

          {showTimePicker && (
            <DateTimePicker
              value={firstBillingDate}
              mode="time"
              display="default"
              onChange={handleTimeChange}
            />
          )}

          {/* CATEGORY */}
          <FieldContainer
            label="分类 (CATEGORY)"
            field="category"
            hasError={errors["category"]}
            shakeStyle={shakeStyle}
          >
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              className="flex-row"
            >
              <View className="flex-row gap-2">
                {CATEGORIES.map((cat) => (
                  <BrutaPill
                    key={cat}
                    label={cat}
                    isActive={category === cat}
                    onPress={() => setCategory(cat)}
                    activeBgColor="bg-[#5CE1E6]"
                  />
                ))}
              </View>
            </ScrollView>
          </FieldContainer>

          {/* NOTE */}
          <View className="gap-2">
            <Text className="font-bold text-xs uppercase text-black">
              备注 (NOTE - OPTIONAL)
            </Text>
            <View className="bg-white border-[4px] border-black p-4 min-h-[100px] shadow-[4px_4px_0px_#000]">
              <TextInput
                value={note}
                onChangeText={setNote}
                placeholder="写点什么..."
                placeholderTextColor="#A3A3A3"
                multiline
                className="flex-1 font-bold text-[14px]"
                textAlignVertical="top"
              />
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Footer */}
      <View
        style={{ paddingBottom: insets.bottom + 24 }}
        className="px-6 pt-4 gap-[24px]"
      >
        {/* RECORD EXPENSE TODAY */}
        <View className="flex-row items-center justify-between">
          <Text className="font-black text-[16px] uppercase leading-[24px]">
            立即记一笔支出
          </Text>
          <BrutaSwitch
            value={syncToTransaction}
            onValueChange={setSyncToTransaction}
          />
        </View>

        {/* Submit Button */}
        <BrutaButton
          title={isEdit ? "更新订阅 (UPDATE)" : "添加订阅 (ADD)"}
          bgClassName="bg-black"
          textClassName="text-white"
          className="h-[64px]"
          onPress={handleSave}
        />
      </View>
    </KeyboardAvoidingView>
  );
}
