// components/Dashboard/EnhancedContextFactors.js
import React, { useState, useMemo } from 'react';
import { 
  Heart, Coffee, Moon, Activity, Utensils, Wine, 
  Calendar, ArrowRight, ChevronDown, ChevronUp, 
  TrendingUp, TrendingDown, Minus
} from 'lucide-react';
import { 
  ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, 
  PolarRadiusAxis, Radar, Tooltip, LineChart, Line, XAxis, 
  YAxis, CartesianGrid, Legend, BarChart, Bar
} from 'recharts';

const EnhancedContextFactors = ({ contextData, bloodPressureData }) => {
  const [expandedSection, setExpandedSection] = useState('overview'); // 'overview', 'correlations', 'trends'
  const [selectedFactor, setSelectedFactor] = useState('stress');
  const [timeRange, setTimeRange] = useState('month'); // 'week', 'month', 'year', 'all'
  
  // Factor definitions with proper icons and color coding
  const factorDefinitions = [
    { 
      id: 'stress', 
      name: 'Stress', 
      icon: <Heart size={18} />, 
      color: '#FF4136',
      valueLabels: ['Niedrig', 'Mittel', 'Hoch'] 
    },
    { 
      id: 'sleep', 
      name: 'Schlafqualität', 
      icon: <Moon size={18} />, 
      color: '#0074D9',
      valueLabels: ['Schlecht', 'Mittel', 'Gut'] 
    },
    { 
      id: 'activity', 
      name: 'Körperliche Aktivität', 
      icon: <Activity size={18} />, 
      color: '#2ECC40',
      valueLabels: ['Niedrig', 'Mittel', 'Hoch'] 
    },
    { 
      id: 'salt', 
      name: 'Salzkonsum', 
      icon: <Utensils size={18} />, 
      color: '#FF851B',
      valueLabels: ['Niedrig', 'Mittel', 'Hoch'] 
    },
    { 
      id: 'caffeine', 
      name: 'Koffein', 
      icon: <Coffee size={18} />, 
      color: '#B10DC9',
      valueLabels: ['Niedrig', 'Mittel', 'Hoch'] 
    },
    { 
      id: 'alcohol', 
      name: 'Alkohol', 
      icon: <Wine size={18} />, 
      color: '#FFDC00',
      valueLabels: ['Keiner', 'Wenig', 'Viel'] 
    }
  ];
  
  // Filter data based on selected time range
  const filteredData = useMemo(() => {
    if (!contextData || Object.keys(contextData).length === 0) return {};
    
    const now = new Date();
    let cutoffDate;
    
    switch (timeRange) {
      case 'week':
        cutoffDate = new Date(now.setDate(now.getDate() - 7));
        break;
      case 'month':
        cutoffDate = new Date(now.setMonth(now.getMonth() - 1));
        break;
      case 'year':
        cutoffDate = new Date(now.setFullYear(now.getFullYear() - 1));
        break;
      default: // 'all'
        return contextData;
    }
    
    return Object.fromEntries(
      Object.entries(contextData).filter(([date]) => {
        return new Date(date) >= cutoffDate;
      })
    );
  }, [contextData, timeRange]);
  
  // Calculate latest context factors
  const latestContextData = useMemo(() => {
    if (!contextData || Object.keys(contextData).length === 0) return null;
    
    // Sort dates in descending order (newest first)
    const sortedDates = Object.keys(contextData).sort((a, b) => 
      new Date(b) - new Date(a)
    );
    
    // Return the most recent context data
    return sortedDates.length > 0 ? contextData[sortedDates[0]] : null;
  }, [contextData]);
  
  // Calculate average values for each factor
  const averageFactors = useMemo(() => {
    if (!filteredData || Object.keys(filteredData).length === 0) return {};
    
    const sums = {};
    const counts = {};
    
    // Sum up all values for each factor
    Object.values(filteredData).forEach(dayData => {
      Object.entries(dayData).forEach(([factor, value]) => {
        if (value !== undefined) {
          sums[factor] = (sums[factor] || 0) + value;
          counts[factor] = (counts[factor] || 0) + 1;
        }
      });
    });
    
    // Calculate averages
    const averages = {};
    Object.keys(sums).forEach(factor => {
      if (counts[factor] > 0) {
        averages[factor] = parseFloat((sums[factor] / counts[factor]).toFixed(1));
      }
    });
    
    return averages;
  }, [filteredData]);
  
  // Generate data for radar chart
  const radarData = useMemo(() => {
    if (!averageFactors || Object.keys(averageFactors).length === 0) {
      return [];
    }
    
    return factorDefinitions.map(factor => ({
      subject: factor.name,
      value: averageFactors[factor.id] !== undefined ? averageFactors[factor.id] : 0,
      fullMark: 2
    })).filter(item => item.value !== 0);
  }, [averageFactors, factorDefinitions]);
  
  // Generate factor trend data (historical values for selected factor)
  const factorTrendData = useMemo(() => {
    if (!filteredData || Object.keys(filteredData).length === 0 || !selectedFactor) {
      return [];
    }
    
    // Convert to array with dates
    const trendData = Object.entries(filteredData)
      .filter(([_, factors]) => factors[selectedFactor] !== undefined)
      .map(([date, factors]) => ({
        date,
        // Format date for display (e.g., "2023-01-15" to "15.01")
        displayDate: new Date(date).toLocaleDateString('de-DE', { 
          day: '2-digit', 
          month: '2-digit' 
        }),
        value: factors[selectedFactor]
      }))
      .sort((a, b) => new Date(a.date) - new Date(b.date));
    
    return trendData;
  }, [filteredData, selectedFactor]);
  
  // Correlation analysis between context factors and blood pressure
  const correlationData = useMemo(() => {
    if (!contextData || !bloodPressureData || 
        Object.keys(contextData).length === 0 || bloodPressureData.length === 0) {
      return { correlations: {}, hasEnoughData: false };
    }
    
    // Convert blood pressure data to a format that can be joined with context data
    const bpByDate = {};
    bloodPressureData.forEach(entry => {
      // Convert display date to ISO format for joining
      const isoDate = formatDateToISO(entry.datum);
      if (isoDate) {
        if (!bpByDate[isoDate]) {
          bpByDate[isoDate] = {
            morningCount: 0,
            eveningCount: 0,
            morningSys: 0,
            morningDia: 0,
            eveningSys: 0,
            eveningDia: 0
          };
        }
        
        // Add morning measurements
        if (entry.morgenSys > 0 && entry.morgenDia > 0) {
          bpByDate[isoDate].morningSys += entry.morgenSys;
          bpByDate[isoDate].morningDia += entry.morgenDia;
          bpByDate[isoDate].morningCount++;
        }
        
        // Add evening measurements
        if (entry.abendSys > 0 && entry.abendDia > 0) {
          bpByDate[isoDate].eveningSys += entry.abendSys;
          bpByDate[isoDate].eveningDia += entry.abendDia;
          bpByDate[isoDate].eveningCount++;
        }
      }
    });
    
    // Calculate averages
    Object.keys(bpByDate).forEach(date => {
      const data = bpByDate[date];
      if (data.morningCount > 0) {
        data.morningSys = Math.round(data.morningSys / data.morningCount);
        data.morningDia = Math.round(data.morningDia / data.morningCount);
      }
      if (data.eveningCount > 0) {
        data.eveningSys = Math.round(data.eveningSys / data.eveningCount);
        data.eveningDia = Math.round(data.eveningDia / data.eveningCount);
      }
    });
    
    // Join context and BP data
    const joinedData = [];
    Object.entries(contextData).forEach(([date, factors]) => {
      if (bpByDate[date]) {
        joinedData.push({
          date,
          ...factors,
          ...bpByDate[date]
        });
      }
    });
    
    // Check if we have enough data for analysis
    if (joinedData.length < 5) {
      return { correlations: {}, hasEnoughData: false };
    }
    
    // Calculate correlations for each factor
    const correlations = {};
    factorDefinitions.forEach(factor => {
      // Collect data points where this factor is present
      const dataPoints = joinedData.filter(point => point[factor.id] !== undefined);
      if (dataPoints.length < 5) return;
      
      // Group by factor value (0, 1, 2)
      const grouped = [[], [], []];
      dataPoints.forEach(point => {
        const value = point[factor.id];
        if (value >= 0 && value <= 2) {
          grouped[value].push(point);
        }
      });
      
      // Calculate average BP for each factor value
      const averages = grouped.map(group => {
        if (group.length === 0) return null;
        
        const totalSys = group.reduce((sum, point) => {
          let systolic = 0;
          if (point.morningCount > 0) systolic += point.morningSys;
          if (point.eveningCount > 0) systolic += point.eveningSys;
          return sum + (systolic / (point.morningCount + point.eveningCount || 1));
        }, 0);
        
        return {
          systolic: Math.round(totalSys / group.length),
          count: group.length
        };
      });
      
      // Determine correlation direction and strength
      let correlation = 'neutral';
      let impact = 'gering';
      
      // We need at least values for the lowest and highest factor values
      if (averages[0] && averages[2]) {
        const diff = averages[2].systolic - averages[0].systolic;
        
        if (Math.abs(diff) <= 3) {
          correlation = 'neutral';
          impact = 'gering';
        } else if (diff > 0) {
          correlation = 'positiv';
          impact = Math.abs(diff) > 8 ? 'stark' : 'mittel';
        } else {
          correlation = 'negativ';
          impact = Math.abs(diff) > 8 ? 'stark' : 'mittel';
        }
      }
      
      // Create chart data for this factor
      const chartData = averages.map((avg, i) => {
        if (!avg) return null;
        return {
          value: i,
          label: factor.valueLabels[i],
          systolic: avg.systolic,
          count: avg.count
        };
      }).filter(Boolean);
      
      correlations[factor.id] = {
        correlation,
        impact,
        chartData,
        averages
      };
    });
    
    return { correlations, hasEnoughData: true };
  }, [contextData, bloodPressureData, factorDefinitions]);
  
  // Helper function to convert display date to ISO format
  function formatDateToISO(displayDate) {
    if (!displayDate) return null;
    
    // Extract day, month, year from displayDate
    let day, month, year = new Date().getFullYear();
    
    // Format "Januar 15"
    if (displayDate.includes(' ') && !displayDate.includes('.')) {
      const parts = displayDate.split(' ');
      month = parts[0];
      day = parts[1];
      
      if (parts.length > 2) {
        year = parseInt(parts[2]);
      }
    } 
    // Format "15. Januar"
    else if (displayDate.includes('.') && displayDate.includes(' ')) {
      const parts = displayDate.split('. ');
      day = parts[0];
      month = parts[1].split(' ')[0];
      
      if (parts[1].split(' ').length > 1) {
        year = parseInt(parts[1].split(' ')[1]);
      }
    } else {
      return null;
    }
    
    // Convert month name to number
    const monthMap = {
      'Januar': '01', 'Februar': '02', 'März': '03', 'April': '04', 
      'Mai': '05', 'Juni': '06', 'Juli': '07', 'August': '08', 
      'September': '09', 'Oktober': '10', 'November': '11', 'Dezember': '12'
    };
    
    const monthNum = monthMap[month];
    if (!monthNum) return null;
    
    // Format ISO date: YYYY-MM-DD
    return `${year}-${monthNum}-${day.padStart(2, '0')}`;
  }
  
  // Render the correlation indicator icon based on correlation type
  const renderCorrelationIndicator = (correlation, impact) => {
    if (correlation === 'positiv') {
      return (
        <div className="flex items-center text-red-500 dark:text-red-400">
          <TrendingUp size={16} />
          <span className="ml-1 text-xs font-medium">{impact}</span>
        </div>
      );
    } else if (correlation === 'negativ') {
      return (
        <div className="flex items-center text-blue-500 dark:text-blue-400">
          <TrendingDown size={16} />
          <span className="ml-1 text-xs font-medium">{impact}</span>
        </div>
      );
    }
    
    return (
      <div className="flex items-center text-gray-500 dark:text-gray-400">
        <Minus size={16} />
        <span className="ml-1 text-xs font-medium">{impact}</span>
      </div>
    );
  };
  
  // Custom tooltip for the radar chart
  const CustomRadarTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      
      // Find the factor definition for this item
      const factor = factorDefinitions.find(f => f.name === data.subject);
      if (!factor) return null;
      
      // Get the value label (e.g. "Niedrig", "Mittel", "Hoch")
      const valueLabel = factor.valueLabels[Math.round(data.value)];
      
      return (
        <div className="bg-white dark:bg-gray-800 p-2 shadow rounded border border-gray-200 dark:border-gray-700">
          <p className="text-sm font-medium text-gray-800 dark:text-white">{data.subject}</p>
          <p className="text-xs text-gray-600 dark:text-gray-300">
            {valueLabel} ({data.value.toFixed(1)})
          </p>
        </div>
      );
    }
    
    return null;
  };
  
  // Custom tooltip for the trend line chart
  const CustomTrendTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const value = payload[0].value;
      const factor = factorDefinitions.find(f => f.id === selectedFactor);
      if (!factor) return null;
      
      const valueLabel = factor.valueLabels[value];
      
      return (
        <div className="bg-white dark:bg-gray-800 p-2 shadow rounded border border-gray-200 dark:border-gray-700">
          <p className="text-sm font-medium text-gray-800 dark:text-white">{label}</p>
          <p className="text-xs text-gray-600 dark:text-gray-300">
            {factor.name}: <span className="font-medium">{valueLabel}</span>
          </p>
        </div>
      );
    }
    
    return null;
  };
  
  // Custom tooltip for the correlation chart
  const CustomCorrelationTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      
      return (
        <div className="bg-white dark:bg-gray-800 p-2 shadow rounded border border-gray-200 dark:border-gray-700">
          <p className="text-sm font-medium text-gray-800 dark:text-white">{data.label}</p>
          <p className="text-xs text-gray-600 dark:text-gray-300">
            Systolisch: <span className="font-medium">{data.systolic} mmHg</span>
          </p>
          <p className="text-xs text-gray-600 dark:text-gray-300">
            Messungen: <span className="font-medium">{data.count}</span>
          </p>
        </div>
      );
    }
    
    return null;
  };
  
  // If no context data is available
  if (!contextData || Object.keys(contextData).length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 text-center">
        <div className="text-blue-600 dark:text-blue-400 mb-2">
          <Heart size={40} className="mx-auto" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          Keine Kontextfaktoren erfasst
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Erfassen Sie Faktoren wie Stress, Schlaf oder Aktivität bei Ihren Messungen,
          um aussagekräftige Trends und Zusammenhänge zu erkennen.
        </p>
        <button 
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          onClick={() => {/* Trigger add entry with context */}}
        >
          Neue Messung mit Kontext erfassen
        </button>
      </div>
    );
  }
  
  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 transition-all">
      {/* Header with section tabs */}
      <div className="flex flex-wrap justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
          Kontextfaktoren-Analyse
        </h2>
        
        <div className="flex flex-wrap space-x-2 mt-2 sm:mt-0">
          <button
            className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
              expandedSection === 'overview'
                ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-medium'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
            onClick={() => setExpandedSection('overview')}
          >
            Übersicht
          </button>
          
          <button
            className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
              expandedSection === 'trends'
                ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-medium'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
            onClick={() => setExpandedSection('trends')}
          >
            Trends
          </button>
          
          <button
            className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
              expandedSection === 'correlations'
                ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-medium'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
            onClick={() => setExpandedSection('correlations')}
          >
            Korrelationen
          </button>
        </div>
      </div>
      
      {/* Time range filter */}
      <div className="flex items-center mb-4">
        <Calendar size={16} className="text-blue-600 dark:text-blue-400 mr-2" />
        <span className="text-sm text-gray-600 dark:text-gray-400 mr-2">Zeitraum:</span>
        <select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value)}
          className="text-sm py-1 px-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200"
        >
          <option value="week">Letzte Woche</option>
          <option value="month">Letzter Monat</option>
          <option value="year">Letztes Jahr</option>
          <option value="all">Alle Daten</option>
        </select>
      </div>
      
      {/* Overview Section */}
      {expandedSection === 'overview' && (
        <div className="space-y-4">
          {/* Latest values and radar chart */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Latest context factors */}
            <div className="lg:col-span-1">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Aktuelle Faktoren
              </h3>
              
              <div className="grid grid-cols-2 gap-2">
                {factorDefinitions.map(factor => {
                  // Get the current value for this factor
                  const value = latestContextData && latestContextData[factor.id] !== undefined
                    ? latestContextData[factor.id]
                    : null;
                    
                  // Get the average value for comparison
                  const avgValue = averageFactors[factor.id];
                  
                  // Skip if no value is available
                  if (value === null) return null;
                  
                  // Determine trend (compared to average)
                  let trend = 'neutral';
                  if (avgValue !== undefined) {
                    if (value > avgValue + 0.3) trend = 'up';
                    else if (value < avgValue - 0.3) trend = 'down';
                  }
                  
                  return (
                    <div 
                      key={factor.id}
                      className="p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm"
                    >
                      <div className="flex justify-between items-center mb-1">
                        <div className="flex items-center">
                          <span className="text-blue-600 dark:text-blue-400 mr-1.5">{factor.icon}</span>
                          <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                            {factor.name}
                          </span>
                        </div>
                        
                        {trend === 'up' && (
                          <TrendingUp size={14} className="text-red-500 dark:text-red-400" />
                        )}
                        {trend === 'down' && (
                          <TrendingDown size={14} className="text-blue-500 dark:text-blue-400" />
                        )}
                      </div>
                      
                      <div className="mt-1">
                        <span 
                          className="text-sm font-bold" 
                          style={{ color: factor.color }}
                        >
                          {factor.valueLabels[value]}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            
            {/* Radar chart */}
            <div className="lg:col-span-2 bg-gray-50 dark:bg-gray-900/50 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Faktor-Übersicht
              </h3>
              
              <div className="h-64">
                {radarData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart 
                      cx="50%" 
                      cy="50%" 
                      outerRadius="80%" 
                      data={radarData}
                    >
                      <PolarGrid stroke="#888" strokeDasharray="3 3" />
                      <PolarAngleAxis 
                        dataKey="subject" 
                        tick={{ fill: '#666', fontSize: 12 }} 
                      />
                      <PolarRadiusAxis 
                        angle={30} 
                        domain={[0, 2]} 
                        tick={{ fill: '#666', fontSize: 10 }} 
                      />
                      <Tooltip content={<CustomRadarTooltip />} />
                      <Radar
                        name="Faktoren"
                        dataKey="value"
                        stroke="#8884d8"
                        fill="#8884d8"
                        fillOpacity={0.5}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center">
                    <p className="text-gray-500 dark:text-gray-400">
                      Nicht genügend Daten für eine Visualisierung
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Average values display */}
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Durchschnittswerte im ausgewählten Zeitraum
            </h3>
            
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {factorDefinitions.map(factor => {
                const avgValue = averageFactors[factor.id];
                if (avgValue === undefined) return null;
                
                return (
                  <div 
                    key={factor.id}
                    className="p-2 bg-gray-50 dark:bg-gray-900/50 rounded-lg text-center"
                  >
                    <div className="text-blue-600 dark:text-blue-400 mb-1">{factor.icon}</div>
                    <div className="text-xs font-medium text-gray-700 dark:text-gray-300">
                      {factor.name}
                    </div>
                    <div 
                      className="text-sm font-bold" 
                      style={{ color: factor.color }}
                    >
                      {factor.valueLabels[Math.round(avgValue)]}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {avgValue.toFixed(1)} / 2
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
      
      {/* Trends Section */}
      {expandedSection === 'trends' && (
        <div className="space-y-4">
          {/* Factor selection */}
          <div className="flex flex-wrap gap-2 mb-4">
            {factorDefinitions.map(factor => {
              // Skip factors with no data
              if (!averageFactors[factor.id]) return null;
              
              return (
                <button
                  key={factor.id}
                  className={`px-3 py-1.5 rounded-md text-sm flex items-center transition-colors ${
                    selectedFactor === factor.id
                      ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 font-medium'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                  onClick={() => setSelectedFactor(factor.id)}
                >
                  <span className="mr-1.5">{factor.icon}</span>
                  <span>{factor.name}</span>
                </button>
              );
            })}
          </div>
          
          {/* Selected factor trend chart */}
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
              {factorDefinitions.find(f => f.id === selectedFactor)?.name || 'Faktor'} Trend
            </h3>
            
            <div className="h-64">
              {factorTrendData.length > 1 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={factorTrendData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis 
                      dataKey="displayDate" 
                      tick={{ fontSize: 12 }} 
                      interval="preserveEnd"
                    />
                    <YAxis 
                      domain={[0, 2]} 
                      ticks={[0, 1, 2]} 
                      tick={{ fontSize: 12 }}
                    />
                    <Tooltip content={<CustomTrendTooltip />} />
                    <Line 
                      type="monotone" 
                      dataKey="value" 
                      stroke={factorDefinitions.find(f => f.id === selectedFactor)?.color || '#8884d8'} 
                      strokeWidth={2}
                      dot={{ r: 4, strokeWidth: 2 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center">
                  <p className="text-gray-500 dark:text-gray-400">
                    Nicht genügend Daten für diesen Faktor
                  </p>
                </div>
              )}
            </div>
          </div>
          
          {/* Value distribution */}
          <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Werte-Verteilung
            </h3>
            
            <div className="h-40">
              {factorTrendData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={[0, 1, 2].map(value => {
                      const count = factorTrendData.filter(d => d.value === value).length;
                      const factor = factorDefinitions.find(f => f.id === selectedFactor);
                      return {
                        value,
                        label: factor?.valueLabels[value] || value,
                        count
                      };
                    })}
                    margin={{ top: 10, right: 10, left: 10, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip 
                      formatter={(value) => [`${value} Messungen`, 'Anzahl']} 
                      labelFormatter={(label) => `${label}`}
                    />
                    <Bar 
                      dataKey="count" 
                      fill={factorDefinitions.find(f => f.id === selectedFactor)?.color || '#8884d8'} 
                      radius={[4, 4, 0, 0]} 
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center">
                  <p className="text-gray-500 dark:text-gray-400">
                    Keine Daten für diesen Faktor vorhanden
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Correlations Section */}
      {expandedSection === 'correlations' && (
        <div className="space-y-4">
          {!correlationData.hasEnoughData ? (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 p-4 rounded-lg text-yellow-800 dark:text-yellow-400">
              <h3 className="font-medium mb-2">Nicht genügend Daten für Korrelationsanalyse</h3>
              <p className="text-sm">
                Um Zusammenhänge zwischen Kontextfaktoren und Blutdruck zu erkennen, 
                werden mindestens 5 Messungen mit Kontextfaktoren benötigt.
              </p>
            </div>
          ) : (
            <>
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-4 rounded-lg">
                <h3 className="text-blue-800 dark:text-blue-400 font-medium mb-2">
                  Zusammenhänge zwischen Faktoren und Blutdruck
                </h3>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  Die Analyse zeigt mögliche Zusammenhänge zwischen Ihren Kontextfaktoren 
                  und Blutdruckwerten. Bitte beachten Sie, dass dies keine medizinische 
                  Diagnose ersetzt.
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {factorDefinitions.map(factor => {
                  const correlation = correlationData.correlations[factor.id];
                  if (!correlation || !correlation.chartData || correlation.chartData.length < 2) {
                    return null;
                  }
                  
                  return (
                    <div 
                      key={factor.id}
                      className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700"
                    >
                      <div className="flex justify-between items-center mb-3">
                        <div className="flex items-center">
                          <span className="text-indigo-600 dark:text-indigo-400 mr-1.5">{factor.icon}</span>
                          <span className="font-medium text-gray-800 dark:text-white">
                            {factor.name}
                          </span>
                        </div>
                        
                        {renderCorrelationIndicator(correlation.correlation, correlation.impact)}
                      </div>
                      
                      <div className="h-48">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={correlation.chartData}
                            margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                            <YAxis 
                              domain={['dataMin - 5', 'dataMax + 5']} 
                              tick={{ fontSize: 10 }} 
                            />
                            <Tooltip content={<CustomCorrelationTooltip />} />
                            <Bar 
                              dataKey="systolic" 
                              fill={factor.color} 
                              radius={[4, 4, 0, 0]}
                            />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                      
                      <div className="mt-2 text-xs text-gray-600 dark:text-gray-400">
                        {correlation.correlation === 'positiv' ? (
                          <p>
                            Höhere {factor.name}-Werte korrelieren mit 
                            <span className="font-medium text-red-600 dark:text-red-400"> höherem </span> 
                            Blutdruck.
                          </p>
                        ) : correlation.correlation === 'negativ' ? (
                          <p>
                            Höhere {factor.name}-Werte korrelieren mit 
                            <span className="font-medium text-blue-600 dark:text-blue-400"> niedrigerem </span> 
                            Blutdruck.
                          </p>
                        ) : (
                          <p>
                            Kein eindeutiger Zusammenhang zwischen {factor.name} und Blutdruck erkennbar.
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default EnhancedContextFactors;