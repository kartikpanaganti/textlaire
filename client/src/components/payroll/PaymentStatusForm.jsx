import React, { useState, useEffect } from 'react';

const PaymentStatusForm = ({ payroll, onSubmit }) => {
  const [formData, setFormData] = useState({
    paymentStatus: 'Pending',
    paymentMethod: 'Bank Transfer',
    paymentDate: '',
    remarks: ''
  });

  useEffect(() => {
    if (payroll) {
      setFormData({
        paymentStatus: payroll.paymentStatus || 'Pending',
        paymentMethod: payroll.paymentMethod || 'Bank Transfer',
        paymentDate: payroll.paymentDate ? new Date(payroll.paymentDate).toISOString().split('T')[0] : '',
        remarks: payroll.remarks || ''
      });
    }
  }, [payroll]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const getStatusOptions = () => {
    return [
      { value: 'Pending', label: 'Pending' },
      { value: 'Processing', label: 'Processing' },
      { value: 'Paid', label: 'Paid' },
      { value: 'Failed', label: 'Failed' }
    ];
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <div className="mb-4 bg-gray-50 dark:bg-gray-800 p-4 rounded-md border border-gray-200 dark:border-gray-700">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Payroll Information</h3>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            <span className="font-medium text-gray-700 dark:text-gray-200">Employee:</span> {payroll?.employeeDetails?.name || 'N/A'}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            <span className="font-medium text-gray-700 dark:text-gray-200">Employee ID:</span> {payroll?.employeeDetails?.employeeID || 'N/A'}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            <span className="font-medium text-gray-700 dark:text-gray-200">Period:</span> {payroll?.month}/{payroll?.year}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            <span className="font-medium text-gray-700 dark:text-gray-200">Net Amount:</span> ₹{(payroll?.netSalary || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>
      </div>

      <div>
        <label htmlFor="paymentStatus" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Payment Status
        </label>
        <select
          id="paymentStatus"
          name="paymentStatus"
          value={formData.paymentStatus}
          onChange={handleChange}
          required
          className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-colors duration-200"
        >
          {getStatusOptions().map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="paymentMethod" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Payment Method
        </label>
        <select
          id="paymentMethod"
          name="paymentMethod"
          value={formData.paymentMethod}
          onChange={handleChange}
          required
          className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-colors duration-200"
        >
          <option value="Bank Transfer">Bank Transfer</option>
          <option value="Cash">Cash</option>
          <option value="Cheque">Cheque</option>
          <option value="Digital Wallet">Digital Wallet</option>
          <option value="UPI">UPI</option>
          <option value="Other">Other</option>
        </select>
      </div>

      <div>
        <label htmlFor="paymentDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Payment Date
        </label>
        <input
          type="date"
          id="paymentDate"
          name="paymentDate"
          value={formData.paymentDate}
          onChange={handleChange}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-colors duration-200"
        />
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          {formData.paymentStatus === 'Paid' ? 'Set the date when payment was made' : 'Set the expected payment date'}
        </p>
      </div>

      <div>
        <label htmlFor="remarks" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Remarks
        </label>
        <textarea
          id="remarks"
          name="remarks"
          rows="3"
          value={formData.remarks}
          onChange={handleChange}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-colors duration-200"
          placeholder="Optional payment remarks"
        />
      </div>

      {formData.paymentStatus === 'Paid' && (
        <div className="bg-green-50 border border-green-200 rounded-md p-4 mb-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-green-800">Payment Confirmation</h3>
              <div className="mt-2 text-sm text-green-700">
                <p>
                  Setting this status to "Paid" will mark this payroll as completed. 
                  Make sure to set the correct payment date above.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {formData.paymentStatus === 'Failed' && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Payment Failed</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>
                  Please provide a reason for the payment failure in the remarks field to help 
                  with troubleshooting and follow-up actions.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={() => {document.getElementById('payment-modal').close();}}
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-800 focus:ring-blue-500 transition-colors duration-200"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 dark:bg-blue-700 hover:bg-blue-700 dark:hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-800 focus:ring-blue-500 transition-colors duration-200"
        >
          Update Payment Status
        </button>
      </div>
    </form>
  );
};

export default PaymentStatusForm;
