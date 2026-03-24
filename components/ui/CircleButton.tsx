import React, { useState } from 'react';
import { TouchableOpacity, View, TouchableOpacityProps } from 'react-native';
import { cn } from '../../lib/utils';
import { Plus } from 'lucide-react-native';

export interface CircleButtonProps extends TouchableOpacityProps {
  containerClassName?: string;
  bgClassName?: string;
  shadowColor?: string;
  icon?: React.ReactNode;
}

export function CircleButton({
  className,
  containerClassName,
  bgClassName = "bg-[#FF6B00]",
  shadowColor = "bg-black",
  icon,
  ...props
}: CircleButtonProps) {
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
      className={cn("relative w-16 h-16", containerClassName)}
      {...props}
    >
      {/* Shadow */}
      <View 
        className={cn("absolute w-16 h-16 rounded-full top-1 left-1", shadowColor)} 
      />
      
      {/* Content */}
      <View 
        className={cn(
          "absolute w-16 h-16 rounded-full border-4 border-black items-center justify-center", 
          bgClassName,
          isPressed ? "top-1 left-1" : "top-0 left-0",
          className
        )} 
      >
        {icon || <Plus size={32} color="#000000" strokeWidth={3} />}
      </View>
    </TouchableOpacity>
  );
}
