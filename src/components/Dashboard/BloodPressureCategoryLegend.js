// components/Dashboard/BloodPressureCategoryLegend.js
import React from 'react';
import { bloodPressureCategories } from '../../utils/bloodPressureUtils';

const BloodPressureCategoryLegend = () => {
  return (
    <div className="bg-white p-4 rounded-lg shadow-sm">
      <h2 className="text-lg font-semibold mb-3">Blutdruck-Kategorien:</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {bloodPressureCategories.map((category) => (
          <div 
            key={category.name}
            className="p-3 rounded-lg" 
            style={{ backgroundColor: category.color + "20" }}
          >
            <div className="font-medium text-sm" style={{ color: category.color }}>
              {category.name}
            </div>
            <div className="text-sm text-gray-600">{category.range}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BloodPressureCategoryLegend;