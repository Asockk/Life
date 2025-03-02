// components/Dashboard/GestureEnabledChart.js
import React, { useState, useRef, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from 'lucide-react';

const GestureEnabledChart = ({ 
  data, 
  dataKeys = [{key: 'value', color: '#0088FE', name: 'Wert'}],
  XAxisKey = 'name', 
  tooltipFormatter,
  yDomain,
  height = 300
}) => {
  const [visibleData, setVisibleData] = useState(data);
  const [startIdx, setStartIdx] = useState(0);
  const [visibleCount, setVisibleCount] = useState(
    // Automatically determine how many items to show based on screen size
    window.innerWidth < 640 ? 7 : 
    window.innerWidth < 1024 ? 14 : 30
  );
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const [pinchStart, setPinchStart] = useState(null);
  const chartRef = useRef(null);
  
  // Update visible data when dependencies change
  useEffect(() => {
    if (data.length > 0) {
      const end = Math.min(startIdx + visibleCount, data.length);
      setVisibleData(data.slice(startIdx, end));
    }
  }, [data, startIdx, visibleCount]);
  
  // Update visible count on window resize
  useEffect(() => {
    const handleResize = () => {
      setVisibleCount(
        window.innerWidth < 640 ? 7 : 
        window.innerWidth < 1024 ? 14 : 30
      );
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // Pan controls (navigate left/right)
  const panLeft = () => {
    setStartIdx(prev => Math.max(0, prev - Math.floor(visibleCount / 2)));
  };
  
  const panRight = () => {
    setStartIdx(prev => Math.min(data.length - visibleCount, prev + Math.floor(visibleCount / 2)));
  };
  
  // Zoom controls
  const zoomIn = () => {
    if (visibleCount <= 5) return; // Minimum zoom level
    const newVisibleCount = Math.max(5, Math.floor(visibleCount * 0.7));
    const center = startIdx + Math.floor(visibleCount / 2);
    const newStartIdx = Math.max(0, Math.min(data.length - newVisibleCount, center - Math.floor(newVisibleCount / 2)));
    
    setVisibleCount(newVisibleCount);
    setStartIdx(newStartIdx);
  };
  
  const zoomOut = () => {
    if (visibleCount >= data.length) return; // Maximum zoom level
    const newVisibleCount = Math.min(data.length, Math.ceil(visibleCount * 1.3));
    const center = startIdx + Math.floor(visibleCount / 2);
    const newStartIdx = Math.max(0, Math.min(data.length - newVisibleCount, center - Math.floor(newVisibleCount / 2)));
    
    setVisibleCount(newVisibleCount);
    setStartIdx(newStartIdx);
  };
  
  // Touch handlers for swipe and pinch
  const handleTouchStart = (e) => {
    if (e.touches.length === 1) {
      // Single touch - prepare for swipe
      setTouchEnd(null);
      setTouchStart(e.targetTouches[0].clientX);
    } else if (e.touches.length === 2) {
      // Two touches - prepare for pinch
      const distance = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      setPinchStart(distance);
    }
  };
  
  const handleTouchMove = (e) => {
    if (touchStart && e.touches.length === 1) {
      setTouchEnd(e.targetTouches[0].clientX);
    }
  };
  
  const handleTouchEnd = (e) => {
    if (!touchStart) return;
    
    if (touchEnd) {
      // Handle swipe
      const distance = touchStart - touchEnd;
      const isSwipeLeft = distance > 50;
      const isSwipeRight = distance < -50;
      
      if (isSwipeLeft) {
        panRight();
      } else if (isSwipeRight) {
        panLeft();
      }
    }
    
    // Reset touch state
    setTouchStart(null);
    setTouchEnd(null);
  };
  
  const handleTouchCancel = (e) => {
    // Reset touch state
    setTouchStart(null);
    setTouchEnd(null);
    setPinchStart(null);
  };
  
  // Handle pinch gesture
  const handlePinch = (e) => {
    if (!pinchStart || e.touches.length !== 2) return;
    
    const distance = Math.hypot(
      e.touches[0].clientX - e.touches[1].clientX,
      e.touches[0].clientY - e.touches[1].clientY
    );
    
    const diff = distance - pinchStart;
    
    // Pinch in
    if (diff < -20) {
      zoomIn();
      setPinchStart(null);
    }
    // Pinch out
    else if (diff > 20) {
      zoomOut();
      setPinchStart(null);
    }
  };
  
  return (
    <div 
      className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700"
      ref={chartRef}
    >
      {/* Chart controls */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex gap-1">
          <button 
            onClick={panLeft} 
            disabled={startIdx === 0}
            className={`p-1.5 rounded-md ${
              startIdx === 0 
                ? 'text-gray-400 dark:text-gray-600 cursor-not-allowed' 
                : 'text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20'
            }`}
            aria-label="Zurück"
          >
            <ChevronLeft size={18} />
          </button>
          <button 
            onClick={panRight} 
            disabled={startIdx + visibleCount >= data.length}
            className={`p-1.5 rounded-md ${
              startIdx + visibleCount >= data.length 
                ? 'text-gray-400 dark:text-gray-600 cursor-not-allowed' 
                : 'text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20'
            }`}
            aria-label="Vor"
          >
            <ChevronRight size={18} />
          </button>
        </div>
        
        <div className="text-xs text-gray-500 dark:text-gray-400">
          {startIdx + 1} - {Math.min(startIdx + visibleCount, data.length)} von {data.length}
        </div>
        
        <div className="flex gap-1">
          <button 
            onClick={zoomIn}
            disabled={visibleCount <= 5}
            className={`p-1.5 rounded-md ${
              visibleCount <= 5
                ? 'text-gray-400 dark:text-gray-600 cursor-not-allowed' 
                : 'text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20'
            }`}
            aria-label="Vergrößern"
          >
            <ZoomIn size={18} />
          </button>
          <button 
            onClick={zoomOut}
            disabled={visibleCount >= data.length}
            className={`p-1.5 rounded-md ${
              visibleCount >= data.length
                ? 'text-gray-400 dark:text-gray-600 cursor-not-allowed' 
                : 'text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20'
            }`}
            aria-label="Verkleinern"
          >
            <ZoomOut size={18} />
          </button>
        </div>
      </div>
      
      {/* Chart with gesture handling */}
      <div 
        className="touch-pan-y" 
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchCancel}
      >
        <div className="h-64 sm:h-80">
          {visibleData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={visibleData}
                margin={{ top: 10, right: 10, left: 0, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" opacity={0.7} />
                <XAxis 
                  dataKey={XAxisKey} 
                  tick={{ fontSize: 12 }}
                  tickMargin={10}
                />
                <YAxis 
                  domain={yDomain || ['auto', 'auto']}
                  tick={{ fontSize: 12 }}
                  width={30}
                />
                <Tooltip formatter={tooltipFormatter} />
                
                {dataKeys.map((dataKey, index) => (
                  <Line
                    key={index}
                    type="monotone"
                    dataKey={dataKey.key}
                    name={dataKey.name}
                    stroke={dataKey.color}
                    strokeWidth={2}
                    dot={{ r: 4, strokeWidth: 2 }}
                    activeDot={{ r: 6, strokeWidth: 2 }}
                    connectNulls={false}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center">
              <p className="text-gray-500 dark:text-gray-400">Keine Daten vorhanden</p>
            </div>
          )}
        </div>
      </div>
      
      <div className="mt-2 text-xs text-center text-gray-500 dark:text-gray-400">
        <p className="hidden sm:block">Nutzen Sie die Steuerelemente oder das Scrollrad zum Navigieren</p>
        <p className="sm:hidden">Zum Navigieren über das Diagramm wischen</p>
      </div>
    </div>
  );
};

export default GestureEnabledChart;