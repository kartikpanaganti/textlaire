import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const ProductDetails = ({
  productName,
  setProductName,
  productCode,
  setProductCode,
  dimensions,
  setDimensions,
  price,
  setPrice
}) => {
  const [currency, setCurrency] = useState('INR');
  const [material, setMaterial] = useState('cotton');
  const [qualityGrade, setQualityGrade] = useState('premium');
  const [weight, setWeight] = useState('400');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [width, setWidth] = useState('');
  const [height, setHeight] = useState('');
  const [unit, setUnit] = useState('cm');
  const [showPreview, setShowPreview] = useState(false);

  // Function to handle dimensions change
  const handleDimensionsChange = () => {
    if (width && height) {
      setDimensions(`${width}x${height} ${unit}`);
    }
  };

  // Format price (always in Rupees)
  const formatPrice = (value) => {
    if (!value) return '';
    
    // Remove non-numeric characters
    const numericValue = value.replace(/[^0-9.]/g, '');
    
    // Always return price in rupees regardless of the currency selected
    return `₹${numericValue}`;
  };

  // Handle price input
  const handlePriceChange = (e) => {
    const value = e.target.value;
    // Extract numeric value from formatted string
    const numericValue = value.replace(/[^0-9.]/g, '');
    setPrice(numericValue);
  };

  return (
    <div className="bg-[#1A1D24] rounded-lg border border-[#2A2F38] shadow-lg p-3 h-full overflow-auto flex flex-col">
      <div className="flex justify-between items-center sticky top-0 bg-[#1A1D24] pb-2 z-10">
        <h3 className="text-sm font-semibold text-white">Product Details</h3>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowPreview(!showPreview)}
          className="flex items-center gap-1 px-2 py-1 bg-[#2A2F38] rounded text-[11px] text-gray-300 hover:bg-[#3A4149]"
        >
          {showPreview ? "Edit Details" : "Preview"}
          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            {showPreview ? 
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /> :
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            }
          </svg>
        </motion.button>
      </div>

      <div className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">
          {showPreview ? (
            <motion.div
              key="preview"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              {/* Product Preview Card */}
              <div className="bg-[#232830] rounded-xl overflow-hidden border border-[#3A4149]/30">
                <div className="p-4 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h2 className="text-white font-bold text-lg">{productName || 'Product Name'}</h2>
                      <div className="text-xs text-gray-400">Code: {productCode || 'N/A'}</div>
                    </div>
                    <div className="px-3 py-1.5 bg-blue-500/20 rounded-full text-blue-400 font-semibold text-sm">
                      {formatPrice(price) || '₹0.00'}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3 mt-2">
                    <div className="bg-[#1A1D24] p-2.5 rounded-lg">
                      <span className="text-[10px] text-gray-500 block">Dimensions</span>
                      <span className="text-gray-300 text-sm">{dimensions || 'Not specified'}</span>
                    </div>
                    <div className="bg-[#1A1D24] p-2.5 rounded-lg">
                      <span className="text-[10px] text-gray-500 block">Material</span>
                      <span className="text-gray-300 text-sm">{material === 'cotton' ? '100% Cotton' : 
                                                              material === 'egyptian' ? 'Egyptian Cotton' : 
                                                              material === 'bamboo' ? 'Bamboo' : 
                                                              material === 'microfiber' ? 'Microfiber' : 
                                                              'Cotton Blend'}</span>
                    </div>
                    <div className="bg-[#1A1D24] p-2.5 rounded-lg">
                      <span className="text-[10px] text-gray-500 block">Weight</span>
                      <span className="text-gray-300 text-sm">{weight} GSM</span>
                    </div>
                    <div className="bg-[#1A1D24] p-2.5 rounded-lg">
                      <span className="text-[10px] text-gray-500 block">Quality</span>
                      <span className="text-gray-300 text-sm capitalize">{qualityGrade}</span>
                    </div>
                  </div>
                  
                  {description && (
                    <div className="mt-2">
                      <span className="text-[10px] text-gray-500 block">Description</span>
                      <p className="text-gray-300 text-xs mt-1">{description}</p>
                    </div>
                  )}
                  
                  {tags && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {tags.split(',').map((tag, index) => (
                        <span key={index} className="px-2 py-0.5 bg-[#1A1D24] rounded-full text-[10px] text-gray-400">
                          {tag.trim()}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="edit"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              {/* Basic Details */}
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-gray-300 block mb-1">Product Name</label>
                  <input
                    type="text"
                    value={productName}
                    onChange={(e) => setProductName(e.target.value)}
                    className="w-full px-3 py-2 bg-[#2A2F38] border border-[#3A4149] rounded-lg text-gray-100 text-xs focus:ring-1 focus:ring-blue-500 transition-all"
                    placeholder="Enter product name"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-300 block mb-1">Product Code</label>
                  <input
                    type="text"
                    value={productCode}
                    onChange={(e) => setProductCode(e.target.value)}
                    className="w-full px-3 py-2 bg-[#2A2F38] border border-[#3A4149] rounded-lg text-gray-100 text-xs focus:ring-1 focus:ring-blue-500 transition-all"
                    placeholder="Enter product code (e.g. TOW-001)"
                  />
                </div>
              </div>

              {/* Dimensions & Price */}
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-gray-300 block mb-1">Dimensions</label>
                  <div className="grid grid-cols-6 gap-2">
                    <div className="col-span-2">
                      <input
                        type="text"
                        value={width}
                        onChange={(e) => {
                          setWidth(e.target.value);
                          handleDimensionsChange();
                        }}
                        className="w-full px-3 py-2 bg-[#2A2F38] border border-[#3A4149] rounded-lg text-gray-100 text-xs focus:ring-1 focus:ring-blue-500 transition-all"
                        placeholder="Width"
                      />
                    </div>
                    <div className="col-span-2">
                      <input
                        type="text"
                        value={height}
                        onChange={(e) => {
                          setHeight(e.target.value);
                          handleDimensionsChange();
                        }}
                        className="w-full px-3 py-2 bg-[#2A2F38] border border-[#3A4149] rounded-lg text-gray-100 text-xs focus:ring-1 focus:ring-blue-500 transition-all"
                        placeholder="Height"
                      />
                    </div>
                    <div className="col-span-2">
                      <select 
                        value={unit}
                        onChange={(e) => {
                          setUnit(e.target.value);
                          handleDimensionsChange();
                        }}
                        className="w-full px-3 py-2 bg-[#2A2F38] border border-[#3A4149] rounded-lg text-gray-100 text-xs focus:ring-1 focus:ring-blue-500 transition-all"
                      >
                        <option value="cm">cm</option>
                        <option value="inches">inches</option>
                        <option value="mm">mm</option>
                      </select>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-gray-300 block mb-1">Price</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                        {currency === 'INR' ? '₹' : 
                         currency === 'USD' ? '$' : 
                         currency === 'EUR' ? '€' : '£'}
                      </span>
                      <input
                        type="text"
                        value={formatPrice(price).slice(1)}
                        onChange={handlePriceChange}
                        className="w-full pl-6 pr-3 py-2 bg-[#2A2F38] border border-[#3A4149] rounded-lg text-gray-100 text-xs focus:ring-1 focus:ring-blue-500 transition-all"
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-300 block mb-1">Currency</label>
                    <select 
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value)}
                      className="w-full px-3 py-2 bg-[#2A2F38] border border-[#3A4149] rounded-lg text-gray-100 text-xs focus:ring-1 focus:ring-blue-500 transition-all"
                    >
                      <option value="INR">INR (₹)</option>
                      <option value="USD">USD ($)</option>
                      <option value="EUR">EUR (€)</option>
                      <option value="GBP">GBP (£)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Material & Quality */}
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-gray-300 block mb-1">Material</label>
                  <select 
                    value={material}
                    onChange={(e) => setMaterial(e.target.value)}
                    className="w-full px-3 py-2 bg-[#2A2F38] border border-[#3A4149] rounded-lg text-gray-100 text-xs focus:ring-1 focus:ring-blue-500 transition-all"
                  >
                    <option value="cotton">100% Cotton</option>
                    <option value="egyptian">Egyptian Cotton</option>
                    <option value="bamboo">Bamboo</option>
                    <option value="microfiber">Microfiber</option>
                    <option value="blend">Cotton Blend</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-300 block mb-1">Quality Grade</label>
                  <select 
                    value={qualityGrade}
                    onChange={(e) => setQualityGrade(e.target.value)}
                    className="w-full px-3 py-2 bg-[#2A2F38] border border-[#3A4149] rounded-lg text-gray-100 text-xs focus:ring-1 focus:ring-blue-500 transition-all"
                  >
                    <option value="premium">Premium</option>
                    <option value="standard">Standard</option>
                    <option value="economy">Economy</option>
                  </select>
                </div>
              </div>

              {/* Additional Details */}
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-gray-300 block mb-1">Weight (GSM)</label>
                  <select 
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    className="w-full px-3 py-2 bg-[#2A2F38] border border-[#3A4149] rounded-lg text-gray-100 text-xs focus:ring-1 focus:ring-blue-500 transition-all"
                  >
                    <option value="200">200 GSM</option>
                    <option value="300">300 GSM</option>
                    <option value="400">400 GSM</option>
                    <option value="500">500 GSM</option>
                    <option value="600">600 GSM</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-300 block mb-1">Description</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-3 py-2 bg-[#2A2F38] border border-[#3A4149] rounded-lg text-gray-100 text-xs focus:ring-1 focus:ring-blue-500 transition-all h-20 resize-none"
                    placeholder="Enter product description..."
                  />
                </div>
              </div>

              {/* Tags */}
              <div>
                <label className="text-xs font-medium text-gray-300 block mb-1">Tags</label>
                <input
                  type="text"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  className="w-full px-3 py-2 bg-[#2A2F38] border border-[#3A4149] rounded-lg text-gray-100 text-xs focus:ring-1 focus:ring-blue-500 transition-all"
                  placeholder="Enter tags separated by commas (e.g. soft, luxury, bathroom)"
                />
                {tags && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {tags.split(',').map((tag, index) => (
                      <span key={index} className="px-2 py-0.5 bg-[#1A1D24] rounded-full text-[10px] text-gray-400">
                        {tag.trim()}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default ProductDetails; 