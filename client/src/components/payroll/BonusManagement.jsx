import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { FaGift, FaUser, FaUsers, FaMoneyBillWave, FaCalendarAlt, FaInfoCircle, FaCheck } from 'react-icons/fa';

const BonusManagement = ({ payrollId, employeeId, onUpdate }) => {
  const [loading, setLoading] = useState(false);
  const [payroll, setPayroll] = useState(null);
  const [bonusDetails, setBonusDetails] = useState({
    performanceBonus: 0,
    festivalBonus: 0,
    incentives: 0,
    commission: 0,
    oneTimeBonus: 0,
    description: ''
  });
  
  // For bulk bonus management
  const [showBulkBonus, setShowBulkBonus] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [selectedEmployees, setSelectedEmployees] = useState([]);
  const [bulkBonusType, setBulkBonusType] = useState('performanceBonus');
  const [bulkBonusAmount, setBulkBonusAmount] = useState('');
  const [bulkDescription, setBulkDescription] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('');
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  
  // Fetch payroll details if payrollId is provided
  useEffect(() => {
    if (payrollId) {
      fetchPayrollDetails();
    }
  }, [payrollId]);
  
  // Fetch employees for bulk bonus management
  useEffect(() => {
    if (showBulkBonus) {
      fetchEmployees();
    }
  }, [showBulkBonus, filterDepartment]);
  
  const fetchPayrollDetails = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/payroll/${payrollId}`);
      if (response.data.success) {
        setPayroll(response.data.data);
        
        // Initialize bonus details if available
        if (response.data.data.bonusDetails) {
          setBonusDetails({
            performanceBonus: response.data.data.bonusDetails.performanceBonus || 0,
            festivalBonus: response.data.data.bonusDetails.festivalBonus || 0,
            incentives: response.data.data.bonusDetails.incentives || 0,
            commission: response.data.data.bonusDetails.commission || 0,
            oneTimeBonus: response.data.data.bonusDetails.oneTimeBonus || 0,
            description: response.data.data.bonusDetails.description || ''
          });
        }
      } else {
        toast.error('Failed to fetch payroll details');
      }
    } catch (error) {
      console.error('Error fetching payroll details:', error);
      toast.error(error.response?.data?.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };
  
  const fetchEmployees = async () => {
    try {
      setLoadingEmployees(true);
      const params = {};
      if (filterDepartment) {
        params.department = filterDepartment;
      }
      
      const response = await axios.get('/api/employees', { params });
      if (response.data.success) {
        setEmployees(response.data.data);
      } else {
        toast.error('Failed to fetch employees');
      }
    } catch (error) {
      console.error('Error fetching employees:', error);
      toast.error('Failed to load employees');
    } finally {
      setLoadingEmployees(false);
    }
  };
  
  const handleBonusChange = (field, value) => {
    setBonusDetails(prev => ({
      ...prev,
      [field]: field === 'description' ? value : parseFloat(value) || 0
    }));
  };
  
  const calculateTotalBonus = () => {
    return (
      parseFloat(bonusDetails.performanceBonus || 0) +
      parseFloat(bonusDetails.festivalBonus || 0) +
      parseFloat(bonusDetails.incentives || 0) +
      parseFloat(bonusDetails.commission || 0) +
      parseFloat(bonusDetails.oneTimeBonus || 0)
    );
  };
  
  const saveBonusDetails = async () => {
    try {
      setLoading(true);
      
      const response = await axios.post('/api/payroll/manage-bonus', {
        payrollId,
        bonusDetails,
        description: bonusDetails.description
      });
      
      if (response.data.success) {
        toast.success('Bonus details saved successfully');
        if (onUpdate) {
          onUpdate(response.data.data);
        }
      } else {
        toast.error(response.data.message || 'Failed to save bonus details');
      }
    } catch (error) {
      console.error('Error saving bonus details:', error);
      toast.error(error.response?.data?.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };
  
  const handleSelectAllEmployees = () => {
    if (selectedEmployees.length === employees.length) {
      setSelectedEmployees([]);
    } else {
      setSelectedEmployees(employees.map(emp => emp._id));
    }
  };
  
  const handleSelectEmployee = (id) => {
    if (selectedEmployees.includes(id)) {
      setSelectedEmployees(prev => prev.filter(empId => empId !== id));
    } else {
      setSelectedEmployees(prev => [...prev, id]);
    }
  };
  
  const handleBulkBonusSubmit = async () => {
    if (selectedEmployees.length === 0) {
      toast.error('Please select at least one employee');
      return;
    }
    
    if (!bulkBonusType || !bulkBonusAmount) {
      toast.error('Please specify bonus type and amount');
      return;
    }
    
    try {
      setLoading(true);
      
      const response = await axios.post('/api/payroll/bulk-bonus', {
        employees: selectedEmployees,
        bonusType: bulkBonusType,
        bonusAmount: parseFloat(bulkBonusAmount),
        description: bulkDescription
      });
      
      if (response.data.success) {
        toast.success(`Bonus added for ${response.data.data.success.length} employees`);
        if (response.data.data.failed.length > 0) {
          toast.error(`Failed to add bonus for ${response.data.data.failed.length} employees`);
        }
        // Reset form
        setBulkBonusAmount('');
        setBulkDescription('');
        setSelectedEmployees([]);
      } else {
        toast.error(response.data.message || 'Failed to add bulk bonus');
      }
    } catch (error) {
      console.error('Error adding bulk bonus:', error);
      toast.error(error.response?.data?.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };
  
  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2
    }).format(amount);
  };
  
  // List of departments (should be fetched from API in production)
  const departments = [
    { value: '', label: 'All Departments' },
    { value: 'Engineering', label: 'Engineering' },
    { value: 'Marketing', label: 'Marketing' },
    { value: 'Sales', label: 'Sales' },
    { value: 'HR', label: 'HR' },
    { value: 'Finance', label: 'Finance' },
    { value: 'Operations', label: 'Operations' },
    { value: 'Customer Support', label: 'Customer Support' },
    { value: 'Product', label: 'Product' },
    { value: 'Design', label: 'Design' },
    { value: 'Research', label: 'Research' },
    { value: 'Legal', label: 'Legal' },
    { value: 'Inventory & Raw Materials', label: 'Inventory & Raw Materials' }
  ];
  
  // Bonus types
  const bonusTypes = [
    { value: 'performanceBonus', label: 'Performance Bonus' },
    { value: 'festivalBonus', label: 'Festival/Holiday Bonus' },
    { value: 'incentives', label: 'Incentives' },
    { value: 'commission', label: 'Sales Commission' },
    { value: 'oneTimeBonus', label: 'One-time Bonus' }
  ];
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 w-full">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center">
          <FaGift className="text-green-500 dark:text-green-400 text-2xl mr-3" />
          <h2 className="text-xl font-bold text-gray-800 dark:text-white">
            {showBulkBonus ? 'Bulk Bonus Management' : 'Bonus & Incentive Management'}
          </h2>
        </div>
        
        <button
          onClick={() => setShowBulkBonus(!showBulkBonus)}
          className={`px-4 py-2 rounded-md text-sm font-medium ${showBulkBonus ? 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white' : 'bg-blue-600 text-white'}`}
        >
          {showBulkBonus ? (
            <>Employee Details</>
          ) : (
            <><FaUsers className="inline mr-2" /> Bulk Management</>
          )}
        </button>
      </div>
      
      {!showBulkBonus && payroll && (
        <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <div className="flex items-center mb-3">
            <div className="w-10 h-10 flex items-center justify-center rounded-full bg-blue-100 dark:bg-blue-800 text-blue-600 dark:text-blue-300 mr-3">
              {payroll.employeeDetails?.name?.charAt(0) || '?'}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{payroll.employeeDetails?.name}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {payroll.employeeDetails?.position} • {payroll.employeeDetails?.department} • 
                {new Date(payroll.year, payroll.month - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </p>
            </div>
          </div>
        </div>
      )}
      
      {!showBulkBonus ? (
        /* Individual Bonus Management Form */
        <div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Performance Bonus
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">₹</span>
                </div>
                <input
                  type="number"
                  value={bonusDetails.performanceBonus}
                  onChange={(e) => handleBonusChange('performanceBonus', e.target.value)}
                  className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-7 pr-12 sm:text-sm border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md"
                  placeholder="0.00"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Festival/Holiday Bonus
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">₹</span>
                </div>
                <input
                  type="number"
                  value={bonusDetails.festivalBonus}
                  onChange={(e) => handleBonusChange('festivalBonus', e.target.value)}
                  className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-7 pr-12 sm:text-sm border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md"
                  placeholder="0.00"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Incentives
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">₹</span>
                </div>
                <input
                  type="number"
                  value={bonusDetails.incentives}
                  onChange={(e) => handleBonusChange('incentives', e.target.value)}
                  className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-7 pr-12 sm:text-sm border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md"
                  placeholder="0.00"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Sales Commission
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">₹</span>
                </div>
                <input
                  type="number"
                  value={bonusDetails.commission}
                  onChange={(e) => handleBonusChange('commission', e.target.value)}
                  className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-7 pr-12 sm:text-sm border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md"
                  placeholder="0.00"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                One-time Bonus
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">₹</span>
                </div>
                <input
                  type="number"
                  value={bonusDetails.oneTimeBonus}
                  onChange={(e) => handleBonusChange('oneTimeBonus', e.target.value)}
                  className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-7 pr-12 sm:text-sm border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md"
                  placeholder="0.00"
                />
              </div>
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Description/Notes
              </label>
              <textarea
                value={bonusDetails.description}
                onChange={(e) => handleBonusChange('description', e.target.value)}
                rows="3"
                className="focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md"
                placeholder="Describe the reason for bonus/incentives..."
              ></textarea>
            </div>
          </div>
          
          <div className="flex justify-between items-center bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Bonus Amount</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(calculateTotalBonus())}</p>
            </div>
            
            <button
              onClick={saveBonusDetails}
              disabled={loading}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors duration-200 disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save Bonus Details'}
            </button>
          </div>
        </div>
      ) : (
        /* Bulk Bonus Management Form */
        <div>
          <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Bonus Type
              </label>
              <select
                value={bulkBonusType}
                onChange={(e) => setBulkBonusType(e.target.value)}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md dark:bg-gray-700 dark:text-white"
              >
                {bonusTypes.map(type => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Bonus Amount
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">₹</span>
                </div>
                <input
                  type="number"
                  value={bulkBonusAmount}
                  onChange={(e) => setBulkBonusAmount(e.target.value)}
                  className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-7 pr-12 sm:text-sm border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md"
                  placeholder="0.00"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Filter by Department
              </label>
              <select
                value={filterDepartment}
                onChange={(e) => setFilterDepartment(e.target.value)}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md dark:bg-gray-700 dark:text-white"
              >
                {departments.map(dept => (
                  <option key={dept.value} value={dept.value}>{dept.label}</option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description/Notes
            </label>
            <textarea
              value={bulkDescription}
              onChange={(e) => setBulkDescription(e.target.value)}
              rows="2"
              className="focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md"
              placeholder="Describe the reason for bonus/incentives..."
            ></textarea>
          </div>
          
          <div className="border dark:border-gray-700 rounded-lg overflow-hidden mb-6">
            <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 flex items-center">
              <input
                type="checkbox"
                id="select-all"
                checked={selectedEmployees.length === employees.length && employees.length > 0}
                onChange={handleSelectAllEmployees}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="select-all" className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                Select All Employees
              </label>
              <span className="ml-auto text-sm text-gray-500 dark:text-gray-400">
                {selectedEmployees.length} of {employees.length} selected
              </span>
            </div>
            
            <div className="max-h-96 overflow-y-auto">
              {loadingEmployees ? (
                <div className="flex justify-center items-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                </div>
              ) : employees.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  No employees found
                </div>
              ) : (
                <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                  {employees.map(employee => (
                    <li key={employee._id} className="px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id={`employee-${employee._id}`}
                          checked={selectedEmployees.includes(employee._id)}
                          onChange={() => handleSelectEmployee(employee._id)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label htmlFor={`employee-${employee._id}`} className="ml-3 flex-1 cursor-pointer">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300">
                              {employee.name.charAt(0)}
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900 dark:text-white">{employee.name}</div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">
                                {employee.position} • {employee.department} • ID: {employee.employeeID}
                              </div>
                            </div>
                          </div>
                        </label>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
          
          <div className="flex justify-end">
            <button
              onClick={handleBulkBonusSubmit}
              disabled={loading || selectedEmployees.length === 0 || !bulkBonusAmount}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors duration-200 disabled:opacity-50 flex items-center"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </>
              ) : (
                <>
                  <FaCheck className="mr-2" />
                  Apply Bonus to {selectedEmployees.length} Employees
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default BonusManagement;
