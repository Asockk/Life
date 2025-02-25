// components/Dashboard/BloodPressureChart.js
import React, { useCallback } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
         ResponsiveContainer, ReferenceLine, Area } from 'recharts';
import { getBloodPressureCategory } from '../../utils/bloodPressureUtils';

const BloodPressureChart = ({ data, viewType, avgValues }) => {
  // Prefix für aktuelle Ansicht (morgen oder abend)
  const prefix = viewType === 'morgen' ? 'morgen' : 'abend';
  
  // Custom Dot für die Linien, um 0-Werte nicht anzuzeigen
  const CustomizedDot = (props) => {
    const { cx, cy, value } = props;
    
    // Wenn der Wert 0 ist oder nicht existiert, keinen Punkt zeichnen
    if (value === 0 || value === undefined || value === null) {
      return null;
    }
    
    // Sonst den Standardpunkt zurückgeben
    return (
      <circle cx={cx} cy={cy} r={5} fill={props.stroke} stroke={props.stroke} strokeWidth={2} />
    );
  };
  
  // Custom Dot für aktivierte Datenpunkte
  const CustomizedActiveDot = (props) => {
    const { cx, cy, value } = props;
    
    // Wenn der Wert 0 ist, keinen Punkt zeichnen
    if (value === 0 || value === undefined || value === null) {
      return null;
    }
    
    // Sonst den aktiven Punkt zurückgeben
    return (
      <circle cx={cx} cy={cy} r={7} fill={props.stroke} stroke={props.stroke} strokeWidth={2} />
    );
  };
  
  // Benutzerdefinierter Tooltip für das Diagramm
  const CustomTooltip = useCallback(({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const sys = data[`${prefix}Sys`];
      const dia = data[`${prefix}Dia`];
      const puls = data[`${prefix}Puls`];
      
      // Wenn ein Wert 0 ist, soll er nicht angezeigt werden
      if ((sys === 0 && dia === 0) || (sys === 0 || dia === 0)) {
        return null; // Kein Tooltip anzeigen
      }
      
      const category = getBloodPressureCategory(sys, dia);
      
      return (
        <div className="custom-tooltip bg-white p-3 border border-gray-200 shadow-lg rounded-md">
          <p className="font-medium">{label}, {data.datum}</p>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-1">
            {sys > 0 && (
              <>
                <span className="text-gray-600">Systolisch:</span>
                <span className="font-medium">{sys} mmHg</span>
              </>
            )}
            
            {dia > 0 && (
              <>
                <span className="text-gray-600">Diastolisch:</span>
                <span className="font-medium">{dia} mmHg</span>
              </>
            )}
            
            {puls > 0 && (
              <>
                <span className="text-gray-600">Puls:</span>
                <span className="font-medium">{puls} bpm</span>
              </>
            )}
            
            {sys > 0 && dia > 0 && (
              <>
                <span className="text-gray-600">Kategorie:</span>
                <span className="font-medium" style={{ color: category.color }}>{category.category}</span>
              </>
            )}
          </div>
        </div>
      );
    }
    
    return null;
  }, [prefix]);
  
  return (
    <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">
          {viewType === 'morgen' ? 'Morgen-Blutdruckwerte' : 'Abend-Blutdruckwerte'}
        </h2>
        <div className="text-sm text-gray-500">
          {data.length} Messungen
        </div>
      </div>
      
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart 
            data={data} 
            margin={{ top: 20, right: 120, left: 10, bottom: 10 }}
            connectNulls={false} // Wichtig: 0-Werte nicht verbinden
          >
            <CartesianGrid strokeDasharray="3 3" opacity={0.7} />
            <XAxis 
              dataKey="tag" 
              tick={{ fill: '#333', fontSize: 12 }}
              tickLine={{ stroke: '#555' }}
            />
            <YAxis 
              domain={[40, 180]} 
              tick={{ fill: '#333', fontSize: 12 }}
              tickLine={{ stroke: '#555' }}
              tickCount={7}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              iconType="circle"
              layout="horizontal"
              verticalAlign="top"
              align="center"
              wrapperStyle={{ paddingBottom: '10px' }}
            />
                
            {/* Referenzlinien für Blutdruckbereiche mit verbesserten Labels */}
            <ReferenceLine 
              y={120} 
              stroke="#2ECC40" 
              strokeDasharray="3 3" 
              label={{
                value: "Optimal/Normal", 
                position: "right", 
                fill: "#2ECC40",
                offset: 5
              }} 
            />
            <ReferenceLine 
              y={140} 
              stroke="#FF851B" 
              strokeDasharray="3 3" 
              label={{
                value: "Hyp. Grad 1", 
                position: "right", 
                fill: "#FF851B",
                offset: 5
              }} 
            />
            <ReferenceLine 
              y={160} 
              stroke="#FF4136" 
              strokeDasharray="3 3" 
              label={{
                value: "Hyp. Grad 2", 
                position: "right", 
                fill: "#FF4136",
                offset: 5
              }} 
            />
                
            {/* Durchschnitt-Bereiche */}
            <Area 
              type="monotone" 
              dataKey={`avg${prefix.charAt(0).toUpperCase()}${prefix.slice(1)}Sys`} 
              fill="#FF4136" 
              fillOpacity={0.1} 
              stroke="none" 
              name="Sys-Durchschnitt"
            />
            <Area 
              type="monotone" 
              dataKey={`avg${prefix.charAt(0).toUpperCase()}${prefix.slice(1)}Dia`} 
              fill="#0074D9" 
              fillOpacity={0.1} 
              stroke="none" 
              name="Dia-Durchschnitt"
            />
                
            {/* Hauptlinien mit angepassten Dots, um 0-Werte zu ignorieren */}
            <Line 
              type="monotone" 
              dataKey={`${prefix}Sys`} 
              stroke="#FF4136" 
              name="Systolisch" 
              strokeWidth={2.5}
              dot={<CustomizedDot />}
              activeDot={<CustomizedActiveDot />}
              connectNulls={false} // 0-Werte nicht verbinden
            />
            <Line 
              type="monotone" 
              dataKey={`${prefix}Dia`} 
              stroke="#0074D9" 
              name="Diastolisch" 
              strokeWidth={2.5}
              dot={<CustomizedDot />}
              activeDot={<CustomizedActiveDot />}
              connectNulls={false} // 0-Werte nicht verbinden
            />
            <Line 
              type="monotone" 
              dataKey={`${prefix}Puls`} 
              stroke="#2ECC40" 
              name="Puls" 
              strokeWidth={2}
              dot={<CustomizedDot />}
              activeDot={<CustomizedActiveDot />}
              connectNulls={false} // 0-Werte nicht verbinden
            />
                
            {/* Gleitende Durchschnitte */}
            <Line 
              type="monotone" 
              dataKey={`${prefix}SysMA`} 
              stroke="#FF851B" 
              name="Sys (3-Tage-Ø)" 
              strokeWidth={2}
              strokeDasharray="5 5" 
              dot={false}
              activeDot={false}
              connectNulls={true} // Durchschnitte können verbunden werden
            />
            <Line 
              type="monotone" 
              dataKey={`${prefix}DiaMA`} 
              stroke="#39CCCC" 
              name="Dia (3-Tage-Ø)" 
              strokeWidth={2}
              strokeDasharray="5 5" 
              dot={false}
              activeDot={false}
              connectNulls={true} // Durchschnitte können verbunden werden
            />
                
            {/* Globale Durchschnittslinien mit verbesserten Labels */}
            <ReferenceLine 
              y={avgValues.sys} 
              stroke="#B10DC9" 
              strokeWidth={1.5}
              label={{
                value: "Ø Sys: " + avgValues.sys, 
                position: "left", 
                fill: "#B10DC9",
                offset: 5
              }} 
            />
            <ReferenceLine 
              y={avgValues.dia} 
              stroke="#7FDBFF" 
              strokeWidth={1.5}
              label={{
                value: "Ø Dia: " + avgValues.dia, 
                position: "left", 
                fill: "#7FDBFF",
                offset: 5
              }} 
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      
      <div className="mt-3 text-xs text-gray-500 grid grid-cols-2 md:grid-cols-3 gap-y-1">
        <div><span className="inline-block w-3 h-3 rounded-full bg-red-500 mr-1"></span> Systolisch</div>
        <div><span className="inline-block w-3 h-3 rounded-full bg-blue-500 mr-1"></span> Diastolisch</div>
        <div><span className="inline-block w-3 h-3 rounded-full bg-green-500 mr-1"></span> Puls</div>
        <div><span className="inline-block w-3 h-3 rounded-full bg-yellow-500 mr-1"></span> 3-Tage-Durchschnitt Sys</div>
        <div><span className="inline-block w-3 h-3 rounded-full bg-cyan-500 mr-1"></span> 3-Tage-Durchschnitt Dia</div>
        <div><span className="inline-block w-3 h-3 border-2 border-purple-500 mr-1"></span> Gesamt-Durchschnitt</div>
      </div>
    </div>
  );
};

export default BloodPressureChart;  