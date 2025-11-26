import axios from 'axios';
import config from '../config/env.js';

export default {
  async getSessions(sessionIds, token) {
    const res = await axios.get(`${config.CHARGING_URL}/api/v1/charging`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      params: { session_ids: sessionIds }
    });

    // API trả về array trực tiếp
    if (Array.isArray(res.data)) return res.data;

    // fallback nếu API thay đổi
    if (Array.isArray(res.data?.sessions)) return res.data.sessions;

    console.error("❌ ChargingClient.getSessions returned invalid:", res.data);
    return [];
  }
};
