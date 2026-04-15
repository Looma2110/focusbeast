export const Colors = {
  primary: '#6C5CE7',
  primaryLight: '#A29BFE',
  secondary: '#00B894',
  accent: '#FDCB6E',
  danger: '#FF6B6B',
  background: '#F8F9FA',
  surface: '#FFFFFF',
  textPrimary: '#2D3436',
  textSecondary: '#636E72',
  surfaceElevated: '#F0F0F5',
  border: '#DFE6E9',
  successGlow: '#00B894',
  warmGlow: '#FDCB6E',
}

export const DarkColors = {
  primary: '#B8AAFF',
  primaryLight: '#D0C6FF',
  secondary: '#5EEABD',
  accent: '#FFE082',
  danger: '#FF8A8A',
  background: '#0F0F14',
  surface: '#1E1E28',
  textPrimary: '#FFFFFF',
  textSecondary: '#C8C8D8',
  surfaceElevated: '#2A2A38',
  border: '#4A4A5A',
  successGlow: '#5EEABD',
  warmGlow: '#FFE082',
}

export function getColors(isDark: boolean) {
  return isDark ? DarkColors : Colors
}
