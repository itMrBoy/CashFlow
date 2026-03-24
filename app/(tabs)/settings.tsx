import React from "react";
import { View, Text, Image, Alert, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { BrutaCard } from "../../components/ui/BrutaCard";
import { BrutaButton } from "../../components/ui/BrutaButton";
import { BrutaPill } from "../../components/ui/BrutaPill";
import { useStore } from "../../store/useStore";
import * as db from "../../lib/db";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import * as DocumentPicker from "expo-document-picker";
import { Ionicons } from "@expo/vector-icons";

export default function SettingsScreen() {
  const triggerRefresh = useStore((state) => state.triggerRefresh);

  const handleExport = async () => {
    try {
      const data = await db.exportAllData();
      const jsonString = JSON.stringify(data, null, 2);
      const fileUri =
        FileSystem.documentDirectory + "cashflow_vibe_backup.json";

      await FileSystem.writeAsStringAsync(fileUri, jsonString);

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri);
      } else {
        Alert.alert("错误", "当前设备不支持分享文件");
      }
    } catch (error) {
      console.error("Export failed:", error);
      Alert.alert("导出失败", "导出数据时发生错误");
    }
  };

  const handleImport = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "application/json",
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;

      const fileUri = result.assets[0].uri;
      const content = await FileSystem.readAsStringAsync(fileUri);
      const data = JSON.parse(content);

      // 基本校验
      if (!data.transactions || !data.subscriptions) {
        throw new Error("无效的备份文件格式");
      }

      Alert.alert("确认恢复", "此操作将覆盖现有所有数据，确定要继续吗？", [
        { text: "取消", style: "cancel" },
        {
          text: "确定覆盖",
          style: "destructive",
          onPress: async () => {
            try {
              await db.importData(data);
              triggerRefresh();
              Alert.alert("恢复成功", "数据已成功恢复");
            } catch (e) {
              console.error("Import process failed:", e);
              Alert.alert("恢复失败", "数据导入过程中发生错误");
            }
          },
        },
      ]);
    } catch (error) {
      console.error("Import failed:", error);
      Alert.alert("恢复失败", "无效的备份文件或读取错误");
    }
  };

  const handleWipe = () => {
    Alert.alert("极其严重的警告", "确定要清空所有数据吗？此操作不可逆！", [
      { text: "取消", style: "cancel" },
      {
        text: "确定清空",
        style: "destructive",
        onPress: async () => {
          await db.clearAllData();
          triggerRefresh();
          Alert.alert("已清空", "所有本地数据已清除");
        },
      },
    ]);
  };

  return (
    <SafeAreaView className="flex-1 bg-brand-beige" edges={["top"]}>
      <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 100 }}>
        {/* Branding Section */}
        <View className="items-center mb-10 gap-4">
          <View
            className="w-20 h-20 rounded-full bg-brand-green border-4 border-black items-center justify-center overflow-hidden"
            style={{
              shadowColor: "#000",
              shadowOffset: { width: 4, height: 4 },
              shadowOpacity: 1,
              shadowRadius: 0,
              elevation: 4,
            }}
          >
            <Image
              source={require("../../assets/logo.png")}
              style={{ width: 60, height: 60 }}
              resizeMode="contain"
            />
          </View>
          <Text className="text-4xl font-black text-black uppercase">
            小鸡一笔
          </Text>
          <BrutaPill 
            label="v1.0.0" 
            inactiveBgColor="bg-white" 
            containerClassName="self-center"
          />
        </View>

        {/* Action Card */}
        <BrutaCard bgClassName="bg-white" className="p-6 gap-6">
          {/* Tape Decoration */}
          <View className="absolute -top-3 left-4 bg-black w-10 h-3" />

          <BrutaButton
            title="备份数据"
            bgClassName="bg-white"
            onPress={handleExport}
            className="h-20"
            textClassName="text-xl"
          >
            <Ionicons
              name="cloud-download-outline"
              size={28}
              color="black"
              style={{ marginRight: 12 }}
            />
          </BrutaButton>

          <BrutaButton
            title="恢复数据"
            bgClassName="bg-white"
            onPress={handleImport}
            className="h-20"
            textClassName="text-xl"
          >
            <Ionicons
              name="cloud-upload-outline"
              size={28}
              color="black"
              style={{ marginRight: 12 }}
            />
          </BrutaButton>

          <BrutaButton
            title="清空数据"
            bgClassName="bg-brand-orange"
            onPress={handleWipe}
            className="h-20"
            textClassName="text-xl"
          >
            <Ionicons
              name="trash-outline"
              size={28}
              color="black"
              style={{ marginRight: 12 }}
            />
          </BrutaButton>
        </BrutaCard>

        {/* Footer */}
        <View className="items-center mt-10">
          <Text className="text-[10px] font-black text-black/40 uppercase tracking-widest">
            数据仅保存在本地
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
