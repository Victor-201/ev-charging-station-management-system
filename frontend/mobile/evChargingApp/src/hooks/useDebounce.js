import { useState, useEffect } from 'react';

/**
 * A custom hook that debounces a value.
 * @param {any} value The value to debounce.
 * @param {number} delay The debounce delay in milliseconds.
 * @returns {any} The debounced value.
 */
export default function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    // Set debouncedValue to value (the latest value) after the specified delay
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Return a cleanup function that will be called every time ...
    // ... useEffect is re-called. useEffect will only be re-called ...
    // ... if value or delay changes (see the dependency array below).
    // This is how we prevent debouncedValue from changing if value is ...
    // ... changed within the delay period. Timeout gets cleared and restarted.
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]); // Only re-call effect if value or delay changes

  return debouncedValue;
}

