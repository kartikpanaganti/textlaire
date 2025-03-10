import React from 'react';
import { Link } from 'react-router-dom';

const EmployeeCard = ({ employee }) => {
  return (
    <div className="p-4 border shadow-md rounded flex flex-col sm:flex-row items-center gap-4 bg-white dark:bg-gray-800 dark:text-white dark:border-gray-600 transition-transform hover:scale-[1.02]">
      <img
        src={employee.image ? `http://localhost:5000${employee.image}` : "/default-profile.png"}
        className="w-20 h-20 object-cover rounded-full border dark:border-gray-500"
        alt={employee.name}
      />
      <div className="text-center sm:text-left flex-1">
        <h3 className="text-lg font-bold">{employee.name}</h3>
        <p className="text-sm text-gray-600 dark:text-gray-300">{employee.position}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400">Department: {employee.department}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400">Salary: ${employee.salary}</p>
      </div>
      <div className="flex flex-wrap justify-center gap-2 mt-2 sm:mt-0">
        <Link 
          to={`/employees/${employee._id}`}
          className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600 dark:bg-blue-700"
        >
          View
        </Link>
        <button 
          className="bg-yellow-500 text-white px-3 py-1 rounded text-sm hover:bg-yellow-600 dark:bg-yellow-700"
          onClick={() => onEdit(employee)}
        >
          Edit
        </button>
        <button 
          className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600 dark:bg-red-700"
          onClick={() => onDelete(employee)}
        >
          Delete
        </button>
      </div>
    </div>
  );
};

export default EmployeeCard;