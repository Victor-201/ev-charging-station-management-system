import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import walletService from '../services/walletService';
import { fetchWalletSuccess } from '../store/slices/walletSlice';

export default function useWallet(autoFetch = true, providedUserId) {
  const dispatch = useDispatch();
  const wallet = useSelector((state) => state.wallet?.wallet);
  const authUser = useSelector((state) => state.auth?.user);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Determine user id from provided param or auth state - use useMemo to prevent unnecessary re-renders
  const userId = providedUserId || authUser?.id || authUser?.user_id || authUser?.sub || null;

  const fetchWallet = async (overrideUserId) => {
    const uid = overrideUserId || userId;
    if (!uid) {
      const err = new Error('No user id available to fetch wallet');
      setError(err);
      return null;
    }

    setLoading(true);
    setError(null);
    try {
      // walletService.getWallet already extracts data from response
      const data = await walletService.getWallet(uid);
      
      if (data) {
        dispatch(fetchWalletSuccess(data));
      }

      setLoading(false);
      return data;
    } catch (err) {
      setError(err);
      setLoading(false);
      console.error('useWallet fetch error:', err.message || err);
      // Log more details for debugging
      if (err.response) {
        console.error('Response status:', err.response.status);
        console.error('Response data:', err.response.data);
      }
      return null;
    }
  };

  useEffect(() => {
    // Only fetch once on mount if autoFetch is true and userId is available
    if (autoFetch && userId) {
      fetchWallet();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { wallet, loading, error, fetchWallet };
}
