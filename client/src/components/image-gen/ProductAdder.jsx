import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';

const ProductAdder = ({ onProductAdded }) => {
  const [productName, setProductName] = useState('');
  const [productCode, setProductCode] = useState('');
  const [dimensions, setDimensions] = useState('');
  const [price, setPrice] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  
  // Additional fields matching ProductDetails
  const [currency, setCurrency] = useState('INR');
  const [material, setMaterial] = useState('cotton');
  const [qualityGrade, setQualityGrade] = useState('premium');
  const [weight, setWeight] = useState('400');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [width, setWidth] = useState('');
  const [height, setHeight] = useState('');
  const [unit, setUnit] = useState('cm');

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

  // Handle image upload
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setUploadError('Please select a valid image file (jpg, png, gif, webp)');
      return;
    }

    setIsUploading(true);
    setUploadError('');

    try {
      // Create form data for upload
      const formData = new FormData();
      formData.append('image', file);

      // Upload image to server or cloud storage
      // For demo, we'll just use a local URL
      const imageUrl = URL.createObjectURL(file);
      setImageUrl(imageUrl);
    } catch (error) {
      console.error('Error uploading image:', error);
      setUploadError('Failed to upload image. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  // Create new product
  const handleAddProduct = async () => {
    if (!productName || !imageUrl) {
      setUploadError('Product name and image are required');
      return;
    }

    try {
      // Get reference to the form fields using data attributes
      const getFieldValue = (fieldName) => {
        const element = document.querySelector(`[data-field="${fieldName}"]`);
        return element ? element.value : null;
      };
      
      // Get all form values using data attributes
      const type = getFieldValue('type');
      const material = getFieldValue('material');
      const color = getFieldValue('color');
      const width = getFieldValue('width');
      const height = getFieldValue('height');
      const unit = getFieldValue('unit');
      const qualityGrade = getFieldValue('qualityGrade');
      const weight = getFieldValue('weight');
      const description = getFieldValue('description');
      
      // For tags, we need to extract from the DOM
      const tagElements = document.querySelectorAll('[data-tag]');
      const tags = Array.from(tagElements || []).map(el => el.getAttribute('data-tag')).filter(Boolean);
      
      // Format dimensions properly
      const formattedDimensions = width && height ? `${width}x${height} ${unit || 'cm'}` : '';
      
      // Prepare the product data with all details
      const productData = {
        id: 'PROD_' + Date.now(),
        name: productName,
        code: productCode,
        type: type,
        material: material,
        color: color,
        dimensions: formattedDimensions,
        width: width,
        height: height,
        unit: unit,
        price: formatPrice(price),
        currency: 'INR',
        imageUrl: imageUrl,
        description: description,
        tags: tags,
        qualityGrade: qualityGrade,
        weight: weight,
        createdAt: new Date().toISOString()
      };
      
      // Call the callback with the new product
      if (onProductAdded) {
        onProductAdded(productData);
      }
      
      // Reset form
      setProductName('');
      setProductCode('');
      setDimensions('');
      setPrice('');
      setImageUrl('');
      setDescription('');
      setTags('');
      setWidth('');
      setHeight('');
      setUploadError('');
    } catch (error) {
      console.error('Error adding product:', error);
      setUploadError('Failed to add product: ' + error.message);
    }
  };

  return (
    <div className="bg-[#1A1D24] rounded-lg border border-[#2A2F38] shadow-lg p-3 h-full overflow-hidden flex flex-col">
      <div className="flex justify-between items-center sticky top-0 bg-[#1A1D24] pb-2 z-10 flex-shrink-0">
        <h3 className="text-sm font-semibold text-white">Add New Product</h3>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowPreview(!showPreview)}
          className={`flex items-center gap-1 px-2 py-1 bg-[#2A2F38] rounded text-[11px] text-gray-300 hover:bg-[#3A4149] ${!imageUrl ? 'opacity-50 cursor-not-allowed' : ''}`}
          disabled={!imageUrl}
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
          {!imageUrl ? (
            <motion.div
              key="empty-state"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex h-full items-center justify-center p-4 text-center text-gray-400"
            >
              <div>
                <svg className="mx-auto h-12 w-12 text-gray-500 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
                <p className="text-white">Product details will be available<br />after uploading an image</p>
                <button 
                  onClick={() => document.getElementById('image-upload').click()}
                  className="mt-4 px-4 py-2 bg-blue-600 rounded-lg text-white text-sm"
                >
                  Upload Image
                </button>
                <input
                  id="image-upload"
                  type="file"
                  className="hidden"
                  onChange={handleImageUpload}
                  accept="image/*"
                  disabled={isUploading}
                />
              </div>
            </motion.div>
          ) : showPreview ? (
            <motion.div
              key="preview"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              {/* Product Preview Card */}
              <div className="bg-[#232830] rounded-xl overflow-hidden border border-[#3A4149]/30">
                {imageUrl && (
                  <div className="aspect-square w-full overflow-hidden">
                    <img 
                      src={imageUrl} 
                      alt={productName || "Product preview"} 
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
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
                      {tags.map((tag, index) => (
                        <span key={index} className="px-2 py-0.5 bg-[#1A1D24] rounded-full text-[10px] text-gray-400">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="pt-2 flex-shrink-0">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleAddProduct}
                  disabled={!productName || !imageUrl}
                  className={`w-full py-2 px-4 rounded-lg font-medium ${
                    !productName || !imageUrl
                      ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                      : 'bg-gradient-to-r from-green-600 to-green-500 text-white'
                  }`}
                >
                  Add Product
                </motion.button>
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
              {/* Image Upload */}
              <div>
                <label className="text-xs font-medium text-gray-300 block mb-1">Product Image</label>
                <div 
                  className={`border-2 border-dashed rounded-lg p-3 bg-[#232830] border-[#3A4149] flex flex-col items-center justify-center cursor-pointer overflow-hidden ${isUploading ? 'opacity-70' : ''}`}
                  style={{ height: '180px' }}
                  onClick={() => document.getElementById('image-upload').click()}
                >
                  {isUploading ? (
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500 mx-auto"></div>
                      <p className="mt-3 text-gray-400">Uploading image...</p>
                    </div>
                  ) : imageUrl ? (
                    <img
                      src={imageUrl}
                      alt="Product"
                      className="max-w-full max-h-full object-contain rounded-lg"
                    />
                  ) : (
                    <div className="text-center">
                      <svg
                        className="mx-auto h-10 w-10 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                      <p className="mt-1 text-sm text-gray-400">
                        Click to upload product image
                      </p>
                    </div>
                  )}
                  <input
                    id="image-upload"
                    type="file"
                    className="hidden"
                    onChange={handleImageUpload}
                    accept="image/*"
                    disabled={isUploading}
                  />
                </div>
                {uploadError && (
                  <p className="text-red-500 text-xs mt-1">{uploadError}</p>
                )}
              </div>

              {/* Basic Details */}
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-gray-300 block mb-1">Product Name</label>
                  <input
                    type="text"
                    name="name"
                    value={productName}
                    onChange={(e) => setProductName(e.target.value)}
                    className="w-full px-4 py-2.5 bg-[#232830] rounded-lg border border-[#3A4149] text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    data-field="name"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-300 block mb-1">Product Code</label>
                  <input
                    type="text"
                    name="code"
                    value={productCode}
                    onChange={(e) => setProductCode(e.target.value)}
                    className="w-full px-4 py-2.5 bg-[#232830] rounded-lg border border-[#3A4149] text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    data-field="code"
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
                        name="price"
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
                  <input
                    type="text"
                    name="material"
                    value={material}
                    onChange={(e) => setMaterial(e.target.value)}
                    className="w-full px-4 py-2.5 bg-[#232830] rounded-lg border border-[#3A4149] text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    data-field="material"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-300 block mb-1">Quality Grade</label>
                  <select 
                    name="qualityGrade"
                    value={qualityGrade}
                    onChange={(e) => setQualityGrade(e.target.value)}
                    className="w-full px-4 py-2.5 bg-[#232830] rounded-lg border border-[#3A4149] text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    data-field="qualityGrade"
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
                    name="weight"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    className="w-full px-4 py-2.5 bg-[#232830] rounded-lg border border-[#3A4149] text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
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
                  <label className="text-xs font-medium text-gray-300 block mb-1">Description</label>
                  <textarea
                    name="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-4 py-2.5 bg-[#232830] rounded-lg border border-[#3A4149] text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all h-20 resize-none"
                    placeholder="Enter product description"
                    data-field="description"
                  ></textarea>
                </div>
              </div>

              {/* Tags */}
              <div>
                <label className="text-xs font-medium text-gray-300 block mb-1">Tags</label>
                <input
                  type="text"
                  name="tags"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  className="w-full px-4 py-2.5 bg-[#232830] rounded-lg border border-[#3A4149] text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="Enter tags separated by commas"
                  data-field="tags"
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

              {/* Add Product Button */}
              <div className="pt-2 flex-shrink-0">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleAddProduct}
                  disabled={!productName || !imageUrl}
                  className={`w-full py-2 px-4 rounded-lg font-medium ${
                    !productName || !imageUrl
                      ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                      : 'bg-gradient-to-r from-green-600 to-green-500 text-white'
                  }`}
                >
                  Add Product
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default ProductAdder; 