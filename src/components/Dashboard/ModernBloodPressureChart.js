// ModernBloodPressureChart.js - iOS-style minimalist chart
import React, { useState, useMemo, useEffect } from 'react';
import { 
  LineChart, Line, AreaChart, Area, XAxis, YAxis, 
  CartesianGrid, Tooltip, ResponsiveContainer, Dot 
} from 'recharts';
import { TrendingUp, TrendingDown, Minus, Info } from 'lucide-react';

const ModernBloodPressureChart = ({ data, viewType = 'beide', darkMode = false }) => {
  const [selectedDataPoint, setSelectedDataPoint] = useState(null);
  const [chartType, setChartType] = useState('area'); // 'area' or 'line'
  const [showStats, setShowStats] = useState(true);
  
  // Detect if mobile
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Colors
  const colors = {
    systolic: darkMode ? '#ff6b6b' : '#ff4757',
    diastolic: darkMode ? '#4dabf7' : '#3498db',
    pulse: darkMode ? '#69db7c' : '#27ae60',
    grid: darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
    text: darkMode ? '#ebebf5' : '#3c3c43',
    subtext: darkMode ? '#ebebf599' : '#3c3c4399',
    background: darkMode ? '#1c1c1e' : '#ffffff',
    cardBg: darkMode ? '#2c2c2e' : '#f2f2f7'
  };

  // Prepare data for chart
  const chartData = useMemo(() => {
    if (!data || !Array.isArray(data) || data.length === 0) return [];

    // Take less days on mobile for better display
    const daysToShow = isMobile ? 7 : 14;
    const recentData = data.slice(0, daysToShow).reverse();

    return recentData.map(entry => {
      const morgenData = viewType === 'morgen' || viewType === 'beide';
      const abendData = viewType === 'abend' || viewType === 'beide';

      return {
        datum: entry.datum ? entry.datum.split(' ')[0] : '', // Just the day
        tag: entry.tag,
        
        // Morning values
        ...(morgenData && {
          morgenSys: entry.morgenSys || null,
          morgenDia: entry.morgenDia || null,
          morgenPuls: entry.morgenPuls || null,
        }),
        
        // Evening values
        ...(abendData && {
          abendSys: entry.abendSys || null,
          abendDia: entry.abendDia || null,
          abendPuls: entry.abendPuls || null,
        })
      };
    });
  }, [data, viewType]);

  // Calculate statistics
  const stats = useMemo(() => {
    if (!data || !Array.isArray(data) || data.length === 0) return null;

    const recentData = data.slice(0, 7); // Last 7 days
    const previousData = data.slice(7, 14); // Previous 7 days

    const calcAvg = (arr, field) => {
      const values = arr
        .map(d => d[field])
        .filter(v => v != null && v > 0);
      return values.length > 0 
        ? Math.round(values.reduce((a, b) => a + b, 0) / values.length)
        : null;
    };

    const recentAvgSys = calcAvg(recentData, viewType === 'abend' ? 'abendSys' : 'morgenSys');
    const previousAvgSys = calcAvg(previousData, viewType === 'abend' ? 'abendSys' : 'morgenSys');
    
    const trend = recentAvgSys && previousAvgSys 
      ? recentAvgSys > previousAvgSys ? 'up' : recentAvgSys < previousAvgSys ? 'down' : 'neutral'
      : 'neutral';

    return {
      avgSys: recentAvgSys,
      avgDia: calcAvg(recentData, viewType === 'abend' ? 'abendDia' : 'morgenDia'),
      avgPuls: calcAvg(recentData, viewType === 'abend' ? 'abendPuls' : 'morgenPuls'),
      trend,
      change: recentAvgSys && previousAvgSys ? recentAvgSys - previousAvgSys : 0
    };
  }, [data, viewType]);

  // Custom dot for data points
  const CustomDot = (props) => {
    const { cx, cy, payload, dataKey } = props;
    const value = payload[dataKey];
    
    if (value == null || value === 0) return null;

    const isSelected = selectedDataPoint?.datum === payload.datum;
    const baseSize = isMobile ? 3 : 4;
    const selectedSize = isMobile ? 5 : 6;
    
    return (
      <Dot
        cx={cx}
        cy={cy}
        r={isSelected ? selectedSize : baseSize}
        fill={
          dataKey.includes('Sys') ? colors.systolic :
          dataKey.includes('Dia') ? colors.diastolic :
          colors.pulse
        }
        stroke={colors.background}
        strokeWidth={isMobile ? 1.5 : 2}
        onClick={() => setSelectedDataPoint(payload)}
        style={{ cursor: 'pointer' }}
      />
    );
  };

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload || payload.length === 0) return null;

    const data = payload[0].payload;
    
    return (
      <div 
        className="ios-card"
        style={{ 
          background: colors.cardBg,
          padding: '12px',
          minWidth: '160px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
        }}
      >
        <p style={{ 
          fontSize: '13px', 
          fontWeight: '600',
          color: colors.text,
          marginBottom: '8px'
        }}>
          {data.tag}, {label}
        </p>
        
        {viewType !== 'abend' && data.morgenSys && (
          <div style={{ marginBottom: '4px' }}>
            <p style={{ fontSize: '11px', color: colors.subtext, marginBottom: '2px' }}>
              Morgen
            </p>
            <p style={{ fontSize: '14px', color: colors.text }}>
              <span style={{ color: colors.systolic }}>
                {data.morgenSys}/{data.morgenDia}
              </span>
              {data.morgenPuls && (
                <span style={{ color: colors.pulse, marginLeft: '8px' }}>
                  ❤️ {data.morgenPuls}
                </span>
              )}
            </p>
          </div>
        )}
        
        {viewType !== 'morgen' && data.abendSys && (
          <div>
            <p style={{ fontSize: '11px', color: colors.subtext, marginBottom: '2px' }}>
              Abend
            </p>
            <p style={{ fontSize: '14px', color: colors.text }}>
              <span style={{ color: colors.systolic }}>
                {data.abendSys}/{data.abendDia}
              </span>
              {data.abendPuls && (
                <span style={{ color: colors.pulse, marginLeft: '8px' }}>
                  ❤️ {data.abendPuls}
                </span>
              )}
            </p>
          </div>
        )}
      </div>
    );
  };

  const ChartComponent = chartType === 'area' ? AreaChart : LineChart;
  const DataComponent = chartType === 'area' ? Area : Line;

  return (
    <div className="space-y-3">
      {/* Compact Stats Row - Collapsible on mobile */}
      {showStats && (
        <div className="grid grid-cols-3 gap-2">
          <div className="ios-card" style={{ padding: isMobile ? '8px' : 'var(--ios-spacing-md)' }}>
            <p className="text-xs" style={{ color: colors.subtext }}>Sys</p>
            <p className={`${isMobile ? 'text-lg' : 'text-xl'} font-semibold`} style={{ color: colors.systolic }}>
              {stats?.avgSys || '-'}
            </p>
          </div>

          <div className="ios-card" style={{ padding: isMobile ? '8px' : 'var(--ios-spacing-md)' }}>
            <p className="text-xs" style={{ color: colors.subtext }}>Dia</p>
            <p className={`${isMobile ? 'text-lg' : 'text-xl'} font-semibold`} style={{ color: colors.diastolic }}>
              {stats?.avgDia || '-'}
            </p>
          </div>

          <div className="ios-card" style={{ padding: isMobile ? '8px' : 'var(--ios-spacing-md)' }}>
            <p className="text-xs" style={{ color: colors.subtext }}>Puls</p>
            <p className={`${isMobile ? 'text-lg' : 'text-xl'} font-semibold`} style={{ color: colors.pulse }}>
              {stats?.avgPuls || '-'}
            </p>
          </div>
        </div>
      )}

      {/* Controls Row - Chart Type and Stats Toggle */}
      <div className="flex justify-between items-center">
        <button
          onClick={() => setShowStats(!showStats)}
          className="text-xs font-medium"
          style={{ color: colors.blue }}
        >
          {showStats ? 'Statistiken ausblenden' : 'Statistiken anzeigen'}
        </button>
        <div className="ios-segmented-control" style={{ transform: isMobile ? 'scale(0.85)' : 'scale(1)' }}>
          <button 
            className={`ios-segmented-item ${chartType === 'area' ? 'active' : ''}`}
            onClick={() => setChartType('area')}
          >
            Fläche
          </button>
          <button 
            className={`ios-segmented-item ${chartType === 'line' ? 'active' : ''}`}
            onClick={() => setChartType('line')}
          >
            Linie
          </button>
        </div>
      </div>

      {/* Main Chart - Reduced height on mobile */}
      <div className="ios-card" style={{ 
        padding: isMobile ? '12px' : 'var(--ios-spacing-lg)', 
        height: isMobile ? '220px' : '320px' 
      }}>
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <ChartComponent 
              data={chartData}
              margin={{ top: 5, right: isMobile ? 5 : 10, left: isMobile ? -10 : 0, bottom: 5 }}
            >
              <defs>
                <linearGradient id="systolicGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={colors.systolic} stopOpacity={0.3}/>
                  <stop offset="95%" stopColor={colors.systolic} stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="diastolicGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={colors.diastolic} stopOpacity={0.3}/>
                  <stop offset="95%" stopColor={colors.diastolic} stopOpacity={0}/>
                </linearGradient>
              </defs>

              <CartesianGrid 
                strokeDasharray="0" 
                stroke={colors.grid}
                vertical={false}
              />
              
              <XAxis 
                dataKey="datum" 
                tick={{ fontSize: isMobile ? 9 : 11, fill: colors.subtext }}
                tickLine={false}
                axisLine={{ stroke: colors.grid }}
                interval={isMobile ? 2 : 0}
              />
              
              <YAxis 
                tick={{ fontSize: isMobile ? 9 : 11, fill: colors.subtext }}
                tickLine={false}
                axisLine={false}
                domain={[40, 200]}
                ticks={isMobile ? [60, 120, 180] : [60, 90, 120, 150, 180]}
                width={isMobile ? 30 : 40}
              />
              
              <Tooltip 
                content={<CustomTooltip />}
                cursor={false}
              />

              {/* Systolic */}
              {viewType !== 'abend' && (
                <DataComponent
                  type="monotone"
                  dataKey="morgenSys"
                  stroke={colors.systolic}
                  strokeWidth={2.5}
                  fill="url(#systolicGradient)"
                  dot={<CustomDot />}
                  connectNulls
                />
              )}
              
              {viewType !== 'morgen' && (
                <DataComponent
                  type="monotone"
                  dataKey="abendSys"
                  stroke={colors.systolic}
                  strokeWidth={2.5}
                  strokeDasharray="5 5"
                  fill="url(#systolicGradient)"
                  fillOpacity={0.5}
                  dot={<CustomDot />}
                  connectNulls
                />
              )}

              {/* Diastolic */}
              {viewType !== 'abend' && (
                <DataComponent
                  type="monotone"
                  dataKey="morgenDia"
                  stroke={colors.diastolic}
                  strokeWidth={2.5}
                  fill="url(#diastolicGradient)"
                  dot={<CustomDot />}
                  connectNulls
                />
              )}
              
              {viewType !== 'morgen' && (
                <DataComponent
                  type="monotone"
                  dataKey="abendDia"
                  stroke={colors.diastolic}
                  strokeWidth={2.5}
                  strokeDasharray="5 5"
                  fill="url(#diastolicGradient)"
                  fillOpacity={0.5}
                  dot={<CustomDot />}
                  connectNulls
                />
              )}
            </ChartComponent>
          </ResponsiveContainer>
        ) : (
          <div className="flex flex-col items-center justify-center h-full">
            <Info className="h-12 w-12 mb-3" style={{ color: colors.subtext }} />
            <p style={{ color: colors.subtext }}>Keine Daten vorhanden</p>
          </div>
        )}
      </div>

      {/* Legend - Compact on mobile */}
      {!isMobile && (
        <div className="flex justify-center space-x-6 text-xs">
          <div className="flex items-center">
            <div className="w-4 h-0.5 mr-2" style={{ backgroundColor: colors.systolic }} />
            <span style={{ color: colors.subtext }}>Systolisch</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-0.5 mr-2" style={{ backgroundColor: colors.diastolic }} />
            <span style={{ color: colors.subtext }}>Diastolisch</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default ModernBloodPressureChart;