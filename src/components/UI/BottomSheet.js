// components/UI/BottomSheet.js
import React, { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';

const BottomSheet = ({ 
  isOpen, 
  onClose, 
  children, 
  title, 
  darkMode,
  height = 'auto', // 'auto', 'full', '50%', etc.
  showHandle = true,
  closeOnSwipeDown = true,
  closeOnBackdrop = true,
  className = ''
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const [isClosing, setIsClosing] = useState(false);
  const sheetRef = useRef(null);
  const startY = useRef(0);
  const currentY = useRef(0);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setIsClosing(false);
      setDragOffset(0);
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleTouchStart = (e) => {
    if (!closeOnSwipeDown) return;
    startY.current = e.touches[0].clientY;
    setIsDragging(true);
  };

  const handleTouchMove = (e) => {
    if (!isDragging || !closeOnSwipeDown) return;
    
    currentY.current = e.touches[0].clientY;
    const diff = currentY.current - startY.current;
    
    // Only allow dragging down
    if (diff > 0) {
      setDragOffset(diff);
      
      // Add resistance when dragging
      if (diff > 100) {
        setDragOffset(100 + (diff - 100) * 0.3);
      }
    }
  };

  const handleTouchEnd = () => {
    if (!isDragging || !closeOnSwipeDown) return;
    
    setIsDragging(false);
    
    // If dragged more than 100px or with velocity, close
    if (dragOffset > 100) {
      handleClose();
    } else {
      // Spring back
      setDragOffset(0);
    }
  };

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
      setIsClosing(false);
      setDragOffset(0);
    }, 300);
  };

  const handleBackdropClick = (e) => {
    if (closeOnBackdrop && e.target === e.currentTarget) {
      handleClose();
    }
  };

  if (!isOpen && !isClosing) return null;

  const getHeightClass = () => {
    switch (height) {
      case 'full':
        return 'h-full';
      case '75%':
        return 'h-3/4';
      case '50%':
        return 'h-1/2';
      case 'auto':
      default:
        return 'max-h-[90vh]';
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className={`
          fixed inset-0 bg-black/50 z-40
          transition-opacity duration-300
          ${isOpen && !isClosing ? 'opacity-100' : 'opacity-0'}
        `}
        onClick={handleBackdropClick}
      />

      {/* Bottom Sheet */}
      <div
        ref={sheetRef}
        className={`
          fixed inset-x-0 bottom-0 z-50
          ${darkMode ? 'bg-gray-900' : 'bg-white'}
          rounded-t-3xl shadow-2xl
          ${getHeightClass()}
          transform transition-transform duration-300 ease-out
          ${isOpen && !isClosing ? 'translate-y-0' : 'translate-y-full'}
          ${className}
        `}
        style={{
          transform: `translateY(${isOpen && !isClosing ? dragOffset : '100%'}px)`,
          transition: isDragging ? 'none' : 'transform 0.3s ease-out'
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Swipe Handle */}
        {showHandle && (
          <div className="flex justify-center pt-3 pb-2">
            <div className={`
              w-12 h-1 rounded-full
              ${darkMode ? 'bg-gray-600' : 'bg-gray-300'}
            `} />
          </div>
        )}

        {/* Header */}
        {title && (
          <div className={`
            flex items-center justify-between px-6 py-4
            border-b ${darkMode ? 'border-gray-800' : 'border-gray-200'}
          `}>
            <h3 className={`
              text-lg font-semibold
              ${darkMode ? 'text-white' : 'text-gray-900'}
            `}>
              {title}
            </h3>
            <button
              onClick={handleClose}
              className={`
                p-2 rounded-full transition-colors
                ${darkMode 
                  ? 'hover:bg-gray-800 text-gray-400' 
                  : 'hover:bg-gray-100 text-gray-600'}
              `}
            >
              <X size={20} />
            </button>
          </div>
        )}

        {/* Content */}
        <div className={`
          overflow-y-auto overscroll-contain
          ${height === 'auto' ? 'flex-1' : ''}
          ${title ? '' : 'pt-2'}
          pb-safe
        `}>
          {children}
        </div>
      </div>
    </>
  );
};

export default BottomSheet;