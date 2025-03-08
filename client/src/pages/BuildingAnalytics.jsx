import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaBuilding, FaTemperatureHigh, FaWater, FaBolt, FaChartLine } from "react-icons/fa";
import { MdAir, MdSecurity } from "react-icons/md";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
         LineChart, Line, PieChart, Pie, Cell } from "recharts";

function BuildingAnalytics() {
  const navigate = useNavigate();
  const [selectedTimeRange, setSelectedTimeRange] = useState("day");
  const [selectedBuilding, setSelectedBuilding] = useState("main");

  useEffect(() => {
    if (localStorage.getItem("isAuthenticated") !== "true") {
      navigate("/", { replace: true });
    }
  }, [navigate]);

  // Sample data for energy consumption
  const energyData = [
    { name: "00:00", main: 40, warehouse: 30, office: 10 },
    { name: "04:00", main: 30, warehouse: 25, office: 8 },
    { name: "08:00", main: 70, warehouse: 45, office: 20 },
    { name: "12:00", main: 90, warehouse: 60, office: 30 },
    { name: "16:00", main: 80, warehouse: 55, office: 25 },
    { name: "20:00", main: 50, warehouse: 40, office: 15 },
  ];

  // Sample data for temperature
  const temperatureData = [
    { name: "00:00", temperature: 22 },
    { name: "04:00", temperature: 21 },
    { name: "08:00", temperature: 23 },
    { name: "12:00", temperature: 25 },
    { name: "16:00", temperature: 24 },
    { name: "20:00", temperature: 23 },
  ];

  // Sample data for water usage
  const waterUsageData = [
    { name: "Production", value: 60 },
    { name: "Sanitation", value: 25 },
    { name: "Kitchen", value: 10 },
    { name: "Other", value: 5 },
  ];

  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"];

  // Sample building status data
  const buildingStatus = [
    { name: "Temperature", value: "24°C", icon: <FaTemperatureHigh />, status: "normal" },
    { name: "Air Quality", value: "Good", icon: <MdAir />, status: "normal" },
    { name: "Water Usage", value: "120L/h", icon: <FaWater />, status: "high" },
    { name: "Energy", value: "75kWh", icon: <FaBolt />, status: "normal" },
    { name: "Security", value: "All Clear", icon: <MdSecurity />, status: "normal" },
  ];

  return (
    <div className="flex flex-col space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center">
            <FaBuilding className="mr-2 text-blue-600" />
            Building Analytics
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Monitor and analyze building performance metrics
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 mt-4 md:mt-0">
          <select 
            className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={selectedBuilding}
            onChange={(e) => setSelectedBuilding(e.target.value)}
          >
            <option value="main">Main Building</option>
            <option value="warehouse">Warehouse</option>
            <option value="office">Office Building</option>
          </select>
          
          <select 
            className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={selectedTimeRange}
            onChange={(e) => setSelectedTimeRange(e.target.value)}
          >
            <option value="day">Last 24 Hours</option>
            <option value="week">Last Week</option>
            <option value="month">Last Month</option>
            <option value="year">Last Year</option>
          </select>
        </div>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {buildingStatus.map((item, index) => (
          <div 
            key={index} 
            className={`bg-white dark:bg-gray-800 rounded-xl shadow-md p-4 flex items-center
              ${item.status === 'high' ? 'border-l-4 border-orange-500' : 
                item.status === 'critical' ? 'border-l-4 border-red-500' : 
                'border-l-4 border-green-500'}`}
          >
            <div className={`p-3 rounded-full mr-4
              ${item.status === 'high' ? 'bg-orange-100 text-orange-500' : 
                item.status === 'critical' ? 'bg-red-100 text-red-500' : 
                'bg-green-100 text-green-500'}`}>
              {item.icon}
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">{item.name}</p>
              <p className="text-xl font-semibold">{item.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Energy Consumption Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <FaBolt className="mr-2 text-yellow-500" /> Energy Consumption
          </h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={energyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis label={{ value: 'kWh', angle: -90, position: 'insideLeft' }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="main" name="Main Building" fill="#0088FE" />
                <Bar dataKey="warehouse" name="Warehouse" fill="#00C49F" />
                <Bar dataKey="office" name="Office Building" fill="#FFBB28" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Temperature Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <FaTemperatureHigh className="mr-2 text-red-500" /> Temperature Monitoring
          </h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={temperatureData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis domain={[18, 28]} label={{ value: '°C', angle: -90, position: 'insideLeft' }} />
                <Tooltip />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="temperature" 
                  stroke="#FF8042" 
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 8 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Water Usage Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <FaWater className="mr-2 text-blue-500" /> Water Usage Distribution
          </h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={waterUsageData}
                  cx="50%"
                  cy="50%"
                  labelLine={true}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                  label={({name, percent}) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                  {waterUsageData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Efficiency Metrics */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <FaChartLine className="mr-2 text-purple-500" /> Efficiency Metrics
          </h2>
          <div className="space-y-6">
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-gray-700 dark:text-gray-300">Energy Efficiency</span>
                <span className="text-green-600 font-medium">85%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                <div className="bg-green-600 h-2.5 rounded-full" style={{ width: "85%" }}></div>
              </div>
            </div>
            
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-gray-700 dark:text-gray-300">Water Conservation</span>
                <span className="text-blue-600 font-medium">72%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: "72%" }}></div>
              </div>
            </div>
            
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-gray-700 dark:text-gray-300">HVAC Performance</span>
                <span className="text-yellow-500 font-medium">68%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                <div className="bg-yellow-500 h-2.5 rounded-full" style={{ width: "68%" }}></div>
              </div>
            </div>
            
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-gray-700 dark:text-gray-300">Lighting Efficiency</span>
                <span className="text-purple-600 font-medium">91%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                <div className="bg-purple-600 h-2.5 rounded-full" style={{ width: "91%" }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default BuildingAnalytics; 