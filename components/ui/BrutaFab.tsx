import React from 'react';
import { Animated, ViewProps } from 'react-native';
import { CircleButton } from './CircleButton';

interface BrutaFabProps {
  onPress: () => void;
  animValue: Animated.Value;
  icon?: React.ReactNode;
  bgClassName?: string;
  containerClassName?: string;
}

export function BrutaFab({ 
  onPress, 
  animValue, 
  icon, 
  bgClassName, 
  containerClassName 
}: BrutaFabProps) {
  return (
    <Animated.View
      style={{
        opacity: animValue,
        transform: [{ scale: animValue }],
      }}
      className={containerClassName}
    >
      <CircleButton
        onPress={onPress}
        bgClassName={bgClassName}
        icon={icon}
      />
    </Animated.View>
  );
}
