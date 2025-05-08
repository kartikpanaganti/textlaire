import React, { useState } from 'react';
import { FaChartBar, FaCalculator, FaChevronLeft } from 'react-icons/fa';
import PayrollReportsDashboard from './PayrollReportsDashboard';
import TaxCalculator from './TaxCalculator';

const PayrollFeatures = ({ onBack, payrollId, employeeId }) => {
  const [activeFeature, setActiveFeature] = useState('reports'); // reports, tax

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden w-full">
      {/* Header with navigation */}
      <div className="bg-blue-600 dark:bg-blue-800 p-4 text-white flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center text-white hover:text-blue-200 transition-colors duration-200"
        >
          <FaChevronLeft className="mr-2" />
          Back to Payroll
        </button>
        <h2 className="text-xl font-bold">Payroll Advanced Features</h2>
      </div>

      {/* Feature Navigation */}
      <div className="flex border-b border-gray-200 dark:border-gray-700">
        <button
          className={`flex-1 py-4 text-center font-medium text-sm ${activeFeature === 'reports' ? 'text-blue-600 border-b-2 border-blue-500' : 'text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-500'}`}
          onClick={() => setActiveFeature('reports')}
        >
          <FaChartBar className="inline-block mr-2" />
          Reports & Analytics
        </button>
        <button
          className={`flex-1 py-4 text-center font-medium text-sm ${activeFeature === 'tax' ? 'text-blue-600 border-b-2 border-blue-500' : 'text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-500'}`}
          onClick={() => setActiveFeature('tax')}
        >
          <FaCalculator className="inline-block mr-2" />
          Tax Calculator
        </button>
      </div>

      {/* Feature Content */}
      <div className="p-4">
        {activeFeature === 'reports' && <PayrollReportsDashboard />}
        {activeFeature === 'tax' && <TaxCalculator employeeId={employeeId} />}
      </div>
    </div>
  );
};

export default PayrollFeatures;
