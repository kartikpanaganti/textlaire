import React, { useState, useEffect } from 'react';
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
import { Line, Bar, Pie, Doughnut } from 'react-chartjs-2';

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
  // State to track window width for responsive adjustments
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  
  // Effect to update window width on resize
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };
    
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);
  
  // Determine if we're on a small screen
  const isSmallScreen = windowWidth < 768;
  
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
    if (!activityStats || !activityStats.userRoles) return null;
    
    const roles = Object.keys(activityStats.userRoles);
    const counts = roles.map(role => activityStats.userRoles[role]);
    
    // Only return data if we have actual user roles
    if (roles.length === 0) return null;
    
    return {
      labels: roles.map(r => r.charAt(0).toUpperCase() + r.slice(1)),
      datasets: [
        {
          data: counts,
          backgroundColor: [
            'rgba(255, 99, 132, 0.7)',   // Red
            'rgba(54, 162, 235, 0.7)',   // Blue
            'rgba(255, 206, 86, 0.7)',   // Yellow
            'rgba(75, 192, 192, 0.7)',   // Green
            'rgba(153, 102, 255, 0.7)',  // Purple
          ],
          borderColor: [
            'rgba(255, 99, 132, 1)',
            'rgba(54, 162, 235, 1)',
            'rgba(255, 206, 86, 1)',
            'rgba(75, 192, 192, 1)',
            'rgba(153, 102, 255, 1)',
          ],
          borderWidth: 2,
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
        if (device.includes('Mobile')) {
          deviceCounts.Mobile++;
        } else if (device.includes('Tablet')) {
          deviceCounts.Tablet++;
        } else if (device.includes('Desktop')) {
          deviceCounts.Desktop++;
        } else {
          deviceCounts.Other++;
        }
      } else {
        deviceCounts.Other++;
      }
    });
    
    // Only return data types that have at least one entry
    const labels = [];
    const data = [];
    const backgroundColors = [];
    const borderColors = [];
    
    const colorMappings = {
      Desktop: {
        bg: 'rgba(54, 162, 235, 0.7)', 
        border: 'rgba(54, 162, 235, 1)'
      },
      Mobile: {
        bg: 'rgba(255, 99, 132, 0.7)',
        border: 'rgba(255, 99, 132, 1)'
      },
      Tablet: {
        bg: 'rgba(255, 206, 86, 0.7)',
        border: 'rgba(255, 206, 86, 1)'
      },
      Other: {
        bg: 'rgba(75, 192, 192, 0.7)',
        border: 'rgba(75, 192, 192, 1)'
      }
    };
    
    Object.entries(deviceCounts).forEach(([device, count]) => {
      if (count > 0) {
        labels.push(device);
        data.push(count);
        backgroundColors.push(colorMappings[device].bg);
        borderColors.push(colorMappings[device].border);
      }
    });
    
    // Only return data if we have at least one device type
    if (labels.length === 0) return null;
    
    return {
      labels,
      datasets: [
        {
          data,
          backgroundColor: backgroundColors,
          borderColor: borderColors,
          borderWidth: 2,
        },
      ],
    };
  };
  
  // Process data for daily login trends
  const prepareDailyLoginData = () => {
    if (!sessionHistory || sessionHistory.length === 0) return null;
    
    // Group sessions by day
    const dayMap = new Map();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Initialize last 7 days
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      dayMap.set(dateStr, 0);
    }
    
    // Count sessions for each day
    sessionHistory.forEach(session => {
      if (session.loginTime) {
        const loginDate = new Date(session.loginTime);
        
        // Check if login is within last 7 days
        if ((today - loginDate) / (1000 * 60 * 60 * 24) <= 7) {
          const dateStr = loginDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          dayMap.set(dateStr, (dayMap.get(dateStr) || 0) + 1);
        }
      }
    });
    
    // Make sure we have at least one day with non-zero data
    const hasData = Array.from(dayMap.values()).some(count => count > 0);
    if (!hasData) return null;
    
    return {
      labels: Array.from(dayMap.keys()),
      datasets: [
        {
          label: 'Daily Logins',
          data: Array.from(dayMap.values()),
          borderColor: 'rgba(75, 192, 192, 1)',
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          tension: 0.3,
          fill: true,
          pointBackgroundColor: 'rgba(75, 192, 192, 1)',
          pointRadius: 5,
          pointHoverRadius: 7,
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
    maintainAspectRatio: false,
    scales: {
      x: {
        title: {
          display: true,
          text: 'Hour of Day',
          font: {
            weight: 'bold',
            size: 14
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
            weight: 'bold',
            size: 14
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
        labels: {
          font: {
            size: 14
          }
        }
      },
      title: {
        display: true,
        text: 'Login Time Distribution',
        font: {
          size: 18,
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
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
        labels: {
          font: {
            size: 14
          }
        }
      },
      title: {
        display: true,
        text: 'User Role Distribution',
        font: {
          size: 18,
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
            const total = context.dataset.data.reduce((acc, val) => acc + val, 0);
            const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
            return `${label}: ${value} (${percentage}%)`;
          }
        }
      }
    },
  };
  
  const lineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        title: {
          display: true,
          text: 'Date',
          font: {
            weight: 'bold',
            size: 14
          }
        },
        ticks: {
          font: {
            size: 12
          }
        }
      },
      y: {
        title: {
          display: true,
          text: 'Number of Logins',
          font: {
            weight: 'bold',
            size: 14
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
        labels: {
          font: {
            size: 14
          }
        }
      },
      title: {
        display: true,
        text: 'Login Trends (Last 7 Days)',
        font: {
          size: 18,
          weight: 'bold'
        },
        padding: {
          bottom: 20
        }
      }
    },
  };
  
  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
        labels: {
          font: {
            size: 14
          }
        }
      },
      title: {
        display: true,
        text: 'Device Type Distribution',
        font: {
          size: 18,
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
            const total = context.dataset.data.reduce((acc, val) => acc + val, 0);
            const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
            return `${label}: ${value} (${percentage}%)`;
          }
        }
      }
    },
  };

  // Adjust options based on screen size
  const responsiveBarOptions = {
    ...barOptions,
    scales: {
      ...barOptions.scales,
      x: {
        ...barOptions.scales.x,
        ticks: {
          ...barOptions.scales.x.ticks,
          maxRotation: isSmallScreen ? 90 : 45,
          autoSkip: isSmallScreen,
          maxTicksLimit: isSmallScreen ? 12 : 24
        }
      }
    },
    plugins: {
      ...barOptions.plugins,
      legend: {
        ...barOptions.plugins.legend,
        display: !isSmallScreen
      },
      title: {
        ...barOptions.plugins.title,
        font: {
          ...barOptions.plugins.title.font,
          size: isSmallScreen ? 14 : 18
        }
      }
    }
  };
  
  const responsivePieOptions = {
    ...pieOptions,
    plugins: {
      ...pieOptions.plugins,
      legend: {
        ...pieOptions.plugins.legend,
        position: isSmallScreen ? 'bottom' : 'right',
        labels: {
          ...pieOptions.plugins.legend.labels,
          boxWidth: isSmallScreen ? 10 : 14,
          font: {
            ...pieOptions.plugins.legend.labels.font,
            size: isSmallScreen ? 12 : 14
          }
        }
      },
      title: {
        ...pieOptions.plugins.title,
        font: {
          ...pieOptions.plugins.title.font,
          size: isSmallScreen ? 14 : 18
        }
      }
    }
  };
  
  const responsiveLineOptions = {
    ...lineOptions,
    scales: {
      ...lineOptions.scales,
      x: {
        ...lineOptions.scales.x,
        ticks: {
          ...lineOptions.scales.x.ticks,
          maxRotation: isSmallScreen ? 45 : 0,
          autoSkip: isSmallScreen
        }
      }
    },
    plugins: {
      ...lineOptions.plugins,
      legend: {
        ...lineOptions.plugins.legend,
        display: !isSmallScreen
      },
      title: {
        ...lineOptions.plugins.title,
        font: {
          ...lineOptions.plugins.title.font,
          size: isSmallScreen ? 14 : 18
        }
      }
    }
  };
  
  const responsiveDoughnutOptions = {
    ...doughnutOptions,
    plugins: {
      ...doughnutOptions.plugins,
      legend: {
        ...doughnutOptions.plugins.legend,
        position: isSmallScreen ? 'bottom' : 'right',
        labels: {
          ...doughnutOptions.plugins.legend.labels,
          boxWidth: isSmallScreen ? 10 : 14,
          font: {
            ...doughnutOptions.plugins.legend.labels.font,
            size: isSmallScreen ? 12 : 14
          }
        }
      },
      title: {
        ...doughnutOptions.plugins.title,
        font: {
          ...doughnutOptions.plugins.title.font,
          size: isSmallScreen ? 14 : 18
        }
      }
    }
  };

  return (
    <div className="w-full h-full">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 h-full">
        {/* Login Trends Chart */}
        <div className="bg-white dark:bg-gray-900 p-4 md:p-6 rounded-lg shadow-inner min-h-[300px]">
          {dailyLoginData ? (
            <Line data={dailyLoginData} options={responsiveLineOptions} height={null} width={null} />
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-gray-500 dark:text-gray-400">No login trend data available</p>
            </div>
          )}
        </div>

        {/* Login Time Distribution Chart */}
        <div className="bg-white dark:bg-gray-900 p-4 md:p-6 rounded-lg shadow-inner min-h-[300px]">
          {loginTimeData ? (
            <Bar data={loginTimeData} options={responsiveBarOptions} height={null} width={null} />
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-gray-500 dark:text-gray-400">No login time data available</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ActivityDashboard;
