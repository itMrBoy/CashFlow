import React, { useEffect } from 'react';
import { View } from 'react-native';
import Animated, { 
  useAnimatedStyle, 
  withSpring, 
  useSharedValue, 
  interpolate 
} from 'react-native-reanimated';
import { Smile } from './Smile';
import { Angry } from './Angry';
import { Bad } from './Bad';

export type EmojiStatus = 'smile' | 'bad' | 'angry';

interface StatusEmojiProps {
  status: EmojiStatus;
  onPress?: () => void;
}

export function StatusEmoji({ status, onPress }: StatusEmojiProps) {
  const progress = useSharedValue(0); // 0: smile, 1: bad, 2: angry

  useEffect(() => {
    let target = 0;
    if (status === 'bad') target = 1;
    else if (status === 'angry') target = 2;

    progress.value = withSpring(target, { 
      damping: 15,
      stiffness: 100 
    });
  }, [status]);

  const smileStyle = useAnimatedStyle(() => {
    return {
      opacity: interpolate(progress.value, [0, 0.5, 1], [1, 0, 0]),
      transform: [
        { scale: interpolate(progress.value, [0, 0.5], [1, 0.5]) },
        { rotate: `${interpolate(progress.value, [0, 0.5], [0, -45])}deg` }
      ],
      pointerEvents: status === 'smile' ? 'auto' : 'none',
    };
  });

  const badStyle = useAnimatedStyle(() => {
    return {
      opacity: interpolate(progress.value, [0, 0.5, 1, 1.5, 2], [0, 1, 1, 0, 0]),
      transform: [
        { scale: interpolate(progress.value, [0, 1, 2], [0.5, 1, 0.5]) },
        { rotate: `${interpolate(progress.value, [0, 1, 2], [45, 0, -45])}deg` }
      ],
      pointerEvents: status === 'bad' ? 'auto' : 'none',
    };
  });

  const angryStyle = useAnimatedStyle(() => {
    return {
      opacity: interpolate(progress.value, [1, 1.5, 2], [0, 0, 1]),
      transform: [
        { scale: interpolate(progress.value, [1, 1.5, 2], [0.5, 0.5, 1]) },
        { rotate: `${interpolate(progress.value, [1.5, 2], [45, 0])}deg` }
      ],
      pointerEvents: status === 'angry' ? 'auto' : 'none',
    };
  });

  return (
    <View className="w-12 h-12 items-center justify-center">
      <Animated.View style={[smileStyle, { position: 'absolute' }]}>
        <Smile onPress={onPress} />
      </Animated.View>
      <Animated.View style={[badStyle, { position: 'absolute' }]}>
        <Bad onPress={onPress} />
      </Animated.View>
      <Animated.View style={[angryStyle, { position: 'absolute' }]}>
        <Angry onPress={onPress} />
      </Animated.View>
    </View>
  );
}
