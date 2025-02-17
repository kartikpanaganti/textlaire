import { useEffect, useState } from "react";
import axios from "axios";
import EmployeeForm from "../components/EmployeeForm";

function Employees() {
  const [employees, setEmployees] = useState([]);

  useEffect(() => {
    axios.get("http://localhost:5000/api/employees")
      .then(res => {
        console.log(res.data); // Check structure of the response
        setEmployees(res.data);
      })
      .catch(err => console.error(err));
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-4">Manage Employees</h1>
      <EmployeeForm setEmployees={setEmployees} />
      <div className="mt-6 p-6 bg-white shadow-md rounded-lg">
        <h2 className="text-xl font-bold mb-4">Employee List</h2>
        <ul>
          {employees.map(emp => (
            <li key={emp._id} className="border p-2 my-2 rounded">
              {emp.name} - {emp.position}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default Employees;
