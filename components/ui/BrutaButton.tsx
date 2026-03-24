import React, { useState } from 'react';
import { TouchableOpacity, Text, TouchableOpacityProps, View } from 'react-native';
import { cn } from '../../lib/utils';

export interface BrutaButtonProps extends TouchableOpacityProps {
  containerClassName?: string;
  textClassName?: string;
  bgClassName?: string;
  shadowColor?: string;
  title?: string;
  children?: React.ReactNode;
}

export function BrutaButton({ 
  className, 
  containerClassName,
  textClassName,
  bgClassName = "bg-brand-orange",
  shadowColor = "bg-black",
  title,
  children,
  ...props 
}: BrutaButtonProps) {
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
      className={cn("relative", containerClassName)}
      {...props}
    >
      {/* Shadow */}
      <View className={cn("absolute top-1.5 left-1.5 w-full h-full rounded-md", shadowColor)} />
      
      {/* Content */}
      <View 
        className={cn(
          "relative border-4 border-black rounded-md py-4 px-6 flex-row items-center justify-center", 
          bgClassName,
          isPressed ? "top-1.5 left-1.5" : "top-0 left-0",
          className
        )} 
      >
        {children}
        {title && (
          <Text className={cn("font-black text-lg text-black uppercase", textClassName)}>
            {title}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
}
