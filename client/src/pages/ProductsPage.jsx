import React, { useState, useEffect, useContext, useRef } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { FaPlus, FaSearch, FaEye, FaEdit, FaTrash, FaUpload, FaImage } from 'react-icons/fa';
import { toast } from 'react-toastify';
import PageHeader from '../components/common/PageHeader';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { ThemeContext } from '../context/ThemeProvider';
import ProductDetailsModal from '../components/products/ProductDetailsModal';

const ProductsPage = () => {
  const { theme } = useContext(ThemeContext);
  const [products, setProducts] = useState([]);
  const [recentlyAdded, setRecentlyAdded] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [newProduct, setNewProduct] = useState({
    name: '',
    code: '',
    type: '',
    material: 'cotton',
    color: '',
    dimensions: '',
    price: '',
    currency: 'INR',
    imageUrl: '',
    qualityGrade: 'premium',
    weight: '400',
    description: '',
    tags: ''
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef(null);

  // Fetch all products on component mount
  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/products/patterns');
      setProducts(response.data);
      
      // Set recently added products (last 5)
      const sorted = [...response.data].sort((a, b) => 
        new Date(b.createdAt) - new Date(a.createdAt)
      );
      setRecentlyAdded(sorted.slice(0, 5));
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Failed to load products');
      setLoading(false);
    }
  };

  // Format price with currency symbol (always in Rupees)
  const formatPriceWithCurrency = (price, currency = 'INR') => {
    if (!price) return '₹0';
    
    // Remove any existing currency symbols and spaces
    const cleanPrice = price.replace(/[^0-9.]/g, '');
    
    // Always return price in rupees regardless of the currency parameter
    return `₹${cleanPrice}`;
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewProduct(prev => ({ ...prev, [name]: value }));
    
    // If width or height changes, update dimensions
    if (name === 'width' || name === 'height' || name === 'unit') {
      const { width, height, unit } = {
        ...newProduct,
        [name]: value
      };
      
      if (width && height) {
        setNewProduct(prev => ({
          ...prev,
          dimensions: `${width}x${height} ${unit}`
        }));
      }
    }
  };

  // Handle file selection for image upload
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      
      // Create preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle image upload
  const handleImageUpload = async () => {
    if (!selectedFile) {
      toast.error('Please select an image to upload');
      return;
    }

    try {
      setUploadingImage(true);
      
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('image', selectedFile);
      
      // Upload the image
      const response = await axios.post('/api/uploads/image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      // Set the image URL from response
      setNewProduct(prev => ({
        ...prev,
        imageUrl: response.data.imageUrl
      }));
      
      toast.success('Image uploaded successfully');
      setUploadingImage(false);
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Failed to upload image');
      setUploadingImage(false);
    }
  };

  // Reset file input
  const resetFileInput = () => {
    setSelectedFile(null);
    setPreviewUrl('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Handle form submission - Create Product
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      // Check if image is selected but not uploaded
      if (selectedFile && !newProduct.imageUrl) {
        // Upload the image first
        await handleImageUpload();
      }
      
      // Generate a unique ID
      const uniqueId = 'PROD_' + Date.now();
      
      // Add product to database
      const productData = {
        ...newProduct,
        id: uniqueId,
        price: formatPriceWithCurrency(newProduct.price, newProduct.currency)
      };
      
      await axios.post('/api/products/patterns', productData);
      
      // Refresh products list
      fetchProducts();
      
      // Close modal and reset form
      setShowAddModal(false);
      setNewProduct({
        name: '',
        code: '',
        type: '',
        material: 'cotton',
        color: '',
        dimensions: '',
        price: '',
        currency: 'INR',
        imageUrl: '',
        qualityGrade: 'premium',
        weight: '400',
        description: '',
        tags: ''
      });
      resetFileInput();
      
      toast.success('Product added successfully');
    } catch (error) {
      console.error('Error adding product:', error);
      toast.error('Failed to add product');
    }
  };

  // Handle Product Update
  const handleUpdateProduct = async (updatedProduct) => {
    try {
      await axios.put(`/api/products/patterns/${updatedProduct.id}`, updatedProduct);
      fetchProducts();
      setShowDetailsModal(false);
      setSelectedProduct(null);
      toast.success('Product updated successfully');
    } catch (error) {
      console.error('Error updating product:', error);
      toast.error('Failed to update product');
    }
  };

  // Handle Product Delete
  const handleDeleteProduct = async (productId) => {
    try {
      await axios.delete(`/api/products/patterns/${productId}`);
      fetchProducts();
      setShowDetailsModal(false);
      setSelectedProduct(null);
      toast.success('Product deleted successfully');
    } catch (error) {
      console.error('Error deleting product:', error);
      toast.error('Failed to delete product');
    }
  };

  // View Product Details
  const viewProductDetails = (product) => {
    setSelectedProduct(product);
    setShowDetailsModal(true);
  };

  // Filter products based on search query
  const filteredProducts = searchQuery 
    ? products.filter(product => 
        product.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.type?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : products;

  return (
    <div className="container mx-auto px-4 py-8">
      <PageHeader 
        title="Products Catalog" 
        description="Manage and view all products in your inventory"
      />
      
      {/* Search and Add Section */}
      <div className="flex flex-col sm:flex-row justify-between gap-4 mb-8">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <FaSearch className="text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full pl-10 pr-4 py-2 rounded-lg ${
              theme === 'dark' 
                ? 'bg-gray-800 text-white border-gray-700' 
                : 'bg-white text-gray-800 border-gray-300'
            } border focus:outline-none focus:ring-2 focus:ring-blue-500`}
          />
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <FaPlus /> Add New Product
        </button>
      </div>
      
      {/* Recently Added Products */}
      <div className={`mb-8 p-4 rounded-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'}`}>
        <h2 className="text-xl font-semibold mb-4">Recently Added Products</h2>
        {recentlyAdded.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {recentlyAdded.map(product => (
              <motion.div 
                key={product.id}
                whileHover={{ y: -5 }}
                className={`rounded-lg overflow-hidden shadow-md ${
                  theme === 'dark' ? 'bg-gray-700' : 'bg-white'
                } cursor-pointer`}
                onClick={() => viewProductDetails(product)}
              >
                <div className="aspect-square relative">
                  <img 
                    src={product.imageUrl} 
                    alt={product.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = 'https://via.placeholder.com/150?text=No+Image';
                    }}
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-20 transition-all flex items-center justify-center opacity-0 hover:opacity-100">
                    <FaEye className="text-white text-2xl" />
                  </div>
                </div>
                <div className="p-3">
                  <h3 className="font-medium truncate">{product.name}</h3>
                  <div className="flex justify-between items-center mt-1">
                    <p className="text-sm text-gray-500 truncate">{product.code}</p>
                    <p className="text-sm font-semibold text-blue-500">{formatPriceWithCurrency(product.price, product.currency)}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <p className="text-center text-gray-500">No products added yet</p>
        )}
      </div>
      
      {/* All Products */}
      <div className={`rounded-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'} p-4`}>
        <h2 className="text-xl font-semibold mb-4">All Products</h2>
        
        {loading ? (
          <div className="flex justify-center p-8">
            <LoadingSpinner />
          </div>
        ) : filteredProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {filteredProducts.map(product => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ y: -5, transition: { duration: 0.2 } }}
                className={`rounded-lg overflow-hidden shadow-md ${
                  theme === 'dark' ? 'bg-gray-700' : 'bg-white'
                } relative group`}
              >
                <div className="relative aspect-square">
                  <img 
                    src={product.imageUrl} 
                    alt={product.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = 'https://via.placeholder.com/150?text=No+Image';
                    }}
                  />
                  {product.type && (
                    <div className="absolute top-2 right-2 px-2 py-1 bg-blue-600 text-white text-xs rounded-full">
                      {product.type}
                    </div>
                  )}
                  
                  {/* Product Actions */}
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200">
                    <div className="flex gap-2">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          viewProductDetails(product);
                        }}
                        className="p-2 bg-blue-600 text-white rounded-full"
                      >
                        <FaEye />
                      </button>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedProduct(product);
                          setShowDetailsModal(true);
                          // Set timeout to trigger edit mode after modal opens
                          setTimeout(() => {
                            const editEvent = new CustomEvent('product-edit-trigger');
                            window.dispatchEvent(editEvent);
                          }, 300);
                        }}
                        className="p-2 bg-green-600 text-white rounded-full"
                      >
                        <FaEdit />
                      </button>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteProduct(product.id);
                        }}
                        className="p-2 bg-red-600 text-white rounded-full"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </div>
                </div>
                <div 
                  className="p-3 cursor-pointer"
                  onClick={() => viewProductDetails(product)}
                >
                  <h3 className="font-medium truncate">{product.name}</h3>
                  <div className="flex justify-between items-center mt-1">
                    <p className="text-sm text-gray-500 truncate">{product.code}</p>
                    <p className="text-sm font-semibold text-blue-500">{formatPriceWithCurrency(product.price, product.currency)}</p>
                  </div>
                  {(product.material || product.dimensions) && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {product.material && (
                        <span className="text-xs px-2 py-0.5 bg-gray-200 dark:bg-gray-600 rounded-full">
                          {product.material}
                        </span>
                      )}
                      {product.dimensions && (
                        <span className="text-xs px-2 py-0.5 bg-gray-200 dark:bg-gray-600 rounded-full">
                          {product.dimensions}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center p-8">
            <p className="text-gray-500">No products found matching your search</p>
          </div>
        )}
      </div>
      
      {/* Add Product Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div 
              className="fixed inset-0 transition-opacity" 
              onClick={() => setShowAddModal(false)}
            >
              <div className="absolute inset-0 bg-black opacity-75"></div>
            </div>
            
            <div 
              className={`inline-block align-bottom ${
                theme === 'dark' ? 'bg-gray-800' : 'bg-white'
              } rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full`}
            >
              <div className="px-4 pt-5 pb-4 sm:p-6 sm:pb-4 max-h-[80vh] overflow-y-auto">
                <h3 className="text-lg font-medium leading-6 mb-4">Add New Product</h3>
                
                <form onSubmit={handleSubmit}>
                  {/* Basic Details */}
                  <div className="mb-5">
                    <h4 className="text-sm font-semibold mb-3">Basic Details</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">Product Name</label>
                        <input
                          type="text"
                          name="name"
                          value={newProduct.name}
                          onChange={handleInputChange}
                          required
                          className={`w-full px-3 py-2 rounded-lg ${
                            theme === 'dark' 
                              ? 'bg-gray-700 text-white border-gray-600' 
                              : 'bg-white text-gray-800 border-gray-300'
                          } border focus:outline-none focus:ring-2 focus:ring-blue-500`}
                          placeholder="Enter product name"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Product Code</label>
                        <input
                          type="text"
                          name="code"
                          value={newProduct.code}
                          onChange={handleInputChange}
                          className={`w-full px-3 py-2 rounded-lg ${
                            theme === 'dark' 
                              ? 'bg-gray-700 text-white border-gray-600' 
                              : 'bg-white text-gray-800 border-gray-300'
                          } border focus:outline-none focus:ring-2 focus:ring-blue-500`}
                          placeholder="Enter product code (e.g. TOW-001)"
                        />
                      </div>
                    </div>
                  </div>
                  
                  {/* Price and Type */}
                  <div className="mb-5">
                    <h4 className="text-sm font-semibold mb-3">Price & Classification</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">Type</label>
                        <input
                          type="text"
                          name="type"
                          value={newProduct.type}
                          onChange={handleInputChange}
                          className={`w-full px-3 py-2 rounded-lg ${
                            theme === 'dark' 
                              ? 'bg-gray-700 text-white border-gray-600' 
                              : 'bg-white text-gray-800 border-gray-300'
                          } border focus:outline-none focus:ring-2 focus:ring-blue-500`}
                          placeholder="Product type (e.g. Towel, Sheet)"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Price</label>
                        <div className="flex gap-2">
                          <div className="relative flex-1">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                              {newProduct.currency === 'INR' ? '₹' : 
                               newProduct.currency === 'USD' ? '$' : 
                               newProduct.currency === 'EUR' ? '€' : '£'}
                            </span>
                            <input
                              type="text"
                              name="price"
                              value={newProduct.price}
                              onChange={handleInputChange}
                              className={`w-full pl-6 pr-3 py-2 rounded-lg ${
                                theme === 'dark' 
                                  ? 'bg-gray-700 text-white border-gray-600' 
                                  : 'bg-white text-gray-800 border-gray-300'
                              } border focus:outline-none focus:ring-2 focus:ring-blue-500`}
                              placeholder="0.00"
                            />
                          </div>
                          <select
                            name="currency"
                            value={newProduct.currency}
                            onChange={handleInputChange}
                            className={`w-20 px-2 py-2 rounded-lg ${
                              theme === 'dark' 
                                ? 'bg-gray-700 text-white border-gray-600' 
                                : 'bg-white text-gray-800 border-gray-300'
                            } border focus:outline-none focus:ring-2 focus:ring-blue-500`}
                          >
                            <option value="INR">₹</option>
                            <option value="USD">$</option>
                            <option value="EUR">€</option>
                            <option value="GBP">£</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Dimensions */}
                  <div className="mb-5">
                    <h4 className="text-sm font-semibold mb-3">Dimensions</h4>
                    <div className="grid grid-cols-6 gap-2">
                      <div className="col-span-2">
                        <label className="block text-sm font-medium mb-1">Width</label>
                        <input
                          type="text"
                          name="width"
                          onChange={handleInputChange}
                          className={`w-full px-3 py-2 rounded-lg ${
                            theme === 'dark' 
                              ? 'bg-gray-700 text-white border-gray-600' 
                              : 'bg-white text-gray-800 border-gray-300'
                          } border focus:outline-none focus:ring-2 focus:ring-blue-500`}
                          placeholder="Width"
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-sm font-medium mb-1">Height</label>
                        <input
                          type="text"
                          name="height"
                          onChange={handleInputChange}
                          className={`w-full px-3 py-2 rounded-lg ${
                            theme === 'dark' 
                              ? 'bg-gray-700 text-white border-gray-600' 
                              : 'bg-white text-gray-800 border-gray-300'
                          } border focus:outline-none focus:ring-2 focus:ring-blue-500`}
                          placeholder="Height"
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-sm font-medium mb-1">Unit</label>
                        <select
                          name="unit"
                          defaultValue="cm"
                          onChange={handleInputChange}
                          className={`w-full px-3 py-2 rounded-lg ${
                            theme === 'dark' 
                              ? 'bg-gray-700 text-white border-gray-600' 
                              : 'bg-white text-gray-800 border-gray-300'
                          } border focus:outline-none focus:ring-2 focus:ring-blue-500`}
                        >
                          <option value="cm">cm</option>
                          <option value="inches">inches</option>
                          <option value="mm">mm</option>
                        </select>
                      </div>
                      {newProduct.dimensions && (
                        <div className="col-span-6 mt-2">
                          <p className="text-xs text-gray-500">Dimensions: {newProduct.dimensions}</p>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Material & Quality */}
                  <div className="mb-5">
                    <h4 className="text-sm font-semibold mb-3">Material & Quality</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">Material</label>
                        <select
                          name="material"
                          value={newProduct.material}
                          onChange={handleInputChange}
                          className={`w-full px-3 py-2 rounded-lg ${
                            theme === 'dark' 
                              ? 'bg-gray-700 text-white border-gray-600' 
                              : 'bg-white text-gray-800 border-gray-300'
                          } border focus:outline-none focus:ring-2 focus:ring-blue-500`}
                        >
                          <option value="cotton">100% Cotton</option>
                          <option value="egyptian">Egyptian Cotton</option>
                          <option value="bamboo">Bamboo</option>
                          <option value="microfiber">Microfiber</option>
                          <option value="blend">Cotton Blend</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Color</label>
                        <input
                          type="text"
                          name="color"
                          value={newProduct.color}
                          onChange={handleInputChange}
                          className={`w-full px-3 py-2 rounded-lg ${
                            theme === 'dark' 
                              ? 'bg-gray-700 text-white border-gray-600' 
                              : 'bg-white text-gray-800 border-gray-300'
                          } border focus:outline-none focus:ring-2 focus:ring-blue-500`}
                          placeholder="Product color"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Quality Grade</label>
                        <select
                          name="qualityGrade"
                          value={newProduct.qualityGrade}
                          onChange={handleInputChange}
                          className={`w-full px-3 py-2 rounded-lg ${
                            theme === 'dark' 
                              ? 'bg-gray-700 text-white border-gray-600' 
                              : 'bg-white text-gray-800 border-gray-300'
                          } border focus:outline-none focus:ring-2 focus:ring-blue-500`}
                        >
                          <option value="premium">Premium</option>
                          <option value="standard">Standard</option>
                          <option value="economy">Economy</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Weight (GSM)</label>
                        <select
                          name="weight"
                          value={newProduct.weight}
                          onChange={handleInputChange}
                          className={`w-full px-3 py-2 rounded-lg ${
                            theme === 'dark' 
                              ? 'bg-gray-700 text-white border-gray-600' 
                              : 'bg-white text-gray-800 border-gray-300'
                          } border focus:outline-none focus:ring-2 focus:ring-blue-500`}
                        >
                          <option value="200">200 GSM</option>
                          <option value="300">300 GSM</option>
                          <option value="400">400 GSM</option>
                          <option value="500">500 GSM</option>
                          <option value="600">600 GSM</option>
                        </select>
                      </div>
                    </div>
                  </div>
                  
                  {/* Additional Information */}
                  <div className="mb-5">
                    <h4 className="text-sm font-semibold mb-3">Additional Information</h4>
                    <div className="grid grid-cols-1 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">Description</label>
                        <textarea
                          name="description"
                          value={newProduct.description}
                          onChange={handleInputChange}
                          rows="3"
                          className={`w-full px-3 py-2 rounded-lg ${
                            theme === 'dark' 
                              ? 'bg-gray-700 text-white border-gray-600' 
                              : 'bg-white text-gray-800 border-gray-300'
                          } border focus:outline-none focus:ring-2 focus:ring-blue-500`}
                          placeholder="Enter product description..."
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Tags</label>
                        <input
                          type="text"
                          name="tags"
                          value={newProduct.tags}
                          onChange={handleInputChange}
                          className={`w-full px-3 py-2 rounded-lg ${
                            theme === 'dark' 
                              ? 'bg-gray-700 text-white border-gray-600' 
                              : 'bg-white text-gray-800 border-gray-300'
                          } border focus:outline-none focus:ring-2 focus:ring-blue-500`}
                          placeholder="Enter tags separated by commas (e.g. soft, luxury, bathroom)"
                        />
                        {newProduct.tags && (
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {newProduct.tags.split(',').map((tag, index) => (
                              <span key={index} className="px-2 py-0.5 bg-gray-200 dark:bg-gray-600 rounded-full text-xs">
                                {tag.trim()}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Image Upload</label>
                        <div className={`border-2 border-dashed rounded-lg p-4 ${
                          theme === 'dark' 
                            ? 'bg-gray-700 border-gray-600' 
                            : 'bg-gray-50 border-gray-300'
                        } ${previewUrl ? 'border-blue-500' : ''}`}>
                          
                          {previewUrl ? (
                            <div className="relative">
                              <img 
                                src={previewUrl} 
                                alt="Preview" 
                                className="w-full h-40 object-contain rounded-md mb-2"
                              />
                              <button
                                type="button"
                                onClick={resetFileInput}
                                className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full text-xs"
                              >
                                <FaTrash size={12} />
                              </button>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center justify-center py-3">
                              <FaImage className="text-gray-400 text-4xl mb-2" />
                              <p className="text-sm text-gray-500 mb-2">Click to select or drag and drop an image</p>
                            </div>
                          )}

                          <div className="flex justify-center">
                            <input
                              type="file"
                              ref={fileInputRef}
                              className="hidden"
                              accept="image/*"
                              onChange={handleFileSelect}
                            />
                            
                            {!previewUrl ? (
                              <button
                                type="button"
                                onClick={() => fileInputRef.current.click()}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm flex items-center"
                              >
                                <FaUpload className="mr-2" /> Select Image
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={handleImageUpload}
                                disabled={uploadingImage || newProduct.imageUrl}
                                className={`px-4 py-2 rounded-lg text-sm flex items-center ${
                                  uploadingImage 
                                    ? 'bg-gray-500 text-white'
                                    : newProduct.imageUrl
                                      ? 'bg-green-600 text-white'
                                      : 'bg-blue-600 text-white hover:bg-blue-700'
                                } transition-colors`}
                              >
                                {uploadingImage ? (
                                  <>
                                    <div className="mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    Uploading...
                                  </>
                                ) : newProduct.imageUrl ? (
                                  <>Uploaded Successfully</>
                                ) : (
                                  <><FaUpload className="mr-2" /> Upload Image</>
                                )}
                              </button>
                            )}
                          </div>
                          
                          {newProduct.imageUrl && (
                            <p className="text-xs text-green-500 mt-2 text-center">
                              Image uploaded successfully!
                            </p>
                          )}
                        </div>
                        
                        {/* Hidden Image URL field for compatibility */}
                        <input
                          type="hidden"
                          name="imageUrl"
                          value={newProduct.imageUrl}
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-end gap-3 mt-6">
                    <button
                      type="button"
                      onClick={() => setShowAddModal(false)}
                      className="px-4 py-2 rounded-lg bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                    >
                      Add Product
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Product Details Modal */}
      <ProductDetailsModal
        show={showDetailsModal}
        product={selectedProduct}
        onClose={() => {
          setShowDetailsModal(false);
          setSelectedProduct(null);
        }}
        onUpdate={handleUpdateProduct}
        onDelete={handleDeleteProduct}
      />
    </div>
  );
};

export default ProductsPage; 