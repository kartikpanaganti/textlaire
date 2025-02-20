import { useState, useEffect } from "react";
import axios from "axios";

const EmployeeForm = ({ fetchEmployees, editingEmployee, setEditingEmployee }) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [position, setPosition] = useState("");
  const [image, setImage] = useState(null);

  // Fill form when editing an employee
  useEffect(() => {
    if (editingEmployee) {
      setName(editingEmployee.name);
      setEmail(editingEmployee.email);
      setPosition(editingEmployee.position);
      setImage(null); // Reset image to allow optional update
    }
  }, [editingEmployee]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append("name", name);
    formData.append("email", email);
    formData.append("position", position);
    if (image) {
      formData.append("image", image);
    }

    try {
      if (editingEmployee) {
        // UPDATE Employee
        await axios.put(`http://localhost:5000/api/employees/${editingEmployee._id}`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      } else {
        // CREATE Employee
        await axios.post("http://localhost:5000/api/employees", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }

      fetchEmployees(); // Refresh employee list
      setEditingEmployee(null); // Reset form
      setName("");
      setEmail("");
      setPosition("");
      setImage(null);
    } catch (error) {
      console.error("Error saving employee:", error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <input
        type="text"
        placeholder="Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="p-2 border w-full"
        required
      />
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="p-2 border w-full"
        required
      />
      <input
        type="text"
        placeholder="Position"
        value={position}
        onChange={(e) => setPosition(e.target.value)}
        className="p-2 border w-full"
        required
      />
      <input
        type="file"
        accept="image/*"
        onChange={(e) => setImage(e.target.files[0])}
        className="p-2 border w-full"
      />
      <button type="submit" className="bg-green-500 text-white px-4 py-2 rounded w-full">
        {editingEmployee ? "Update Employee" : "Add Employee"}
      </button>
      {editingEmployee && (
        <button
          type="button"
          className="bg-gray-400 text-white px-4 py-2 rounded w-full mt-2"
          onClick={() => setEditingEmployee(null)}
        >
          Cancel Edit
        </button>
      )}
    </form>
  );
};

export default EmployeeForm;
