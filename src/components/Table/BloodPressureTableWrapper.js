// components/Table/BloodPressureTableWrapper.js
import React from 'react';

// Import both table implementations directly
import StandardTable from './BloodPressureTable';
import VirtualizedTable from './VirtualizedBloodPressureTable';

const BloodPressureTableWrapper = ({ data, ...props }) => {
  // Use virtualized table for large datasets (more than 50 entries)
  const TableComponent = data.length > 50 ? VirtualizedTable : StandardTable;
  
  return <TableComponent data={data} {...props} />;
};

export default BloodPressureTableWrapper;