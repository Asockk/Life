// components/UI/PullToRefresh.js
import React, { useState, useEffect, useRef } from 'react';
import { RefreshCw } from 'lucide-react';

const PullToRefresh = ({ onRefresh, children }) => {
  const [isPulling, setIsPulling] = useState(false);
  const [pullProgress, setPullProgress] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const pullStartY = useRef(0);
  const containerRef = useRef(null);
  const THRESHOLD = 80; // Minimum pull distance to trigger refresh in pixels

  const handleTouchStart = (e) => {
    // Only enable pull to refresh when at the top of the page
    if (window.scrollY === 0) {
      pullStartY.current = e.touches[0].clientY;
      setIsPulling(true);
    }
  };

  const handleTouchMove = (e) => {
    if (!isPulling) return;
    
    const touchY = e.touches[0].clientY;
    const pullDistance = touchY - pullStartY.current;
    
    // Allow pull down only
    if (pullDistance > 0) {
      // Calculate progress percentage with diminishing returns
      const progress = Math.min(pullDistance / THRESHOLD, 1);
      setPullProgress(progress);
      
      // Prevent default scrolling when pulling
      if (pullDistance > 10) {
        e.preventDefault();
      }
    }
  };

  const handleTouchEnd = async () => {
    if (!isPulling) return;
    
    setIsPulling(false);
    
    // If pulled past threshold, trigger refresh
    if (pullProgress >= 1) {
      setIsRefreshing(true);
      try {
        await onRefresh();
      } catch (error) {
        console.error('Refresh failed:', error);
      } finally {
        setIsRefreshing(false);
      }
    }
    
    setPullProgress(0);
  };

  // Apply passive: false to prevent scroll blocking issues
  useEffect(() => {
    const container = containerRef.current;
    
    if (!container) return;
    
    const touchStartHandler = (e) => handleTouchStart(e);
    const touchMoveHandler = (e) => handleTouchMove(e);
    const touchEndHandler = () => handleTouchEnd();
    
    container.addEventListener('touchstart', touchStartHandler, { passive: true });
    container.addEventListener('touchmove', touchMoveHandler, { passive: false });
    container.addEventListener('touchend', touchEndHandler, { passive: true });
    
    return () => {
      container.removeEventListener('touchstart', touchStartHandler);
      container.removeEventListener('touchmove', touchMoveHandler);
      container.removeEventListener('touchend', touchEndHandler);
    };
  }, [isPulling, pullProgress]);

  return (
    <div ref={containerRef} className="relative w-full overflow-hidden">
      {/* Pull indicator */}
      <div
        className="absolute top-0 left-0 right-0 flex justify-center items-center transition-transform duration-200 z-10 bg-transparent"
        style={{
          height: '60px',
          transform: `translateY(${isPulling || isRefreshing ? '0' : '-100%'})`,
          opacity: isPulling ? pullProgress : isRefreshing ? 1 : 0,
        }}
      >
        <div className="flex items-center justify-center">
          <RefreshCw
            className={`text-blue-500 ${isRefreshing ? 'animate-spin' : ''}`}
            style={{
              transform: isPulling ? `rotate(${pullProgress * 360}deg)` : 'none',
            }}
            size={24}
          />
          <span className="ml-2 text-sm text-blue-500 font-medium">
            {isRefreshing ? 'Wird aktualisiert...' : 'Zum Aktualisieren ziehen'}
          </span>
        </div>
      </div>
      
      {/* Content container */}
      <div>{children}</div>
    </div>
  );
};

export default PullToRefresh;