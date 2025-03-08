import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { FaTimes, FaUpload } from 'react-icons/fa';
import { format } from 'date-fns';

const RawMaterialModal = ({ isOpen, onClose, material, onSave }) => {
  const [formData, setFormData] = useState({
    name: '',
    materialType: 'Cotton',
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
      weight: '',
      dimensions: '',
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
        materialType: material.category || 'Cotton',
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
          weight: material.specifications?.weight || '',
          dimensions: material.specifications?.dimensions || '',
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
        materialType: 'Cotton',
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
          weight: '',
          dimensions: '',
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
    setFormData(prev => ({
      ...prev,
      specifications: {
        ...prev.specifications,
        [name]: value
      }
    }));
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

    try {
      // Create a data object that matches the model
      const materialData = {
        name: formData.name,
        category: formData.materialType,
        stock: Number(formData.stock),
        supplier: formData.supplier,
        unit: formData.unit,
        unitPrice: Number(formData.unitPrice),
        reorderLevel: Number(formData.reorderLevel),
        location: formData.location,
        lastRestocked: formData.lastRestocked ? new Date(formData.lastRestocked) : new Date(),
        expiryDate: formData.expiryDate ? new Date(formData.expiryDate) : null,
        notes: formData.notes,
        specifications: {
          color: formData.specifications.color,
          weight: formData.specifications.weight,
          dimensions: formData.specifications.dimensions,
          quality: formData.specifications.quality,
          additionalInfo: formData.specifications.additionalInfo
        }
      };

      console.log('Sending material data:', materialData);
      
      // If we have a new image file, we need to use FormData
      if (imageFile) {
        const formDataToSend = new FormData();
        Object.keys(materialData).forEach(key => {
          if (key !== 'image' && key !== 'specifications') {
            formDataToSend.append(key, 
              typeof materialData[key] === 'object' && materialData[key] instanceof Date 
                ? materialData[key].toISOString() 
                : materialData[key]
            );
          }
        });
        
        // Handle specifications object
        Object.keys(materialData.specifications).forEach(specKey => {
          formDataToSend.append(`specifications[${specKey}]`, materialData.specifications[specKey]);
        });
        
        formDataToSend.append('image', imageFile);
        
        const url = material
          ? `/api/raw-materials/${material._id}`
          : '/api/raw-materials';
        
        const method = material ? 'put' : 'post';
        
        console.log(`Sending ${method.toUpperCase()} request to ${url} with image`);
        
        const response = await axios[method](url, formDataToSend, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        
        // Call onSave with the response data
        onSave(response.data);
      } else {
        // No new image, just send JSON
        const url = material
          ? `/api/raw-materials/${material._id}`
          : '/api/raw-materials';
        
        const method = material ? 'put' : 'post';
        
        console.log(`Sending ${method.toUpperCase()} request to ${url}`);
        
        const response = await axios[method](url, materialData);
        
        // Call onSave with the response data
        onSave(response.data);
      }
    } catch (error) {
      console.error('Error saving material:', error);
      
      // Provide more detailed error message
      let errorMessage = `Failed to ${material ? 'update' : 'add'} material`;
      if (error.response) {
        errorMessage += `: ${error.response.data.message || error.response.statusText}`;
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
          <div className="flex border-b border-gray-200 dark:border-gray-700 mb-3 overflow-x-auto">
            <button
              className={`py-1.5 px-2 sm:px-3 font-medium text-xs whitespace-nowrap ${
                activeTab === 'basic'
                  ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
              onClick={() => setActiveTab('basic')}
            >
              Basic Info
            </button>
            <button
              className={`py-1.5 px-2 sm:px-3 font-medium text-xs whitespace-nowrap ${
                activeTab === 'inventory'
                  ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
              onClick={() => setActiveTab('inventory')}
            >
              Inventory
            </button>
            <button
              className={`py-1.5 px-2 sm:px-3 font-medium text-xs whitespace-nowrap ${
                activeTab === 'specifications'
                  ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
              onClick={() => setActiveTab('specifications')}
            >
              Specs
            </button>
            <button
              className={`py-1.5 px-2 sm:px-3 font-medium text-xs whitespace-nowrap ${
                activeTab === 'image'
                  ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
              onClick={() => setActiveTab('image')}
            >
              Image
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            {/* Basic Information Tab */}
            {activeTab === 'basic' && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3 transition-colors duration-200">
                  Basic Information
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 transition-colors duration-200">
                      Name *
                    </label>
                    <input
                      type="text"
                      name="name"
                      required
                      value={formData.name}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-colors duration-200"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 transition-colors duration-200">
                      Category *
                    </label>
                    <select
                      name="materialType"
                      required
                      value={formData.materialType}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-colors duration-200"
                    >
                      <option value="Cotton">Cotton</option>
                      <option value="Polyester">Polyester</option>
                      <option value="Dye">Dye</option>
                      <option value="Thread">Thread</option>
                      <option value="Packaging">Packaging</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 transition-colors duration-200">
                      Supplier
                    </label>
                    <input
                      type="text"
                      name="supplier"
                      value={formData.supplier}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-colors duration-200"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 transition-colors duration-200">
                      Location
                    </label>
                    <input
                      type="text"
                      name="location"
                      value={formData.location}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-colors duration-200"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 transition-colors duration-200">
                      Notes
                    </label>
                    <textarea
                      name="notes"
                      rows="2"
                      value={formData.notes || ''}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-colors duration-200"
                      placeholder="Add any additional information about this material"
                    ></textarea>
                  </div>

                  {material && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 transition-colors duration-200">
                        Created / Updated
                      </label>
                      <div className="text-sm text-gray-600 dark:text-gray-400 transition-colors duration-200">
                        {createdAt && <div>Created: {createdAt}</div>}
                        {updatedAt && <div>Updated: {updatedAt}</div>}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Inventory Information Tab */}
            {activeTab === 'inventory' && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3 transition-colors duration-200">
                  Inventory Information
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 transition-colors duration-200">
                      Stock *
                    </label>
                    <input
                      type="number"
                      name="stock"
                      required
                      min="0"
                      value={formData.stock}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-colors duration-200"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 transition-colors duration-200">
                      Unit
                    </label>
                    <select
                      name="unit"
                      value={formData.unit}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-colors duration-200"
                    >
                      <option value="kg">Kilograms (kg)</option>
                      <option value="meters">Meters</option>
                      <option value="rolls">Rolls</option>
                      <option value="boxes">Boxes</option>
                      <option value="liters">Liters</option>
                      <option value="pieces">Pieces</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 transition-colors duration-200">
                      Unit Price
                    </label>
                    <input
                      type="number"
                      name="unitPrice"
                      min="0"
                      step="0.01"
                      value={formData.unitPrice}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-colors duration-200"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 transition-colors duration-200">
                      Reorder Level
                    </label>
                    <input
                      type="number"
                      name="reorderLevel"
                      min="0"
                      value={formData.reorderLevel}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-colors duration-200"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 transition-colors duration-200">
                      Total Value
                    </label>
                    <input
                      type="text"
                      disabled
                      value={`₹${(formData.stock * formData.unitPrice).toFixed(2)}`}
                      className="w-full px-3 py-2 border rounded-lg bg-gray-100 dark:bg-gray-600 dark:border-gray-600 dark:text-gray-300 transition-colors duration-200"
                    />
                  </div>

                  <div className="flex gap-3">
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 transition-colors duration-200">
                        Last Restocked
                      </label>
                      <input
                        type="date"
                        name="lastRestocked"
                        value={formData.lastRestocked}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-colors duration-200"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 transition-colors duration-200">
                        Expiry Date
                      </label>
                      <input
                        type="date"
                        name="expiryDate"
                        value={formData.expiryDate}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-colors duration-200"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Specifications Tab */}
            {activeTab === 'specifications' && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3 transition-colors duration-200">
                  Material Specifications
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 transition-colors duration-200">
                      Color
                    </label>
                    <input
                      type="text"
                      name="color"
                      value={formData.specifications.color || ''}
                      onChange={handleSpecificationsChange}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-colors duration-200"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 transition-colors duration-200">
                      Weight
                    </label>
                    <input
                      type="text"
                      name="weight"
                      value={formData.specifications.weight || ''}
                      onChange={handleSpecificationsChange}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-colors duration-200"
                      placeholder="e.g., 200g/m²"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 transition-colors duration-200">
                      Dimensions
                    </label>
                    <input
                      type="text"
                      name="dimensions"
                      value={formData.specifications.dimensions || ''}
                      onChange={handleSpecificationsChange}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-colors duration-200"
                      placeholder="e.g., 150cm width"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 transition-colors duration-200">
                      Quality
                    </label>
                    <input
                      type="text"
                      name="quality"
                      value={formData.specifications.quality || ''}
                      onChange={handleSpecificationsChange}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-colors duration-200"
                      placeholder="e.g., Premium, Standard"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 transition-colors duration-200">
                      Additional Information
                    </label>
                    <textarea
                      name="additionalInfo"
                      rows="2"
                      value={formData.specifications.additionalInfo || ''}
                      onChange={handleSpecificationsChange}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-colors duration-200"
                      placeholder="Any other specifications or details about this material"
                    ></textarea>
                  </div>
                </div>
              </div>
            )}

            {/* Image Tab */}
            {activeTab === 'image' && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3 transition-colors duration-200">
                  Material Image
                </h3>
                <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-4">
                  {imagePreview ? (
                    <div className="relative">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="h-36 w-36 object-cover rounded-lg border border-gray-200 dark:border-gray-700 transition-colors duration-200"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setImagePreview('');
                          setImageFile(null);
                        }}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors duration-200"
                      >
                        <FaTimes size={12} />
                      </button>
                    </div>
                  ) : (
                    <div className="h-36 w-36 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg flex items-center justify-center transition-colors duration-200">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="hidden"
                        id="image-upload"
                      />
                      <label
                        htmlFor="image-upload"
                        className="cursor-pointer text-gray-500 dark:text-gray-400 flex flex-col items-center transition-colors duration-200"
                      >
                        <FaUpload className="mb-1 text-2xl" />
                        <span className="text-sm">Upload Image</span>
                      </label>
                    </div>
                  )}
                  <div className="flex-1">
                    <p className="text-sm text-gray-600 dark:text-gray-400 transition-colors duration-200">
                      Upload an image of the material. Recommended size: 300x300px. This helps with identification and inventory management.
                    </p>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                      id="image-upload-button"
                    />
                    <label
                      htmlFor="image-upload-button"
                      className="mt-2 inline-block px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors duration-200"
                    >
                      <FaUpload className="inline-block mr-2" />
                      {imagePreview ? 'Change Image' : 'Upload Image'}
                    </label>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end space-x-2 mt-3 pt-2 border-t border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1 text-xs border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors duration-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-3 py-1 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
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