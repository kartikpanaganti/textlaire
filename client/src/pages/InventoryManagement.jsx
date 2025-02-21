import { useState, useEffect } from "react";
import axios from "axios";

export default function InventoryManagement() {
  const [search, setSearch] = useState("");
  const [inventory, setInventory] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newItem, setNewItem] = useState({ name: "", category: "", stock: "", image: null });
  const [editingItem, setEditingItem] = useState(null);

  // Fetch Inventory from Backend
  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    const { data } = await axios.get("http://localhost:5000/api/inventory");
    setInventory(data);
  };

  // Handle Input Change
  const handleChange = (e) => {
    setNewItem({ ...newItem, [e.target.name]: e.target.value });
  };

  // Handle Image Upload
  const handleFileChange = (e) => {
    setNewItem({ ...newItem, image: e.target.files[0] });
  };

  // Add or Update Inventory Item
  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append("name", newItem.name);
    formData.append("category", newItem.category);
    formData.append("stock", newItem.stock);
    if (newItem.image) formData.append("image", newItem.image);

    if (editingItem) {
      await axios.put(`http://localhost:5000/api/inventory/${editingItem._id}`, formData);
    } else {
      await axios.post("http://localhost:5000/api/inventory", formData);
    }

    setNewItem({ name: "", category: "", stock: "", image: null });
    setIsModalOpen(false);
    setEditingItem(null);
    fetchInventory();
  };

  // Delete Item
  const handleDelete = async (id) => {
    await axios.delete(`http://localhost:5000/api/inventory/${id}`);
    fetchInventory();
  };

  // Open Modal for Editing
  const handleEdit = (item) => {
    setNewItem({ name: item.name, category: item.category, stock: item.stock, image: null });
    setEditingItem(item);
    setIsModalOpen(true);
  };

  return (
    <div className="p-6 bg-gray-900 min-h-screen text-white">
      {/* Header Section */}
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Inventory Management</h1>
        <button onClick={() => setIsModalOpen(true)} className="bg-green-500 px-4 py-2 rounded text-white">
          + Add Item
        </button>
      </div>

      {/* Search Input */}
      <input
        type="text"
        placeholder="Search Inventory..."
        className="w-full p-2 rounded bg-gray-700 text-white mb-4"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {/* Inventory Table */}
      <div className="bg-gray-800 p-4 rounded-lg">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-gray-600">
              <th className="p-2">Product</th>
              <th className="p-2">Category</th>
              <th className="p-2">Stock</th>
              <th className="p-2">Image</th>
              <th className="p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {inventory
              .filter((item) => item.name.toLowerCase().includes(search.toLowerCase()))
              .map((item) => (
                <tr key={item._id} className="border-b border-gray-700">
                  <td className="p-2">{item.name}</td>
                  <td className="p-2">{item.category}</td>
                  <td className="p-2">
                    <span className={`px-2 py-1 rounded text-white ${item.stock === 0 ? "bg-red-500" : item.stock < 20 ? "bg-yellow-500" : "bg-green-500"}`}>
                      {item.stock === 0 ? "Out of Stock" : item.stock}
                    </span>
                  </td>
                  <td className="p-2">
                    {item.image && <img src={`http://localhost:5000${item.image}`} alt={item.name} className="w-16 h-16 object-cover rounded-md" />}
                  </td>
                  <td className="p-2">
                    <button onClick={() => handleEdit(item)} className="bg-blue-500 px-3 py-1 rounded mr-2">Edit</button>
                    <button onClick={() => handleDelete(item._id)} className="bg-red-500 px-3 py-1 rounded">Delete</button>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {/* Modal for Adding/Editing Items */}
      {isModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-gray-800 p-6 rounded-lg w-96">
            <h2 className="text-lg font-semibold mb-4">{editingItem ? "Edit Item" : "Add Inventory Item"}</h2>
            <form onSubmit={handleSubmit}>
              <input type="text" name="name" placeholder="Product Name" className="w-full p-2 rounded bg-gray-700 text-white mb-2" value={newItem.name} onChange={handleChange} required />
              <input type="text" name="category" placeholder="Category" className="w-full p-2 rounded bg-gray-700 text-white mb-2" value={newItem.category} onChange={handleChange} required />
              <input type="number" name="stock" placeholder="Stock Quantity" className="w-full p-2 rounded bg-gray-700 text-white mb-2" value={newItem.stock} onChange={handleChange} required />
              <input type="file" onChange={handleFileChange} className="w-full p-2 rounded bg-gray-700 text-white mb-2" />

              <div className="flex justify-end gap-2">
                <button type="button" className="bg-gray-500 px-4 py-2 rounded text-white" onClick={() => { setIsModalOpen(false); setEditingItem(null); }}>Cancel</button>
                <button type="submit" className="bg-blue-500 px-4 py-2 rounded text-white">{editingItem ? "Update" : "Save"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
