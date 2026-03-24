import { useRef, useCallback } from 'react';
import { Animated } from 'react-native';

/**
 * Hook to manage FAB show/hide animation during scrolling
 */
export function useFabController() {
  const fabAnim = useRef(new Animated.Value(1)).current;

  const animateFab = useCallback((show: boolean) => {
    Animated.spring(fabAnim, {
      toValue: show ? 1 : 0,
      useNativeDriver: true,
      friction: 8,
      tension: 40,
    }).start();
  }, [fabAnim]);

  // Event handlers to be spread onto FlatList/ScrollView props
  const fabScrollProps = {
    onScrollBeginDrag: useCallback(() => animateFab(false), [animateFab]),
    onScrollEndDrag: useCallback(() => animateFab(true), [animateFab]),
    onMomentumScrollBegin: useCallback(() => animateFab(false), [animateFab]),
    onMomentumScrollEnd: useCallback(() => animateFab(true), [animateFab]),
  };

  return {
    fabAnim,
    animateFab,
    fabScrollProps
  };
}
