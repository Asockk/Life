// components/Table/BloodPressureTableWrapper.js
import React, { lazy } from 'react';

// Import both table implementations
const StandardTable = lazy(() => import('./BloodPressureTable'));
const VirtualizedTable = lazy(() => import('./VirtualizedBloodPressureTable'));

const BloodPressureTableWrapper = ({ data, ...props }) => {
  // Use virtualized table for large datasets (more than 50 entries)
  const TableComponent = data.length > 50 ? VirtualizedTable : StandardTable;
  
  return <TableComponent data={data} {...props} />;
};

export default BloodPressureTableWrapper;