// contexts/ThemeContext.js
import React, { createContext, useState, useEffect, useContext } from 'react';

// Theme-Kontext erstellen
const ThemeContext = createContext();

// Hook für einfachen Zugriff auf das Theme
export const useTheme = () => useContext(ThemeContext);

// Farbkonstanten für Light- und Dark-Mode
const themes = {
  light: {
    background: '#f8fafc',
    card: '#ffffff',
    primary: '#3b82f6',
    secondary: '#6366f1',
    success: '#22c55e',
    warning: '#eab308',
    danger: '#ef4444',
    text: {
      primary: '#0f172a',
      secondary: '#475569',
      muted: '#94a3b8'
    },
    border: '#e2e8f0',
    hover: {
      primary: '#2563eb',
      card: '#f1f5f9'
    },
    chart: {
      systolic: '#ef4444',
      diastolic: '#3b82f6',
      pulse: '#22c55e',
      grid: '#e2e8f0',
      reference: '#6366f1'
    },
    categories: {
      optimal: '#15803d',
      normal: '#16a34a',
      highNormal: '#ca8a04',
      hypertension1: '#ea580c',
      hypertension2: '#dc2626',
      hypertension3: '#be185d'
    }
  },
  dark: {
    background: '#0f172a',
    card: '#1e293b',
    primary: '#3b82f6',
    secondary: '#818cf8',
    success: '#4ade80',
    warning: '#facc15',
    danger: '#f87171',
    text: {
      primary: '#f8fafc',
      secondary: '#cbd5e1',
      muted: '#64748b'
    },
    border: '#334155',
    hover: {
      primary: '#60a5fa',
      card: '#334155'
    },
    chart: {
      systolic: '#f87171',
      diastolic: '#60a5fa',
      pulse: '#4ade80',
      grid: '#334155',
      reference: '#a5b4fc'
    },
    categories: {
      optimal: '#22c55e',
      normal: '#4ade80',
      highNormal: '#fcd34d',
      hypertension1: '#fb923c',
      hypertension2: '#f87171',
      hypertension3: '#ec4899'
    }
  }
};

export const ThemeProvider = ({ children }) => {
  // Dark Mode Präferenz des Systems erkennen
  const prefersDarkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  
  // Theme-State mit System-Präferenz als Standard
  const [isDarkMode, setIsDarkMode] = useState(prefersDarkMode);
  const [currentTheme, setCurrentTheme] = useState(prefersDarkMode ? themes.dark : themes.light);
  
  // Theme-Wechsel-Funktion
  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };
  
  // System-Präferenz überwachen
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = (e) => {
      setIsDarkMode(e.matches);
    };
    
    mediaQuery.addEventListener('change', handleChange);
    
    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, []);
  
  // Theme aktualisieren, wenn isDarkMode sich ändert
  useEffect(() => {
    setCurrentTheme(isDarkMode ? themes.dark : themes.light);
    
    // HTML-Element mit Klasse für CSS-Selektoren aktualisieren
    document.documentElement.classList.toggle('dark-mode', isDarkMode);
    
    // Meta-Theme-Color für mobiles Chrome anpassen
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', isDarkMode ? themes.dark.background : themes.light.background);
    }
  }, [isDarkMode]);
  
  return (
    <ThemeContext.Provider value={{ theme: currentTheme, isDarkMode, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export default ThemeProvider;