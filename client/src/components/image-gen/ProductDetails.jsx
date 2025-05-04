import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const ProductDetails = ({
  productName,
  setProductName,
  productCode,
  setProductCode,
  dimensions,
  setDimensions,
  price,
  setPrice,
  prompt,
  seed,
  type, 
  setType,
  color,
  setColor,
  id,
  onViewCodes
}) => {
  const [currency, setCurrency] = useState('INR');
  const [material, setMaterial] = useState('100% Cotton');
  const [qualityGrade, setQualityGrade] = useState('premium');
  const [weight, setWeight] = useState('400');
  const [description, setDescription] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState([]);
  const [width, setWidth] = useState('');
  const [height, setHeight] = useState('');
  const [unit, setUnit] = useState('cm');
  const [showPreview, setShowPreview] = useState(false);

  // Parse dimensions when component loads
  useEffect(() => {
    if (dimensions) {
      const match = dimensions.match(/(\d+)x(\d+)\s*([a-z]+)?/i);
      if (match) {
        setWidth(match[1]);
        setHeight(match[2]);
        setUnit(match[3]?.toLowerCase() || 'cm');
      }
    }
  }, [dimensions]);

  // Function to handle dimensions change
  const handleDimensionsChange = () => {
    if (width && height) {
      // Store the full dimensions string, including all digits
      setDimensions(`${width}x${height} ${unit}`);
    }
  };

  // Update dimensions when width/height/unit changes
  useEffect(() => {
    handleDimensionsChange();
  }, [width, height, unit]);

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

  // Handle tag input
  const handleTagInputChange = (e) => {
    setTagInput(e.target.value);
  };

  // Add tags when comma or enter is pressed
  const handleTagKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag();
    }
  };

  // Add tag from input
  const addTag = () => {
    if (tagInput.trim()) {
      // Split by comma to handle multiple tags at once
      const newTags = tagInput.split(',').map(tag => tag.trim()).filter(Boolean);
      setTags(prevTags => [...prevTags, ...newTags]);
      setTagInput('');
    }
  };

  // Remove tag
  const removeTag = (indexToRemove) => {
    setTags(prevTags => prevTags.filter((_, index) => index !== indexToRemove));
  };

  return (
    <div id={id} className="bg-[#1A1D24] rounded-lg border border-[#2A2F38] shadow-lg p-3 h-full overflow-auto flex flex-col">
      <div className="flex justify-between items-center sticky top-0 bg-[#1A1D24] pb-2 z-10">
        <h3 className="text-sm font-semibold text-white">Product Details</h3>
        <div className="flex gap-2">
          {/* Add View Codes button */}
          {productCode && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onViewCodes}
              className="flex items-center gap-1 px-2 py-1 bg-[#2A2F38] rounded text-[11px] text-white hover:bg-[#3A4149]"
            >
              View Codes
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
              </svg>
            </motion.button>
          )}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowPreview(!showPreview)}
            className="flex items-center gap-1 px-2 py-1 bg-[#2A2F38] rounded text-[11px] text-white hover:bg-[#3A4149]"
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
                      <div className="text-xs text-white">Code: {productCode || 'N/A'}</div>
                    </div>
                    <div className="px-3 py-1.5 bg-blue-500/20 rounded-full text-blue-400 font-semibold text-sm">
                      {formatPrice(price) || '₹0.00'}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3 mt-2">
                    <div className="bg-[#1A1D24] p-2.5 rounded-lg">
                      <span className="text-[10px] text-white block">Dimensions</span>
                      <span className="text-white text-sm">{dimensions || 'Not specified'}</span>
                    </div>
                    <div className="bg-[#1A1D24] p-2.5 rounded-lg">
                      <span className="text-[10px] text-white block">Material</span>
                      <span className="text-white text-sm">{material || 'Not specified'}</span>
                    </div>
                    <div className="bg-[#1A1D24] p-2.5 rounded-lg">
                      <span className="text-[10px] text-white block">Type</span>
                      <span className="text-white text-sm">{type || 'Not specified'}</span>
                    </div>
                    <div className="bg-[#1A1D24] p-2.5 rounded-lg">
                      <span className="text-[10px] text-white block">Color</span>
                      <span className="text-white text-sm capitalize">{color || 'Not specified'}</span>
                    </div>
                  </div>
                  
                  {prompt && (
                    <div className="mt-2">
                      <span className="text-[10px] text-white block">Prompt</span>
                      <p className="text-white text-xs mt-1 line-clamp-3">{prompt}</p>
                    </div>
                  )}
                  
                  {seed && (
                    <div className="mt-2">
                      <span className="text-[10px] text-white block">Seed</span>
                      <p className="text-white text-xs mt-1">{seed}</p>
                    </div>
                  )}
                  
                  {description && (
                    <div className="mt-2">
                      <span className="text-[10px] text-white block">Description</span>
                      <p className="text-white text-xs mt-1">{description}</p>
                    </div>
                  )}
                  
                  {tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {tags.map((tag, index) => (
                        <span key={index} className="px-2 py-0.5 bg-[#1A1D24] rounded-full text-[10px] text-white">
                          {tag}
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
                  <label className="text-xs font-medium text-white block mb-1">Product Name</label>
                  <input
                    type="text"
                    value={productName}
                    onChange={(e) => setProductName(e.target.value)}
                    className="w-full px-3 py-2 bg-[#2A2F38] border border-[#3A4149] rounded-lg text-white text-xs focus:ring-1 focus:ring-blue-500 transition-all"
                    placeholder="Enter product name"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-white block mb-1">Product Code</label>
                  <input
                    type="text"
                    value={productCode}
                    onChange={(e) => setProductCode(e.target.value)}
                    className="w-full px-3 py-2 bg-[#2A2F38] border border-[#3A4149] rounded-lg text-white text-xs focus:ring-1 focus:ring-blue-500 transition-all"
                    placeholder="Enter product code (e.g. PRD-12345)"
                  />
                </div>
              </div>

              {/* Product Type & Material */}
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-white block mb-1">Product Type</label>
                  <input
                    type="text"
                    value={type}
                    onChange={(e) => setType?.(e.target.value)}
                    className="w-full px-3 py-2 bg-[#2A2F38] border border-[#3A4149] rounded-lg text-white text-xs focus:ring-1 focus:ring-blue-500 transition-all"
                    placeholder="e.g. Bath Towel, Hand Towel"
                    data-field="type"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-white block mb-1">Material</label>
                  <input
                    type="text"
                    value={material}
                    onChange={(e) => setMaterial(e.target.value)}
                    className="w-full px-3 py-2 bg-[#2A2F38] border border-[#3A4149] rounded-lg text-white text-xs focus:ring-1 focus:ring-blue-500 transition-all"
                    placeholder="e.g. 100% Cotton"
                    data-field="material"
                  />
                </div>
              </div>

              {/* Dimensions & Color */}
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-white block mb-1">Dimensions</label>
                  <div className="grid grid-cols-6 gap-2">
                    <div className="col-span-2">
                      <input
                        type="text"
                        value={width}
                        onChange={(e) => setWidth(e.target.value)}
                        className="w-full px-3 py-2 bg-[#2A2F38] border border-[#3A4149] rounded-lg text-white text-xs focus:ring-1 focus:ring-blue-500 transition-all"
                        placeholder="Width"
                        data-field="width"
                      />
                    </div>
                    <div className="col-span-2">
                      <input
                        type="text"
                        value={height}
                        onChange={(e) => setHeight(e.target.value)}
                        className="w-full px-3 py-2 bg-[#2A2F38] border border-[#3A4149] rounded-lg text-white text-xs focus:ring-1 focus:ring-blue-500 transition-all"
                        placeholder="Height"
                        data-field="height"
                      />
                    </div>
                    <div className="col-span-2">
                      <select 
                        value={unit}
                        onChange={(e) => setUnit(e.target.value)}
                        className="w-full px-3 py-2 bg-[#2A2F38] border border-[#3A4149] rounded-lg text-white text-xs focus:ring-1 focus:ring-blue-500 transition-all"
                        data-field="unit"
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
                    <label className="text-xs font-medium text-white block mb-1">Color</label>
                    <input
                      type="text"
                      value={color}
                      onChange={(e) => setColor?.(e.target.value)}
                      className="w-full px-3 py-2 bg-[#2A2F38] border border-[#3A4149] rounded-lg text-white text-xs focus:ring-1 focus:ring-blue-500 transition-all"
                      placeholder="e.g. white, blue"
                      data-field="color"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-white block mb-1">Price</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-white">₹</span>
                      <input
                        type="text"
                        value={price}
                        onChange={handlePriceChange}
                        className="w-full pl-6 pr-3 py-2 bg-[#2A2F38] border border-[#3A4149] rounded-lg text-white text-xs focus:ring-1 focus:ring-blue-500 transition-all"
                        placeholder="0.00"
                        data-field="price"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Additional Details */}
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-white block mb-1">Quality Grade</label>
                  <select 
                    value={qualityGrade}
                    onChange={(e) => setQualityGrade(e.target.value)}
                    className="w-full px-3 py-2 bg-[#2A2F38] border border-[#3A4149] rounded-lg text-white text-xs focus:ring-1 focus:ring-blue-500 transition-all"
                    data-field="qualityGrade"
                  >
                    <option value="premium">Premium</option>
                    <option value="standard">Standard</option>
                    <option value="economy">Economy</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-white block mb-1">Weight (GSM)</label>
                  <select 
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    className="w-full px-3 py-2 bg-[#2A2F38] border border-[#3A4149] rounded-lg text-white text-xs focus:ring-1 focus:ring-blue-500 transition-all"
                    data-field="weight"
                  >
                    <option value="200">200 GSM</option>
                    <option value="300">300 GSM</option>
                    <option value="400">400 GSM</option>
                    <option value="500">500 GSM</option>
                    <option value="600">600 GSM</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-white block mb-1">Description</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-3 py-2 bg-[#2A2F38] border border-[#3A4149] rounded-lg text-white text-xs focus:ring-1 focus:ring-blue-500 transition-all h-20 resize-none"
                    placeholder="Enter product description..."
                    data-field="description"
                  />
                </div>
              </div>

              {/* Tags */}
              <div>
                <label className="text-xs font-medium text-white block mb-1">Tags</label>
                <div className="flex items-center">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={handleTagInputChange}
                    onKeyDown={handleTagKeyDown}
                    onBlur={addTag}
                    className="w-full px-3 py-2 bg-[#2A2F38] border border-[#3A4149] rounded-lg text-white text-xs focus:ring-1 focus:ring-blue-500 transition-all"
                    placeholder="Enter tags and press Enter or comma to add"
                    data-field="tagInput"
                  />
                </div>
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2" data-field="tagsContainer">
                    {tags.map((tag, index) => (
                      <span key={index} className="px-2 py-0.5 bg-[#1A1D24] rounded-full text-[10px] text-white flex items-center" data-tag={tag}>
                        {tag}
                        <button 
                          onClick={() => removeTag(index)} 
                          className="ml-1 text-gray-400 hover:text-white"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Prompt & Seed (Read-only) */}
              {prompt && (
                <div>
                  <label className="text-xs font-medium text-white block mb-1">Generation Prompt</label>
                  <div className="w-full px-3 py-2 bg-[#2A2F38] border border-[#3A4149] rounded-lg text-white text-xs h-auto max-h-20 overflow-y-auto">
                    {prompt}
                  </div>
                </div>
              )}
              
              {seed && (
                <div>
                  <label className="text-xs font-medium text-white block mb-1">Seed Value</label>
                  <div className="w-full px-3 py-2 bg-[#2A2F38] border border-[#3A4149] rounded-lg text-white text-xs font-mono">
                    {seed}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default ProductDetails; 