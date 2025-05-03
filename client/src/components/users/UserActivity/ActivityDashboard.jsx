import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line, Bar, Pie } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const ActivityDashboard = ({ activityStats, sessionHistory }) => {
  // Process data for login time distribution chart
  const prepareLoginTimeData = () => {
    if (!sessionHistory || sessionHistory.length === 0) return null;
    
    // Initialize arrays for all 24 hours
    const hourCounts = Array(24).fill(0);
    const hourLabels = [];
    
    // Create hour labels in AM/PM format
    for (let i = 0; i < 24; i++) {
      const hour = i % 12 || 12; // Convert 0 to 12 for 12 AM
      const amPm = i < 12 ? 'AM' : 'PM';
      hourLabels.push(`${hour} ${amPm}`);
    }
    
    // Count logins per hour
    sessionHistory.forEach(session => {
      if (session.loginTime) {
        const hour = new Date(session.loginTime).getHours();
        hourCounts[hour]++;
      }
    });
    
    return {
      labels: hourLabels,
      datasets: [
        {
          label: 'Number of User Logins',
          data: hourCounts,
          backgroundColor: 'rgba(54, 162, 235, 0.5)',
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 1,
        },
      ],
    };
  };
  
  // Process data for user role distribution
  const prepareRoleDistributionData = () => {
    if (!activityStats || !activityStats.roleDistribution) return null;
    
    const roles = Object.keys(activityStats.roleDistribution);
    const counts = roles.map(role => activityStats.roleDistribution[role]);
    
    return {
      labels: roles.map(r => r.charAt(0).toUpperCase() + r.slice(1)),
      datasets: [
        {
          data: counts,
          backgroundColor: [
            'rgba(255, 99, 132, 0.7)',
            'rgba(54, 162, 235, 0.7)',
            'rgba(255, 206, 86, 0.7)',
            'rgba(75, 192, 192, 0.7)',
            'rgba(153, 102, 255, 0.7)',
          ],
          borderColor: [
            'rgba(255, 99, 132, 1)',
            'rgba(54, 162, 235, 1)',
            'rgba(255, 206, 86, 1)',
            'rgba(75, 192, 192, 1)',
            'rgba(153, 102, 255, 1)',
          ],
          borderWidth: 1,
        },
      ],
    };
  };
  
  // Process data for device type distribution chart
  const prepareDeviceTypeData = () => {
    if (!sessionHistory || sessionHistory.length === 0) return null;
    
    // Count devices by type
    const deviceCounts = {
      Desktop: 0,
      Mobile: 0,
      Tablet: 0,
      Other: 0
    };
    
    sessionHistory.forEach(session => {
      if (session.deviceInfo && session.deviceInfo.device) {
        const device = session.deviceInfo.device;
        if (deviceCounts.hasOwnProperty(device)) {
          deviceCounts[device]++;
        } else {
          deviceCounts.Other++;
        }
      }
    });
    
    return {
      labels: Object.keys(deviceCounts),
      datasets: [
        {
          data: Object.values(deviceCounts),
          backgroundColor: [
            'rgba(54, 162, 235, 0.7)', // Desktop - Blue
            'rgba(255, 99, 132, 0.7)',  // Mobile - Red
            'rgba(255, 206, 86, 0.7)',  // Tablet - Yellow
            'rgba(75, 192, 192, 0.7)',   // Other - Green
          ],
          borderColor: [
            'rgba(54, 162, 235, 1)',
            'rgba(255, 99, 132, 1)',
            'rgba(255, 206, 86, 1)',
            'rgba(75, 192, 192, 1)',
          ],
          borderWidth: 1,
        },
      ],
    };
  };
  
  // Process data for daily login trends
  const prepareDailyLoginData = () => {
    if (!activityStats || !activityStats.dailyLogins) return null;
    
    return {
      labels: activityStats.dailyLogins.map(day => day.date),
      datasets: [
        {
          label: 'Daily Logins',
          data: activityStats.dailyLogins.map(day => day.count),
          borderColor: 'rgba(75, 192, 192, 1)',
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          tension: 0.3,
          fill: true,
        },
      ],
    };
  };
  
  const loginTimeData = prepareLoginTimeData();
  const roleDistributionData = prepareRoleDistributionData();
  const dailyLoginData = prepareDailyLoginData();
  const deviceTypeData = prepareDeviceTypeData();
  
  // Options for charts
  const barOptions = {
    responsive: true,
    scales: {
      x: {
        title: {
          display: true,
          text: 'Hour of Day',
          font: {
            weight: 'bold'
          }
        },
        ticks: {
          maxRotation: 45,
          minRotation: 45,
          autoSkip: false,
          major: {
            enabled: true
          },
          font: function(context) {
            if (context.index % 2 === 0) {
              return {
                weight: 'bold'
              };
            }
            return {};
          }
        }
      },
      y: {
        title: {
          display: true,
          text: 'Number of Logins',
          font: {
            weight: 'bold'
          }
        },
        beginAtZero: true,
        ticks: {
          precision: 0
        }
      }
    },
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Login Time Distribution',
        font: {
          size: 16,
          weight: 'bold'
        },
        padding: {
          bottom: 20
        }
      },
      tooltip: {
        callbacks: {
          title: (tooltipItems) => {
            return `Hour: ${tooltipItems[0].label}`;
          },
          label: (context) => {
            return `Logins: ${context.parsed.y}`;
          }
        }
      }
    },
  };
  
  const pieOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'right',
      },
      title: {
        display: true,
        text: 'User Role Distribution',
        font: {
          size: 16,
          weight: 'bold'
        },
        padding: {
          bottom: 20
        }
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const label = context.label || '';
            const value = context.parsed || 0;
            const total = context.dataset.data.reduce((acc, data) => acc + data, 0);
            const percentage = ((value / total) * 100).toFixed(1);
            return `${label}: ${value} users (${percentage}%)`;
          }
        }
      }
    },
  };
  
  const deviceOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'right',
      },
      title: {
        display: true,
        text: 'Device Type Distribution',
        font: {
          size: 16,
          weight: 'bold'
        },
        padding: {
          bottom: 20
        }
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const label = context.label || '';
            const value = context.parsed || 0;
            const total = context.dataset.data.reduce((acc, data) => acc + data, 0);
            const percentage = ((value / total) * 100).toFixed(1);
            return `${label}: ${value} sessions (${percentage}%)`;
          }
        }
      }
    },
  };
  
  const lineOptions = {
    responsive: true,
    scales: {
      x: {
        title: {
          display: true,
          text: 'Date',
          font: {
            weight: 'bold'
          }
        }
      },
      y: {
        title: {
          display: true,
          text: 'Number of Logins',
          font: {
            weight: 'bold'
          }
        },
        beginAtZero: true,
        ticks: {
          precision: 0
        }
      }
    },
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Daily Login Trend (Last 7 Days)',
        font: {
          size: 16,
          weight: 'bold'
        },
        padding: {
          bottom: 20
        }
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            return `Logins: ${context.parsed.y}`;
          }
        }
      }
    }
  };
  
  return (
    <div className="space-y-8 mt-4 w-full max-w-full">
      <h2 className="text-xl font-semibold">Activity Analytics</h2>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full max-w-full">
        {/* Daily Login Trend */}
        {dailyLoginData && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-3 col-span-1 w-full max-w-full h-56">
            <Line data={dailyLoginData} options={{...lineOptions, maintainAspectRatio: true}} />
          </div>
        )}
        
        {/* Login Time Distribution */}
        {loginTimeData && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-3 col-span-1 w-full max-w-full h-56">
            <Bar data={loginTimeData} options={{...barOptions, maintainAspectRatio: true}} />
          </div>
        )}
        
        {/* Device Type Distribution */}
        {deviceTypeData && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-3 col-span-1 w-full max-w-full h-56">
            <div className="w-full h-full flex items-center justify-center">
              <Pie data={deviceTypeData} options={{...deviceOptions, maintainAspectRatio: true}} />
            </div>
          </div>
        )}
        
        {/* User Role Distribution */}
        {roleDistributionData && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-3 col-span-1 w-full max-w-full h-56">
            <div className="w-full h-full flex items-center justify-center">
              <Pie data={roleDistributionData} options={{...pieOptions, maintainAspectRatio: true}} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ActivityDashboard;
