import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { FaTimes, FaUpload } from 'react-icons/fa';
import { format } from 'date-fns';
import { getImageUrl, handleImageError } from '../../utils/imageUtils';

const RawMaterialModal = ({ isOpen, onClose, material, onSave }) => {
  const [formData, setFormData] = useState({
    name: '',
    materialType: 'Cotton - Regular',
    stock: 0,
    supplier: '',
    unit: 'kg',
    unitPrice: 0,
    reorderLevel: 10,
    location: '',
    lastRestocked: format(new Date(), 'yyyy-MM-dd'),
    expiryDate: '',
    notes: '',
    specifications: {
      color: '',
      colorHex: '',
      weight: '',
      weightUnit: 'g/m²',
      width: '',
      length: '',
      dimensionsUnit: 'cm',
      quality: '',
      additionalInfo: ''
    }
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [loading, setLoading] = useState(false);
  const [createdAt, setCreatedAt] = useState('');
  const [updatedAt, setUpdatedAt] = useState('');
  const [activeTab, setActiveTab] = useState('basic'); // For tabbed interface

  useEffect(() => {
    if (material) {
      // Format dates for input fields
      const lastRestockedDate = material.lastRestocked 
        ? format(new Date(material.lastRestocked), 'yyyy-MM-dd')
        : '';
      
      const expiryDate = material.expiryDate
        ? format(new Date(material.expiryDate), 'yyyy-MM-dd')
        : '';
      
      // Set timestamps for display
      if (material.createdAt) {
        setCreatedAt(format(new Date(material.createdAt), 'MMM d, yyyy h:mm a'));
      }
      
      if (material.updatedAt) {
        setUpdatedAt(format(new Date(material.updatedAt), 'MMM d, yyyy h:mm a'));
      }
      
      setFormData({
        ...material,
        materialType: material.category || 'Cotton - Regular',
        stock: material.stock || 0,
        supplier: material.supplier || '',
        unit: material.unit || 'kg',
        unitPrice: material.unitPrice || 0,
        reorderLevel: material.reorderLevel || 10,
        location: material.location || '',
        lastRestocked: lastRestockedDate,
        expiryDate: expiryDate,
        notes: material.notes || '',
        specifications: {
          color: material.specifications?.color || '',
          colorHex: material.specifications?.colorHex || '',
          weight: material.specifications?.weight || '',
          weightUnit: material.specifications?.weightUnit || 'g/m²',
          width: material.specifications?.width || '',
          length: material.specifications?.length || '',
          dimensionsUnit: material.specifications?.dimensionsUnit || 'cm',
          quality: material.specifications?.quality || '',
          additionalInfo: material.specifications?.additionalInfo || ''
        }
      });
      
      if (material.image) {
        setImagePreview(material.image);
      }
    } else {
      // Reset form when no material is provided (adding new)
      setFormData({
        name: '',
        materialType: 'Cotton - Regular',
        stock: 0,
        supplier: '',
        unit: 'kg',
        unitPrice: 0,
        reorderLevel: 10,
        location: '',
        lastRestocked: format(new Date(), 'yyyy-MM-dd'),
        expiryDate: '',
        notes: '',
        specifications: {
          color: '',
          colorHex: '',
          weight: '',
          weightUnit: 'g/m²',
          width: '',
          length: '',
          dimensionsUnit: 'cm',
          quality: '',
          additionalInfo: ''
        }
      });
      setImagePreview('');
      setImageFile(null);
      setCreatedAt('');
      setUpdatedAt('');
    }
  }, [material, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSpecificationsChange = (e) => {
    const { name, value } = e.target;
    
    // Special handling for color field
    if (name === 'color') {
      handleColorChange(value, false);
      return;
    }
    
    setFormData(prev => ({
      ...prev,
      specifications: {
        ...prev.specifications,
        [name]: value
      }
    }));
  };

  // Add new handler for color picker
  const handleColorChange = (colorValue, isHex = false) => {
    if (isHex) {
      // If it's a hex value, update both color and colorHex
      setFormData(prev => ({
        ...prev,
        specifications: {
          ...prev.specifications,
          color: prev.specifications.color, // Keep existing color name
          colorHex: colorValue // Update hex value
        }
      }));
    } else {
      // If it's a color name, update color and try to get the hex
      const hexValue = getColorHexFromName(colorValue);
      setFormData(prev => ({
        ...prev,
        specifications: {
          ...prev.specifications,
          color: colorValue, // Update color name
          colorHex: hexValue || prev.specifications.colorHex // Update hex if available, otherwise keep existing
        }
      }));
    }
  };

  // Function to convert common color names to hex codes
  const getColorHexFromName = (colorName) => {
    const colorMap = {
      // Basic colors
      'red': '#FF0000',
      'green': '#008000',
      'blue': '#0000FF',
      'yellow': '#FFFF00',
      'orange': '#FFA500',
      'purple': '#800080',
      'pink': '#FFC0CB',
      'brown': '#A52A2A',
      'black': '#000000',
      'white': '#FFFFFF',
      'gray': '#808080',
      'grey': '#808080',
      
      // Additional colors
      'aqua': '#00FFFF',
      'cyan': '#00FFFF',
      'magenta': '#FF00FF',
      'fuchsia': '#FF00FF',
      'lime': '#00FF00',
      'olive': '#808000',
      'navy': '#000080',
      'teal': '#008080',
      'maroon': '#800000',
      'silver': '#C0C0C0',
      'gold': '#FFD700',
      'golden': '#FFD700',
      'beige': '#F5F5DC',
      'tan': '#D2B48C',
      'coral': '#FF7F50',
      'turquoise': '#40E0D0',
      'violet': '#EE82EE',
      'indigo': '#4B0082',
      'lavender': '#E6E6FA',
      'khaki': '#F0E68C',
      'crimson': '#DC143C',
      
      // Textile-specific colors
      'ivory': '#FFFFF0',
      'cream': '#FFFDD0',
      'eggshell': '#F0EAD6',
      'linen': '#FAF0E6',
      'offwhite': '#F8F8FF',
      'seagreen': '#2E8B57',
      'skyblue': '#87CEEB',
      'royalblue': '#4169E1',
      'navyblue': '#000080',
      'forestgreen': '#228B22',
      'mintgreen': '#98FB98',
      'sage': '#BCB88A',
      'burgundy': '#800020',
      'rust': '#B7410E',
      'terracotta': '#E2725B',
      'charcoal': '#36454F',
      'slate': '#708090',
      'taupe': '#483C32',
      'mauve': '#E0B0FF',
      'plum': '#8E4585',
      'lilac': '#C8A2C8',
      'peach': '#FFE5B4',
      'salmon': '#FA8072',
      'rosegold': '#B76E79',
      'mustard': '#FFDB58',
      'ochre': '#CC7722'
    };
    
    // Check if the color name exists in our map (case insensitive)
    const lowerColorName = colorName.toLowerCase().trim();
    return colorMap[lowerColorName];
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Validate required fields
    if (!formData.name || !formData.materialType) {
      toast.error('Name and Material Type are required fields');
      setLoading(false);
      return;
    }

    try {
      // Create FormData object for file upload
      const formDataToSend = new FormData();
      
      // Add all text fields
      formDataToSend.append('name', formData.name);
      formDataToSend.append('materialType', formData.materialType);
      formDataToSend.append('stock', parseFloat(formData.stock) || 0);
      formDataToSend.append('supplier', formData.supplier || '');
      formDataToSend.append('unit', formData.unit || 'kg');
      formDataToSend.append('unitPrice', parseFloat(formData.unitPrice) || 0);
      formDataToSend.append('reorderLevel', parseFloat(formData.reorderLevel) || 0);
      formDataToSend.append('location', formData.location || '');
      formDataToSend.append('lastRestocked', formData.lastRestocked || '');
      formDataToSend.append('expiryDate', formData.expiryDate || '');
      formDataToSend.append('notes', formData.notes || '');
      
      // Create specifications object
      const specifications = {
        color: formData.specifications?.color || '',
        colorHex: formData.specifications?.colorHex || '',
        weight: formData.specifications?.weight || '',
        weightUnit: formData.specifications?.weightUnit || 'g/m²',
        width: formData.specifications?.width || '',
        length: formData.specifications?.length || '',
        dimensionsUnit: formData.specifications?.dimensionsUnit || 'cm',
        quality: formData.specifications?.quality || '',
        additionalInfo: formData.specifications?.additionalInfo || ''
      };

      // Add specifications as a JSON string
      formDataToSend.append('specifications', JSON.stringify(specifications));

      // Add image if there's a new one
      if (imageFile) {
        // Use the field name expected by the server
        formDataToSend.append('materialImage', imageFile);
        // Specify the upload directory
        formDataToSend.append('uploadDir', 'materials');
      }
        
      // Determine URL and method
      const baseURL = import.meta.env.VITE_API_URL || window.location.origin;
      const url = material && material._id
        ? `${baseURL}/api/raw-materials/${material._id}`
        : `${baseURL}/api/raw-materials`;
        
      const method = material && material._id ? 'put' : 'post';
      
      console.log('Submitting to URL:', url);
      console.log('Using method:', method);
      console.log('Form data keys:', [...formDataToSend.keys()]);
        
      // Make the API call
      const response = await axios[method](url, formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
        
      // Handle success
      toast.success(`Material ${material ? 'updated' : 'added'} successfully`);
      onSave(response.data);
    } catch (error) {
      console.error('Error saving material:', error);
      
      // Detailed error handling
      let errorMessage = `Failed to ${material ? 'update' : 'add'} material`;
      
      if (error.response) {
        // Server responded with error
        const serverError = error.response.data.message || error.response.data.error || error.response.statusText;
        errorMessage += `: ${serverError}`;
        
        // Special handling for specific error cases
        if (error.response.status === 413) {
          errorMessage = 'Image file is too large. Please choose a smaller image.';
        } else if (error.response.status === 415) {
          errorMessage = 'Invalid file type. Please upload a valid image file.';
        } else if (error.response.status === 400) {
          errorMessage = 'Missing required fields or invalid data. Please check your input.';
        }
      } else if (error.request) {
        // Request made but no response
        errorMessage += ': Server not responding. Please try again later.';
      } else {
        // Error in request setup
        errorMessage += `: ${error.message}`;
      }
      
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 transition-opacity duration-200">
      <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-4xl max-h-[80vh] overflow-y-auto transition-colors duration-200">
        <div className="p-3 sm:p-4">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white transition-colors duration-200">
              {material ? 'Edit' : 'Add'} Raw Material
            </h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 transition-colors duration-200"
            >
              <FaTimes />
            </button>
          </div>

          {/* Tabbed Navigation */}
          <div className="flex border-b border-gray-200 dark:border-gray-700 mb-3 overflow-x-auto no-scrollbar">
            <button
              className={`py-1.5 px-2 sm:px-3 font-medium text-xs whitespace-nowrap flex items-center gap-1 ${
                activeTab === 'basic'
                  ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
              onClick={() => setActiveTab('basic')}
            >
              Basic Info
            </button>
            <button
              className={`py-1.5 px-2 sm:px-3 font-medium text-xs whitespace-nowrap flex items-center gap-1 ${
                activeTab === 'inventory'
                  ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
              onClick={() => setActiveTab('inventory')}
            >
              Inventory
            </button>
            <button
              className={`py-1.5 px-2 sm:px-3 font-medium text-xs whitespace-nowrap flex items-center gap-1 ${
                activeTab === 'specifications'
                  ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
              onClick={() => setActiveTab('specifications')}
            >
              Specs
            </button>
            <button
              className={`py-1.5 px-2 sm:px-3 font-medium text-xs whitespace-nowrap flex items-center gap-1 ${
                activeTab === 'image'
                  ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
              onClick={() => setActiveTab('image')}
            >
              Image
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Basic Information Tab */}
            {activeTab === 'basic' && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  Basic Information
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Material Name
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                        className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        placeholder="Enter material name"
                        required
                    />
                  </div>
                    <div className="space-y-1">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Category
                    </label>
                    <select
                      name="materialType"
                      value={formData.materialType}
                      onChange={handleChange}
                        className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      >
                        {/* Fabric Material Type */}
                        <optgroup label="Fabric Material Type">
                          <option value="Cotton - Regular">Cotton - Regular</option>
                          <option value="Cotton - Egyptian">Cotton - Egyptian</option>
                          <option value="Cotton - Pima">Cotton - Pima</option>
                          <option value="Cotton - Organic">Cotton - Organic</option>
                      <option value="Polyester">Polyester</option>
                          <option value="Microfiber">Microfiber</option>
                          <option value="Linen">Linen</option>
                          <option value="Bamboo Fiber">Bamboo Fiber</option>
                          <option value="Hemp Fiber">Hemp Fiber</option>
                          <option value="Blended - Cotton-Polyester">Blended - Cotton-Polyester</option>
                          <option value="Blended - Bamboo-Cotton">Blended - Bamboo-Cotton</option>
                          <option value="Blended - Other">Blended - Other</option>
                        </optgroup>
                        
                        {/* Towel Type */}
                        <optgroup label="Towel Type">
                          <option value="Bath Towel">Bath Towel</option>
                          <option value="Hand Towel">Hand Towel</option>
                          <option value="Face Towel/Washcloth">Face Towel/Washcloth</option>
                          <option value="Beach Towel">Beach Towel</option>
                          <option value="Gym Towel">Gym Towel</option>
                          <option value="Kitchen Towel">Kitchen Towel</option>
                          <option value="Hotel & Spa Towel">Hotel & Spa Towel</option>
                        </optgroup>
                        
                        {/* Manufacturing Type */}
                        <optgroup label="Manufacturing Type">
                          <option value="Woven Towel">Woven Towel</option>
                          <option value="Knitted Towel">Knitted Towel</option>
                          <option value="Terry Towel">Terry Towel</option>
                          <option value="Waffle Towel">Waffle Towel</option>
                          <option value="Zero-Twist Towel">Zero-Twist Towel</option>
                        </optgroup>
                        
                        {/* Other Raw Materials */}
                        <optgroup label="Other Raw Materials">
                          <option value="Dyes & Chemicals">Dyes & Chemicals</option>
                          <option value="Sewing Threads">Sewing Threads</option>
                          <option value="Labels & Tags">Labels & Tags</option>
                          <option value="Packaging Materials">Packaging Materials</option>
                        </optgroup>
                    </select>
                  </div>
                    <div className="space-y-1">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Supplier
                    </label>
                    <input
                      type="text"
                      name="supplier"
                      value={formData.supplier}
                      onChange={handleChange}
                        className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        placeholder="Enter supplier name"
                    />
                  </div>
                  </div>
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Location
                    </label>
                    <input
                      type="text"
                      name="location"
                      value={formData.location}
                      onChange={handleChange}
                        className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        placeholder="Enter storage location"
                    />
                  </div>
                    <div className="space-y-1">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Last Restocked
                      </label>
                      <input
                        type="date"
                        name="lastRestocked"
                        value={formData.lastRestocked}
                        onChange={handleChange}
                        className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Expiry Date
                      </label>
                      <input
                        type="date"
                        name="expiryDate"
                        value={formData.expiryDate}
                        onChange={handleChange}
                        className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      />
                    </div>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Notes
                    </label>
                    <textarea
                      name="notes"
                      rows="3"
                      value={formData.notes}
                      onChange={handleChange}
                      className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      placeholder="Enter any additional notes"
                    ></textarea>
                  </div>
                </div>
              </div>
            )}

            {/* Inventory Information Tab */}
            {activeTab === 'inventory' && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  Inventory Information
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Stock *
                    </label>
                    <input
                      type="number"
                      name="stock"
                      required
                      min="0"
                      value={formData.stock}
                      onChange={handleChange}
                      className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Unit
                    </label>
                    <select
                      name="unit"
                      value={formData.unit}
                      onChange={handleChange}
                      className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    >
                      <option value="kg">Kilograms (kg)</option>
                      <option value="meters">Meters</option>
                      <option value="rolls">Rolls</option>
                      <option value="boxes">Boxes</option>
                      <option value="liters">Liters</option>
                      <option value="pieces">Pieces</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Unit Price
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2 text-gray-500">₹</span>
                    <input
                      type="number"
                      name="unitPrice"
                      min="0"
                      step="0.01"
                      value={formData.unitPrice}
                      onChange={handleChange}
                        className="w-full pl-7 pr-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Reorder Level
                    </label>
                    <input
                      type="number"
                      name="reorderLevel"
                      min="0"
                      value={formData.reorderLevel}
                      onChange={handleChange}
                      className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Total Value
                    </label>
                    <input
                      type="text"
                      disabled
                      value={`₹${(formData.stock * formData.unitPrice).toFixed(2)}`}
                      className="w-full px-3 py-2 text-sm border rounded-lg bg-gray-100 dark:bg-gray-600 dark:border-gray-600 dark:text-gray-300"
                    />
                  </div>

                  <div className="sm:col-span-2 lg:col-span-3 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Last Restocked
                      </label>
                      <input
                        type="date"
                        name="lastRestocked"
                        value={formData.lastRestocked}
                        onChange={handleChange}
                        className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Expiry Date
                      </label>
                      <input
                        type="date"
                        name="expiryDate"
                        value={formData.expiryDate}
                        onChange={handleChange}
                        className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Specifications Tab */}
            {activeTab === 'specifications' && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  Material Specifications
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Color Selection */}
                  <div className="sm:col-span-2 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Color Selection
                    </label>
                    <div className="flex gap-2 mt-2">
                      <div className="flex-1 relative">
                    <input
                      type="text"
                      name="color"
                      value={formData.specifications.color || ''}
                      onChange={handleSpecificationsChange}
                          className="w-full pl-8 pr-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                          placeholder="Enter color name (e.g., Red, Aqua, Golden)"
                          list="color-suggestions"
                        />
                        <datalist id="color-suggestions">
                          <option value="Red" />
                          <option value="Green" />
                          <option value="Blue" />
                          <option value="Yellow" />
                          <option value="Orange" />
                          <option value="Purple" />
                          <option value="Pink" />
                          <option value="Brown" />
                          <option value="Black" />
                          <option value="White" />
                          <option value="Gray" />
                          <option value="Aqua" />
                          <option value="Gold" />
                          <option value="Silver" />
                          <option value="Navy" />
                          <option value="Teal" />
                          <option value="Beige" />
                          <option value="Maroon" />
                          <option value="Olive" />
                          <option value="Coral" />
                          <option value="Turquoise" />
                          <option value="Lavender" />
                          <option value="Khaki" />
                          <option value="Crimson" />
                          <option value="Ivory" />
                          <option value="Cream" />
                          <option value="Linen" />
                          <option value="Sky Blue" />
                          <option value="Royal Blue" />
                          <option value="Navy Blue" />
                          <option value="Forest Green" />
                          <option value="Mint Green" />
                          <option value="Sage" />
                          <option value="Burgundy" />
                          <option value="Rust" />
                          <option value="Terracotta" />
                          <option value="Charcoal" />
                          <option value="Slate" />
                          <option value="Taupe" />
                          <option value="Mauve" />
                          <option value="Plum" />
                          <option value="Lilac" />
                          <option value="Peach" />
                          <option value="Salmon" />
                          <option value="Rose Gold" />
                          <option value="Mustard" />
                          <option value="Ochre" />
                        </datalist>
                        {formData.specifications.colorHex && (
                          <div 
                            className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border border-gray-300"
                            style={{ backgroundColor: formData.specifications.colorHex }}
                          />
                        )}
                      </div>
                      <div className="relative">
                        <input
                          type="color"
                          value={formData.specifications.colorHex || '#000000'}
                          onChange={(e) => handleColorChange(e.target.value, true)}
                          className="w-10 h-10 rounded cursor-pointer border-0 bg-transparent p-0"
                          title="Choose color"
                        />
                      </div>
                    </div>
                    <div className="mt-2">
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Hex code: {formData.specifications.colorHex || 'Not set'}</p>
                    </div>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {[
                        { name: 'White', hex: '#FFFFFF' },
                        { name: 'Black', hex: '#000000' },
                        { name: 'Red', hex: '#FF0000' },
                        { name: 'Green', hex: '#008000' },
                        { name: 'Blue', hex: '#0000FF' },
                        { name: 'Yellow', hex: '#FFFF00' },
                        { name: 'Purple', hex: '#800080' },
                        { name: 'Orange', hex: '#FFA500' },
                        { name: 'Pink', hex: '#FFC0CB' },
                        { name: 'Brown', hex: '#A52A2A' },
                        { name: 'Gray', hex: '#808080' },
                        { name: 'Gold', hex: '#FFD700' },
                        { name: 'Silver', hex: '#C0C0C0' },
                        { name: 'Navy', hex: '#000080' },
                        { name: 'Teal', hex: '#008080' },
                        { name: 'Aqua', hex: '#00FFFF' },
                        { name: 'Beige', hex: '#F5F5DC' },
                        { name: 'Maroon', hex: '#800000' },
                        { name: 'Olive', hex: '#808000' },
                        { name: 'Coral', hex: '#FF7F50' },
                        { name: 'Turquoise', hex: '#40E0D0' },
                        { name: 'Lavender', hex: '#E6E6FA' },
                        { name: 'Khaki', hex: '#F0E68C' },
                        { name: 'Crimson', hex: '#DC143C' }
                      ].map(color => (
                        <button
                          key={color.hex}
                          type="button"
                          onClick={() => {
                            handleColorChange(color.name);
                            handleColorChange(color.hex, true);
                          }}
                          className="px-2.5 py-1.5 text-xs rounded-full border flex items-center gap-1.5 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors duration-200"
                          title={color.name}
                        >
                          <span 
                            className="w-3 h-3 rounded-full border border-gray-300 shadow-sm"
                            style={{ backgroundColor: color.hex }}
                          />
                          <span>{color.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Measurements Section */}
                  <div className="sm:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
                    <div className="space-y-3">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Weight Measurement
                    </label>
                      <div className="flex gap-2">
                    <input
                          type="number"
                      name="weight"
                      value={formData.specifications.weight || ''}
                      onChange={handleSpecificationsChange}
                          className="flex-1 px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                          placeholder="Enter weight"
                          min="0"
                          step="0.01"
                        />
                        <select
                          name="weightUnit"
                          value={formData.specifications.weightUnit || 'g/m²'}
                          onChange={handleSpecificationsChange}
                          className="w-28 px-2 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        >
                          <option value="g/m²">g/m²</option>
                          <option value="kg/m²">kg/m²</option>
                          <option value="oz/yd²">oz/yd²</option>
                          <option value="g">g</option>
                          <option value="kg">kg</option>
                          <option value="lbs">lbs</option>
                        </select>
                      </div>
                  </div>

                    <div className="space-y-3">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Dimensions
                    </label>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="relative">
                    <input
                            type="number"
                            name="width"
                            value={formData.specifications.width || ''}
                      onChange={handleSpecificationsChange}
                            className="w-full pl-3 pr-8 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            placeholder="Width"
                            min="0"
                            step="0.1"
                          />
                          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-500">W</span>
                        </div>
                        <div className="relative">
                          <input
                            type="number"
                            name="length"
                            value={formData.specifications.length || ''}
                            onChange={handleSpecificationsChange}
                            className="w-full pl-3 pr-8 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            placeholder="Length"
                            min="0"
                            step="0.1"
                          />
                          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-500">L</span>
                        </div>
                      </div>
                      <select
                        name="dimensionsUnit"
                        value={formData.specifications.dimensionsUnit || 'cm'}
                        onChange={handleSpecificationsChange}
                        className="w-full px-2 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      >
                        <option value="cm">Centimeters (cm)</option>
                        <option value="m">Meters (m)</option>
                        <option value="inches">Inches (in)</option>
                        <option value="yards">Yards (yd)</option>
                        <option value="mm">Millimeters (mm)</option>
                      </select>
                    </div>
                  </div>

                  {/* Quality and Additional Info */}
                  <div className="sm:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Quality Grade
                    </label>
                      <select
                      name="quality"
                      value={formData.specifications.quality || ''}
                      onChange={handleSpecificationsChange}
                        className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      >
                        <option value="">Select Quality Grade</option>
                        <option value="Premium">Premium</option>
                        <option value="Standard">Standard</option>
                        <option value="Economy">Economy</option>
                        <option value="A-Grade">A-Grade</option>
                        <option value="B-Grade">B-Grade</option>
                        <option value="C-Grade">C-Grade</option>
                        <option value="Custom">Custom</option>
                      </select>
                  </div>

                  <div className="sm:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Additional Information
                    </label>
                    <textarea
                      name="additionalInfo"
                        rows="3"
                      value={formData.specifications.additionalInfo || ''}
                      onChange={handleSpecificationsChange}
                        className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        placeholder="Enter any other specifications or details about this material"
                    ></textarea>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Image Tab */}
            {activeTab === 'image' && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  Material Image
                </h3>
                <div className="flex flex-col sm:flex-row items-start space-y-4 sm:space-y-0 sm:space-x-4">
                  <div className="w-full sm:w-auto flex justify-center">
                  {imagePreview ? (
                    <div className="relative">
                      <img
                        src={imagePreview}
                        alt="Preview"
                          className="h-48 w-48 object-cover rounded-lg border border-gray-200 dark:border-gray-700"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setImagePreview('');
                          setImageFile(null);
                        }}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                      >
                        <FaTimes size={12} />
                      </button>
                    </div>
                  ) : (
                      <div className="h-48 w-48 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg flex items-center justify-center">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="hidden"
                        id="image-upload"
                      />
                      <label
                        htmlFor="image-upload"
                          className="cursor-pointer text-gray-500 dark:text-gray-400 flex flex-col items-center"
                      >
                          <FaUpload className="mb-2 text-2xl" />
                        <span className="text-sm">Upload Image</span>
                      </label>
                    </div>
                  )}
                  </div>
                  <div className="flex-1 space-y-4">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                        Image Guidelines
                      </h4>
                      <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1 list-disc pl-4">
                        <li>Recommended size: 300x300 pixels</li>
                        <li>Maximum file size: 5MB</li>
                        <li>Supported formats: JPG, PNG, WebP</li>
                        <li>Clear, well-lit photo of the material</li>
                      </ul>
                    </div>
                    <div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                      id="image-upload-button"
                    />
                    <label
                      htmlFor="image-upload-button"
                        className="inline-flex items-center px-4 py-2 text-sm bg-gray-100 dark:bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600"
                    >
                        <FaUpload className="mr-2" />
                      {imagePreview ? 'Change Image' : 'Upload Image'}
                    </label>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end space-x-2 pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Saving...' : material ? 'Update' : 'Add'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default RawMaterialModal; 