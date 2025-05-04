import React from 'react';
import QRCode from 'react-qr-code';
import Barcode from 'react-barcode';

const ProductCodes = ({ product }) => {
  // Generate a unique product URL (you can modify this based on your needs)
  const productUrl = `${window.location.origin}/products/${product.id}`;
  
  // Format product data for QR code
  const qrData = JSON.stringify({
    id: product.id,
    name: product.name,
    code: product.code,
    type: product.type,
    material: product.material,
    dimensions: product.dimensions,
    price: product.price
  });

  return (
    <div className="bg-[#1A1D24] rounded-lg border border-[#2A2F38] p-4 space-y-6">
      {/* Product Info Header */}
      <div className="text-center mb-4">
        <h3 className="text-lg font-semibold text-white">{product.name}</h3>
        <p className="text-sm text-gray-400">{product.code}</p>
      </div>

      {/* Barcode Section */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-white">Product Barcode</h4>
        <div className="bg-white p-4 rounded-lg flex justify-center">
          <Barcode 
            value={product.code}
            width={1.5}
            height={50}
            fontSize={12}
          />
        </div>
      </div>

      {/* QR Code Section */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-white">Product QR Code</h4>
        <div className="bg-white p-4 rounded-lg flex justify-center">
          <QRCode 
            value={qrData}
            size={150}
            level="H"
            className="h-32 w-32"
          />
        </div>
        <p className="text-xs text-gray-400 text-center mt-2">
          Scan to view complete product details
        </p>
      </div>

      {/* Print Button */}
      <button
        onClick={() => window.print()}
        className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors"
      >
        Print Codes
      </button>

      {/* Add print styles */}
      <style jsx>{`
        @media print {
          .bg-[#1A1D24] {
            background-color: white !important;
            border: none !important;
          }
          .text-white, .text-gray-400 {
            color: black !important;
          }
          button {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
};

export default ProductCodes; 