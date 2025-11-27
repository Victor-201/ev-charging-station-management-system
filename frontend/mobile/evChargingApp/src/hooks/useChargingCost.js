import { useState, useEffect, useCallback } from 'react';
import paymentService from '../services/paymentService';
import { useAuth } from './useAuth';

/**
 * Hook để quản lý chi phí sạc của người dùng
 * Lấy dữ liệu chi phí sạc hàng tháng và tổng chi phí
 */
export const useChargingCost = (userId = null, months = 12) => {
  const { user } = useAuth();
  const [monthlyData, setMonthlyData] = useState({});
  const [totalCost, setTotalCost] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Xác định user ID cần lấy dữ liệu
  const targetUserId = userId || user?.id || user?.user_id;

  const fetchChargingCost = useCallback(async () => {
    if (!targetUserId) {
      setError('User ID not found');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Lấy dữ liệu chi phí hàng tháng và tổng chi phí song song
      const [monthly, total] = await Promise.all([
        paymentService.getMonthlyChargingCost(targetUserId, months),
        paymentService.getChargingTotal(targetUserId),
      ]);

      setMonthlyData(monthly);
      setTotalCost(total);
    } catch (err) {
      console.error('Error fetching charging cost:', err);
      setError(err?.response?.data?.message || err.message || 'Failed to fetch charging cost');
    } finally {
      setLoading(false);
    }
  }, [targetUserId, months]);

  // Tự động fetch khi component mount hoặc dependencies thay đổi
  useEffect(() => {
    fetchChargingCost();
  }, [fetchChargingCost]);

  // Tính toán thống kê từ dữ liệu hàng tháng
  const stats = {
    totalMonths: Object.keys(monthlyData).length,
    averageCost: monthlyData && Object.keys(monthlyData).length > 0
      ? Object.values(monthlyData).reduce((a, b) => a + b, 0) / Object.keys(monthlyData).length
      : 0,
    maxCost: monthlyData && Object.keys(monthlyData).length > 0
      ? Math.max(...Object.values(monthlyData))
      : 0,
    minCost: monthlyData && Object.keys(monthlyData).length > 0
      ? Math.min(...Object.values(monthlyData))
      : 0,
  };

  return {
    monthlyData,
    totalCost,
    loading,
    error,
    stats,
    refetch: fetchChargingCost,
  };
};

export default useChargingCost;

