// components/Table/BloodPressureTable.js
import React from 'react';
import { Edit, Trash } from 'lucide-react';
import { getBloodPressureCategory, formatTableValue } from '../../utils/bloodPressureUtils';

const BloodPressureTable = ({ data, onEdit, onDelete }) => {
  return (
    <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Ihre Blutdruck-Einträge</h2>
        <div className="text-sm text-gray-500">
          Drag to scroll →
        </div>
      </div>
      
      <div className="overflow-x-auto" style={{ WebkitOverflowScrolling: 'touch' }}>
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Datum</th>
              <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Morgen (Sys/Dia/Puls)</th>
              <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Abend (Sys/Dia/Puls)</th>
              <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Aktionen</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.map((entry) => {
              const morgenBP = entry.morgenSys > 0 && entry.morgenDia > 0 
                ? getBloodPressureCategory(entry.morgenSys, entry.morgenDia) 
                : { category: "Unbekannt", color: "#AAAAAA" };
              
              const abendBP = entry.abendSys > 0 && entry.abendDia > 0 
                ? getBloodPressureCategory(entry.abendSys, entry.abendDia)
                : { category: "Unbekannt", color: "#AAAAAA" };
              
              return (
                <tr key={entry.id} className="hover:bg-gray-50">
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{entry.tag}, {entry.datum}</div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-center">
                    {entry.morgenSys > 0 && entry.morgenDia > 0 ? (
                      <span 
                        className="px-2 py-1 inline-flex items-center justify-center rounded-full text-xs font-medium"
                        style={{ backgroundColor: morgenBP.color + '20', color: morgenBP.color }}
                      >
                        {formatTableValue(entry.morgenSys, entry.morgenDia, entry.morgenPuls || '-')}
                      </span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-center">
                    {entry.abendSys > 0 && entry.abendDia > 0 ? (
                      <span 
                        className="px-2 py-1 inline-flex items-center justify-center rounded-full text-xs font-medium"
                        style={{ backgroundColor: abendBP.color + '20', color: abendBP.color }}
                      >
                        {formatTableValue(entry.abendSys, entry.abendDia, entry.abendPuls || '-')}
                      </span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-3">
                      <button 
                        onClick={() => onEdit(entry)}
                        className="text-blue-600 hover:text-blue-900"
                        title="Bearbeiten"
                      >
                        <Edit size={18} />
                      </button>
                      <button 
                        onClick={() => onDelete(entry.id)}
                        className="text-red-600 hover:text-red-900"
                        title="Löschen"
                      >
                        <Trash size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default BloodPressureTable;