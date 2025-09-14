// Brand constants and guidelines

export const BRAND_COLORS = {
  primary: '#10B981', // Green from your logo
  primaryLight: '#34D399', // Lighter green
  secondary: '#1A1A2E',
  accent: '#0A0A0A',
  white: '#FFFFFF',
  whiteAlpha: {
    10: 'rgba(255, 255, 255, 0.1)',
    20: 'rgba(255, 255, 255, 0.2)',
    60: 'rgba(255, 255, 255, 0.6)',
    80: 'rgba(255, 255, 255, 0.8)',
  }
} as const;

export const BRAND_TYPOGRAPHY = {
  fontFamily: {
    primary: 'Inter, system-ui, sans-serif',
    display: 'Inter, system-ui, sans-serif',
  },
  fontSize: {
    brand: {
      xs: '0.875rem',   // 14px
      sm: '1rem',       // 16px
      md: '1.25rem',    // 20px
      lg: '1.5rem',     // 24px
      xl: '2rem',       // 32px
      '2xl': '2.5rem',  // 40px
    }
  },
  fontWeight: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    extrabold: 800,
  }
} as const;

export const BRAND_SPACING = {
  logo: {
    xs: '0.5rem',   // 8px
    sm: '0.75rem',  // 12px
    md: '1rem',     // 16px
    lg: '1.5rem',   // 24px
    xl: '2rem',     // 32px
  }
} as const;

export const BRAND_ANIMATIONS = {
  duration: {
    fast: 200,
    normal: 300,
    slow: 500,
  },
  easing: {
    default: 'cubic-bezier(0.4, 0, 0.2, 1)',
    spring: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  }
} as const;

export const BRAND_TAGLINES = {
  primary: 'Your Music, Your Vibe',
  secondary: 'Discover the Sound of Tomorrow',
  short: 'Music Streaming Reimagined',
} as const;

export const BRAND_GUIDELINES = {
  logo: {
    minSize: 24, // minimum size in pixels
    clearSpace: 16, // minimum clear space around logo
    variants: ['full', 'icon', 'text'] as const,
  },
  colors: {
    primary: 'Use for main brand elements, CTAs, and active states',
    secondary: 'Use for backgrounds and containers',
    accent: 'Use for text and subtle elements',
  },
  usage: {
    doNot: [
      'Stretch or distort the logo',
      'Use colors outside the brand palette',
      'Place logo on busy backgrounds without proper contrast',
      'Use the logo smaller than minimum size',
    ],
    do: [
      'Maintain proper aspect ratio',
      'Use sufficient contrast',
      'Provide adequate clear space',
      'Use approved color combinations',
    ]
  }
} as const;