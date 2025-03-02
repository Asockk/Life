// components/Dashboard/EnhancedBloodPressureChart.js
import React, { useState, useMemo } from 'react';
import { 
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  Legend, ResponsiveContainer, ReferenceLine, Area, AreaChart, ComposedChart
} from 'recharts';
import { getBloodPressureCategory } from '../../utils/bloodPressureUtils';
import { 
  Calendar, Filter, Eye, EyeOff, ChevronDown, ChevronUp, 
  BarChart2, LineChart as LineChartIcon, Sliders, Clock, List
} from 'lucide-react';

const EnhancedBloodPressureChart = ({ 
  data, 
  viewType = 'morgen', 
  avgValues,
  dateFilter = 'all',
  setDateFilter = () => {}
}) => {
  // State for chart customization
  const [chartType, setChartType] = useState('line'); // 'line', 'area', 'bar', 'composed'
  const [showAvgLines, setShowAvgLines] = useState(true);
  const [showReferenceLines, setShowReferenceLines] = useState(true);
  const [visibleLines, setVisibleLines] = useState({
    systolic: true,
    diastolic: true,
    pulse: true
  });
  
  // Filter options for different time periods
  const filterOptions = [
    { id: 'all', label: 'Alle Daten' },
    { id: 'year', label: 'Dieses Jahr' },
    { id: 'halfyear', label: 'Letzte 6 Monate' },
    { id: 'quarter', label: 'Letzte 3 Monate' },
    { id: 'month', label: 'Letzter Monat' },
    { id: 'week', label: 'Letzte Woche' }
  ];
  
  // Dynamically calculate domains based on data
  const chartDomains = useMemo(() => {
    // Extract data for the current view type (morning/evening)
    const prefix = viewType === 'morgen' ? 'morgen' : 'abend';
    const sysKey = `${prefix}Sys`;
    const diaKey = `${prefix}Dia`;
    const pulseKey = `${prefix}Puls`;
    
    // Calculate min and max values
    const sysValues = data.map(d => d[sysKey]).filter(v => v > 0);
    const diaValues = data.map(d => d[diaKey]).filter(v => v > 0);
    const pulseValues = data.map(d => d[pulseKey]).filter(v => v > 0);
    
    // Find min and max with padding
    const sysMin = Math.max(80, Math.min(...sysValues) - 10);
    const sysMax = Math.min(220, Math.max(...sysValues) + 10);
    const diaMin = Math.max(40, Math.min(...diaValues) - 10);
    const diaMax = Math.min(120, Math.max(...diaValues) + 10);
    const pulseMin = Math.max(40, Math.min(...pulseValues) - 5);
    const pulseMax = Math.min(120, Math.max(...pulseValues) + 5);
    
    return {
      systolic: [sysMin, sysMax],
      diastolic: [diaMin, diaMax],
      pulse: [pulseMin, pulseMax]
    };
  }, [data, viewType]);
  
  // Custom tooltip component
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const prefix = viewType === 'morgen' ? 'morgen' : 'abend';
      const data = payload[0].payload;
      const sys = data[`${prefix}Sys`];
      const dia = data[`${prefix}Dia`];
      const pulse = data[`${prefix}Puls`];
      
      if ((sys === 0 && dia === 0) || (sys === 0 || dia === 0)) {
        return null;
      }
      
      const category = getBloodPressureCategory(sys, dia);
      
      return (
        <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700 shadow-lg rounded-lg max-w-[250px]">
          <p className="font-medium text-sm mb-2 border-b pb-1 dark:text-white">{data.tag}, {data.datum}</p>
          <div className="grid grid-cols-2 gap-1 text-sm">
            {sys > 0 && (
              <>
                <span className="text-gray-600 dark:text-gray-300">Systolisch:</span>
                <span className="font-medium text-gray-900 dark:text-white">{sys} mmHg</span>
              </>
            )}
            
            {dia > 0 && (
              <>
                <span className="text-gray-600 dark:text-gray-300">Diastolisch:</span>
                <span className="font-medium text-gray-900 dark:text-white">{dia} mmHg</span>
              </>
            )}
            
            {pulse > 0 && (
              <>
                <span className="text-gray-600 dark:text-gray-300">Puls:</span>
                <span className="font-medium text-gray-900 dark:text-white">{pulse} bpm</span>
              </>
            )}
            
            {sys > 0 && dia > 0 && (
              <>
                <span className="text-gray-600 dark:text-gray-300">Kategorie:</span>
                <span className="font-medium" style={{ color: category.color }}>
                  {category.category}
                </span>
              </>
            )}
          </div>
        </div>
      );
    }
    
    return null;
  };

  // Custom dot for values > 0
  const CustomizedDot = (props) => {
    const { cx, cy, value, stroke } = props;
    
    if (value === 0 || value === undefined || value === null) {
      return null;
    }
    
    const dotSize = window.innerWidth < 768 ? 4 : 5;
    return (
      <circle cx={cx} cy={cy} r={dotSize} fill={stroke} stroke="white" strokeWidth={1.5} />
    );
  };
  
  // Custom shape for the bar charts
  const CustomBar = (props) => {
    const { x, y, width, height, value, fill } = props;
    
    if (value === 0) return null;
    
    const radius = 4;
    return (
      <g>
        <rect 
          x={x} 
          y={y} 
          width={width} 
          height={height} 
          fill={fill} 
          rx={radius}
          ry={radius}
        />
      </g>
    );
  };
  
  // Render chart based on selected type
  const renderChart = () => {
    const prefix = viewType === 'morgen' ? 'morgen' : 'abend';
    const sysKey = `${prefix}Sys`;
    const diaKey = `${prefix}Dia`;
    const pulseKey = `${prefix}Puls`;
    
    // Common chart components
    const commonComponents = (
      <>
        <CartesianGrid strokeDasharray="3 3" opacity={0.6} />
        <XAxis 
          dataKey="tag" 
          tick={{ fontSize: window.innerWidth < 768 ? 10 : 12 }}
          interval="preserveStart"
        />
        <Tooltip content={<CustomTooltip />} />
        
        {/* Reference lines */}
        {showReferenceLines && (
          <>
            <ReferenceLine 
              y={120} 
              stroke="#2ECC40" 
              strokeDasharray="3 3" 
              label={window.innerWidth < 768 ? null : {
                value: "Normal", 
                position: "right", 
                fill: "#2ECC40",
                fontSize: 11
              }} 
            />
            <ReferenceLine 
              y={140} 
              stroke="#FF851B" 
              strokeDasharray="3 3" 
              label={window.innerWidth < 768 ? null : {
                value: "Hyp. Grad 1", 
                position: "right", 
                fill: "#FF851B",
                fontSize: 11
              }} 
            />
            <ReferenceLine 
              y={160} 
              stroke="#FF4136" 
              strokeDasharray="3 3" 
              label={window.innerWidth < 768 ? null : {
                value: "Hyp. Grad 2", 
                position: "right", 
                fill: "#FF4136",
                fontSize: 11
              }} 
            />
          </>
        )}
        
        {/* Average lines */}
        {showAvgLines && (
          <>
            <ReferenceLine 
              y={avgValues.sys} 
              stroke="#B10DC9" 
              strokeWidth={1.5}
              label={window.innerWidth < 768 ? null : {
                value: "Ø Sys", 
                position: "left", 
                fill: "#B10DC9",
                fontSize: 11
              }} 
            />
            <ReferenceLine 
              y={avgValues.dia} 
              stroke="#7FDBFF" 
              strokeWidth={1.5}
              label={window.innerWidth < 768 ? null : {
                value: "Ø Dia", 
                position: "left", 
                fill: "#7FDBFF",
                fontSize: 11
              }} 
            />
          </>
        )}
      </>
    );
    
    // Render based on chart type
    switch (chartType) {
      case 'area':
        return (
          <AreaChart
            data={data}
            margin={{ top: 10, right: window.innerWidth < 768 ? 10 : 30, left: 0, bottom: 5 }}
          >
            {commonComponents}
            
            <YAxis 
              yAxisId="bp"
              domain={[40, 180]}
              tick={{ fontSize: window.innerWidth < 768 ? 10 : 12 }}
              width={25}
            />
            
            <YAxis 
              yAxisId="pulse"
              orientation="right"
              domain={chartDomains.pulse}
              tick={{ fontSize: window.innerWidth < 768 ? 10 : 12 }}
              width={25}
            />
            
            {/* Diastolic area */}
            {visibleLines.diastolic && (
              <Area 
                yAxisId="bp"
                type="monotone" 
                dataKey={diaKey} 
                stroke="#0074D9" 
                fill="#0074D9" 
                fillOpacity={0.2}
                strokeWidth={2}
                dot={<CustomizedDot />}
                activeDot={{ r: window.innerWidth < 768 ? 6 : 7 }}
                connectNulls={false}
              />
            )}
            
            {/* Systolic area */}
            {visibleLines.systolic && (
              <Area 
                yAxisId="bp"
                type="monotone" 
                dataKey={sysKey} 
                stroke="#FF4136" 
                fill="#FF4136"
                fillOpacity={0.2}
                strokeWidth={2}
                dot={<CustomizedDot />}
                activeDot={{ r: window.innerWidth < 768 ? 6 : 7 }}
                connectNulls={false}
              />
            )}
            
            {/* Pulse area */}
            {visibleLines.pulse && (
              <Area 
                yAxisId="pulse"
                type="monotone" 
                dataKey={pulseKey} 
                stroke="#2ECC40" 
                fill="#2ECC40"
                fillOpacity={0.2}
                strokeWidth={2}
                dot={<CustomizedDot />}
                activeDot={{ r: window.innerWidth < 768 ? 6 : 7 }}
                connectNulls={false}
              />
            )}
          </AreaChart>
        );
        
      case 'bar':
        return (
          <BarChart
            data={data}
            margin={{ top: 10, right: window.innerWidth < 768 ? 10 : 30, left: 0, bottom: 5 }}
          >
            {commonComponents}
            
            <YAxis 
              domain={[40, 180]}
              tick={{ fontSize: window.innerWidth < 768 ? 10 : 12 }}
              width={25}
            />
            
            <Legend />
            
            {/* Systolic bars */}
            {visibleLines.systolic && (
              <Bar 
                dataKey={sysKey} 
                name="Systolisch" 
                fill="#FF4136" 
                shape={<CustomBar />}
                radius={[4, 4, 0, 0]}
                barSize={window.innerWidth < 768 ? 6 : 8}
              />
            )}
            
            {/* Diastolic bars */}
            {visibleLines.diastolic && (
              <Bar 
                dataKey={diaKey} 
                name="Diastolisch" 
                fill="#0074D9" 
                shape={<CustomBar />}
                radius={[4, 4, 0, 0]}
                barSize={window.innerWidth < 768 ? 6 : 8}
              />
            )}
            
            {/* Pulse bars */}
            {visibleLines.pulse && (
              <Bar 
                dataKey={pulseKey} 
                name="Puls" 
                fill="#2ECC40" 
                shape={<CustomBar />}
                radius={[4, 4, 0, 0]}
                barSize={window.innerWidth < 768 ? 6 : 8}
              />
            )}
          </BarChart>
        );
        
      case 'composed':
        return (
          <ComposedChart
            data={data}
            margin={{ top: 10, right: window.innerWidth < 768 ? 10 : 30, left: 0, bottom: 5 }}
          >
            {commonComponents}
            
            <YAxis 
              yAxisId="bp"
              domain={[40, 180]}
              tick={{ fontSize: window.innerWidth < 768 ? 10 : 12 }}
              width={25}
            />
            
            <YAxis 
              yAxisId="pulse"
              orientation="right"
              domain={chartDomains.pulse}
              tick={{ fontSize: window.innerWidth < 768 ? 10 : 12 }}
              width={25}
            />
            
            <Legend />
            
            {/* Systolic area */}
            {visibleLines.systolic && (
              <Area 
                yAxisId="bp"
                type="monotone" 
                dataKey={sysKey} 
                name="Systolisch"
                stroke="#FF4136" 
                fill="#FF4136"
                fillOpacity={0.1}
                strokeWidth={2}
                dot={<CustomizedDot />}
                activeDot={{ r: window.innerWidth < 768 ? 6 : 7 }}
                connectNulls={false}
              />
            )}
            
            {/* Diastolic area */}
            {visibleLines.diastolic && (
              <Area 
                yAxisId="bp"
                type="monotone" 
                dataKey={diaKey} 
                name="Diastolisch"
                stroke="#0074D9" 
                fill="#0074D9" 
                fillOpacity={0.1}
                strokeWidth={2}
                dot={<CustomizedDot />}
                activeDot={{ r: window.innerWidth < 768 ? 6 : 7 }}
                connectNulls={false}
              />
            )}
            
            {/* Pulse line */}
            {visibleLines.pulse && (
              <Line 
                yAxisId="pulse"
                type="monotone" 
                dataKey={pulseKey} 
                name="Puls"
                stroke="#2ECC40" 
                strokeWidth={2}
                dot={<CustomizedDot />}
                activeDot={{ r: window.innerWidth < 768 ? 6 : 7 }}
                connectNulls={false}
              />
            )}
          </ComposedChart>
        );
        
      default: // line chart
        return (
          <LineChart
            data={data}
            margin={{ top: 10, right: window.innerWidth < 768 ? 10 : 30, left: 0, bottom: 5 }}
          >
            {commonComponents}
            
            <YAxis 
              domain={[40, 180]}
              tick={{ fontSize: window.innerWidth < 768 ? 10 : 12 }}
              width={25}
            />
            
            <Legend />
            
            {/* Systolic line */}
            {visibleLines.systolic && (
              <Line 
                type="monotone" 
                dataKey={sysKey} 
                name="Systolisch"
                stroke="#FF4136" 
                strokeWidth={2.5}
                dot={<CustomizedDot />}
                activeDot={{ r: window.innerWidth < 768 ? 6 : 7 }}
                connectNulls={false}
              />
            )}
            
            {/* Diastolic line */}
            {visibleLines.diastolic && (
              <Line 
                type="monotone" 
                dataKey={diaKey} 
                name="Diastolisch"
                stroke="#0074D9" 
                strokeWidth={2.5}
                dot={<CustomizedDot />}
                activeDot={{ r: window.innerWidth < 768 ? 6 : 7 }}
                connectNulls={false}
              />
            )}
            
            {/* Pulse line */}
            {visibleLines.pulse && (
              <Line 
                type="monotone" 
                dataKey={pulseKey} 
                name="Puls"
                stroke="#2ECC40" 
                strokeWidth={2}
                dot={<CustomizedDot />}
                activeDot={{ r: window.innerWidth < 768 ? 6 : 7 }}
                connectNulls={false}
              />
            )}
          </LineChart>
        );
    }
  };
  
  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 transition-all">
      {/* Chart controls */}
      <div className="flex flex-wrap justify-between items-start mb-4 gap-2">
        {/* Left side - Chart type selection */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setChartType('line')}
            className={`flex items-center px-3 py-1.5 rounded-md text-sm transition-colors ${
              chartType === 'line' 
                ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-medium' 
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            <LineChartIcon size={14} className="mr-1.5" />
            <span>Linien</span>
          </button>
          
          <button
            onClick={() => setChartType('area')}
            className={`flex items-center px-3 py-1.5 rounded-md text-sm transition-colors ${
              chartType === 'area' 
                ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-medium' 
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            <svg className="w-3.5 h-3.5 mr-1.5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M21 21H3V3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M21 12L16 7L10 13L3 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M21 12V21H3V6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="currentColor" fillOpacity="0.2"/>
            </svg>
            <span>Flächen</span>
          </button>
          
          <button
            onClick={() => setChartType('bar')}
            className={`flex items-center px-3 py-1.5 rounded-md text-sm transition-colors ${
              chartType === 'bar' 
                ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-medium' 
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            <BarChart2 size={14} className="mr-1.5" />
            <span>Balken</span>
          </button>
          
          <button
            onClick={() => setChartType('composed')}
            className={`flex items-center px-3 py-1.5 rounded-md text-sm transition-colors ${
              chartType === 'composed' 
                ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-medium' 
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            <Sliders size={14} className="mr-1.5" />
            <span>Kombiniert</span>
          </button>
        </div>
        
        {/* Right side - Filter dropdown */}
        <div className="relative">
          <button
            className="flex items-center px-3 py-1.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 
                      hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md text-sm transition-colors"
            onClick={() => {
              const dropdown = document.getElementById('date-filter-dropdown');
              if (dropdown) {
                dropdown.classList.toggle('hidden');
              }
            }}
          >
            <Calendar size={14} className="mr-1.5 text-blue-600 dark:text-blue-400" />
            <span>
              {filterOptions.find(option => option.id === dateFilter)?.label || 'Zeitraum'}
            </span>
            <ChevronDown size={14} className="ml-1.5" />
          </button>
          
          {/* Dropdown menu */}
          <div 
            id="date-filter-dropdown"
            className="absolute right-0 mt-1 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 
                      shadow-lg rounded-md z-10 hidden"
          >
            {filterOptions.map(option => (
              <button
                key={option.id}
                className={`w-full text-left px-4 py-2 text-sm ${
                  dateFilter === option.id
                    ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-medium'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
                onClick={() => {
                  setDateFilter(option.id);
                  document.getElementById('date-filter-dropdown').classList.add('hidden');
                }}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>
      
      {/* Second row of controls - toggles */}
      <div className="flex flex-wrap gap-2 mb-4">
        <button
          onClick={() => setVisibleLines(prev => ({ ...prev, systolic: !prev.systolic }))}
          className={`flex items-center px-3 py-1.5 rounded-md text-sm transition-colors ${
            visibleLines.systolic
              ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
          }`}
        >
          <div className="w-2 h-2 rounded-full bg-red-500 mr-1.5"></div>
          <span>Systolisch</span>
          {!visibleLines.systolic && <EyeOff size={14} className="ml-1.5" />}
        </button>
        
        <button
          onClick={() => setVisibleLines(prev => ({ ...prev, diastolic: !prev.diastolic }))}
          className={`flex items-center px-3 py-1.5 rounded-md text-sm transition-colors ${
            visibleLines.diastolic
              ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
          }`}
        >
          <div className="w-2 h-2 rounded-full bg-blue-500 mr-1.5"></div>
          <span>Diastolisch</span>
          {!visibleLines.diastolic && <EyeOff size={14} className="ml-1.5" />}
        </button>
        
        <button
          onClick={() => setVisibleLines(prev => ({ ...prev, pulse: !prev.pulse }))}
          className={`flex items-center px-3 py-1.5 rounded-md text-sm transition-colors ${
            visibleLines.pulse
              ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
          }`}
        >
          <div className="w-2 h-2 rounded-full bg-green-500 mr-1.5"></div>
          <span>Puls</span>
          {!visibleLines.pulse && <EyeOff size={14} className="ml-1.5" />}
        </button>
        
        <button
          onClick={() => setShowReferenceLines(!showReferenceLines)}
          className={`flex items-center px-3 py-1.5 rounded-md text-sm transition-colors ${
            showReferenceLines
              ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
          }`}
        >
          <List size={14} className="mr-1.5" />
          <span>Referenzlinien</span>
          {!showReferenceLines && <EyeOff size={14} className="ml-1.5" />}
        </button>
        
        <button
          onClick={() => setShowAvgLines(!showAvgLines)}
          className={`flex items-center px-3 py-1.5 rounded-md text-sm transition-colors ${
            showAvgLines
              ? 'bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-400'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
          }`}
        >
          <Clock size={14} className="mr-1.5" />
          <span>Durchschnitte</span>
          {!showAvgLines && <EyeOff size={14} className="ml-1.5" />}
        </button>
      </div>
      
      {/* Chart */}
      <div className="h-64 sm:h-80 mt-3">
        {data.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            {renderChart()}
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex items-center justify-center bg-gray-50 dark:bg-gray-900 rounded-lg border border-dashed border-gray-300 dark:border-gray-700">
            <p className="text-gray-500 dark:text-gray-400 text-center">
              Keine Daten verfügbar für diese Ansicht.<br />
              Fügen Sie neue Messungen hinzu, um Ihren Blutdruck zu verfolgen.
            </p>
          </div>
        )}
      </div>
      
      {/* Legend at the bottom with interactions */}
      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="text-xs text-gray-500 dark:text-gray-400 flex flex-wrap justify-between items-center">
          <div>
            <span className="font-medium">Zeitraum:</span> {filterOptions.find(option => option.id === dateFilter)?.label || 'Alle Daten'}
          </div>
          <div>
            <span className="font-medium">{data.length}</span> Datenpunkte
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedBloodPressureChart;