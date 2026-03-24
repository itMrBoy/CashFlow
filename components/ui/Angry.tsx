import React from 'react';
import { TouchableOpacity, TouchableOpacityProps, View } from 'react-native';
import { cn } from '../../lib/utils';

export interface AngryProps extends TouchableOpacityProps {
  containerClassName?: string;
}

export function Angry({ className, containerClassName, ...props }: AngryProps) {
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      className={cn(
        "w-12 h-12 rounded-[4px] border-[4px] border-black bg-[#FF4433] items-center justify-center shadow-[4px_4px_0px_#000]",
        containerClassName,
        className
      )}
      {...props}
    >
      <View className="relative w-8 h-8">
        {/* Eyebrows - Angled Rectangles (CYrFK, lxsMw) */}
        <View 
          className="absolute top-[2px] left-[-2px] w-[13px] h-[3px] bg-black" 
          style={{ transform: [{ rotate: '-18deg' }] }} 
        />
        <View 
          className="absolute top-[2px] right-[-2px] w-[13px] h-[3px] bg-black" 
          style={{ transform: [{ rotate: '18deg' }] }} 
        />
        
        {/* Eyes (Diamonds) (RVJyq, nSlxK) */}
        <View 
          className="absolute top-[12px] left-[2px] w-[6px] h-[6px] bg-black" 
          style={{ transform: [{ rotate: '45deg' }] }} 
        />
        <View 
          className="absolute top-[12px] right-[2px] w-[6px] h-[6px] bg-black" 
          style={{ transform: [{ rotate: '45deg' }] }} 
        />

        {/* Mouth (Rectangle Frame) (feqhN) */}
        <View className="absolute bottom-[4px] left-[3px] right-[3px] h-[2px] bg-black" />
      </View>
    </TouchableOpacity>
  );
}
