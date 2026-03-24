import React, { useState, useCallback } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring, 
  withTiming, 
  runOnJS,
  interpolate,
  Extrapolate
} from 'react-native-reanimated';
import { Trash2 } from 'lucide-react-native';
import { Audio } from 'expo-av';

const SHARD_COUNT = 12;
const COLORS = ["#CCFF00", "#FFE600", "#5CE1E6", "#FF4911", "#000000"];
const SHATTER_SOUND_URL = "https://assets.mixkit.co/active_storage/sfx/21/21-preview.mp3";

interface SwipeableShatterRowProps {
  children: React.ReactNode;
  onDelete: () => void;
}

const Shard = ({ index }: { index: number }) => {
  const progress = useSharedValue(0);
  const size = Math.random() * 30 + 10;
  const color = COLORS[Math.floor(Math.random() * COLORS.length)];
  
  // Random trajectory
  const angle = (Math.PI * 2 * index) / SHARD_COUNT + (Math.random() * 0.5 - 0.25);
  const distance = Math.random() * 150 + 50;
  const targetX = Math.cos(angle) * distance;
  const targetY = Math.sin(angle) * distance;
  const rotation = Math.random() * 720 - 360;

  React.useEffect(() => {
    progress.value = withTiming(1, { duration: 600 });
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: progress.value * targetX },
        { translateY: progress.value * targetY },
        { rotate: `${progress.value * rotation}deg` },
        { scale: interpolate(progress.value, [0, 0.8, 1], [1, 1.2, 0]) }
      ],
      opacity: interpolate(progress.value, [0, 0.8, 1], [1, 1, 0]),
    };
  });

  return (
    <Animated.View
      style={[
        animatedStyle,
        {
          position: 'absolute',
          width: size,
          height: size,
          backgroundColor: color,
          borderWidth: 2,
          borderColor: '#000',
        }
      ]}
    />
  );
};

export const SwipeableShatterRow = ({ children, onDelete }: SwipeableShatterRowProps) => {
  const translateX = useSharedValue(0);
  const [isShattering, setIsShattering] = useState(false);
  const [isDeleted, setIsDeleted] = useState(false);

  const SWIPE_THRESHOLD = -80;

  const panGesture = Gesture.Pan()
    .activeOffsetX([-20, 20]) // Start swiping only after 20px move
    .failOffsetY([-5, 5])      // Let parent scroll handle it if vertical move detected
    .onChange((event) => {
      if (isShattering) return;
      // Only allow left swipe
      translateX.value = Math.min(0, event.translationX);
    })
    .onEnd((event) => {
      if (isShattering) return;
      if (event.translationX < SWIPE_THRESHOLD) {
        translateX.value = withSpring(SWIPE_THRESHOLD);
      } else {
        translateX.value = withSpring(0);
      }
    });

  const playSound = async () => {
    try {
      const { sound } = await Audio.Sound.createAsync(
        { uri: SHATTER_SOUND_URL },
        { shouldPlay: true }
      );
      // Automatically unload after playing to free up memory
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          sound.unloadAsync();
        }
      });
    } catch (error) {
      console.warn("Sound play failed", error);
    }
  };

  const handleDelete = () => {
    playSound();
    setIsShattering(true);
    // After animation starts, wait briefly then trigger actual delete
    setTimeout(() => {
      setIsDeleted(true);
      onDelete();
    }, 600);
  };

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: translateX.value }],
    };
  });

  const deleteBtnStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      translateX.value,
      [SWIPE_THRESHOLD, 0],
      [1, 0],
      Extrapolate.CLAMP
    );
    const scale = interpolate(
      translateX.value,
      [SWIPE_THRESHOLD, 0],
      [1, 0.4],
      Extrapolate.CLAMP
    );
    const rotate = interpolate(
      translateX.value,
      [SWIPE_THRESHOLD, 0],
      [15, 0],
      Extrapolate.CLAMP
    );
    return {
      opacity,
      transform: [
        { scale },
        { rotate: `${rotate}deg` }
      ],
    };
  });

  if (isDeleted) return null;

  return (
    <View style={styles.container}>
      {/* Background Actions */}
      <View style={styles.background}>
        <View className="flex-1" />
        <Animated.View style={[styles.deleteBtn, deleteBtnStyle]}>
          <TouchableOpacity 
            onPress={handleDelete}
            activeOpacity={0.7}
            className="bg-brand-orange w-16 h-16 border-4 border-black items-center justify-center shadow-[4px_4px_0px_#000]"
          >
            <Trash2 size={28} color="#000" strokeWidth={3} />
          </TouchableOpacity>
        </Animated.View>
      </View>

      {/* Main Content */}
      <GestureDetector gesture={panGesture}>
        <Animated.View style={[animatedStyle, { zIndex: 1 }]}>
          {!isShattering ? (
            children
          ) : (
            <View style={styles.shatterContainer}>
               {Array.from({ length: SHARD_COUNT }).map((_, i) => (
                 <Shard key={i} index={i} />
               ))}
            </View>
          )}
        </Animated.View>
      </GestureDetector>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    marginBottom: 6, // Match the spacing in transactions list
  },
  background: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingRight: 24,
  },
  deleteBtn: {
    zIndex: 0,
  },
  shatterContainer: {
    height: 100, // Approximate height of a card
    alignItems: 'center',
    justifyContent: 'center',
  }
});
