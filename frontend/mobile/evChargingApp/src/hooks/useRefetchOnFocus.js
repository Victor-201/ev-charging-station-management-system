import { useCallback, useRef } from 'react';
import { useFocusEffect } from '@react-navigation/native';

/**
 * A custom hook that refetches data when the screen comes into focus.
 * It also prevents refetching if the screen was just mounted (to avoid duplicate calls).
 * 
 * @param {Function} refetch - The function to call when the screen comes into focus
 * @param {boolean} enabled - Whether to enable refetching (default: true)
 */
export default function useRefetchOnFocus(refetch, enabled = true) {
  const firstTimeRef = useRef(true);

  useFocusEffect(
    useCallback(() => {
      // Skip the first time (when component mounts) to avoid duplicate API calls
      // because the component usually fetches data on mount already
      if (firstTimeRef.current) {
        firstTimeRef.current = false;
        return;
      }

      // Only refetch if enabled
      if (enabled && refetch) {
        refetch();
      }
    }, [refetch, enabled])
  );
}

