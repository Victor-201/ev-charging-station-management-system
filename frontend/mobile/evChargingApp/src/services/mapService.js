
import { Linking, Platform } from 'react-native';

function buildAppleMapsUrl({ saddr, daddr, name }) {
  const base = 'http://maps.apple.com/';
  const params = new URLSearchParams();
  if (daddr) params.append('daddr', `${daddr.lat},${daddr.lng}`);
  if (saddr) params.append('saddr', `${saddr.lat},${saddr.lng}`);
  if (name) params.append('q', name);
  params.append('dirflg', 'd'); // driving
  return `${base}?${params.toString()}`;
}

function buildAndroidMapsUrl({ saddr, daddr, name }) {
  // Prefer Google Maps URL (works even if app not installed)
  const base = 'https://www.google.com/maps/dir/';
  const s = saddr ? `${saddr.lat},${saddr.lng}` : '';
  const d = daddr ? `${daddr.lat},${daddr.lng}` : '';
  const n = name ? `/${encodeURIComponent(name)}` : '';
  return `${base}${s}/${d}${n}`;
}

async function openUrl(url) {
  const supported = await Linking.canOpenURL(url);
  if (!supported) throw new Error('Không thể mở ứng dụng bản đồ');
  return Linking.openURL(url);
}

const mapService = {
  openDirections: async ({ from, to, name }) => {
    if (!to?.lat || !to?.lng) throw new Error('Thiếu tọa độ điểm đến');
    const url = Platform.select({
      ios: buildAppleMapsUrl({ saddr: from, daddr: to, name }),
      android: buildAndroidMapsUrl({ saddr: from, daddr: to, name }),
      default: buildAndroidMapsUrl({ saddr: from, daddr: to, name }),
    });
    return openUrl(url);
  },
};

export default mapService;
