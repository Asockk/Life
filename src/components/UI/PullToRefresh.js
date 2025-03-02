// components/UI/PullToRefresh.js
import React, { useState, useEffect, useRef } from 'react';

const PullToRefresh = ({ onRefresh, className, children }) => {
  const [isPulling, setIsPulling] = useState(false);
  const [pullProgress, setPullProgress] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const containerRef = useRef(null);
  const touchStartY = useRef(0);
  const touchEndY = useRef(0);
  const pullDistance = useRef(0);
  const pullThreshold = 80; // Minimum pull distance to trigger refresh

  // Handle touch events for pull to refresh
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleTouchStart = (e) => {
      // Only enable pull-to-refresh when scrolled to top
      if (container.scrollTop === 0) {
        touchStartY.current = e.touches[0].clientY;
        setIsPulling(true);
      }
    };

    const handleTouchMove = (e) => {
      if (!isPulling) return;
      
      touchEndY.current = e.touches[0].clientY;
      pullDistance.current = Math.max(0, touchEndY.current - touchStartY.current);
      
      // Calculate progress percentage (0-100)
      const progress = Math.min(100, (pullDistance.current / pullThreshold) * 100);
      setPullProgress(progress);
      
      // Prevent default only when pulling
      if (pullDistance.current > 0 && container.scrollTop === 0) {
        e.preventDefault();
      }
    };

    const handleTouchEnd = () => {
      if (!isPulling) return;
      
      if (pullDistance.current >= pullThreshold) {
        setIsRefreshing(true);
        setPullProgress(100);
        
        // Execute refresh callback
        Promise.resolve(onRefresh())
          .finally(() => {
            // Reset after refresh completes
            setTimeout(() => {
              setIsRefreshing(false);
              setPullProgress(0);
              setIsPulling(false);
              pullDistance.current = 0;
            }, 1000);
          });
      } else {
        // Reset if threshold not reached
        setPullProgress(0);
        setIsPulling(false);
        pullDistance.current = 0;
      }
    };

    container.addEventListener('touchstart', handleTouchStart, { passive: false });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd);
    container.addEventListener('touchcancel', handleTouchEnd);
    
    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
      container.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, [isPulling, onRefresh]);

  return (
    <div 
      ref={containerRef} 
      className={`relative overflow-auto ${className || ''}`}
      style={{ 
        height: '100%',
        overflowY: 'auto',
        WebkitOverflowScrolling: 'touch'
      }}
    >
      {/* Pull indicator */}
      <div 
        className="absolute left-0 right-0 flex items-center justify-center pointer-events-none transition-transform"
        style={{ 
          transform: `translateY(${isPulling || isRefreshing ? 0 : -60}px)`,
          top: `${isPulling ? pullProgress * 0.6 : isRefreshing ? 60 : 0}px`,
          height: '60px',
          zIndex: 10
        }}
      >
        {isRefreshing ? (
          <div className="flex items-center justify-center">
            <svg className="animate-spin h-6 w-6 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">Aktualisiere...</span>
          </div>
        ) : (
          <div className="flex items-center justify-center">
            <svg 
              className="text-blue-600 transform transition-transform duration-300" 
              style={{ 
                transform: `rotate(${Math.min(180, pullProgress * 1.8)}deg)`,
                opacity: pullProgress / 100 
              }}
              width="24" 
              height="24" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            >
              <polyline points="7 13 12 18 17 13"></polyline>
              <polyline points="7 6 12 11 17 6"></polyline>
            </svg>
            <span 
              className="ml-2 text-sm text-gray-600 dark:text-gray-400 transition-opacity"
              style={{ opacity: pullProgress / 100 }}
            >
              {pullProgress >= 90 ? 'Loslassen zum Aktualisieren' : 'Ziehen zum Aktualisieren'}
            </span>
          </div>
        )}
      </div>
      
      {/* Content with padding to accommodate the pull indicator */}
      <div style={{ paddingTop: isRefreshing ? '60px' : '0', transition: 'padding-top 0.2s ease' }}>
        {children}
      </div>
    </div>
  );
};

export default PullToRefresh;

// Usage example:
// <PullToRefresh onRefresh={() => fetchData()}>
//   <YourContent />
// </PullToRefresh>