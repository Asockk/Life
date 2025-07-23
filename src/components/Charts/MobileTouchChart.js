// components/Charts/MobileTouchChart.js
import React, { useState, useRef, useEffect } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, Dot 
} from 'recharts';
import { ZoomIn, ZoomOut, RotateCcw, Maximize2 } from 'lucide-react';

const MobileTouchChart = ({ 
  data, 
  darkMode, 
  height = 300,
  onFullscreen,
  title = "Blutdruck-Verlauf"
}) => {
  // Reduziere Datenpunkte für Mobile - zeige maximal letzte 14 Tage
  const MAX_MOBILE_POINTS = 14;
  const reducedData = data.length > MAX_MOBILE_POINTS 
    ? data.slice(-MAX_MOBILE_POINTS)
    : data;
    
  const [scale, setScale] = useState(1);
  const [panX, setPanX] = useState(0);
  const [isPinching, setIsPinching] = useState(false);
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: reducedData.length });
  const chartRef = useRef(null);
  const touchesRef = useRef([]);
  const lastDistanceRef = useRef(0);

  // Touch-Gesten Handler
  const handleTouchStart = (e) => {
    const touches = Array.from(e.touches);
    touchesRef.current = touches.map(touch => ({
      id: touch.identifier,
      x: touch.clientX,
      y: touch.clientY
    }));

    if (touches.length === 2) {
      setIsPinching(true);
      const dx = touches[0].clientX - touches[1].clientX;
      const dy = touches[0].clientY - touches[1].clientY;
      lastDistanceRef.current = Math.sqrt(dx * dx + dy * dy);
    }
  };

  const handleTouchMove = (e) => {
    e.preventDefault();
    const touches = Array.from(e.touches);

    if (touches.length === 2 && isPinching) {
      // Pinch-to-zoom
      const dx = touches[0].clientX - touches[1].clientX;
      const dy = touches[0].clientY - touches[1].clientY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (lastDistanceRef.current > 0) {
        const delta = distance / lastDistanceRef.current;
        const newScale = Math.max(0.5, Math.min(3, scale * delta));
        setScale(newScale);
        
        // Adjust visible range based on zoom
        const centerIndex = Math.floor((visibleRange.start + visibleRange.end) / 2);
        const newRange = Math.floor(reducedData.length / newScale);
        const newStart = Math.max(0, centerIndex - newRange / 2);
        const newEnd = Math.min(reducedData.length, newStart + newRange);
        setVisibleRange({ start: newStart, end: newEnd });
      }
      
      lastDistanceRef.current = distance;
    } else if (touches.length === 1) {
      // Pan gesture
      const touch = touches[0];
      const previousTouch = touchesRef.current.find(t => t.id === touch.identifier);
      
      if (previousTouch) {
        const deltaX = touch.clientX - previousTouch.x;
        const panSpeed = 2 / scale;
        const indexDelta = Math.round(-deltaX * panSpeed);
        
        const newStart = Math.max(0, Math.min(reducedData.length - (visibleRange.end - visibleRange.start), 
                                              visibleRange.start + indexDelta));
        const newEnd = newStart + (visibleRange.end - visibleRange.start);
        
        setVisibleRange({ start: newStart, end: newEnd });
        
        previousTouch.x = touch.clientX;
        previousTouch.y = touch.clientY;
      }
    }
  };

  const handleTouchEnd = () => {
    setIsPinching(false);
    lastDistanceRef.current = 0;
  };

  // Zoom controls
  const handleZoomIn = () => {
    const newScale = Math.min(3, scale * 1.2);
    setScale(newScale);
    updateVisibleRange(newScale);
  };

  const handleZoomOut = () => {
    const newScale = Math.max(0.5, scale / 1.2);
    setScale(newScale);
    updateVisibleRange(newScale);
  };

  const handleReset = () => {
    setScale(1);
    setPanX(0);
    setVisibleRange({ start: 0, end: reducedData.length });
  };

  const updateVisibleRange = (newScale) => {
    const centerIndex = Math.floor((visibleRange.start + visibleRange.end) / 2);
    const newRange = Math.floor(reducedData.length / newScale);
    const newStart = Math.max(0, centerIndex - newRange / 2);
    const newEnd = Math.min(reducedData.length, newStart + newRange);
    setVisibleRange({ start: newStart, end: newEnd });
  };

  // Sichtbare Daten
  const visibleData = reducedData.slice(visibleRange.start, visibleRange.end);

  // Custom Tooltip für mobile
  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload || !payload.length) return null;

    const morgenSys = payload.find(p => p.dataKey === 'morgenSys')?.value;
    const morgenDia = payload.find(p => p.dataKey === 'morgenDia')?.value;
    const abendSys = payload.find(p => p.dataKey === 'abendSys')?.value;
    const abendDia = payload.find(p => p.dataKey === 'abendDia')?.value;

    return (
      <div className={`
        p-3 rounded-lg shadow-lg
        ${darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'}
      `}>
        <p className="font-semibold mb-1">{label}</p>
        {morgenSys && morgenDia && (
          <p className="text-sm">
            <span className="text-blue-500">Morgen:</span> {morgenSys}/{morgenDia} mmHg
          </p>
        )}
        {abendSys && abendDia && (
          <p className="text-sm">
            <span className="text-purple-500">Abend:</span> {abendSys}/{abendDia} mmHg
          </p>
        )}
      </div>
    );
  };

  // Touch-optimierter Dot - kleiner für bessere Übersicht
  const CustomDot = (props) => {
    const { cx, cy, payload, dataKey } = props;
    const size = Math.min(6, 4 * scale); // Kleinere Dots, max 6px
    
    return (
      <circle
        cx={cx}
        cy={cy}
        r={size}
        fill={dataKey.includes('morgen') ? '#3B82F6' : '#8B5CF6'}
        stroke={darkMode ? '#1F2937' : '#FFFFFF'}
        strokeWidth={1.5}
        style={{ cursor: 'pointer' }}
      />
    );
  };

  return (
    <div className={`
      rounded-xl p-4
      ${darkMode ? 'bg-gray-800' : 'bg-white'}
      shadow-lg
    `}>
      {/* Header mit Zoom-Controls */}
      <div className="flex items-center justify-between mb-4">
        <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
          {title}
        </h3>
        <div className="flex items-center gap-2">
          <button
            onClick={handleZoomOut}
            className={`
              p-2 rounded-lg transition-colors
              ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}
            `}
            aria-label="Verkleinern"
          >
            <ZoomOut size={20} />
          </button>
          <button
            onClick={handleZoomIn}
            className={`
              p-2 rounded-lg transition-colors
              ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}
            `}
            aria-label="Vergrößern"
          >
            <ZoomIn size={20} />
          </button>
          <button
            onClick={handleReset}
            className={`
              p-2 rounded-lg transition-colors
              ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}
            `}
            aria-label="Zurücksetzen"
          >
            <RotateCcw size={20} />
          </button>
          {onFullscreen && (
            <button
              onClick={onFullscreen}
              className={`
                p-2 rounded-lg transition-colors
                ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}
              `}
              aria-label="Vollbild"
            >
              <Maximize2 size={20} />
            </button>
          )}
        </div>
      </div>

      {/* Chart Container */}
      <div 
        ref={chartRef}
        className="relative overflow-hidden touch-none"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{ height: `${height}px` }}
      >
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={visibleData}
            margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
          >
            <CartesianGrid 
              strokeDasharray="3 3" 
              stroke={darkMode ? '#374151' : '#E5E7EB'}
            />
            <XAxis 
              dataKey="datum"
              tick={{ fontSize: 12, fill: darkMode ? '#9CA3AF' : '#6B7280' }}
              angle={-45}
              textAnchor="end"
              height={60}
            />
            <YAxis 
              tick={{ fontSize: 12, fill: darkMode ? '#9CA3AF' : '#6B7280' }}
              domain={[60, 180]}
            />
            <Tooltip content={<CustomTooltip />} />
            
            {/* Morgen Systolisch */}
            <Line
              type="monotone"
              dataKey="morgenSys"
              stroke="#3B82F6"
              strokeWidth={2}
              dot={<CustomDot />}
              connectNulls
            />
            
            {/* Morgen Diastolisch */}
            <Line
              type="monotone"
              dataKey="morgenDia"
              stroke="#60A5FA"
              strokeWidth={2}
              dot={<CustomDot />}
              connectNulls
            />
            
            {/* Abend Systolisch */}
            <Line
              type="monotone"
              dataKey="abendSys"
              stroke="#8B5CF6"
              strokeWidth={2}
              dot={<CustomDot />}
              connectNulls
            />
            
            {/* Abend Diastolisch */}
            <Line
              type="monotone"
              dataKey="abendDia"
              stroke="#A78BFA"
              strokeWidth={2}
              dot={<CustomDot />}
              connectNulls
            />
          </LineChart>
        </ResponsiveContainer>

        {/* Zoom Indicator */}
        {scale !== 1 && (
          <div className={`
            absolute top-2 left-2 px-2 py-1 rounded text-xs
            ${darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'}
          `}>
            {Math.round(scale * 100)}%
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className={`
        mt-2 text-xs text-center
        ${darkMode ? 'text-gray-400' : 'text-gray-500'}
      `}>
        {scale === 1 ? (
          <span>Zeigt die letzten {reducedData.length} Tage • Pinch to zoom</span>
        ) : (
          <span>Swipe to pan • Pinch to zoom</span>
        )}
      </div>
    </div>
  );
};

export default MobileTouchChart;