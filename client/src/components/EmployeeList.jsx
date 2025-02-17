import { useEffect, useState } from "react";
import axios from "axios";

function EmployeeList() {
    const [employees, setEmployees] = useState([]);

    useEffect(() => {
        axios.get("http://localhost:5000/api/employees")
            .then(res => setEmployees(res.data))
            .catch(err => console.error(err));
    }, []);

    return (
        <div className="p-6 bg-white shadow-md rounded-lg">
            <h2 className="text-xl font-bold mb-4">Employee List</h2>
            <ul>
                {employees.map(emp => (
                    <li key={emp._id} className="border p-2 my-2 rounded">{emp.name} - {emp.position}</li>
                ))}
            </ul>
        </div>
    );
}

export default EmployeeList;
