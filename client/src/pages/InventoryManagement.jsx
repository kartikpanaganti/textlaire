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

    // ✅ Add missing state variables
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);
  

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
      } else {
        await axios.post("http://localhost:5000/api/inventory", formData);
      }

      fetchInventory();
      setIsModalOpen(false);
      setEditingItem(null);
      setNewItem({ name: "", category: "", stock: "", image: null });
    } catch (error) {
      console.error("Error saving inventory item:", error);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this item?")) return;
    try {
      await axios.delete(`http://localhost:5000/api/inventory/${id}`);
      fetchInventory();
    } catch (error) {
      console.error("Error deleting inventory item:", error);
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
      } catch (error) {
        console.error("Error deleting item", error);
      }
    }
  };

  const openEditModal = (item) => {
    setEditingItem(item);
    setNewItem({ name: item.name, category: item.category, stock: item.stock, image: null });
    setIsModalOpen(true);
  };

  return (
    <div className={`p-6 min-h-screen ${theme === "dark" ? "bg-gray-900 text-white" : "bg-white text-gray-900"}`}>
      <div className="flex flex-col md:flex-row justify-between items-center mb-6">
        <h1 className="text-2xl font-bold mb-4 md:mb-0">Inventory Management</h1>
        <button onClick={() => setIsModalOpen(true)} className="bg-green-500 px-4 py-2 rounded text-white">
          + Add Item
        </button>
      </div>

      <input
        type="text"
        placeholder="Search Inventory..."
        className={`w-full p-2 rounded mb-4 ${theme === "dark" ? "bg-gray-700 text-white" : "bg-gray-200 text-gray-900"}`}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <div className={`p-4 rounded-lg overflow-x-auto ${theme === "dark" ? "bg-gray-800" : "bg-gray-100"}`}>
        <table className="w-full text-left min-w-[600px]">
          <thead>
            <tr className={`border-b ${theme === "dark" ? "border-gray-600 text-gray-300" : "border-gray-300 text-gray-900"}`}>
              <th className="p-3 text-center">Product</th>
              <th className="p-3 text-center">Category</th>
              <th className="p-3 text-center">Stock</th>
              <th className="p-3 text-center">Image</th>
              <th className="p-3 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {inventory
              .filter((item) => item.name.toLowerCase().includes(search.toLowerCase()))
              .map((item) => (
                <tr key={item._id} className={`border-b ${theme === "dark" ? "border-gray-700" : "border-gray-300"}`}>
                  <td className="p-3 text-center">{item.name}</td>
                  <td className="p-3 text-center">{item.category}</td>
                  <td className="p-3 flex items-center justify-center space-x-2">
                    <button
                      className="bg-green-500 text-white px-3 py-1 rounded-md"
                      onClick={() => handleStockChange(item._id, item.stock + 1)}
                    >
                      +
                    </button>
                    <span className={`px-3 py-1 rounded-md text-white ${item.stock === 0 ? "bg-red-500" : item.stock < 10 ? "bg-orange-500" : "bg-green-500"}`}>
                      {item.stock}
                    </span>
                    <button
                      className="bg-purple-500 text-white px-3 py-1 rounded-md"
                      onClick={() => handleStockChange(item._id, item.stock - 1)}
                      disabled={item.stock === 0}
                    >
                      -
                    </button>
                  </td>
                  <td className="p-3 text-center">
                    {item.image && <img src={`http://localhost:5000${item.image}`} alt={item.name} className="w-16 h-16 object-cover rounded-md mx-auto" />}
                  </td>
                  <td className="p-3 text-center">
                    <button className="bg-blue-500 px-3 py-1 rounded mr-2" onClick={() => openEditModal(item)}>
                      Edit
                    </button>
                    <button className="bg-red-500 px-3 py-1 rounded" onClick={() => handleOpenDeleteModal(item)}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div
          className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50"
          onClick={handleCloseModal} // Closes modal when clicking outside
        >
          <div
            className={`p-6 rounded-lg w-96 ${theme === "dark" ? "bg-gray-800" : "bg-white"}`}
            onClick={(e) => e.stopPropagation()} // Prevents closing when clicking inside
          >
            <h2 className="text-lg font-semibold mb-4">
              {editingItem ? "Edit Item" : "Add Inventory Item"}
            </h2>
            <form onSubmit={handleSubmit}>
              <input
                type="text"
                name="name"
                value={newItem.name}
                onChange={handleInputChange}
                placeholder="Product Name"
                className="w-full p-2 rounded mb-2"
              />
              <input
                type="text"
                name="category"
                value={newItem.category}
                onChange={handleInputChange}
                placeholder="Category"
                className="w-full p-2 rounded mb-2"
              />
              <input
                type="number"
                name="stock"
                value={newItem.stock}
                onChange={handleInputChange}
                placeholder="Stock"
                className="w-full p-2 rounded mb-2"
              />
              <input
                type="file"
                name="image"
                onChange={handleFileChange}
                className="w-full p-2 rounded mb-2"
              />
              <div className="flex justify-end mt-4">
                <button
                  type="button"
                  className="bg-gray-500 px-4 py-2 rounded text-white mr-2"
                  onClick={handleCloseModal} // Cancel button closes modal
                >
                  Cancel
                </button>
                <button type="submit" className="bg-blue-500 px-4 py-2 rounded text-white">
                  {editingItem ? "Update" : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

       {/* Delete Confirmation Modal */}
       {isDeleteModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-gray-800 p-6 rounded-lg w-96">
            <h2 className="text-lg font-semibold text-white mb-4">Confirm Deletion</h2>
            <p className="text-gray-300 mb-4">Are you sure you want to delete <strong>{selectedItem?.name}</strong>?</p>
            <div className="flex justify-end space-x-2">
              <button className="bg-gray-500 px-4 py-2 rounded text-white" onClick={handleCloseDeleteModal}>
                Cancel
              </button>
              <button className="bg-red-500 px-4 py-2 rounded text-white" onClick={handleConfirmDelete}>
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}



    </div>
  );
}
