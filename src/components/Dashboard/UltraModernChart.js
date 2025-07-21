// Ultra Modern Blood Pressure Chart
import React, { useState, useRef, memo } from 'react';
import { 
  AreaChart, Area, LineChart, Line, XAxis, YAxis, 
  CartesianGrid, Tooltip, ResponsiveContainer, 
  ReferenceLine, ComposedChart, Bar
} from 'recharts';
import { Calendar, Eye, Zap, ChevronRight, Heart } from 'lucide-react';

const UltraModernChart = ({ data, viewType, avgValues, darkMode = false }) => {
  const [selectedMetric, setSelectedMetric] = useState('all');
  // Animation state removed - not currently used
  
  const prefix = viewType === 'morgen' ? 'morgen' : 'abend';
  
  // Prepare data with additional calculations
  const enhancedData = data.map(item => {
    const sys = item[`${prefix}Sys`];
    const dia = item[`${prefix}Dia`];
    const pulse = item[`${prefix}Puls`];
    
    // Calculate MAP (Mean Arterial Pressure)
    const map = dia && sys ? Math.round(dia + (sys - dia) / 3) : 0;
    
    // Calculate PP (Pulse Pressure)
    const pp = dia && sys ? sys - dia : 0;
    
    return {
      ...item,
      map,
      pp,
      healthScore: calculatePointHealthScore(sys, dia, pulse)
    };
  });

  function calculatePointHealthScore(sys, dia, pulse) {
    if (!sys || !dia) return 0;
    
    let score = 100;
    if (sys > 140) score -= 30;
    else if (sys > 130) score -= 20;
    else if (sys > 120) score -= 10;
    
    if (dia > 90) score -= 20;
    else if (dia > 85) score -= 10;
    
    if (pulse > 100) score -= 10;
    else if (pulse < 50) score -= 10;
    
    return Math.max(0, Math.min(100, score));
  }

  // Custom gradient definitions
  const gradientOffset = () => {
    const dataMax = Math.max(...enhancedData.map(i => i[`${prefix}Sys`] || 0));
    const dataMin = Math.min(...enhancedData.map(i => i[`${prefix}Dia`] || 0));

    if (dataMax <= 0) return 0;
    if (dataMin >= 0) return 1;

    return dataMax / (dataMax - dataMin);
  };

  const off = gradientOffset();

  // Futuristic Tooltip
  const FuturisticTooltip = ({ active, payload, label }) => {
    if (!active || !payload || !payload.length) return null;

    const data = payload[0].payload;
    const sys = data[`${prefix}Sys`];
    const dia = data[`${prefix}Dia`];
    const pulse = data[`${prefix}Puls`];
    const healthScore = data.healthScore;

    return (
      <div className="glass-card p-4 min-w-[200px]">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">
            {label}
          </span>
          <div className="flex items-center gap-1">
            <Heart size={12} className="text-red-500" />
            <span className="text-xs font-bold" style={{ color: healthScore > 70 ? 'var(--color-optimal)' : 'var(--color-warning)' }}>
              {healthScore}%
            </span>
          </div>
        </div>
        
        <div className="space-y-2">
          {sys > 0 && (
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-500 dark:text-gray-400">Systolisch</span>
              <span className="text-sm font-bold text-red-500">{sys} mmHg</span>
            </div>
          )}
          
          {dia > 0 && (
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-500 dark:text-gray-400">Diastolisch</span>
              <span className="text-sm font-bold text-blue-500">{dia} mmHg</span>
            </div>
          )}
          
          {pulse > 0 && (
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-500 dark:text-gray-400">Puls</span>
              <span className="text-sm font-bold text-green-500">{pulse} bpm</span>
            </div>
          )}
          
          <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-500 dark:text-gray-400">MAP</span>
              <span className="text-xs font-medium">{data.map} mmHg</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-500 dark:text-gray-400">PP</span>
              <span className="text-xs font-medium">{data.pp} mmHg</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Custom dot with animation
  const AnimatedDot = (props) => {
    const { cx, cy, value, dataKey } = props;
    if (!value) return null;

    const color = dataKey.includes('Sys') ? '#FF4136' : 
                  dataKey.includes('Dia') ? '#0074D9' : '#2ECC40';

    return (
      <g>
        <circle 
          cx={cx} 
          cy={cy} 
          r={4} 
          fill={color}
          className="animate-pulse"
        />
        {value > 140 && dataKey.includes('Sys') && (
          <circle 
            cx={cx} 
            cy={cy} 
            r={8} 
            fill="none"
            stroke={color}
            strokeWidth={2}
            opacity={0.5}
            className="animate-ping"
          />
        )}
      </g>
    );
  };

  // Metric selector cards
  const metrics = [
    { id: 'all', name: 'Übersicht', icon: Eye, color: 'var(--primary-calm)' },
    { id: 'pressure', name: 'Blutdruck', icon: Heart, color: 'var(--primary-heart)' },
    { id: 'pulse', name: 'Puls', icon: Zap, color: 'var(--primary-wellness)' },
    { id: 'analysis', name: 'Analyse', icon: Calendar, color: 'var(--primary-health)' }
  ];

  const renderChart = () => {
    switch (selectedMetric) {
      case 'pressure':
        return (
          <AreaChart data={enhancedData}>
            <defs>
              <linearGradient id="sysGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#FF4136" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#FF4136" stopOpacity={0.1}/>
              </linearGradient>
              <linearGradient id="diaGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#0074D9" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#0074D9" stopOpacity={0.1}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#374151' : '#e5e7eb'} />
            <XAxis dataKey="tag" stroke={darkMode ? '#9ca3af' : '#6b7280'} />
            <YAxis domain={[40, 180]} stroke={darkMode ? '#9ca3af' : '#6b7280'} />
            <Tooltip content={<FuturisticTooltip />} />
            <Area 
              type="monotone" 
              dataKey={`${prefix}Sys`} 
              stroke="#FF4136" 
              fillOpacity={1} 
              fill="url(#sysGradient)"
              strokeWidth={3}
              animationDuration={1500}
              dot={<AnimatedDot />}
            />
            <Area 
              type="monotone" 
              dataKey={`${prefix}Dia`} 
              stroke="#0074D9" 
              fillOpacity={1} 
              fill="url(#diaGradient)"
              strokeWidth={3}
              animationDuration={1500}
              dot={<AnimatedDot />}
            />
            <ReferenceLine y={120} stroke="#2ECC40" strokeDasharray="5 5" />
            <ReferenceLine y={80} stroke="#2ECC40" strokeDasharray="5 5" />
          </AreaChart>
        );

      case 'pulse':
        return (
          <AreaChart data={enhancedData}>
            <defs>
              <linearGradient id="pulseGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#2ECC40" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#2ECC40" stopOpacity={0.1}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#374151' : '#e5e7eb'} />
            <XAxis dataKey="tag" stroke={darkMode ? '#9ca3af' : '#6b7280'} />
            <YAxis domain={[40, 120]} stroke={darkMode ? '#9ca3af' : '#6b7280'} />
            <Tooltip content={<FuturisticTooltip />} />
            <Area 
              type="basis" 
              dataKey={`${prefix}Puls`} 
              stroke="#2ECC40" 
              fillOpacity={1} 
              fill="url(#pulseGradient)"
              strokeWidth={3}
              animationDuration={1500}
              dot={{ r: 4, fill: '#2ECC40' }}
            />
            <ReferenceLine y={60} stroke="#0074D9" strokeDasharray="5 5" label="Normal" />
            <ReferenceLine y={100} stroke="#FF851B" strokeDasharray="5 5" label="Hoch" />
          </AreaChart>
        );

      case 'analysis':
        return (
          <ComposedChart data={enhancedData}>
            <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#374151' : '#e5e7eb'} />
            <XAxis dataKey="tag" stroke={darkMode ? '#9ca3af' : '#6b7280'} />
            <YAxis yAxisId="left" domain={[0, 100]} stroke={darkMode ? '#9ca3af' : '#6b7280'} />
            <YAxis yAxisId="right" orientation="right" domain={[40, 100]} stroke={darkMode ? '#9ca3af' : '#6b7280'} />
            <Tooltip content={<FuturisticTooltip />} />
            <Bar yAxisId="left" dataKey="healthScore" fill="url(#healthGradient)" radius={[8, 8, 0, 0]} />
            <Line yAxisId="right" type="monotone" dataKey="map" stroke="#B10DC9" strokeWidth={2} />
            <Line yAxisId="right" type="monotone" dataKey="pp" stroke="#FF851B" strokeWidth={2} />
            <defs>
              <linearGradient id="healthGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset={off} stopColor="#2ECC40" stopOpacity={1} />
                <stop offset={off} stopColor="#FF4136" stopOpacity={1} />
              </linearGradient>
            </defs>
          </ComposedChart>
        );

      default: // 'all'
        return (
          <LineChart data={enhancedData}>
            <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#374151' : '#e5e7eb'} />
            <XAxis dataKey="tag" stroke={darkMode ? '#9ca3af' : '#6b7280'} />
            <YAxis domain={[40, 180]} stroke={darkMode ? '#9ca3af' : '#6b7280'} />
            <Tooltip content={<FuturisticTooltip />} />
            <Line 
              type="monotone" 
              dataKey={`${prefix}Sys`} 
              stroke="#FF4136" 
              strokeWidth={3}
              dot={{ r: 4 }}
              animationDuration={1500}
            />
            <Line 
              type="monotone" 
              dataKey={`${prefix}Dia`} 
              stroke="#0074D9" 
              strokeWidth={3}
              dot={{ r: 4 }}
              animationDuration={1500}
            />
            <Line 
              type="monotone" 
              dataKey={`${prefix}Puls`} 
              stroke="#2ECC40" 
              strokeWidth={2}
              dot={{ r: 3 }}
              animationDuration={1500}
            />
            <ReferenceLine y={avgValues?.sys || 0} stroke="#B10DC9" strokeDasharray="5 5" />
            <ReferenceLine y={avgValues?.dia || 0} stroke="#7FDBFF" strokeDasharray="5 5" />
          </LineChart>
        );
    }
  };

  return (
    <div className="space-y-4">
      {/* Metric Selector */}
      <div className="grid grid-cols-4 gap-2">
        {metrics.map(metric => {
          const Icon = metric.icon;
          const isActive = selectedMetric === metric.id;
          
          return (
            <button
              key={metric.id}
              onClick={() => setSelectedMetric(metric.id)}
              className={`
                glass-card p-3 text-center tap-scale transition-all duration-300
                ${isActive ? 'ring-2' : ''}
              `}
              style={{ 
                '--tw-ring-color': metric.color,
                background: isActive ? `${metric.color}10` : undefined
              }}
            >
              <Icon 
                size={20} 
                className="mx-auto mb-1" 
                style={{ color: isActive ? metric.color : 'currentColor' }}
              />
              <span className="text-xs font-medium">{metric.name}</span>
            </button>
          );
        })}
      </div>

      {/* Chart Container */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
            {viewType === 'morgen' ? 'Morgenwerte' : 'Abendwerte'}
          </h3>
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <Calendar size={16} />
            <span>{enhancedData.length} Messungen</span>
          </div>
        </div>

        <div className="h-80 -mx-2">
          <ResponsiveContainer width="100%" height="100%">
            {renderChart()}
          </ResponsiveContainer>
        </div>

        {/* Insights Section */}
        <div className="mt-6 p-4 rounded-lg bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                KI-Einblicke
              </h4>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Ihre Werte zeigen einen stabilen Trend. Weiter so!
              </p>
            </div>
            <ChevronRight size={20} className="text-gray-400" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default memo(UltraModernChart);