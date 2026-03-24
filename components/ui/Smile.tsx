import React from 'react';
import { TouchableOpacity, TouchableOpacityProps } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { cn } from '../../lib/utils';

export interface SmileProps extends TouchableOpacityProps {
  containerClassName?: string;
}

export function Smile({ className, containerClassName, ...props }: SmileProps) {
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      className={cn(
        "w-12 h-12 rounded-full border-[4px] border-black bg-[#CCFF00] items-center justify-center shadow-[4px_4px_0px_#000]",
        containerClassName,
        className
      )}
      {...props}
    >
      <Ionicons name="happy-outline" size={28} color="black" />
    </TouchableOpacity>
  );
}
