import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const ProductDetailsModal = ({ show, product, onClose, onUpdate, onDelete }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedProduct, setEditedProduct] = useState(null);
  const [activeTab, setActiveTab] = useState('details');
  const [zoomLevel, setZoomLevel] = useState(1);
  const [imageRotation, setImageRotation] = useState(0);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (product) {
      setEditedProduct({ ...product });
    }
  }, [product]);

  if (!show || !product || !editedProduct) return null;

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditedProduct(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onUpdate(editedProduct);
      setIsEditing(false);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setEditedProduct({ ...product });
    setIsEditing(false);
  };

  const handleDelete = () => {
    setShowDeleteConfirm(true);
  };

  const confirmDelete = () => {
    onDelete(product.id);
    setShowDeleteConfirm(false);
  };

  const renderDetailsView = () => (
    <motion.div 
      className="space-y-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">{product.name}</h2>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 bg-blue-500/20 rounded-full text-sm text-blue-400">
            {product.type}
          </span>
          <span className="px-3 py-1 bg-green-500/20 rounded-full text-sm text-green-400">
            {product.material}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-3">
          <motion.div 
            className="bg-[#232830] p-4 rounded-xl border border-[#3A4149]/30 hover:border-blue-500/50 transition-colors"
            whileHover={{ scale: 1.02 }}
          >
            <h3 className="text-sm font-medium text-gray-300 mb-1">Product Code</h3>
            <p className="text-sm text-gray-400">{product.code}</p>
          </motion.div>

          <motion.div 
            className="bg-[#232830] p-4 rounded-xl border border-[#3A4149]/30 hover:border-blue-500/50 transition-colors"
            whileHover={{ scale: 1.02 }}
          >
            <h3 className="text-sm font-medium text-gray-300 mb-1">Dimensions</h3>
            <p className="text-sm text-gray-400">{product.dimensions}</p>
          </motion.div>

          <motion.div 
            className="bg-[#232830] p-4 rounded-xl border border-[#3A4149]/30 hover:border-blue-500/50 transition-colors"
            whileHover={{ scale: 1.02 }}
          >
            <h3 className="text-sm font-medium text-gray-300 mb-1">Material</h3>
            <p className="text-sm text-gray-400">{product.material}</p>
          </motion.div>
        </div>

        <div className="space-y-3">
          <motion.div 
            className="bg-[#232830] p-4 rounded-xl border border-[#3A4149]/30 hover:border-blue-500/50 transition-colors"
            whileHover={{ scale: 1.02 }}
          >
            <h3 className="text-sm font-medium text-gray-300 mb-1">Color</h3>
            <p className="text-sm text-gray-400">{product.color}</p>
          </motion.div>

          <motion.div 
            className="bg-[#232830] p-4 rounded-xl border border-[#3A4149]/30 hover:border-blue-500/50 transition-colors"
            whileHover={{ scale: 1.02 }}
          >
            <h3 className="text-sm font-medium text-gray-300 mb-1">Application</h3>
            <p className="text-sm text-gray-400">{product.application}</p>
          </motion.div>

          <motion.div 
            className="bg-[#232830] p-4 rounded-xl border border-[#3A4149]/30 hover:border-blue-500/50 transition-colors"
            whileHover={{ scale: 1.02 }}
          >
            <h3 className="text-sm font-medium text-gray-300 mb-1">Finish</h3>
            <p className="text-sm text-gray-400">{product.finish}</p>
          </motion.div>
        </div>
      </div>

      <div className="pt-4">
        <div className="flex items-center justify-between">
          <h3 className="text-2xl font-bold text-blue-400">Price: {product.price}</h3>
          <div className="flex gap-3">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsEditing(true)}
              className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg flex items-center gap-2 shadow-lg hover:shadow-blue-500/20 transition-all"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
              Edit
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleDelete}
              className="px-6 py-2.5 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg flex items-center gap-2 shadow-lg hover:shadow-red-500/20 transition-all"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Delete
            </motion.button>
          </div>
        </div>
      </div>
    </motion.div>
  );

  const renderEditForm = () => (
    <motion.div 
      className="space-y-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">Product Name</label>
        <input
          type="text"
          name="name"
          value={editedProduct.name || ''}
          onChange={handleInputChange}
          className="w-full px-4 py-2.5 bg-[#232830] rounded-lg border border-[#3A4149] text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Product Code</label>
          <input
            type="text"
            name="code"
            value={editedProduct.code || ''}
            onChange={handleInputChange}
            className="w-full px-4 py-2.5 bg-[#232830] rounded-lg border border-[#3A4149] text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Price</label>
          <input
            type="text"
            name="price"
            value={editedProduct.price || ''}
            onChange={handleInputChange}
            className="w-full px-4 py-2.5 bg-[#232830] rounded-lg border border-[#3A4149] text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Dimensions</label>
          <input
            type="text"
            name="dimensions"
            value={editedProduct.dimensions || ''}
            onChange={handleInputChange}
            className="w-full px-4 py-2.5 bg-[#232830] rounded-lg border border-[#3A4149] text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Material</label>
          <input
            type="text"
            name="material"
            value={editedProduct.material || ''}
            onChange={handleInputChange}
            className="w-full px-4 py-2.5 bg-[#232830] rounded-lg border border-[#3A4149] text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Color</label>
          <input
            type="text"
            name="color"
            value={editedProduct.color || ''}
            onChange={handleInputChange}
            className="w-full px-4 py-2.5 bg-[#232830] rounded-lg border border-[#3A4149] text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Application</label>
          <input
            type="text"
            name="application"
            value={editedProduct.application || ''}
            onChange={handleInputChange}
            className="w-full px-4 py-2.5 bg-[#232830] rounded-lg border border-[#3A4149] text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Finish</label>
          <input
            type="text"
            name="finish"
            value={editedProduct.finish || ''}
            onChange={handleInputChange}
            className="w-full px-4 py-2.5 bg-[#232830] rounded-lg border border-[#3A4149] text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Type</label>
          <input
            type="text"
            name="type"
            value={editedProduct.type || ''}
            onChange={handleInputChange}
            className="w-full px-4 py-2.5 bg-[#232830] rounded-lg border border-[#3A4149] text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          />
        </div>
      </div>

      <div className="flex gap-3 pt-4">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleSave}
          disabled={isSaving}
          className="px-6 py-2.5 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg flex items-center gap-2 shadow-lg hover:shadow-green-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSaving ? (
            <>
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Saving...
            </>
          ) : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Save
            </>
          )}
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleCancel}
          className="px-6 py-2.5 bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-lg flex items-center gap-2 shadow-lg hover:shadow-gray-500/20 transition-all"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
          Cancel
        </motion.button>
      </div>
    </motion.div>
  );

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 overflow-auto"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="relative w-full max-w-5xl bg-[#1A1D24] rounded-xl overflow-hidden shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close button */}
          <motion.button
            whileHover={{ scale: 1.1, rotate: 90 }}
            whileTap={{ scale: 0.9 }}
            onClick={onClose}
            className="absolute top-4 right-4 z-10 p-2 text-gray-400 hover:text-white transition-colors bg-[#232830] rounded-full shadow-lg"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </motion.button>

          {/* Tabs */}
          <div className="bg-[#232830] px-6 py-3 border-b border-[#3A4149]">
            <div className="flex space-x-4">
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setActiveTab('details')}
                className={`text-sm font-medium px-4 py-2 rounded-lg transition-all ${
                  activeTab === 'details' 
                    ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg' 
                    : 'text-gray-400 hover:text-white hover:bg-[#2A2F38]'
                }`}
              >
                Product Details
              </motion.button>
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setActiveTab('preview')}
                className={`text-sm font-medium px-4 py-2 rounded-lg transition-all ${
                  activeTab === 'preview' 
                    ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg' 
                    : 'text-gray-400 hover:text-white hover:bg-[#2A2F38]'
                }`}
              >
                Pattern Preview
              </motion.button>
            </div>
          </div>

          <div className="p-6">
            {activeTab === 'details' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Image Section */}
                <motion.div 
                  className="relative aspect-square rounded-xl overflow-hidden bg-[#2A2F38] shadow-xl"
                  whileHover={{ scale: 1.02 }}
                >
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-contain"
                    style={{ transform: `rotate(${imageRotation}deg)`, transition: 'transform 0.3s ease' }}
                  />
                  <div className="absolute bottom-3 right-3 flex items-center space-x-2 bg-black/70 backdrop-blur-sm rounded-lg p-2">
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setZoomLevel(prev => Math.max(0.5, prev - 0.1))}
                      className="p-1.5 rounded-md bg-[#2A2F38]/80 hover:bg-[#3A4149]/80 text-white"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                      </svg>
                    </motion.button>
                    <span className="text-xs text-white">{Math.round(zoomLevel * 100)}%</span>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setZoomLevel(prev => Math.min(2, prev + 0.1))}
                      className="p-1.5 rounded-md bg-[#2A2F38]/80 hover:bg-[#3A4149]/80 text-white"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setImageRotation(prev => prev + 90)}
                      className="p-1.5 rounded-md bg-[#2A2F38]/80 hover:bg-[#3A4149]/80 text-white"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                    </motion.button>
                  </div>
                </motion.div>

                {/* Product Details Section */}
                {isEditing ? renderEditForm() : renderDetailsView()}
              </div>
            ) : (
              <div className="h-[500px] bg-[#232830] rounded-xl overflow-hidden p-4">
                <div className="h-full flex items-center justify-center">
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="relative"
                    style={{
                      transform: `scale(${zoomLevel}) rotate(${imageRotation}deg)`,
                      transition: 'transform 0.3s ease-out'
                    }}
                  >
                    <img
                      src={product.image}
                      alt={product.name}
                      className="max-w-full max-h-[460px] object-contain"
                    />
                  </motion.div>
                </div>
                <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex items-center space-x-4 bg-black/70 backdrop-blur-sm rounded-lg p-3">
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setZoomLevel(prev => Math.max(0.5, prev - 0.1))}
                    className="p-1.5 rounded-md bg-[#2A2F38]/80 hover:bg-[#3A4149]/80 text-white"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                    </svg>
                  </motion.button>
                  <span className="text-xs text-white">Zoom: {Math.round(zoomLevel * 100)}%</span>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setZoomLevel(prev => Math.min(2, prev + 0.1))}
                    className="p-1.5 rounded-md bg-[#2A2F38]/80 hover:bg-[#3A4149]/80 text-white"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setImageRotation(prev => prev + 90)}
                    className="p-1.5 rounded-md bg-[#2A2F38]/80 hover:bg-[#3A4149]/80 text-white"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </motion.button>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm"
            onClick={() => setShowDeleteConfirm(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#1A1D24] p-6 rounded-xl shadow-2xl max-w-md w-full mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-xl font-bold text-white mb-4">Confirm Delete</h3>
              <p className="text-gray-400 mb-6">
                Are you sure you want to delete this product? This action cannot be undone.
              </p>
              <div className="flex justify-end gap-3">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={confirmDelete}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Delete
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </AnimatePresence>
  );
};

export default ProductDetailsModal; 