import React from 'react';
import { TouchableOpacity, TouchableOpacityProps, View } from 'react-native';
import { cn } from '../../lib/utils';

export interface BadProps extends TouchableOpacityProps {
  containerClassName?: string;
}

export function Bad({ className, containerClassName, ...props }: BadProps) {
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      className={cn(
        "w-12 h-12 rounded-full border-[6px] border-black bg-[#FF4433] items-center justify-center shadow-[4px_4px_0px_#000]",
        containerClassName,
        className
      )}
      {...props}
    >
      <View className="relative w-8 h-8">
        {/* Eyebrows (eJxTh, ENKyZ) */}
        <View 
          className="absolute top-[2px] left-[2px] w-[10px] h-[3.5px] bg-black" 
          style={{ transform: [{ rotate: '-18deg' }] }} 
        />
        <View 
          className="absolute top-[2px] right-[2px] w-[10px] h-[3.5px] bg-black" 
          style={{ transform: [{ rotate: '18deg' }] }} 
        />
        
        {/* Eyes (Diamonds) (FuuBj, Mxxru) */}
        <View 
          className="absolute top-[10px] left-[2px] w-[6px] h-[6px] bg-black" 
          style={{ transform: [{ rotate: '45deg' }] }} 
        />
        <View 
          className="absolute top-[10px] right-[2px] w-[6px] h-[6px] bg-black" 
          style={{ transform: [{ rotate: '45deg' }] }} 
        />

        {/* Bridge (Yh4Yf) */}
        <View className="absolute top-[15px] left-1/2 -ml-[2.5px] w-[5px] h-[2px] bg-black" />

        {/* Mouth (Mq8Fz) */}
        <View className="absolute bottom-[4px] left-[10px] right-[8px] h-[2.5px] bg-black" />
      </View>
    </TouchableOpacity>
  );
}
