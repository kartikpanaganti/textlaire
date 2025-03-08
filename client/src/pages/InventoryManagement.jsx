import { useState, useEffect, useContext, useRef } from "react";
import axios from "axios";
import { ThemeContext } from "../context/ThemeProvider";
import Modal from "../components/Modal";
import DeleteConfirmationModal from "../components/DeleteConfirmationModal";

export default function InventoryManagement() {
  const { theme } = useContext(ThemeContext);
  const [search, setSearch] = useState("");
  const [inventory, setInventory] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newItem, setNewItem] = useState({ name: "", category: "", stock: "", image: null });
  const [editingItem, setEditingItem] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState(null);
  const [isImagePreviewOpen, setIsImagePreviewOpen] = useState(false);
  
  // Filter state
  const [filters, setFilters] = useState({
    category: "all",
    stockStatus: "all"
  });
  const [showFilters, setShowFilters] = useState(false);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const containerRef = useRef(null);

  const showSuccessPopup = (message) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(""), 3000); // Auto-close after 3 seconds
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  // Calculate items per page based on available height
  useEffect(() => {
    const calculateItemsPerPage = () => {
      if (containerRef.current) {
        const viewportHeight = window.innerHeight;
        // Calculate available height (viewport height minus header, search, pagination, and margins)
        const headerHeight = 120; // Approximate height of header and search
        const paginationHeight = 70; // Approximate height of pagination controls
        const margins = 40; // Approximate margins and padding
        
        const availableHeight = viewportHeight - headerHeight - paginationHeight - margins;
        
        // Each item row is approximately 60px tall
        const rowHeight = 60;
        const calculatedItemsPerPage = Math.max(3, Math.floor(availableHeight / rowHeight));
        
        setItemsPerPage(calculatedItemsPerPage);
      }
    };

    calculateItemsPerPage();
    window.addEventListener('resize', calculateItemsPerPage);
    
    return () => {
      window.removeEventListener('resize', calculateItemsPerPage);
    };
  }, []);

  const fetchInventory = async () => {
    try {
      const { data } = await axios.get("http://localhost:5000/api/inventory");
      setInventory(data);
    } catch (error) {
      console.error("Error fetching inventory:", error);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingItem(null);
    setNewItem({ name: "", category: "", stock: "", image: null });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewItem((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    setNewItem((prev) => ({ ...prev, image: e.target.files[0] }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append("name", newItem.name);
      formData.append("category", newItem.category);
      formData.append("stock", newItem.stock);
      if (newItem.image) {
        formData.append("image", newItem.image);
      }

      if (editingItem) {
        await axios.put(`http://localhost:5000/api/inventory/${editingItem._id}`, formData);
        showSuccessPopup("Item successfully updated! 🔄");
      } else {
        await axios.post("http://localhost:5000/api/inventory", formData);
        showSuccessPopup("Item successfully added! ✅");
      }

      fetchInventory();
      setIsModalOpen(false);
      setEditingItem(null);
      setNewItem({ name: "", category: "", stock: "", image: null });
    } catch (error) {
      console.error("Error saving inventory item:", error);
    }
  };

  const handleStockChange = async (id, newStock) => {
    try {
      await axios.patch(`http://localhost:5000/api/inventory/${id}/stock`, { stock: newStock });
      fetchInventory();
    } catch (error) {
      console.error("Error updating stock:", error);
    }
  };

  const handleOpenDeleteModal = (item) => {
    setSelectedItem(item);
    setIsDeleteModalOpen(true);
  };

  const handleCloseDeleteModal = () => {
    setSelectedItem(null);
    setIsDeleteModalOpen(false);
  };

  const handleConfirmDelete = async () => {
    if (selectedItem) {
      try {
        await axios.delete(`http://localhost:5000/api/inventory/${selectedItem._id}`);
        setInventory(inventory.filter((item) => item._id !== selectedItem._id));
        handleCloseDeleteModal();
        showSuccessPopup("Item successfully deleted! ❌");
      } catch (error) {
        console.error("Error deleting item", error);
      }
    }
  };

  const openImagePreview = (imageUrl) => {
    setImagePreviewUrl(imageUrl);
    setIsImagePreviewOpen(true);
  };

  const closeImagePreview = () => {
    setImagePreviewUrl(null);
    setIsImagePreviewOpen(false);
  };

  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({ ...prev, [filterType]: value }));
    setCurrentPage(1); // Reset to first page when filters change
  };

  const toggleFilters = () => {
    setShowFilters(!showFilters);
  };

  const resetFilters = () => {
    setFilters({ category: "all", stockStatus: "all" });
    setSearch("");
    setCurrentPage(1);
  };

  const exportToCSV = () => {
    // Get all categories for the header
    const categories = [...new Set(inventory.map(item => item.category))];
    
    // Create CSV content
    let csvContent = "data:text/csv;charset=utf-8,";
    
    // Add headers
    csvContent += "Name,Category,Stock\n";
    
    // Add data rows
    filteredItems.forEach(item => {
      csvContent += `"${item.name}","${item.category}","${item.stock}"\n`;
    });
    
    // Create download link
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "inventory_export.csv");
    document.body.appendChild(link);
    
    // Trigger download
    link.click();
    document.body.removeChild(link);
    
    showSuccessPopup("Inventory exported successfully! 📊");
  };

  // Get unique categories for filter dropdown
  const categories = ["all", ...new Set(inventory.map(item => item.category))];

  // Filter items based on search and filters
  const filteredItems = inventory.filter(item => {
    // Text search filter
    const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase());
    
    // Category filter
    const matchesCategory = filters.category === "all" || item.category === filters.category;
    
    // Stock status filter
    let matchesStockStatus = true;
    if (filters.stockStatus === "out") {
      matchesStockStatus = item.stock === 0;
    } else if (filters.stockStatus === "low") {
      matchesStockStatus = item.stock > 0 && item.stock < 10;
    } else if (filters.stockStatus === "available") {
      matchesStockStatus = item.stock >= 10;
    }
    
    return matchesSearch && matchesCategory && matchesStockStatus;
  });

  // Pagination Logic
  const lastIndex = currentPage * itemsPerPage;
  const firstIndex = lastIndex - itemsPerPage;
  const paginatedItems = filteredItems.slice(firstIndex, lastIndex);
  const totalPages = Math.max(1, Math.ceil(filteredItems.length / itemsPerPage));

  const openEditModal = (item) => {
    setEditingItem(item);
    setNewItem({ name: item.name, category: item.category, stock: item.stock, image: null });
    setIsModalOpen(true);
  };

  return (
    <div 
      ref={containerRef}
      className="h-full w-full flex flex-col bg-light-background dark:bg-dark-background text-light-text-primary dark:text-dark-text-primary p-3 relative"
    >
      {/* Success Popup Notification */}
      {successMessage && (
        <div className="fixed top-5 right-5 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg animate-slide-in z-50">
          {successMessage}
        </div>
      )}

      {/* Header with Search and Actions */}
      <div className="flex flex-col sm:flex-row items-center justify-between mb-3 gap-2">
        <h1 className="text-xl font-bold">Inventory Management</h1>
        
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <input
            type="text"
            placeholder="Search..."
            className="w-full sm:w-48 p-2 rounded-lg bg-white dark:bg-dark-surface border border-gray-300 dark:border-gray-700 text-light-text-primary dark:text-dark-text-primary text-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          
          <button 
            onClick={toggleFilters}
            className="p-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-colors text-sm"
            aria-label="Toggle filters"
          >
            Filter
          </button>
          
          <button 
            onClick={exportToCSV}
            className="p-2 rounded-lg bg-green-500 text-white hover:bg-green-600 transition-colors text-sm"
            aria-label="Export to CSV"
          >
            Export
          </button>
        </div>
      </div>

      {/* Filters Panel - Conditionally Rendered */}
      {showFilters && (
        <div className="bg-white dark:bg-dark-surface p-3 rounded-lg border border-gray-300 dark:border-gray-700 mb-3 text-sm">
          <div className="flex flex-wrap gap-4">
            {/* Category Filter */}
            <div>
              <label className="block text-xs font-medium mb-1">Category</label>
              <select
                value={filters.category}
                onChange={(e) => handleFilterChange('category', e.target.value)}
                className="p-1 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-700 text-sm"
              >
                <option value="all">All Categories</option>
                {categories.filter(cat => cat !== "all").map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
            
            {/* Stock Status Filter */}
            <div>
              <label className="block text-xs font-medium mb-1">Stock Status</label>
              <select
                value={filters.stockStatus}
                onChange={(e) => handleFilterChange('stockStatus', e.target.value)}
                className="p-1 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-700 text-sm"
              >
                <option value="all">All Stock Levels</option>
                <option value="out">Out of Stock</option>
                <option value="low">Low Stock (&lt; 10)</option>
                <option value="available">Available (≥ 10)</option>
              </select>
            </div>
            
            {/* Reset Button */}
            <div className="flex items-end">
              <button
                onClick={resetFilters}
                className="p-1 rounded bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-xs"
              >
                Reset Filters
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area - Takes all available space except for pagination */}
      <div className="flex-1 bg-white dark:bg-dark-surface border border-gray-300 dark:border-gray-700 rounded-lg shadow-sm overflow-hidden mb-3">
        {/* Header Row */}
        <div className="grid grid-cols-5 gap-2 bg-gray-50 dark:bg-gray-800 border-b border-gray-300 dark:border-gray-700 p-2 text-sm font-medium">
          <div className="text-center">Product</div>
          <div className="text-center">Category</div>
          <div className="text-center">Stock</div>
          <div className="text-center">Image</div>
          <div className="text-center">Actions</div>
        </div>
        
        {/* Items Grid - Scrollable */}
        <div className="divide-y divide-gray-300 dark:divide-gray-700 overflow-auto" style={{ height: 'calc(100% - 36px)' }}>
          {paginatedItems.length > 0 ? (
            paginatedItems.map((item, index) => (
              <div 
                key={item._id} 
                className={`grid grid-cols-5 gap-2 p-2 ${
                  index % 2 === 0 ? "bg-gray-50 dark:bg-gray-800" : "bg-white dark:bg-gray-700"
                } hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors text-sm`}
              >
                {/* Product Name */}
                <div className="text-center truncate">{item.name}</div>
                
                {/* Category */}
                <div className="text-center">{item.category}</div>
                
                {/* Stock Management */}
                <div className="flex items-center justify-center space-x-1">
                  <button
                    className="bg-blue-600 text-white px-2 py-1 rounded-md hover:bg-blue-700 transition text-xs"
                    onClick={() => handleStockChange(item._id, item.stock + 1)}
                    aria-label="Increase stock"
                  >
                    +
                  </button>
                  <span
                    className={`px-2 py-1 rounded-md text-white text-xs ${
                      item.stock === 0 ? "bg-red-600"      // Out of Stock
                      : item.stock < 5 ? "bg-orange-600"   // Critical Low Stock
                      : item.stock < 10 ? "bg-yellow-500"  // Low Stock
                      : item.stock < 20 ? "bg-blue-500"    // Moderate Stock
                      : "bg-green-500"                     // Sufficient Stock
                    }`}
                  >
                    {item.stock === 0 ? "Out of Stock" : item.stock}
                  </span>
                  <button
                    className="bg-blue-600 text-white px-2 py-1 rounded-md hover:bg-blue-700 transition text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={() => handleStockChange(item._id, Math.max(0, item.stock - 1))}
                    disabled={item.stock === 0}
                    aria-label="Decrease stock"
                  >
                    -
                  </button>
                </div>
                
                {/* Product Image - Clickable */}
                <div className="flex justify-center">
                  {item.image ? (
                    <img 
                      src={`http://localhost:5000${item.image}`} 
                      alt={item.name} 
                      className="w-10 h-10 object-cover rounded-md cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={() => openImagePreview(`http://localhost:5000${item.image}`)}
                    />
                  ) : (
                    <div className="w-10 h-10 bg-gray-200 dark:bg-gray-600 rounded-md flex items-center justify-center text-gray-400 dark:text-gray-500 text-xs">
                      No Image
                    </div>
                  )}
                </div>
                
                {/* Action Buttons */}
                <div className="flex items-center justify-center space-x-1">
                  <button 
                    className="bg-blue-600 px-2 py-1 rounded text-white hover:bg-blue-700 transition-colors text-xs"
                    onClick={() => openEditModal(item)}
                  >
                    Edit
                  </button>
                  <button 
                    className="bg-red-600 px-2 py-1 rounded text-white hover:bg-red-700 transition-colors text-xs"
                    onClick={() => handleOpenDeleteModal(item)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="p-4 text-center text-light-text-secondary dark:text-dark-text-secondary">
              No items found. Try a different search or add new items.
            </div>
          )}
        </div>
      </div>

      {/* Pagination - Fixed at Bottom */}
      <div className="bg-white dark:bg-dark-surface p-2 rounded-lg border border-gray-300 dark:border-gray-700 text-sm flex justify-between items-center sticky bottom-0 left-0 right-0 z-10">
        <div className="text-xs text-light-text-secondary dark:text-dark-text-secondary">
          {filteredItems.length > 0 ? (
            `${firstIndex + 1}-${Math.min(lastIndex, filteredItems.length)} of ${filteredItems.length}`
          ) : (
            "No items"
          )}
        </div>
        <div className="flex items-center gap-1">
          <button 
            className="px-2 py-1 bg-blue-600 text-white rounded disabled:opacity-50 hover:bg-blue-700 transition-colors text-xs" 
            disabled={currentPage === 1 || filteredItems.length === 0} 
            onClick={() => setCurrentPage(currentPage - 1)}
          >
            Prev
          </button>
          <span className="px-2 py-1 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded text-xs">
            {currentPage}/{Math.max(1, totalPages)}
          </span>
          <button 
            className="px-2 py-1 bg-blue-600 text-white rounded disabled:opacity-50 hover:bg-blue-700 transition-colors text-xs" 
            disabled={currentPage === totalPages || filteredItems.length === 0} 
            onClick={() => setCurrentPage(currentPage + 1)}
          >
            Next
          </button>
        </div>
      </div>

      {/* Add Item Button */}
      <button 
        onClick={() => setIsModalOpen(true)} 
        className="fixed bottom-4 right-4 bg-green-500 w-10 h-10 rounded-full text-white shadow-lg hover:bg-green-600 hover:scale-105 transition-all flex items-center justify-center z-20"
        aria-label="Add new inventory item"
      >
        +
      </button>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        maxWidth="max-w-md"
      >
        <div className="p-4 rounded-lg bg-white dark:bg-dark-surface">
          <h2 className="text-lg font-semibold mb-3">{editingItem ? "Edit Item" : "Add Item"}</h2>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1">Product Name</label>
              <input 
                type="text" 
                name="name" 
                value={newItem.name} 
                onChange={handleInputChange} 
                placeholder="Enter product name" 
                className="w-full p-2 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600" 
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Category</label>
              <input 
                type="text" 
                name="category" 
                value={newItem.category} 
                onChange={handleInputChange} 
                placeholder="Enter category" 
                className="w-full p-2 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600" 
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Stock</label>
              <input 
                type="number" 
                name="stock" 
                value={newItem.stock} 
                onChange={handleInputChange} 
                placeholder="Enter stock quantity" 
                className="w-full p-2 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600" 
                required
                min="0"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Product Image</label>
              <input 
                type="file" 
                name="image" 
                onChange={handleFileChange} 
                className="w-full p-2 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 text-sm" 
              />
            </div>
            
            <div className="flex justify-end gap-2 pt-2">
              <button 
                type="button" 
                className="px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors text-sm" 
                onClick={handleCloseModal}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors text-sm"
              >
                {editingItem ? "Update" : "Save"}
              </button>
            </div>
          </form>
        </div>
      </Modal>

      {/* Image Preview Modal */}
      <Modal
        isOpen={isImagePreviewOpen}
        onClose={closeImagePreview}
        maxWidth="max-w-2xl"
      >
        <div className="p-4 bg-white dark:bg-dark-surface rounded-lg">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-lg font-semibold">Image Preview</h3>
            <button 
              onClick={closeImagePreview}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              ✕
            </button>
          </div>
          {imagePreviewUrl && (
            <div className="flex justify-center">
              <img 
                src={imagePreviewUrl} 
                alt="Preview" 
                className="max-w-full max-h-[70vh] object-contain rounded-lg"
              />
            </div>
          )}
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={handleCloseDeleteModal}
        onConfirm={handleConfirmDelete}
        itemName={selectedItem?.name}
      />
    </div>
  );
}  