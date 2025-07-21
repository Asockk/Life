// Virtualized Table Component for Performance
import React, { memo, useCallback, useMemo } from 'react';
import { FixedSizeList as List } from 'react-window';
import InfiniteLoader from 'react-window-infinite-loader';
import { Edit2, Trash2, ChevronUp, ChevronDown } from 'lucide-react';
import { getBloodPressureCategory } from '../../utils/bloodPressureUtils';

const VirtualizedTable = memo(({ 
  data, 
  onEdit, 
  onDelete, 
  darkMode,
  searchQuery = '',
  filterCategory = 'all'
}) => {
  // Filter and sort data
  const filteredData = useMemo(() => {
    let filtered = [...data];
    
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(entry => 
        entry.datum.toLowerCase().includes(query) ||
        entry.notizen?.toLowerCase().includes(query)
      );
    }
    
    // Category filter
    if (filterCategory !== 'all') {
      filtered = filtered.filter(entry => {
        const sys = entry.morgenSys || entry.abendSys;
        const dia = entry.morgenDia || entry.abendDia;
        if (sys && dia) {
          const category = getBloodPressureCategory(sys, dia);
          return category.category === filterCategory;
        }
        return false;
      });
    }
    
    // Sort by date descending
    return filtered.sort((a, b) => {
      const dateA = new Date(a.datum);
      const dateB = new Date(b.datum);
      return dateB - dateA;
    });
  }, [data, searchQuery, filterCategory]);

  // Row renderer
  const Row = useCallback(({ index, style }) => {
    const entry = filteredData[index];
    if (!entry) return null;
    
    const morgenCategory = entry.morgenSys && entry.morgenDia 
      ? getBloodPressureCategory(entry.morgenSys, entry.morgenDia)
      : null;
    
    const abendCategory = entry.abendSys && entry.abendDia
      ? getBloodPressureCategory(entry.abendSys, entry.abendDia)
      : null;
    
    return (
      <div 
        style={style} 
        className={`
          flex items-center px-4 py-2 border-b transition-colors
          ${darkMode 
            ? 'border-gray-700 hover:bg-gray-800' 
            : 'border-gray-200 hover:bg-gray-50'}
          ${index % 2 === 0 
            ? (darkMode ? 'bg-gray-900/50' : 'bg-gray-50/50') 
            : ''}
        `}
      >
        {/* Date Column */}
        <div className="flex-1 min-w-0">
          <div className="font-medium text-sm">{entry.datum}</div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {entry.tag || entry.wochentag}
          </div>
        </div>
        
        {/* Morning Values */}
        <div className="flex-1 text-center">
          {entry.morgenSys && entry.morgenDia ? (
            <div>
              <span 
                className="font-semibold text-sm"
                style={{ color: morgenCategory?.color }}
              >
                {entry.morgenSys}/{entry.morgenDia}
              </span>
              {entry.morgenPuls && (
                <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                  P: {entry.morgenPuls}
                </span>
              )}
            </div>
          ) : (
            <span className="text-gray-400">-</span>
          )}
        </div>
        
        {/* Evening Values */}
        <div className="flex-1 text-center">
          {entry.abendSys && entry.abendDia ? (
            <div>
              <span 
                className="font-semibold text-sm"
                style={{ color: abendCategory?.color }}
              >
                {entry.abendSys}/{entry.abendDia}
              </span>
              {entry.abendPuls && (
                <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                  P: {entry.abendPuls}
                </span>
              )}
            </div>
          ) : (
            <span className="text-gray-400">-</span>
          )}
        </div>
        
        {/* Actions */}
        <div className="flex gap-2 justify-end">
          <button
            onClick={() => onEdit(entry)}
            className={`
              p-1.5 rounded-lg transition-colors
              ${darkMode 
                ? 'hover:bg-gray-700 text-gray-400 hover:text-gray-200' 
                : 'hover:bg-gray-200 text-gray-600 hover:text-gray-800'}
            `}
            aria-label="Bearbeiten"
          >
            <Edit2 size={16} />
          </button>
          <button
            onClick={() => onDelete(entry.id)}
            className={`
              p-1.5 rounded-lg transition-colors
              ${darkMode 
                ? 'hover:bg-red-900/50 text-gray-400 hover:text-red-400' 
                : 'hover:bg-red-100 text-gray-600 hover:text-red-600'}
            `}
            aria-label="Löschen"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    );
  }, [filteredData, onEdit, onDelete, darkMode]);

  // Calculate optimal row height
  const rowHeight = 64;
  const headerHeight = 48;
  
  // Container height (responsive)
  const getListHeight = () => {
    const windowHeight = window.innerHeight;
    const mobileNavHeight = 80;
    const desktopNavHeight = 200;
    const isMobile = window.innerWidth < 768;
    
    return windowHeight - (isMobile ? mobileNavHeight : desktopNavHeight) - headerHeight;
  };

  const [listHeight, setListHeight] = React.useState(getListHeight());

  React.useEffect(() => {
    const handleResize = () => setListHeight(getListHeight());
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Header component
  const Header = () => (
    <div className={`
      sticky top-0 z-10 flex items-center px-4 py-3 font-medium text-sm
      ${darkMode 
        ? 'bg-gray-800 border-b border-gray-700 text-gray-300' 
        : 'bg-white border-b border-gray-200 text-gray-700'}
    `} style={{ height: headerHeight }}>
      <div className="flex-1">Datum</div>
      <div className="flex-1 text-center">Morgen</div>
      <div className="flex-1 text-center">Abend</div>
      <div className="w-24 text-right">Aktionen</div>
    </div>
  );

  return (
    <div className={`
      rounded-lg overflow-hidden shadow-sm
      ${darkMode ? 'bg-gray-900' : 'bg-white'}
    `}>
      <Header />
      
      {filteredData.length === 0 ? (
        <div className="p-8 text-center text-gray-500 dark:text-gray-400">
          {searchQuery || filterCategory !== 'all' 
            ? 'Keine Einträge gefunden' 
            : 'Noch keine Einträge vorhanden'}
        </div>
      ) : (
        <List
          height={listHeight}
          itemCount={filteredData.length}
          itemSize={rowHeight}
          width="100%"
          overscanCount={5}
        >
          {Row}
        </List>
      )}
      
      {/* Entry count */}
      <div className={`
        px-4 py-2 text-xs text-center border-t
        ${darkMode 
          ? 'bg-gray-800 border-gray-700 text-gray-400' 
          : 'bg-gray-50 border-gray-200 text-gray-600'}
      `}>
        {filteredData.length} von {data.length} Einträgen
      </div>
    </div>
  );
});

VirtualizedTable.displayName = 'VirtualizedTable';

export default VirtualizedTable;