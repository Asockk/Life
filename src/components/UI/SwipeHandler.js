// components/UI/SwipeHandler.js
import React, { useState, useRef, useEffect } from 'react';

const SwipeHandler = ({ onSwipeLeft, onSwipeRight, threshold = 50, children }) => {
  const [touchStart, setTouchStart] = useState(null);
  const [swiping, setSwiping] = useState(false);
  const containerRef = useRef(null);

  // Touch event handlers
  const handleTouchStart = (e) => {
    setTouchStart(e.touches[0].clientX);
    setSwiping(true);
  };

  const handleTouchMove = (e) => {
    // Prevent default only while actively swiping to avoid interfering with scrolling
    if (swiping && touchStart) {
      const currentX = e.touches[0].clientX;
      const diff = touchStart - currentX;
      
      // If swiping horizontally by more than 10px, prevent default to stop scrolling
      if (Math.abs(diff) > 10) {
        e.preventDefault();
      }
    }
  };

  const handleTouchEnd = (e) => {
    if (!touchStart || !swiping) {
      setSwiping(false);
      return;
    }

    // Get the final touch position
    let touchEnd;
    if (e.changedTouches && e.changedTouches.length > 0) {
      touchEnd = e.changedTouches[0].clientX;
    } else {
      touchEnd = e.clientX;
    }
    
    // Calculate the distance swiped
    const distance = touchStart - touchEnd;
    
    // Determine swipe direction if it exceeds the threshold
    if (Math.abs(distance) > threshold) {
      if (distance > 0 && onSwipeLeft) {
        // Swiped left
        onSwipeLeft();
        console.log('Swiped left');
      } else if (distance < 0 && onSwipeRight) {
        // Swiped right
        onSwipeRight();
        console.log('Swiped right');
      }
    }
    
    // Reset state
    setTouchStart(null);
    setSwiping(false);
  };

  // Register event listeners
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    
    // Add event listeners
    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd, { passive: true });
    
    // Cleanup
    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [touchStart, swiping]); // Re-register when these values change

  return (
    <div ref={containerRef} className="w-full touch-pan-y">
      {children}
    </div>
  );
};

export default SwipeHandler;