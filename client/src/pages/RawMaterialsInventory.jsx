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
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
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
        Name: material.name,
        Category: material.category,
        Stock: material.stock,
        ID: material._id
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
    // Search filter
    const matchesSearch = material.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Category filter
    const matchesCategory = filterType === 'all' || material.category === filterType;
    
    // Stock filter
    let matchesStock = true;
    if (stockFilter === 'low') {
      matchesStock = material.stock < 10;
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
    }
    return 0;
  });

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = sortedMaterials.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(sortedMaterials.length / itemsPerPage);

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

  // Stock status badge
  const StockStatusBadge = ({ stock }) => {
    let status, colorClass;
    
    if (stock === 0) {
      status = 'Out of Stock';
      colorClass = 'bg-red-100 text-red-800';
    } else if (stock < 10) {
      status = 'Low Stock';
      colorClass = 'bg-yellow-100 text-yellow-800';
    } else {
      status = 'In Stock';
      colorClass = 'bg-green-100 text-green-800';
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
    <div className="p-4 relative min-h-screen">
      {/* Header with Stats */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Raw Materials Inventory</h1>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Manage your textile raw materials inventory
        </p>
        
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md border-l-4 border-blue-500">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Materials</h3>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{materials.length}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md border-l-4 border-green-500">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">In Stock</h3>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {materials.filter(m => m.stock > 0).length}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md border-l-4 border-yellow-500">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Low Stock</h3>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {materials.filter(m => m.stock > 0 && m.stock < 10).length}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md border-l-4 border-red-500">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Out of Stock</h3>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {materials.filter(m => m.stock === 0).length}
            </p>
          </div>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md mb-6">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative flex-1 w-full">
            <input
              type="text"
              placeholder="Search materials..."
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <FaSearch className="absolute left-3 top-3 text-gray-400" />
          </div>
          
          <div className="flex gap-2 w-full md:w-auto">
            <button 
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-lg"
            >
              <FaFilter />
              <span>Filters</span>
            </button>
            
            <CSVLink 
              data={exportData} 
              filename={"raw-materials.csv"}
              className="flex items-center gap-2 px-4 py-2 bg-green-100 hover:bg-green-200 text-green-800 dark:bg-green-700 dark:hover:bg-green-600 dark:text-green-100 rounded-lg"
            >
              <FaFileExport />
              <span>Export</span>
            </CSVLink>
            
            <button
              onClick={() => {
                setSelectedMaterial(null);
                setShowModal(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
            >
              <FaPlus />
              <span>Add New</span>
            </button>
          </div>
        </div>
        
        {/* Advanced Filters */}
        {showFilters && (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Category
              </label>
              <select
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
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
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Stock Status
              </label>
              <select
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
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
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Sort By
              </label>
              <div className="flex gap-2">
                <select
                  className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  value={sortField}
                  onChange={(e) => setSortField(e.target.value)}
                >
                  <option value="name">Name</option>
                  <option value="category">Category</option>
                  <option value="stock">Stock</option>
                </select>
                <button
                  onClick={() => setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')}
                  className="px-3 py-2 border rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 dark:border-gray-600"
                >
                  {sortDirection === 'asc' ? <FaSortUp /> : <FaSortDown />}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Materials Table */}
      <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-hidden mb-14">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('name')}
                >
                  <div className="flex items-center">
                    Material <SortIcon field="name" />
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('category')}
                >
                  <div className="flex items-center">
                    Category <SortIcon field="category" />
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('stock')}
                >
                  <div className="flex items-center">
                    Stock <SortIcon field="stock" />
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {loading ? (
                <tr>
                  <td colSpan="5" className="px-6 py-4 text-center">
                    <div className="flex justify-center items-center space-x-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
                      <span>Loading...</span>
                    </div>
                  </td>
                </tr>
              ) : currentItems.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-4 text-center">
                    <div className="text-gray-500 dark:text-gray-400">
                      No materials found
                    </div>
                    <button
                      onClick={() => {
                        setSelectedMaterial(null);
                        setShowModal(true);
                      }}
                      className="mt-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                    >
                      Add your first material
                    </button>
                  </td>
                </tr>
              ) : (
                currentItems.map((material) => (
                  <tr key={material._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {material.image ? (
                          <img
                            src={material.image}
                            alt={material.name}
                            className="h-10 w-10 rounded-full mr-3 object-cover border border-gray-200 dark:border-gray-700 cursor-pointer"
                            onClick={() => handleImagePreview(material.image)}
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-full mr-3 bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                            <span className="text-gray-500 dark:text-gray-400 text-xs font-bold">
                              {material.name.substring(0, 2).toUpperCase()}
                            </span>
                          </div>
                        )}
                        <div className="text-sm font-medium text-gray-900 dark:text-white">{material.name}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                        {material.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleStockChange(material._id, -1)}
                          className="p-1 rounded-full bg-red-100 text-red-800 hover:bg-red-200 dark:bg-red-900 dark:text-red-200 dark:hover:bg-red-800"
                          disabled={material.stock <= 0}
                        >
                          <FaArrowDown className="text-xs" />
                        </button>
                        <span className="text-sm font-medium text-gray-900 dark:text-white w-10 text-center">
                          {material.stock}
                        </span>
                        <button
                          onClick={() => handleStockChange(material._id, 1)}
                          className="p-1 rounded-full bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900 dark:text-green-200 dark:hover:bg-green-800"
                        >
                          <FaArrowUp className="text-xs" />
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <StockStatusBadge stock={material.stock} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEdit(material)}
                          className="p-1 rounded-full bg-indigo-100 text-indigo-800 hover:bg-indigo-200 dark:bg-indigo-900 dark:text-indigo-200 dark:hover:bg-indigo-800"
                          title="Edit"
                        >
                          <FaEdit />
                        </button>
                        <button
                          onClick={() => handleDeleteConfirmation(material)}
                          className="p-1 rounded-full bg-red-100 text-red-800 hover:bg-red-200 dark:bg-red-900 dark:text-red-200 dark:hover:bg-red-800"
                          title="Delete"
                        >
                          <FaTrash />
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

      {/* Pagination */}
      {!loading && filteredMaterials.length > 0 && (
        <div className="bg-white dark:bg-gray-800 p-2 rounded-lg border border-gray-300 dark:border-gray-700 text-sm flex justify-between items-center shadow-md">
          <button
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            Previous
          </button>
          <div className="flex items-center space-x-1">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              // Show pages around current page
              let pageNum;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }
              
              return (
                <button
                  key={i}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`w-8 h-8 rounded-full ${
                    currentPage === pageNum
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
          </div>
          <button
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="px-4 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            Next
          </button>
        </div>
      )}

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
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Confirm Delete</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Are you sure you want to delete {materialToDelete?.name}? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
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
          <div className="relative max-w-3xl max-h-[90vh] overflow-auto" onClick={e => e.stopPropagation()}>
            <button 
              className="absolute top-2 right-2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-75"
              onClick={() => setShowImagePreview(false)}
            >
              <FaTimes />
            </button>
            <img 
              src={previewImage} 
              alt="Preview" 
              className="max-w-full max-h-[90vh] object-contain"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default RawMaterialsInventory;