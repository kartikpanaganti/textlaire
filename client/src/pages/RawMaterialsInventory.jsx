import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaPlus, FaEdit, FaTrash, FaSearch, FaFilter, FaFileExport, FaArrowUp, FaArrowDown, FaSort, FaSortUp, FaSortDown, FaTimes } from 'react-icons/fa';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';
import RawMaterialModal from '../components/RawMaterialModal';
import { CSVLink } from 'react-csv';

const RawMaterialsInventory = () => {
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [materialToDelete, setMaterialToDelete] = useState(null);
  const [selectedMaterial, setSelectedMaterial] = useState(null);
  const [sortField, setSortField] = useState('name');
  const [sortDirection, setSortDirection] = useState('asc');
  const [stockFilter, setStockFilter] = useState('all');
  const [exportData, setExportData] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [showImagePreview, setShowImagePreview] = useState(false);
  const [previewImage, setPreviewImage] = useState('');

  // Fetch raw materials
  useEffect(() => {
    fetchMaterials();
  }, []);

  // Prepare export data when materials change
  useEffect(() => {
    if (materials.length > 0) {
      const dataToExport = materials.map(material => ({
        ID: material._id,
        Name: material.name,
        Category: material.category,
        Stock: material.stock,
        Unit: material.unit,
        'Unit Price': `₹${material.unitPrice.toFixed(2)}`,
        'Total Value': `₹${(material.stock * material.unitPrice).toFixed(2)}`,
        Supplier: material.supplier || '',
        Location: material.location || '',
        'Reorder Level': material.reorderLevel,
        'Last Restocked': material.lastRestocked ? new Date(material.lastRestocked).toLocaleDateString() : '',
        'Expiry Date': material.expiryDate ? new Date(material.expiryDate).toLocaleDateString() : '',
        'Stock Status': material.stock === 0 ? 'Out of Stock' : (material.stock < material.reorderLevel ? 'Low Stock' : 'In Stock'),
        'Color': material.specifications?.color || '',
        'Quality': material.specifications?.quality || '',
        'Weight': material.specifications?.weight || '',
        'Dimensions': material.specifications?.dimensions || '',
        'Created At': material.createdAt ? new Date(material.createdAt).toLocaleDateString() : '',
        'Updated At': material.updatedAt ? new Date(material.updatedAt).toLocaleDateString() : ''
      }));
      setExportData(dataToExport);
    }
  }, [materials]);

  const fetchMaterials = async () => {
    try {
      console.log('Fetching materials...');
      const response = await axios.get('/api/raw-materials');
      console.log('API response:', response.data);
      
      // Ensure that materials is always an array
      const materialsData = Array.isArray(response.data) ? response.data : [];
      setMaterials(materialsData);
      
      if (!Array.isArray(response.data)) {
        console.error('API response is not an array:', response.data);
        toast.error('Received invalid data format from server');
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching materials:', error);
      
      // More detailed error message
      let errorMessage = 'Failed to load raw materials';
      if (error.response) {
        errorMessage += `: ${error.response.data.message || error.response.statusText}`;
      } else if (error.request) {
        errorMessage += ': No response from server';
      } else {
        errorMessage += `: ${error.message}`;
      }
      
      toast.error(errorMessage);
      setLoading(false);
    }
  };

  // Sort function
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Filter and search materials
  const filteredMaterials = Array.isArray(materials) ? materials.filter(material => {
    // Search filter - search in name, supplier, location, and specifications
    const matchesSearch = 
      material.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (material.supplier && material.supplier.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (material.location && material.location.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (material.specifications && material.specifications.color && 
        material.specifications.color.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (material.specifications && material.specifications.quality && 
        material.specifications.quality.toLowerCase().includes(searchTerm.toLowerCase()));
    
    // Category filter
    const matchesCategory = filterType === 'all' || material.category === filterType;
    
    // Stock filter
    let matchesStock = true;
    if (stockFilter === 'low') {
      matchesStock = material.stock < material.reorderLevel;
    } else if (stockFilter === 'out') {
      matchesStock = material.stock === 0;
    } else if (stockFilter === 'in') {
      matchesStock = material.stock > 0;
    }
    
    return matchesSearch && matchesCategory && matchesStock;
  }) : [];

  // Sort materials
  const sortedMaterials = [...filteredMaterials].sort((a, b) => {
    if (sortField === 'name') {
      return sortDirection === 'asc' 
        ? a.name.localeCompare(b.name)
        : b.name.localeCompare(a.name);
    } else if (sortField === 'category') {
      return sortDirection === 'asc'
        ? a.category.localeCompare(b.category)
        : b.category.localeCompare(a.category);
    } else if (sortField === 'stock') {
      return sortDirection === 'asc'
        ? a.stock - b.stock
        : b.stock - a.stock;
    } else if (sortField === 'unitPrice') {
      return sortDirection === 'asc'
        ? (a.unitPrice || 0) - (b.unitPrice || 0)
        : (b.unitPrice || 0) - (a.unitPrice || 0);
    } else if (sortField === 'lastRestocked') {
      const dateA = a.lastRestocked ? new Date(a.lastRestocked) : new Date(0);
      const dateB = b.lastRestocked ? new Date(b.lastRestocked) : new Date(0);
      return sortDirection === 'asc'
        ? dateA - dateB
        : dateB - dateA;
    }
    return 0;
  });

  // Handle edit
  const handleEdit = (material) => {
    setSelectedMaterial(material);
    setShowModal(true);
  };

  // Handle delete confirmation
  const handleDeleteConfirmation = (material) => {
    setMaterialToDelete(material);
    setShowDeleteModal(true);
  };

  // Handle delete
  const handleDelete = async () => {
    if (!materialToDelete) return;
    
    try {
      await axios.delete(`/api/raw-materials/${materialToDelete._id}`);
      toast.success('Material deleted successfully');
      fetchMaterials();
      setShowDeleteModal(false);
      setMaterialToDelete(null);
    } catch (error) {
      console.error('Error deleting material:', error);
      toast.error('Failed to delete material');
    }
  };

  // Handle image preview
  const handleImagePreview = (imageUrl) => {
    setPreviewImage(imageUrl);
    setShowImagePreview(true);
  };

  // Handle modal save
  const handleSave = async (updatedMaterial) => {
    try {
      // Refresh data from server to ensure we have the latest data
      await fetchMaterials();
      toast.success(`Material ${selectedMaterial ? 'updated' : 'added'} successfully`);
      setShowModal(false);
      setSelectedMaterial(null);
    } catch (error) {
      console.error('Error refreshing materials:', error);
    }
  };

  // Handle stock increment/decrement
  const handleStockChange = async (id, change) => {
    try {
      const material = materials.find(m => m._id === id);
      if (!material) return;
      
      // Don't allow negative stock
      if (material.stock + change < 0) {
        toast.error('Stock cannot be negative');
        return;
      }
      
      const updatedStock = material.stock + change;
      await axios.patch(`/api/raw-materials/${id}`, { stock: updatedStock });
      
      // Update local state for immediate UI update
      setMaterials(prevMaterials => 
        prevMaterials.map(m => 
          m._id === id ? { ...m, stock: updatedStock } : m
        )
      );
      
      toast.success(`Stock ${change > 0 ? 'increased' : 'decreased'} successfully`);
    } catch (error) {
      console.error('Error updating stock:', error);
      toast.error('Failed to update stock');
    }
  };

  // Stock status badge - updated to use reorderLevel from the model
  const StockStatusBadge = ({ stock, reorderLevel = 10 }) => {
    let status, colorClass;
    
    if (stock === 0) {
      status = 'Out of Stock';
      colorClass = 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
    } else if (stock < reorderLevel) {
      status = 'Low Stock';
      colorClass = 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
    } else {
      status = 'In Stock';
      colorClass = 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    }
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colorClass}`}>
        {status}
      </span>
    );
  };

  // Safe date formatting function
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return format(new Date(dateString), 'MMM d, yyyy');
    } catch (error) {
      console.error('Invalid date:', dateString);
      return 'Invalid date';
    }
  };

  // Sort icon component
  const SortIcon = ({ field }) => {
    if (sortField !== field) return <FaSort className="ml-1 text-gray-400" />;
    return sortDirection === 'asc' ? 
      <FaSortUp className="ml-1 text-blue-500" /> : 
      <FaSortDown className="ml-1 text-blue-500" />;
  };

  return (
    <div className="h-screen overflow-hidden bg-gray-50 dark:bg-gray-900 transition-colors duration-200 flex flex-col">
      <div className="p-2 flex-1 flex flex-col max-h-screen">
        {/* Header with Stats */}
        <div className="mb-1">
          <h1 className="text-lg font-semibold text-gray-900 dark:text-white transition-colors duration-200">Raw Materials Inventory</h1>
          
          {/* Stats Cards */}
          <div className="grid grid-cols-4 gap-1 mt-1">
            <div className="bg-white dark:bg-gray-800 p-1.5 rounded-lg shadow-sm border-l-4 border-blue-500 transition-colors duration-200">
              <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 transition-colors duration-200">Total</h3>
              <p className="text-base font-bold text-gray-900 dark:text-white transition-colors duration-200">{materials.length}</p>
            </div>
            <div className="bg-white dark:bg-gray-800 p-1.5 rounded-lg shadow-sm border-l-4 border-green-500 transition-colors duration-200">
              <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 transition-colors duration-200">In Stock</h3>
              <p className="text-base font-bold text-gray-900 dark:text-white transition-colors duration-200">
                {materials.filter(m => m.stock > 0).length}
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 p-1.5 rounded-lg shadow-sm border-l-4 border-yellow-500 transition-colors duration-200">
              <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 transition-colors duration-200">Low</h3>
              <p className="text-base font-bold text-gray-900 dark:text-white transition-colors duration-200">
                {materials.filter(m => m.stock > 0 && m.stock < (m.reorderLevel || 10)).length}
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 p-1.5 rounded-lg shadow-sm border-l-4 border-red-500 transition-colors duration-200">
              <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 transition-colors duration-200">Out</h3>
              <p className="text-base font-bold text-gray-900 dark:text-white transition-colors duration-200">
                {materials.filter(m => m.stock === 0).length}
              </p>
            </div>
          </div>
        </div>

        {/* Search and Filter Bar */}
        <div className="bg-white dark:bg-gray-800 p-1.5 rounded-lg shadow-sm mb-1 transition-colors duration-200">
          <div className="flex flex-row gap-1 items-center justify-between">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Search materials..."
                className="w-full pl-6 pr-2 py-1 text-xs border rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-colors duration-200"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <FaSearch className="absolute left-2 top-1.5 text-gray-400 text-xs" />
            </div>
            
            <div className="flex gap-1">
              <button 
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-1 px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-lg transition-colors duration-200 text-gray-700 dark:text-gray-300"
              >
                <FaFilter size={10} />
                <span className="hidden sm:inline">Filters</span>
              </button>
              
              <CSVLink 
                data={exportData} 
                filename={"raw-materials.csv"}
                className="flex items-center gap-1 px-2 py-1 text-xs bg-green-100 hover:bg-green-200 text-green-800 dark:bg-green-700 dark:hover:bg-green-600 dark:text-green-100 rounded-lg transition-colors duration-200"
              >
                <FaFileExport size={10} />
                <span className="hidden sm:inline">Export</span>
              </CSVLink>
              
              <button
                onClick={() => {
                  setSelectedMaterial(null);
                  setShowModal(true);
                }}
                className="flex items-center gap-1 px-2 py-1 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200"
              >
                <FaPlus size={10} />
                <span className="hidden sm:inline">Add</span>
              </button>
            </div>
          </div>
          
          {/* Advanced Filters */}
          {showFilters && (
            <div className="mt-1 grid grid-cols-3 gap-1 pt-1 border-t border-gray-200 dark:border-gray-700 transition-colors duration-200">
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-0.5 transition-colors duration-200">
                  Category
                </label>
                <select
                  className="w-full px-1 py-0.5 text-xs border rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-colors duration-200"
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                >
                  <option value="all">All Categories</option>
                  <option value="Cotton">Cotton</option>
                  <option value="Polyester">Polyester</option>
                  <option value="Dye">Dye</option>
                  <option value="Thread">Thread</option>
                  <option value="Packaging">Packaging</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-0.5 transition-colors duration-200">
                  Stock Status
                </label>
                <select
                  className="w-full px-1 py-0.5 text-xs border rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-colors duration-200"
                  value={stockFilter}
                  onChange={(e) => setStockFilter(e.target.value)}
                >
                  <option value="all">All Stock Levels</option>
                  <option value="in">In Stock</option>
                  <option value="low">Low Stock</option>
                  <option value="out">Out of Stock</option>
                </select>
              </div>
              
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-0.5 transition-colors duration-200">
                  Sort By
                </label>
                <div className="flex gap-1">
                  <select
                    className="flex-1 px-1 py-0.5 text-xs border rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-colors duration-200"
                    value={sortField}
                    onChange={(e) => setSortField(e.target.value)}
                  >
                    <option value="name">Name</option>
                    <option value="category">Category</option>
                    <option value="stock">Stock</option>
                    <option value="unitPrice">Price</option>
                    <option value="lastRestocked">Restocked</option>
                  </select>
                  <button
                    onClick={() => setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')}
                    className="px-1 py-0.5 border rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 dark:border-gray-600 transition-colors duration-200"
                    aria-label={sortDirection === 'asc' ? 'Sort ascending' : 'Sort descending'}
                  >
                    {sortDirection === 'asc' ? <FaSortUp className="text-gray-700 dark:text-gray-300" /> : <FaSortDown className="text-gray-700 dark:text-gray-300" />}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Materials Table */}
        <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg overflow-hidden flex-1 transition-colors duration-200">
          <div className="overflow-auto h-full">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 transition-colors duration-200">
              <thead className="bg-gray-50 dark:bg-gray-700 transition-colors duration-200 sticky top-0 z-10">
                <tr>
                  <th 
                    className="px-2 py-1 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer transition-colors duration-200"
                    onClick={() => handleSort('name')}
                  >
                    <div className="flex items-center">
                      Material <SortIcon field="name" />
                    </div>
                  </th>
                  <th 
                    className="px-2 py-1 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer transition-colors duration-200"
                    onClick={() => handleSort('category')}
                  >
                    <div className="flex items-center">
                      Cat <SortIcon field="category" />
                    </div>
                  </th>
                  <th 
                    className="px-2 py-1 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer transition-colors duration-200"
                    onClick={() => handleSort('stock')}
                  >
                    <div className="flex items-center">
                      Stock <SortIcon field="stock" />
                    </div>
                  </th>
                  <th 
                    className="px-2 py-1 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer transition-colors duration-200 hidden sm:table-cell"
                    onClick={() => handleSort('unitPrice')}
                  >
                    <div className="flex items-center">
                      Price <SortIcon field="unitPrice" />
                    </div>
                  </th>
                  <th className="px-2 py-1 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider transition-colors duration-200">
                    Status
                  </th>
                  <th className="px-2 py-1 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider transition-colors duration-200 hidden md:table-cell">
                    Specs
                  </th>
                  <th className="px-2 py-1 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider transition-colors duration-200">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700 transition-colors duration-200">
                {loading ? (
                  <tr>
                    <td colSpan="7" className="px-2 py-2 text-center">
                      <div className="flex justify-center items-center space-x-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                        <span className="text-gray-700 dark:text-gray-300 transition-colors duration-200 text-xs">Loading...</span>
                      </div>
                    </td>
                  </tr>
                ) : sortedMaterials.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-2 py-2 text-center">
                      <div className="text-gray-500 dark:text-gray-400 transition-colors duration-200 text-xs">
                        No materials found
                      </div>
                      <button
                        onClick={() => {
                          setSelectedMaterial(null);
                          setShowModal(true);
                        }}
                        className="mt-1 px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200 text-xs"
                      >
                        Add material
                      </button>
                    </td>
                  </tr>
                ) : (
                  sortedMaterials.map((material) => (
                    <tr key={material._id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200">
                      <td className="px-2 py-1">
                        <div className="flex items-center">
                          {material.image ? (
                            <img
                              src={material.image}
                              alt={material.name}
                              className="h-5 w-5 rounded-full mr-1 object-cover border border-gray-200 dark:border-gray-700 cursor-pointer transition-colors duration-200"
                              onClick={() => handleImagePreview(material.image)}
                            />
                          ) : (
                            <div className="h-5 w-5 rounded-full mr-1 bg-gray-200 dark:bg-gray-700 flex items-center justify-center transition-colors duration-200">
                              <span className="text-gray-500 dark:text-gray-400 text-xs font-bold transition-colors duration-200">
                                {material.name.substring(0, 2).toUpperCase()}
                              </span>
                            </div>
                          )}
                          <div>
                            <div className="text-xs font-medium text-gray-900 dark:text-white transition-colors duration-200">{material.name}</div>
                            {material.supplier && (
                              <div className="text-xs text-gray-500 dark:text-gray-400 transition-colors duration-200">
                                {material.supplier}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-2 py-1">
                        <span className="px-1 py-0.5 text-xs rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 transition-colors duration-200">
                          {material.category}
                        </span>
                      </td>
                      <td className="px-2 py-1">
                        <div className="flex items-center space-x-1">
                          <button
                            onClick={() => handleStockChange(material._id, -1)}
                            className="p-0.5 rounded-full bg-red-100 text-red-800 hover:bg-red-200 dark:bg-red-900 dark:text-red-200 dark:hover:bg-red-800 transition-colors duration-200"
                            disabled={material.stock <= 0}
                            aria-label="Decrease stock"
                          >
                            <FaArrowDown className="text-xs" />
                          </button>
                          <span className="text-xs font-medium text-gray-900 dark:text-white w-5 text-center transition-colors duration-200">
                            {material.stock}
                          </span>
                          <button
                            onClick={() => handleStockChange(material._id, 1)}
                            className="p-0.5 rounded-full bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900 dark:text-green-200 dark:hover:bg-green-800 transition-colors duration-200"
                            aria-label="Increase stock"
                          >
                            <FaArrowUp className="text-xs" />
                          </button>
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 transition-colors duration-200">
                          {material.unit}
                        </div>
                      </td>
                      <td className="px-2 py-1 hidden sm:table-cell">
                        <div className="text-xs text-gray-900 dark:text-white transition-colors duration-200">
                          ₹{material.unitPrice.toFixed(2)}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 transition-colors duration-200">
                          ₹{(material.stock * material.unitPrice).toFixed(2)}
                        </div>
                      </td>
                      <td className="px-2 py-1">
                        <StockStatusBadge stock={material.stock} reorderLevel={material.reorderLevel} />
                        {material.reorderLevel > 0 && (
                          <div className="text-xs text-gray-500 dark:text-gray-400 transition-colors duration-200">
                            Min: {material.reorderLevel}
                          </div>
                        )}
                      </td>
                      <td className="px-2 py-1 hidden md:table-cell">
                        <div className="text-xs text-gray-900 dark:text-white transition-colors duration-200">
                          {material.specifications?.color && (
                            <div className="flex items-center">
                              <span className="w-2 h-2 rounded-full mr-1" style={{ backgroundColor: material.specifications.color }}></span>
                              <span className="text-xs">{material.specifications.color}</span>
                            </div>
                          )}
                          {material.specifications?.quality && (
                            <div className="text-xs text-gray-600 dark:text-gray-400 transition-colors duration-200">
                              {material.specifications.quality}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-2 py-1">
                        <div className="flex justify-center items-center space-x-1">
                          <button
                            onClick={() => handleEdit(material)}
                            className="p-0.5 rounded-full bg-indigo-100 text-indigo-800 hover:bg-indigo-200 dark:bg-indigo-900 dark:text-indigo-200 dark:hover:bg-indigo-800 transition-colors duration-200"
                            title="Edit"
                            aria-label="Edit material"
                          >
                            <FaEdit size={12} />
                          </button>
                          <button
                            onClick={() => handleDeleteConfirmation(material)}
                            className="p-0.5 rounded-full bg-red-100 text-red-800 hover:bg-red-200 dark:bg-red-900 dark:text-red-200 dark:hover:bg-red-800 transition-colors duration-200"
                            title="Delete"
                            aria-label="Delete material"
                          >
                            <FaTrash size={12} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Material Modal */}
      <RawMaterialModal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setSelectedMaterial(null);
        }}
        material={selectedMaterial}
        onSave={handleSave}
      />

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-3 max-w-xs w-full transition-colors duration-200">
            <h3 className="text-base font-medium text-gray-900 dark:text-white mb-2 transition-colors duration-200">Confirm Delete</h3>
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-3 transition-colors duration-200">
              Are you sure you want to delete {materialToDelete?.name}? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-2 py-1 text-xs border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors duration-200"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-2 py-1 text-xs bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Preview Modal */}
      {showImagePreview && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50" onClick={() => setShowImagePreview(false)}>
          <div className="relative max-w-xl max-h-[80vh] overflow-auto" onClick={e => e.stopPropagation()}>
            <button 
              className="absolute top-2 right-2 bg-black bg-opacity-50 text-white p-1.5 rounded-full hover:bg-opacity-75 transition-colors duration-200"
              onClick={() => setShowImagePreview(false)}
              aria-label="Close preview"
            >
              <FaTimes size={12} />
            </button>
            <img 
              src={previewImage} 
              alt="Preview" 
              className="max-w-full max-h-[80vh] object-contain"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default RawMaterialsInventory;