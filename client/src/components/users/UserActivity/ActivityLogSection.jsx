              import React, { useState, useEffect } from 'react';
import { 
  FaSearch, 
  FaFilter, 
  FaSpinner, 
  FaEye, 
  FaServer, 
  FaExclamationTriangle,
  FaCalendarAlt,
  FaSortAmountDown,
  FaSortAmountUp,
  FaDownload,
  FaTrash,
  FaSync,
  FaGlobe
} from 'react-icons/fa';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

/**
 * ActivityLogSection component that displays a filterable, sortable activity log
 */
const ActivityLogSection = ({ activityLog = [], isLoading, error, onRefresh, sessionData }) => {
  const [filteredLogs, setFilteredLogs] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    action: '',
    dateFrom: '',
    dateTo: '',
    resource: ''
  });
  const [sortConfig, setSortConfig] = useState({
    key: 'timestamp',
    direction: 'desc'
  });
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [exportLoading, setExportLoading] = useState(false);

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
      hour12: true
    }).format(date);
  };

  // Get unique action types for filter dropdown
  const getUniqueActions = () => {
    const actions = new Set();
    activityLog.forEach(log => {
      if (log.action) actions.add(log.action);
    });
    return Array.from(actions);
  };

  // Get unique resource types for filter dropdown
  const getUniqueResources = () => {
    const resources = new Set();
    activityLog.forEach(log => {
      if (log.resource) resources.add(log.resource);
    });
    return Array.from(resources);
  };

  // Apply filters and search to activity logs
  useEffect(() => {
    let result = [...activityLog];
    
    // Apply search term - Enhanced search across multiple fields with smarter matching
    if (searchTerm) {
      const terms = searchTerm.toLowerCase().split(' ').filter(term => term.length > 0);
      
      if (terms.length > 0) {
        result = result.filter(log => {
          // Check if ALL search terms are found in ANY of the searchable fields
          return terms.every(term => {
            return (
              (log.action && log.action.toLowerCase().includes(term)) ||
              (log.details && log.details.toLowerCase().includes(term)) ||
              (log.path && log.path.toLowerCase().includes(term)) ||
              (log.resource && log.resource.toLowerCase().includes(term)) ||
              (log.timestamp && formatDate(log.timestamp).toLowerCase().includes(term))
            );
          });
        });
      }
    }
    
    // Apply filters
    if (filters.action) {
      result = result.filter(log => log.action === filters.action);
    }
    
    if (filters.resource) {
      result = result.filter(log => log.resource === filters.resource);
    }
    
    if (filters.dateFrom) {
      const fromDate = new Date(filters.dateFrom);
      result = result.filter(log => new Date(log.timestamp) >= fromDate);
    }
    
    if (filters.dateTo) {
      const toDate = new Date(filters.dateTo);
      toDate.setHours(23, 59, 59, 999); // End of day
      result = result.filter(log => new Date(log.timestamp) <= toDate);
    }
    
    // Apply sorting
    result.sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];
      
      if (sortConfig.key === 'timestamp') {
        return sortConfig.direction === 'asc' 
          ? new Date(aValue) - new Date(bValue)
          : new Date(bValue) - new Date(aValue);
      }
      
      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
    
    setFilteredLogs(result);
  }, [activityLog, searchTerm, filters, sortConfig]);

  // Handle sort click
  const handleSort = (key) => {
    setSortConfig(prevConfig => ({
      key,
      direction: prevConfig.key === key && prevConfig.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  // Reset all filters
  const resetFilters = () => {
    setSearchTerm('');
    setFilters({
      action: '',
      dateFrom: '',
      dateTo: '',
      resource: ''
    });
    setSortConfig({
      key: 'timestamp',
      direction: 'desc'
    });
  };

  // Export data as Excel using ExcelJS
  const exportToExcel = async () => {
    if (filteredLogs.length === 0) {
      alert('No data to export!');
      return;
    }
    
    try {
      setExportLoading(true);
      console.log('Starting Excel export with ExcelJS...', filteredLogs.length, 'log entries');
      
      // Create a new workbook
      const workbook = new ExcelJS.Workbook();
      
      // Add single worksheet for all data
      const sheet = workbook.addWorksheet('Activity Report');
      
      // Current row tracker
      let currentRow = 1;
      
      // Add title for the user details section
      const titleRow = sheet.addRow(['User Session Details']);
      titleRow.font = { bold: true, size: 14 };
      titleRow.height = 24;
      currentRow++;
      
      // Add user info
      if (sessionData) {
        sheet.addRow(['User', sessionData.userId?.name || 'Unknown User']);
        currentRow++;
        
        sheet.addRow(['Email', sessionData.userId?.email || 'Unknown Email']);
        currentRow++;
        
        sheet.addRow(['Session ID', sessionData.sessionId || 'Unknown']);
        currentRow++;
        
        sheet.addRow(['Login Time', formatDate(sessionData.loginTime)]);
        currentRow++;
        
        if (sessionData.logoutTime) {
          sheet.addRow(['Logout Time', formatDate(sessionData.logoutTime)]);
          currentRow++;
        }
        
        if (sessionData.deviceInfo) {
          sheet.addRow(['Device', sessionData.deviceInfo.device || 'Unknown']);
          currentRow++;
          
          sheet.addRow(['Browser', sessionData.deviceInfo.browser || 'Unknown']);
          currentRow++;
          
          sheet.addRow(['IP Address', sessionData.deviceInfo.ipAddress || 'Unknown']);
          currentRow++;
        }
      }
      
      // Add report generation info
      sheet.addRow([]);
      currentRow++;
      
      const reportRow = sheet.addRow(['Report Generated', formatDate(new Date())]);
      reportRow.font = { italic: true };
      currentRow++;
      
      // Add empty rows as separator
      sheet.addRow([]);
      currentRow++;
      sheet.addRow([]);
      currentRow++;
      
      // Add title for activity log section
      const activityTitleRow = sheet.addRow(['ACTIVITY LOG']);
      activityTitleRow.font = { bold: true, size: 14 };
      activityTitleRow.height = 24;
      currentRow++;
      
      // Add header row for activity log
      const headers = ['Action', 'Timestamp', 'Details', 'Resource', 'Path'];
      const headerRow = sheet.addRow(headers);
      headerRow.eachCell((cell) => {
        cell.font = { bold: true, color: { argb: 'FFFFFF' } };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: '4F81BD' }
        };
        cell.alignment = { horizontal: 'center' };
      });
      currentRow++;
      
      console.log('Headers added at row', currentRow - 1);
      
      // Add activity log data rows
      filteredLogs.forEach((log, index) => {
        const rowData = [
          log.action || '',
          formatDate(log.timestamp) || '',
          log.details || '',
          log.resource || '',
          log.path || ''
        ];
        
        const dataRow = sheet.addRow(rowData);
        
        // Apply alternating row styling
        if (index % 2 === 1) {
          dataRow.eachCell((cell) => {
            cell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'F2F2F2' } // Light gray
            };
          });
        }
        
        currentRow++;
      });
      
      console.log(`Added ${filteredLogs.length} data rows, ending at row ${currentRow - 1}`);
      
      // Set column widths for better readability
      sheet.getColumn(1).width = 20;
      sheet.getColumn(2).width = 30;
      sheet.getColumn(3).width = 50;
      sheet.getColumn(4).width = 20;
      sheet.getColumn(5).width = 40;
      
      // Add auto filter to the activity log header row
      const headerRowNum = currentRow - filteredLogs.length - 1;
      sheet.autoFilter = {
        from: { row: headerRowNum, column: 1 },
        to: { row: headerRowNum, column: 5 }
      };
      
      // Create filename
      const userName = sessionData?.userId?.name ? 
        sessionData.userId.name.replace(/\s+/g, '_').toLowerCase() : 'user';
      const timestamp = new Date().toISOString().split('T')[0];
      const fileName = `activity_log_${userName}_${timestamp}.xlsx`;
      
      console.log('Writing Excel file...');
      
      // Write to buffer and trigger download
      const buffer = await workbook.xlsx.writeBuffer();
      saveAs(new Blob([buffer]), fileName);
      
      console.log('Excel export completed successfully!');
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      alert('Failed to export data: ' + error.message);
    } finally {
      setExportLoading(false);
    }
  };

  // Get current page items
  const getCurrentPageItems = () => {
    const startIndex = (page - 1) * itemsPerPage;
    return filteredLogs.slice(startIndex, startIndex + itemsPerPage);
  };

  // Get action icon based on action type
  const getActionIcon = (action) => {
    switch (action) {
      case 'Login':
        return <FaGlobe className="text-green-500" />;
      case 'Logout':
        return <FaGlobe className="text-red-500" />;
      case 'API Call':
        return <FaServer className="text-blue-500" />;
      case 'Error':
        return <FaExclamationTriangle className="text-yellow-500" />;
      case 'Page View':
        return <FaEye className="text-blue-400" />;
      default:
        return <FaEye className="text-gray-500" />;
    }
  };

  // Get action class based on action type
  const getActionClass = (action) => {
    if (!action) return 'text-gray-500';
    
    switch (action) {
      case 'Login':
        return 'text-green-500 font-medium';
      case 'Logout':
        return 'text-red-500 font-medium';
      case 'API Call':
        return 'text-purple-500';
      case 'Error':
        return 'text-red-500 font-medium';
      case 'Page View':
        return 'text-blue-500';
      default:
        // Handle partial matches for fallback
        if (action.toLowerCase().includes('page')) {
          return 'text-blue-500';
        } else if (action.toLowerCase().includes('api')) {
          return 'text-purple-500';
        } else if (action.toLowerCase().includes('error')) {
          return 'text-red-500';
        } else if (action.toLowerCase().includes('login')) {
          return 'text-green-500';
        }
        return 'text-gray-500';
    }
  };

  // Get search suggestions
  const getSearchSuggestions = () => {
    if (!searchTerm || searchTerm.length < 2) return [];
    
    const term = searchTerm.toLowerCase();
    const suggestions = [];
    const maxSuggestions = 5;
    
    // Get action suggestions
    const actionMatches = getUniqueActions()
      .filter(action => action.toLowerCase().includes(term))
      .slice(0, 3)
      .map(action => ({ type: 'action', value: action }));
    
    suggestions.push(...actionMatches);
    
    // Get resource suggestions
    const resourceMatches = getUniqueResources()
      .filter(resource => resource && resource.toLowerCase().includes(term))
      .slice(0, 3)
      .map(resource => ({ type: 'resource', value: resource }));
    
    suggestions.push(...resourceMatches);
    
    // Get path suggestions from activity log
    const paths = new Set();
    activityLog.forEach(log => {
      if (log.path && log.path.toLowerCase().includes(term)) {
        paths.add(log.path);
      }
    });
    
    const pathMatches = Array.from(paths)
      .slice(0, 3)
      .map(path => ({ type: 'path', value: path }));
    
    suggestions.push(...pathMatches);
    
    // Return limited number of suggestions
    return suggestions.slice(0, maxSuggestions);
  };

  // Handle search suggestion click
  const handleSearchSuggestion = (suggestion) => {
    if (suggestion.type === 'action') {
      setFilters({...filters, action: suggestion.value});
      setSearchTerm('');
    } else if (suggestion.type === 'resource') {
      setFilters({...filters, resource: suggestion.value});
      setSearchTerm('');
    } else {
      setSearchTerm(suggestion.value);
    }
    
    // Close filters if they're open
    setShowFilters(true);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 mt-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300">Activity Log</h3>
        <div className="flex space-x-2">
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className="p-2 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            title="Toggle filters"
          >
            <FaFilter className="text-gray-600 dark:text-gray-400" />
          </button>
          <button 
            onClick={onRefresh}
            className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-md hover:bg-blue-200 dark:hover:bg-blue-800/30 transition-colors"
            title="Refresh activity log"
            disabled={isLoading}
          >
            {isLoading ? (
              <FaSpinner className="text-blue-600 dark:text-blue-400 animate-spin" />
            ) : (
              <FaSync className="text-blue-600 dark:text-blue-400" />
            )}
          </button>
          <button 
            onClick={exportToExcel}
            className="p-2 bg-green-100 dark:bg-green-900/30 rounded-md hover:bg-green-200 dark:hover:bg-green-800/30 transition-colors"
            title="Export as Excel file"
            disabled={filteredLogs.length === 0 || exportLoading}
          >
            {exportLoading ? (
              <FaSpinner className="text-green-600 dark:text-green-400 animate-spin" />
            ) : (
              <FaDownload className="text-green-600 dark:text-green-400" />
            )}
          </button>
          <button 
            onClick={resetFilters}
            className="p-2 bg-red-100 dark:bg-red-900/30 rounded-md hover:bg-red-200 dark:hover:bg-red-800/30 transition-colors"
            title="Reset filters"
          >
            <FaTrash className="text-red-600 dark:text-red-400" />
          </button>
        </div>
      </div>
      
      {/* Search bar - Enhanced with autocomplete suggestions */}
      <div className="relative mb-4">
        <div className="flex">
          <div className="relative flex-grow">
            <input
              type="text"
              placeholder="Search activity log (supports multiple keywords)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full p-2 pl-10 pr-10 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
            <FaSearch className="absolute left-3 top-3 text-gray-400" />
            
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <FaTrash size={14} />
              </button>
            )}
          </div>
          
          <div className="ml-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`p-2 rounded-md transition-colors ${
                showFilters 
                  ? 'bg-blue-500 text-white hover:bg-blue-600' 
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
              title={showFilters ? "Hide advanced filters" : "Show advanced filters"}
            >
              <FaFilter />
            </button>
          </div>
        </div>
        
        {searchTerm && getSearchSuggestions().length > 0 && (
          <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 shadow-lg rounded-md border dark:border-gray-700 max-h-48 overflow-y-auto">
            {getSearchSuggestions().map((suggestion, index) => (
              <div 
                key={index}
                className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer flex items-center"
                onClick={() => handleSearchSuggestion(suggestion)}
              >
                <span className="mr-2">
                  {suggestion.type === 'action' ? <FaServer className="text-purple-500" /> : 
                   suggestion.type === 'path' ? <FaGlobe className="text-blue-500" /> : 
                   suggestion.type === 'resource' ? <FaExclamationTriangle className="text-yellow-500" /> :
                   <FaCalendarAlt className="text-gray-500" />}
                </span>
                <span>{suggestion.value}</span>
                <span className="ml-2 text-xs text-gray-500">({suggestion.type})</span>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Filters */}
      {showFilters && (
        <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-md">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Action Type
              </label>
              <select
                value={filters.action}
                onChange={(e) => setFilters({...filters, action: e.target.value})}
                className="w-full p-2 border rounded-md dark:bg-gray-800 dark:border-gray-600 dark:text-white"
              >
                <option value="">All Actions</option>
                {getUniqueActions().map(action => (
                  <option key={action} value={action}>{action}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Resource Type
              </label>
              <select
                value={filters.resource}
                onChange={(e) => setFilters({...filters, resource: e.target.value})}
                className="w-full p-2 border rounded-md dark:bg-gray-800 dark:border-gray-600 dark:text-white"
              >
                <option value="">All Resources</option>
                {getUniqueResources().map(resource => (
                  <option key={resource} value={resource}>{resource}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                From Date
              </label>
              <input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => setFilters({...filters, dateFrom: e.target.value})}
                className="w-full p-2 border rounded-md dark:bg-gray-800 dark:border-gray-600 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                To Date
              </label>
              <input
                type="date"
                value={filters.dateTo}
                onChange={(e) => setFilters({...filters, dateTo: e.target.value})}
                className="w-full p-2 border rounded-md dark:bg-gray-800 dark:border-gray-600 dark:text-white"
              />
            </div>
          </div>
        </div>
      )}
      
      {/* Activity log table */}
      {isLoading ? (
        <div className="flex justify-center items-center py-8">
          <FaSpinner className="animate-spin text-blue-500 mr-2" />
          <span>Loading activity data...</span>
        </div>
      ) : error ? (
        <div className="bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 p-4 rounded-md text-center">
          {error}
        </div>
      ) : filteredLogs.length === 0 ? (
        <div className="bg-gray-100 dark:bg-gray-700 p-6 rounded-lg text-center">
          <p className="text-gray-600 dark:text-gray-400">No activity logs found.</p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white dark:bg-gray-800 rounded-lg overflow-hidden">
              <thead className="bg-gray-100 dark:bg-gray-700">
                <tr>
                  <th 
                    className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort('action')}
                  >
                    <div className="flex items-center">
                      Action
                      {sortConfig.key === 'action' && (
                        sortConfig.direction === 'asc' ? 
                          <FaSortAmountUp className="ml-1" /> : 
                          <FaSortAmountDown className="ml-1" />
                      )}
                    </div>
                  </th>
                  <th 
                    className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort('timestamp')}
                  >
                    <div className="flex items-center">
                      Timestamp
                      {sortConfig.key === 'timestamp' && (
                        sortConfig.direction === 'asc' ? 
                          <FaSortAmountUp className="ml-1" /> : 
                          <FaSortAmountDown className="ml-1" />
                      )}
                    </div>
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Details
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {getCurrentPageItems().map((log, index) => (
                  <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-4 py-3">
                      <div className="flex items-center">
                        {getActionIcon(log.action)}
                        <span className={`ml-2 ${getActionClass(log.action)}`}>
                          {log.action || 'Unknown'}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div className="flex items-center">
                        <FaCalendarAlt className="text-gray-400 mr-2" />
                        {formatDate(log.timestamp)}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="text-sm">{log.details || 'No details'}</p>
                        {log.path && (
                          <p className="text-xs text-blue-500 dark:text-blue-400 mt-1">{log.path}</p>
                        )}
                        {log.resource && (
                          <span className="inline-block px-2 py-0.5 text-xs bg-gray-100 dark:bg-gray-700 rounded-full mt-1">
                            {log.resource}
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          <div className="flex justify-between items-center mt-4">
            <div className="flex items-center">
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Showing {Math.min(filteredLogs.length, (page - 1) * itemsPerPage + 1)} to {Math.min(filteredLogs.length, page * itemsPerPage)} of {filteredLogs.length} entries
              </span>
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setPage(1); // Reset to first page when changing items per page
                }}
                className="ml-2 p-1 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
            </div>
            <div className="flex">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1 border rounded-l-md bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => setPage(p => p + 1)}
                disabled={page * itemsPerPage >= filteredLogs.length}
                className="px-3 py-1 border-t border-b border-r rounded-r-md bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ActivityLogSection;
