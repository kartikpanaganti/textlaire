import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ProductDetailsModal from './ProductDetailsModal';

const GalleryGrid = ({ savedImages, deleteProduct, openPreview, renderImage, updateProduct }) => {
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [layout, setLayout] = useState('grid'); // grid or list view
  const [sortBy, setSortBy] = useState('newest');
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredImages, setFilteredImages] = useState([]);
  const [isAnimating, setIsAnimating] = useState(false);

  // Filter and sort images
  useEffect(() => {
    setIsAnimating(true);
    let filtered = [...savedImages];
    
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(product => 
        product.name?.toLowerCase().includes(query) || 
        product.type?.toLowerCase().includes(query) ||
        product.code?.toLowerCase().includes(query)
      );
    }
    
    // Apply sorting
    switch (sortBy) {
      case 'newest':
        filtered.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
        break;
      case 'oldest':
        filtered.sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0));
        break;
      case 'name':
        filtered.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
        break;
      case 'price-high':
        filtered.sort((a, b) => parseFloat((b.price || '0').replace(/[^0-9.]/g, '')) - parseFloat((a.price || '0').replace(/[^0-9.]/g, '')));
        break;
      case 'price-low':
        filtered.sort((a, b) => parseFloat((a.price || '0').replace(/[^0-9.]/g, '')) - parseFloat((b.price || '0').replace(/[^0-9.]/g, '')));
        break;
      default:
        break;
    }
    
    setFilteredImages(filtered);
    
    // Reset animation state after a brief timeout
    setTimeout(() => setIsAnimating(false), 300);
  }, [savedImages, sortBy, searchQuery]);

  const handleImageClick = (product) => {
    // Create a complete product object with the rendered image URL
    const productWithImage = {
      ...product,
      image: renderImage(product)
    };
    setSelectedProduct(productWithImage);
    setShowDetailsModal(true);
  };

  // Count patterns by type
  const patternTypes = savedImages.reduce((acc, product) => {
    const type = product.type || 'Unknown';
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-4">
      {/* Search and filters */}
      <div className="flex flex-col lg:flex-row gap-3 items-start lg:items-center justify-between bg-[#232830] p-3 rounded-xl shadow-md">
        <div className="flex flex-col sm:flex-row gap-2 w-full lg:w-auto">
          <div className="relative">
            <input
              type="text"
              placeholder="Search patterns..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full sm:w-64 px-3 py-2 bg-[#1A1D24] border border-[#3A4149] rounded-lg text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:outline-none"
            />
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
          
          <div className="flex gap-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 bg-[#1A1D24] border border-[#3A4149] rounded-lg text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:outline-none appearance-none cursor-pointer"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="name">Name (A-Z)</option>
              <option value="price-high">Price (High-Low)</option>
              <option value="price-low">Price (Low-High)</option>
            </select>
            
            <div className="bg-[#1A1D24] border border-[#3A4149] rounded-lg p-1 flex">
              <button
                onClick={() => setLayout('grid')}
                className={`p-1.5 rounded ${layout === 'grid' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </button>
              <button
                onClick={() => setLayout('list')}
                className={`p-1.5 rounded ${layout === 'list' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>
        
        <div className="flex gap-2 flex-wrap">
          {Object.entries(patternTypes).map(([type, count]) => (
            <div key={type} className="px-3 py-1 bg-[#1A1D24] rounded-full text-xs font-medium text-blue-400 flex items-center">
              {type}
              <span className="ml-1.5 bg-blue-500/20 rounded-full px-1.5 py-0.5 text-[10px] text-blue-300">{count}</span>
            </div>
          ))}
        </div>
      </div>
      
      {/* Gallery content */}
      <AnimatePresence mode="wait">
        {filteredImages.length === 0 ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="col-span-full p-10 rounded-lg text-center flex flex-col items-center justify-center min-h-[300px]"
          >
            <div className="w-16 h-16 mb-4 rounded-full bg-[#232830] flex items-center justify-center text-gray-500">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-white mb-2">No patterns found</h3>
            <p className="text-sm text-gray-400 max-w-md">
              {searchQuery ? 
                `No patterns match your search for "${searchQuery}". Try a different search term or clear the search.` : 
                "You haven't saved any patterns yet. Generate and save patterns to see them here."}
            </p>
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium"
              >
                Clear Search
              </button>
            )}
          </motion.div>
        ) : layout === 'grid' ? (
          <motion.div
            key="grid"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className={`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4`}
          >
            <AnimatePresence>
              {filteredImages.map((product, index) => (
                <motion.div
                  layout
                  key={product.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ 
                    opacity: 1, 
                    y: 0,
                    transition: { 
                      delay: isAnimating ? 0 : index * 0.05,
                      duration: 0.3
                    }
                  }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  whileHover={{ y: -5 }}
                  className="group bg-[#232830] rounded-xl overflow-hidden shadow-lg border border-[#3A4149]/30 hover:border-blue-500/50 hover:shadow-blue-500/10 transition-all duration-300"
                >
                  <div className="relative aspect-square">
                    <img 
                      src={renderImage(product)} 
                      alt={product.name} 
                      className="w-full h-full object-cover cursor-pointer"
                    />
                    
                    <div 
                      className="absolute inset-0 bg-gradient-to-t from-[#232830]/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 cursor-pointer flex flex-col justify-end p-4"
                      onClick={() => handleImageClick(product)}
                    >
                      <div className="transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                        <h4 className="text-sm font-medium text-white truncate">{product.name}</h4>
                        <p className="text-xs text-gray-400 truncate">{product.type}</p>
                      </div>
                    </div>
                    
                    <div className="absolute top-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                      <motion.button 
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleImageClick(product);
                        }}
                        className="p-2 bg-blue-600 rounded-full text-white shadow-lg"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </motion.button>
                      <motion.button 
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteProduct(product.id);
                        }}
                        className="p-2 bg-red-600 rounded-full text-white shadow-lg"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </motion.button>
                    </div>
                    
                    <div className="absolute bottom-3 left-3 pointer-events-none">
                      <div className="px-2 py-1 bg-blue-600/90 backdrop-blur-sm rounded-md text-xs font-medium text-white shadow-lg">
                        {product.price ? (product.price.startsWith('₹') ? product.price : `₹${product.price.replace(/[^0-9.]/g, '')}`) : '₹0'}
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-3">
                    <h4 className="text-sm font-medium text-white truncate">{product.name}</h4>
                    <div className="flex justify-between items-center mt-1">
                      <p className="text-xs text-gray-400 truncate">{product.code}</p>
                      <div className="text-xs font-medium text-blue-400">{product.type}</div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        ) : (
          <motion.div
            key="list"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-3"
          >
            {filteredImages.map((product, index) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ 
                  opacity: 1, 
                  x: 0,
                  transition: { 
                    delay: isAnimating ? 0 : index * 0.05,
                    duration: 0.3
                  }
                }}
                whileHover={{ scale: 1.01 }}
                className="group flex bg-[#232830] rounded-xl overflow-hidden shadow-md border border-[#3A4149]/30 hover:border-blue-500/50 hover:shadow-blue-500/10 transition-all duration-300"
              >
                <div className="relative w-24 h-24 sm:w-32 sm:h-32">
                  <img 
                    src={renderImage(product)} 
                    alt={product.name} 
                    className="w-full h-full object-cover"
                  />
                </div>
                
                <div className="flex-1 p-3 flex flex-col justify-center" onClick={() => handleImageClick(product)}>
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-sm font-medium text-white">{product.name}</h4>
                      <p className="text-xs text-gray-400">{product.code}</p>
                    </div>
                    <div className="text-xs font-medium text-blue-400 bg-blue-500/10 px-2 py-1 rounded-md">
                      {product.type}
                    </div>
                  </div>
                  
                  <div className="mt-2 flex flex-wrap gap-2">
                    {product.material && (
                      <span className="text-[10px] px-2 py-0.5 bg-[#1A1D24] rounded-full text-gray-400">
                        {product.material}
                      </span>
                    )}
                    {product.finish && (
                      <span className="text-[10px] px-2 py-0.5 bg-[#1A1D24] rounded-full text-gray-400">
                        {product.finish}
                      </span>
                    )}
                    {product.dimensions && (
                      <span className="text-[10px] px-2 py-0.5 bg-[#1A1D24] rounded-full text-gray-400">
                        {product.dimensions}
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="flex flex-col justify-between p-3 border-l border-[#3A4149]/30">
                  <div className="text-sm font-medium text-blue-400">
                    {product.price ? (product.price.startsWith('₹') ? product.price : `₹${product.price.replace(/[^0-9.]/g, '')}`) : '₹0'}
                  </div>
                  <div className="flex gap-2">
                    <motion.button 
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => handleImageClick(product)}
                      className="p-1.5 bg-blue-600 rounded-md text-white"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </motion.button>
                    <motion.button 
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => deleteProduct(product.id)}
                      className="p-1.5 bg-red-600 rounded-md text-white"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <ProductDetailsModal
        show={showDetailsModal}
        product={selectedProduct}
        onClose={() => {
          setShowDetailsModal(false);
          setSelectedProduct(null);
        }}
        onUpdate={(updatedProduct) => {
          const success = updateProduct(updatedProduct);
          if (success) {
            setShowDetailsModal(false);
            setSelectedProduct(null);
          }
        }}
        onDelete={(productId) => {
          deleteProduct(productId);
          setShowDetailsModal(false);
          setSelectedProduct(null);
        }}
      />
    </div>
  );
};

export default GalleryGrid; 