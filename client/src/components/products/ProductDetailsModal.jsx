import React, { useState, useContext, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { FaEdit, FaTrash, FaSave, FaTimes, FaSearchPlus, FaSearchMinus } from 'react-icons/fa';
import { ThemeContext } from '../../context/ThemeProvider';

const ProductDetailsModal = ({ show, product, onClose, onUpdate, onDelete }) => {
  const { theme } = useContext(ThemeContext);
  const [isEditing, setIsEditing] = useState(false);
  const [editedProduct, setEditedProduct] = useState({});
  const [confirmDelete, setConfirmDelete] = useState(false);
  
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
    }
    setIsEditing(false);
    setConfirmDelete(false);
    // Reset zoom and position
    setScale(1);
    setPosition({ x: 0, y: 0 });
  }, [product]);
  
  // Format price with Rupee symbol
  const formatPrice = (price) => {
    if (!price) return '₹0';
    // Remove any existing currency symbols and spaces
    const cleanPrice = price.replace(/[^0-9.]/g, '');
    return `₹${cleanPrice}`;
  };
  
  if (!show || !product) return null;
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditedProduct(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSaveChanges = () => {
    // Format price before saving
    const formattedProduct = {
      ...editedProduct,
      price: formatPrice(editedProduct.price)
    };
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
            className="md:w-2/5 relative" 
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
                src={product.imageUrl} 
                alt={product.name} 
                className="w-full h-full object-cover"
                style={{ pointerEvents: 'none' }}
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = 'https://via.placeholder.com/400x600?text=No+Image';
                }}
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
              <div className="absolute top-4 right-4 flex flex-col gap-2 z-10">
                <button 
                  onClick={zoomIn}
                  className="p-2 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-70 transition-colors"
                >
                  <FaSearchPlus />
                </button>
                <button 
                  onClick={zoomOut}
                  className="p-2 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-70 transition-colors"
                  disabled={scale === 1}
                >
                  <FaSearchMinus />
                </button>
                {scale > 1 && (
                  <button 
                    onClick={resetZoom}
                    className="p-2 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-70 transition-colors text-xs"
                  >
                    Reset
                  </button>
                )}
              </div>
            )}
            
            {/* Zoom indicator */}
            {scale > 1 && !isEditing && (
              <div className="absolute bottom-4 right-4 px-2 py-1 bg-black bg-opacity-50 text-white text-xs rounded-lg">
                {Math.round(scale * 100)}%
              </div>
            )}
          </div>
          
          {/* Details Section */}
          <div className="md:w-3/5 p-6 flex flex-col">
            <div className="flex justify-between items-start mb-4">
              <div>
                {isEditing ? (
                  <input
                    type="text"
                    name="name"
                    value={editedProduct.name || ''}
                    onChange={handleInputChange}
                    className={`text-xl font-bold w-full px-2 py-1 rounded ${
                      theme === 'dark' ? 'bg-gray-700 text-white' : 'bg-gray-100'
                    }`}
                  />
                ) : (
                  <h2 className="text-2xl font-bold">{product.name}</h2>
                )}
                
                {isEditing ? (
                  <input
                    type="text"
                    name="code"
                    value={editedProduct.code || ''}
                    onChange={handleInputChange}
                    className={`text-sm mt-1 w-full px-2 py-1 rounded ${
                      theme === 'dark' ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'
                    }`}
                    placeholder="Product Code"
                  />
                ) : (
                  <p className="text-sm text-gray-500">{product.code}</p>
                )}
              </div>
              
              <div className="flex gap-2">
                {isEditing ? (
                  <>
                    <button 
                      onClick={handleSaveChanges}
                      className="p-2 bg-green-600 text-white rounded-lg"
                    >
                      <FaSave />
                    </button>
                    <button 
                      onClick={() => {
                        setIsEditing(false);
                        setEditedProduct({ ...product });
                      }}
                      className="p-2 bg-gray-500 text-white rounded-lg"
                    >
                      <FaTimes />
                    </button>
                  </>
                ) : (
                  <>
                    <button 
                      onClick={() => setIsEditing(true)}
                      className="p-2 bg-blue-600 text-white rounded-lg"
                    >
                      <FaEdit />
                    </button>
                    <button 
                      onClick={handleDeleteConfirm}
                      className={`p-2 ${confirmDelete ? 'bg-red-700' : 'bg-red-600'} text-white rounded-lg`}
                    >
                      <FaTrash />
                    </button>
                  </>
                )}
              </div>
            </div>
            
            {/* Product Details Form */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              {/* Price */}
              <div>
                <label className="block text-sm font-medium mb-1">Price</label>
                {isEditing ? (
                  <input
                    type="text"
                    name="price"
                    value={editedProduct.price?.replace('₹', '') || ''}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 rounded-lg ${
                      theme === 'dark' 
                        ? 'bg-gray-700 text-white border-gray-600' 
                        : 'bg-white text-gray-800 border-gray-300'
                    } border focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  />
                ) : (
                  <div className={`px-3 py-2 rounded-lg ${
                    theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'
                  }`}>
                    {formatPrice(product.price)}
                  </div>
                )}
              </div>
              
              {/* Type */}
              <div>
                <label className="block text-sm font-medium mb-1">Type</label>
                {isEditing ? (
                  <input
                    type="text"
                    name="type"
                    value={editedProduct.type || ''}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 rounded-lg ${
                      theme === 'dark' 
                        ? 'bg-gray-700 text-white border-gray-600' 
                        : 'bg-white text-gray-800 border-gray-300'
                    } border focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  />
                ) : (
                  <div className={`px-3 py-2 rounded-lg ${
                    theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'
                  }`}>
                    {product.type || 'Not specified'}
                  </div>
                )}
              </div>
              
              {/* Material */}
              <div>
                <label className="block text-sm font-medium mb-1">Material</label>
                {isEditing ? (
                  <input
                    type="text"
                    name="material"
                    value={editedProduct.material || ''}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 rounded-lg ${
                      theme === 'dark' 
                        ? 'bg-gray-700 text-white border-gray-600' 
                        : 'bg-white text-gray-800 border-gray-300'
                    } border focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  />
                ) : (
                  <div className={`px-3 py-2 rounded-lg ${
                    theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'
                  }`}>
                    {product.material || 'Not specified'}
                  </div>
                )}
              </div>
              
              {/* Color */}
              <div>
                <label className="block text-sm font-medium mb-1">Color</label>
                {isEditing ? (
                  <input
                    type="text"
                    name="color"
                    value={editedProduct.color || ''}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 rounded-lg ${
                      theme === 'dark' 
                        ? 'bg-gray-700 text-white border-gray-600' 
                        : 'bg-white text-gray-800 border-gray-300'
                    } border focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  />
                ) : (
                  <div className={`px-3 py-2 rounded-lg ${
                    theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'
                  }`}>
                    {product.color || 'Not specified'}
                  </div>
                )}
              </div>
              
              {/* Dimensions */}
              <div>
                <label className="block text-sm font-medium mb-1">Dimensions</label>
                {isEditing ? (
                  <input
                    type="text"
                    name="dimensions"
                    value={editedProduct.dimensions || ''}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 rounded-lg ${
                      theme === 'dark' 
                        ? 'bg-gray-700 text-white border-gray-600' 
                        : 'bg-white text-gray-800 border-gray-300'
                    } border focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  />
                ) : (
                  <div className={`px-3 py-2 rounded-lg ${
                    theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'
                  }`}>
                    {product.dimensions || 'Not specified'}
                  </div>
                )}
              </div>
              
              {/* Image URL */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">Image URL</label>
                {isEditing ? (
                  <input
                    type="text"
                    name="imageUrl"
                    value={editedProduct.imageUrl || ''}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 rounded-lg ${
                      theme === 'dark' 
                        ? 'bg-gray-700 text-white border-gray-600' 
                        : 'bg-white text-gray-800 border-gray-300'
                    } border focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  />
                ) : (
                  <div className={`px-3 py-2 rounded-lg ${
                    theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'
                  } text-sm truncate`}>
                    {product.imageUrl || 'No image URL'}
                  </div>
                )}
              </div>
            </div>
            
            {/* Delete Confirmation */}
            {confirmDelete && !isEditing && (
              <div className="mt-4 p-3 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-800 rounded-lg text-red-800 dark:text-red-200">
                <p className="text-sm">Are you sure you want to delete this product? This action cannot be undone.</p>
                <div className="flex justify-end gap-2 mt-2">
                  <button 
                    onClick={() => setConfirmDelete(false)}
                    className="px-3 py-1 text-xs bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={() => onDelete(product.id)}
                    className="px-3 py-1 text-xs bg-red-600 text-white rounded"
                  >
                    Yes, Delete
                  </button>
                </div>
              </div>
            )}
            
            {/* Instructions for zooming */}
            {!isEditing && !confirmDelete && (
              <div className="text-xs text-gray-500 mt-2 mb-2">
                <p>Tip: Use mouse wheel to zoom image and left-click drag to move around when zoomed.</p>
              </div>
            )}
            
            {!isEditing && !confirmDelete && (
              <div className="mt-auto">
                <button
                  onClick={onClose}
                  className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ProductDetailsModal; 