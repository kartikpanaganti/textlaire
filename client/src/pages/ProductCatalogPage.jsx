import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import GalleryGrid from '../components/image-gen/GalleryGrid';
import ProductAdder from '../components/image-gen/ProductAdder';
import axios from 'axios';

const ProductCatalogPage = () => {
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [activeTab, setActiveTab] = useState('gallery');

  // Load products on component mount
  useEffect(() => {
    fetchProducts();
  }, []);

  // Fetch products from API
  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      // In a real app, fetch products from API
      // For demo, we'll use dummy data
      const response = await axios.get('/api/products/patterns');
      setProducts(response.data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
      // For demo, populate with sample data if the API call fails
      setProducts(getSampleProducts());
    } finally {
      setIsLoading(false);
    }
  };

  // Handle adding a new product
  const handleProductAdded = (product) => {
    setProducts([product, ...products]);
    setShowAddForm(false);
    setActiveTab('gallery');
  };

  // Delete a product
  const deleteProduct = async (productId) => {
    try {
      // In a real app, delete from API
      // await axios.delete(`/api/products/patterns/${productId}`);
      
      // Update state
      setProducts(products.filter(p => p.id !== productId));
    } catch (error) {
      console.error('Error deleting product:', error);
    }
  };

  // Update a product
  const updateProduct = (updatedProduct) => {
    setProducts(products.map(p => 
      p.id === updatedProduct.id ? updatedProduct : p
    ));
    return true;
  };

  // Render image based on product
  const renderImage = (product) => {
    return product.imageUrl;
  };
  
  // Open product preview
  const openPreview = (product) => {
    // Handle preview logic
    console.log('Preview product:', product);
  };

  // Sample products for demo
  const getSampleProducts = () => {
    return [
      {
        id: 'PROD_1',
        name: 'Luxe Bath Towel',
        code: 'TOW-001',
        type: 'Towel Pattern',
        material: 'cotton',
        color: 'Blue',
        dimensions: '50cm x 100cm',
        price: '₹29.99',
        createdAt: new Date().toISOString(),
        imageUrl: 'https://images.unsplash.com/photo-1616048056617-93b94a339009?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80'
      },
      {
        id: 'PROD_2',
        name: 'Elegant Hand Towel',
        code: 'TOW-002',
        type: 'Towel Pattern',
        material: 'egyptian',
        color: 'White',
        dimensions: '30cm x 50cm',
        price: '₹19.99',
        createdAt: new Date(Date.now() - 86400000).toISOString(),
        imageUrl: 'https://images.unsplash.com/photo-1604087340400-0bda6ef66e67?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80'
      },
      {
        id: 'PROD_3',
        name: 'Premium Bath Sheet',
        code: 'TOW-003',
        type: 'Towel Pattern',
        material: 'bamboo',
        color: 'Gray',
        dimensions: '70cm x 140cm',
        price: '₹39.99',
        createdAt: new Date(Date.now() - 172800000).toISOString(),
        imageUrl: 'https://images.unsplash.com/photo-1522937335625-b87ea99dc133?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80'
      }
    ];
  };

  return (
    <div className="h-full flex flex-col">
      {/* Page Header */}
      <div className="bg-[#1A1D24] border-b border-[#2A2F38] p-4 flex justify-between items-center">
        <h1 className="text-xl font-bold text-white">Product Catalog</h1>
        <div className="flex gap-2">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              setShowAddForm(!showAddForm);
              setActiveTab(showAddForm ? 'gallery' : 'add');
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium flex items-center gap-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            {showAddForm ? 'View Gallery' : 'Add Product'}
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => fetchProducts()}
            className="px-4 py-2 bg-[#2A2F38] text-white rounded-lg text-sm font-medium flex items-center gap-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </motion.button>
        </div>
      </div>

      {/* Tabs - Mobile only */}
      <div className="md:hidden bg-[#232830] p-2 flex border-b border-[#2A2F38]">
        <button
          onClick={() => setActiveTab('gallery')}
          className={`flex-1 py-2 rounded-lg text-center text-sm font-medium ${
            activeTab === 'gallery' ? 'bg-blue-600 text-white' : 'text-gray-400'
          }`}
        >
          Gallery
        </button>
        <button
          onClick={() => setActiveTab('add')}
          className={`flex-1 py-2 rounded-lg text-center text-sm font-medium ${
            activeTab === 'add' ? 'bg-blue-600 text-white' : 'text-gray-400'
          }`}
        >
          Add Product
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Gallery Section */}
        <div 
          className={`flex-1 p-4 overflow-auto ${
            (activeTab === 'add' && 'hidden md:block') ||
            (activeTab === 'gallery' && 'block')
          }`}
        >
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
              <p className="ml-3 text-gray-400">Loading products...</p>
            </div>
          ) : (
            <GalleryGrid
              savedImages={products}
              deleteProduct={deleteProduct}
              openPreview={openPreview}
              renderImage={renderImage}
              updateProduct={updateProduct}
            />
          )}
        </div>

        {/* Add Product Section - On larger screens this is always visible on the right */}
        <div 
          className={`md:w-1/3 p-4 overflow-auto ${
            (activeTab === 'gallery' && 'hidden md:block') ||
            (activeTab === 'add' && 'block')
          }`}
        >
          <ProductAdder onProductAdded={handleProductAdded} />
        </div>
      </div>
    </div>
  );
};

export default ProductCatalogPage; 