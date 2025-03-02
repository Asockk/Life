// components/Dashboard/BloodPressureChartWrapper.js
import React from 'react';
import BloodPressureChart from './BloodPressureChart';
import SwipeHandler from '../UI/SwipeHandler';

const BloodPressureChartWrapper = ({ data, viewType, setViewType, avgValues }) => {
  // Diese Wrapper-Komponente handhabt die Swipe-Logik separat
  const handleSwipeLeft = () => {
    // Wechsel von Morgen zu Abend
    if (viewType === 'morgen') {
      console.log('Swiping from morning to evening');
      setViewType('abend');
    }
  };

  const handleSwipeRight = () => {
    // Wechsel von Abend zu Morgen
    if (viewType === 'abend') {
      console.log('Swiping from evening to morning');
      setViewType('morgen');
    }
  };

  return (
    <SwipeHandler 
      onSwipeLeft={handleSwipeLeft} 
      onSwipeRight={handleSwipeRight}
      threshold={50}
    >
      <div className="relative">
        {/* Optionaler Swipe-Hinweis (nur auf Mobilgeräten anzeigen) */}
        <div className="text-xs text-center mb-1 md:hidden">
          ← Swipe für {viewType === 'morgen' ? 'Abend' : 'Morgen'} →
        </div>
        
        <BloodPressureChart
          data={data}
          viewType={viewType}
          avgValues={avgValues}
        />
      </div>
    </SwipeHandler>
  );
};

export default BloodPressureChartWrapper;