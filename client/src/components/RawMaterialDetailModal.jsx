import React from 'react';
import { format } from 'date-fns';
import { FaTimes, FaCalendarAlt, FaBox, FaTag, FaMapMarkerAlt, FaInfoCircle, FaWarehouse, FaMoneyBillWave, FaClipboardList } from 'react-icons/fa';

const RawMaterialDetailModal = ({ isOpen, onClose, material }) => {
  if (!isOpen || !material) return null;
  
  // Format dates for display
  const formatDate = (dateString) => {
    if (!dateString) return 'Not set';
    try {
      return format(new Date(dateString), 'MMM d, yyyy');
    } catch (error) {
      return 'Invalid date';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-60 backdrop-blur-sm transition-opacity duration-300">
      <div 
        className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-5xl max-h-[95vh] overflow-auto transition-colors duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            {material.image ? (
              <img 
                src={material.image} 
                alt={material.name} 
                className="h-8 w-8 rounded-full object-cover border border-gray-200 dark:border-gray-700"
              />
            ) : (
              <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                <span className="text-blue-800 dark:text-blue-200 font-bold">
                  {material.name.substring(0, 2).toUpperCase()}
                </span>
              </div>
            )}
            {material.name}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-200"
            aria-label="Close"
          >
            <FaTimes className="text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-3 bg-gray-50 dark:bg-gray-900">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Basic Information */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700 shadow-sm">
              <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2 flex items-center gap-1.5 pb-1 border-b border-gray-200 dark:border-gray-700">
                <FaInfoCircle className="text-blue-500" size={14} />
                Basic Information
              </h3>
              
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="font-medium text-gray-500 dark:text-gray-400">Category:</span>
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                    {material.category || 'Not specified'}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="font-medium text-gray-500 dark:text-gray-400">Supplier:</span>
                  <span className="text-gray-900 dark:text-white">{material.supplier || 'Not specified'}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="font-medium text-gray-500 dark:text-gray-400">Location:</span>
                  <span className="text-gray-900 dark:text-white flex items-center gap-1">
                    <FaMapMarkerAlt className="text-gray-400" size={10} />
                    {material.location || 'Not specified'}
                  </span>
                </div>
              </div>
            </div>

            {/* Inventory Information */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700 shadow-sm">
              <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2 flex items-center gap-1.5 pb-1 border-b border-gray-200 dark:border-gray-700">
                <FaWarehouse className="text-green-500" size={14} />
                Inventory
              </h3>
              
              <div className="space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-gray-500 dark:text-gray-400">Stock:</span>
                  <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium ${
                    material.stock === 0 
                      ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' 
                      : material.stock < material.reorderLevel 
                        ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' 
                        : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                  }`}>
                    {material.stock} {material.unit}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="font-medium text-gray-500 dark:text-gray-400">Reorder Level:</span>
                  <span className="text-gray-900 dark:text-white">{material.reorderLevel} {material.unit}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="font-medium text-gray-500 dark:text-gray-400">Unit Price:</span>
                  <span className="text-gray-900 dark:text-white">₹{material.unitPrice?.toFixed(2) || '0.00'}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="font-medium text-gray-500 dark:text-gray-400">Total Value:</span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    ₹{((material.stock || 0) * (material.unitPrice || 0)).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* Specifications */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700 shadow-sm">
              <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2 flex items-center gap-1.5 pb-1 border-b border-gray-200 dark:border-gray-700">
                <FaClipboardList className="text-purple-500" size={14} />
                Specifications
              </h3>
              
              <div className="space-y-2 text-xs">
                {material.specifications?.color && (
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-gray-500 dark:text-gray-400">Color:</span>
                    <span className="flex items-center gap-1.5">
                      <span 
                        className="w-4 h-4 rounded-full border border-gray-300 shadow-sm"
                        style={{ backgroundColor: material.specifications.colorHex || material.specifications.color }}
                      />
                      <span className="text-gray-900 dark:text-white">{material.specifications.color}</span>
                    </span>
                  </div>
                )}
                
                {material.specifications?.weight && (
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-500 dark:text-gray-400">Weight:</span>
                    <span className="text-gray-900 dark:text-white">
                      {material.specifications.weight} {material.specifications.weightUnit || 'g/m²'}
                    </span>
                  </div>
                )}
                
                {(material.specifications?.width || material.specifications?.length) && (
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-gray-500 dark:text-gray-400">Dimensions:</span>
                    <span className="text-gray-900 dark:text-white flex items-center gap-1.5">
                      <FaBox className="text-gray-400" size={10} />
                      {material.specifications.width || '-'} × {material.specifications.length || '-'} {material.specifications.dimensionsUnit || 'cm'}
                    </span>
                  </div>
                )}
                
                {material.specifications?.quality && (
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-500 dark:text-gray-400">Quality:</span>
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                      {material.specifications.quality}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Timestamps */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700 shadow-sm">
              <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2 flex items-center gap-1.5 pb-1 border-b border-gray-200 dark:border-gray-700">
                <FaCalendarAlt className="text-orange-500" size={14} />
                Dates
              </h3>
              
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="font-medium text-gray-500 dark:text-gray-400">Created:</span>
                  <span className="text-gray-900 dark:text-white">{formatDate(material.createdAt)}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="font-medium text-gray-500 dark:text-gray-400">Updated:</span>
                  <span className="text-gray-900 dark:text-white flex items-center gap-1.5">
                    <FaCalendarAlt className="text-blue-500" size={10} />
                    {formatDate(material.updatedAt)}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="font-medium text-gray-500 dark:text-gray-400">Restocked:</span>
                  <span className="text-gray-900 dark:text-white flex items-center gap-1.5">
                    <FaCalendarAlt className="text-green-500" size={10} />
                    {formatDate(material.lastRestocked)}
                  </span>
                </div>
                
                {material.expiryDate && (
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-500 dark:text-gray-400">Expires:</span>
                    <span className="text-gray-900 dark:text-white">{formatDate(material.expiryDate)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Notes Section - Full Width */}
          {material.notes && (
            <div className="mt-3 bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700 shadow-sm">
              <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2 flex items-center gap-1.5 pb-1 border-b border-gray-200 dark:border-gray-700">
                <FaInfoCircle className="text-gray-500" size={14} />
                Notes
              </h3>
              <p className="text-xs text-gray-900 dark:text-white whitespace-pre-wrap">
                {material.notes}
              </p>
            </div>
          )}
          
          {/* Additional Info - Full Width */}
          {material.specifications?.additionalInfo && (
            <div className="mt-3 bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700 shadow-sm">
              <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2 flex items-center gap-1.5 pb-1 border-b border-gray-200 dark:border-gray-700">
                <FaInfoCircle className="text-purple-500" size={14} />
                Additional Specifications
              </h3>
              <p className="text-xs text-gray-900 dark:text-white whitespace-pre-wrap">
                {material.specifications.additionalInfo}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 border-t border-gray-200 dark:border-gray-700 p-3 flex justify-end bg-white dark:bg-gray-800">
          <button
            onClick={onClose}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200 font-medium text-sm"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default RawMaterialDetailModal;