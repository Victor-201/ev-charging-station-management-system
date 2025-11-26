import axios from 'axios';
import config from '../config/env.js';

export default {
  async getStations(stationIds, token) {
    const res = await axios.get(`${config.STATION_URL}/api/v1/stations`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      params: { station_ids: stationIds }
    });

    // API trả về array trực tiếp
    if (Array.isArray(res.data)) return res.data;

    // fallback nếu sau này server thay đổi
    if (Array.isArray(res.data?.stations)) return res.data.stations;

    console.error("❌ StationClient.getStations returned invalid:", res.data);
    return [];
  }
};
