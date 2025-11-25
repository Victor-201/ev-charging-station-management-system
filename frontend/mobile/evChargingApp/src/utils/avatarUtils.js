// Utility helpers for generating avatar initials and deterministic background color from a name
// Keeps colors readable by mapping a name to an H value in HSL and using fixed S/L.

export function getInitials(name) {
  if (!name || typeof name !== 'string') return 'U';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'U';
  const first = parts[0][0] || '';
  const last = parts.length > 1 ? parts[parts.length - 1][0] : (parts[0][1] || '');
  return (first + last).toUpperCase();
}

function hashCode(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i += 1) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

export function nameToHsl(name, saturation = 65, lightness = 55) {
  const h = hashCode(name || 'user') % 360; // hue 0..359
  return { h, s: saturation, l: lightness, hsl: `hsl(${h}, ${saturation}%, ${lightness}%)` };
}

export function getAvatarData(name, themeColors, options = {}) {
  const { s = 65, l = 55 } = options;
  const initials = getInitials(name);
  const { hsl, l: lightness } = nameToHsl(name, s, l);
  // Choose text color based on lightness, falling back to theme onPrimary/onSurface
  const textColor = lightness < 62 ? (themeColors?.onPrimary || '#ffffff') : (themeColors?.onSurface || '#000000');
  return { initials, backgroundColor: hsl, textColor };
}

