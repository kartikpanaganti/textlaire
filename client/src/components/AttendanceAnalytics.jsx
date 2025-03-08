

// AttendanceAnalytics.jsx
import { useMemo } from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement } from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';

ChartJS.register(ArcElement, CategoryScale, LinearScale, BarElement, Tooltip, Legend);

const AttendanceAnalytics = ({ attendanceData }) => {
  const stats = useMemo(() => {
    const total = attendanceData.length;
    const present = attendanceData.filter(record => record.status === "Present").length;
    const absent = attendanceData.filter(record => record.status === "Absent").length;
    const late = attendanceData.filter(record => record.status === "Late").length;
    const onLeave = attendanceData.filter(record => record.status === "On Leave").length;
    const wfh = attendanceData.filter(record => record.workFromHome).length;

    return { total, present, absent, late, onLeave, wfh };
  }, [attendanceData]);

  const pieChartData = {
    labels: ['Present', 'Absent', 'Late', 'On Leave'],
    datasets: [{
      data: [stats.present, stats.absent, stats.late, stats.onLeave],
      backgroundColor: [
        'rgba(75, 192, 192, 0.6)',
        'rgba(255, 99, 132, 0.6)',
        'rgba(255, 206, 86, 0.6)',
        'rgba(153, 102, 255, 0.6)',
      ],
      borderColor: [
        'rgba(75, 192, 192, 1)',
        'rgba(255, 99, 132, 1)',
        'rgba(255, 206, 86, 1)',
        'rgba(153, 102, 255, 1)',
      ],
      borderWidth: 1,
    }],
  };

  const barChartData = {
    labels: ['Present', 'Absent', 'Late', 'On Leave'],
    datasets: [{
      label: 'Attendance Distribution',
      data: [stats.present, stats.absent, stats.late, stats.onLeave],
      backgroundColor: 'rgba(54, 162, 235, 0.6)',
      borderColor: 'rgba(54, 162, 235, 1)',
      borderWidth: 1,
    }],
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
        <div className="bg-white p-3 rounded-lg border border-gray-600 shadow-sm">
          <h3 className="text-xs text-gray-500 mb-1">Total</h3>
          <p className="text-lg font-bold text-gray-700">{stats.total}</p>
        </div>
        <div className="bg-white p-3 rounded-lg border border-green-400 shadow-sm">
          <h3 className="text-xs text-green-500 mb-1">Present</h3>
          <p className="text-lg font-bold text-green-500">{stats.present}</p>
        </div>
        <div className="bg-white p-3 rounded-lg border border-red-500 shadow-sm">
          <h3 className="text-xs text-red-500 mb-1">Absent</h3>
          <p className="text-lg font-bold text-red-500">{stats.absent}</p>
        </div>
        <div className="bg-white p-3 rounded-lg border border-yellow-600 shadow-sm">
          <h3 className="text-xs text-yellow-600 mb-1">Late</h3>
          <p className="text-lg font-bold text-yellow-700">{stats.late}</p>
        </div>
        <div className="bg-white p-3 rounded-lg border border-purple-600 shadow-sm">
          <h3 className="text-xs text-purple-600 mb-1">On Leave</h3>
          <p className="text-lg font-bold text-purple-700">{stats.onLeave}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
          <h3 className="text-sm font-semibold mb-3">Attendance Distribution</h3>
          <div className="h-48">
            <Pie 
              data={pieChartData} 
              options={{ 
                maintainAspectRatio: false,
                plugins: {
                  legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 12 } } }
                }
              }}
            />
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
          <h3 className="text-sm font-semibold mb-3">Attendance Overview</h3>
          <div className="h-48">
            <Bar
              data={barChartData}
              options={{
                maintainAspectRatio: false,
                scales: {
                  y: {
                    beginAtZero: true,
                    ticks: { stepSize: 1, font: { size: 10 } },
                    grid: { display: false }
                  },
                  x: {
                    ticks: { font: { size: 10 } },
                    grid: { display: false }
                  }
                },
                plugins: {
                  legend: { display: false }
                }
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AttendanceAnalytics;