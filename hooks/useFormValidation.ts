import { useState, useCallback } from 'react';
import { useSharedValue, useAnimatedStyle, withSequence, withTiming, withRepeat } from 'react-native-reanimated';

/**
 * useFormValidation Hook
 * Handles form validation state and shake animations for required fields.
 */
export function useFormValidation() {
  const [errors, setErrors] = useState<Record<string, boolean>>({});
  const shakeX = useSharedValue(0);

  // Shake animation using reanimated
  const triggerShake = useCallback(() => {
    shakeX.value = withSequence(
      withTiming(-10, { duration: 50 }),
      withRepeat(withTiming(10, { duration: 100 }), 3, true),
      withTiming(0, { duration: 50 })
    );
  }, []);

  /**
   * Validates the provided data against a list of required fields.
   * If validation fails, it sets errors and triggers a shake animation.
   */
  const validate = useCallback((data: Record<string, any>, requiredFields: string[]) => {
    const newErrors: Record<string, boolean> = {};
    let hasError = false;

    requiredFields.forEach(field => {
      const value = data[field];
      // Check for empty strings, null, undefined, or empty arrays
      if (
        value === undefined ||
        value === null ||
        (typeof value === 'string' && value.trim() === '') ||
        (Array.isArray(value) && value.length === 0)
      ) {
        newErrors[field] = true;
        hasError = true;
      }
    });

    setErrors(newErrors);

    if (hasError) {
      triggerShake();
      return false;
    }

    return true;
  }, [triggerShake]);

  const clearError = useCallback((field: string) => {
    setErrors(prev => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }, []);

  const shakeStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shakeX.value }],
  }));

  return { 
    errors, 
    validate, 
    clearError, 
    shakeStyle, 
    triggerShake,
    setErrors 
  };
}
