import { useState, useEffect } from "react";
import { Chart as ChartJS } from "chart.js/auto";
import { Bar, Doughnut } from "react-chartjs-2";
import { FaUsers, FaClock, FaCalendarCheck, FaExclamationTriangle } from "react-icons/fa";

const AttendanceAnalytics = ({ attendanceData }) => {
  const [stats, setStats] = useState({
    present: 0,
    absent: 0,
    late: 0,
    onLeave: 0
  });

  useEffect(() => {
    calculateStats();
  }, [attendanceData]);

  const calculateStats = () => {
    const newStats = attendanceData.reduce((acc, record) => {
      acc[record.status.toLowerCase()]++;
      return acc;
    }, { present: 0, absent: 0, late: 0, onLeave: 0 });
    setStats(newStats);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
      <div className="bg-white p-6 rounded-lg shadow-lg">
        <h3 className="text-lg font-semibold mb-4">Attendance Overview</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-green-50 p-4 rounded-lg">
            <FaUsers className="text-green-500 text-xl mb-2" />
            <div className="text-2xl font-bold text-green-600">{stats.present}</div>
            <div className="text-sm text-green-600">Present</div>
          </div>
          <div className="bg-red-50 p-4 rounded-lg">
            <FaExclamationTriangle className="text-red-500 text-xl mb-2" />
            <div className="text-2xl font-bold text-red-600">{stats.absent}</div>
            <div className="text-sm text-red-600">Absent</div>
          </div>
          <div className="bg-yellow-50 p-4 rounded-lg">
            <FaClock className="text-yellow-500 text-xl mb-2" />
            <div className="text-2xl font-bold text-yellow-600">{stats.late}</div>
            <div className="text-sm text-yellow-600">Late</div>
          </div>
          <div className="bg-blue-50 p-4 rounded-lg">
            <FaCalendarCheck className="text-blue-500 text-xl mb-2" />
            <div className="text-2xl font-bold text-blue-600">{stats.onLeave}</div>
            <div className="text-sm text-blue-600">On Leave</div>
          </div>
        </div>
      </div>
      <div className="bg-white p-6 rounded-lg shadow-lg">
        <h3 className="text-lg font-semibold mb-4">Attendance Distribution</h3>
        <Doughnut 
          data={{
            labels: ['Present', 'Absent', 'Late', 'On Leave'],
            datasets: [{
              data: [stats.present, stats.absent, stats.late, stats.onLeave],
              backgroundColor: [
                'rgba(34, 197, 94, 0.5)',
                'rgba(239, 68, 68, 0.5)',
                'rgba(234, 179, 8, 0.5)',
                'rgba(59, 130, 246, 0.5)'
              ]
            }]
          }}
        />
      </div>
    </div>
  );
};

export default AttendanceAnalytics;
