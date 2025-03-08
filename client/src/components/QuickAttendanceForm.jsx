  import { useState, useEffect } from 'react';

  const QuickAttendanceForm = ({ employees, onSubmit }) => {
    const [attendanceData, setAttendanceData] = useState([]);
    const [selectedEmployees, setSelectedEmployees] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
      if (employees?.length) {
        const initialData = employees.map(emp => ({
          employeeId: emp._id,
          employeeName: emp.name,
          status: 'Present',
          date: new Date().toLocaleDateString('en-CA'),
          shift: 'Day',
          checkIn: '',
          checkOut: '',
          workFromHome: false
        }));
        setAttendanceData(initialData);
      
        const initialSelected = {};
        employees.forEach(emp => {
          initialSelected[emp._id] = true;
        });
        setSelectedEmployees(initialSelected);
      }
    }, [employees]);
      const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);




        const selectedAttendance = attendanceData.filter(record => 
          selectedEmployees[record.employeeId]
        );




        try {
          // Update this URL to match your backend server
          const response = await fetch('http://localhost:3000/api/attendance/bulk', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(selectedAttendance)
          });









          if (!response.ok) {
            throw new Error('Failed to submit attendance');
          }



          const result = await response.json();
          alert('Attendance submitted successfully!');
          window.location.reload();
        } catch (error) {
          console.error('Submission error:', error);
          alert('Failed to submit attendance. Please try again.');
        } finally {
          setIsSubmitting(false);
        }












      };
    const handleSelectAll = (checked) => {
      const newSelected = {};
      employees.forEach(emp => {
        newSelected[emp._id] = checked;
      });
      setSelectedEmployees(newSelected);
    };

    const handleSelectEmployee = (employeeId, checked) => {
      setSelectedEmployees(prev => ({
        ...prev,
        [employeeId]: checked
      }));
    };

    const handleBulkChange = (field, value) => {
      setAttendanceData(prev => 
        prev.map(record => ({
          ...record,
          [field]: value
        }))
      );
    };

    const handleIndividualChange = (index, field, value) => {
      setAttendanceData(prev => {
        const newData = [...prev];
        newData[index] = {
          ...newData[index],
          [field]: value
        };
        return newData;
      });
    };

    return (
      <div className="p-6 bg-white rounded-lg shadow">
        <h2 className="text-2xl font-bold mb-6">Quick Attendance</h2>
      
        <div className="mb-6 space-y-4">
          <div className="flex gap-4 items-center">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={Object.values(selectedEmployees).every(v => v)}
                onChange={(e) => handleSelectAll(e.target.checked)}
                className="rounded border-gray-300 mr-2"
              />
              <span className="font-semibold">Select All Employees</span>
            </label>
          </div>
        
          <div className="flex gap-4 items-center">
            <h3 className="font-semibold">Bulk Actions:</h3>
            <select 
              onChange={(e) => handleBulkChange('status', e.target.value)}
              className="rounded border-gray-300"
            >
              <option value="Present">All Present</option>
              <option value="Absent">All Absent</option>
              <option value="Late">All Late</option>
            </select>
            <select
              onChange={(e) => handleBulkChange('shift', e.target.value)}
              className="rounded border-gray-300"
            >
              <option value="Day">Day Shift</option>
              <option value="Night">Night Shift</option>
            </select>
            <input
              type="time"
              onChange={(e) => handleBulkChange('checkIn', e.target.value)}
              className="rounded border-gray-300"
              placeholder="Check In"
            />
            <input
              type="time"
              onChange={(e) => handleBulkChange('checkOut', e.target.value)}
              className="rounded border-gray-300"
              placeholder="Check Out"
            />
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Select</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employee</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Shift</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Check In</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Check Out</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">WFH</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {attendanceData.map((record, index) => (

                  <tr key={record.employeeId} 
                      className={!selectedEmployees[record.employeeId] ? 'opacity-50' : ''}>
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={selectedEmployees[record.employeeId] || false}
                        onChange={(e) => handleSelectEmployee(record.employeeId, e.target.checked)}
                        className="rounded border-gray-300"
                      />
                    </td>
                    <td className="px-6 py-4">{record.employeeName}</td>
                    <td className="px-6 py-4">
                      <select
                        value={record.status}
                        onChange={(e) => handleIndividualChange(index, 'status', e.target.value)}
                        className="rounded border-gray-300"
                      >
                        <option value="Present">Present</option>
                        <option value="Absent">Absent</option>
                        <option value="Late">Late</option>
                        <option value="On Leave">On Leave</option>
                      </select>
                    </td>
                    <td className="px-6 py-4">
                      <select
                        value={record.shift}
                        onChange={(e) => handleIndividualChange(index, 'shift', e.target.value)}
                        className="rounded border-gray-300"
                      >
                        <option value="Day">Day</option>
                        <option value="Night">Night</option>
                      </select>
                    </td>
                    <td className="px-6 py-4">
                      <input
                        type="time"
                        value={record.checkIn}
                        onChange={(e) => handleIndividualChange(index, 'checkIn', e.target.value)}
                        className="rounded border-gray-300"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <input
                        type="time"
                        value={record.checkOut}
                        onChange={(e) => handleIndividualChange(index, 'checkOut', e.target.value)}
                        className="rounded border-gray-300"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={record.workFromHome}
                        onChange={(e) => handleIndividualChange(index, 'workFromHome', e.target.checked)}
                        className="rounded border-gray-300"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-6 flex justify-between">
            <div className="text-sm text-gray-600">
              {Object.values(selectedEmployees).filter(Boolean).length} employees selected
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`px-4 py-2 text-white rounded ${
                isSubmitting 
                  ? 'bg-blue-400 cursor-not-allowed' 
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Selected Attendance'}
            </button>
          </div>
        </form>
      </div>
    );
  };

  export default QuickAttendanceForm;
