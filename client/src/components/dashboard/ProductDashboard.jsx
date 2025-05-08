import React, { useState, useEffect, useMemo } from 'react';
import {
  FaTshirt, FaPalette, FaRulerCombined, FaTags, FaBoxOpen,
  FaFilter, FaDownload, FaCalendarAlt, FaWeightHanging, FaStar
} from 'react-icons/fa';
import axios from 'axios';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';
import { format, parseISO } from 'date-fns';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

// Register ChartJS components
ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

const ProductDashboard = () => {
  const [productData, setProductData] = useState(null);
  const [allProducts, setAllProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState({
    type: '',
    material: '',
    quality: ''
  });
  
  // Dynamically generate filters from actual data
  const { typeOptions, materialOptions, qualityOptions } = useMemo(() => {
    // Default empty options
    const defaults = {
      typeOptions: [{ value: '', label: 'All Types' }],
      materialOptions: [{ value: '', label: 'All Materials' }],
      qualityOptions: [{ value: '', label: 'All Qualities' }]
    };
    
    if (!allProducts || !allProducts.length) return defaults;
    
    // Extract unique types
    const types = [...new Set(allProducts
      .map(p => p.type)
      .filter(Boolean)
    )];
    
    // Extract unique materials
    const materials = [...new Set(allProducts
      .map(p => p.material)
      .filter(Boolean)
    )];
    
    // Extract unique quality grades
    const qualities = [...new Set(allProducts
      .map(p => p.qualityGrade)
      .filter(Boolean)
    )];
    
    return {
      typeOptions: [
        { value: '', label: 'All Types' },
        ...types.map(type => ({ value: type, label: type }))
      ],
      materialOptions: [
        { value: '', label: 'All Materials' },
        ...materials.map(material => ({ value: material, label: material }))
      ],
      qualityOptions: [
        { value: '', label: 'All Qualities' },
        ...qualities.map(quality => ({ value: quality, label: quality }))
      ]
    };
  }, [allProducts]);

  useEffect(() => {
    fetchProductData();
  }, []);

  const fetchProductData = async () => {
    setLoading(true);
    try {
      // Use the same API endpoint as ProductsPage
      const url = '/api/products/patterns';
      
      // Fetch all products
      const response = await axios.get(url);
      setAllProducts(response.data);
      
      // Apply filters when filter state changes
      applyFilters(response.data);
    } catch (error) {
      console.error("Error fetching product data:", error);
      setError("Error loading product data");
      // Generate mock data if API fails
      generateMockData();
    } finally {
      setLoading(false);
    }
  };
  
  // Apply filters on filter change or when allProducts changes
  useEffect(() => {
    if (allProducts.length > 0) {
      applyFilters(allProducts);
    }
  }, [filter, allProducts]);
  
  const applyFilters = (products) => {
    if (!products || !Array.isArray(products)) return;
    
    let filteredData = [...products];
    
    // Filter by product type
    if (filter.type) {
      filteredData = filteredData.filter(product => 
        product.type && product.type.toLowerCase() === filter.type.toLowerCase()
      );
    }
    
    // Filter by material
    if (filter.material) {
      filteredData = filteredData.filter(product => 
        product.material && product.material.toLowerCase() === filter.material.toLowerCase()
      );
    }
    
    // Filter by quality grade
    if (filter.quality) {
      filteredData = filteredData.filter(product => 
        product.qualityGrade && product.qualityGrade.toLowerCase() === filter.quality.toLowerCase()
      );
    }
    
    processProductData(filteredData);
  };

  const processProductData = (products) => {
    if (!products || !Array.isArray(products)) {
      setError("Invalid product data received");
      generateMockData();
      return;
    }

    // Calculate various metrics
    const totalProducts = products.length;
    
    // Extract numeric price values from product prices
    const getNumericPrice = (price) => {
      if (!price) return 0;
      // Remove currency symbols and convert to number
      return parseFloat(price.toString().replace(/[^0-9.]/g, '')) || 0;
    };
    
    // Calculate total value of all products
    const totalValue = products.reduce((sum, prod) => {
      const price = getNumericPrice(prod.price);
      return sum + price;
    }, 0);
    
    // Count unique product attributes
    const uniqueTypes = [...new Set(products.map(p => p.type).filter(Boolean))].length;
    const uniqueMaterials = [...new Set(products.map(p => p.material).filter(Boolean))].length;
    const uniqueColors = [...new Set(products.map(p => p.color).filter(Boolean))].length;
    
    // Type distribution
    const typeCounts = {};
    products.forEach(prod => {
      if (prod.type) {
        typeCounts[prod.type] = (typeCounts[prod.type] || 0) + 1;
      }
    });

    // Category values (inventory value by product type)
    const categoryValues = {};
    products.forEach(prod => {
      if (prod.type) {
        const price = getNumericPrice(prod.price);
        categoryValues[prod.type] = (categoryValues[prod.type] || 0) + price;
      }
    });

    // Material distribution
    const materialCounts = {};
    products.forEach(prod => {
      if (prod.material) {
        materialCounts[prod.material] = (materialCounts[prod.material] || 0) + 1;
      }
    });

    // Color distribution
    const colorCounts = {};
    products.forEach(prod => {
      if (prod.color) {
        colorCounts[prod.color] = (colorCounts[prod.color] || 0) + 1;
      }
    });

    // Quality grade distribution
    const qualityCounts = {};
    products.forEach(prod => {
      if (prod.qualityGrade) {
        qualityCounts[prod.qualityGrade] = (qualityCounts[prod.qualityGrade] || 0) + 1;
      }
    });

    // Stock status (based on availability)
    const stockStatus = {
      'In Stock': 0,
      'Low Stock': 0,
      'Out of Stock': 0
    };
    
    products.forEach(prod => {
      // Simple mock logic - in a real app, would be based on inventory data
      if (prod.availability === 'out_of_stock' || prod.stock === 0) {
        stockStatus['Out of Stock']++;
      } else if (prod.availability === 'low_stock' || (prod.stock && prod.stock < 10)) {
        stockStatus['Low Stock']++;
      } else {
        stockStatus['In Stock']++;
      }
    });

    // Price range analysis
    const priceRanges = {
      'Under ₹500': 0,
      '₹500 - ₹1000': 0,
      '₹1000 - ₹2000': 0,
      '₹2000 - ₹5000': 0,
      'Above ₹5000': 0
    };
    
    products.forEach(prod => {
      const price = getNumericPrice(prod.price);
      if (price < 500) priceRanges['Under ₹500']++;
      else if (price < 1000) priceRanges['₹500 - ₹1000']++;
      else if (price < 2000) priceRanges['₹1000 - ₹2000']++;
      else if (price < 5000) priceRanges['₹2000 - ₹5000']++;
      else priceRanges['Above ₹5000']++;
    });

    // Recently added products (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentlyAdded = [...products]
      .filter(prod => prod.createdAt && new Date(prod.createdAt) > thirtyDaysAgo)
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
      .slice(0, 5)
      .map(prod => ({
        id: prod.id || prod._id,
        name: prod.name,
        type: prod.type,
        material: prod.material,
        color: prod.color,
        dimensions: prod.dimensions,
        price: prod.price,
        numericPrice: getNumericPrice(prod.price),
        imageUrl: prod.imageUrl,
        createdAt: prod.createdAt ? format(new Date(prod.createdAt), 'MMM dd, yyyy') : 'Unknown'
      }));
    
    // Premium products (highest priced)
    const premiumProducts = [...products]
      .filter(p => p.qualityGrade === 'premium' || getNumericPrice(p.price) > 2000)
      .sort((a, b) => getNumericPrice(b.price) - getNumericPrice(a.price))
      .slice(0, 5)
      .map(prod => ({
        id: prod.id || prod._id,
        name: prod.name,
        type: prod.type,
        material: prod.material,
        color: prod.color,
        dimensions: prod.dimensions,
        price: prod.price,
        numericPrice: getNumericPrice(prod.price),
        imageUrl: prod.imageUrl,
        qualityGrade: prod.qualityGrade
      }));

    // Set the processed data
    setProductData({
      totalProducts,
      totalValue,
      uniqueTypes,
      uniqueMaterials,
      uniqueColors,
      typeCounts,
      materialCounts,
      colorCounts,
      qualityCounts,
      stockStatus,
      categoryValues,
      priceRanges,
      recentlyAdded,
      premiumProducts
    });
  };

  const generateMockData = () => {
    // Generate mock data for demonstration
    setProductData({
      totalProducts: 120,
      totalValue: 1250000,
      uniqueTypes: 5,
      uniqueMaterials: 6,
      uniqueColors: 8,
      typeCounts: {
        'Towel': 35,
        'Sheet': 30,
        'Blanket': 25,
        'Curtain': 20,
        'Robe': 10
      },
      materialCounts: {
        'Cotton': 50,
        'Silk': 20,
        'Linen': 15,
        'Polyester': 25,
        'Microfiber': 10
      },
      colorCounts: {
        'White': 30,
        'Blue': 25,
        'Gray': 20,
        'Beige': 15,
        'Black': 10,
        'Multi': 20
      },
      qualityCounts: {
        'premium': 40,
        'standard': 60,
        'economy': 20
      },
      stockStatus: {
        'In Stock': 80,
        'Low Stock': 25,
        'Out of Stock': 15
      },
      categoryValues: {
        'Towel': 350000,
        'Sheet': 300000,
        'Blanket': 250000,
        'Curtain': 200000,
        'Robe': 150000
      },
      priceRanges: {
        'Under ₹500': 20,
        '₹500 - ₹1000': 35,
        '₹1000 - ₹2000': 30,
        '₹2000 - ₹5000': 25,
        'Above ₹5000': 10
      },
      recentlyAdded: [
        { id: '1', name: 'Premium Cotton Towel', type: 'Towel', material: 'Cotton', color: 'White', dimensions: '70x140 cm', price: '₹1299', numericPrice: 1299, imageUrl: '', createdAt: 'May 01, 2025' },
        { id: '2', name: 'Luxury Silk Sheet', type: 'Sheet', material: 'Silk', color: 'Beige', dimensions: '90x200 cm', price: '₹2999', numericPrice: 2999, imageUrl: '', createdAt: 'May 02, 2025' },
        { id: '3', name: 'Soft Microfiber Blanket', type: 'Blanket', material: 'Microfiber', color: 'Gray', dimensions: '150x220 cm', price: '₹1899', numericPrice: 1899, imageUrl: '', createdAt: 'May 03, 2025' },
        { id: '4', name: 'Blackout Curtain', type: 'Curtain', material: 'Polyester', color: 'Black', dimensions: '140x250 cm', price: '₹1499', numericPrice: 1499, imageUrl: '', createdAt: 'May 04, 2025' },
        { id: '5', name: 'Plush Bathrobe', type: 'Robe', material: 'Cotton', color: 'Blue', dimensions: 'XL', price: '₹1999', numericPrice: 1999, imageUrl: '', createdAt: 'May 05, 2025' }
      ],
      premiumProducts: [
        { id: '10', name: 'Executive Silk Robe', type: 'Robe', material: 'Silk', color: 'White', dimensions: 'XXL', price: '₹3999', numericPrice: 3999, imageUrl: '', qualityGrade: 'premium' },
        { id: '11', name: 'Royal Silk Sheet Set', type: 'Sheet', material: 'Silk', color: 'Beige', dimensions: '180x200 cm', price: '₹3799', numericPrice: 3799, imageUrl: '', qualityGrade: 'premium' },
        { id: '12', name: 'Ultra Soft Blanket', type: 'Blanket', material: 'Cashmere', color: 'Gray', dimensions: '200x230 cm', price: '₹3599', numericPrice: 3599, imageUrl: '', qualityGrade: 'premium' },
        { id: '13', name: 'Custom Designer Curtain', type: 'Curtain', material: 'Velvet', color: 'Blue', dimensions: '150x270 cm', price: '₹3299', numericPrice: 3299, imageUrl: '', qualityGrade: 'premium' },
        { id: '14', name: 'Signature Bath Set', type: 'Towel', material: 'Egyptian Cotton', color: 'White', dimensions: 'Various', price: '₹2999', numericPrice: 2999, imageUrl: '', qualityGrade: 'premium' }
      ]
    });
  };
  
  // Format currency for display
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(value);
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
      if (!productData) {
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
      const headerRow = summarySheet.addRow(['TEXTLAIRE - PRODUCTS DASHBOARD']);
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
      
      summarySheet.addRow(['Total Products:', productData.totalProducts]);
      summarySheet.addRow(['Total Inventory Value:', productData.totalValue]);
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
      
      if (productData.stockStatus) {
        Object.entries(productData.stockStatus).forEach(([status, count]) => {
          summarySheet.addRow([status, count]);
        });
      } else {
        summarySheet.addRow(['No stock status data available', '']);
      }

      // Add empty row
      summarySheet.addRow([]);

      // Add type distribution
      summarySheet.addRow(['TYPE DISTRIBUTION']);
      summarySheet.mergeCells('A14:B14');
      summarySheet.getCell('A14').font = { bold: true, size: 12 };
      
      summarySheet.addRow(['Type', 'Count']);
      summarySheet.getCell('A15').font = { bold: true };
      summarySheet.getCell('B15').font = { bold: true };
      
      Object.entries(productData.typeCounts || {}).forEach(([type, count]) => {
        if (type) {
          summarySheet.addRow([type, count]);
        }
      });

      // Set column widths
      summarySheet.getColumn(1).width = 25;
      summarySheet.getColumn(2).width = 15;

      // Create Price Range worksheet
      const valueSheet = workbook.addWorksheet('Price Ranges', {
        properties: { tabColor: { argb: '4F46E5' } }
      });
      
      // Add title
      const valueHeaderRow = valueSheet.addRow(['PRICE RANGE DISTRIBUTION']);
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
      const valueTableHeader = valueSheet.addRow(['Price Range', 'Product Count', 'Percentage']);
      valueTableHeader.eachCell((cell) => {
        cell.font = { bold: true };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'E5E7EB' }
        };
      });
      
      // Calculate total for percentage
      const totalProducts = productData.totalProducts || 0;
      
      // Add data rows
      Object.entries(productData.priceRanges || {}).forEach(([range, count]) => {
        if (range) {
          const percentage = totalProducts > 0 ? (count / totalProducts) : 0;
          const row = valueSheet.addRow([range, count, percentage]);
          row.getCell(3).numFmt = '0.00%';
        }
      });
      
      // Set column widths
      valueSheet.getColumn(1).width = 20;
      valueSheet.getColumn(2).width = 20;
      valueSheet.getColumn(3).width = 15;

      // Create Premium Products worksheet
      const premiumProductsSheet = workbook.addWorksheet('Premium Products', {
        properties: { tabColor: { argb: '10B981' } }
      });
      
      // Add title
      const topProductsHeaderRow = premiumProductsSheet.addRow(['PREMIUM PRODUCTS']);
      premiumProductsSheet.mergeCells('A1:E1');
      premiumProductsSheet.getCell('A1').font = {
        name: 'Arial',
        size: 14,
        bold: true,
        color: { argb: '047857' }
      };
      premiumProductsSheet.getCell('A1').alignment = { horizontal: 'center' };
      topProductsHeaderRow.height = 25;
      
      // Add empty row
      premiumProductsSheet.addRow([]);
      
      // Add headers
      const topProductsTableHeader = premiumProductsSheet.addRow([
        'ID', 'Product Name', 'Type', 'Material', 'Price'
      ]);
      topProductsTableHeader.eachCell((cell) => {
        cell.font = { bold: true };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'ECFDF5' }
        };
      });
      
      // Add data rows
      if (productData.premiumProducts && Array.isArray(productData.premiumProducts)) {
        productData.premiumProducts.forEach(product => {
          const row = premiumProductsSheet.addRow([
            product.id,
            product.name,
            product.type,
            product.material,
            product.price
          ]);
          row.getCell(5).numFmt = '₹#,##0.00';
        });
      }
      
      // Set column widths
      premiumProductsSheet.getColumn(1).width = 10;
      premiumProductsSheet.getColumn(2).width = 30;
      premiumProductsSheet.getColumn(3).width = 15;
      premiumProductsSheet.getColumn(4).width = 15;
      premiumProductsSheet.getColumn(5).width = 15;

      // Create Recently Added Products worksheet
      const recentSheet = workbook.addWorksheet('Recently Added', {
        properties: { tabColor: { argb: '10B981' } }
      });
      
      // Add title
      const recentHeaderRow = recentSheet.addRow(['RECENTLY ADDED PRODUCTS']);
      recentSheet.mergeCells('A1:F1');
      recentSheet.getCell('A1').font = {
        name: 'Arial',
        size: 14,
        bold: true,
        color: { argb: '047857' }
      };
      recentSheet.getCell('A1').alignment = { horizontal: 'center' };
      recentHeaderRow.height = 25;
      
      // Add empty row
      recentSheet.addRow([]);
      
      // Add headers
      const recentTableHeader = recentSheet.addRow([
        'ID', 'Product Name', 'Type', 'Material', 'Price', 'Added Date'
      ]);
      recentTableHeader.eachCell((cell) => {
        cell.font = { bold: true };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'ECFDF5' }
        };
      });
      
      // Add data rows
      if (productData.recentlyAdded && Array.isArray(productData.recentlyAdded)) {
        productData.recentlyAdded.forEach(product => {
          const row = recentSheet.addRow([
            product.id,
            product.name,
            product.type,
            product.material,
            product.price,
            product.createdAt
          ]);
          row.getCell(5).numFmt = '₹#,##0.00';
        });
      }
      
      // Set column widths
      recentSheet.getColumn(1).width = 10;
      recentSheet.getColumn(2).width = 30;
      recentSheet.getColumn(3).width = 15;
      recentSheet.getColumn(4).width = 15;
      recentSheet.getColumn(5).width = 15;
      recentSheet.getColumn(6).width = 18;

      // Generate Excel file
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      saveAs(blob, `Products_Dashboard_${dateStr}.xlsx`);
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
            name="type"
            value={filter.type}
            onChange={handleFilterChange}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            {typeOptions.map(option => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
          <select
            name="material"
            value={filter.material}
            onChange={handleFilterChange}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            {materialOptions.map(option => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
          <select
            name="quality"
            value={filter.quality}
            onChange={handleFilterChange}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            {qualityOptions.map(option => (
              <option key={option.value} value={option.value}>{option.label}</option>
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
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Products</p>
              <p className="text-xl font-bold text-gray-800 dark:text-white">{productData ? productData.totalProducts : 0}</p>
            </div>
            <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-full">
              <FaTshirt className="text-blue-500 dark:text-blue-400 text-xl" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border-l-4 border-green-500">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Inventory Value</p>
              <p className="text-xl font-bold text-gray-800 dark:text-white">
                {productData ? formatCurrency(productData.totalValue) : 'N/A'}
              </p>
            </div>
            <div className="p-3 bg-green-100 dark:bg-green-900 rounded-full">
              <FaTags className="text-green-500 dark:text-green-400 text-xl" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border-l-4 border-yellow-500">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Product Types</p>
              <p className="text-xl font-bold text-gray-800 dark:text-white">
                {productData ? Object.keys(productData.typeCounts || {}).length : 0}
              </p>
            </div>
            <div className="p-3 bg-yellow-100 dark:bg-yellow-900 rounded-full">
              <FaTags className="text-yellow-500 dark:text-yellow-400 text-xl" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border-l-4 border-purple-500">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Materials</p>
              <p className="text-xl font-bold text-gray-800 dark:text-white">
                {productData ? Object.keys(productData.materialCounts || {}).length : 0}
              </p>
            </div>
            <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-full">
              <FaBoxOpen className="text-purple-500 dark:text-purple-400 text-xl" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Product Distribution by Category</h3>
          <div className="h-64">
            {productData ? (
              <Doughnut 
                data={{
                  labels: Object.keys(productData.typeCounts || {}),
                  datasets: [{
                    data: Object.values(productData.typeCounts || {}),
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
            {productData ? (
              <Bar 
                data={{
                  labels: Object.keys(productData.categoryValues || {}),
                  datasets: [{
                    label: 'Inventory Value',
                    data: Object.values(productData.categoryValues || {}),
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

      {/* Recently Added Products */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Recently Added Products</h3>
        
        {productData && productData.recentlyAdded.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {productData.recentlyAdded.map((product) => (
              <div key={product.id} className="bg-gray-50 dark:bg-gray-700 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                <div className="aspect-square relative">
                  <img 
                    src={product.imageUrl || 'https://via.placeholder.com/150?text=No+Image'} 
                    alt={product.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = 'https://via.placeholder.com/150?text=No+Image';
                    }}
                  />
                </div>
                <div className="p-3">
                  <h4 className="font-medium text-sm truncate">{product.name}</h4>
                  <div className="flex justify-between items-center mt-1">
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{product.type}</p>
                    <p className="text-xs font-semibold text-blue-500">{formatCurrency(product.price)}</p>
                  </div>
                  <div className="mt-2">
                    <span className="text-xs px-2 py-0.5 bg-gray-200 dark:bg-gray-600 rounded-full">{product.material}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-gray-500 dark:text-gray-400 py-4">No recently added products available</p>
        )}
      </div>

      {/* Premium Products */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Premium Products</h3>
        
        {productData && productData.premiumProducts.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-500 dark:text-gray-300">Product</th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-500 dark:text-gray-300">Type</th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-500 dark:text-gray-300">Material</th>
                  <th className="px-4 py-2 text-right text-sm font-medium text-gray-500 dark:text-gray-300">Price</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {productData.premiumProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50 dark:hover:bg-gray-900">
                    <td className="px-4 py-2 text-sm text-gray-900 dark:text-white flex items-center">
                      <div className="w-8 h-8 mr-2 flex-shrink-0">
                        <img 
                          src={product.imageUrl || 'https://via.placeholder.com/150?text=No+Image'} 
                          alt={product.name}
                          className="w-full h-full object-cover rounded"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = 'https://via.placeholder.com/150?text=No+Image';
                          }}
                        />
                      </div>
                      {product.name}
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">{product.type}</td>
                    <td className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">{product.material}</td>
                    <td className="px-4 py-2 text-sm text-right font-medium text-blue-600 dark:text-blue-400">{formatCurrency(product.price)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-center text-gray-500 dark:text-gray-400 py-4">No premium products data available</p>
        )}
      </div>
    </div>
  );
};

export default ProductDashboard;
