// components/Dashboard/BloodPressureCategoryLegend.js
import React from 'react';
import { bloodPressureCategories } from '../../utils/bloodPressureUtils';
import { useTheme } from '../../contexts/ThemeContext';

const BloodPressureCategoryLegend = () => {
  const { theme } = useTheme();
  
  // Kategorieobjekte erweitern und neu mappen für Theme-Unterstützung
  const mappedCategories = bloodPressureCategories.map(category => {
    let themeColor;
    
    if (category.name.toLowerCase().includes('optimal')) {
      themeColor = theme.categories.optimal;
    } else if (category.name.toLowerCase().includes('normal') && !category.name.toLowerCase().includes('hoch')) {
      themeColor = theme.categories.normal;
    } else if (category.name.toLowerCase().includes('hoch normal')) {
      themeColor = theme.categories.highNormal;
    } else if (category.name.toLowerCase().includes('hypertonie grad 1')) {
      themeColor = theme.categories.hypertension1;
    } else if (category.name.toLowerCase().includes('hypertonie grad 2')) {
      themeColor = theme.categories.hypertension2;
    } else if (category.name.toLowerCase().includes('hypertonie grad 3')) {
      themeColor = theme.categories.hypertension3;
    } else {
      themeColor = theme.text.muted;
    }
    
    return {
      ...category,
      themeColor
    };
  });

  return (
    <div className="card transition-all duration-300" style={{ 
      backgroundColor: theme.card,
      borderColor: theme.border
    }}>
      <div className="p-4">
        <h2 className="text-lg font-semibold mb-3" style={{ color: theme.text.primary }}>Blutdruck-Kategorien:</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {mappedCategories.map((category) => (
            <div 
              key={category.name}
              className="p-3 rounded-lg transition-all duration-200 interactive"
              style={{ 
                backgroundColor: `${category.themeColor}20`,
                borderColor: category.themeColor,
                borderWidth: '1px'
              }}
            >
              <div className="font-medium text-sm mb-1" style={{ color: category.themeColor }}>
                {category.name}
              </div>
              <div className="text-xs" style={{ color: theme.text.secondary }}>{category.range}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default BloodPressureCategoryLegend;