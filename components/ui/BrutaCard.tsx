import React from 'react';
import { View, ViewProps } from 'react-native';
import { cn } from '../../lib/utils';

export interface BrutaCardProps extends ViewProps {
  containerClassName?: string;
  bgClassName?: string;
  shadowColor?: string;
}

export function BrutaCard({ 
  className, 
  containerClassName, 
  bgClassName = "bg-white",
  shadowColor = "bg-black",
  children, 
  ...props 
}: BrutaCardProps) {
  return (
    <View className={cn("relative", containerClassName)}>
      {/* Shadow */}
      <View className={cn("absolute top-1 left-1 w-full h-full rounded-md", shadowColor)} />
      {/* Content */}
      <View 
        className={cn(
          "relative border-4 border-black rounded-md p-4", 
          bgClassName,
          className
        )} 
        {...props}
      >
        {children}
      </View>
    </View>
  );
}
