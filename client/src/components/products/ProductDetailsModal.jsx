import React, { useState, useContext, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaEdit, FaTrash, FaSave, FaTimes, FaSearchPlus, FaSearchMinus, FaDownload } from 'react-icons/fa';
import { ThemeContext } from '../../context/ThemeProvider';
import { getImageUrl, handleImageError } from '../../utils/imageUtils';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

const ProductDetailsModal = ({ show, product, onClose, onUpdate, onDelete }) => {
  const { theme } = useContext(ThemeContext);
  const [isEditing, setIsEditing] = useState(false);
  const [editedProduct, setEditedProduct] = useState({});
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [activeTab, setActiveTab] = useState('details');
  
  // Split dimensions for editing
  const [editWidth, setEditWidth] = useState('');
  const [editHeight, setEditHeight] = useState('');
  const [editUnit, setEditUnit] = useState('cm');
  
  // Image zoom and pan functionality
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [showZoomControls, setShowZoomControls] = useState(false);
  const imageContainerRef = useRef(null);
  
  // Reset state when product changes
  useEffect(() => {
    if (product) {
      setEditedProduct({ ...product });
      
      // Extract width, height, and unit from dimensions if available
      if (product.dimensions) {
        const match = product.dimensions.match(/(\d+)x(\d+)\s*([a-z]+)?/i);
        if (match) {
          setEditWidth(match[1]);
          setEditHeight(match[2]);
          setEditUnit(match[3]?.toLowerCase() || 'cm');
        }
      }
    }
    setIsEditing(false);
    setConfirmDelete(false);
    setActiveTab('details');
    // Reset zoom and position
    setScale(1);
    setPosition({ x: 0, y: 0 });
  }, [product]);
  
  // Update dimensions when width/height/unit change
  useEffect(() => {
    if (editWidth && editHeight && isEditing) {
      setEditedProduct(prev => ({
        ...prev,
        width: editWidth,
        height: editHeight,
        unit: editUnit,
        dimensions: `${editWidth}x${editHeight} ${editUnit}`
      }));
    }
  }, [editWidth, editHeight, editUnit, isEditing]);
  
  // Format price with currency symbol
  const formatPrice = (price) => {
    if (!price) return '₹0';
    
    // Remove any existing currency symbols and spaces
    const cleanPrice = price.replace(/[^0-9.]/g, '');
    
    // Get currency from product or default to INR
    const currency = editedProduct.currency || 'INR';
    
    const currencySymbol = {
      'INR': '₹',
      'USD': '$',
      'EUR': '€',
      'GBP': '£'
    }[currency] || '₹';
    
    return `${currencySymbol}${cleanPrice}`;
  };
  
  if (!show || !product) return null;
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditedProduct(prev => ({ ...prev, [name]: value }));
  };

  // Handle price input separately to clean it
  const handlePriceChange = (e) => {
    const numericValue = e.target.value.replace(/[^0-9.]/g, '');
    setEditedProduct(prev => ({ ...prev, price: numericValue }));
  };
  
  // Handle currency change
  const handleCurrencyChange = (e) => {
    setEditedProduct(prev => ({ ...prev, currency: e.target.value }));
  };
  
  const handleSaveChanges = () => {
    // Format price before saving
    const formattedProduct = {
      ...editedProduct,
      price: formatPrice(editedProduct.price),
      dimensions: `${editWidth}x${editHeight} ${editUnit}`
    };
    
    // Handle tags properly (convert to array if it's a string)
    if (typeof formattedProduct.tags === 'string') {
      formattedProduct.tags = formattedProduct.tags.split(',').map(tag => tag.trim());
    }
    
    onUpdate(formattedProduct);
    setIsEditing(false);
  };
  
  const handleDeleteConfirm = () => {
    if (confirmDelete) {
      onDelete(product.id);
    } else {
      setConfirmDelete(true);
    }
  };
  
  // Handle zoom with scroll wheel
  const handleWheel = (e) => {
    if (isEditing) return;
    
    e.preventDefault();
    const delta = e.deltaY * -0.01;
    const newScale = Math.min(Math.max(scale + delta, 1), 5); // Limit zoom between 1x and 5x
    setScale(newScale);
  };
  
  // Start dragging
  const handleMouseDown = (e) => {
    if (scale === 1 || isEditing) return;
    
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });
  };
  
  // While dragging
  const handleMouseMove = (e) => {
    if (!isDragging || isEditing) return;
    
    const x = e.clientX - dragStart.x;
    const y = e.clientY - dragStart.y;
    
    // Calculate bounds to prevent dragging outside the container
    const containerRect = imageContainerRef.current.getBoundingClientRect();
    const maxX = containerRect.width * (scale - 1) / 2;
    const maxY = containerRect.height * (scale - 1) / 2;
    
    setPosition({
      x: Math.min(Math.max(x, -maxX), maxX),
      y: Math.min(Math.max(y, -maxY), maxY)
    });
  };
  
  // End dragging
  const handleMouseUp = () => {
    setIsDragging(false);
  };
  
  // Reset zoom and position
  const resetZoom = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };
  
  // Zoom in
  const zoomIn = () => {
    setScale(Math.min(scale + 0.5, 5));
  };
  
  // Zoom out
  const zoomOut = () => {
    const newScale = Math.max(scale - 0.5, 1);
    setScale(newScale);
    
    // If scale becomes 1, reset position
    if (newScale === 1) {
      setPosition({ x: 0, y: 0 });
    }
  };

  // Format tags for display
  const displayTags = (tags) => {
    if (!tags) return [];
    
    // Handle both string and array formats
    if (Array.isArray(tags)) {
      return tags;
    }
    
    return tags.split(',').map(tag => tag.trim());
  };
  
  // Get quality grade display
  const getQualityGradeDisplay = (grade) => {
    switch (grade) {
      case 'premium': return { label: 'Premium', color: 'bg-blue-500/20 text-blue-400' };
      case 'standard': return { label: 'Standard', color: 'bg-green-500/20 text-green-400' };
      case 'economy': return { label: 'Economy', color: 'bg-yellow-500/20 text-yellow-400' };
      default: return { label: 'Premium', color: 'bg-blue-500/20 text-blue-400' };
    }
  };
  
  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown';
    
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };
  
  // Get tab class
  const getTabClass = (tabName) => {
    return activeTab === tabName 
      ? 'border-b-2 border-blue-500 text-blue-500' 
      : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200';
  };

  // Format dimensions
  const formatDimensions = (dimensions, width, height, unit) => {
    if (width && height) {
      return `${width} × ${height} ${unit || 'cm'}`;
    }
    return dimensions || 'Not specified';
  };

  // Weight display with GSM
  const formatWeight = (weight) => {
    if (!weight) return 'Not specified';
    return `${weight} GSM`;
  };
  
  // Export product data as zip file
  const exportProductData = async () => {
    try {
      // Create a new zip file
      const zip = new JSZip();
      
      // Add product details as text file
      const productDetails = [
        `Product Name: ${product.name || 'Not specified'}`,
        `Product Code: ${product.code || 'Not specified'}`,
        `Price: ${formatPrice(product.price)}`,
        `Dimensions: ${formatDimensions(product.dimensions, product.width, product.height, product.unit)}`,
        `Weight: ${formatWeight(product.weight)}`,
        `Material: ${product.material || 'Not specified'}`,
        `Color: ${product.color || 'Not specified'}`,
        `Type: ${product.type || 'Not specified'}`,
        `Quality Grade: ${product.qualityGrade ? getQualityGradeDisplay(product.qualityGrade).label : 'Not specified'}`,
        `Created At: ${formatDate(product.createdAt)}`,
        `Tags: ${Array.isArray(product.tags) ? product.tags.join(', ') : (product.tags || 'None')}`,
        `\nDescription:\n${product.description || 'No description available.'}`
      ].join('\n');
      
      zip.file(`${product.name || 'product'}_details.txt`, productDetails);
      
      // Fetch and add the product image
      const imageUrl = getImageUrl(product.imageUrl || product.image || `/api/products/images/${product._id}`);
      const response = await fetch(imageUrl);
      if (!response.ok) throw new Error('Failed to fetch image');
      
      const imageBlob = await response.blob();
      const imageExtension = imageBlob.type.split('/')[1] || 'jpg';
      zip.file(`${product.name || 'product'}_image.${imageExtension}`, imageBlob);
      
      // Generate and save the zip file
      const zipContent = await zip.generateAsync({ type: 'blob' });
      saveAs(zipContent, `${product.name || 'product'}_export.zip`);
    } catch (error) {
      console.error('Error exporting product data:', error);
      alert('Failed to export product data. Please try again.');
    }
  };
  
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen p-4">
        <div 
          className="fixed inset-0 transition-opacity" 
          onClick={() => {
            if (!isEditing) onClose();
          }}
        >
          <div className="absolute inset-0 bg-black opacity-75"></div>
        </div>
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className={`relative rounded-lg overflow-hidden shadow-xl max-w-4xl w-full mx-auto flex flex-col md:flex-row ${
            theme === 'dark' ? 'bg-gray-800' : 'bg-white'
          }`}
        >
          {/* Image Section */}
          <div 
            className="md:w-2/5 relative bg-[#1A1D24]" 
            ref={imageContainerRef}
            onMouseEnter={() => setShowZoomControls(true)}
            onMouseLeave={() => {
              setShowZoomControls(false);
              handleMouseUp();
            }}
            onWheel={handleWheel}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            style={{ 
              overflow: 'hidden',
              cursor: scale > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default'
            }}
          >
            <div 
              style={{
                transform: `scale(${scale}) translate(${position.x / scale}px, ${position.y / scale}px)`,
                transformOrigin: 'center',
                transition: isDragging ? 'none' : 'transform 0.2s ease-out',
                height: '100%'
              }}
            >
              <img 
                src={getImageUrl(product.imageUrl || product.image || `/api/products/images/${product._id}`)} 
                alt={product.name} 
                className="w-full h-full object-cover"
                style={{ pointerEvents: 'none' }}
                onError={(e) => handleImageError(e, 'large')}
              />
            </div>
            
            {product.type && (
              <div className="absolute top-4 left-4 px-3 py-1 bg-blue-600 text-white text-sm rounded-full shadow-lg z-10">
                {product.type}
              </div>
            )}
            
            {!isEditing && (
              <div className="absolute bottom-4 left-4 px-3 py-1 bg-blue-600 text-white text-sm rounded-lg shadow-lg z-10">
                {formatPrice(product.price)}
              </div>
            )}
            
            {/* Zoom controls */}
            {showZoomControls && !isEditing && (
              <div className="absolute bottom-4 right-4 flex flex-col gap-2 z-10">
                <button 
                  onClick={zoomIn}
                  className="p-2 bg-black/50 rounded-full text-white hover:bg-black/70 transition-colors"
                >
                  <FaSearchPlus size={14} />
                </button>
                <button 
                  onClick={zoomOut}
                  className={`p-2 rounded-full text-white transition-colors ${
                    scale > 1 ? 'bg-black/50 hover:bg-black/70' : 'bg-black/30 cursor-not-allowed'
                  }`}
                  disabled={scale === 1}
                >
                  <FaSearchMinus size={14} />
                </button>
                {scale > 1 && (
                  <button 
                    onClick={resetZoom}
                    className="p-2 bg-black/50 rounded-full text-white hover:bg-black/70 transition-colors"
                  >
                    <FaTimes size={14} />
                  </button>
                )}
              </div>
            )}
          </div>
          
          {/* Details Section */}
          <div className="md:w-3/5 p-6 overflow-y-auto max-h-[80vh] md:max-h-[600px]">
            <div className="flex justify-between items-start mb-4">
              <h2 className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
                {product.name}
              </h2>
              <div className="flex gap-2">
                {!isEditing ? (
                  <>
                    <button
                      onClick={exportProductData}
                      className="p-2 rounded-full text-green-500 hover:bg-green-50 dark:hover:bg-gray-700 transition-colors"
                      title="Export product data"
                    >
                      <FaDownload size={18} />
                    </button>
                    <button
                      onClick={() => setIsEditing(true)}
                      className="p-2 rounded-full text-blue-500 hover:bg-blue-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      <FaEdit size={18} />
                    </button>
                    <button
                      onClick={handleDeleteConfirm}
                      className={`p-2 rounded-full ${
                        confirmDelete 
                          ? 'text-white bg-red-500 hover:bg-red-600' 
                          : 'text-red-500 hover:bg-red-50 dark:hover:bg-gray-700'
                      } transition-colors`}
                    >
                      <FaTrash size={18} />
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={handleSaveChanges}
                      className="p-2 rounded-full text-green-500 hover:bg-green-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      <FaSave size={18} />
                    </button>
                    <button
                      onClick={() => {
                        setIsEditing(false);
                        setEditedProduct({ ...product });
                        // Reset dimensions fields
                        if (product.dimensions) {
                          const match = product.dimensions.match(/(\d+)x(\d+)\s*([a-z]+)?/i);
                          if (match) {
                            setEditWidth(match[1]);
                            setEditHeight(match[2]);
                            setEditUnit(match[3] || 'cm');
                          }
                        }
                      }}
                      className="p-2 rounded-full text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      <FaTimes size={18} />
                    </button>
                  </>
                )}
              </div>
            </div>
            
            {/* Status Cards Row */}
            <div className="flex flex-wrap gap-2 mb-6">
              {product.code && (
                <div className={`px-3 py-1 rounded-full text-sm ${
                  theme === 'dark' ? 'bg-gray-700 text-white' : 'bg-gray-200 text-gray-700'
                }`}>
                  Code: {product.code}
                </div>
              )}
              
              {product.qualityGrade && (
                <div className={`px-3 py-1 rounded-full text-sm ${
                  getQualityGradeDisplay(product.qualityGrade).color
                }`}>
                  {getQualityGradeDisplay(product.qualityGrade).label}
                </div>
              )}
              
              {product.material && (
                <div className={`px-3 py-1 rounded-full text-sm ${
                  theme === 'dark' ? 'bg-gray-700 text-white' : 'bg-gray-200 text-gray-700'
                }`}>
                  {product.material}
                </div>
              )}
            </div>
            
            {/* Navigation Tabs */}
            <div className="border-b border-gray-200 dark:border-gray-700 mb-4">
              <div className="flex space-x-8">
                <button
                  onClick={() => setActiveTab('details')}
                  className={`py-2 px-1 font-medium ${getTabClass('details')}`}
                >
                  Details
                </button>
                
                <button
                  onClick={() => setActiveTab('description')}
                  className={`py-2 px-1 font-medium ${getTabClass('description')}`}
                >
                  Description
                </button>
                
                {(product.prompt || product.seed) && (
                  <button
                    onClick={() => setActiveTab('generation')}
                    className={`py-2 px-1 font-medium ${getTabClass('generation')}`}
                  >
                    Generation
                  </button>
                )}
              </div>
            </div>
            
            {/* Tab Content */}
            <AnimatePresence mode="wait">
              {activeTab === 'details' && (
                <motion.div
                  key="details"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-4"
                >
                  {/* Grid Layout for Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Price */}
                    <div className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'}`}>
                      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Price</h3>
                      {isEditing ? (
                        <div className="flex space-x-2">
                          <div className="relative flex-1">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <span className={theme === 'dark' ? 'text-gray-300' : 'text-gray-500'}>
                                {editedProduct.currency === 'USD' ? '$' : 
                                 editedProduct.currency === 'EUR' ? '€' : 
                                 editedProduct.currency === 'GBP' ? '£' : '₹'}
                              </span>
                            </div>
                            <input
                              type="text"
                              value={editedProduct.price?.replace(/[^0-9.]/g, '') || ''}
                              onChange={handlePriceChange}
                              className={`w-full pl-8 pr-3 py-2 rounded ${
                                theme === 'dark' ? 'bg-gray-600 text-white' : 'bg-white text-gray-800'
                              } border ${theme === 'dark' ? 'border-gray-600' : 'border-gray-300'}`}
                              placeholder="0.00"
                            />
                          </div>
                          <select
                            value={editedProduct.currency || 'INR'}
                            onChange={handleCurrencyChange}
                            className={`px-3 py-2 rounded ${
                              theme === 'dark' ? 'bg-gray-600 text-white' : 'bg-white text-gray-800'
                            } border ${theme === 'dark' ? 'border-gray-600' : 'border-gray-300'}`}
                          >
                            <option value="INR">₹ INR</option>
                            <option value="USD">$ USD</option>
                            <option value="EUR">€ EUR</option>
                            <option value="GBP">£ GBP</option>
                          </select>
                        </div>
                      ) : (
                        <p className="font-semibold text-lg">{formatPrice(product.price)}</p>
                      )}
                    </div>
                    
                    {/* Dimensions */}
                    <div className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'}`}>
                      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Dimensions</h3>
                      {isEditing ? (
                        <div className="grid grid-cols-10 gap-2 items-center">
                          <input
                            type="text"
                            value={editWidth}
                            onChange={(e) => setEditWidth(e.target.value)}
                            className={`col-span-4 px-3 py-2 rounded ${
                              theme === 'dark' ? 'bg-gray-600 text-white' : 'bg-white text-gray-800'
                            } border ${theme === 'dark' ? 'border-gray-600' : 'border-gray-300'}`}
                            placeholder="Width"
                          />
                          <span className="col-span-2 flex items-center justify-center">×</span>
                          <input
                            type="text"
                            value={editHeight}
                            onChange={(e) => setEditHeight(e.target.value)}
                            className={`col-span-4 px-3 py-2 rounded ${
                              theme === 'dark' ? 'bg-gray-600 text-white' : 'bg-white text-gray-800'
                            } border ${theme === 'dark' ? 'border-gray-600' : 'border-gray-300'}`}
                            placeholder="Height"
                          />
                          <select
                            value={editUnit}
                            onChange={(e) => setEditUnit(e.target.value)}
                            className={`col-span-10 mt-2 px-3 py-2 rounded ${
                              theme === 'dark' ? 'bg-gray-600 text-white' : 'bg-white text-gray-800'
                            } border ${theme === 'dark' ? 'border-gray-600' : 'border-gray-300'}`}
                          >
                            <option value="cm">cm</option>
                            <option value="inches">inches</option>
                            <option value="mm">mm</option>
                          </select>
                        </div>
                      ) : (
                        <p className="font-semibold">
                          {formatDimensions(product.dimensions, product.width, product.height, product.unit)}
                        </p>
                      )}
                    </div>
                    
                    {/* Weight */}
                    <div className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'}`}>
                      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Weight</h3>
                      {isEditing ? (
                        <select
                          name="weight"
                          value={editedProduct.weight || '400'}
                          onChange={handleInputChange}
                          className={`w-full px-3 py-2 rounded ${
                            theme === 'dark' ? 'bg-gray-600 text-white' : 'bg-white text-gray-800'
                          } border ${theme === 'dark' ? 'border-gray-600' : 'border-gray-300'}`}
                        >
                          <option value="200">200 GSM</option>
                          <option value="300">300 GSM</option>
                          <option value="400">400 GSM</option>
                          <option value="500">500 GSM</option>
                          <option value="600">600 GSM</option>
                        </select>
                      ) : (
                        <p className="font-semibold">{formatWeight(product.weight)}</p>
                      )}
                    </div>
                    
                    {/* Material */}
                    <div className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'}`}>
                      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Material</h3>
                      {isEditing ? (
                        <input
                          type="text"
                          name="material"
                          value={editedProduct.material || ''}
                          onChange={handleInputChange}
                          className={`w-full px-3 py-2 rounded ${
                            theme === 'dark' ? 'bg-gray-600 text-white' : 'bg-white text-gray-800'
                          } border ${theme === 'dark' ? 'border-gray-600' : 'border-gray-300'}`}
                          placeholder="e.g. 100% Cotton"
                        />
                      ) : (
                        <p className="font-semibold">{product.material || 'Not specified'}</p>
                      )}
                    </div>
                    
                    {/* Color */}
                    <div className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'}`}>
                      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Color</h3>
                      {isEditing ? (
                        <input
                          type="text"
                          name="color"
                          value={editedProduct.color || ''}
                          onChange={handleInputChange}
                          className={`w-full px-3 py-2 rounded ${
                            theme === 'dark' ? 'bg-gray-600 text-white' : 'bg-white text-gray-800'
                          } border ${theme === 'dark' ? 'border-gray-600' : 'border-gray-300'}`}
                          placeholder="e.g. Blue, Red, etc."
                        />
                      ) : (
                        <p className="font-semibold">{product.color || 'Not specified'}</p>
                      )}
                    </div>
                    
                    {/* Type */}
                    <div className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'}`}>
                      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Type</h3>
                      {isEditing ? (
                        <input
                          type="text"
                          name="type"
                          value={editedProduct.type || ''}
                          onChange={handleInputChange}
                          className={`w-full px-3 py-2 rounded ${
                            theme === 'dark' ? 'bg-gray-600 text-white' : 'bg-white text-gray-800'
                          } border ${theme === 'dark' ? 'border-gray-600' : 'border-gray-300'}`}
                          placeholder="e.g. Bath Towel, Hand Towel"
                        />
                      ) : (
                        <p className="font-semibold">{product.type || 'Not specified'}</p>
                      )}
                    </div>
                    
                    {/* Quality Grade */}
                    <div className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'}`}>
                      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Quality Grade</h3>
                      {isEditing ? (
                        <select
                          name="qualityGrade"
                          value={editedProduct.qualityGrade || 'premium'}
                          onChange={handleInputChange}
                          className={`w-full px-3 py-2 rounded ${
                            theme === 'dark' ? 'bg-gray-600 text-white' : 'bg-white text-gray-800'
                          } border ${theme === 'dark' ? 'border-gray-600' : 'border-gray-300'}`}
                        >
                          <option value="premium">Premium</option>
                          <option value="standard">Standard</option>
                          <option value="economy">Economy</option>
                        </select>
                      ) : (
                        <p className="font-semibold capitalize">{product.qualityGrade || 'Not specified'}</p>
                      )}
                    </div>
                    
                    {/* Created At */}
                    <div className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'}`}>
                      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Created At</h3>
                      <p className="font-semibold">{formatDate(product.createdAt)}</p>
                    </div>
                  </div>
                  
                  {/* Tags */}
                  <div className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'}`}>
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Tags</h3>
                    {isEditing ? (
                      <div>
                        <input
                          type="text"
                          name="tags"
                          value={typeof editedProduct.tags === 'string' ? editedProduct.tags : (Array.isArray(editedProduct.tags) ? editedProduct.tags.join(', ') : '')}
                          onChange={handleInputChange}
                          className={`w-full px-3 py-2 rounded ${
                            theme === 'dark' ? 'bg-gray-600 text-white' : 'bg-white text-gray-800'
                          } border ${theme === 'dark' ? 'border-gray-600' : 'border-gray-300'}`}
                          placeholder="Enter tags separated by commas (e.g. soft, luxury, bathroom)"
                        />
                        {editedProduct.tags && (
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {displayTags(editedProduct.tags).map((tag, index) => (
                              <span key={index} className={`px-2 py-1 rounded-full text-xs ${
                                theme === 'dark' ? 'bg-gray-600 text-white' : 'bg-gray-200 text-gray-800'
                              }`}>
                                {tag.trim()}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div>
                        {product.tags && product.tags.length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {displayTags(product.tags).map((tag, index) => (
                              <span key={index} className={`px-3 py-1 rounded-full text-sm ${
                                theme === 'dark' ? 'bg-gray-600 text-white' : 'bg-gray-200 text-gray-800'
                              }`}>
                                {tag.trim()}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <p className="text-gray-500 dark:text-gray-400">No tags available.</p>
                        )}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
              
              {activeTab === 'description' && (
                <motion.div
                  key="description"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'}`}
                >
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Description</h3>
                  {isEditing ? (
                    <textarea
                      name="description"
                      value={editedProduct.description || ''}
                      onChange={handleInputChange}
                      rows="5"
                      className={`w-full px-3 py-2 rounded ${
                        theme === 'dark' ? 'bg-gray-600 text-white' : 'bg-white text-gray-800'
                      } border ${theme === 'dark' ? 'border-gray-600' : 'border-gray-300'}`}
                      placeholder="Enter product description..."
                    />
                  ) : (
                    <p className={`whitespace-pre-line ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                      {product.description || 'No description available.'}
                    </p>
                  )}
                </motion.div>
              )}
              
              {activeTab === 'generation' && (
                <motion.div
                  key="generation"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-4"
                >
                  {/* Prompt */}
                  <div className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'}`}>
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Generation Prompt</h3>
                    {isEditing ? (
                      <textarea
                        name="prompt"
                        value={editedProduct.prompt || ''}
                        onChange={handleInputChange}
                        rows="4"
                        className={`w-full px-3 py-2 rounded ${
                          theme === 'dark' ? 'bg-gray-600 text-white' : 'bg-white text-gray-800'
                        } border ${theme === 'dark' ? 'border-gray-600' : 'border-gray-300'}`}
                        placeholder="Enter image generation prompt..."
                      />
                    ) : (
                      <p className={`whitespace-pre-line ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                        {product.prompt || 'No prompt available.'}
                      </p>
                    )}
                  </div>
                  
                  {/* Seed */}
                  <div className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'}`}>
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Seed Value</h3>
                    {isEditing ? (
                      <input
                        type="text"
                        name="seed"
                        value={editedProduct.seed || ''}
                        onChange={handleInputChange}
                        className={`w-full px-3 py-2 rounded ${
                          theme === 'dark' ? 'bg-gray-600 text-white' : 'bg-white text-gray-800'
                        } border ${theme === 'dark' ? 'border-gray-600' : 'border-gray-300'}`}
                        placeholder="Enter seed value"
                      />
                    ) : (
                      <p className={`font-mono ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                        {product.seed || 'No seed value available.'}
                      </p>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ProductDetailsModal; 