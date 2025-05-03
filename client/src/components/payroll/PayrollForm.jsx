import React, { useState, useEffect } from 'react';

const PayrollForm = ({ employees, initialData, onSubmit, mode, month, year }) => {
  const [formData, setFormData] = useState({
    employeeId: '',
    month: month || new Date().getMonth() + 1,
    year: year || new Date().getFullYear(),
    basicSalary: 0,
    allowances: {
      houseRent: 0,
      medical: 0,
      travel: 0,
      food: 0,
      special: 0,
      other: 0
    },
    deductions: {
      professionalTax: 0,
      incomeTax: 0,
      providentFund: 0,
      healthInsurance: 0,
      loanRepayment: 0,
      other: 0
    },
    overtime: {
      hours: 0,
      rate: 0
    },
    bonus: 0,
    leaveDeduction: 0
  });

  useEffect(() => {
    if (initialData && mode === 'edit') {
      setFormData({
        employeeId: initialData.employeeId._id,
        month: initialData.month,
        year: initialData.year,
        basicSalary: initialData.basicSalary,
        allowances: {
          houseRent: initialData.allowances.houseRent,
          medical: initialData.allowances.medical,
          travel: initialData.allowances.travel,
          food: initialData.allowances.food,
          special: initialData.allowances.special,
          other: initialData.allowances.other
        },
        deductions: {
          professionalTax: initialData.deductions.professionalTax,
          incomeTax: initialData.deductions.incomeTax,
          providentFund: initialData.deductions.providentFund,
          healthInsurance: initialData.deductions.healthInsurance,
          loanRepayment: initialData.deductions.loanRepayment,
          other: initialData.deductions.other
        },
        overtime: {
          hours: initialData.overtime.hours,
          rate: initialData.overtime.rate
        },
        bonus: initialData.bonus,
        leaveDeduction: initialData.leaveDeduction
      });
    } else {
      // If creating new payroll, update the month and year from props
      setFormData(prev => ({
        ...prev,
        month: month,
        year: year
      }));
    }
  }, [initialData, mode, month, year]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleNestedChange = (category, field, value) => {
    setFormData({
      ...formData,
      [category]: {
        ...formData[category],
        [field]: parseFloat(value) || 0
      }
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  // Calculate totals
  const allowanceTotal = Object.values(formData.allowances).reduce((sum, val) => sum + parseFloat(val || 0), 0);
  const deductionTotal = Object.values(formData.deductions).reduce((sum, val) => sum + parseFloat(val || 0), 0);
  const overtimeAmount = (parseFloat(formData.overtime.hours || 0) * parseFloat(formData.overtime.rate || 0));
  const grossSalary = parseFloat(formData.basicSalary || 0) + allowanceTotal + parseFloat(formData.bonus || 0) + overtimeAmount;
  const totalDeductions = deductionTotal + parseFloat(formData.leaveDeduction || 0);
  const netSalary = grossSalary - totalDeductions;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Employee Selection (only in create mode) */}
        {mode === 'create' && (
          <div>
            <label htmlFor="employeeId" className="block text-sm font-medium text-gray-700">
              Employee
            </label>
            <select
              id="employeeId"
              name="employeeId"
              value={formData.employeeId}
              onChange={handleChange}
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
              <option value="">Select Employee</option>
              {employees.map((employee) => (
                <option key={employee._id} value={employee._id}>
                  {employee.name} ({employee.employeeID || employee.email})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Basic Salary */}
        <div>
          <label htmlFor="basicSalary" className="block text-sm font-medium text-gray-700">
            Basic Salary (₹)
          </label>
          <input
            type="number"
            id="basicSalary"
            name="basicSalary"
            value={formData.basicSalary}
            onChange={handleChange}
            required
            min="0"
            step="0.01"
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          />
        </div>
      </div>

      {/* Allowances Section */}
      <div className="mt-6">
        <h3 className="text-lg font-medium text-gray-900">Allowances</h3>
        <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">House Rent</label>
            <input
              type="number"
              value={formData.allowances.houseRent}
              onChange={(e) => handleNestedChange('allowances', 'houseRent', e.target.value)}
              min="0"
              step="0.01"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Medical</label>
            <input
              type="number"
              value={formData.allowances.medical}
              onChange={(e) => handleNestedChange('allowances', 'medical', e.target.value)}
              min="0"
              step="0.01"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Travel</label>
            <input
              type="number"
              value={formData.allowances.travel}
              onChange={(e) => handleNestedChange('allowances', 'travel', e.target.value)}
              min="0"
              step="0.01"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Food</label>
            <input
              type="number"
              value={formData.allowances.food}
              onChange={(e) => handleNestedChange('allowances', 'food', e.target.value)}
              min="0"
              step="0.01"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Special</label>
            <input
              type="number"
              value={formData.allowances.special}
              onChange={(e) => handleNestedChange('allowances', 'special', e.target.value)}
              min="0"
              step="0.01"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Other</label>
            <input
              type="number"
              value={formData.allowances.other}
              onChange={(e) => handleNestedChange('allowances', 'other', e.target.value)}
              min="0"
              step="0.01"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>
        </div>
      </div>

      {/* Deductions Section */}
      <div className="mt-6">
        <h3 className="text-lg font-medium text-gray-900">Deductions</h3>
        <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Professional Tax</label>
            <input
              type="number"
              value={formData.deductions.professionalTax}
              onChange={(e) => handleNestedChange('deductions', 'professionalTax', e.target.value)}
              min="0"
              step="0.01"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Income Tax</label>
            <input
              type="number"
              value={formData.deductions.incomeTax}
              onChange={(e) => handleNestedChange('deductions', 'incomeTax', e.target.value)}
              min="0"
              step="0.01"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Provident Fund</label>
            <input
              type="number"
              value={formData.deductions.providentFund}
              onChange={(e) => handleNestedChange('deductions', 'providentFund', e.target.value)}
              min="0"
              step="0.01"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Health Insurance</label>
            <input
              type="number"
              value={formData.deductions.healthInsurance}
              onChange={(e) => handleNestedChange('deductions', 'healthInsurance', e.target.value)}
              min="0"
              step="0.01"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Loan Repayment</label>
            <input
              type="number"
              value={formData.deductions.loanRepayment}
              onChange={(e) => handleNestedChange('deductions', 'loanRepayment', e.target.value)}
              min="0"
              step="0.01"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Other</label>
            <input
              type="number"
              value={formData.deductions.other}
              onChange={(e) => handleNestedChange('deductions', 'other', e.target.value)}
              min="0"
              step="0.01"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>
        </div>
      </div>

      {/* Other Earnings and Deductions */}
      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <h3 className="text-lg font-medium text-gray-900">Overtime</h3>
          <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Hours</label>
              <input
                type="number"
                value={formData.overtime.hours}
                onChange={(e) => handleNestedChange('overtime', 'hours', e.target.value)}
                min="0"
                step="0.5"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Rate per Hour</label>
              <input
                type="number"
                value={formData.overtime.rate}
                onChange={(e) => handleNestedChange('overtime', 'rate', e.target.value)}
                min="0"
                step="0.01"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="bonus" className="block text-sm font-medium text-gray-700">
              Bonus
            </label>
            <input
              type="number"
              id="bonus"
              name="bonus"
              value={formData.bonus}
              onChange={handleChange}
              min="0"
              step="0.01"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>
          <div>
            <label htmlFor="leaveDeduction" className="block text-sm font-medium text-gray-700">
              Leave Deduction
            </label>
            <input
              type="number"
              id="leaveDeduction"
              name="leaveDeduction"
              value={formData.leaveDeduction}
              onChange={handleChange}
              min="0"
              step="0.01"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="mt-6 bg-gray-50 p-4 rounded-md">
        <h3 className="text-lg font-medium text-gray-900 mb-2">Salary Summary</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500">Basic Salary:</p>
            <p className="text-sm font-medium">₹{parseFloat(formData.basicSalary || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Total Allowances:</p>
            <p className="text-sm font-medium">₹{allowanceTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Overtime Amount:</p>
            <p className="text-sm font-medium">₹{overtimeAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Bonus:</p>
            <p className="text-sm font-medium">₹{parseFloat(formData.bonus || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Total Deductions:</p>
            <p className="text-sm font-medium">₹{totalDeductions.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
          </div>
          <div className="col-span-2 pt-2 border-t border-gray-200 mt-2">
            <p className="text-sm text-gray-800 font-bold">Gross Salary:</p>
            <p className="text-lg font-bold">₹{grossSalary.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
          </div>
          <div className="col-span-2">
            <p className="text-sm text-gray-800 font-bold">Net Salary:</p>
            <p className="text-lg font-bold text-green-600">₹{netSalary.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
          </div>
        </div>
      </div>

      <div className="flex justify-end space-x-3 pt-5">
        <button
          type="button"
          onClick={() => onSubmit(null)}
          className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-blue-700"
        >
          {mode === 'create' ? 'Generate Payroll' : 'Update Payroll'}
        </button>
      </div>
    </form>
  );
};

export default PayrollForm;
