import { useRef, useCallback, useState } from 'react';
import { Animated, FlatList, ScrollView } from 'react-native';

/**
 * Unified hook to manage FAB and Back-to-Top button animations during scrolling
 */
export function useScrollController() {
  const fabAnim = useRef(new Animated.Value(1)).current;
  const topBtnAnim = useRef(new Animated.Value(0)).current;
  const flatListRef = useRef<FlatList>(null);
  const scrollY = useRef(0);
  const [showTopBtn, setShowTopBtn] = useState(false);

  const animateButtons = useCallback((show: boolean) => {
    const isBeyondFirstPage = scrollY.current > 10;

    // Animate FAB
    Animated.spring(fabAnim, {
      toValue: show ? 1 : 0,
      useNativeDriver: true,
      friction: 8,
      tension: 40,
    }).start();

    // Animate Back to Top Button
    Animated.spring(topBtnAnim, {
      toValue: show && isBeyondFirstPage ? 1 : 0,
      useNativeDriver: true,
      friction: 8,
      tension: 40,
    }).start();

    // Toggle pointer events
    setShowTopBtn(show && isBeyondFirstPage);
  }, [fabAnim, topBtnAnim]);

  const handleScroll = (event: any) => {
    scrollY.current = event.nativeEvent.contentOffset.y;
  };

  const scrollToTop = () => {
    flatListRef.current?.scrollToOffset({
      offset: 0,
      animated: true,
    });
  };

  const scrollProps = {
    onScroll: handleScroll,
    onScrollBeginDrag: useCallback(() => animateButtons(false), [animateButtons]),
    onScrollEndDrag: useCallback(() => animateButtons(true), [animateButtons]),
    onMomentumScrollBegin: useCallback(() => animateButtons(false), [animateButtons]),
    onMomentumScrollEnd: useCallback(() => animateButtons(true), [animateButtons]),
    scrollEventThrottle: 16,
  };

  return {
    fabAnim,
    topBtnAnim,
    showTopBtn,
    flatListRef,
    scrollToTop,
    scrollProps,
  };
}
