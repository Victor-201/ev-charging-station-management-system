import { useState, useEffect, useCallback, useRef } from 'react';
import stationService from '../services/stationService';
import { logger } from '../utils/logger';

/**
 * Custom hook for managing station data
 * @param {Object} options - Hook options
 * @param {boolean} options.autoFetch - Whether to automatically fetch stations on mount
 * @param {number} options.latitude - Latitude for nearby search
 * @param {number} options.longitude - Longitude for nearby search
 * @param {number} options.radius - Search radius in km
 * @returns {Object} Station data and methods
 */
export default function useStations(options = {}) {
  const {
    autoFetch = false,
    latitude = null,
    longitude = null,
    radius = 50,
  } = options;

  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const isMountedRef = useRef(true);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  /**
   * Fetch all stations with optional filters
   */
  const fetchStations = useCallback(async (params = {}) => {
    try {
      if (!isMountedRef.current) return null;

      setLoading(true);
      setError(null);

      const response = await stationService.getAll(params);

      // Handle different response structures
      const data = response?.data || response?.stations || response || [];

      if (isMountedRef.current) {
        setStations(Array.isArray(data) ? data : []);
      }

      return data;
    } catch (err) {
      logger.error('Error fetching stations:', err?.message);
      if (isMountedRef.current) {
        setError(err?.message || 'Failed to fetch stations');
        setStations([]);
      }
      return null;
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, []);

  /**
   * Fetch nearby stations based on coordinates
   */
  const fetchNearbyStations = useCallback(async (lat, lng, rad = radius) => {
    try {
      if (!isMountedRef.current) return null;

      setLoading(true);
      setError(null);

      const response = await stationService.getNearby(lat, lng, rad);

      // Handle different response structures
      const data = response?.data || response?.stations || response || [];

      if (isMountedRef.current) {
        setStations(Array.isArray(data) ? data : []);
      }

      return data;
    } catch (err) {
      logger.error('Error fetching nearby stations:', err?.message);
      if (isMountedRef.current) {
        setError(err?.message || 'Failed to fetch nearby stations');
        setStations([]);
      }
      return null;
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [radius]);

  /**
   * Refresh stations data
   */
  const refresh = useCallback(async () => {
    try {
      if (!isMountedRef.current) return;

      setRefreshing(true);
      setError(null);

      if (latitude && longitude) {
        await fetchNearbyStations(latitude, longitude, radius);
      } else {
        await fetchStations();
      }
    } catch (err) {
      logger.error('Error refreshing stations:', err?.message);
      if (isMountedRef.current) {
        setError(err?.message || 'Failed to refresh stations');
      }
    } finally {
      if (isMountedRef.current) {
        setRefreshing(false);
      }
    }
  }, [latitude, longitude, radius, fetchNearbyStations, fetchStations]);

  /**
   * Get station by ID
   */
  const getStationById = useCallback(async (stationId) => {
    try {
      const response = await stationService.getById(stationId);
      return response?.data || response;
    } catch (err) {
      logger.error('Error fetching station details:', err?.message);
      throw err;
    }
  }, []);

  /**
   * Auto-fetch on mount if enabled
   */
  useEffect(() => {
    if (autoFetch && isMountedRef.current) {
      if (latitude && longitude) {
        fetchNearbyStations(latitude, longitude, radius);
      } else {
        fetchStations();
      }
    }
  }, [autoFetch, latitude, longitude, radius, fetchNearbyStations, fetchStations]);

  return {
    stations,
    loading,
    error,
    refreshing,
    fetchStations,
    fetchNearbyStations,
    refresh,
    getStationById,
  };
}

