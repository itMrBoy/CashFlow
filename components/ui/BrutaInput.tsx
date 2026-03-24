import React from 'react';
import { View, TextInput, TextInputProps } from 'react-native';
import { cn } from '../../lib/utils';

export interface BrutaInputProps extends TextInputProps {
  containerClassName?: string;
  bgClassName?: string;
  shadowColor?: string;
  wrapperClassName?: string;
  leftIcon?: React.ReactNode;
}

export function BrutaInput({ 
  className, 
  containerClassName,
  wrapperClassName,
  bgClassName = "bg-white",
  shadowColor = "bg-black",
  leftIcon,
  ...props 
}: BrutaInputProps) {
  return (
    <View className={cn("relative", containerClassName)}>
      {/* Shadow */}
      <View className={cn("absolute top-1.5 left-1.5 w-full h-full rounded-md", shadowColor)} />
      
      {/* Content */}
      <View 
        className={cn(
          "relative border-4 border-black rounded-md px-4 h-14 flex-row items-center", 
          bgClassName,
          wrapperClassName
        )} 
      >
        {leftIcon && <View className="mr-3">{leftIcon}</View>}
        <TextInput
          className={cn("flex-1 font-bold text-base text-black", className)}
          placeholderTextColor="#999999"
          {...props}
        />
      </View>
    </View>
  );
}
