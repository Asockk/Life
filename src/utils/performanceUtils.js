// utils/performanceUtils.js
import { useEffect } from 'react';

// Performance monitoring utilities
export const measurePerformance = (name, callback) => {
  if (typeof window !== 'undefined' && window.performance && window.performance.mark) {
    const startMark = `${name}-start`;
    const endMark = `${name}-end`;
    const measureName = `${name}-duration`;
    
    performance.mark(startMark);
    
    const result = callback();
    
    // Handle async callbacks
    if (result && typeof result.then === 'function') {
      return result.then((value) => {
        performance.mark(endMark);
        performance.measure(measureName, startMark, endMark);
        
        const measure = performance.getEntriesByName(measureName)[0];
        console.log(`⚡ ${name} took ${measure.duration.toFixed(2)}ms`);
        
        // Clean up marks
        performance.clearMarks(startMark);
        performance.clearMarks(endMark);
        performance.clearMeasures(measureName);
        
        return value;
      });
    }
    
    // Sync callback
    performance.mark(endMark);
    performance.measure(measureName, startMark, endMark);
    
    const measure = performance.getEntriesByName(measureName)[0];
    console.log(`⚡ ${name} took ${measure.duration.toFixed(2)}ms`);
    
    // Clean up marks
    performance.clearMarks(startMark);
    performance.clearMarks(endMark);
    performance.clearMeasures(measureName);
    
    return result;
  }
  
  // Fallback if performance API not available
  return callback();
};

// Track component render times
export const useRenderTime = (componentName) => {
  const renderStartTime = performance.now();
  
  useEffect(() => {
    const renderEndTime = performance.now();
    const renderTime = renderEndTime - renderStartTime;
    
    if (renderTime > 16.67) { // More than one frame (60fps)
      console.warn(`🐌 ${componentName} render took ${renderTime.toFixed(2)}ms (> 16.67ms)`);
    } else {
      console.log(`✅ ${componentName} render took ${renderTime.toFixed(2)}ms`);
    }
  });
};

// Debounce function for performance
export const debounce = (func, wait) => {
  let timeout;
  
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

// Throttle function for performance
export const throttle = (func, limit) => {
  let inThrottle;
  
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

// Request idle callback wrapper
export const whenIdle = (callback) => {
  if ('requestIdleCallback' in window) {
    requestIdleCallback(callback);
  } else {
    // Fallback to setTimeout
    setTimeout(callback, 1);
  }
};