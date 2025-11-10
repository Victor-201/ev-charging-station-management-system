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

  // Determine user id from provided param or auth state
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
      const resp = await walletService.getWallet(uid);

      // paymentService wrapped in walletService returns response.data which may have shape { success, data }
      const data = resp?.data ?? resp?.result ?? resp;

      if (resp && resp.success && resp.data) {
        dispatch(fetchWalletSuccess(resp.data));
      } else if (data) {
        dispatch(fetchWalletSuccess(data));
      }

      setLoading(false);
      return data;
    } catch (err) {
      setError(err);
      setLoading(false);
      console.error('useWallet fetch error', err);
      return null;
    }
  };

  useEffect(() => {
    if (autoFetch) fetchWallet();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoFetch, userId]);

  return { wallet, loading, error, fetchWallet };
}
