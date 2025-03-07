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
      datasets: [
        {
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
        },
      ],
    };

    const barChartData = {
      labels: ['Present', 'Absent', 'Late','On Leave',],
      datasets: [
        {
          label: 'Attendance Distribution',
          data: [stats.present, stats.absent, stats.late,stats.onLeave,],
          backgroundColor: 'rgba(54, 162, 235, 0.6)',
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 1,
        },
      ],
    };

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-5 gap-4">
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-gray-500 text-sm">Total</h3>
            <p className="text-2xl font-bold">{stats.total}</p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg shadow">
            <h3 className="text-green-600 text-sm">Present</h3>
            <p className="text-2xl font-bold text-green-700">{stats.present}</p>
          </div>
          <div className="bg-red-50 p-4 rounded-lg shadow">
            <h3 className="text-red-600 text-sm">Absent</h3>
            <p className="text-2xl font-bold text-red-700">{stats.absent}</p>
          </div>
          <div className="bg-yellow-50 p-4 rounded-lg shadow">
            <h3 className="text-yellow-600 text-sm">Late</h3>
            <p className="text-2xl font-bold text-yellow-700">{stats.late}</p>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg shadow">
            <h3 className="text-purple-600 text-sm">On Leave</h3>
            <p className="text-2xl font-bold text-purple-700">{stats.onLeave}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-4">Attendance Distribution</h3>
            <Pie data={pieChartData} />
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-4">Attendance Overview</h3>
            <Bar 
              data={barChartData}
              options={{
                scales: {
                  y: {
                    beginAtZero: true,
                    ticks: {
                      stepSize: 1
                    }
                  }
                }
              }}
            />
          </div>
        </div>
      </div>
    );
  };

  export default AttendanceAnalytics;