import React, { useState, useEffect } from 'react';
import {
  FaBoxes, FaWarehouse, FaExclamationTriangle, FaCalendarAlt,
  FaArrowDown, FaArrowUp, FaFilter, FaDownload, FaTruckLoading
} from 'react-icons/fa';
import axios from 'axios';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';
import { format } from 'date-fns';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

// Register ChartJS components
ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

const RawMaterialDashboard = () => {
  const [materialData, setMaterialData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState({
    category: '',
    status: ''
  });

  const categories = [
    { value: '', label: 'All Categories' },
    { value: 'Fabric', label: 'Fabric' },
    { value: 'Thread', label: 'Thread' },
    { value: 'Buttons', label: 'Buttons' },
    { value: 'Zippers', label: 'Zippers' },
    { value: 'Dyes', label: 'Dyes' },
    { value: 'Packaging', label: 'Packaging' }
  ];

  const statuses = [
    { value: '', label: 'All Statuses' },
    { value: 'In Stock', label: 'In Stock' },
    { value: 'Low Stock', label: 'Low Stock' },
    { value: 'Out of Stock', label: 'Out of Stock' },
    { value: 'On Order', label: 'On Order' }
  ];

  useEffect(() => {
    fetchMaterialData();
  }, [filter]);

  const fetchMaterialData = async () => {
    setLoading(true);
    try {
      let url = '/api/raw-materials';
      if (filter.category || filter.status) {
        url += '?';
        if (filter.category) url += `category=${encodeURIComponent(filter.category)}&`;
        if (filter.status) url += `status=${encodeURIComponent(filter.status)}`;
      }
      
      const response = await axios.get(url);
      processMaterialData(response.data);
    } catch (error) {
      console.error("Error fetching raw material data:", error);
      setError("Error loading raw material data");
      // Generate mock data if API fails
      generateMockData();
    } finally {
      setLoading(false);
    }
  };

  const processMaterialData = (materials) => {
    if (!materials || !Array.isArray(materials)) {
      setError("Invalid material data received");
      generateMockData();
      return;
    }

    // Calculate various metrics
    const totalMaterials = materials.length;
    const totalValue = materials.reduce((sum, mat) => sum + (mat.stock * mat.unitPrice), 0);
    
    // Category distribution
    const categoryCounts = {};
    categories.forEach(cat => {
      if (cat.value) categoryCounts[cat.value] = 0;
    });
    
    materials.forEach(mat => {
      if (mat.category) {
        // Check if the category exists in our predefined categories
        const matchingCategory = categories.find(cat => 
          cat.value && mat.category.includes(cat.value)
        );
        
        if (matchingCategory) {
          categoryCounts[matchingCategory.value] = (categoryCounts[matchingCategory.value] || 0) + 1;
        } else if (categoryCounts[mat.category] !== undefined) {
          categoryCounts[mat.category] = (categoryCounts[mat.category] || 0) + 1;
        } else {
          // If it's a new category not in our predefined list
          categoryCounts[mat.category] = 1;
        }
      }
    });

    // Stock status
    const stockStatus = {
      'In Stock': 0,
      'Low Stock': 0,
      'Out of Stock': 0,
      'On Order': 0
    };
    
    materials.forEach(mat => {
      if (mat.stock === 0) {
        stockStatus['Out of Stock']++;
      } else if (mat.stock <= mat.reorderLevel) {
        stockStatus['Low Stock']++;
      } else {
        stockStatus['In Stock']++;
      }
      
      // Check if there's any pending order
      if (mat.pendingOrder && mat.pendingOrder > 0) {
        stockStatus['On Order']++;
      }
    });

    // Category value distribution
    const categoryValues = {};
    categories.forEach(cat => {
      if (cat.value) categoryValues[cat.value] = 0;
    });
    
    materials.forEach(mat => {
      if (mat.category) {
        // Check if the category exists in our predefined categories
        const matchingCategory = categories.find(cat => 
          cat.value && mat.category.includes(cat.value)
        );
        
        if (matchingCategory) {
          categoryValues[matchingCategory.value] = (categoryValues[matchingCategory.value] || 0) + (mat.stock * mat.unitPrice);
        } else if (categoryValues[mat.category] !== undefined) {
          categoryValues[mat.category] = (categoryValues[mat.category] || 0) + (mat.stock * mat.unitPrice);
        } else {
          // If it's a new category not in our predefined list
          categoryValues[mat.category] = (mat.stock * mat.unitPrice);
        }
      }
    });

    // Low stock items
    const lowStockItems = materials
      .filter(mat => mat.stock <= mat.reorderLevel && mat.stock > 0)
      .sort((a, b) => (a.stock / a.reorderLevel) - (b.stock / b.reorderLevel))
      .slice(0, 5)
      .map(mat => ({
        id: mat._id,
        name: mat.name,
        category: mat.category,
        quantity: mat.stock,
        reorderLevel: mat.reorderLevel,
        unitPrice: mat.unitPrice
      }));

    // Recent transactions - using lastRestocked as a proxy for last transaction
    const recentTransactions = materials
      .filter(mat => mat.lastRestocked)
      .sort((a, b) => new Date(b.lastRestocked) - new Date(a.lastRestocked))
      .slice(0, 5)
      .map(mat => ({
        id: mat._id,
        name: mat.name,
        date: mat.lastRestocked,
        type: 'Restocked',  // Assuming restocking as the transaction type
        quantity: mat.stock,
        value: mat.stock * mat.unitPrice
      }));

    // Set the processed data
    setMaterialData({
      totalMaterials,
      totalValue,
      categoryCounts,
      stockStatus,
      categoryValues,
      lowStockItems,
      recentTransactions
    });
  };

  const generateMockData = () => {
    // Generate mock data for demonstration
    setMaterialData({
      totalMaterials: 85,
      totalValue: 450000,
      categoryCounts: {
        'Fabric': 22,
        'Thread': 15,
        'Buttons': 12,
        'Zippers': 8,
        'Dyes': 14,
        'Packaging': 14
      },
      stockStatus: {
        'In Stock': 55,
        'Low Stock': 18,
        'Out of Stock': 7,
        'On Order': 10
      },
      categoryValues: {
        'Fabric': 180000,
        'Thread': 75000,
        'Buttons': 45000,
        'Zippers': 30000,
        'Dyes': 95000,
        'Packaging': 25000
      },
      lowStockItems: [
        { id: 'RM001', name: 'Cotton Fabric', category: 'Fabric', quantity: 50, reorderLevel: 100, unitPrice: 250 },
        { id: 'RM015', name: 'Blue Dye', category: 'Dyes', quantity: 10, reorderLevel: 30, unitPrice: 150 },
        { id: 'RM022', name: 'Metal Buttons', category: 'Buttons', quantity: 200, reorderLevel: 500, unitPrice: 5 },
        { id: 'RM034', name: 'Nylon Thread', category: 'Thread', quantity: 20, reorderLevel: 40, unitPrice: 120 },
        { id: 'RM045', name: 'Plastic Zippers', category: 'Zippers', quantity: 150, reorderLevel: 300, unitPrice: 15 }
      ],
      recentTransactions: [
        { id: 'RM001', name: 'Cotton Fabric', date: '2025-04-28', type: 'Received', quantity: 200, value: 50000 },
        { id: 'RM015', name: 'Blue Dye', date: '2025-04-27', type: 'Used', quantity: 15, value: 2250 },
        { id: 'RM022', name: 'Metal Buttons', date: '2025-04-25', type: 'Received', quantity: 1000, value: 5000 },
        { id: 'RM034', name: 'Nylon Thread', date: '2025-04-22', type: 'Used', quantity: 25, value: 3000 },
        { id: 'RM045', name: 'Plastic Zippers', date: '2025-04-20', type: 'Ordered', quantity: 500, value: 7500 }
      ]
    });
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilter(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const exportToExcel = async () => {
    try {
      if (!materialData) {
        console.error('No data available to export');
        return;
      }

      // Create a new workbook and worksheet
      const workbook = new ExcelJS.Workbook();
      workbook.creator = 'Textlaire';
      workbook.lastModifiedBy = 'Textlaire';
      workbook.created = new Date();
      workbook.modified = new Date();
      
      // Format date for filename
      const dateStr = format(new Date(), 'yyyy-MM-dd');

      // Create Summary worksheet
      const summarySheet = workbook.addWorksheet('Summary', {
        properties: { tabColor: { argb: '4167B8' } }
      });

      // Add title
      const headerRow = summarySheet.addRow(['TEXTLAIRE - RAW MATERIALS DASHBOARD']);
      summarySheet.mergeCells('A1:H1');
      const titleCell = summarySheet.getCell('A1');
      titleCell.font = {
        name: 'Arial',
        size: 16,
        bold: true,
        color: { argb: '1A56DB' }
      };
      titleCell.alignment = { horizontal: 'center' };
      headerRow.height = 30;

      // Add date
      const dateRow = summarySheet.addRow(['']);
      summarySheet.mergeCells('A2:H2');
      const dateCell = summarySheet.getCell('A2');
      dateCell.value = `Generated on: ${format(new Date(), 'PPpp')}`;
      dateCell.font = {
        name: 'Arial',
        size: 10,
        italic: true,
        color: { argb: '6B7280' }
      };
      dateCell.alignment = { horizontal: 'center' };
      
      // Add empty row
      summarySheet.addRow([]);

      // Add summary metrics
      summarySheet.addRow(['INVENTORY OVERVIEW']);
      summarySheet.mergeCells('A4:B4');
      summarySheet.getCell('A4').font = { bold: true, size: 12 };
      
      summarySheet.addRow(['Total Materials:', materialData.totalMaterials]);
      summarySheet.addRow(['Total Inventory Value:', materialData.totalValue]);
      summarySheet.getCell('B6').numFmt = '₹#,##0.00';
      
      // Add empty row
      summarySheet.addRow([]);

      // Add stock status breakdown
      summarySheet.addRow(['STOCK STATUS BREAKDOWN']);
      summarySheet.mergeCells('A8:B8');
      summarySheet.getCell('A8').font = { bold: true, size: 12 };
      
      summarySheet.addRow(['Status', 'Count']);
      summarySheet.getCell('A9').font = { bold: true };
      summarySheet.getCell('B9').font = { bold: true };
      
      Object.entries(materialData.stockStatus).forEach(([status, count]) => {
        summarySheet.addRow([status, count]);
      });

      // Add empty row
      summarySheet.addRow([]);

      // Add category distribution
      summarySheet.addRow(['CATEGORY DISTRIBUTION']);
      summarySheet.mergeCells('A14:B14');
      summarySheet.getCell('A14').font = { bold: true, size: 12 };
      
      summarySheet.addRow(['Category', 'Count']);
      summarySheet.getCell('A15').font = { bold: true };
      summarySheet.getCell('B15').font = { bold: true };
      
      Object.entries(materialData.categoryCounts).forEach(([category, count]) => {
        if (category) {
          summarySheet.addRow([category, count]);
        }
      });

      // Set column widths
      summarySheet.getColumn(1).width = 25;
      summarySheet.getColumn(2).width = 15;

      // Create Category Distribution worksheet
      const categorySheet = workbook.addWorksheet('Category Distribution', {
        properties: { tabColor: { argb: '6B7280' } }
      });
      
      // Add title
      const catHeaderRow = categorySheet.addRow(['CATEGORY DISTRIBUTION']);
      categorySheet.mergeCells('A1:C1');
      categorySheet.getCell('A1').font = {
        name: 'Arial',
        size: 14,
        bold: true,
        color: { argb: '1A56DB' }
      };
      categorySheet.getCell('A1').alignment = { horizontal: 'center' };
      catHeaderRow.height = 25;
      
      // Add empty row
      categorySheet.addRow([]);
      
      // Add headers
      const catTableHeader = categorySheet.addRow(['Category', 'Count', 'Percentage']);
      catTableHeader.eachCell((cell) => {
        cell.font = { bold: true };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'E5E7EB' }
        };
      });
      
      // Calculate total for percentage
      const totalItems = Object.values(materialData.categoryCounts).reduce((sum, count) => sum + count, 0);
      
      // Add data rows
      Object.entries(materialData.categoryCounts).forEach(([category, count]) => {
        if (category) {
          const percentage = totalItems > 0 ? (count / totalItems) : 0;
          const row = categorySheet.addRow([category, count, percentage]);
          row.getCell(3).numFmt = '0.00%';
        }
      });
      
      // Set column widths
      categorySheet.getColumn(1).width = 20;
      categorySheet.getColumn(2).width = 15;
      categorySheet.getColumn(3).width = 15;

      // Create Category Values worksheet
      const valueSheet = workbook.addWorksheet('Category Values', {
        properties: { tabColor: { argb: '4F46E5' } }
      });
      
      // Add title
      const valueHeaderRow = valueSheet.addRow(['CATEGORY VALUE DISTRIBUTION']);
      valueSheet.mergeCells('A1:C1');
      valueSheet.getCell('A1').font = {
        name: 'Arial',
        size: 14,
        bold: true,
        color: { argb: '1A56DB' }
      };
      valueSheet.getCell('A1').alignment = { horizontal: 'center' };
      valueHeaderRow.height = 25;
      
      // Add empty row
      valueSheet.addRow([]);
      
      // Add headers
      const valueTableHeader = valueSheet.addRow(['Category', 'Total Value', 'Percentage']);
      valueTableHeader.eachCell((cell) => {
        cell.font = { bold: true };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'E5E7EB' }
        };
      });
      
      // Calculate total for percentage
      const totalValue = Object.values(materialData.categoryValues).reduce((sum, value) => sum + value, 0);
      
      // Add data rows
      Object.entries(materialData.categoryValues).forEach(([category, value]) => {
        if (category) {
          const percentage = totalValue > 0 ? (value / totalValue) : 0;
          const row = valueSheet.addRow([category, value, percentage]);
          row.getCell(2).numFmt = '₹#,##0.00';
          row.getCell(3).numFmt = '0.00%';
        }
      });
      
      // Set column widths
      valueSheet.getColumn(1).width = 20;
      valueSheet.getColumn(2).width = 20;
      valueSheet.getColumn(3).width = 15;

      // Create Low Stock Items worksheet
      const lowStockSheet = workbook.addWorksheet('Low Stock Items', {
        properties: { tabColor: { argb: 'EF4444' } }
      });
      
      // Add title
      const lowStockHeaderRow = lowStockSheet.addRow(['LOW STOCK ITEMS']);
      lowStockSheet.mergeCells('A1:F1');
      lowStockSheet.getCell('A1').font = {
        name: 'Arial',
        size: 14,
        bold: true,
        color: { argb: 'B91C1C' }
      };
      lowStockSheet.getCell('A1').alignment = { horizontal: 'center' };
      lowStockHeaderRow.height = 25;
      
      // Add empty row
      lowStockSheet.addRow([]);
      
      // Add headers
      const lowStockTableHeader = lowStockSheet.addRow([
        'ID', 'Name', 'Category', 'Current Stock', 'Reorder Level', 'Unit Price'
      ]);
      lowStockTableHeader.eachCell((cell) => {
        cell.font = { bold: true };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FEE2E2' }
        };
      });
      
      // Add data rows
      materialData.lowStockItems.forEach(item => {
        const row = lowStockSheet.addRow([
          item.id,
          item.name,
          item.category,
          item.quantity,
          item.reorderLevel,
          item.unitPrice
        ]);
        row.getCell(6).numFmt = '₹#,##0.00';
        
        // Highlight critical items
        if (item.quantity < item.reorderLevel * 0.5) {
          row.eachCell((cell) => {
            cell.font = { color: { argb: 'B91C1C' } };
          });
        }
      });
      
      // Set column widths
      lowStockSheet.getColumn(1).width = 10;
      lowStockSheet.getColumn(2).width = 25;
      lowStockSheet.getColumn(3).width = 15;
      lowStockSheet.getColumn(4).width = 15;
      lowStockSheet.getColumn(5).width = 15;
      lowStockSheet.getColumn(6).width = 15;

      // Create Recent Transactions worksheet
      const transactionSheet = workbook.addWorksheet('Recent Transactions', {
        properties: { tabColor: { argb: '10B981' } }
      });
      
      // Add title
      const transactionHeaderRow = transactionSheet.addRow(['RECENT TRANSACTIONS']);
      transactionSheet.mergeCells('A1:F1');
      transactionSheet.getCell('A1').font = {
        name: 'Arial',
        size: 14,
        bold: true,
        color: { argb: '047857' }
      };
      transactionSheet.getCell('A1').alignment = { horizontal: 'center' };
      transactionHeaderRow.height = 25;
      
      // Add empty row
      transactionSheet.addRow([]);
      
      // Add headers
      const transactionTableHeader = transactionSheet.addRow([
        'ID', 'Material', 'Date', 'Type', 'Quantity', 'Value'
      ]);
      transactionTableHeader.eachCell((cell) => {
        cell.font = { bold: true };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'ECFDF5' }
        };
      });
      
      // Add data rows
      materialData.recentTransactions.forEach(transaction => {
        const row = transactionSheet.addRow([
          transaction.id,
          transaction.name,
          new Date(transaction.date),
          transaction.type,
          transaction.quantity,
          transaction.value
        ]);
        row.getCell(3).numFmt = 'yyyy-mm-dd';
        row.getCell(6).numFmt = '₹#,##0.00';
      });
      
      // Set column widths
      transactionSheet.getColumn(1).width = 10;
      transactionSheet.getColumn(2).width = 25;
      transactionSheet.getColumn(3).width = 15;
      transactionSheet.getColumn(4).width = 15;
      transactionSheet.getColumn(5).width = 15;
      transactionSheet.getColumn(6).width = 15;

      // Generate Excel file
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      saveAs(blob, `Raw_Materials_Dashboard_${dateStr}.xlsx`);
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      alert('Failed to export data. Please try again.');
    }
  };

  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Filter Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
        <div className="flex items-center space-x-2">
          <FaFilter className="text-gray-500" />
          <select
            name="category"
            value={filter.category}
            onChange={handleFilterChange}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            {categories.map(cat => (
              <option key={cat.value} value={cat.value}>{cat.label}</option>
            ))}
          </select>
          <select
            name="status"
            value={filter.status}
            onChange={handleFilterChange}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            {statuses.map(status => (
              <option key={status.value} value={status.value}>{status.label}</option>
            ))}
          </select>
        </div>
        <button
          onClick={exportToExcel}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
        >
          <FaDownload /> Export to Excel
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border-l-4 border-blue-500">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Materials</p>
              <p className="text-xl font-bold text-gray-800 dark:text-white">{materialData ? materialData.totalMaterials : 0}</p>
            </div>
            <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-full">
              <FaBoxes className="text-blue-500 dark:text-blue-400 text-xl" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border-l-4 border-green-500">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Inventory Value</p>
              <p className="text-xl font-bold text-gray-800 dark:text-white">
                {materialData ? formatCurrency(materialData.totalValue) : 'N/A'}
              </p>
            </div>
            <div className="p-3 bg-green-100 dark:bg-green-900 rounded-full">
              <FaWarehouse className="text-green-500 dark:text-green-400 text-xl" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border-l-4 border-yellow-500">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Low Stock Items</p>
              <p className="text-xl font-bold text-gray-800 dark:text-white">
                {materialData ? materialData.stockStatus['Low Stock'] : 0}
              </p>
            </div>
            <div className="p-3 bg-yellow-100 dark:bg-yellow-900 rounded-full">
              <FaExclamationTriangle className="text-yellow-500 dark:text-yellow-400 text-xl" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border-l-4 border-purple-500">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Categories</p>
              <p className="text-xl font-bold text-gray-800 dark:text-white">
                {materialData ? Object.keys(materialData.categoryCounts).filter(k => materialData.categoryCounts[k] > 0).length : 0}
              </p>
            </div>
            <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-full">
              <FaTruckLoading className="text-purple-500 dark:text-purple-400 text-xl" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Material Distribution by Category</h3>
          <div className="h-64">
            {materialData ? (
              <Doughnut 
                data={{
                  labels: Object.keys(materialData.categoryCounts),
                  datasets: [{
                    data: Object.values(materialData.categoryCounts),
                    backgroundColor: [
                      '#3B82F6', // blue
                      '#10B981', // green
                      '#F59E0B', // amber
                      '#EC4899', // pink
                      '#8B5CF6', // violet
                      '#6366F1', // indigo
                      '#EF4444'  // red
                    ],
                    borderWidth: 1
                  }]
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'bottom',
                      labels: {
                        color: document.documentElement.classList.contains('dark') ? 'white' : 'black'
                      }
                    }
                  }
                }}
              />
            ) : <p>No data available</p>}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Inventory Value by Category</h3>
          <div className="h-64">
            {materialData ? (
              <Bar 
                data={{
                  labels: Object.keys(materialData.categoryValues),
                  datasets: [{
                    label: 'Inventory Value',
                    data: Object.values(materialData.categoryValues),
                    backgroundColor: 'rgba(59, 130, 246, 0.7)',
                    borderColor: 'rgba(59, 130, 246, 1)',
                    borderWidth: 1
                  }]
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      display: false
                    }
                  },
                  scales: {
                    y: {
                      ticks: {
                        callback: function(value) {
                          return formatCurrency(value);
                        },
                        color: document.documentElement.classList.contains('dark') ? 'white' : 'black'
                      },
                      grid: {
                        color: document.documentElement.classList.contains('dark') ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
                      }
                    },
                    x: {
                      ticks: {
                        color: document.documentElement.classList.contains('dark') ? 'white' : 'black'
                      },
                      grid: {
                        color: document.documentElement.classList.contains('dark') ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
                      }
                    }
                  }
                }}
              />
            ) : <p>No data available</p>}
          </div>
        </div>
      </div>

      {/* Stock Status and Low Stock */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Stock Status</h3>
          <div className="h-64">
            {materialData ? (
              <Doughnut 
                data={{
                  labels: Object.keys(materialData.stockStatus),
                  datasets: [{
                    data: Object.values(materialData.stockStatus),
                    backgroundColor: [
                      '#10B981', // green (In Stock)
                      '#F59E0B', // amber (Low Stock)
                      '#EF4444', // red (Out of Stock)
                      '#8B5CF6'  // purple (On Order)
                    ],
                    borderWidth: 1
                  }]
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'bottom',
                      labels: {
                        color: document.documentElement.classList.contains('dark') ? 'white' : 'black'
                      }
                    }
                  }
                }}
              />
            ) : <p>No data available</p>}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Low Stock Items</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead>
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Item ID</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Name</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Category</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Quantity</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Reorder Level</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {materialData && materialData.lowStockItems && materialData.lowStockItems.length > 0 ? (
                  materialData.lowStockItems.map((item, index) => (
                    <tr key={index}>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{item.id}</td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{item.name}</td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-800 dark:text-gray-200">{item.category}</td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-800 dark:text-gray-200 flex items-center">
                        <span className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300 px-2 py-1 rounded text-xs">
                          {item.quantity}
                        </span>
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{item.reorderLevel}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="px-4 py-2 text-center text-sm text-gray-500 dark:text-gray-400">No low stock items</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Recent Transactions</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead>
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Item</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Type</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Quantity</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Value</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {materialData && materialData.recentTransactions && materialData.recentTransactions.length > 0 ? (
                materialData.recentTransactions.map((transaction, index) => (
                  <tr key={index}>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {format(new Date(transaction.date), 'dd MMM yyyy')}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{transaction.name}</td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                        ${transaction.type === 'Received' 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' 
                          : transaction.type === 'Used' 
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
                            : 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300'}`
                      }>
                        {transaction.type === 'Received' ? <FaArrowDown className="mr-1" size={8} /> : 
                         transaction.type === 'Used' ? <FaArrowUp className="mr-1" size={8} /> : 
                         <FaCalendarAlt className="mr-1" size={8} />}
                        {transaction.type}
                      </span>
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-800 dark:text-gray-200">{transaction.quantity}</td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-800 dark:text-gray-200">
                      {formatCurrency(transaction.value)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="px-4 py-2 text-center text-sm text-gray-500 dark:text-gray-400">No recent transactions</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default RawMaterialDashboard;
