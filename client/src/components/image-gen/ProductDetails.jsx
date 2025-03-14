import React from 'react';

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
  return (
<div className="bg-[#1A1D24] rounded-lg border border-[#2A2F38] shadow-lg p-2 h-[calc(100vh-100px)] overflow-auto flex flex-col">
<h3 className="text-xs font-semibold text-white mb-2">Product Details</h3>
      <div className="flex-1 overflow-y-auto space-y-2 pr-1">
        {/* Basic Details */}
        <div className="space-y-2">
          <div>
            <label className="text-[10px] font-medium text-gray-400">Product Name</label>
            <input
              type="text"
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              className="w-full px-2 py-1 bg-[#2A2F38] border border-[#3A4149] rounded text-gray-100 text-[10px] focus:ring-1 focus:ring-blue-500"
              placeholder="Enter product name"
            />
          </div>
          <div>
            <label className="text-[10px] font-medium text-gray-400">Product Code</label>
            <input
              type="text"
              value={productCode}
              onChange={(e) => setProductCode(e.target.value)}
              className="w-full px-2 py-1 bg-[#2A2F38] border border-[#3A4149] rounded text-gray-100 text-[10px] focus:ring-1 focus:ring-blue-500"
              placeholder="Enter product code"
            />
          </div>
        </div>

        {/* Dimensions & Price */}
        <div className="space-y-2">
          <div>
            <label className="text-[10px] font-medium text-gray-400">Dimensions</label>
            <div className="grid grid-cols-3 gap-1">
              <div>
                <input
                  type="text"
                  placeholder="Width"
                  className="w-full px-2 py-1 bg-[#2A2F38] border border-[#3A4149] rounded text-gray-100 text-[10px] focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <input
                  type="text"
                  placeholder="Height"
                  className="w-full px-2 py-1 bg-[#2A2F38] border border-[#3A4149] rounded text-gray-100 text-[10px] focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <select className="w-full px-2 py-1 bg-[#2A2F38] border border-[#3A4149] rounded text-gray-100 text-[10px] focus:ring-1 focus:ring-blue-500">
                  <option value="cm">cm</option>
                  <option value="inches">inches</option>
                  <option value="mm">mm</option>
                </select>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] font-medium text-gray-400">Price</label>
              <div className="relative">
                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-gray-400">$</span>
                <input
                  type="text"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="w-full pl-5 pr-2 py-1 bg-[#2A2F38] border border-[#3A4149] rounded text-gray-100 text-[10px] focus:ring-1 focus:ring-blue-500"
                  placeholder="0.00"
                />
              </div>
            </div>
            <div>
              <label className="text-[10px] font-medium text-gray-400">Currency</label>
              <select className="w-full px-2 py-1 bg-[#2A2F38] border border-[#3A4149] rounded text-gray-100 text-[10px] focus:ring-1 focus:ring-blue-500">
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="GBP">GBP</option>
              </select>
            </div>
          </div>
        </div>

        {/* Material & Quality */}
        <div className="space-y-2">
          <div>
            <label className="text-[10px] font-medium text-gray-400">Material</label>
            <select className="w-full px-2 py-1 bg-[#2A2F38] border border-[#3A4149] rounded text-gray-100 text-[10px] focus:ring-1 focus:ring-blue-500">
              <option value="cotton">100% Cotton</option>
              <option value="egyptian">Egyptian Cotton</option>
              <option value="bamboo">Bamboo</option>
              <option value="microfiber">Microfiber</option>
              <option value="blend">Cotton Blend</option>
            </select>
          </div>
          <div>
            <label className="text-[10px] font-medium text-gray-400">Quality Grade</label>
            <select className="w-full px-2 py-1 bg-[#2A2F38] border border-[#3A4149] rounded text-gray-100 text-[10px] focus:ring-1 focus:ring-blue-500">
              <option value="premium">Premium</option>
              <option value="standard">Standard</option>
              <option value="economy">Economy</option>
            </select>
          </div>
        </div>

        {/* Additional Details */}
        <div className="space-y-2">
          <div>
            <label className="text-[10px] font-medium text-gray-400">Weight (GSM)</label>
            <select className="w-full px-2 py-1 bg-[#2A2F38] border border-[#3A4149] rounded text-gray-100 text-[10px] focus:ring-1 focus:ring-blue-500">
              <option value="200">200 GSM</option>
              <option value="300">300 GSM</option>
              <option value="400">400 GSM</option>
              <option value="500">500 GSM</option>
              <option value="600">600 GSM</option>
            </select>
          </div>
          <div>
            <label className="text-[10px] font-medium text-gray-400">Description</label>
            <textarea
              className="w-full px-2 py-1 bg-[#2A2F38] border border-[#3A4149] rounded text-gray-100 text-[10px] focus:ring-1 focus:ring-blue-500 h-16 resize-none"
              placeholder="Enter product description..."
            />
          </div>
        </div>

        {/* Tags */}
        <div>
          <label className="text-[10px] font-medium text-gray-400">Tags</label>
          <input
            type="text"
            className="w-full px-2 py-1 bg-[#2A2F38] border border-[#3A4149] rounded text-gray-100 text-[10px] focus:ring-1 focus:ring-blue-500"
            placeholder="Enter tags separated by commas"
          />
        </div>
      </div>
    </div>
  );
};

export default ProductDetails; 