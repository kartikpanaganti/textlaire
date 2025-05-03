import React, { useState, useEffect } from 'react';
import { FaCalculator, FaInfoCircle, FaUser, FaCalendarAlt, FaRupeeSign, FaCheckCircle, FaFileAlt } from 'react-icons/fa';
import axios from 'axios';
import toast from 'react-hot-toast';

const TaxCalculator = ({ employeeId, onSaveTaxDetails }) => {
  const [loading, setLoading] = useState(false);
  const [employee, setEmployee] = useState(null);
  const [financialYear, setFinancialYear] = useState(`${new Date().getFullYear()}-${new Date().getFullYear() + 1}`);
  const [annualIncome, setAnnualIncome] = useState('');
  const [deductions, setDeductions] = useState({
    section80C: '',
    section80D: '',
    housingLoanInterest: '',
    educationLoanInterest: '',
    other: ''
  });
  const [taxResult, setTaxResult] = useState(null);
  
  useEffect(() => {
    // Fetch employee details if employeeId is provided
    if (employeeId) {
      fetchEmployeeDetails();
    }
  }, [employeeId]);
  
  const fetchEmployeeDetails = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/employees/${employeeId}`);
      if (response.data.success) {
        setEmployee(response.data.data);
        // Set annual income based on employee's salary
        setAnnualIncome(response.data.data.salary * 12);
      }
    } catch (error) {
      console.error('Error fetching employee details:', error);
      toast.error('Failed to fetch employee details');
    } finally {
      setLoading(false);
    }
  };
  
  const handleDeductionChange = (field, value) => {
    setDeductions(prev => ({
      ...prev,
      [field]: value
    }));
  };
  
  const calculateTax = async () => {
    try {
      setLoading(true);
      
      const response = await axios.post('/api/payroll/calculate-tax', {
        employeeId,
        financialYear,
        income: parseFloat(annualIncome),
        deductions: {
          section80C: deductions.section80C || 0,
          section80D: deductions.section80D || 0,
          housingLoanInterest: deductions.housingLoanInterest || 0,
          educationLoanInterest: deductions.educationLoanInterest || 0,
          other: deductions.other || 0
        }
      });
      
      if (response.data.success) {
        setTaxResult(response.data.data);
        toast.success('Tax calculation completed');
      } else {
        toast.error(response.data.message || 'Failed to calculate tax');
      }
    } catch (error) {
      console.error('Error calculating tax:', error);
      toast.error(error.response?.data?.message || 'An error occurred during tax calculation');
    } finally {
      setLoading(false);
    }
  };
  
  const handleSaveTaxDetails = () => {
    if (taxResult && onSaveTaxDetails) {
      onSaveTaxDetails(taxResult);
      toast.success('Tax details saved to payroll');
    }
  };
  
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };
  
  // Generate array of financial years (current year - 2 to current year + 2)
  const generateFinancialYears = () => {
    const currentYear = new Date().getFullYear();
    const years = [];
    
    for (let i = -2; i <= 2; i++) {
      const startYear = currentYear + i;
      const endYear = startYear + 1;
      years.push(`${startYear}-${endYear}`);
    }
    
    return years;
  };
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 w-full">
      <div className="flex items-center mb-6">
        <FaCalculator className="text-blue-500 dark:text-blue-400 text-2xl mr-3" />
        <h2 className="text-xl font-bold text-gray-800 dark:text-white">Tax Calculator</h2>
      </div>
      
      {/* Employee Details */}
      {employee && (
        <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <div className="flex items-center mb-3">
            <div className="w-10 h-10 flex items-center justify-center rounded-full bg-blue-100 dark:bg-blue-800 text-blue-600 dark:text-blue-300 mr-3">
              {employee.name?.charAt(0) || '?'}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{employee.name}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">{employee.position} • {employee.department}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500 dark:text-gray-400">Employee ID:</span>
              <span className="ml-2 text-gray-900 dark:text-white">{employee.employeeID}</span>
            </div>
            <div>
              <span className="text-gray-500 dark:text-gray-400">Monthly Salary:</span>
              <span className="ml-2 text-gray-900 dark:text-white">{formatCurrency(employee.salary)}</span>
            </div>
          </div>
        </div>
      )}
      
      {/* Calculator Inputs */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left column */}
        <div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Financial Year
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaCalendarAlt className="text-gray-400" />
              </div>
              <select
                value={financialYear}
                onChange={(e) => setFinancialYear(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md leading-5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-colors duration-200"
              >
                {generateFinancialYears().map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Annual Income
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaRupeeSign className="text-gray-400" />
              </div>
              <input
                type="number"
                value={annualIncome}
                onChange={(e) => setAnnualIncome(e.target.value)}
                placeholder="Enter annual income"
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md leading-5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-colors duration-200"
              />
            </div>
          </div>
          
          <div className="mb-4">
            <div className="flex justify-between items-center mb-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Section 80C Deductions
              </label>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                Max: ₹1,50,000
              </span>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaRupeeSign className="text-gray-400" />
              </div>
              <input
                type="number"
                value={deductions.section80C}
                onChange={(e) => handleDeductionChange('section80C', e.target.value)}
                placeholder="PPF, ELSS, LIC, etc."
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md leading-5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-colors duration-200"
              />
            </div>
          </div>
          
          <div className="mb-4">
            <div className="flex justify-between items-center mb-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Section 80D (Medical Insurance)
              </label>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                Max: ₹25,000
              </span>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaRupeeSign className="text-gray-400" />
              </div>
              <input
                type="number"
                value={deductions.section80D}
                onChange={(e) => handleDeductionChange('section80D', e.target.value)}
                placeholder="Health insurance premiums"
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md leading-5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-colors duration-200"
              />
            </div>
          </div>
        </div>
        
        {/* Right column */}
        <div>
          <div className="mb-4">
            <div className="flex justify-between items-center mb-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Housing Loan Interest
              </label>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                Max: ₹2,00,000
              </span>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaRupeeSign className="text-gray-400" />
              </div>
              <input
                type="number"
                value={deductions.housingLoanInterest}
                onChange={(e) => handleDeductionChange('housingLoanInterest', e.target.value)}
                placeholder="Home loan interest"
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md leading-5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-colors duration-200"
              />
            </div>
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Education Loan Interest
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaRupeeSign className="text-gray-400" />
              </div>
              <input
                type="number"
                value={deductions.educationLoanInterest}
                onChange={(e) => handleDeductionChange('educationLoanInterest', e.target.value)}
                placeholder="Education loan interest"
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md leading-5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-colors duration-200"
              />
            </div>
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Other Deductions
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaRupeeSign className="text-gray-400" />
              </div>
              <input
                type="number"
                value={deductions.other}
                onChange={(e) => handleDeductionChange('other', e.target.value)}
                placeholder="Other tax deductions"
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md leading-5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-colors duration-200"
              />
            </div>
          </div>
          
          <div className="mt-8">
            <button
              onClick={calculateTax}
              disabled={loading}
              className="w-full flex justify-center items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Calculating...
                </>
              ) : (
                <>
                  <FaCalculator className="mr-2" />
                  Calculate Tax
                </>
              )}
            </button>
          </div>
        </div>
      </div>
      
      {/* Tax Results */}
      {taxResult && (
        <div className="mt-4 border-t border-gray-200 dark:border-gray-700 pt-6">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center">
            <FaFileAlt className="text-green-500 mr-2" />
            Tax Calculation Results
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
              <h4 className="text-md font-medium text-gray-700 dark:text-gray-300 mb-3">Income Summary</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Annual Income:</span>
                  <span className="font-medium text-gray-900 dark:text-white">{formatCurrency(taxResult.income.annualSalary)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Total Deductions:</span>
                  <span className="font-medium text-gray-900 dark:text-white">{formatCurrency(taxResult.income.deductions.totalDeductions)}</span>
                </div>
                <div className="flex justify-between text-sm font-medium pt-2 border-t border-green-200 dark:border-green-800">
                  <span className="text-gray-800 dark:text-white">Taxable Income:</span>
                  <span className="text-gray-900 dark:text-white">{formatCurrency(taxResult.income.taxableIncome)}</span>
                </div>
              </div>
            </div>
            
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
              <h4 className="text-md font-medium text-gray-700 dark:text-gray-300 mb-3">Tax Summary</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Income Tax:</span>
                  <span className="font-medium text-gray-900 dark:text-white">{formatCurrency(taxResult.taxSummary.totalTax)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Health & Education Cess (4%):</span>
                  <span className="font-medium text-gray-900 dark:text-white">{formatCurrency(taxResult.taxSummary.cess)}</span>
                </div>
                <div className="flex justify-between text-sm font-medium pt-2 border-t border-blue-200 dark:border-blue-800">
                  <span className="text-gray-800 dark:text-white">Total Annual Tax:</span>
                  <span className="text-gray-900 dark:text-white">{formatCurrency(taxResult.taxSummary.finalTaxAmount)}</span>
                </div>
                <div className="flex justify-between text-sm mt-2">
                  <span className="text-gray-600 dark:text-gray-400">Monthly Tax Contribution:</span>
                  <span className="font-medium text-gray-900 dark:text-white">{formatCurrency(taxResult.taxSummary.monthlyTax)}</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Tax Breakdown */}
          <div className="mb-6">
            <h4 className="text-md font-medium text-gray-700 dark:text-gray-300 mb-3">Tax Bracket Breakdown</h4>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead>
                  <tr>
                    <th className="px-4 py-3 bg-gray-50 dark:bg-gray-800 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Income Bracket</th>
                    <th className="px-4 py-3 bg-gray-50 dark:bg-gray-800 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Tax Rate</th>
                    <th className="px-4 py-3 bg-gray-50 dark:bg-gray-800 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Taxable Amount</th>
                    <th className="px-4 py-3 bg-gray-50 dark:bg-gray-800 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Tax Amount</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
                  {taxResult.taxBreakdown.map((bracket, index) => (
                    <tr key={index} className={bracket.taxRate > 0 ? 'bg-white dark:bg-gray-900' : 'bg-gray-50 dark:bg-gray-800'}>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {bracket.bracketEnd < Infinity ? 
                          `${formatCurrency(bracket.bracketStart)} - ${formatCurrency(bracket.bracketEnd)}` :
                          `Above ${formatCurrency(bracket.bracketStart)}`
                        }
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {(bracket.taxRate * 100).toFixed(1)}%
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {formatCurrency(bracket.taxableAmount)}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {formatCurrency(bracket.taxAmount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          
          {/* Action Button */}
          {onSaveTaxDetails && (
            <div className="mt-4 flex justify-end">
              <button
                onClick={handleSaveTaxDetails}
                className="flex items-center px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors duration-200"
              >
                <FaCheckCircle className="mr-2" />
                Save to Payroll
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TaxCalculator;
