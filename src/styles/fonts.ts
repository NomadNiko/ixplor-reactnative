// Font families matching the web frontend
export const FontFamilies = {
  // Main app font - matches frontend "Orbitron Variable"
  primary: 'Orbitron_400Regular',
  primaryMedium: 'Orbitron_500Medium',
  primarySemiBold: 'Orbitron_600SemiBold',
  primaryBold: 'Orbitron_700Bold',
  primaryExtraBold: 'Orbitron_800ExtraBold',
  primaryBlack: 'Orbitron_900Black',

  // Logo font - matches frontend "Iceland"
  logo: 'Iceland_400Regular',
} as const;

// Text styles matching the web theme
export const FontSizes = {
  xs: 12,
  sm: 14,
  base: 16,
  lg: 18,
  xl: 20,
  '2xl': 24,
  '3xl': 30,
  '4xl': 36,
} as const;
