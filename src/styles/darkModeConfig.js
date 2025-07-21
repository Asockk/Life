// styles/darkModeConfig.js

// Dark mode color palette with improved contrast ratios
export const darkModeColors = {
  // Background colors with better layering
  background: {
    primary: '#0f172a',    // Main background (slate-900)
    secondary: '#1e293b',  // Card backgrounds (slate-800)
    tertiary: '#334155',   // Elevated surfaces (slate-700)
    hover: '#475569',      // Hover states (slate-600)
  },
  
  // Text colors with WCAG AA compliance
  text: {
    primary: '#f1f5f9',    // Main text (slate-100)
    secondary: '#cbd5e1',  // Secondary text (slate-300)
    muted: '#94a3b8',      // Muted text (slate-400)
    disabled: '#64748b',   // Disabled text (slate-500)
  },
  
  // Border colors
  border: {
    default: '#334155',    // Default borders (slate-700)
    light: '#475569',      // Light borders (slate-600)
    focus: '#3b82f6',      // Focus borders (blue-500)
  },
  
  // Status colors with better contrast
  status: {
    success: '#10b981',    // Success (emerald-500)
    warning: '#f59e0b',    // Warning (amber-500)
    error: '#ef4444',      // Error (red-500)
    info: '#3b82f6',       // Info (blue-500)
  },
  
  // Blood pressure category colors (adjusted for dark mode)
  bloodPressure: {
    optimal: '#34d399',    // Brighter green for dark bg
    normal: '#10b981',     // Emerald for normal
    hochNormal: '#fbbf24', // Brighter yellow
    hypertonie1: '#fb923c', // Brighter orange
    hypertonie2: '#f87171', // Brighter red
    hypertonie3: '#dc2626', // Deep red
  }
};

// Transition configurations
export const transitions = {
  // Theme transition
  theme: 'background-color 0.3s ease, color 0.3s ease, border-color 0.3s ease',
  
  // Interactive elements
  button: 'all 0.2s ease',
  hover: 'all 0.15s ease',
  
  // Page transitions
  page: 'opacity 0.3s ease, transform 0.3s ease',
  
  // Modal/dialog transitions
  modal: 'opacity 0.2s ease, transform 0.2s ease',
};

// CSS classes for dark mode
export const darkModeClasses = {
  // Container styles
  container: 'dark:bg-slate-900 dark:text-slate-100',
  card: 'dark:bg-slate-800 dark:border-slate-700',
  
  // Text styles
  textPrimary: 'dark:text-slate-100',
  textSecondary: 'dark:text-slate-300',
  textMuted: 'dark:text-slate-400',
  
  // Button styles
  buttonPrimary: 'dark:bg-blue-600 dark:hover:bg-blue-700 dark:text-white',
  buttonSecondary: 'dark:bg-slate-700 dark:hover:bg-slate-600 dark:text-slate-100',
  buttonDanger: 'dark:bg-red-600 dark:hover:bg-red-700 dark:text-white',
  
  // Input styles
  input: 'dark:bg-slate-700 dark:border-slate-600 dark:text-slate-100 dark:placeholder-slate-400',
  
  // Table styles
  tableHeader: 'dark:bg-slate-800 dark:text-slate-100',
  tableRow: 'dark:hover:bg-slate-700',
  tableRowEven: 'dark:bg-slate-800',
  tableRowOdd: 'dark:bg-slate-900',
};

// Utility function to apply dark mode classes
export const getDarkModeClass = (lightClass, darkClass) => {
  return `${lightClass} dark:${darkClass}`;
};

// Chart colors for dark mode
export const darkModeChartColors = {
  grid: '#334155',
  axis: '#64748b',
  tooltip: {
    background: '#1e293b',
    border: '#334155',
    text: '#f1f5f9',
  },
  lines: {
    systolic: '#ef4444',
    diastolic: '#3b82f6',
    pulse: '#10b981',
    average: '#fbbf24',
  }
};

// Media query for detecting dark mode preference
export const darkModeMediaQuery = '(prefers-color-scheme: dark)';

// Helper to get contrast-safe color
export const getContrastColor = (isDark, lightColor, darkColor) => {
  return isDark ? darkColor : lightColor;
};