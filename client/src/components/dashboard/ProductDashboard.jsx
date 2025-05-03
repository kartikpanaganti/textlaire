import React, { useState, useEffect } from 'react';
import {
  FaTshirt, FaChartLine, FaExclamationTriangle, FaShoppingCart,
  FaFilter, FaDownload, FaCalendarAlt, FaTags, FaBoxOpen
} from 'react-icons/fa';
import axios from 'axios';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';
import { format } from 'date-fns';

// Register ChartJS components
ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

const ProductDashboard = () => {
  const [productData, setProductData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState({
    category: '',
    status: ''
  });

  const categories = [
    { value: '', label: 'All Categories' },
    { value: 'Men\'s Wear', label: 'Men\'s Wear' },
    { value: 'Women\'s Wear', label: 'Women\'s Wear' },
    { value: 'Children\'s Wear', label: 'Children\'s Wear' },
    { value: 'Traditional', label: 'Traditional' },
    { value: 'Formal', label: 'Formal' },
    { value: 'Casual', label: 'Casual' }
  ];

  const statuses = [
    { value: '', label: 'All Statuses' },
    { value: 'In Stock', label: 'In Stock' },
    { value: 'Low Stock', label: 'Low Stock' },
    { value: 'Out of Stock', label: 'Out of Stock' },
    { value: 'New Arrival', label: 'New Arrival' }
  ];

  useEffect(() => {
    fetchProductData();
  }, [filter]);

  const fetchProductData = async () => {
    setLoading(true);
    try {
      let url = '/api/products';
      if (filter.category || filter.status) {
        url += '?';
        if (filter.category) url += `category=${encodeURIComponent(filter.category)}&`;
        if (filter.status) url += `status=${encodeURIComponent(filter.status)}`;
      }
      
      const response = await axios.get(url);
      processProductData(response.data);
    } catch (error) {
      console.error("Error fetching product data:", error);
      setError("Error loading product data");
      // Generate mock data if API fails
      generateMockData();
    } finally {
      setLoading(false);
    }
  };

  const processProductData = (products) => {
    if (!products || !Array.isArray(products)) {
      setError("Invalid product data received");
      generateMockData();
      return;
    }

    // Calculate various metrics
    const totalProducts = products.length;
    const totalValue = products.reduce((sum, prod) => sum + (prod.quantity * prod.price), 0);
    
    // Category distribution
    const categoryCounts = {};
    categories.forEach(cat => {
      if (cat.value) categoryCounts[cat.value] = 0;
    });
    
    products.forEach(prod => {
      if (prod.category) {
        categoryCounts[prod.category] = (categoryCounts[prod.category] || 0) + 1;
      }
    });

    // Stock status
    const stockStatus = {
      'In Stock': 0,
      'Low Stock': 0,
      'Out of Stock': 0,
      'New Arrival': 0
    };
    
    products.forEach(prod => {
      if (prod.isNewArrival) {
        stockStatus['New Arrival']++;
      }
      
      if (prod.quantity === 0) {
        stockStatus['Out of Stock']++;
      } else if (prod.quantity <= prod.reorderLevel) {
        stockStatus['Low Stock']++;
      } else {
        stockStatus['In Stock']++;
      }
    });

    // Category value distribution
    const categoryValues = {};
    categories.forEach(cat => {
      if (cat.value) categoryValues[cat.value] = 0;
    });
    
    products.forEach(prod => {
      if (prod.category) {
        categoryValues[prod.category] = (categoryValues[prod.category] || 0) + (prod.quantity * prod.price);
      }
    });

    // Top selling products
    const topSellingProducts = products
      .filter(prod => prod.salesCount > 0)
      .sort((a, b) => b.salesCount - a.salesCount)
      .slice(0, 5)
      .map(prod => ({
        id: prod.productId || prod._id,
        name: prod.name,
        category: prod.category,
        salesCount: prod.salesCount,
        revenue: prod.salesCount * prod.price
      }));

    // Low stock products
    const lowStockProducts = products
      .filter(prod => prod.quantity <= prod.reorderLevel && prod.quantity > 0)
      .sort((a, b) => (a.quantity / a.reorderLevel) - (b.quantity / b.reorderLevel))
      .slice(0, 5)
      .map(prod => ({
        id: prod.productId || prod._id,
        name: prod.name,
        category: prod.category,
        quantity: prod.quantity,
        reorderLevel: prod.reorderLevel,
        price: prod.price
      }));

    // Set the processed data
    setProductData({
      totalProducts,
      totalValue,
      categoryCounts,
      stockStatus,
      categoryValues,
      topSellingProducts,
      lowStockProducts
    });
  };

  const generateMockData = () => {
    // Generate mock data for demonstration
    setProductData({
      totalProducts: 120,
      totalValue: 1250000,
      categoryCounts: {
        'Men\'s Wear': 35,
        'Women\'s Wear': 48,
        'Children\'s Wear': 25,
        'Traditional': 15,
        'Formal': 30,
        'Casual': 45
      },
      stockStatus: {
        'In Stock': 75,
        'Low Stock': 25,
        'Out of Stock': 10,
        'New Arrival': 15
      },
      categoryValues: {
        'Men\'s Wear': 350000,
        'Women\'s Wear': 480000,
        'Children\'s Wear': 175000,
        'Traditional': 120000,
        'Formal': 260000,
        'Casual': 350000
      },
      topSellingProducts: [
        { id: 'P001', name: 'Classic White Shirt', category: 'Men\'s Wear', salesCount: 250, revenue: 125000 },
        { id: 'P015', name: 'Floral Summer Dress', category: 'Women\'s Wear', salesCount: 200, revenue: 160000 },
        { id: 'P022', name: 'Denim Jeans', category: 'Casual', salesCount: 180, revenue: 108000 },
        { id: 'P034', name: 'Traditional Silk Saree', category: 'Traditional', salesCount: 120, revenue: 240000 },
        { id: 'P045', name: 'Formal Blazer', category: 'Formal', salesCount: 100, revenue: 150000 }
      ],
      lowStockProducts: [
        { id: 'P009', name: 'Cotton T-Shirt', category: 'Casual', quantity: 10, reorderLevel: 20, price: 499 },
        { id: 'P018', name: 'Designer Evening Gown', category: 'Women\'s Wear', quantity: 5, reorderLevel: 15, price: 2999 },
        { id: 'P027', name: 'Children\'s Party Wear', category: 'Children\'s Wear', quantity: 8, reorderLevel: 15, price: 899 },
        { id: 'P036', name: 'Formal Trousers', category: 'Formal', quantity: 12, reorderLevel: 25, price: 1299 },
        { id: 'P052', name: 'Traditional Kurta Set', category: 'Traditional', quantity: 7, reorderLevel: 12, price: 1499 }
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

  const exportToExcel = () => {
    // In a real app, this would generate an Excel file with product data
    alert('This would download an Excel file with the current product inventory data');
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
              <p className="text-sm text-gray-500 dark:text-gray-400">Low Stock Items</p>
              <p className="text-xl font-bold text-gray-800 dark:text-white">
                {productData ? productData.stockStatus['Low Stock'] : 0}
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
              <p className="text-sm text-gray-500 dark:text-gray-400">New Arrivals</p>
              <p className="text-xl font-bold text-gray-800 dark:text-white">
                {productData ? productData.stockStatus['New Arrival'] : 0}
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
                  labels: Object.keys(productData.categoryCounts),
                  datasets: [{
                    data: Object.values(productData.categoryCounts),
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
                  labels: Object.keys(productData.categoryValues),
                  datasets: [{
                    label: 'Inventory Value',
                    data: Object.values(productData.categoryValues),
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

      {/* Stock Status and Top Selling */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Stock Status</h3>
          <div className="h-64">
            {productData ? (
              <Doughnut 
                data={{
                  labels: Object.keys(productData.stockStatus),
                  datasets: [{
                    data: Object.values(productData.stockStatus),
                    backgroundColor: [
                      '#10B981', // green (In Stock)
                      '#F59E0B', // amber (Low Stock)
                      '#EF4444', // red (Out of Stock)
                      '#8B5CF6'  // purple (New Arrival)
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
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Top Selling Products</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead>
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Product</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Category</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Units Sold</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {productData && productData.topSellingProducts && productData.topSellingProducts.length > 0 ? (
                  productData.topSellingProducts.map((product, index) => (
                    <tr key={index}>
                      <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{product.name}</td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-800 dark:text-gray-200">{product.category}</td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-800 dark:text-gray-200 flex items-center">
                        <span className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 px-2 py-1 rounded text-xs">
                          {product.salesCount}
                        </span>
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                        {formatCurrency(product.revenue)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="px-4 py-2 text-center text-sm text-gray-500 dark:text-gray-400">No sales data available</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Low Stock Products */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Low Stock Products</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead>
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Product ID</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Name</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Category</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Quantity</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Reorder Level</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Price</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {productData && productData.lowStockProducts && productData.lowStockProducts.length > 0 ? (
                productData.lowStockProducts.map((product, index) => (
                  <tr key={index}>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{product.id}</td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{product.name}</td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-800 dark:text-gray-200">{product.category}</td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm">
                      <span className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300 px-2 py-1 rounded text-xs">
                        {product.quantity}
                      </span>
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{product.reorderLevel}</td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                      {formatCurrency(product.price)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="px-4 py-2 text-center text-sm text-gray-500 dark:text-gray-400">No low stock products</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ProductDashboard;
