import { useState, useEffect, useRef } from 'react';
import { Accelerometer } from 'expo-sensors';
import { Audio } from 'expo-av';
import { Alert } from 'react-native';
import { useIsFocused } from '@react-navigation/native';

const SHAKE_THRESHOLD = 1.8;
const COOLDOWN_MS = 2000;
const CHEER_SOUND_URI = 'https://assets.mixkit.co/active_storage/sfx/2013/2013-preview.mp3';

export function useShakeReset(onShake: () => void, enabled: boolean = true) {
  const [lastShake, setLastShake] = useState(0);
  const soundRef = useRef<Audio.Sound | null>(null);
  const isFocused = useIsFocused();

  useEffect(() => {
    // Load sound on mount
    const loadSound = async () => {
      try {
        const { sound } = await Audio.Sound.createAsync(
          { uri: CHEER_SOUND_URI },
          { shouldPlay: false }
        );
        soundRef.current = sound;
      } catch (error) {
        console.log('Error loading sound', error);
      }
    };

    loadSound();

    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync();
      }
    };
  }, []);

  useEffect(() => {
    let subscription: { remove: () => void } | null = null;

    const subscribe = () => {
      subscription = Accelerometer.addListener(async (data) => {
        if (!isFocused || !enabled) return;

        const { x, y, z } = data;
        const totalAcceleration = Math.sqrt(x * x + y * y + z * z);
        const now = Date.now();

        if (totalAcceleration > SHAKE_THRESHOLD && now - lastShake > COOLDOWN_MS) {
          setLastShake(now);
          onShake();
          Alert.alert("🎉 触发彩蛋", "摇一摇重置筛选条件！");

          if (soundRef.current) {
            try {
              await soundRef.current.replayAsync();
            } catch (error) {
              console.log('Error playing sound', error);
            }
          }
        }
      });

      Accelerometer.setUpdateInterval(100);
    };

    subscribe();

    return () => {
      subscription?.remove();
    };
  }, [onShake, lastShake, isFocused]);
}
