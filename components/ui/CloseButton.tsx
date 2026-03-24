import React, { useState } from "react";
import { TouchableOpacity, View, TouchableOpacityProps } from "react-native";
import { X } from "lucide-react-native";
import { cn } from "../../lib/utils";

export interface CloseButtonProps extends TouchableOpacityProps {
  containerClassName?: string;
  bgClassName?: string;
  shadowColor?: string;
}

export function CloseButton({
  className,
  containerClassName,
  bgClassName = "bg-white",
  shadowColor = "bg-black",
  ...props
}: CloseButtonProps) {
  const [isPressed, setIsPressed] = useState(false);

  return (
    <TouchableOpacity
      activeOpacity={1}
      onPressIn={(e) => {
        setIsPressed(true);
        props.onPressIn?.(e);
      }}
      onPressOut={(e) => {
        setIsPressed(false);
        props.onPressOut?.(e);
      }}
      className={cn("relative w-12 h-12", containerClassName)}
      {...props}
    >
      {/* Shadow layer (3px offset according to Node ID: 4Z0dJ) */}
      <View
        className={cn(
          "absolute w-full h-full rounded-full top-[3px] left-[3px]",
          shadowColor,
        )}
      />

      {/* Content layer (48x48, 3px border, Lucide X icon) */}
      <View
        className={cn(
          "absolute w-full h-full rounded-full border-[3px] border-black items-center justify-center",
          bgClassName,
          isPressed ? "top-[3px] left-[3px]" : "top-0 left-0",
          className,
        )}
      >
        <X size={24} color="#000000" strokeWidth={3} />
      </View>
    </TouchableOpacity>
  );
}
