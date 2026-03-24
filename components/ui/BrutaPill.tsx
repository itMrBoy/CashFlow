import React from 'react';
import { TouchableOpacity, Text, TouchableOpacityProps, View } from 'react-native';
import { cn } from '../../lib/utils';

export interface BrutaPillProps extends TouchableOpacityProps {
  containerClassName?: string;
  textClassName?: string;
  label: string;
  isActive?: boolean;
  activeBgColor?: string;
  inactiveBgColor?: string;
}

export function BrutaPill({ 
  className, 
  containerClassName,
  textClassName,
  label,
  isActive = false,
  activeBgColor = "bg-brand-purple",
  inactiveBgColor = "bg-white",
  style,
  ...props 
}: BrutaPillProps) {
  return (
    <View 
      className={cn("relative self-start", containerClassName)}
    >
      {/* Shadow layer: Use fixed pixel offsets to avoid Android w-full/h-full bug */}
      {isActive && (
        <View 
          className="absolute bg-black" 
          style={{ 
            top: 4, 
            left: 4, 
            bottom: 0, 
            right: 0, 
            borderRadius: 100, // Explicit rounding for Android consistency
            zIndex: -1 
          }}
        />
      )}
      
      <TouchableOpacity
        activeOpacity={0.8}
        {...props}
      >
        <View 
          className={cn(
            "border-black px-4 py-2 items-center justify-center", 
            isActive ? `border-4 ${activeBgColor}` : `border-2 ${inactiveBgColor}`,
            className
          )} 
          style={[{ borderRadius: 100 }, style]} // Explicit rounding + merged custom style
        >
          <Text className={cn("font-black text-xs text-black", textClassName)}>
            {label}
          </Text>
        </View>
      </TouchableOpacity>
    </View>
  );
}
