import { useState, useEffect, useContext } from "react";
import axios from "axios";
import { ThemeContext } from "../context/ThemeProvider";


export default function InventoryManagement() {
  const { theme } = useContext(ThemeContext);
  const [search, setSearch] = useState("");
  const [inventory, setInventory] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newItem, setNewItem] = useState({ name: "", category: "", stock: "", image: null });
  const [editingItem, setEditingItem] = useState(null);
  const [successMessage, setSuccessMessage] = useState(""); // ✅ Success Message State
  // ✅ Add missing state variables
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  // ✅ Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5; // Set number of items per page

  const showSuccessPopup = (message) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(""), 3000); // Auto-close after 3 seconds
  };

  useEffect(() => {
    fetchInventory();
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
    setEditingItem(null); // Reset editing item when closing the modal
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

  // ✅ Open Delete Modal
  const handleOpenDeleteModal = (item) => {
    setSelectedItem(item);
    setIsDeleteModalOpen(true);
  };

  // ✅ Close Delete Modal
  const handleCloseDeleteModal = () => {
    setSelectedItem(null);
    setIsDeleteModalOpen(false);
  };

  // ✅ Confirm Delete Item
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

  // ✅ Pagination Logic
  const lastIndex = currentPage * itemsPerPage;
  const firstIndex = lastIndex - itemsPerPage;
  const paginatedItems = inventory
    .filter((item) => item.name.toLowerCase().includes(search.toLowerCase()))
    .slice(firstIndex, lastIndex);

  const totalPages = Math.ceil(inventory.length / itemsPerPage);


  const openEditModal = (item) => {
    setEditingItem(item);
    setNewItem({ name: item.name, category: item.category, stock: item.stock, image: null });
    setIsModalOpen(true);
  };

  return (
    <div className={`h-screen overflow-hidden flex flex-col items-center p-4 ${theme === "dark" ? "bg-gray-900 text-white" : "bg-white text-gray-900"}`}>

      {/* Success Popup Notification */}
      {successMessage && (
        <div className="fixed top-5 right-5 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg">
          {successMessage}
        </div>
      )}

      {/* 🔍 Search Bar */}
      <input
        type="text"
        placeholder="Search Inventory..."
        className={`w-full max-w-2xl p-2 rounded mb-4 text-center ${theme === "dark" ? "bg-gray-700 text-white" : "bg-gray-200 text-gray-900"}`}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {/* 📊 Inventory Table - Fixed Theme & Scrollbar Issue */}
      <div className="w-full max-w-6xl border border-gray-600 rounded-lg">
        <div className="overflow-x-auto">
          <div className="overflow-y-auto max-h-[70vh]">
            <table className={`min-w-full text-left border-collapse ${theme === "dark" ? "bg-gray-800 text-white" : "bg-gray-100 text-gray-900"}`}>
              <thead className={`${theme === "dark" ? "bg-gray-900 text-white" : "bg-gray-500 text-gray-900"} sticky top-0`}>
                <tr>
                  <th className="p-3 text-center w-[20%]">Product</th>
                  <th className="p-3 text-center w-[15%]">Category</th>
                  <th className="p-3 text-center w-[20%]">Stock</th>
                  <th className="p-3 text-center w-[20%]">Image</th>
                  <th className="p-3 text-center w-[25%]">Actions</th>
                </tr>
              </thead>
              {/* 🔵 Table Body with a Different Color */}
              <tbody className={`${theme === "dark" ? "bg-gray-700 text-white" : "bg-gray-100 text-gray-900"}`}>
                {paginatedItems.map((item, index) => (
                  <tr key={item._id} className={`border-b transition h-16 ${theme === "dark" ? (index % 2 === 0 ? "bg-gray-700" : "bg-gray-800") : (index % 2 === 0 ? "bg-gray-200" : "bg-white")} hover:${theme === "dark" ? "bg-gray-600" : "bg-gray-300"}`}>
                    <td className="p-3 text-center truncate">{item.name}</td>
                    <td className="p-3 text-center">{item.category}</td>

                    {/* 📦 Stock Management */}
                    <td className="p-3 flex items-center justify-center space-x-2">
                      <button
                        className="bg-black text-white px-3 py-1 rounded-md hover:bg-cyan-600 transition"
                        onClick={() => handleStockChange(item._id, item.stock + 1)}
                      >
                        +     {/* // 🔼 Increase Stock */}
                      </button>
                      <span
                        className={`px-3 py-1 rounded-md text-white ${item.stock === 0 ? "bg-red-600"      // 🔴 Out of Stock
                          : item.stock < 5 ? "bg-orange-600"     // 🟠 Critical Low Stock
                            : item.stock < 10 ? "bg-yellow-500"    // 🟡 Low Stock
                              : item.stock < 20 ? "bg-blue-500"      // 🔵 Moderate Stock
                                : "bg-green-500"}                      // 🟢 Sufficient Stock `}
                      >
                        {item.stock === 0 ? "Out of Stock" : item.stock}
                      </span>


                      <button
                        className="bg-black text-white px-3 py-1 rounded-md hover:bg-cyan-600 transition"
                        onClick={() => handleStockChange(item._id, item.stock - 1)}
                        disabled={item.stock === 0}
                      >
                       -    {/* // 🔻 Decrease Stock */}
                      </button>
                    </td>

                    <td className="p-3 text-center">
                      {item.image && <img src={`http://localhost:5000${item.image}`} alt={item.name} className="w-16 h-16 object-cover rounded-md mx-auto" />}
                    </td>

                    <td className="p-3 text-center">
                      <button className={`${theme === "dark" ? "bg-blue-600 px-3 py-1 rounded mr-2 text-white" : "bg-blue-600 px-3 py-1 rounded mr-2 text-white"}`}onClick={() => openEditModal(item)}>Edit</button>
                      <button className={`${theme === "dark" ? "bg-red-600 px-3 py-1 rounded mr-2 text-white" : "bg-red-600 px-3 py-1 rounded mr-2 text-white"}`} onClick={() => handleOpenDeleteModal(item)}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 📌 Pagination Controls */}
      <div className="flex justify-between items-center mt-4 w-full max-w-4xl">
        <button className="px-4 py-2 bg-gray-600 text-white rounded disabled:opacity-50" disabled={currentPage === 1} onClick={() => setCurrentPage(currentPage - 1)}>
          Previous
        </button>
        <span>Page {currentPage} of {totalPages}</span>
        <button className="px-4 py-2 bg-gray-600 text-white rounded disabled:opacity-50" disabled={currentPage === totalPages} onClick={() => setCurrentPage(currentPage + 1)}>
          Next
        </button>
      </div>

      {/* ➕ Floating Add Button */}
      <button onClick={() => setIsModalOpen(true)} className="fixed bottom-6 right-6 bg-green-500 px-5 py-3 rounded-full text-white text-lg shadow-lg hover:scale-105 transition-transform">
        + Add Item
      </button>

      {/* 📝 Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50" onClick={handleCloseModal}>
          <div className={`p-6 rounded-lg w-96 ${theme === "dark" ? "bg-gray-800 text-white" : "bg-white text-gray-900"}`} onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-semibold mb-4">{editingItem ? "Edit Item" : "Add Inventory Item"}</h2>
            <form onSubmit={handleSubmit}>
              <input type="text" name="name" value={newItem.name} onChange={handleInputChange} placeholder="Product Name" className="w-full p-2 rounded mb-2" />
              <input type="text" name="category" value={newItem.category} onChange={handleInputChange} placeholder="Category" className="w-full p-2 rounded mb-2" />
              <input type="number" name="stock" value={newItem.stock} onChange={handleInputChange} placeholder="Stock" className="w-full p-2 rounded mb-2" />
              <input type="file" name="image" onChange={handleFileChange} className="w-full p-2 rounded mb-2" />
              <div className="flex justify-end mt-4">
                <button type="button" className="bg-gray-500 px-4 py-2 rounded text-white mr-2" onClick={handleCloseModal}>Cancel</button>
                <button type="submit" className="bg-blue-500 px-4 py-2 rounded text-white">{editingItem ? "Update" : "Save"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ❌ Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-gray-800 p-6 rounded-lg w-96">
            <h2 className="text-lg font-semibold text-white mb-4">Confirm Deletion</h2>
            <p className="text-gray-300 mb-4">Are you sure you want to delete <strong>{selectedItem?.name}</strong>?</p>
            <div className="flex justify-end space-x-2">
              <button className="bg-gray-500 px-4 py-2 rounded text-white" onClick={handleCloseDeleteModal}>Cancel</button>
              <button className="bg-red-500 px-4 py-2 rounded text-white" onClick={handleConfirmDelete}>Confirm Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

}  